import React, { useState } from 'react';
import { playClickSound, playCoinSound, playHitSound, playMagicChime } from '../../utils/audio';

interface SupernaturalMysteryViewProps {
  onCompleteMystery: (credits: number, xp: number) => void;
  mysteryCompleted: boolean;
}

export const SupernaturalMysteryView: React.FC<SupernaturalMysteryViewProps> = ({
  onCompleteMystery,
  mysteryCompleted,
}) => {
  // Clue 1: Radio Frequency Tuner
  const [frequency, setFrequency] = useState(70.0);
  const isFrequencyLocked = Math.abs(frequency - 84.5) < 0.3;

  // Clue 2: UV Flashlight toggle
  const [flashlightOn, setFlashlightOn] = useState(false);

  // Clue 3: Cypher Passcode input
  const [cipherInput, setCipherInput] = useState('');
  const [cipherSolved, setCipherSolved] = useState(false);
  const [cipherError, setCipherError] = useState(false);

  const handleVerifyCipher = () => {
    if (cipherInput.trim().toUpperCase() === 'HAWKINS' || cipherInput.trim().toUpperCase() === 'ELEVEN') {
      playCoinSound();
      setCipherSolved(true);
      setCipherError(false);
    } else {
      playHitSound();
      setCipherError(true);
    }
  };

  const allCluesResolved = isFrequencyLocked && cipherSolved;

  return (
    <div className="space-y-6 font-sans">
      {/* Atmosphere Header */}
      <div className="bg-gradient-to-r from-[#1f0a10] via-[#14081b] to-[#070b1a] border border-rose-900/60 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">📻</span>
              <h2 className="text-2xl font-black font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-purple-300 to-cyan-300">
                SUPERNATURAL MYSTERY: THE UNDERGROUND LAB
              </h2>
            </div>
            <p className="text-xs text-slate-300 max-w-xl">
              An alternate dimension rift has opened beneath the campus computer center. Tune the
              radio receiver, use the UV torch to reveal hidden symbols, and decode the terminal log.
            </p>
          </div>

          <div className="bg-[#120a1c] border border-rose-500/50 rounded-xl px-4 py-2 text-right">
            <span className="text-[10px] font-orbitron text-rose-300 block uppercase">
              Rift Status
            </span>
            <span className="text-sm font-bold font-mono-code text-white flex items-center gap-1.5 justify-end">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              {mysteryCompleted ? 'PORTAL SEALED' : 'ELECTROMAGNETIC SURGE'}
            </span>
          </div>
        </div>
      </div>

      {/* Clues Investigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Clue 1: Radio Receiver */}
        <div className="bg-[#0b0f24] border border-rose-950/80 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold font-orbitron text-white flex items-center gap-2">
                <span>📡</span>
                <span>Radio Frequency Lock</span>
              </h3>
              <span
                className={`text-[10px] font-mono-code px-2 py-0.5 rounded font-bold ${
                  isFrequencyLocked
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-600'
                    : 'bg-rose-950 text-rose-400'
                }`}
              >
                {isFrequencyLocked ? 'SIGNAL LOCKED' : 'STATIC NOISE'}
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Agent Eleven left a radio message. Tune the dial to{' '}
              <span className="text-rose-400 font-bold font-mono-code">84.5 MHz</span> to intercept.
            </p>

            <div className="bg-[#101533] p-4 rounded-xl border border-slate-800 text-center mb-4">
              <div className="text-3xl font-mono-code font-bold text-amber-300 tabular-nums mb-2">
                {frequency.toFixed(1)} MHz
              </div>
              <input
                type="range"
                min="60.0"
                max="108.0"
                step="0.5"
                value={frequency}
                onChange={(e) => {
                  playClickSound();
                  setFrequency(parseFloat(e.target.value));
                }}
                className="w-full accent-rose-500 cursor-pointer"
              />
            </div>
          </div>

          {isFrequencyLocked ? (
            <div className="bg-emerald-950/50 border border-emerald-500/50 rounded-xl p-3 text-xs text-emerald-300 font-mono-code leading-relaxed">
              📻 Decrypted Voice: "The password is the name of our eerie town: HAWKINS!"
            </div>
          ) : (
            <div className="text-[11px] text-slate-500 font-mono-code text-center italic">
              *Tuning antenna... Static hiss...*
            </div>
          )}
        </div>

        {/* Clue 2: UV Flashlight Evidence Board */}
        <div className="bg-[#0b0f24] border border-purple-950/80 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold font-orbitron text-white flex items-center gap-2">
                <span>🔦</span>
                <span>UV Evidence Board</span>
              </h3>
              <button
                onClick={() => {
                  playClickSound();
                  setFlashlightOn(!flashlightOn);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-orbitron font-bold transition cursor-pointer ${
                  flashlightOn ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {flashlightOn ? 'TORCH ON' : 'TORCH OFF'}
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Inspect the chalkboard with the UV blacklight to reveal invisible fluorescent ink.
            </p>

            <div
              className={`h-36 rounded-xl border flex flex-col items-center justify-center p-4 transition-all duration-300 relative overflow-hidden ${
                flashlightOn
                  ? 'bg-[#1e1346] border-cyan-400/80 shadow-lg shadow-cyan-500/20'
                  : 'bg-[#0a0d1f] border-slate-800'
              }`}
            >
              {flashlightOn ? (
                <div className="text-center animate-pulse">
                  <div className="text-cyan-300 font-mono-code font-bold text-sm tracking-widest mb-1">
                    [ INVISIBLE RIFT MAP ]
                  </div>
                  <div className="text-pink-400 font-mono-code text-xs">
                    "HAWKINS LAB - SECTOR 11 - GATE SECURE"
                  </div>
                </div>
              ) : (
                <span className="text-slate-600 text-xs font-mono-code">
                  *A seemingly blank black surface*
                </span>
              )}
            </div>
          </div>

          <div className="text-[11px] text-slate-400 font-mono-code mt-3">
            {flashlightOn ? '✓ Invisible coordinates uncovered!' : 'Toggle torch to inspect'}
          </div>
        </div>

        {/* Clue 3: Terminal Cipher Passcode */}
        <div className="bg-[#0b0f24] border border-indigo-950/80 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold font-orbitron text-white flex items-center gap-2">
                <span>💻</span>
                <span>Terminal Passcode</span>
              </h3>
              {cipherSolved && (
                <span className="text-[10px] font-mono-code bg-emerald-950 text-emerald-400 border border-emerald-600 px-2 py-0.5 rounded font-bold">
                  ACCEPTED
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Enter the recovered security codeword to seal the dimension breach.
            </p>

            <div className="space-y-2 mb-4">
              <input
                type="text"
                value={cipherInput}
                onChange={(e) => setCipherInput(e.target.value)}
                placeholder="Enter password (e.g. HAWKINS)..."
                disabled={cipherSolved}
                className="w-full bg-[#12183b] border border-purple-900/60 rounded-xl px-3 py-2 text-xs text-white uppercase font-mono-code tracking-wider focus:outline-none focus:border-rose-500"
              />

              {!cipherSolved && (
                <button
                  onClick={handleVerifyCipher}
                  className="w-full py-2 bg-gradient-to-r from-rose-700 to-purple-700 hover:from-rose-600 hover:to-purple-600 text-white font-orbitron font-bold text-xs rounded-xl cursor-pointer"
                >
                  TRANSMIT CIPHER
                </button>
              )}
            </div>

            {cipherError && (
              <div className="text-xs text-rose-400 font-mono-code text-center">
                Access Denied. Check the radio frequency voice clue!
              </div>
            )}
          </div>

          {cipherSolved && (
            <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-2.5 text-xs text-emerald-300 font-mono-code text-center">
              ✓ Mainframe unlocked!
            </div>
          )}
        </div>
      </div>

      {/* Grand Extraction Action */}
      <div className="bg-[#0b0f24] border border-purple-900/60 rounded-2xl p-6 text-center shadow-xl">
        <h3 className="text-lg font-bold font-orbitron text-white mb-1">
          DIMENSIONAL BREACH SEAL PROTOCOL
        </h3>
        <p className="text-xs text-slate-400 mb-4 max-w-md mx-auto">
          Once the radio is locked at 84.5 MHz and the terminal password is verified, trigger the
          rift seal to harvest 60 Credits and 180 XP!
        </p>

        {mysteryCompleted ? (
          <div className="text-xs font-orbitron font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/50 rounded-xl py-2.5 px-6 inline-block">
            ✓ The Upside Down Rift is Sealed! Credits awarded to your wallet.
          </div>
        ) : (
          <button
            onClick={() => {
              playMagicChime();
              playCoinSound();
              onCompleteMystery(60, 180);
            }}
            disabled={!allCluesResolved}
            className="py-3 px-8 bg-gradient-to-r from-rose-600 via-purple-600 to-cyan-600 hover:from-rose-500 hover:to-cyan-500 disabled:opacity-40 text-white font-orbitron font-bold text-xs rounded-xl shadow-lg cursor-pointer transform hover:scale-105 transition"
          >
            {allCluesResolved ? 'SEAL DIMENSION RIFT (+60 CREDITS)' : 'RESOLVE CLUES FIRST'}
          </button>
        )}
      </div>
    </div>
  );
};
