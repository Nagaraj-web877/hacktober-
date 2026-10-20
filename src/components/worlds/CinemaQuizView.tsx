import React, { useState } from 'react';
import { TRIVIA_QUESTIONS } from '../../data/gameData';
import { TriviaQuestion } from '../../types/game';
import { playCoinSound, playHitSound, playLevelUpSound, playClickSound } from '../../utils/audio';

interface CinemaQuizViewProps {
  onEarnCredits: (credits: number, xp: number, reason: string) => void;
}

export const CinemaQuizView: React.FC<CinemaQuizViewProps> = ({ onEarnCredits }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);

  const filteredQuestions = TRIVIA_QUESTIONS.filter((q) => {
    if (selectedCategory === 'all') return true;
    return q.category === selectedCategory;
  });

  const currentQuestion: TriviaQuestion =
    filteredQuestions[currentIndex % filteredQuestions.length];

  const handleSelectOption = (index: number) => {
    if (isAnswered) return;
    playClickSound();
    setSelectedAnswer(index);
    setIsAnswered(true);
    setTotalAnswered((prev) => prev + 1);

    const isCorrect = index === currentQuestion.correctAnswerIndex;
    if (isCorrect) {
      playCoinSound();
      setCorrectCount((prev) => prev + 1);
      onEarnCredits(currentQuestion.creditsReward, 25, `Cinema Quiz: ${currentQuestion.question.slice(0, 24)}...`);
    } else {
      playHitSound();
    }
  };

  const handleNext = () => {
    playClickSound();
    setSelectedAnswer(null);
    setIsAnswered(false);
    setCurrentIndex((prev) => (prev + 1) % filteredQuestions.length);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#211704] via-[#1a102b] to-[#0a0f26] border border-amber-600/60 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🎬</span>
              <h2 className="text-2xl font-black font-cinzel text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-white">
                MEME & CINEMA CITY
              </h2>
            </div>
            <p className="text-xs text-slate-300 max-w-xl">
              Celebrate Kannada cinema legends, iconic pan-Indian blockbusters, viral tech memes,
              and emoji riddle decoding. Prove your entertainment IQ and earn real credits!
            </p>
          </div>

          {/* Player Accuracy Score */}
          <div className="bg-[#14122e] border border-amber-500/50 rounded-xl px-4 py-2 text-right">
            <span className="text-[10px] font-orbitron text-amber-300 block uppercase">
              Quiz Accuracy
            </span>
            <span className="text-base font-bold font-mono-code text-white">
              {correctCount} / {totalAnswered} Correct
            </span>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-purple-900/50">
          {[
            { id: 'all', label: 'All Quizzes' },
            { id: 'kannada_cinema', label: 'Kannada Cinema (KGF, Kantara, Charlie)' },
            { id: 'indian_cinema', label: 'Indian Cinema & RRR' },
            { id: 'hollywood_cinema', label: 'Hollywood Classics' },
            { id: 'internet_meme', label: 'Dev & Internet Memes' },
            { id: 'gdg_tech', label: 'GDG Tech Trivia' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setCurrentIndex(0);
                setIsAnswered(false);
                setSelectedAnswer(null);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-orbitron transition cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'bg-[#12183b] text-slate-300 hover:text-white border border-purple-950'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Question Card */}
      <div className="max-w-2xl mx-auto bg-[#0b0f24] border-2 border-purple-800/70 rounded-2xl p-6 shadow-2xl relative">
        <div className="flex items-center justify-between mb-4">
          <span className="px-2.5 py-0.5 rounded text-[10px] font-orbitron uppercase tracking-wider font-bold bg-purple-950 text-purple-300 border border-purple-800/60">
            {currentQuestion.category.replace('_', ' ')}
          </span>
          <span className="text-xs font-mono-code font-bold text-amber-400">
            +{currentQuestion.creditsReward} Credits
          </span>
        </div>

        {/* Emoji Clue if present */}
        {currentQuestion.clueType === 'emoji' && currentQuestion.clueContent && (
          <div className="bg-[#12183b] border border-slate-800 rounded-xl p-4 text-center text-3xl mb-4 tracking-widest animate-pulse">
            {currentQuestion.clueContent}
          </div>
        )}

        <h3 className="text-lg font-bold font-sans text-white mb-6 leading-relaxed">
          {currentQuestion.question}
        </h3>

        {/* Options List */}
        <div className="space-y-3 mb-6">
          {currentQuestion.options.map((opt, idx) => {
            let btnClass = 'bg-[#12183b] border-purple-900/50 text-slate-200 hover:border-purple-500';

            if (isAnswered) {
              if (idx === currentQuestion.correctAnswerIndex) {
                btnClass = 'bg-emerald-950/80 border-emerald-500 text-emerald-300 font-bold';
              } else if (idx === selectedAnswer) {
                btnClass = 'bg-rose-950/80 border-rose-500 text-rose-300 font-bold';
              } else {
                btnClass = 'bg-[#0e122b] border-slate-800 text-slate-500 opacity-60';
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelectOption(idx)}
                disabled={isAnswered}
                className={`w-full p-3.5 rounded-xl border text-left text-xs sm:text-sm transition flex items-center justify-between cursor-pointer ${btnClass}`}
              >
                <span>{opt}</span>
                {isAnswered && idx === currentQuestion.correctAnswerIndex && (
                  <span className="text-emerald-400 font-bold font-mono-code">✓ Correct</span>
                )}
                {isAnswered && idx === selectedAnswer && idx !== currentQuestion.correctAnswerIndex && (
                  <span className="text-rose-400 font-bold font-mono-code">✗ Wrong</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Explanation & Next CTA */}
        {isAnswered && (
          <div className="space-y-4 pt-4 border-t border-purple-950">
            <div className="bg-[#12183b] p-3 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
              <span className="font-bold text-amber-300 block mb-0.5 font-orbitron">
                LORE EXPLANATION
              </span>
              {currentQuestion.explanation}
            </div>

            <button
              onClick={handleNext}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-orbitron font-bold rounded-xl shadow-lg cursor-pointer"
            >
              NEXT QUESTION →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
