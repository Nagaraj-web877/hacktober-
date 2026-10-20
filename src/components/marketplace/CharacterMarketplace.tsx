import React, { useState } from 'react';
import { Character, CharacterRarity, WorldId } from '../../types/game';
import { INITIAL_CHARACTERS } from '../../data/characters';
import { validatePurchase } from '../../game/economy';
import { playCoinSound, playLevelUpSound, playClickSound } from '../../utils/audio';

interface CharacterMarketplaceProps {
  unlockedCharacterIds: string[];
  favoriteCharacterId: string;
  credits: number;
  onUnlockCharacter: (character: Character) => void;
  onSetFavorite: (characterId: string) => void;
  onOpenDialogue: (character: Character) => void;
}

export const CharacterMarketplace: React.FC<CharacterMarketplaceProps> = ({
  unlockedCharacterIds,
  favoriteCharacterId,
  credits,
  onUnlockCharacter,
  onSetFavorite,
  onOpenDialogue,
}) => {
  const [selectedRarity, setSelectedRarity] = useState<string>('all');
  const [selectedWorld, setSelectedWorld] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewCharacter, setPreviewCharacter] = useState<Character | null>(null);
  const [confirmUnlockChar, setConfirmUnlockChar] = useState<Character | null>(null);
  const [unlockError, setUnlockError] = useState<string | null>(null);

  const filteredCharacters = INITIAL_CHARACTERS.filter((char) => {
    const matchesRarity = selectedRarity === 'all' || char.rarity === selectedRarity;
    const matchesWorld = selectedWorld === 'all' || char.worldId === selectedWorld;
    const matchesSearch =
      char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      char.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      char.universe.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRarity && matchesWorld && matchesSearch;
  });

  const getRarityBadge = (rarity: CharacterRarity) => {
    switch (rarity) {
      case 'mythic':
        return 'bg-gradient-to-r from-amber-500 to-rose-500 text-white border-amber-300';
      case 'legendary':
        return 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white border-yellow-300';
      case 'epic':
        return 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-400';
      case 'rare':
        return 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-400';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const handleConfirmUnlock = () => {
    if (!confirmUnlockChar) return;
    const validation = validatePurchase(credits, confirmUnlockChar.price);
    if (!validation.allowed) {
      setUnlockError(validation.error || 'Insufficient credits');
      return;
    }

    playLevelUpSound();
    onUnlockCharacter(confirmUnlockChar);
    setConfirmUnlockChar(null);
    setUnlockError(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Filter & Search Hub */}
      <div className="bg-[#0b0f24] border border-purple-900/60 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-indigo-200 to-cyan-300">
              MULTIVERSE CHARACTER MARKETPLACE
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Unlock iconic heroes, companions, and mentors from Anime, Magic, Mystery, and Cinema.
            </p>
          </div>

          {/* Current Credit Display */}
          <div className="bg-[#12183b] border border-amber-500/40 rounded-xl px-4 py-2 flex items-center gap-2.5 shadow">
            <span className="text-xl">🪙</span>
            <div>
              <div className="text-[10px] font-orbitron text-slate-400 uppercase">Your Balance</div>
              <div className="text-base font-bold font-mono-code text-amber-300 tabular-nums">
                {credits.toLocaleString()} Credits
              </div>
            </div>
          </div>
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-purple-950">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search characters, abilities, or universes..."
            className="flex-1 min-w-[200px] bg-[#12183b] border border-purple-900/50 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />

          <select
            value={selectedRarity}
            onChange={(e) => setSelectedRarity(e.target.value)}
            className="bg-[#12183b] border border-purple-900/50 rounded-xl px-3 py-2 text-xs text-purple-200 focus:outline-none focus:border-purple-500 cursor-pointer font-orbitron"
          >
            <option value="all">All Rarities</option>
            <option value="common">Common</option>
            <option value="rare">Rare</option>
            <option value="epic">Epic</option>
            <option value="legendary">Legendary</option>
            <option value="mythic">Mythic</option>
          </select>

          <select
            value={selectedWorld}
            onChange={(e) => setSelectedWorld(e.target.value)}
            className="bg-[#12183b] border border-purple-900/50 rounded-xl px-3 py-2 text-xs text-purple-200 focus:outline-none focus:border-purple-500 cursor-pointer font-orbitron"
          >
            <option value="all">All Universes</option>
            <option value="anime">Anime Realm</option>
            <option value="magical">Magical Academy</option>
            <option value="mystery">Supernatural Mystery</option>
            <option value="cartoon">Indian Cartoon</option>
            <option value="cinema">Meme & Cinema</option>
          </select>
        </div>
      </div>

      {/* Character Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {filteredCharacters.map((char) => {
          const isUnlocked = unlockedCharacterIds.includes(char.id) || char.price === 0;
          const isFavorite = favoriteCharacterId === char.id;

          return (
            <div
              key={char.id}
              className={`bg-[#0b0f24] rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden relative group hover:-translate-y-1 ${
                isUnlocked
                  ? 'border-purple-700/60 shadow-lg shadow-purple-950/40'
                  : 'border-slate-800 opacity-90 hover:opacity-100 hover:border-slate-700'
              }`}
            >
              {/* Card Header & Avatar Banner */}
              <div
                className={`h-28 bg-gradient-to-br ${char.bannerColor} relative p-3 flex items-center justify-center overflow-hidden`}
              >
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

                {/* Favorite Star */}
                {isUnlocked && (
                  <button
                    onClick={() => {
                      playClickSound();
                      onSetFavorite(char.id);
                    }}
                    className={`absolute top-2.5 right-2.5 p-1.5 rounded-lg text-sm transition cursor-pointer ${
                      isFavorite
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-black/40 text-slate-400 hover:text-amber-300'
                    }`}
                    title={isFavorite ? 'Active Favorite Hero' : 'Set as Favorite'}
                  >
                    ★
                  </button>
                )}

                {/* Avatar Icon */}
                <div
                  className={`w-16 h-16 rounded-2xl bg-black/50 border-2 flex items-center justify-center text-3xl shadow-xl transition-transform group-hover:scale-105 ${
                    isUnlocked ? 'border-purple-400' : 'border-slate-600 grayscale'
                  }`}
                  style={{ borderColor: isUnlocked ? char.glowColor : undefined }}
                >
                  {char.avatarIcon}
                </div>

                {/* Rarity Tag */}
                <span
                  className={`absolute bottom-2 left-3 px-2 py-0.5 rounded text-[10px] font-orbitron font-bold uppercase tracking-wider border ${getRarityBadge(
                    char.rarity
                  )}`}
                >
                  {char.rarity}
                </span>

                {/* Lock Status overlay if locked */}
                {!isUnlocked && (
                  <span className="absolute bottom-2 right-3 text-[10px] bg-slate-900/90 text-slate-300 px-2 py-0.5 rounded font-mono-code border border-slate-700">
                    🔒 LOCKED
                  </span>
                )}
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold font-orbitron text-white leading-snug group-hover:text-purple-300 transition">
                    {char.name}
                  </h3>
                  <div className="text-[11px] text-purple-400 font-mono-code mb-2">
                    {char.title} · {char.universe}
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                    {char.bio}
                  </p>

                  {/* Character Stats Bars */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-orbitron mb-3 bg-[#111638] p-2 rounded-xl border border-slate-800">
                    <div className="flex justify-between text-rose-300">
                      <span>STR</span>
                      <span className="font-mono-code font-bold">{char.stats.str}</span>
                    </div>
                    <div className="flex justify-between text-cyan-300">
                      <span>INT</span>
                      <span className="font-mono-code font-bold">{char.stats.int}</span>
                    </div>
                    <div className="flex justify-between text-emerald-300">
                      <span>AGI</span>
                      <span className="font-mono-code font-bold">{char.stats.agi}</span>
                    </div>
                    <div className="flex justify-between text-amber-300">
                      <span>FOC</span>
                      <span className="font-mono-code font-bold">{char.stats.foc}</span>
                    </div>
                  </div>
                </div>

                {/* Actions & Price */}
                <div className="pt-2 border-t border-purple-950 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      playClickSound();
                      setPreviewCharacter(char);
                    }}
                    className="py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-orbitron transition cursor-pointer"
                  >
                    Inspect
                  </button>

                  {isUnlocked ? (
                    <button
                      onClick={() => {
                        playClickSound();
                        onOpenDialogue(char);
                      }}
                      className="flex-1 py-1.5 px-3 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white rounded-lg text-xs font-orbitron font-bold transition shadow cursor-pointer text-center"
                    >
                      💬 Chat
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        playClickSound();
                        setConfirmUnlockChar(char);
                        setUnlockError(null);
                      }}
                      className="flex-1 py-1.5 px-3 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white rounded-lg text-xs font-orbitron font-bold transition shadow cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>Unlock</span>
                      <span className="font-mono-code font-extrabold">{char.price} CR</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* PREVIEW MODAL */}
      {previewCharacter && (
        <div className="fixed inset-0 z-50 bg-[#060814]/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-[#0b0f24] border-2 border-purple-700 rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setPreviewCharacter(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg p-1"
            >
              ✕
            </button>

            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-purple-950/80 border-2 border-purple-500/70 flex items-center justify-center text-4xl shadow">
                {previewCharacter.avatarIcon}
              </div>
              <div>
                <h3 className="text-xl font-bold font-orbitron text-white">
                  {previewCharacter.name}
                </h3>
                <div className="text-xs text-purple-400 font-mono-code">
                  {previewCharacter.title} · {previewCharacter.universe}
                </div>
                <span
                  className={`mt-1 inline-block px-2 py-0.5 rounded text-[10px] font-orbitron font-bold uppercase border ${getRarityBadge(
                    previewCharacter.rarity
                  )}`}
                >
                  {previewCharacter.rarity}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs mb-6">
              <div className="bg-[#12183b] p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] font-orbitron text-slate-400 block mb-1">
                  BACKSTORY
                </span>
                <p className="text-slate-300 leading-relaxed">{previewCharacter.bio}</p>
              </div>

              <div className="bg-[#12183b] p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] font-orbitron text-slate-400 block mb-1">
                  SIGNATURE CATCHPHRASE
                </span>
                <p className="text-amber-300 italic font-medium">
                  "{previewCharacter.signatureCatchphrase}"
                </p>
              </div>

              <div className="bg-[#12183b] p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] font-orbitron text-slate-400 block mb-1">
                  SPECIAL ABILITY
                </span>
                <p className="text-purple-300 font-semibold">{previewCharacter.specialAbility}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setPreviewCharacter(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-orbitron text-xs rounded-xl cursor-pointer"
              >
                Close
              </button>
              {unlockedCharacterIds.includes(previewCharacter.id) ? (
                <button
                  onClick={() => {
                    const c = previewCharacter;
                    setPreviewCharacter(null);
                    onOpenDialogue(c);
                  }}
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-orbitron text-xs font-bold rounded-xl cursor-pointer"
                >
                  Chat with {previewCharacter.name}
                </button>
              ) : (
                <button
                  onClick={() => {
                    const c = previewCharacter;
                    setPreviewCharacter(null);
                    setConfirmUnlockChar(c);
                  }}
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 text-white font-orbitron text-xs font-bold rounded-xl cursor-pointer"
                >
                  Unlock for {previewCharacter.price} Credits
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM UNLOCK MODAL */}
      {confirmUnlockChar && (
        <div className="fixed inset-0 z-50 bg-[#060814]/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#0b0f24] border-2 border-amber-500/80 rounded-2xl p-6 shadow-2xl text-center">
            <div className="text-4xl mb-2">{confirmUnlockChar.avatarIcon}</div>
            <h3 className="text-xl font-bold font-orbitron text-white mb-1">
              Unlock {confirmUnlockChar.name}?
            </h3>
            <p className="text-xs text-slate-300 mb-4">
              This will deduct{' '}
              <span className="text-amber-400 font-bold font-mono-code">
                {confirmUnlockChar.price} Credits
              </span>{' '}
              from your student wallet. You will gain full access to their interactive dialogue,
              special lore, and passive perk.
            </p>

            {unlockError && (
              <div className="mb-4 text-xs font-orbitron text-rose-400 bg-rose-950/60 border border-rose-600/50 rounded-lg p-2.5 font-bold">
                ⚠️ {unlockError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmUnlockChar(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-orbitron text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmUnlock}
                className="flex-1 py-2.5 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 text-white font-orbitron text-xs font-bold rounded-xl shadow-lg cursor-pointer"
              >
                Confirm Unlock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
