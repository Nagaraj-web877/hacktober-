import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  playSlashSound,
  playHitSound,
  playCoinSound,
  playLevelUpSound,
  playDefeatSound,
  toggleMute,
  getMuteState,
} from '../../utils/audio';
import { calculateFloorExtractionBonus } from '../../game/economy';

interface ShadowDungeonGameProps {
  onBackToHub: () => void;
  onRewardEarned: (credits: number, xp: number, reason: string) => void;
}

type GameState = 'title' | 'playing' | 'paused' | 'gameover';

// Particle pool ring buffer for zero garbage collection
interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

const PARTICLE_POOL_SIZE = 120;

export const ShadowDungeonGame: React.FC<ShadowDungeonGameProps> = ({
  onBackToHub,
  onRewardEarned,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [gameState, setGameState] = useState<GameState>('title');
  const [hudStats, setHudStats] = useState({
    hp: 100,
    maxHp: 100,
    mana: 100,
    maxMana: 100,
    score: 0,
    floor: 1,
    combo: 0,
    enemiesLeft: 8,
  });

  const [endStats, setEndStats] = useState({
    won: false,
    score: 0,
    floor: 1,
    monstersDefeated: 0,
    creditsEarned: 0,
    xpEarned: 0,
    flawless: false,
  });

  const [isMuted, setIsMuted] = useState(getMuteState());

  // Mutable refs for high-frequency 60fps simulation
  const gameRef = useRef({
    state: 'title' as GameState,
    player: {
      x: 400,
      y: 300,
      vx: 0,
      vy: 0,
      speed: 260,
      size: 18,
      hp: 100,
      maxHp: 100,
      mana: 100,
      maxMana: 100,
      dashCooldown: 0,
      attackCooldown: 0,
      invulnTime: 0,
      facing: 0, // angle
      damageTakenThisRun: 0,
    },
    enemies: [] as Array<{
      id: number;
      type: 'swarmer' | 'caster' | 'golem';
      x: number;
      y: number;
      vx: number;
      vy: number;
      hp: number;
      maxHp: number;
      size: number;
      color: string;
      speed: number;
      telegraphTime: number;
      telegraphMax: number;
      attackCooldown: number;
      shootAngle?: number;
    }>,
    projectiles: [] as Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      fromPlayer: boolean;
      damage: number;
      life: number;
    }>,
    particles: [] as Particle[],
    particleIndex: 0,
    keysHeld: new Set<string>(),
    keysJustPressed: new Set<string>(),
    mousePos: { x: 400, y: 300 },
    mouseDown: false,
    hitstop: 0,
    cameraShake: 0,
    score: 0,
    combo: 0,
    comboTimer: 0,
    monstersDefeated: 0,
    floor: 1,
    totalTargetEnemies: 8,
    lastFrameTime: performance.now(),
  });

  // Handle mute toggle
  const handleToggleMute = useCallback(() => {
    const muted = toggleMute();
    setIsMuted(muted);
  }, []);

  // Sync state to body dataset
  useEffect(() => {
    document.body.dataset.state = gameState;
    gameRef.current.state = gameState;
  }, [gameState]);

  // Autostart query check
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') {
        startGame();
      }
    }
  }, []);

  // Spawn a wave of enemies with 3 distinct archetypes
  const spawnFloorEnemies = useCallback((floor: number) => {
    const enemies = [];
    const count = 5 + floor * 2;
    gameRef.current.totalTargetEnemies = count;
    const canvas = canvasRef.current;
    const cx = canvas ? canvas.width / 2 : window.innerWidth / 2;
    const cy = canvas ? canvas.height / 2 : window.innerHeight / 2;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.3;
      // Spawn at outer perimeter so player survives easily without immediate input
      const dist = Math.min(window.innerWidth, window.innerHeight) * 0.45 + 100 + Math.random() * 120;
      const ex = cx + Math.cos(angle) * dist;
      const ey = cy + Math.sin(angle) * dist;

      // 3 Archetypes
      const r = Math.random();
      if (r < 0.45) {
        // Swarmer Larva: fast, zig-zag, low hp
        enemies.push({
          id: Math.random(),
          type: 'swarmer' as const,
          x: ex,
          y: ey,
          vx: 0,
          vy: 0,
          hp: 20 + floor * 5,
          maxHp: 20 + floor * 5,
          size: 14,
          color: '#c084fc',
          speed: 130 + floor * 8,
          telegraphTime: 0,
          telegraphMax: 0,
          attackCooldown: 0,
        });
      } else if (r < 0.8) {
        // Void Caster: stays at range, charges visible laser beam telegraph
        enemies.push({
          id: Math.random(),
          type: 'caster' as const,
          x: ex,
          y: ey,
          vx: 0,
          vy: 0,
          hp: 35 + floor * 8,
          maxHp: 35 + floor * 8,
          size: 20,
          color: '#38bdf8',
          speed: 75,
          telegraphTime: 0,
          telegraphMax: 0.9,
          attackCooldown: 2.5 + Math.random() * 1.5,
        });
      } else {
        // Titan Golem: tanky, charges ground smash ring
        enemies.push({
          id: Math.random(),
          type: 'golem' as const,
          x: ex,
          y: ey,
          vx: 0,
          vy: 0,
          hp: 80 + floor * 20,
          maxHp: 80 + floor * 20,
          size: 28,
          color: '#f43f5e',
          speed: 50,
          telegraphTime: 0,
          telegraphMax: 1.0,
          attackCooldown: 3.0 + Math.random() * 1.0,
        });
      }
    }
    gameRef.current.enemies = enemies;
  }, []);

  const spawnParticles = (x: number, y: number, color: string, count: number, speed = 120) => {
    const { particles } = gameRef.current;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = (Math.random() * 0.7 + 0.3) * speed;
      const idx = gameRef.current.particleIndex % PARTICLE_POOL_SIZE;
      particles[idx] = {
        active: true,
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: 0.35 + Math.random() * 0.25,
        maxLife: 0.35 + Math.random() * 0.25,
        color,
        size: 3 + Math.random() * 3,
      };
      gameRef.current.particleIndex++;
    }
  };

  const startGame = useCallback(() => {
    const g = gameRef.current;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    g.player.x = cx;
    g.player.y = cy;
    g.player.hp = g.player.maxHp;
    g.player.mana = g.player.maxMana;
    g.player.invulnTime = 3.0; // 3 seconds grace shield on start
    g.player.damageTakenThisRun = 0;
    g.score = 0;
    g.combo = 0;
    g.floor = 1;
    g.monstersDefeated = 0;
    g.projectiles = [];
    g.hitstop = 0;
    g.cameraShake = 0;
    g.keysHeld.clear();
    g.keysJustPressed.clear();
    spawnFloorEnemies(1);

    setGameState('playing');
    setHudStats({
      hp: 100,
      maxHp: 100,
      mana: 100,
      maxMana: 100,
      score: 0,
      floor: 1,
      combo: 0,
      enemiesLeft: g.enemies.length,
    });
  }, [spawnFloorEnemies]);

  const resumeGame = useCallback(() => {
    setGameState('playing');
    gameRef.current.lastFrameTime = performance.now();
  }, []);

  const pauseGame = useCallback(() => {
    setGameState((prev) => (prev === 'playing' ? 'paused' : prev));
  }, []);

  // Keyboard and Mouse Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }

      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (gameRef.current.state === 'playing') {
          pauseGame();
          return;
        } else if (gameRef.current.state === 'paused') {
          resumeGame();
          return;
        }
      }

      if (gameRef.current.state === 'title' && (e.code === 'Enter' || e.code === 'Space')) {
        startGame();
        return;
      }

      if (!gameRef.current.keysHeld.has(e.code)) {
        gameRef.current.keysJustPressed.add(e.code);
      }
      gameRef.current.keysHeld.add(e.code);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      gameRef.current.keysHeld.delete(e.code);
    };

    const handleBlur = () => {
      gameRef.current.keysHeld.clear();
      gameRef.current.keysJustPressed.clear();
      gameRef.current.mouseDown = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [pauseGame, resumeGame, startGame]);

  // Main 60fps simulation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Pre-allocate particle buffer
    gameRef.current.particles = Array.from({ length: PARTICLE_POOL_SIZE }, () => ({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 1,
      color: '#fff',
      size: 3,
    }));

    let animationFrameId: number;

    const gameLoop = (currentTime: number) => {
      const g = gameRef.current;
      const rawDt = (currentTime - g.lastFrameTime) / 1000;
      g.lastFrameTime = currentTime;

      // Clamped delta time <= 0.05s as per game craft rules
      const dt = Math.min(rawDt, 0.05);

      // Hitstop logic: visual shake/render continues, physics freeze
      let simDt = dt;
      if (g.hitstop > 0) {
        g.hitstop -= dt;
        simDt = 0;
      }

      // Responsive Canvas Resize
      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }

      const W = canvas.width;
      const H = canvas.height;

      // UPDATE SIMULATION (only if playing and not frozen)
      if (g.state === 'playing') {
        const { player, keysHeld, keysJustPressed } = g;

        if (simDt > 0) {
          // Player Movement (WASD / Arrows)
          let dx = 0;
          let dy = 0;
          if (keysHeld.has('KeyW') || keysHeld.has('ArrowUp')) dy -= 1;
          if (keysHeld.has('KeyS') || keysHeld.has('ArrowDown')) dy += 1;
          if (keysHeld.has('KeyA') || keysHeld.has('ArrowLeft')) dx -= 1;
          if (keysHeld.has('KeyD') || keysHeld.has('ArrowRight')) dx += 1;

          if (dx !== 0 && dy !== 0) {
            dx *= 0.7071;
            dy *= 0.7071;
          }

          player.x += dx * player.speed * simDt;
          player.y += dy * player.speed * simDt;

          // Clamp player to arena bounds
          const pad = 30;
          player.x = Math.max(pad, Math.min(W - pad, player.x));
          player.y = Math.max(pad, Math.min(H - pad, player.y));

          // Aiming toward mouse
          const aimAngle = Math.atan2(g.mousePos.y - player.y, g.mousePos.x - player.x);
          player.facing = aimAngle;

          // Cooldowns
          if (player.attackCooldown > 0) player.attackCooldown -= simDt;
          if (player.dashCooldown > 0) player.dashCooldown -= simDt;
          if (player.invulnTime > 0) player.invulnTime -= simDt;

          // Dash Ability (Shift)
          if ((keysJustPressed.has('ShiftLeft') || keysJustPressed.has('ShiftRight')) && player.dashCooldown <= 0 && player.mana >= 20) {
            player.dashCooldown = 1.2;
            player.mana -= 20;
            player.x += Math.cos(player.facing) * 120;
            player.y += Math.sin(player.facing) * 120;
            player.invulnTime = 0.25;
            spawnParticles(player.x, player.y, '#38bdf8', 16, 220);
            playSlashSound();
          }

          // Melee Strike / Shadow Blade (Space or Left Click)
          const wantsAttack = keysJustPressed.has('Space') || g.mouseDown;
          if (wantsAttack && player.attackCooldown <= 0) {
            player.attackCooldown = 0.28;
            playSlashSound();

            // Melee Slash Arc
            const slashRange = 75;
            const slashAngle = player.facing;
            const slashX = player.x + Math.cos(slashAngle) * 35;
            const slashY = player.y + Math.sin(slashAngle) * 35;

            spawnParticles(slashX, slashY, '#a855f7', 8, 140);

            // Check enemy hits
            g.enemies.forEach((enemy) => {
              const dist = Math.hypot(enemy.x - slashX, enemy.y - slashY);
              if (dist < slashRange) {
                const damage = 35;
                enemy.hp -= damage;
                g.hitstop = 0.05; // 50ms hitstop impact feel!
                g.cameraShake = 7;
                spawnParticles(enemy.x, enemy.y, '#ec4899', 14, 180);
                playHitSound();

                // Knockback
                enemy.x += Math.cos(slashAngle) * 40;
                enemy.y += Math.sin(slashAngle) * 40;

                g.score += 50;
                g.combo += 1;
                g.comboTimer = 2.5;

                // Restore mana on hit
                player.mana = Math.min(player.maxMana, player.mana + 10);
              }
            });
          }

          // Ultimate: Shadow Extraction Shockwave (Key Q)
          if (keysJustPressed.has('KeyQ') && player.mana >= 60) {
            player.mana -= 60;
            g.cameraShake = 14;
            g.hitstop = 0.08;
            playLevelUpSound();
            spawnParticles(player.x, player.y, '#818cf8', 35, 300);

            g.enemies.forEach((enemy) => {
              const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
              if (dist < 220) {
                enemy.hp -= 80;
                spawnParticles(enemy.x, enemy.y, '#c084fc', 12, 160);
              }
            });
          }

          // Combo countdown
          if (g.comboTimer > 0) {
            g.comboTimer -= simDt;
            if (g.comboTimer <= 0) g.combo = 0;
          }

          // Natural Mana Regen
          player.mana = Math.min(player.maxMana, player.mana + 8 * simDt);

          // Update Projectiles
          for (let pIdx = g.projectiles.length - 1; pIdx >= 0; pIdx--) {
            const p = g.projectiles[pIdx];
            p.x += p.vx * simDt;
            p.y += p.vy * simDt;
            p.life -= simDt;

            // Hit player
            if (!p.fromPlayer) {
              const d = Math.hypot(player.x - p.x, player.y - p.y);
              if (d < player.size + p.radius && player.invulnTime <= 0) {
                player.hp -= p.damage;
                player.damageTakenThisRun += p.damage;
                player.invulnTime = 0.4;
                g.cameraShake = 10;
                g.hitstop = 0.04;
                playHitSound();
                spawnParticles(player.x, player.y, '#ef4444', 16, 180);
                g.projectiles.splice(pIdx, 1);
                continue;
              }
            }

            if (p.life <= 0 || p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
              g.projectiles.splice(pIdx, 1);
            }
          }

          // Update Enemies with 3 Distinct Policies
          for (let eIdx = g.enemies.length - 1; eIdx >= 0; eIdx--) {
            const enemy = g.enemies[eIdx];

            if (enemy.hp <= 0) {
              // Defeated!
              g.monstersDefeated++;
              g.score += 200;
              spawnParticles(enemy.x, enemy.y, '#eab308', 22, 220);
              playCoinSound();
              g.enemies.splice(eIdx, 1);
              continue;
            }

            const distToPlayer = Math.hypot(player.x - enemy.x, player.y - enemy.y);
            const angleToPlayer = Math.atan2(player.y - enemy.y, player.x - enemy.x);

            if (enemy.type === 'swarmer') {
              // Policy 1: Aggressive Swarmer - seeks player with zig-zag frequency
              const wobble = Math.sin(currentTime * 0.008 + enemy.id) * 0.4;
              const moveAngle = angleToPlayer + wobble;
              enemy.x += Math.cos(moveAngle) * enemy.speed * simDt;
              enemy.y += Math.sin(moveAngle) * enemy.speed * simDt;

              if (distToPlayer < enemy.size + player.size && player.invulnTime <= 0) {
                player.hp -= 12;
                player.damageTakenThisRun += 12;
                player.invulnTime = 0.45;
                g.cameraShake = 8;
                playHitSound();
                spawnParticles(player.x, player.y, '#f87171', 12, 140);
              }
            } else if (enemy.type === 'caster') {
              // Policy 2: Ranged Kiter - keeps distance, charges laser telegraph
              if (distToPlayer < 240) {
                // Back off
                enemy.x -= Math.cos(angleToPlayer) * enemy.speed * simDt;
                enemy.y -= Math.sin(angleToPlayer) * enemy.speed * simDt;
              } else if (distToPlayer > 380) {
                // Approach
                enemy.x += Math.cos(angleToPlayer) * enemy.speed * simDt;
                enemy.y += Math.sin(angleToPlayer) * enemy.speed * simDt;
              }

              if (enemy.attackCooldown > 0) {
                enemy.attackCooldown -= simDt;
              } else {
                // Windup telegraph
                enemy.telegraphTime += simDt;
                enemy.shootAngle = angleToPlayer;

                if (enemy.telegraphTime >= enemy.telegraphMax) {
                  // Fire void orb projectile
                  enemy.telegraphTime = 0;
                  enemy.attackCooldown = 2.4;
                  g.projectiles.push({
                    x: enemy.x,
                    y: enemy.y,
                    vx: Math.cos(angleToPlayer) * 280,
                    vy: Math.sin(angleToPlayer) * 280,
                    radius: 7,
                    fromPlayer: false,
                    damage: 22,
                    life: 3.5,
                  });
                  spawnParticles(enemy.x, enemy.y, '#38bdf8', 10, 150);
                }
              }
            } else if (enemy.type === 'golem') {
              // Policy 3: Heavy Titan - lumbers toward player, executes ground slam
              if (distToPlayer > 120 && enemy.telegraphTime === 0) {
                enemy.x += Math.cos(angleToPlayer) * enemy.speed * simDt;
                enemy.y += Math.sin(angleToPlayer) * enemy.speed * simDt;
              }

              if (enemy.attackCooldown > 0) {
                enemy.attackCooldown -= simDt;
              } else {
                enemy.telegraphTime += simDt;
                if (enemy.telegraphTime >= enemy.telegraphMax) {
                  // Smash impact!
                  enemy.telegraphTime = 0;
                  enemy.attackCooldown = 2.8;
                  g.cameraShake = 12;
                  g.hitstop = 0.06;
                  playHitSound();
                  spawnParticles(enemy.x, enemy.y, '#f43f5e', 24, 240);

                  if (distToPlayer < 110 && player.invulnTime <= 0) {
                    player.hp -= 30;
                    player.damageTakenThisRun += 30;
                    player.invulnTime = 0.6;
                    playHitSound();
                  }
                }
              }
            }
          }

          // Check Victory / Floor Clear
          if (g.enemies.length === 0) {
            playLevelUpSound();
            const flawless = player.damageTakenThisRun === 0;
            const reward = calculateFloorExtractionBonus(g.floor, g.monstersDefeated, flawless);
            onRewardEarned(reward.creditsEarned, reward.xpEarned, `Shadow Dungeon Floor ${g.floor} Cleared!`);

            setEndStats({
              won: true,
              score: g.score,
              floor: g.floor,
              monstersDefeated: g.monstersDefeated,
              creditsEarned: reward.creditsEarned,
              xpEarned: reward.xpEarned,
              flawless,
            });
            setGameState('gameover');
          }

          // Check Defeat
          if (player.hp <= 0) {
            playDefeatSound();
            const reward = calculateFloorExtractionBonus(g.floor, g.monstersDefeated, false);
            const consolationCredits = Math.max(5, Math.floor(reward.creditsEarned * 0.4));
            const consolationXP = Math.floor(reward.xpEarned * 0.4);
            onRewardEarned(consolationCredits, consolationXP, `Shadow Extraction Failed (Floor ${g.floor})`);

            setEndStats({
              won: false,
              score: g.score,
              floor: g.floor,
              monstersDefeated: g.monstersDefeated,
              creditsEarned: consolationCredits,
              xpEarned: consolationXP,
              flawless: false,
            });
            setGameState('gameover');
          }

          // Throttle HUD update
          setHudStats({
            hp: Math.max(0, Math.round(player.hp)),
            maxHp: player.maxHp,
            mana: Math.max(0, Math.round(player.mana)),
            maxMana: player.maxMana,
            score: g.score,
            floor: g.floor,
            combo: g.combo,
            enemiesLeft: g.enemies.length,
          });
        }

        // Clear one-shot keys
        keysJustPressed.clear();
      }

      // Update Particles
      for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
        const p = g.particles[i];
        if (p.active) {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.life -= dt;
          if (p.life <= 0) p.active = false;
        }
      }

      // Camera Shake decay
      let shakeX = 0;
      let shakeY = 0;
      if (g.cameraShake > 0) {
        shakeX = (Math.random() - 0.5) * g.cameraShake;
        shakeY = (Math.random() - 0.5) * g.cameraShake;
        g.cameraShake = Math.max(0, g.cameraShake - dt * 25);
      }

      // RENDER CANVAS
      ctx.save();
      ctx.translate(shakeX, shakeY);

      // Arena Background
      ctx.fillStyle = '#060814';
      ctx.fillRect(0, 0, W, H);

      // Glowing Rune Floor Grid
      ctx.strokeStyle = 'rgba(79, 70, 229, 0.12)';
      ctx.lineWidth = 1;
      const gridSize = 60;
      for (let x = 0; x < W; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y < H; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      // Central Portal Rune Circle
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, 140, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.2)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Render Enemy Telegraphs (Windups)
      g.enemies.forEach((enemy) => {
        if (enemy.type === 'caster' && enemy.telegraphTime > 0 && enemy.shootAngle !== undefined) {
          // Warning laser line
          ctx.beginPath();
          ctx.moveTo(enemy.x, enemy.y);
          ctx.lineTo(
            enemy.x + Math.cos(enemy.shootAngle) * 500,
            enemy.y + Math.sin(enemy.shootAngle) * 500
          );
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
          ctx.lineWidth = 2;
          ctx.setLineDash([8, 6]);
          ctx.stroke();
          ctx.setLineDash([]);
        } else if (enemy.type === 'golem' && enemy.telegraphTime > 0) {
          // Expanding smash circle
          const progress = enemy.telegraphTime / enemy.telegraphMax;
          ctx.beginPath();
          ctx.arc(enemy.x, enemy.y, 110 * progress, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(244, 63, 94, 0.22)';
          ctx.fill();
          ctx.strokeStyle = '#f43f5e';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });

      // Render Projectiles
      g.projectiles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.fromPlayer ? '#a855f7' : '#38bdf8';
        ctx.shadowColor = p.fromPlayer ? '#c084fc' : '#38bdf8';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Render Enemies
      g.enemies.forEach((enemy) => {
        ctx.save();
        ctx.translate(enemy.x, enemy.y);

        // Enemy Shadow Body
        ctx.beginPath();
        ctx.arc(0, 0, enemy.size, 0, Math.PI * 2);
        ctx.fillStyle = enemy.color;
        ctx.shadowColor = enemy.color;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Glowing Eyes
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-enemy.size * 0.3, -enemy.size * 0.2, enemy.size * 0.2, 0, Math.PI * 2);
        ctx.arc(enemy.size * 0.3, -enemy.size * 0.2, enemy.size * 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Mini HP Bar above enemy
        const hpPercent = enemy.hp / enemy.maxHp;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(-18, -enemy.size - 12, 36, 4);
        ctx.fillStyle = enemy.type === 'golem' ? '#f43f5e' : '#a855f7';
        ctx.fillRect(-18, -enemy.size - 12, 36 * hpPercent, 4);

        ctx.restore();
      });

      // Render Player (Shadow Monarch Hunter)
      const { player } = g;
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.rotate(player.facing);

      // Dash trail / Invulnerability flash
      if (player.invulnTime > 0) {
        ctx.globalAlpha = Math.sin(currentTime * 0.05) > 0 ? 0.4 : 1.0;
      }

      // Shadow Aura around player
      ctx.beginPath();
      ctx.arc(0, 0, player.size + 6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(168, 85, 247, 0.25)';
      ctx.fill();

      // Main Hunter Cloak
      ctx.beginPath();
      ctx.arc(0, 0, player.size, 0, Math.PI * 2);
      ctx.fillStyle = '#1e1b4b';
      ctx.shadowColor = '#818cf8';
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Glowing Monarch Azure Eyes
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(player.size * 0.4, -4, 3, 0, Math.PI * 2);
      ctx.arc(player.size * 0.4, 4, 3, 0, Math.PI * 2);
      ctx.fill();

      // Shadow Blade in hand
      ctx.beginPath();
      ctx.moveTo(player.size * 0.5, 8);
      ctx.lineTo(player.size * 0.5 + 26, 4);
      ctx.lineTo(player.size * 0.5 + 4, 14);
      ctx.closePath();
      ctx.fillStyle = '#c084fc';
      ctx.shadowColor = '#e879f9';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.restore();

      // Render Particles
      for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
        const p = g.particles[i];
        if (p.active) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.life / p.maxLife;
          ctx.fill();
          ctx.globalAlpha = 1.0;
        }
      }

      ctx.restore();

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [onRewardEarned]);

  // Track mouse coordinates for aiming
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    gameRef.current.mousePos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = () => {
    gameRef.current.mouseDown = true;
  };

  const handleMouseUp = () => {
    gameRef.current.mouseDown = false;
  };

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 z-50 bg-[#060814] overflow-hidden select-none font-sans"
      data-testid="shadow-dungeon-container"
    >
      {/* 60fps Canvas Viewport */}
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        className="w-full h-full block cursor-crosshair"
      />

      {/* OVERLAY WRAPPER: pointer-events: none keeps >=85% viewport clear! */}
      {gameState !== 'title' && (
        <div className="fixed inset-0 pointer-events-none flex flex-col justify-between p-4 sm:p-6">
        {/* TOP STATUS BAR: Low-Occlusion Perimeter Clusters */}
        <div className="flex items-start justify-between w-full">
          {/* Top Left: Player Vitality & Mana Pips */}
          <div className="bg-[#0b0f24]/90 border border-purple-900/60 rounded-xl p-3 shadow-lg pointer-events-auto flex flex-col gap-1.5 w-60">
            <div className="flex items-center justify-between text-xs font-orbitron text-purple-300">
              <span className="font-bold flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                HUNTER HP
              </span>
              <span className="tabular-nums font-mono-code font-bold text-emerald-400">
                {hudStats.hp} / {hudStats.maxHp}
              </span>
            </div>
            {/* Health Bar */}
            <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-700/50">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-75"
                style={{ width: `${(hudStats.hp / hudStats.maxHp) * 100}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] font-orbitron text-indigo-300 mt-0.5">
              <span className="font-semibold">SHADOW MANA</span>
              <span className="tabular-nums font-mono-code text-indigo-400">
                {hudStats.mana} / {hudStats.maxMana}
              </span>
            </div>
            {/* Mana Bar */}
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-700/50">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-75"
                style={{ width: `${(hudStats.mana / hudStats.maxMana) * 100}%` }}
              />
            </div>
          </div>

          {/* Top Center: Floor & Combo */}
          <div className="flex flex-col items-center">
            <div className="bg-[#0b0f24]/90 border border-indigo-900/60 rounded-xl px-4 py-1.5 shadow-lg text-center pointer-events-auto">
              <div className="text-[10px] uppercase font-orbitron tracking-widest text-indigo-400">
                SHADOW CRYPT
              </div>
              <div className="text-xl font-bold font-orbitron text-white tabular-nums">
                FLOOR {hudStats.floor}
              </div>
              <div className="text-xs text-purple-300 font-mono-code">
                Foes: <span className="text-pink-400 font-bold">{hudStats.enemiesLeft}</span>
              </div>
            </div>

            {hudStats.combo > 1 && (
              <div className="mt-2 text-amber-400 font-orbitron font-extrabold text-sm tracking-wider animate-bounce">
                {hudStats.combo}x STRIKE COMBO!
              </div>
            )}
          </div>

          {/* Top Right: Score & Utility Controls */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <div className="bg-[#0b0f24]/90 border border-purple-900/60 rounded-xl px-3.5 py-2 shadow-lg text-right hidden sm:block">
              <div className="text-[10px] font-orbitron uppercase text-slate-400">Dungeon Score</div>
              <div className="text-lg font-bold font-mono-code text-amber-300 tabular-nums">
                {hudStats.score.toLocaleString()}
              </div>
            </div>

            <button
              onClick={handleToggleMute}
              className="p-2.5 bg-[#0b0f24]/90 border border-purple-900/60 hover:border-purple-500 text-purple-300 rounded-xl transition cursor-pointer"
              aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            >
              {isMuted ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              )}
            </button>

            <button
              onClick={pauseGame}
              className="p-2.5 bg-[#0b0f24]/90 border border-purple-900/60 hover:border-purple-500 text-purple-300 rounded-xl transition cursor-pointer font-bold text-xs"
              aria-label="Pause Dungeon"
            >
              PAUSE [P]
            </button>
          </div>
        </div>

        {/* BOTTOM HUD DOCK: Ability Slots & Flat Control Hint */}
        <div className="flex flex-col items-center gap-2">
          {/* Active Ability Dock */}
          <div className="flex items-center gap-3 bg-[#0b0f24]/90 border border-indigo-900/60 rounded-xl px-4 py-2 pointer-events-auto">
            <div className="flex items-center gap-2 text-xs font-orbitron">
              <span className="px-2 py-0.5 bg-purple-950 border border-purple-500/50 rounded text-purple-300 font-bold">
                SPACE
              </span>
              <span className="text-slate-300">Shadow Slash</span>
            </div>
            <div className="w-px h-4 bg-slate-700" />
            <div className="flex items-center gap-2 text-xs font-orbitron">
              <span className="px-2 py-0.5 bg-blue-950 border border-blue-500/50 rounded text-blue-300 font-bold">
                SHIFT
              </span>
              <span className="text-slate-300">Dash (20 MP)</span>
            </div>
            <div className="w-px h-4 bg-slate-700" />
            <div className="flex items-center gap-2 text-xs font-orbitron">
              <span className="px-2 py-0.5 bg-indigo-950 border border-indigo-500/50 rounded text-indigo-300 font-bold">
                Q
              </span>
              <span className="text-amber-300">Extraction Ult (60 MP)</span>
            </div>
          </div>

          {/* Single Flat Control Hint as required by Game Title craft */}
          <div className="text-xs text-slate-400 font-mono-code tracking-wide">
            WASD Move · Space Strike · Shift Dash · Q Ultimate · Esc Pause
          </div>
        </div>
      </div>
      )}

      {/* MODAL 1: TITLE SCREEN STAGE */}
      {gameState === 'title' && (
        <div className="fixed inset-0 z-50 bg-[#060814]/95 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#0d122e] border-2 border-purple-700/60 rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute inset-x-0 -top-16 h-32 bg-purple-600/20 rounded-full blur-2xl" />

            {/* Bespoke inline SVG Title Lockup */}
            <div className="flex justify-center mb-4">
              <svg className="w-20 h-20 text-purple-400" viewBox="0 0 64 64" fill="none">
                <path
                  d="M32 4L42 22L60 26L46 38L50 56L32 46L14 56L18 38L4 26L22 22L32 4Z"
                  stroke="#a855f7"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                  fill="rgba(168, 85, 247, 0.2)"
                />
                <circle cx="32" cy="32" r="10" stroke="#38bdf8" strokeWidth="2" fill="#0f172a" />
                <path d="M28 32H36M32 28V36" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold font-orbitron tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-200 to-cyan-300 mb-2">
              SHADOW CRYPT
            </h1>
            <p className="text-sm text-slate-300 font-sans mb-6">
              Extract shadows from the deep dungeon. Strike down swarm ghouls, void casters, and
              titans to harvest real CreditVerse credits!
            </p>

            <div className="flex flex-col gap-3">
              <button
                data-start="true"
                onClick={startGame}
                className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-orbitron font-bold rounded-xl shadow-lg shadow-purple-600/40 transition cursor-pointer"
              >
                ENTER DUNGEON [ENTER / SPACE]
              </button>

              <button
                onClick={onBackToHub}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-orbitron text-xs rounded-xl transition cursor-pointer"
              >
                RETURN TO MULTIVERSE HUB
              </button>
            </div>

            <div className="mt-6 text-[11px] text-slate-400 font-mono-code">
              Supports WASD / Arrow keys · Left Click / Space to attack
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: PAUSED MODAL */}
      {gameState === 'paused' && (
        <div className="fixed inset-0 z-50 bg-[#060814]/90 flex items-center justify-center p-6">
          <div className="max-w-sm w-full bg-[#0d122e] border border-indigo-700/60 rounded-2xl p-6 text-center shadow-2xl">
            <h2 className="text-xl font-bold font-orbitron text-white mb-2">DUNGEON PAUSED</h2>
            <p className="text-xs text-slate-400 mb-6">Take a breath, Hunter. Your extraction is on hold.</p>

            <div className="flex flex-col gap-3">
              <button
                onClick={resumeGame}
                className="py-3 bg-purple-600 hover:bg-purple-500 text-white font-orbitron font-bold rounded-xl shadow cursor-pointer"
              >
                RESUME EXTRACTION [ESC / P]
              </button>
              <button
                onClick={startGame}
                className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-orbitron text-xs rounded-xl cursor-pointer"
              >
                RESTART FLOOR
              </button>
              <button
                onClick={onBackToHub}
                className="py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 font-orbitron text-xs rounded-xl cursor-pointer"
              >
                ABORT TO HUB
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: OUTCOME MODAL (VICTORY OR DEFEAT) */}
      {gameState === 'gameover' && (
        <div className="fixed inset-0 z-50 bg-[#060814]/95 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#0d122e] border-2 border-purple-600/70 rounded-2xl p-7 text-center shadow-2xl">
            <div className="text-4xl mb-2">{endStats.won ? '🏆' : '💀'}</div>
            <h2 className="text-2xl font-extrabold font-orbitron text-white mb-1">
              {endStats.won ? 'FLOOR CONQUERED!' : 'EXTRACTION COLLAPSED'}
            </h2>
            <p className="text-xs text-slate-300 mb-6">
              {endStats.won
                ? 'All shadow entities purged! Rewards credited to your student wallet.'
                : 'You were overwhelmed by dungeon foes, but salvaged partial spoils.'}
            </p>

            {/* Mastery Stat Tiles */}
            <div className="grid grid-cols-3 gap-2.5 mb-6">
              <div className="bg-[#12183b] p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] font-orbitron text-slate-400">CREDITS</div>
                <div className="text-lg font-bold font-mono-code text-amber-400 tabular-nums">
                  +{endStats.creditsEarned}
                </div>
              </div>
              <div className="bg-[#12183b] p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] font-orbitron text-slate-400">XP GAINED</div>
                <div className="text-lg font-bold font-mono-code text-purple-400 tabular-nums">
                  +{endStats.xpEarned}
                </div>
              </div>
              <div className="bg-[#12183b] p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] font-orbitron text-slate-400">FOES SLAIN</div>
                <div className="text-lg font-bold font-mono-code text-pink-400 tabular-nums">
                  {endStats.monstersDefeated}
                </div>
              </div>
            </div>

            {endStats.flawless && (
              <div className="mb-4 text-xs font-orbitron text-emerald-400 bg-emerald-950/60 border border-emerald-500/50 rounded-lg p-2 font-bold">
                ⭐ FLAWLESS CLEAR BONUS: +50% CREDIT BOOST APPLIED!
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                data-start="true"
                onClick={startGame}
                className="py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-orbitron font-bold rounded-xl shadow-lg cursor-pointer"
              >
                {endStats.won ? 'PLAY AGAIN [ENTER]' : 'TRY AGAIN [ENTER]'}
              </button>
              <button
                onClick={onBackToHub}
                className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-orbitron text-xs rounded-xl cursor-pointer"
              >
                BACK TO MULTIVERSE HUB
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
