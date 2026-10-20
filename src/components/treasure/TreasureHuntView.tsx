import React, { useState } from 'react';
import { TREASURE_HUNT_STEPS } from '../../data/gameData';
import { TreasureHuntStep } from '../../types/game';
import { playCoinSound, playLevelUpSound, playHitSound, playClickSound } from '../../utils/audio';

interface TreasureHuntViewProps {
  currentStep: number;
  onAdvanceStep: (newStep: number, rewardCredits: number) => void;
}

export const TreasureHuntView: React.FC<TreasureHuntViewProps> = ({
  currentStep,
  onAdvanceStep,
}) => {
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [chestOpened, setChestOpened] = useState(false);

  const activeStepIndex = Math.min(currentStep - 1, TREASURE_HUNT_STEPS.length - 1);
  const activeStep: TreasureHuntStep = TREASURE_HUNT_STEPS[activeStepIndex];
  const isFinalStepCompleted = currentStep > TREASURE_HUNT_STEPS.length;

  const handleSubmitAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAnswer = userAnswer.trim().toUpperCase();

    const isCorrect = activeStep.acceptedAnswers.some(
      (ans) => ans.toUpperCase() === cleanAnswer
    );

    if (isCorrect) {
      playCoinSound();
      setUserAnswer('');
      setShowHint(false);

      if (currentStep === TREASURE_HUNT_STEPS.length) {
        // Grand Final Chest
        playLevelUpSound();
        setChestOpened(true);
        setFeedback('🎉 UNBELIEVABLE! You opened the Grand Cosmic Sovereign Chest! (+100 Credits)');
        onAdvanceStep(currentStep + 1, activeStep.creditsReward);
      } else {
        setFeedback(`✓ Decoded successfully! Clue ${currentStep} solved (+${activeStep.creditsReward} Credits)`);
        onAdvanceStep(currentStep + 1, activeStep.creditsReward);
      }
    } else {
      playHitSound();
      setFeedback('❌ Inscription mismatch. Inspect the riddle and campus hint carefully!');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#170e2b] via-[#0f173d] to-[#071329] border border-purple-800/60 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🗺️</span>
              <h2 className="text-2xl font-black font-cinzel text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-indigo-200 to-amber-300">
                MULTIVERSE CAMPUS TREASURE EXPEDITION
              </h2>
            </div>
            <p className="text-xs text-slate-300 max-w-xl">
              Follow ancient coordinates charted across the GDG campus server room, the clock tower,
              and enchanted spires. Solve progressive cyphers to unlock the Golden Sovereign Vault!
            </p>
          </div>

          <div className="bg-[#0b102b] border border-purple-700/50 rounded-xl px-4 py-2 text-right">
            <span className="text-[10px] font-orbitron text-purple-300 block uppercase">
              Current Waypoint
            </span>
            <span className="text-base font-bold font-mono-code text-amber-300">
              {isFinalStepCompleted ? 'EXPEDITION MASTERED' : `Step ${currentStep} / ${TREASURE_HUNT_STEPS.length}`}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Map Visualizer */}
      <div className="bg-[#0b0f24] border border-purple-900/60 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="text-xs font-orbitron text-slate-400 mb-3 flex items-center justify-between">
          <span>MULTIVERSE COORDINATE PROJECTION</span>
          <span className="text-[10px] text-purple-400 font-mono-code">5 Sacred Nodes</span>
        </div>

        {/* Map Grid Container */}
        <div className="relative w-full h-52 sm:h-64 bg-[#070a1a] rounded-xl border border-purple-950 overflow-hidden">
          {/* Subtle grid lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:24px_24px]" />

          {/* Golden Path connecting nodes */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {TREASURE_HUNT_STEPS.map((step, idx) => {
              if (idx === 0) return null;
              const prev = TREASURE_HUNT_STEPS[idx - 1];
              return (
                <line
                  key={idx}
                  x1={`${prev.coords.x}%`}
                  y1={`${prev.coords.y}%`}
                  x2={`${step.coords.x}%`}
                  y2={`${step.coords.y}%`}
                  stroke={currentStep > step.step ? '#a855f7' : 'rgba(75, 85, 99, 0.4)'}
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
              );
            })}
          </svg>

          {/* Node Markers */}
          {TREASURE_HUNT_STEPS.map((step) => {
            const isCompleted = currentStep > step.step;
            const isCurrent = currentStep === step.step;

            return (
              <div
                key={step.step}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer"
                style={{ left: `${step.coords.x}%`, top: `${step.coords.y}%` }}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs font-orbitron transition-transform duration-300 ${
                    isCompleted
                      ? 'bg-emerald-600 text-white border-2 border-emerald-300 shadow-lg'
                      : isCurrent
                      ? 'bg-amber-500 text-slate-950 border-2 border-white scale-125 animate-pulse shadow-xl shadow-amber-500/40'
                      : 'bg-[#151c44] text-slate-500 border border-slate-700'
                  }`}
                >
                  {isCompleted ? '✓' : step.step}
                </div>
                <span className="text-[10px] font-orbitron text-purple-200 mt-1 bg-black/70 px-1.5 py-0.5 rounded border border-purple-900/50 whitespace-nowrap hidden sm:block">
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Clue Solver Card */}
      {!isFinalStepCompleted ? (
        <div className="max-w-2xl mx-auto bg-[#0b0f24] border-2 border-purple-800/70 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-3">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-orbitron uppercase tracking-wider font-bold bg-purple-950 text-purple-300 border border-purple-800/60">
              STEP {activeStep.step}: {activeStep.realm}
            </span>
            <span className="text-xs font-mono-code font-bold text-amber-400">
              +{activeStep.creditsReward} CREDITS
            </span>
          </div>

          <h3 className="text-xl font-bold font-cinzel text-white mb-2">
            {activeStep.title}
          </h3>

          <div className="bg-[#12183b] p-4 rounded-xl border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed mb-4 italic font-serif">
            "{activeStep.riddle}"
          </div>

          <div className="text-xs text-purple-300 font-mono-code mb-4">
            🔎 Clue Inscription: {activeStep.clue}
          </div>

          {showHint && (
            <div className="mb-4 p-3 bg-purple-950/40 border border-purple-500/40 rounded-xl text-xs text-purple-200 font-mono-code">
              💡 Hint: {activeStep.solutionHint}
            </div>
          )}

          {feedback && (
            <div
              className={`mb-4 p-3 rounded-xl text-xs font-orbitron text-center border ${
                feedback.includes('✓') || feedback.includes('UNBELIEVABLE')
                  ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                  : 'bg-rose-950/60 border-rose-500 text-rose-300'
              }`}
            >
              {feedback}
            </div>
          )}

          <form onSubmit={handleSubmitAnswer} className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Enter solution word or number..."
                className="flex-1 bg-[#12183b] border border-purple-900/60 rounded-xl px-4 py-2.5 text-xs text-white uppercase font-mono-code tracking-wider focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-orbitron font-bold text-xs rounded-xl shadow cursor-pointer"
              >
                UNLOCK
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                playClickSound();
                setShowHint(!showHint);
              }}
              className="text-[11px] text-purple-400 hover:text-purple-300 underline font-mono-code cursor-pointer"
            >
              {showHint ? 'Hide Hint' : 'Need a Clue Hint?'}
            </button>
          </form>
        </div>
      ) : (
        <div className="max-w-md mx-auto bg-gradient-to-br from-amber-950/80 via-[#141233] to-[#0b0f24] border-2 border-amber-500 rounded-2xl p-8 text-center shadow-2xl">
          <div className="text-5xl mb-2 animate-bounce">👑</div>
          <h3 className="text-2xl font-black font-cinzel text-amber-300 mb-2">
            SOVEREIGN VAULT CONQUERED!
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed mb-6">
            You deciphered all five coordinates of the CreditVerse campus multiverse. All treasure
            rewards have been securely transferred to your student balance!
          </p>
          <div className="p-3 bg-black/40 border border-amber-500/50 rounded-xl font-orbitron text-xs text-amber-300 font-bold">
            🏆 Title Unlocked: "Grand Multiverse Sovereign"
          </div>
        </div>
      )}
    </div>
  );
};
