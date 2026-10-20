import React, { useState } from 'react';
import { UserProfile } from '../../types/game';
import { playCoinSound, playLevelUpSound, playClickSound } from '../../utils/audio';

interface AdminDashboardProps {
  profile: UserProfile;
  onGrantCredits: (amount: number, reason: string) => void;
  onResetStreak: () => void;
  onResetAllData: () => void;
  onAdvanceLevel: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  profile,
  onGrantCredits,
  onResetStreak,
  onResetAllData,
  onAdvanceLevel,
}) => {
  const [customAmount, setCustomAmount] = useState(100);
  const [adminNote, setAdminNote] = useState('');

  const handleGrant = (amt: number) => {
    playLevelUpSound();
    playCoinSound();
    onGrantCredits(amt, adminNote.trim() || 'Game Master Credit Grant');
    setAdminNote('');
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#211204] via-[#1c122b] to-[#0b0f24] border border-amber-600/70 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">⚙️</span>
          <div>
            <h2 className="text-2xl font-black font-orbitron text-amber-300">
              GAME MASTER & GDG ADMIN PANEL
            </h2>
            <p className="text-xs text-slate-400">
              Authorized club admin controls. Simulate student rewards, test marketplace purchases,
              and manage multiverse economy parameters.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Economy Simulator */}
        <div className="bg-[#0b0f24] border border-purple-900/60 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="text-sm font-bold font-orbitron text-white flex items-center gap-2">
            <span>🪙</span>
            <span>Credit Economy Injector</span>
          </h3>
          <p className="text-xs text-slate-400">
            Grant virtual credits immediately to test character unlocks, skins, and dialogue lore.
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleGrant(50)}
              className="px-3.5 py-2 bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-700/60 rounded-xl font-orbitron text-xs font-bold transition cursor-pointer"
            >
              +50 Credits
            </button>
            <button
              onClick={() => handleGrant(250)}
              className="px-3.5 py-2 bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 border border-indigo-700/60 rounded-xl font-orbitron text-xs font-bold transition cursor-pointer"
            >
              +250 Credits
            </button>
            <button
              onClick={() => handleGrant(1000)}
              className="px-3.5 py-2 bg-amber-900/60 hover:bg-amber-800 text-amber-200 border border-amber-700/60 rounded-xl font-orbitron text-xs font-bold transition cursor-pointer"
            >
              +1,000 Credits (Mythic Test)
            </button>
          </div>

          <div className="space-y-2 pt-2 border-t border-purple-950">
            <input
              type="text"
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Admin grant note (e.g., Campus Hackathon 1st Place)..."
              className="w-full bg-[#12183b] border border-purple-900/60 rounded-xl px-3 py-2 text-xs text-white"
            />
            <div className="flex gap-2">
              <input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(parseInt(e.target.value) || 0)}
                className="w-32 bg-[#12183b] border border-purple-900/60 rounded-xl px-3 py-2 text-xs text-white font-mono-code"
              />
              <button
                onClick={() => handleGrant(customAmount)}
                className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-orbitron font-bold text-xs rounded-xl shadow cursor-pointer"
              >
                Inject Custom Credits
              </button>
            </div>
          </div>
        </div>

        {/* Progression & Debugging Tools */}
        <div className="bg-[#0b0f24] border border-purple-900/60 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="text-sm font-bold font-orbitron text-white flex items-center gap-2">
            <span>🛠️</span>
            <span>Progression & State Controls</span>
          </h3>
          <p className="text-xs text-slate-400">
            Quickly advance player level or test daily streak mechanics.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => {
                playLevelUpSound();
                onAdvanceLevel();
              }}
              className="w-full py-2.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-orbitron font-bold text-xs rounded-xl cursor-pointer text-left px-4 flex items-center justify-between"
            >
              <span>Instant Level Up (+1 Level & Rank Recalculation)</span>
              <span className="font-mono-code">Current: Lvl {profile.level}</span>
            </button>

            <button
              onClick={() => {
                playClickSound();
                onResetStreak();
              }}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-orbitron text-xs rounded-xl cursor-pointer text-left px-4 flex items-center justify-between"
            >
              <span>Reset Daily Streak to 1 Day</span>
              <span className="font-mono-code">{profile.streak} Days</span>
            </button>

            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to reset all game progress back to default demo state?')) {
                  onResetAllData();
                }
              }}
              className="w-full py-2.5 bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800/60 font-orbitron text-xs font-bold rounded-xl cursor-pointer text-center"
            >
              ⚠️ Reset All Local Data (Default Starter State)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
