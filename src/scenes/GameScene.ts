import Phaser from 'phaser';
import { TileMap } from '../grid/TileMap';
import { TileType } from '../grid/TileTypes';
import { Player } from '../entities/Player';
import { ChaserEnemy } from '../entities/ChaserEnemy';
import { PatrolEnemy } from '../entities/PatrolEnemy';
import { Enemy } from '../entities/Enemy';
import { ScoreManager } from '../systems/ScoreManager';
import { LevelManager, LevelConfig } from '../levels/LevelManager';
import {
  TILE_SIZE, GRID_COLS, GRID_ROWS,
  COLOR_DIRT, COLOR_EMPTY, COLOR_ROCK, COLOR_BORDER, COLOR_BAG,
  SCORE_BAG_CRUSH, SCORE_MONEY_BAG, STARTING_LIVES,
} from '../constants';

interface TileSprite {
  rect: Phaser.GameObjects.Rectangle;
  type: TileType;
}

export class GameScene extends Phaser.Scene {
  private tileMap!: TileMap;
  private tileSprites: TileSprite[][] = [];
  private player!: Player;
  private enemies: Enemy[] = [];
  private scoreManager!: ScoreManager;
  private levelManager!: LevelManager;
  private levelConfig!: LevelConfig;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private escKey!: Phaser.Input.Keyboard.Key;

  // HUD elements (inline for Session 1, moved to HUDScene in Session 3)
  private scoreText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private gemsText!: Phaser.GameObjects.Text;
  private levelLabel!: Phaser.GameObjects.Text;

  private totalGems = 0;
  private collectedGems = 0;
  private playerDeathHandled = false;
  private levelCompleted = false;
  // Enemies stay still until the digger takes its first step.
  private playerHasMoved = false;
  private playerSpawnCol = 0;
  private playerSpawnRow = 0;

  // Bags in flight (detached from the tile grid while falling)
  private fallingBags: Array<{
    rect: Phaser.GameObjects.Rectangle;
    label: Phaser.GameObjects.Text;
    col: number;
    row: number;
    timer: number;
  }> = [];
  private readonly FALL_STEP_MS = 110;
  private readonly JIGGLE_MS = 2000; // warning wobble before a bag drops

  // '$' labels for stationary bag tiles, keyed by "col,row"
  private bagLabels: Map<string, Phaser.GameObjects.Text> = new Map();
  // Active jiggle animations, keyed by "col,row"
  private jiggleData: Map<string, { tween: Phaser.Tweens.Tween; timer: Phaser.Time.TimerEvent }> = new Map();
  // Bags that have fallen and may now be scooped for money, keyed by "col,row".
  // Bags resting in their original spots are obstacles until undermined.
  private collectibleBags: Set<string> = new Set();
  // Diamond gem sprites overlaid on GEM tiles, keyed by "col,row"
  private gemSprites: Map<string, Phaser.GameObjects.Image> = new Map();

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { world?: number; level?: number }): void {
    this.levelManager = new LevelManager();
    const world = data.world ?? 1;
    const level = data.level ?? 1;
    this.levelConfig = this.levelManager.getLevel(world, level);
    this.scoreManager = new ScoreManager(STARTING_LIVES, () => this.showExtraLife());
    this.playerDeathHandled = false;
    this.levelCompleted = false;
    this.playerHasMoved = false;
    this.fallingBags = [];
    this.bagLabels = new Map();
    this.jiggleData = new Map();
    this.collectibleBags = new Set();
    this.gemSprites = new Map();
    this.enemies = [];
    this.tileSprites = [];
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#111111');
    this.tileMap = new TileMap(GRID_COLS, GRID_ROWS);
    this.tileMap.loadFromArray(this.levelConfig.gridData);
    this.carvePreDugTunnels();

    this.buildTileSprites();
    this.countGems();
    this.spawnPlayer();
    this.spawnEnemies();
    this.buildHUD();

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    // Prevent arrow key scrolling
    this.input.keyboard!.disableGlobalCapture();
  }

  private buildTileSprites(): void {
    for (let r = 0; r < GRID_ROWS; r++) {
      this.tileSprites[r] = [];
      for (let c = 0; c < GRID_COLS; c++) {
        const type = this.tileMap.get(c, r);
        const color = tileColor(type);
        const px = c * TILE_SIZE + TILE_SIZE / 2;
        const py = r * TILE_SIZE + TILE_SIZE / 2;
        const rect = this.add.rectangle(px, py, TILE_SIZE, TILE_SIZE, color);
        rect.setDepth(0);
        this.tileSprites[r][c] = { rect, type };

        // Gem inner detail
        if (type === TileType.GEM) {
          this.syncGemSprite(c, r);
        }
        // Bag label (tracked so it can move/clear as bags fall or are scooped)
        if (type === TileType.BAG) {
          this.syncBagLabel(c, r);
        }
        // Grid lines for DIRT
        if (type === TileType.DIRT) {
          this.add.rectangle(px, py, TILE_SIZE - 1, TILE_SIZE - 1, 0x000000, 0).setStrokeStyle(0.5, 0x7A4E2C, 0.3).setDepth(1);
        }
      }
    }
  }

  private countGems(): void {
    this.totalGems = 0;
    this.collectedGems = 0;
    for (let r = 0; r < GRID_ROWS; r++)
      for (let c = 0; c < GRID_COLS; c++)
        if (this.tileMap.get(c, r) === TileType.GEM) this.totalGems++;
  }

  /**
   * Pre-dig a random starter tunnel network rooted at every enemy spawn so
   * the bad guys can move around immediately. The walker only carves DIRT —
   * money bags, gems, rocks, and borders are obstacles it routes around,
   * never over. A tile is also skipped if removing it would pull the floor
   * out from under a resting bag.
   *
   * The first SPAWN tile in scan order is treated as the player's; every
   * other SPAWN seeds an independent walk so each enemy gets its own
   * connected pocket of tunnels.
   */
  private carvePreDugTunnels(): void {
    const spawns: Array<{ col: number; row: number }> = [];
    for (let r = 0; r < GRID_ROWS; r++)
      for (let c = 0; c < GRID_COLS; c++)
        if (this.tileMap.get(c, r) === TileType.SPAWN)
          spawns.push({ col: c, row: r });
    if (spawns.length === 0) return;

    // Player gets the first spawn; the rest are enemy roots.
    const enemySpawns = spawns.length > 1 ? spawns.slice(1) : spawns;

    for (const root of enemySpawns) {
      // Aim for ~25–45 carved tiles per enemy, randomised each level.
      const target = 25 + Math.floor(Math.random() * 21);
      this.randomWalkCarve(root.col, root.row, target);
    }
  }

  /** Drunkard's-walk carve: grows a connected tunnel pocket from (col,row). */
  private randomWalkCarve(startCol: number, startRow: number, target: number): void {
    const DIRS: Array<[number, number]> = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    // Frontier = positions adjacent to dirt we might still carve from. The
    // spawn itself becomes EMPTY when the enemy spawns, so we seed with it.
    const frontier: Array<{ col: number; row: number }> = [{ col: startCol, row: startRow }];
    let carved = 0;

    while (frontier.length > 0 && carved < target) {
      // 70% bias to the most recently carved tile — produces winding tunnels
      // with occasional branches when we pick from older spots.
      const idx = Math.random() < 0.7
        ? frontier.length - 1
        : Math.floor(Math.random() * frontier.length);
      const pos = frontier[idx];

      const dirs = this.shuffled(DIRS);
      let stepped = false;
      for (const [dc, dr] of dirs) {
        const nc = pos.col + dc;
        const nr = pos.row + dr;
        if (this.tryCarveTunnel(nc, nr)) {
          frontier.push({ col: nc, row: nr });
          carved++;
          stepped = true;
          break;
        }
      }
      if (!stepped) {
        // No diggable neighbour from this tile — retire it from the frontier.
        frontier.splice(idx, 1);
      }
    }
  }

  /**
   * Carve (col,row) to EMPTY iff it's DIRT and doing so won't drop a bag.
   * Returns true on success. Bags, gems, rocks, borders, and already-empty
   * tiles all fail — the walker treats them as walls and routes around them.
   */
  private tryCarveTunnel(col: number, row: number): boolean {
    if (this.tileMap.get(col, row) !== TileType.DIRT) return false;
    if (this.tileMap.get(col, row - 1) === TileType.BAG) return false;
    this.tileMap.set(col, row, TileType.EMPTY);
    return true;
  }

  private shuffled<T>(arr: ReadonlyArray<T>): T[] {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  private spawnPlayer(): void {
    // Find first SPAWN tile or default to (1,1)
    let startCol = 1, startRow = 1;
    outer: for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        if (this.tileMap.get(c, r) === TileType.SPAWN) {
          startCol = c;
          startRow = r;
          this.tileMap.set(c, r, TileType.EMPTY);
          this.refreshTile(c, r);
          break outer;
        }
      }
    }

    this.player = new Player(this, startCol, startRow, this.tileMap, {
      onDig: (c, r) => this.onDig(c, r),
      onGemCollect: (c, r, pts) => this.onGemCollect(c, r, pts),
      onBagTouch: (c, r) => this.onBagTouch(c, r),
      onDeath: () => this.onPlayerDeath(),
      onCheckLevelComplete: () => this.checkLevelComplete(),
    });
    this.playerSpawnCol = this.player.col;
    this.playerSpawnRow = this.player.row;
  }

  private spawnEnemies(): void {
    const spawnTiles: Array<{ col: number; row: number }> = [];
    for (let r = 0; r < GRID_ROWS; r++)
      for (let c = 0; c < GRID_COLS; c++)
        if (this.tileMap.get(c, r) === TileType.SPAWN) spawnTiles.push({ col: c, row: r });

    for (let i = 0; i < this.levelConfig.enemyCount && i < spawnTiles.length; i++) {
      const spawn = spawnTiles[i];
      this.tileMap.set(spawn.col, spawn.row, TileType.EMPTY);
      this.refreshTile(spawn.col, spawn.row);
      const enemy = i % 2 === 0
        ? new ChaserEnemy(this, spawn.col, spawn.row, this.tileMap)
        : new PatrolEnemy(this, spawn.col, spawn.row, this.tileMap, spawn.col < 10 ? 1 : -1, 0);
      this.enemies.push(enemy);
    }
  }

  private buildHUD(): void {
    const hudBg = this.add.rectangle(GRID_COLS * TILE_SIZE / 2, 8, GRID_COLS * TILE_SIZE, 20, 0x000000, 0.7);
    hudBg.setDepth(50);

    this.scoreText = this.add.text(8, 2, 'SCORE: 0', { fontSize: '13px', color: '#FFdd00', fontFamily: 'monospace' }).setDepth(51);
    this.livesText = this.add.text(180, 2, 'LIVES: 3', { fontSize: '13px', color: '#FF4444', fontFamily: 'monospace' }).setDepth(51);
    this.gemsText  = this.add.text(340, 2, 'GEMS: 0/0', { fontSize: '13px', color: '#00DD66', fontFamily: 'monospace' }).setDepth(51);
    this.levelLabel = this.add.text(500, 2, `W${this.levelConfig.world}-${this.levelConfig.level}`, { fontSize: '13px', color: '#AAAAAA', fontFamily: 'monospace' }).setDepth(51);
    void this.levelLabel; // referenced via scene HUD, not updated dynamically

    this.updateHUD();
  }

  private updateHUD(): void {
    this.scoreText.setText(`SCORE: ${this.scoreManager.getScore()}`);
    this.livesText.setText(`LIVES: ${this.scoreManager.getLives()}`);
    this.gemsText.setText(`GEMS: ${this.collectedGems}/${this.totalGems}`);
  }

  update(_time: number, delta: number): void {
    if (this.levelCompleted || this.playerDeathHandled) return;

    if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this.scene.pause();
      this.scene.launch('PauseScene');
      return;
    }

    this.player.update(delta, this.cursors);

    // Enemies hold position until the digger takes its first real step.
    if (!this.playerHasMoved &&
        (this.player.col !== this.playerSpawnCol || this.player.row !== this.playerSpawnRow)) {
      this.playerHasMoved = true;
    }

    if (this.playerHasMoved) {
      for (const e of this.enemies) {
        if (e.alive) e.update(delta, this.player.col, this.player.row);
      }
    }

    this.stepFallingBags(delta);
    this.checkEnemyCollisions();
  }

  private onDig(col: number, row: number): void {
    this.refreshTile(col, row);
    // Check if any bag above just lost support
    this.checkBagGravity(col, row);
  }

  private onGemCollect(col: number, row: number, points: number): void {
    this.scoreManager.add(points);
    this.collectedGems++;
    this.refreshTile(col, row);
    this.updateHUD();

    // Sparkle effect
    const px = col * TILE_SIZE + TILE_SIZE / 2;
    const py = row * TILE_SIZE + TILE_SIZE / 2;
    this.tweens.add({
      targets: this.add.circle(px, py, 8, 0xFFFFFF, 0.8).setDepth(20),
      scaleX: 3, scaleY: 3, alpha: 0,
      duration: 250,
      onComplete: (_, targets) => (targets as Phaser.GameObjects.Arc[]).forEach(t => t.destroy()),
    });
  }

  private refreshTile(col: number, row: number): void {
    const type = this.tileMap.get(col, row);
    const ts = this.tileSprites[row]?.[col];
    if (!ts) return;
    ts.type = type;
    ts.rect.setFillStyle(tileColor(type));
    this.syncBagLabel(col, row);
    this.syncGemSprite(col, row);
  }

  /** Ensure a diamond sprite is shown on GEM tiles and removed otherwise. */
  private syncGemSprite(col: number, row: number): void {
    const key = `${col},${row}`;
    const isGem = this.tileMap.get(col, row) === TileType.GEM;
    const existing = this.gemSprites.get(key);
    if (isGem && !existing) {
      const px = col * TILE_SIZE + TILE_SIZE / 2;
      const py = row * TILE_SIZE + TILE_SIZE / 2;
      const gem = this.add.image(px, py, 'gem').setDepth(3);
      gem.setDisplaySize(TILE_SIZE - 8, TILE_SIZE - 8);
      this.gemSprites.set(key, gem);
    } else if (!isGem && existing) {
      existing.destroy();
      this.gemSprites.delete(key);
    }
  }

  /** Ensure the '$' label presence at a tile matches whether it holds a BAG. */
  private syncBagLabel(col: number, row: number): void {
    const key = `${col},${row}`;
    const isBag = this.tileMap.get(col, row) === TileType.BAG;
    const existing = this.bagLabels.get(key);
    if (isBag && !existing) {
      const px = col * TILE_SIZE + TILE_SIZE / 2;
      const py = row * TILE_SIZE + TILE_SIZE / 2;
      const label = this.add.text(px - 5, py - 7, '$', {
        fontSize: '14px', color: '#000', fontFamily: 'monospace',
      }).setDepth(2);
      this.bagLabels.set(key, label);
    } else if (!isBag && existing) {
      existing.destroy();
      this.bagLabels.delete(key);
    }
  }

  private checkBagGravity(col: number, row: number): void {
    // If the tile directly above is a BAG that just lost its support, jiggle it.
    const aboveRow = row - 1;
    if (aboveRow >= 0 && this.tileMap.get(col, aboveRow) === TileType.BAG) {
      this.startJiggle(col, aboveRow);
    }
  }

  /** Wobble a bag in place for JIGGLE_MS as a warning, then let it fall. */
  private startJiggle(col: number, row: number): void {
    const key = `${col},${row}`;
    if (this.jiggleData.has(key)) return; // already jiggling

    const ts = this.tileSprites[row]?.[col];
    const label = this.bagLabels.get(key);
    const targets = [ts?.rect, label].filter(Boolean) as Phaser.GameObjects.GameObject[];

    const tween = this.tweens.add({
      targets,
      angle: { from: -7, to: 7 },
      duration: 70,
      yoyo: true,
      repeat: -1,
    });

    const timer = this.time.delayedCall(this.JIGGLE_MS, () => {
      this.stopJiggle(col, row);
      this.beginFall(col, row);
    });

    this.jiggleData.set(key, { tween, timer });
  }

  /** Cancel a bag's jiggle animation and reset its angle. */
  private stopJiggle(col: number, row: number): void {
    const key = `${col},${row}`;
    const data = this.jiggleData.get(key);
    if (!data) return;
    data.tween.stop();
    data.timer.remove(false);
    this.jiggleData.delete(key);

    const ts = this.tileSprites[row]?.[col];
    if (ts) ts.rect.setAngle(0);
    const label = this.bagLabels.get(key);
    if (label) label.setAngle(0);
  }

  /** Detach a settled BAG from the grid and start it falling. */
  private beginFall(col: number, row: number): void {
    if (this.tileMap.get(col, row) !== TileType.BAG) return; // scooped/changed meanwhile

    this.collectibleBags.delete(`${col},${row}`); // leaving this tile
    this.tileMap.set(col, row, TileType.EMPTY);
    this.refreshTile(col, row); // clears the gold tile + its label

    const px = col * TILE_SIZE + TILE_SIZE / 2;
    const py = row * TILE_SIZE + TILE_SIZE / 2;
    const rect = this.add.rectangle(px, py, TILE_SIZE - 4, TILE_SIZE - 4, COLOR_BAG).setDepth(7);
    const label = this.add.text(px - 5, py - 7, '$', {
      fontSize: '14px', color: '#000', fontFamily: 'monospace',
    }).setDepth(8);
    this.fallingBags.push({ rect, label, col, row, timer: 0 });
  }

  private stepFallingBags(delta: number): void {
    const toRemove: number[] = [];

    for (let i = 0; i < this.fallingBags.length; i++) {
      const bag = this.fallingBags[i];
      bag.timer += delta;
      if (bag.timer < this.FALL_STEP_MS) continue;
      bag.timer = 0;

      const nextRow = bag.row + 1;
      const below = this.tileMap.get(bag.col, nextRow);

      if (below === TileType.EMPTY || below === TileType.SPAWN) {
        // Move down one tile and check what it crushes on the way.
        bag.row = nextRow;
        const px = bag.col * TILE_SIZE + TILE_SIZE / 2;
        const py = bag.row * TILE_SIZE + TILE_SIZE / 2;
        bag.rect.setPosition(px, py);
        bag.label.setPosition(px - 5, py - 7);
        this.crushAt(bag.col, bag.row);
      } else {
        // Settle: become a stationary bag that can now be scooped for money.
        this.tileMap.set(bag.col, bag.row, TileType.BAG);
        this.collectibleBags.add(`${bag.col},${bag.row}`);
        this.refreshTile(bag.col, bag.row);
        bag.rect.destroy();
        bag.label.destroy();
        toRemove.push(i);

        this.crushAt(bag.col, bag.row);          // catch anything in the resting tile
        this.checkBagGravity(bag.col, bag.row);  // chain: support for a bag above?
        this.cameras.main.shake(120, 0.006);
      }
    }

    for (let i = toRemove.length - 1; i >= 0; i--) {
      this.fallingBags.splice(toRemove[i], 1);
    }
  }

  /** Resolve a falling bag entering a tile: kill the player, crush enemies. */
  private crushAt(col: number, row: number): void {
    if (this.player.alive && this.player.col === col && this.player.row === row) {
      this.player.kill();
    }
    for (const e of this.enemies) {
      if (e.alive && e.col === col && e.row === row) {
        e.kill();
        this.scoreManager.add(SCORE_BAG_CRUSH);
        this.updateHUD();
        this.explodeAt(col, row);
      }
    }
  }

  /**
   * Procedural explosion VFX tuned to match the chunky pixel reference art:
   * a bright white-hot core, golden fire flecks, brown/amber debris cubes
   * flung outward with rotation, and grey-cream smoke clouds drifting up.
   * Placeholder until the spritesheet is wired in; reusable for the digger.
   */
  private explodeAt(col: number, row: number): void {
    const px = col * TILE_SIZE + TILE_SIZE / 2;
    const py = row * TILE_SIZE + TILE_SIZE / 2;

    // --- Layered core: white-hot square, yellow ring, orange halo ---
    const whiteHot = this.add.rectangle(px, py, 16, 16, 0xfff9d0, 1).setDepth(28);
    this.tweens.add({
      targets: whiteHot,
      scaleX: 2.4, scaleY: 2.4, alpha: 0,
      duration: 320, ease: 'Quad.easeOut',
      onComplete: () => whiteHot.destroy(),
    });
    const yellow = this.add.circle(px, py, 12, 0xffd233, 1).setDepth(27);
    this.tweens.add({
      targets: yellow,
      scale: 3.2, alpha: 0,
      duration: 440, ease: 'Quad.easeOut',
      onComplete: () => yellow.destroy(),
    });
    const orange = this.add.circle(px, py, 9, 0xff7722, 0.9).setDepth(26);
    this.tweens.add({
      targets: orange,
      scale: 4.2, alpha: 0,
      duration: 540, ease: 'Quad.easeOut',
      onComplete: () => orange.destroy(),
    });

    // --- Golden fire flecks: small bright cubes near the center ---
    const FIRE = [0xfff2a8, 0xffe066, 0xffb030, 0xff8819];
    for (let i = 0; i < 22; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 14 + Math.random() * 30;
      const color = FIRE[Math.floor(Math.random() * FIRE.length)];
      const size = 2 + Math.floor(Math.random() * 3);
      const fleck = this.add.rectangle(px, py, size, size, color).setDepth(27);
      this.tweens.add({
        targets: fleck,
        x: px + Math.cos(angle) * dist,
        y: py + Math.sin(angle) * dist,
        alpha: 0,
        duration: 380 + Math.random() * 240,
        ease: 'Quad.easeOut',
        onComplete: () => fleck.destroy(),
      });
    }

    // --- Brown/amber debris cubes flung outward with rotation ---
    const DEBRIS = [0x8a5a2a, 0xa6743d, 0x5d3a18, 0xc99560, 0x6e4622];
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 30 + Math.random() * 42;
      const color = DEBRIS[Math.floor(Math.random() * DEBRIS.length)];
      const size = 4 + Math.floor(Math.random() * 3);
      const chunk = this.add.rectangle(px, py, size, size, color).setDepth(26);
      this.tweens.add({
        targets: chunk,
        x: px + Math.cos(angle) * dist,
        y: py + Math.sin(angle) * dist,
        angle: (Math.random() * 540) - 270,
        duration: 520 + Math.random() * 280,
        ease: 'Quad.easeOut',
        onComplete: () => {
          this.tweens.add({
            targets: chunk, alpha: 0, duration: 180,
            onComplete: () => chunk.destroy(),
          });
        },
      });
    }

    // --- Grey/cream smoke clouds, biased upward and outward ---
    const SMOKE = [0xe0dccf, 0xc5bfae, 0xa9a294, 0x807a6a];
    for (let i = 0; i < 14; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 12 + Math.random() * 28;
      const color = SMOKE[Math.floor(Math.random() * SMOKE.length)];
      const size = 5 + Math.floor(Math.random() * 4);
      const puff = this.add.rectangle(px, py, size, size, color, 0.85).setDepth(25);
      this.tweens.add({
        targets: puff,
        x: px + Math.cos(angle) * dist + (Math.random() - 0.5) * 8,
        y: py + Math.sin(angle) * dist - 16 - Math.random() * 12, // drift up
        scaleX: 1.7, scaleY: 1.7,
        alpha: 0,
        duration: 720 + Math.random() * 240,
        ease: 'Quad.easeOut',
        onComplete: () => puff.destroy(),
      });
    }

    this.cameras.main.shake(220, 0.01);
  }

  /**
   * Player tried to walk into a bag. Only bags that have already jiggled
   * and fallen are collectible; resting bags are solid obstacles.
   * Returns true if the bag was scooped (player may enter the tile).
   */
  private onBagTouch(col: number, row: number): boolean {
    const key = `${col},${row}`;
    if (!this.collectibleBags.has(key)) return false; // hasn't fallen yet — blocked

    this.collectibleBags.delete(key);
    this.tileMap.set(col, row, TileType.EMPTY);
    this.refreshTile(col, row); // clears gold + label
    this.scoreManager.add(SCORE_MONEY_BAG);
    this.updateHUD();

    const px = col * TILE_SIZE + TILE_SIZE / 2;
    const py = row * TILE_SIZE + TILE_SIZE / 2;
    const popup = this.add.text(px, py, `+${SCORE_MONEY_BAG}`, {
      fontSize: '14px', color: '#FFdd00', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(20);
    this.tweens.add({
      targets: popup, y: py - 24, alpha: 0, duration: 600,
      onComplete: () => popup.destroy(),
    });
    return true;
  }

  private checkEnemyCollisions(): void {
    for (const e of this.enemies) {
      if (!e.alive) continue;
      if (e.col === this.player.col && e.row === this.player.row) {
        this.player.kill();
        return;
      }
    }
  }

  private onPlayerDeath(): void {
    if (this.playerDeathHandled) return;
    this.playerDeathHandled = true;

    this.cameras.main.shake(300, 0.02);

    this.time.delayedCall(600, () => {
      const hasLives = this.scoreManager.loseLife();
      if (hasLives && this.scoreManager.getLives() >= 0) {
        // Respawn — re-freeze the enemies until the digger moves again.
        this.playerDeathHandled = false;
        this.player.respawn(1, 1);
        this.playerSpawnCol = this.player.col;
        this.playerSpawnRow = this.player.row;
        this.playerHasMoved = false;
      } else {
        this.scene.start('GameOverScene', {
          score: this.scoreManager.getScore(),
          world: this.levelConfig.world,
          level: this.levelConfig.level,
        });
      }
    });
  }

  private checkLevelComplete(): void {
    if (this.collectedGems >= this.totalGems && !this.levelCompleted) {
      this.levelCompleted = true;
      this.levelManager.completeLevel(this.levelConfig.world, this.levelConfig.level, this.scoreManager.getScore());
      this.time.delayedCall(500, () => {
        this.scene.start('LevelCompleteScene', {
          score: this.scoreManager.getScore(),
          world: this.levelConfig.world,
          level: this.levelConfig.level,
          gemsCollected: this.collectedGems,
          totalGems: this.totalGems,
        });
      });
    }
  }

  private showExtraLife(): void {
    const text = this.add.text(TILE_SIZE * GRID_COLS / 2, TILE_SIZE * GRID_ROWS / 2, '+1 UP!', {
      fontSize: '28px', color: '#FF88FF', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(60);
    this.tweens.add({
      targets: text, y: text.y - 60, alpha: 0, duration: 1500,
      onComplete: () => text.destroy(),
    });
  }
}

function tileColor(type: TileType): number {
  switch (type) {
    case TileType.DIRT:    return COLOR_DIRT;
    case TileType.GEM:     return 0x0e1a18; // dark pocket behind the diamond sprite
    case TileType.ROCK:    return COLOR_ROCK;
    case TileType.BORDER:  return COLOR_BORDER;
    case TileType.BAG:     return COLOR_BAG;
    case TileType.HAZARD:  return 0xFF4400;
    case TileType.SPAWN:   return 0x224422;
    case TileType.ARTIFACT: return 0xFF88FF;
    case TileType.EMPTY:
    default:               return COLOR_EMPTY;
  }
}
