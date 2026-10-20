import React, { useState } from 'react';
import { playClickSound, playCoinSound, playHitSound, playLevelUpSound } from '../../utils/audio';

interface IndianCartoonViewProps {
  onEarnCredits: (credits: number, xp: number, reason: string) => void;
}

export const IndianCartoonView: React.FC<IndianCartoonViewProps> = ({ onEarnCredits }) => {
  const [activeGadget, setActiveGadget] = useState<string>('cycle');
  const [riddleSolved, setRiddleSolved] = useState(false);
  const [selectedRiddleOpt, setSelectedRiddleOpt] = useState<number | null>(null);

  const GADGETS = [
    {
      id: 'cycle',
      name: 'Sonic Turbo Cycle',
      hero: 'Hero Shiva',
      icon: '🚲',
      description: 'Can fly over rivers, climb vertical skyscraper walls, and dispenses mango candies!',
      ability: '+20% Speed in arcade challenges',
    },
    {
      id: 'sun_wand',
      name: 'Solar Wand of Sun City',
      hero: 'Prince Rudra',
      icon: '✨',
      description: 'Harnesses sunlight to cast illusions, blinding goofy villains and lighting dark dungeons.',
      ability: '+15 Credits on logic puzzles',
    },
    {
      id: 'propeller_hat',
      name: 'Dr. Jhatka Fly-O-Matic',
      hero: 'Eccentric Inventions',
      icon: '🚁',
      description: 'Flies upward at 80 km/h, but occasionally reverses direction unexpectedly!',
      ability: 'Fun comical voice lines',
    },
  ];

  const handleRiddleAnswer = (index: number) => {
    if (riddleSolved) return;
    playClickSound();
    setSelectedRiddleOpt(index);

    if (index === 1) {
      // Correct!
      playCoinSound();
      playLevelUpSound();
      setRiddleSolved(true);
      onEarnCredits(30, 80, 'Foiled Goofy Villain Trap in Vedas City!');
    } else {
      playHitSound();
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#291206] via-[#211107] to-[#0d122e] border border-orange-600/60 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">⚡</span>
              <h2 className="text-2xl font-black font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-200 to-yellow-300">
                VEDAS CITY & SUN REALM ADVENTURES
              </h2>
            </div>
            <p className="text-xs text-slate-300 max-w-xl">
              Hop onto Shiva's supersonic bicycle, cast solar magic with Rudra, and foil the hilarious
              schemes of goofy cartoon villains across town!
            </p>
          </div>

          <div className="bg-[#1a0e05] border border-orange-500/50 rounded-xl px-4 py-2 text-right">
            <span className="text-[10px] font-orbitron text-orange-300 block uppercase">
              Hero Alliance
            </span>
            <span className="text-sm font-bold font-orbitron text-amber-300">
              SHIVA & RUDRA TEAM-UP
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Gadget Workshop & Villain Showdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Gadget Workshop */}
        <div className="bg-[#0b0f24] border border-orange-950/80 rounded-2xl p-5 shadow-xl">
          <h3 className="text-base font-bold font-orbitron text-white mb-1 flex items-center gap-2">
            <span>🛠️</span>
            <span>Vedas City Hero Gadgets</span>
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Select high-tech gadgets crafted by Shiva and royal magicians.
          </p>

          <div className="space-y-3 mb-4">
            {GADGETS.map((g) => (
              <div
                key={g.id}
                onClick={() => {
                  playClickSound();
                  setActiveGadget(g.id);
                }}
                className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                  activeGadget === g.id
                    ? 'border-orange-500 bg-orange-950/40 shadow'
                    : 'border-slate-800 bg-[#12183b] hover:border-slate-700'
                }`}
              >
                <div className="text-3xl p-1 bg-black/40 rounded-xl border border-orange-500/30">
                  {g.icon}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="font-bold text-white text-xs font-orbitron">{g.name}</span>
                    <span className="text-[10px] text-orange-400 font-mono-code">{g.hero}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 mb-1">{g.description}</p>
                  <span className="text-[10px] text-amber-300 font-semibold font-orbitron">
                    ★ Perk: {g.ability}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Comical Villain Riddle Showdown */}
        <div className="bg-[#0b0f24] border border-orange-950/80 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold font-orbitron text-white flex items-center gap-2">
                <span>🦹</span>
                <span>The Goofy Villain Riddle</span>
              </h3>
              <span className="text-[10px] font-mono-code px-2 py-0.5 rounded font-bold bg-amber-950 text-amber-400 border border-amber-600">
                +30 CREDITS
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Villain Rangeela has locked the city bridge! Outsmart his funny riddle before his
              smoke machine explodes:
            </p>

            <div className="bg-[#170e06] border border-amber-900/60 rounded-xl p-4 mb-4 text-xs text-amber-200 leading-relaxed font-sans italic">
              "I have cities, but no houses. I have mountains, but no trees. I have water, but no
              fish. Shiva cannot pedal his bicycle across me, yet you can carry me in your pocket!
              What am I?"
            </div>

            <div className="space-y-2">
              {[
                'A Smartphone',
                'A Map',
                'A Video Game Disk',
                'A Drone Camera',
              ].map((opt, idx) => {
                let btnStyle = 'bg-[#12183b] border-slate-800 text-slate-200 hover:border-orange-500';
                if (selectedRiddleOpt !== null) {
                  if (idx === 1) {
                    btnStyle = 'bg-emerald-950 border-emerald-500 text-emerald-300 font-bold';
                  } else if (idx === selectedRiddleOpt) {
                    btnStyle = 'bg-rose-950 border-rose-500 text-rose-300';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleRiddleAnswer(idx)}
                    disabled={riddleSolved}
                    className={`w-full p-2.5 rounded-xl border text-left text-xs transition cursor-pointer flex justify-between ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    {riddleSolved && idx === 1 && (
                      <span className="text-emerald-400 font-bold">✓ Correct!</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {riddleSolved && (
            <div className="mt-4 bg-emerald-950/60 border border-emerald-500/50 rounded-xl p-3 text-xs text-emerald-300 font-orbitron text-center">
              🎉 Bridge Unlocked! Shiva pedaled across and saved Vedas City! (+30 CR)
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
