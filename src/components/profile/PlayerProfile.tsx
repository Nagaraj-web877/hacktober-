import React, { useState } from 'react';
import { UserProfile, Character } from '../../types/game';
import { calculateRank, calculateXPForNextLevel } from '../../game/economy';
import { INITIAL_CHARACTERS } from '../../data/characters';
import { playClickSound } from '../../utils/audio';

interface PlayerProfileProps {
  profile: UserProfile;
  onUpdateUsername: (newUsername: string) => void;
  onSelectTitle: (newTitle: string) => void;
}

export const PlayerProfile: React.FC<PlayerProfileProps> = ({
  profile,
  onUpdateUsername,
  onSelectTitle,
}) => {
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(profile.username);

  const rank = calculateRank(profile.level);
  const xpNeeded = calculateXPForNextLevel(profile.level);
  const xpPercent = Math.min(100, Math.round((profile.xp / xpNeeded) * 100));

  const favoriteCharacter =
    INITIAL_CHARACTERS.find((c) => c.id === profile.favoriteCharacterId) || INITIAL_CHARACTERS[0];

  const TITLES = [
    'Shadow Hunter Initiate',
    'Grand Multiverse Sovereign',
    'Arcane Lumina Scholar',
    'Cinema City Sultan',
    'GDG Campus Champion',
  ];

  const BADGES = [
    { id: 'badge_first_login', name: 'Awakened Pioneer', icon: '🌌', desc: 'Entered the CreditVerse multiverse' },
    { id: 'badge_dungeon_clear', name: 'Shadow Slayer', icon: '🗡️', desc: 'Cleared an entire floor in the Shadow Crypt' },
    { id: 'badge_potion_master', name: 'Alchemical Adept', icon: '🧪', desc: 'Brewed a potion in the Magical Academy' },
    { id: 'badge_cinema_guru', name: 'Cinema Icon', icon: '🎬', desc: 'Solved trivia from Kannada and Indian cinema' },
    { id: 'badge_campus_tech', name: 'GDG Builder', icon: '🐙', desc: 'Completed a Google Developer Group quest' },
  ];

  const LEADERBOARD_STUDENTS = [
    { rank: 1, name: 'Vikram "Monarch" Rao', level: 28, credits: 4200, house: 'Ignis' },
    { rank: 2, name: 'Aisha "Byte" Sharma', level: 24, credits: 3850, house: 'Lumina' },
    { rank: 3, name: profile.username, level: profile.level, credits: profile.credits, house: profile.selectedHouseId, isUser: true },
    { rank: 4, name: 'Rohan "Cipher" Verma', level: 16, credits: 2150, house: 'Noctis' },
    { rank: 5, name: 'Sneha "Pixel" Patel', level: 14, credits: 1980, house: 'Terra' },
  ];

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempName.trim()) {
      onUpdateUsername(tempName.trim());
      setEditingName(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Hero Showcase Card */}
      <div className="bg-[#0b0f24] border border-purple-900/60 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Avatar & Player Identity */}
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-700 via-indigo-900 to-black border-2 border-purple-400 p-1 flex items-center justify-center text-4xl shadow-xl">
              {favoriteCharacter.avatarIcon}
            </div>

            <div>
              <div className="flex items-center gap-2">
                {editingName ? (
                  <form onSubmit={handleSaveName} className="flex gap-2">
                    <input
                      type="text"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      className="bg-[#12183b] border border-purple-500 rounded-lg px-2.5 py-1 text-sm text-white font-bold font-orbitron"
                    />
                    <button
                      type="submit"
                      className="px-2.5 py-1 bg-purple-600 text-white rounded-lg text-xs font-orbitron"
                    >
                      Save
                    </button>
                  </form>
                ) : (
                  <>
                    <h2 className="text-xl sm:text-2xl font-black font-orbitron text-white">
                      {profile.username}
                    </h2>
                    <button
                      onClick={() => setEditingName(true)}
                      className="text-xs text-slate-400 hover:text-purple-300 p-1"
                      title="Edit student username"
                    >
                      ✏️
                    </button>
                  </>
                )}
              </div>

              {/* Title selector dropdown */}
              <div className="mt-1 flex items-center gap-2">
                <select
                  value={profile.title}
                  onChange={(e) => onSelectTitle(e.target.value)}
                  className="bg-[#12183b] border border-purple-900/50 rounded-lg px-2 py-0.5 text-xs text-purple-300 font-orbitron cursor-pointer"
                >
                  {TITLES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-slate-400 font-mono-code">
                  · House {profile.selectedHouseId.toUpperCase()}
                </span>
              </div>

              {/* Rank and Level */}
              <div className="flex items-center gap-2 mt-2">
                <span
                  className="px-2.5 py-0.5 rounded text-[10px] font-orbitron font-bold uppercase tracking-wider border shadow"
                  style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    borderColor: rank.badgeColor,
                    color: rank.badgeColor,
                  }}
                >
                  {rank.rank} · {rank.title}
                </span>
                <span className="text-xs font-mono-code text-amber-300 font-bold">
                  🔥 {profile.streak} Day Streak
                </span>
              </div>
            </div>
          </div>

          {/* Wallet Balances */}
          <div className="flex items-center gap-4 bg-[#12183b] p-4 rounded-xl border border-purple-900/50 shadow">
            <div className="text-right">
              <div className="text-[10px] font-orbitron uppercase text-slate-400">CREDIT WALLET</div>
              <div className="text-2xl font-bold font-mono-code text-amber-400 tabular-nums">
                {profile.credits.toLocaleString()} CR
              </div>
              <div className="text-[10px] text-purple-300 font-mono-code">Virtual Points Only</div>
            </div>
            <div className="w-px h-10 bg-slate-700" />
            <div className="text-left">
              <div className="text-[10px] font-orbitron uppercase text-slate-400">TOTAL EXP</div>
              <div className="text-xl font-bold font-mono-code text-purple-300 tabular-nums">
                {profile.xp.toLocaleString()} XP
              </div>
              <div className="text-[10px] text-slate-400 font-mono-code">
                Next Lvl: {xpNeeded - profile.xp} XP
              </div>
            </div>
          </div>
        </div>

        {/* XP Level Bar */}
        <div className="mt-6 pt-4 border-t border-purple-950">
          <div className="flex justify-between text-xs font-orbitron mb-1 text-slate-300">
            <span>LEVEL PROGRESSION (LVL {profile.level})</span>
            <span className="font-mono-code text-cyan-300 font-bold">{xpPercent}%</span>
          </div>
          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-300"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Grid: Badges Collection & Campus Live Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Badges Collection */}
        <div className="bg-[#0b0f24] border border-purple-900/60 rounded-2xl p-6 shadow-xl">
          <h3 className="text-base font-bold font-orbitron text-white mb-1 flex items-center gap-2">
            <span>🏅</span>
            <span>Multiverse Achievement Badges</span>
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Earn permanent commemorative emblems across all CreditVerse worlds.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {BADGES.map((b) => {
              const isUnlocked = profile.unlockedBadges.includes(b.id) || b.id === 'badge_first_login';

              return (
                <div
                  key={b.id}
                  className={`p-3 rounded-xl border flex items-center gap-3 transition ${
                    isUnlocked
                      ? 'bg-[#12183b] border-purple-600/60 shadow'
                      : 'bg-[#090d21] border-slate-800 opacity-60'
                  }`}
                >
                  <span className={`text-2xl ${isUnlocked ? '' : 'grayscale'}`}>{b.icon}</span>
                  <div>
                    <div className="font-bold text-white text-xs font-orbitron flex items-center gap-1.5">
                      <span>{b.name}</span>
                      {isUnlocked && <span className="text-[10px] text-amber-400">✓</span>}
                    </div>
                    <div className="text-[11px] text-slate-400 leading-snug">{b.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Simulated Campus Leaderboard */}
        <div className="bg-[#0b0f24] border border-purple-900/60 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base font-bold font-orbitron text-white flex items-center gap-2">
              <span>🏆</span>
              <span>GDG Campus Leaderboard</span>
            </h3>
            <span className="text-[10px] font-mono-code text-purple-400">Live Semester Standings</span>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Ranked by overall credit accumulation and daily mission streaks.
          </p>

          <div className="space-y-2">
            {LEADERBOARD_STUDENTS.map((student) => (
              <div
                key={student.name}
                className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition ${
                  student.isUser
                    ? 'bg-purple-950/60 border-purple-500 shadow-md font-bold'
                    : 'bg-[#12183b] border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold font-orbitron text-[11px] ${
                      student.rank === 1
                        ? 'bg-amber-500 text-slate-950'
                        : student.rank === 2
                        ? 'bg-slate-300 text-slate-950'
                        : student.rank === 3
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {student.rank}
                  </span>
                  <div>
                    <span className="text-white font-orbitron">{student.name}</span>
                    <span className="text-[10px] text-slate-400 ml-2 font-mono-code">
                      Lvl {student.level}
                    </span>
                  </div>
                </div>

                <div className="font-mono-code font-bold text-amber-300">
                  {student.credits.toLocaleString()} CR
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Credit Wallet Transaction Ledger */}
      <div className="bg-[#0b0f24] border border-purple-900/60 rounded-2xl p-6 shadow-xl">
        <h3 className="text-base font-bold font-orbitron text-white mb-1 flex items-center gap-2">
          <span>📜</span>
          <span>Virtual Wallet Transaction Ledger</span>
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          All credit additions, character unlocks, and mission rewards are recorded below.
        </p>

        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {profile.transactions.length === 0 ? (
            <div className="text-xs text-slate-500 font-mono-code p-4 text-center">
              No transactions recorded yet. Complete quizzes or daily missions to earn credits!
            </div>
          ) : (
            profile.transactions.map((tx) => (
              <div
                key={tx.id}
                className="p-3 bg-[#12183b] rounded-xl border border-slate-800/80 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-200">{tx.description}</div>
                  <div className="text-[10px] text-slate-500 font-mono-code">
                    {new Date(tx.timestamp).toLocaleString()}
                  </div>
                </div>

                <div
                  className={`font-mono-code font-bold text-sm ${
                    tx.type === 'earn' ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {tx.type === 'earn' ? `+${tx.amount} CR` : `-${tx.amount} CR`}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
