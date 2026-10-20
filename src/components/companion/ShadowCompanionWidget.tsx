import React, { useState } from 'react';
import { CompanionState, CompanionSkin } from '../../types/game';
import { COMPANION_SKINS } from '../../data/characters';
import { playCompanionChirp, playCoinSound } from '../../utils/audio';

interface ShadowCompanionWidgetProps {
  companion: CompanionState;
  onOpenDialogue: () => void;
  onSelectSkin: (skinId: string) => void;
  onAddBond: () => void;
  celebrating?: boolean;
}

export const ShadowCompanionWidget: React.FC<ShadowCompanionWidgetProps> = ({
  companion,
  onOpenDialogue,
  onSelectSkin,
  onAddBond,
  celebrating = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'skins'>('status');
  const [quoteBubble, setQuoteBubble] = useState<string | null>(null);

  const activeSkin: CompanionSkin =
    COMPANION_SKINS.find((s) => s.id === companion.activeSkinId) || COMPANION_SKINS[0];

  const QUOTES = [
    'Chirp! Your shadow grows sharper today, Hunter!',
    'Did someone say credits? I can smell the mana!',
    'Remember: S-Rank Hunters never skip their daily streak!',
    'I will guard your student wallet with my shadow claws!',
    'Paws ready, mana charged! Let’s conquer the next realm!',
  ];

  const handlePet = () => {
    playCompanionChirp();
    const randomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    setQuoteBubble(randomQuote);
    onAddBond();

    setTimeout(() => {
      setQuoteBubble(null);
    }, 3500);
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end">
      {/* Speech Bubble when petted or celebrating */}
      {(quoteBubble || celebrating) && (
        <div className="mb-2 max-w-xs bg-[#0f1738] border border-purple-500/70 rounded-2xl p-3 shadow-xl text-xs text-purple-200 animate-bounce font-sans relative">
          <div className="font-bold text-amber-300 flex items-center gap-1.5 mb-0.5 font-orbitron">
            <span>✨</span>
            <span>Kage</span>
          </div>
          <p>{celebrating ? 'WOOHOO! Massive credit rewards extracted, Hunter! 🎉' : quoteBubble}</p>
          {/* Arrow */}
          <div className="absolute -bottom-2 right-8 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-[#0f1738]" />
        </div>
      )}

      {/* Expanded Companion Drawer */}
      {isOpen && (
        <div className="mb-3 w-80 bg-[#0c102b] border border-purple-800/80 rounded-2xl p-4 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between pb-3 border-b border-purple-900/50 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">👾</span>
              <div>
                <h3 className="font-bold font-orbitron text-sm text-white">{companion.name}</h3>
                <span className="text-[10px] text-purple-400 font-mono-code">
                  Bond Lvl {Math.floor(companion.bondPoints / 10) + 1} ({companion.bondPoints} pts)
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg text-sm cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Tab Selector */}
          <div className="grid grid-cols-2 gap-1 bg-[#13193e] p-1 rounded-xl mb-3 text-xs font-orbitron">
            <button
              onClick={() => setActiveTab('status')}
              className={`py-1.5 rounded-lg transition cursor-pointer ${
                activeTab === 'status' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Status & Chat
            </button>
            <button
              onClick={() => setActiveTab('skins')}
              className={`py-1.5 rounded-lg transition cursor-pointer ${
                activeTab === 'skins' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Aura Skins
            </button>
          </div>

          {activeTab === 'status' ? (
            <div className="space-y-3 text-xs">
              <div className="bg-[#12183b] p-3 rounded-xl border border-purple-950">
                <div className="text-[11px] text-slate-400 mb-1 font-orbitron">COMPANION PERK</div>
                <div className="text-purple-300 font-medium">
                  {activeSkin.name}: Emits a protective shadow shroud. Grants +10% daily streak bonus!
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handlePet}
                  className="flex-1 py-2.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-bold rounded-xl shadow font-orbitron flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>🐾</span>
                  <span>Pet Kage (+Bond)</span>
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onOpenDialogue();
                  }}
                  className="flex-1 py-2.5 bg-[#1e1b4b] hover:bg-[#2e2b6b] border border-purple-600/50 text-purple-200 font-bold rounded-xl font-orbitron flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>💬</span>
                  <span>Talk with Kage</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {COMPANION_SKINS.map((skin) => {
                const isUnlocked = companion.unlockedSkinIds.includes(skin.id);
                const isActive = companion.activeSkinId === skin.id;

                return (
                  <div
                    key={skin.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition ${
                      isActive
                        ? 'border-purple-400 bg-purple-950/40'
                        : 'border-slate-800 bg-[#12183b]'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block"
                          style={{ backgroundColor: skin.glowColor }}
                        />
                        {skin.name}
                      </div>
                      <div className="text-[10px] text-slate-400">{skin.description}</div>
                    </div>

                    <div>
                      {isActive ? (
                        <span className="px-2 py-1 bg-purple-500/20 text-purple-300 font-bold rounded-md text-[10px] font-orbitron">
                          EQUIPPED
                        </span>
                      ) : isUnlocked ? (
                        <button
                          onClick={() => {
                            playCoinSound();
                            onSelectSkin(skin.id);
                          }}
                          className="px-2.5 py-1 bg-purple-700 hover:bg-purple-600 text-white font-bold rounded-md text-[10px] font-orbitron cursor-pointer"
                        >
                          EQUIP
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-mono-code">LOCKED</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Floating Mini Sprite Avatar Button */}
      <button
        onClick={() => {
          if (!isOpen) {
            handlePet();
          }
          setIsOpen(!isOpen);
        }}
        className="relative group p-2 rounded-full cursor-pointer focus:outline-none transition-transform active:scale-95"
        aria-label="Open Shadow Companion Kage"
      >
        {/* Glowing Aura Ring */}
        <div
          className="absolute inset-0 rounded-full blur-md opacity-75 group-hover:opacity-100 transition animate-pulse-subtle"
          style={{ backgroundColor: activeSkin.glowColor }}
        />

        {/* Sprite Orb Container */}
        <div className="relative w-14 h-14 bg-[#0a0d24] border-2 border-purple-400/80 rounded-full flex items-center justify-center shadow-xl overflow-hidden">
          {/* Animated Sprite Graphics */}
          <div className="relative flex flex-col items-center justify-center">
            {/* Horns / Ears */}
            <div className="flex gap-4 -mb-1">
              <div
                className="w-2 h-3.5 rounded-t-full transform -rotate-12"
                style={{ backgroundColor: activeSkin.glowColor }}
              />
              <div
                className="w-2 h-3.5 rounded-t-full transform rotate-12"
                style={{ backgroundColor: activeSkin.glowColor }}
              />
            </div>

            {/* Face Core */}
            <div className="w-9 h-8 bg-[#181136] rounded-2xl flex items-center justify-center gap-2 border border-purple-500/30">
              {/* Glowing Eyes */}
              <div
                className="w-2 h-2 rounded-full animate-ping"
                style={{ backgroundColor: activeSkin.eyeColor }}
              />
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: activeSkin.eyeColor }}
              />
            </div>

            {/* Tiny mouth smile */}
            <div className="w-2 h-0.5 bg-purple-400/80 rounded-full -mt-1" />
          </div>
        </div>

        {/* Status Notification Dot */}
        <div className="absolute top-1 right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-[#060814] rounded-full animate-bounce" />
      </button>
    </div>
  );
};
