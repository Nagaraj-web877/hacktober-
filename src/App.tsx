/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserProfile, CompanionState, Character, WorldId } from './types/game';
import { INITIAL_CHARACTERS } from './data/characters';
import { DAILY_TRAINING_TASKS } from './data/gameData';
import { calculateXPForNextLevel, calculateRank } from './game/economy';
import { toggleMute, getMuteState, playCoinSound, playLevelUpSound, playClickSound } from './utils/audio';

// Components
import { ShadowDungeonGame } from './components/dungeon/ShadowDungeonGame';
import { ShadowCompanionWidget } from './components/companion/ShadowCompanionWidget';
import { CharacterDialogueModal } from './components/dialogue/CharacterDialogueModal';
import { CharacterMarketplace } from './components/marketplace/CharacterMarketplace';
import { DailyTrainingBoard } from './components/training/DailyTrainingBoard';
import { MagicalAcademyView } from './components/worlds/MagicalAcademyView';
import { SupernaturalMysteryView } from './components/worlds/SupernaturalMysteryView';
import { CinemaQuizView } from './components/worlds/CinemaQuizView';
import { IndianCartoonView } from './components/worlds/IndianCartoonView';
import { CampusQuestsView } from './components/worlds/CampusQuestsView';
import { TreasureHuntView } from './components/treasure/TreasureHuntView';
import { PlayerProfile } from './components/profile/PlayerProfile';
import { AdminDashboard } from './components/admin/AdminDashboard';

type NavTab =
  | 'multiverse'
  | 'dungeon'
  | 'training'
  | 'marketplace'
  | 'treasure'
  | 'cinema'
  | 'academy'
  | 'mystery'
  | 'cartoon'
  | 'quests'
  | 'profile'
  | 'admin';

const STORAGE_KEY_PROFILE = 'creditverse_player_profile';
const STORAGE_KEY_COMPANION = 'creditverse_companion_state';

const DEFAULT_PROFILE: UserProfile = {
  username: 'Nagaraj Navalagatti',
  title: 'Shadow Hunter Initiate',
  credits: 125, // Starting credit wallet
  level: 4,
  xp: 180,
  streak: 3,
  lastLoginDate: new Date().toISOString().split('T')[0],
  unlockedCharacterIds: ['kage_companion'],
  favoriteCharacterId: 'kage_companion',
  selectedHouseId: 'ignis',
  housePoints: { ignis: 140, lumina: 90, noctis: 110, terra: 80 },
  claimedCodes: [],
  unlockedBadges: ['badge_first_login'],
  inventory: ['starter_daggers'],
  transactions: [
    {
      id: 'tx_init',
      type: 'earn',
      amount: 125,
      description: 'GDG on Campus Pioneer Welcome Grant',
      timestamp: Date.now() - 86400000,
    },
  ],
  dailyTasksCompletedDate: '',
  currentTreasureStep: 1,
};

const DEFAULT_COMPANION: CompanionState = {
  name: 'Kage the Shadow Sprite',
  level: 3,
  xp: 60,
  mood: 'ready',
  activeSkinId: 'skin_default',
  unlockedSkinIds: ['skin_default'],
  bondPoints: 18,
};

export default function App() {
  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROFILE);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_PROFILE;
  });

  const [companion, setCompanion] = useState<CompanionState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_COMPANION);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_COMPANION;
  });

  const [dailyTasks, setDailyTasks] = useState(DAILY_TRAINING_TASKS);
  const [dailyBonusClaimed, setDailyBonusClaimed] = useState(false);
  const [activeTab, setActiveTab] = useState<NavTab>('multiverse');
  const [inDungeonMode, setInDungeonMode] = useState(false);
  const [activeDialogueCharacter, setActiveDialogueCharacter] = useState<Character | null>(null);
  const [claimedDialogueSecrets, setClaimedDialogueSecrets] = useState<string[]>([]);
  const [completedCampusQuests, setCompletedCampusQuests] = useState<string[]>([]);
  const [mysteryCompleted, setMysteryCompleted] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [isMuted, setIsMuted] = useState(getMuteState());

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
    } catch {
      // ignore
    }
  }, [profile]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_COMPANION, JSON.stringify(companion));
    } catch {
      // ignore
    }
  }, [companion]);

  // Check URL query parameters (e.g. ?autostart=1)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1' || params.get('tab') === 'dungeon') {
        setInDungeonMode(true);
      }
    }
  }, []);

  // Helper to trigger celebration animations
  const triggerCelebration = () => {
    setCelebrating(true);
    setTimeout(() => setCelebrating(false), 4000);
  };

  // Add credits and transaction
  const handleAddCredits = (amount: number, xpGained: number, description: string) => {
    playCoinSound();
    triggerCelebration();

    setProfile((prev) => {
      let nextXp = prev.xp + xpGained;
      let nextLvl = prev.level;
      let needed = calculateXPForNextLevel(nextLvl);

      while (nextXp >= needed) {
        nextXp -= needed;
        nextLvl += 1;
        needed = calculateXPForNextLevel(nextLvl);
        playLevelUpSound();
      }

      const newTx = {
        id: `tx_${Date.now()}_${Math.random()}`,
        type: 'earn' as const,
        amount,
        description,
        timestamp: Date.now(),
      };

      return {
        ...prev,
        credits: prev.credits + amount,
        level: nextLvl,
        xp: nextXp,
        transactions: [newTx, ...prev.transactions].slice(0, 30),
      };
    });
  };

  // Spend credits (marketplace, unlocks)
  const handleSpendCredits = (amount: number, description: string) => {
    setProfile((prev) => {
      const newTx = {
        id: `tx_${Date.now()}_${Math.random()}`,
        type: 'spend' as const,
        amount,
        description,
        timestamp: Date.now(),
      };

      return {
        ...prev,
        credits: Math.max(0, prev.credits - amount),
        transactions: [newTx, ...prev.transactions].slice(0, 30),
      };
    });
  };

  // Unlock Character
  const handleUnlockCharacter = (character: Character) => {
    handleSpendCredits(character.price, `Unlocked ${character.name} (${character.rarity})`);
    setProfile((prev) => ({
      ...prev,
      unlockedCharacterIds: [...prev.unlockedCharacterIds, character.id],
    }));
    triggerCelebration();
  };

  // Complete Daily Task
  const handleCompleteDailyTask = (taskId: string, rewardCredits: number, rewardXP: number) => {
    setDailyTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: true } : t))
    );
    handleAddCredits(rewardCredits, rewardXP, 'Daily Mission Completed');
  };

  // Claim Daily Grand Bonus
  const handleClaimDailyBonus = (bonusCredits: number, bonusXP: number) => {
    setDailyBonusClaimed(true);
    handleAddCredits(bonusCredits, bonusXP, 'Grand Daily Mission Bonus Claimed');
  };

  // Redeem Promo Voucher Code
  const handleRedeemCode = (code: string, creditsReward: number, title: string) => {
    setProfile((prev) => ({
      ...prev,
      claimedCodes: [...prev.claimedCodes, code],
    }));
    handleAddCredits(creditsReward, 80, `Redeemed Voucher: ${title}`);
  };

  // Advance Treasure Hunt Step
  const handleAdvanceTreasure = (newStep: number, rewardCredits: number) => {
    setProfile((prev) => ({
      ...prev,
      currentTreasureStep: newStep,
    }));
    handleAddCredits(rewardCredits, 120, `Treasure Coordinate ${newStep - 1} Solved`);
  };

  const handleToggleAudio = () => {
    const muted = toggleMute();
    setIsMuted(muted);
  };

  const rank = calculateRank(profile.level);

  return (
    <div className="min-h-screen bg-[#060814] text-slate-100 flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      {/* 60FPS ARCADE DUNGEON VIEWPORT (Full viewport when active) */}
      {inDungeonMode && (
        <ShadowDungeonGame
          onBackToHub={() => {
            setInDungeonMode(false);
            setActiveTab('multiverse');
            if (typeof window !== 'undefined' && window.history.replaceState) {
              window.history.replaceState({}, '', window.location.pathname);
            }
          }}
          onRewardEarned={(credits, xp, reason) => {
            handleAddCredits(credits, xp, reason);
          }}
        />
      )}

      {/* TOP COSMIC NAVIGATION HEADER */}
      <header className="sticky top-0 z-30 bg-[#090d21]/95 border-b border-purple-900/60 backdrop-blur-md px-3 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Brand Emblem */}
          <div
            onClick={() => {
              playClickSound();
              setActiveTab('multiverse');
            }}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 via-indigo-600 to-cyan-500 p-0.5 shadow-lg group-hover:scale-105 transition">
              <div className="w-full h-full bg-[#0b0e24] rounded-[10px] flex items-center justify-center text-xl">
                👾
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black font-orbitron tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-indigo-100 to-cyan-300 text-sm sm:text-base">
                  CREDITVERSE
                </span>
                <span className="text-[9px] font-orbitron uppercase bg-purple-950 text-purple-300 px-1.5 py-0.5 rounded border border-purple-800 hidden sm:inline-block">
                  GDG ON CAMPUS
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono-code -mt-0.5 hidden xs:block">
                Earn Your World · Play → Unlock → Level Up
              </div>
            </div>
          </div>

          {/* Center / Right Indicators */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Rank / Level Badge */}
            <div
              onClick={() => {
                playClickSound();
                setActiveTab('profile');
              }}
              className="bg-[#12183b] hover:bg-[#1a2254] border rounded-xl px-2.5 py-1.5 flex items-center gap-2 cursor-pointer transition shadow"
              style={{ borderColor: rank.badgeColor }}
            >
              <span className="text-xs font-black font-orbitron text-white">
                LVL {profile.level}
              </span>
              <span
                className="text-[10px] font-orbitron font-bold uppercase hidden md:inline-block"
                style={{ color: rank.badgeColor }}
              >
                {rank.rank}
              </span>
            </div>

            {/* Daily Streak Flame */}
            <div
              onClick={() => {
                playClickSound();
                setActiveTab('training');
              }}
              className="bg-[#12183b] hover:bg-[#1a2254] border border-amber-500/50 rounded-xl px-2.5 py-1.5 flex items-center gap-1.5 cursor-pointer transition shadow"
            >
              <span className="text-sm">🔥</span>
              <span className="font-bold font-mono-code text-xs text-amber-300">
                {profile.streak}
              </span>
            </div>

            {/* Credit Wallet Balance Display */}
            <div
              onClick={() => {
                playClickSound();
                setActiveTab('marketplace');
              }}
              className="bg-gradient-to-r from-amber-950/60 to-purple-950/60 hover:from-amber-900/60 border border-amber-500/60 rounded-xl px-3 py-1.5 flex items-center gap-2 cursor-pointer transition shadow"
            >
              <span className="text-base animate-pulse">🪙</span>
              <div>
                <span className="font-black font-mono-code text-amber-300 text-xs sm:text-sm tabular-nums">
                  {profile.credits.toLocaleString()}
                </span>
                <span className="text-[9px] text-purple-300 ml-1 font-orbitron hidden sm:inline">
                  CR
                </span>
              </div>
            </div>

            {/* Sound Toggle */}
            <button
              onClick={handleToggleAudio}
              className="p-2 bg-[#12183b] hover:bg-[#1c2459] border border-purple-900/60 hover:border-purple-500 text-purple-300 rounded-xl transition cursor-pointer"
              title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
              aria-label="Toggle Audio"
            >
              {isMuted ? '🔇' : '🔊'}
            </button>
          </div>
        </div>

        {/* Global Navigation Strip */}
        <nav className="max-w-7xl mx-auto mt-2.5 pt-2 border-t border-purple-950 flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar text-xs font-orbitron">
          {[
            { id: 'multiverse' as const, label: 'Multiverse Hub', icon: '🌌' },
            { id: 'dungeon' as const, label: 'Shadow Crypt [60fps]', icon: '🗡️' },
            { id: 'training' as const, label: 'Daily Training', icon: '⚔️' },
            { id: 'marketplace' as const, label: 'Characters & Shop', icon: '🛍️' },
            { id: 'treasure' as const, label: 'Treasure Map', icon: '🗺️' },
            { id: 'cinema' as const, label: 'Meme & Cinema', icon: '🎬' },
            { id: 'academy' as const, label: 'Magical Academy', icon: '🏰' },
            { id: 'mystery' as const, label: 'Supernatural Lab', icon: '📻' },
            { id: 'cartoon' as const, label: 'Indian Cartoons', icon: '⚡' },
            { id: 'quests' as const, label: 'GDG Quests', icon: '🐙' },
            { id: 'profile' as const, label: 'My Profile', icon: '👤' },
            { id: 'admin' as const, label: 'GM Console', icon: '⚙️' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  playClickSound();
                  if (tab.id === 'dungeon') {
                    setInDungeonMode(true);
                  } else {
                    setActiveTab(tab.id);
                  }
                }}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-purple-600 text-white font-bold shadow-lg shadow-purple-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-[#12183b]'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 pb-24">
        {/* TAB 1: MULTIVERSE HUB */}
        {activeTab === 'multiverse' && (
          <div className="space-y-8">
            {/* Hero Welcome Banner */}
            <div className="bg-gradient-to-r from-[#170e3b] via-[#101438] to-[#070b1e] border-2 border-purple-700/60 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
              <div className="absolute right-0 top-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

              <div className="max-w-2xl relative z-10">
                <div className="inline-flex items-center gap-2 bg-purple-950/80 border border-purple-500/50 px-3 py-1 rounded-full text-xs font-orbitron text-purple-300 mb-3 shadow">
                  <span>⚡</span>
                  <span>GDG on Campus · Student Gamified Entertainment Universe</span>
                </div>

                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black font-orbitron tracking-tight text-white mb-3">
                  EARN YOUR WORLD.
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-200 to-cyan-300">
                    CONQUER THE REALMS.
                  </span>
                </h1>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
                  Play arcade dungeons, decode Kannada & Indian cinema quizzes, brew potions in the
                  Magical Academy, and level up alongside your loyal shadow companion Kage.
                </p>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      playClickSound();
                      setInDungeonMode(true);
                    }}
                    className="px-6 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-orbitron font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-purple-600/40 cursor-pointer flex items-center gap-2"
                  >
                    <span>🗡️</span>
                    <span>ENTER SHADOW CRYPT [60FPS]</span>
                  </button>

                  <button
                    onClick={() => {
                      playClickSound();
                      setActiveTab('marketplace');
                    }}
                    className="px-6 py-3.5 bg-[#12183b] hover:bg-[#1a2254] border border-purple-800/80 text-purple-200 font-orbitron font-bold text-xs sm:text-sm rounded-xl shadow cursor-pointer flex items-center gap-2"
                  >
                    <span>🛍️</span>
                    <span>CHARACTER MARKETPLACE</span>
                  </button>
                </div>
              </div>
            </div>

            {/* The 5 Multiverse Worlds Grid */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold font-orbitron text-white">
                    EXPLORE THE MULTIVERSE WORLDS
                  </h2>
                  <p className="text-xs text-slate-400">
                    Step through the portals into distinct fictional dimensions.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* World A: Anime Realm */}
                <div
                  onClick={() => {
                    playClickSound();
                    setInDungeonMode(true);
                  }}
                  className="bg-gradient-to-br from-[#1b103d] via-[#101438] to-[#070b1e] border border-purple-800/60 hover:border-purple-400 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1.5 shadow-xl cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-3xl">🗡️</span>
                      <span className="text-[10px] font-orbitron font-bold uppercase px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-700">
                        ANIME REALM
                      </span>
                    </div>
                    <h3 className="text-lg font-bold font-orbitron text-white group-hover:text-purple-300 transition mb-1">
                      Shadow Extraction & Crypt
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed mb-4">
                      Inspired by Solo Leveling. Command shadows, conquer the 60fps canvas dungeon,
                      and train your companion with Monarch Sung.
                    </p>
                  </div>
                  <div className="pt-3 border-t border-purple-950 flex items-center justify-between text-xs font-orbitron text-purple-400 font-bold">
                    <span>Enter Dungeon</span>
                    <span>→</span>
                  </div>
                </div>

                {/* World B: Magical Academy */}
                <div
                  onClick={() => {
                    playClickSound();
                    setActiveTab('academy');
                  }}
                  className="bg-gradient-to-br from-[#231238] via-[#150f2f] to-[#0c0d24] border border-purple-800/60 hover:border-amber-400 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1.5 shadow-xl cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-3xl">🏰</span>
                      <span className="text-[10px] font-cinzel font-bold uppercase px-2 py-0.5 rounded bg-purple-950 text-amber-300 border border-purple-700">
                        MAGICAL ACADEMY
                      </span>
                    </div>
                    <h3 className="text-lg font-bold font-cinzel text-white group-hover:text-amber-300 transition mb-1">
                      Lumina Spires & Alchemy
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed mb-4">
                      Get sorted into Gryphon, Owl, Serpent, or Badger. Brew potions in the cauldron,
                      decipher ancient spells, and earn house points.
                    </p>
                  </div>
                  <div className="pt-3 border-t border-purple-950 flex items-center justify-between text-xs font-cinzel text-amber-300 font-bold">
                    <span>Explore Academy</span>
                    <span>→</span>
                  </div>
                </div>

                {/* World C: Supernatural Mystery */}
                <div
                  onClick={() => {
                    playClickSound();
                    setActiveTab('mystery');
                  }}
                  className="bg-gradient-to-br from-[#240a12] via-[#14081b] to-[#070b1a] border border-rose-900/60 hover:border-rose-400 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1.5 shadow-xl cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-3xl">📻</span>
                      <span className="text-[10px] font-orbitron font-bold uppercase px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-700">
                        SUPERNATURAL
                      </span>
                    </div>
                    <h3 className="text-lg font-bold font-orbitron text-white group-hover:text-rose-300 transition mb-1">
                      The Upside Down Lab
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed mb-4">
                      Tune 1980s radio frequencies, use the UV blacklight to expose hidden chalkboard
                      clues, and seal the dimension rift with Agent Eleven.
                    </p>
                  </div>
                  <div className="pt-3 border-t border-purple-950 flex items-center justify-between text-xs font-orbitron text-rose-400 font-bold">
                    <span>Investigate Lab</span>
                    <span>→</span>
                  </div>
                </div>

                {/* World D: Indian Cartoon Universe */}
                <div
                  onClick={() => {
                    playClickSound();
                    setActiveTab('cartoon');
                  }}
                  className="bg-gradient-to-br from-[#2a1306] via-[#1b0d06] to-[#0d122e] border border-orange-700/60 hover:border-orange-400 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1.5 shadow-xl cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-3xl">🚲</span>
                      <span className="text-[10px] font-orbitron font-bold uppercase px-2 py-0.5 rounded bg-orange-950 text-orange-300 border border-orange-700">
                        INDIAN CARTOONS
                      </span>
                    </div>
                    <h3 className="text-lg font-bold font-orbitron text-white group-hover:text-orange-300 transition mb-1">
                      Vedas City & Sun Realm
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed mb-4">
                      High-tech gadgets, Shiva’s sonic bicycle, Rudra’s solar magic, and outsmarting
                      goofy cartoon villains with hilarious riddles!
                    </p>
                  </div>
                  <div className="pt-3 border-t border-purple-950 flex items-center justify-between text-xs font-orbitron text-orange-400 font-bold">
                    <span>Ride to Vedas City</span>
                    <span>→</span>
                  </div>
                </div>

                {/* World E: Meme & Cinema City */}
                <div
                  onClick={() => {
                    playClickSound();
                    setActiveTab('cinema');
                  }}
                  className="bg-gradient-to-br from-[#241703] via-[#1a102b] to-[#0a0f26] border border-amber-600/60 hover:border-yellow-400 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1.5 shadow-xl cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-3xl">🎬</span>
                      <span className="text-[10px] font-cinzel font-bold uppercase px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700">
                        MEME & CINEMA
                      </span>
                    </div>
                    <h3 className="text-lg font-bold font-cinzel text-white group-hover:text-yellow-300 transition mb-1">
                      Sultan Rocky & Film Arena
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed mb-4">
                      Kannada blockbusters (KGF, Kantara, Charlie), Indian cinema, viral software
                      engineer memes, and emoji movie deciphering!
                    </p>
                  </div>
                  <div className="pt-3 border-t border-purple-950 flex items-center justify-between text-xs font-cinzel text-amber-300 font-bold">
                    <span>Play Cinema Trivia</span>
                    <span>→</span>
                  </div>
                </div>

                {/* World F: GDG on Campus Special Quests */}
                <div
                  onClick={() => {
                    playClickSound();
                    setActiveTab('quests');
                  }}
                  className="bg-gradient-to-br from-[#0c1a3b] via-[#0e1634] to-[#070e24] border border-blue-600/60 hover:border-cyan-400 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1.5 shadow-xl cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-3xl">🐙</span>
                      <span className="text-[10px] font-orbitron font-bold uppercase px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-700">
                        GDG SPECIAL
                      </span>
                    </div>
                    <h3 className="text-lg font-bold font-orbitron text-white group-hover:text-cyan-300 transition mb-1">
                      Airdrops & Hackathons
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed mb-4">
                      Redeem event vouchers like "GDGOC2026", submit Git contributions, deploy Cloud
                      Run microservices, and earn exclusive campus trophies.
                    </p>
                  </div>
                  <div className="pt-3 border-t border-purple-950 flex items-center justify-between text-xs font-orbitron text-cyan-300 font-bold">
                    <span>Redeem & Build</span>
                    <span>→</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DAILY TRAINING */}
        {activeTab === 'training' && (
          <DailyTrainingBoard
            tasks={dailyTasks}
            profile={profile}
            onCompleteTask={handleCompleteDailyTask}
            onClaimDailyBonus={handleClaimDailyBonus}
            dailyBonusClaimed={dailyBonusClaimed}
          />
        )}

        {/* TAB 3: CHARACTER MARKETPLACE */}
        {activeTab === 'marketplace' && (
          <CharacterMarketplace
            unlockedCharacterIds={profile.unlockedCharacterIds}
            favoriteCharacterId={profile.favoriteCharacterId}
            credits={profile.credits}
            onUnlockCharacter={handleUnlockCharacter}
            onSetFavorite={(charId) => setProfile((p) => ({ ...p, favoriteCharacterId: charId }))}
            onOpenDialogue={(char) => setActiveDialogueCharacter(char)}
          />
        )}

        {/* TAB 4: TREASURE EXPEDITION */}
        {activeTab === 'treasure' && (
          <TreasureHuntView
            currentStep={profile.currentTreasureStep}
            onAdvanceStep={handleAdvanceTreasure}
          />
        )}

        {/* TAB 5: MEME & CINEMA CITY */}
        {activeTab === 'cinema' && (
          <CinemaQuizView
            onEarnCredits={(credits, xp, reason) => handleAddCredits(credits, xp, reason)}
          />
        )}

        {/* TAB 6: MAGICAL ACADEMY */}
        {activeTab === 'academy' && (
          <MagicalAcademyView
            currentHouseId={profile.selectedHouseId}
            onSelectHouse={(h) => setProfile((p) => ({ ...p, selectedHouseId: h }))}
            housePoints={profile.housePoints}
            onBrewPotion={(recipe) => {
              handleAddCredits(
                recipe.rewardCredits,
                recipe.housePoints * 2,
                `Brewed ${recipe.name}`
              );
              setProfile((p) => ({
                ...p,
                housePoints: {
                  ...p.housePoints,
                  [p.selectedHouseId]: p.housePoints[p.selectedHouseId] + recipe.housePoints,
                },
              }));
            }}
          />
        )}

        {/* TAB 7: SUPERNATURAL MYSTERY */}
        {activeTab === 'mystery' && (
          <SupernaturalMysteryView
            mysteryCompleted={mysteryCompleted}
            onCompleteMystery={(credits, xp) => {
              setMysteryCompleted(true);
              handleAddCredits(credits, xp, 'Sealed Hawkins Dimension Rift');
            }}
          />
        )}

        {/* TAB 8: INDIAN CARTOON ADVENTURES */}
        {activeTab === 'cartoon' && (
          <IndianCartoonView
            onEarnCredits={(credits, xp, reason) => handleAddCredits(credits, xp, reason)}
          />
        )}

        {/* TAB 9: GDG ON CAMPUS QUESTS */}
        {activeTab === 'quests' && (
          <CampusQuestsView
            claimedCodes={profile.claimedCodes}
            completedQuests={completedCampusQuests}
            onRedeemCode={handleRedeemCode}
            onCompleteCampusQuest={(questId, credits, xp, title) => {
              setCompletedCampusQuests((prev) => [...prev, questId]);
              handleAddCredits(credits, xp, `Verified Quest: ${title}`);
            }}
          />
        )}

        {/* TAB 10: PLAYER PROFILE */}
        {activeTab === 'profile' && (
          <PlayerProfile
            profile={profile}
            onUpdateUsername={(u) => setProfile((p) => ({ ...p, username: u }))}
            onSelectTitle={(t) => setProfile((p) => ({ ...p, title: t }))}
          />
        )}

        {/* TAB 11: ADMIN / GM DASHBOARD */}
        {activeTab === 'admin' && (
          <AdminDashboard
            profile={profile}
            onGrantCredits={(amount, reason) => handleAddCredits(amount, 50, reason)}
            onResetStreak={() => setProfile((p) => ({ ...p, streak: 1 }))}
            onAdvanceLevel={() => {
              setProfile((p) => ({
                ...p,
                level: p.level + 1,
              }));
            }}
            onResetAllData={() => {
              localStorage.removeItem(STORAGE_KEY_PROFILE);
              localStorage.removeItem(STORAGE_KEY_COMPANION);
              setProfile(DEFAULT_PROFILE);
              setCompanion(DEFAULT_COMPANION);
            }}
          />
        )}
      </main>

      {/* FLOATING MINI SHADOW COMPANION ("Kage") */}
      {!inDungeonMode && (
        <ShadowCompanionWidget
          companion={companion}
          celebrating={celebrating}
          onOpenDialogue={() => {
            const kage = INITIAL_CHARACTERS.find((c) => c.id === 'kage_companion') || INITIAL_CHARACTERS[0];
            setActiveDialogueCharacter(kage);
          }}
          onSelectSkin={(skinId) => {
            setCompanion((prev) => ({ ...prev, activeSkinId: skinId }));
          }}
          onAddBond={() => {
            setCompanion((prev) => ({ ...prev, bondPoints: prev.bondPoints + 1 }));
          }}
        />
      )}

      {/* CHARACTER DIALOGUE MODAL */}
      {activeDialogueCharacter && (
        <CharacterDialogueModal
          character={activeDialogueCharacter}
          onClose={() => setActiveDialogueCharacter(null)}
          onStartDungeon={() => setInDungeonMode(true)}
          claimedSecrets={claimedDialogueSecrets}
          onMarkSecretClaimed={(key) =>
            setClaimedDialogueSecrets((prev) => [...prev, key])
          }
          onRewardClaimed={(credits, reason) => {
            handleAddCredits(credits, 50, reason);
          }}
        />
      )}
    </div>
  );
}
