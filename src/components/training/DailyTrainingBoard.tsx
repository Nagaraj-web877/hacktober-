import React, { useState } from 'react';
import { DailyTrainingTask, UserProfile } from '../../types/game';
import { calculateRank, calculateXPForNextLevel, applyStreakBonus } from '../../game/economy';
import {
  playCoinSound,
  playLevelUpSound,
  playClickSound,
  playHitSound,
  playMagicChime,
} from '../../utils/audio';

interface DailyTrainingBoardProps {
  tasks: DailyTrainingTask[];
  profile: UserProfile;
  onCompleteTask: (taskId: string, rewardCredits: number, rewardXP: number) => void;
  onClaimDailyBonus: (bonusCredits: number, bonusXP: number) => void;
  dailyBonusClaimed: boolean;
}

export const DailyTrainingBoard: React.FC<DailyTrainingBoardProps> = ({
  tasks,
  profile,
  onCompleteTask,
  onClaimDailyBonus,
  dailyBonusClaimed,
}) => {
  const [activeTaskModal, setActiveTaskModal] = useState<DailyTrainingTask | null>(null);

  // Mini-Game 1: Reflex Strike State
  const [reflexState, setReflexState] = useState<'idle' | 'waiting' | 'ready' | 'success' | 'failed'>('idle');
  const [reflexStartTime, setReflexStartTime] = useState(0);
  const [reflexScoreMs, setReflexScoreMs] = useState(0);

  // Mini-Game 2: Rune Logic State
  const [runeAnswer, setRuneAnswer] = useState<string | null>(null);
  const [runeSuccess, setRuneSuccess] = useState<boolean | null>(null);

  // Mini-Game 3: Memory Grid State
  const [cards, setCards] = useState([
    { id: 1, sym: '🗡️', matched: false, flipped: false },
    { id: 2, sym: '🔮', matched: false, flipped: false },
    { id: 3, sym: '⚡', matched: false, flipped: false },
    { id: 4, sym: '🗡️', matched: false, flipped: false },
    { id: 5, sym: '🔮', matched: false, flipped: false },
    { id: 6, sym: '⚡', matched: false, flipped: false },
  ]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);

  // Mini-Game 4: Code Decipher State
  const [codeAnswer, setCodeAnswer] = useState('');
  const [codeSuccess, setCodeSuccess] = useState<boolean | null>(null);

  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPercent = Math.round((completedCount / tasks.length) * 100);
  const rank = calculateRank(profile.level);
  const xpNeeded = calculateXPForNextLevel(profile.level);

  // Reflex Strike Logic
  const startReflexTest = () => {
    setReflexState('waiting');
    setReflexScoreMs(0);
    const delay = 1500 + Math.random() * 2500;
    setTimeout(() => {
      setReflexState('ready');
      setReflexStartTime(performance.now());
    }, delay);
  };

  const handleReflexClick = () => {
    if (reflexState === 'waiting') {
      // Clicked too early
      setReflexState('failed');
      playHitSound();
    } else if (reflexState === 'ready') {
      const elapsed = Math.round(performance.now() - reflexStartTime);
      setReflexScoreMs(elapsed);
      if (elapsed < 600) {
        setReflexState('success');
        playCoinSound();
      } else {
        setReflexState('failed');
      }
    }
  };

  // Memory Grid Logic
  const handleCardClick = (idx: number) => {
    if (cards[idx].flipped || cards[idx].matched || flippedIndices.length === 2) return;
    playClickSound();

    const newCards = [...cards];
    newCards[idx].flipped = true;
    setCards(newCards);

    const newFlipped = [...flippedIndices, idx];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      const [first, second] = newFlipped;
      if (newCards[first].sym === newCards[second].sym) {
        // Matched
        setTimeout(() => {
          newCards[first].matched = true;
          newCards[second].matched = true;
          setCards([...newCards]);
          setFlippedIndices([]);
          playMagicChime();
        }, 400);
      } else {
        // Not matched
        setTimeout(() => {
          newCards[first].flipped = false;
          newCards[second].flipped = false;
          setCards([...newCards]);
          setFlippedIndices([]);
        }, 900);
      }
    }
  };

  const allMemoryMatched = cards.every((c) => c.matched);

  return (
    <div className="space-y-6">
      {/* Top RPG Progress Dashboard */}
      <div className="bg-[#0b0f24] border border-purple-900/60 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Level & Rank Badge */}
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex flex-col items-center justify-center border-2 shadow-lg"
              style={{
                borderColor: rank.badgeColor,
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
              }}
            >
              <span className="text-[10px] font-orbitron font-bold text-slate-400">LVL</span>
              <span className="text-2xl font-black font-orbitron text-white tabular-nums">
                {profile.level}
              </span>
            </div>

            <div>
              <div className="text-[11px] font-orbitron uppercase tracking-wider text-purple-400">
                CURRENT RANK
              </div>
              <div
                className="text-lg font-bold font-orbitron"
                style={{ color: rank.badgeColor }}
              >
                {rank.rank} · {rank.title}
              </div>
              <div className="text-xs text-slate-400 font-mono-code">
                XP: {profile.xp} / {xpNeeded}
              </div>
            </div>
          </div>

          {/* Daily Streak Tracker */}
          <div className="bg-[#12183b] p-3.5 rounded-xl border border-purple-900/40 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-orbitron uppercase tracking-wider text-slate-400">
                DAILY TRAINING STREAK
              </div>
              <div className="text-xl font-bold font-orbitron text-amber-300 flex items-center gap-2">
                <span>🔥 {profile.streak} Days</span>
              </div>
              <div className="text-[10px] text-purple-300">
                Current Streak Multiplier: +{Math.min(profile.streak * 5, 50)}% credits!
              </div>
            </div>
          </div>

          {/* Daily Board Completion Meter */}
          <div>
            <div className="flex justify-between text-xs font-orbitron mb-1.5">
              <span className="text-slate-300">DAILY MISSIONS CLEARED</span>
              <span className="text-purple-400 font-bold font-mono-code">
                {completedCount} / {tasks.length} ({progressPercent}%)
              </span>
            </div>
            <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-700/60">
              <div
                className="h-full bg-gradient-to-r from-purple-600 via-indigo-500 to-cyan-400 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Task Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tasks.map((task) => {
          const streakCredits = applyStreakBonus(task.rewardCredits, profile.streak);

          return (
            <div
              key={task.id}
              className={`p-5 rounded-2xl border transition flex flex-col justify-between ${
                task.completed
                  ? 'bg-[#090d21] border-emerald-800/50 opacity-90'
                  : 'bg-[#0b0f24] border-purple-900/60 hover:border-purple-600/80 shadow-lg'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-orbitron uppercase tracking-wider font-bold bg-purple-950 text-purple-300 border border-purple-800/60">
                    {task.category}
                  </span>
                  <div className="flex items-center gap-2 text-xs font-mono-code font-bold">
                    <span className="text-amber-400">+{streakCredits} CR</span>
                    <span className="text-purple-400">+{task.rewardXP} XP</span>
                  </div>
                </div>

                <h3 className="text-base font-bold font-orbitron text-white mb-1.5">
                  {task.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  {task.description}
                </p>
              </div>

              <div className="pt-3 border-t border-purple-950 flex items-center justify-between">
                {task.completed ? (
                  <span className="text-xs font-orbitron font-bold text-emerald-400 flex items-center gap-1.5">
                    <span>✓</span>
                    <span>MISSION CLEARED</span>
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      playClickSound();
                      setActiveTaskModal(task);
                      // Reset sub-game states
                      setReflexState('idle');
                      setRuneAnswer(null);
                      setRuneSuccess(null);
                      setCodeSuccess(null);
                      setCodeAnswer('');
                    }}
                    className="w-full py-2 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-orbitron font-bold text-xs rounded-xl shadow cursor-pointer text-center"
                  >
                    START TRIAL
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Grand Daily Completion Claim Banner */}
      {completedCount === tasks.length && (
        <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-950 border-2 border-amber-500/60 rounded-2xl p-6 text-center shadow-xl">
          <div className="text-3xl mb-1">👑</div>
          <h3 className="text-xl font-bold font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-white mb-1">
            ALL DAILY MISSIONS CONQUERED!
          </h3>
          <p className="text-xs text-slate-300 mb-4 max-w-md mx-auto">
            You completed every training trial today. Claim the grand Shadow Hunter daily bonus
            to supercharge your ranking and companion growth!
          </p>

          {dailyBonusClaimed ? (
            <div className="text-xs font-orbitron font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/50 rounded-xl py-2 px-4 inline-block">
              ✓ Grand Bonus Claimed for Today! Keep the streak alive tomorrow!
            </div>
          ) : (
            <button
              onClick={() => {
                playLevelUpSound();
                onClaimDailyBonus(50, 150);
              }}
              className="py-3 px-8 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-orbitron font-black text-sm rounded-xl shadow-lg cursor-pointer transform hover:scale-105 transition"
            >
              CLAIM GRAND BONUS (+50 CR & +150 XP)
            </button>
          )}
        </div>
      )}

      {/* MODAL: INTERACTIVE MINI TRIAL */}
      {activeTaskModal && (
        <div className="fixed inset-0 z-50 bg-[#060814]/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#0b0f24] border-2 border-purple-700 rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setActiveTaskModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              ✕
            </button>

            <div className="mb-4">
              <span className="text-[10px] font-orbitron uppercase text-purple-400">
                DAILY TRIAL · {activeTaskModal.category}
              </span>
              <h3 className="text-xl font-bold font-orbitron text-white">
                {activeTaskModal.title}
              </h3>
            </div>

            {/* Trial 1: Reflex Strike */}
            {activeTaskModal.type === 'speed_reflex' && (
              <div className="space-y-4 text-center">
                <p className="text-xs text-slate-300">
                  Click 'Start Test', wait for the orb to turn{' '}
                  <span className="text-rose-400 font-bold">CRIMSON</span>, then strike as fast as
                  possible! (Target: Under 600ms)
                </p>

                <div
                  onClick={handleReflexClick}
                  className={`w-36 h-36 mx-auto rounded-full flex flex-col items-center justify-center transition-all duration-100 cursor-pointer shadow-xl ${
                    reflexState === 'idle'
                      ? 'bg-purple-950 border-4 border-purple-600'
                      : reflexState === 'waiting'
                      ? 'bg-slate-900 border-4 border-slate-700 animate-pulse'
                      : reflexState === 'ready'
                      ? 'bg-rose-600 border-4 border-rose-300 scale-110 shadow-rose-600/50'
                      : reflexState === 'success'
                      ? 'bg-emerald-600 border-4 border-emerald-300'
                      : 'bg-red-950 border-4 border-red-700'
                  }`}
                >
                  <span className="font-orbitron font-bold text-white text-xs">
                    {reflexState === 'idle' && 'READY'}
                    {reflexState === 'waiting' && 'WAIT...'}
                    {reflexState === 'ready' && 'STRIKE NOW!'}
                    {reflexState === 'success' && `${reflexScoreMs}ms!`}
                    {reflexState === 'failed' && 'TOO SLOW / EARLY'}
                  </span>
                </div>

                {reflexState === 'idle' && (
                  <button
                    onClick={startReflexTest}
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-orbitron text-xs font-bold rounded-xl"
                  >
                    Start Test
                  </button>
                )}

                {reflexState === 'failed' && (
                  <button
                    onClick={startReflexTest}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-orbitron text-xs rounded-xl"
                  >
                    Try Again
                  </button>
                )}

                {reflexState === 'success' && (
                  <button
                    onClick={() => {
                      onCompleteTask(
                        activeTaskModal.id,
                        activeTaskModal.rewardCredits,
                        activeTaskModal.rewardXP
                      );
                      setActiveTaskModal(null);
                    }}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-orbitron text-xs font-bold rounded-xl shadow-lg"
                  >
                    Complete & Claim Rewards!
                  </button>
                )}
              </div>
            )}

            {/* Trial 2: Arcane Rune Decipher */}
            {activeTaskModal.type === 'logic_rune' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-300">
                  Analyze the sequence of elemental runes. Which rune logically comes next?
                </p>

                <div className="bg-[#12183b] p-4 rounded-xl border border-slate-800 text-center font-mono-code text-xl tracking-widest text-amber-300">
                  🔥 · 💧 · ⚡ · 🔥 · 💧 · [ ? ]
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { sym: '🔥', label: 'Fire' },
                    { sym: '⚡', label: 'Lightning' },
                    { sym: '🌿', label: 'Earth' },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => {
                        setRuneAnswer(opt.label);
                        const isCorrect = opt.label === 'Lightning';
                        setRuneSuccess(isCorrect);
                        if (isCorrect) playCoinSound();
                        else playHitSound();
                      }}
                      className={`p-3 rounded-xl border text-center transition cursor-pointer ${
                        runeAnswer === opt.label
                          ? runeSuccess
                            ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                            : 'bg-rose-950 border-rose-500 text-rose-300'
                          : 'bg-[#151c44] border-purple-900/50 hover:border-purple-500'
                      }`}
                    >
                      <div className="text-2xl mb-1">{opt.sym}</div>
                      <div className="text-[10px] font-orbitron">{opt.label}</div>
                    </button>
                  ))}
                </div>

                {runeSuccess && (
                  <button
                    onClick={() => {
                      onCompleteTask(
                        activeTaskModal.id,
                        activeTaskModal.rewardCredits,
                        activeTaskModal.rewardXP
                      );
                      setActiveTaskModal(null);
                    }}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-orbitron text-xs font-bold rounded-xl shadow-lg"
                  >
                    Correct! Claim Rewards
                  </button>
                )}
              </div>
            )}

            {/* Trial 3: Memory Grid */}
            {activeTaskModal.type === 'memory_grid' ? (
              <div className="space-y-4">
                <p className="text-xs text-slate-300">
                  Flip and match the identical shadow runes to sharpen your memory.
                </p>

                <div className="grid grid-cols-3 gap-2.5">
                  {cards.map((card, idx) => (
                    <button
                      key={card.id}
                      onClick={() => handleCardClick(idx)}
                      className={`h-20 rounded-xl border flex items-center justify-center text-2xl transition-all cursor-pointer ${
                        card.flipped || card.matched
                          ? 'bg-purple-900/80 border-purple-400 text-white'
                          : 'bg-[#151c44] border-purple-950 hover:border-purple-700 text-transparent'
                      }`}
                    >
                      {card.flipped || card.matched ? card.sym : '?'}
                    </button>
                  ))}
                </div>

                {allMemoryMatched && (
                  <button
                    onClick={() => {
                      onCompleteTask(
                        activeTaskModal.id,
                        activeTaskModal.rewardCredits,
                        activeTaskModal.rewardXP
                      );
                      setActiveTaskModal(null);
                    }}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-orbitron text-xs font-bold rounded-xl shadow-lg"
                  >
                    All Pairs Matched! Claim Rewards
                  </button>
                )}
              </div>
            ) : null}

            {/* Trial 4: Code Decipher */}
            {activeTaskModal.type === 'code_decipher' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-300">
                  Decipher the campus programming snippet. What value is printed?
                </p>

                <div className="bg-[#090d21] p-3 rounded-xl border border-slate-800 font-mono-code text-xs text-cyan-300 leading-relaxed">
                  <span className="text-purple-400">const</span> credits = 10;
                  <br />
                  <span className="text-purple-400">const</span> bonus = [1, 2, 3].reduce((a, b) =&gt; a + b, 0);
                  <br />
                  console.log(credits + bonus);
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={codeAnswer}
                    onChange={(e) => setCodeAnswer(e.target.value)}
                    placeholder="Enter output number..."
                    className="flex-1 bg-[#12183b] border border-purple-900/60 rounded-xl px-3 text-xs text-white"
                  />
                  <button
                    onClick={() => {
                      const isCorrect = codeAnswer.trim() === '16';
                      setCodeSuccess(isCorrect);
                      if (isCorrect) playCoinSound();
                      else playHitSound();
                    }}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-orbitron rounded-xl"
                  >
                    Verify
                  </button>
                </div>

                {codeSuccess === true && (
                  <button
                    onClick={() => {
                      onCompleteTask(
                        activeTaskModal.id,
                        activeTaskModal.rewardCredits,
                        activeTaskModal.rewardXP
                      );
                      setActiveTaskModal(null);
                    }}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-orbitron text-xs font-bold rounded-xl shadow-lg"
                  >
                    Output is 16! Claim Rewards
                  </button>
                )}

                {codeSuccess === false && (
                  <div className="text-xs text-rose-400 font-mono-code text-center">
                    Incorrect calculation! (Hint: 10 + (1 + 2 + 3))
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
