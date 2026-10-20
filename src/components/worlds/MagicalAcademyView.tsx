import React, { useState } from 'react';
import { SPELL_INGREDIENTS, MAGICAL_RECIPES } from '../../data/gameData';
import { SpellIngredient, MagicalRecipe } from '../../types/game';
import { playMagicChime, playCoinSound, playHitSound } from '../../utils/audio';

interface MagicalAcademyViewProps {
  currentHouseId: 'ignis' | 'lumina' | 'noctis' | 'terra';
  onSelectHouse: (houseId: 'ignis' | 'lumina' | 'noctis' | 'terra') => void;
  housePoints: { ignis: number; lumina: number; noctis: number; terra: number };
  onBrewPotion: (recipe: MagicalRecipe) => void;
}

export const MagicalAcademyView: React.FC<MagicalAcademyViewProps> = ({
  currentHouseId,
  onSelectHouse,
  housePoints,
  onBrewPotion,
}) => {
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [cauldronFeedback, setCauldronFeedback] = useState<string | null>(null);
  const [sortingModal, setSortingModal] = useState(false);

  const HOUSES = [
    {
      id: 'ignis' as const,
      name: 'Ignis Gryphon',
      color: '#f97316',
      badge: '🦁',
      desc: 'Bravery, daring action, and fiery determination.',
    },
    {
      id: 'lumina' as const,
      name: 'Lumina Owl',
      color: '#38bdf8',
      badge: '🦉',
      desc: 'Wisdom, deep research, and intellectual mastery.',
    },
    {
      id: 'noctis' as const,
      name: 'Noctis Serpent',
      color: '#a855f7',
      badge: '🐍',
      desc: 'Ambition, strategic cunning, and infinite adaptability.',
    },
    {
      id: 'terra' as const,
      name: 'Terra Badger',
      color: '#eab308',
      badge: '🦡',
      desc: 'Loyalty, tireless craftsmanship, and steadfast teamwork.',
    },
  ];

  const toggleIngredient = (id: string) => {
    setCauldronFeedback(null);
    if (selectedIngredients.includes(id)) {
      setSelectedIngredients(selectedIngredients.filter((i) => i !== id));
    } else {
      if (selectedIngredients.length >= 3) return;
      setSelectedIngredients([...selectedIngredients, id]);
    }
  };

  const handleBrew = () => {
    // Check recipes
    const match = MAGICAL_RECIPES.find((recipe) => {
      if (recipe.requiredIngredients.length !== selectedIngredients.length) return false;
      return recipe.requiredIngredients.every((ing) => selectedIngredients.includes(ing));
    });

    if (match) {
      playMagicChime();
      playCoinSound();
      setCauldronFeedback(`✨ Success! Brewed ${match.name}! (+${match.rewardCredits} CR & +${match.housePoints} House Pts)`);
      onBrewPotion(match);
      setSelectedIngredients([]);
    } else {
      playHitSound();
      setCauldronFeedback('💨 The mixture fizzled into gray smoke! Try matching ingredients from your spellbook.');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Academy Banner */}
      <div className="bg-gradient-to-r from-[#1c1136] via-[#150f2f] to-[#0c0d24] border border-purple-800/60 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🏰</span>
              <h2 className="text-2xl font-black font-cinzel text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-amber-200 to-white">
                MAGICAL ACADEMY OF LUMINA
              </h2>
            </div>
            <p className="text-xs text-slate-300 max-w-xl">
              Choose your allegiance in the Great Sorting Ceremony, earn house points, and brew
              enchanted potions inside the Alchemical Laboratory.
            </p>
          </div>

          {/* Current House Emblem */}
          <div className="flex items-center gap-3 bg-[#0d122e] p-3 rounded-xl border border-purple-700/50 shadow">
            <span className="text-3xl">
              {HOUSES.find((h) => h.id === currentHouseId)?.badge}
            </span>
            <div>
              <div className="text-[10px] font-orbitron uppercase text-slate-400">YOUR HOUSE</div>
              <div className="text-sm font-bold font-cinzel text-amber-300">
                {HOUSES.find((h) => h.id === currentHouseId)?.name}
              </div>
              <button
                onClick={() => setSortingModal(true)}
                className="text-[10px] text-purple-400 hover:text-purple-300 underline font-orbitron cursor-pointer"
              >
                Change House
              </button>
            </div>
          </div>
        </div>

        {/* House Points Leaderboard */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-purple-900/50">
          {HOUSES.map((h) => (
            <div
              key={h.id}
              className={`p-3 rounded-xl border flex items-center justify-between ${
                h.id === currentHouseId
                  ? 'border-amber-400 bg-purple-950/40'
                  : 'border-slate-800 bg-[#0e1230]'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{h.badge}</span>
                <div>
                  <div className="text-[11px] font-bold text-white font-cinzel">{h.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono-code">
                    {housePoints[h.id]} pts
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alchemical Laboratory Interactive Cauldron */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Recipe Book */}
        <div className="bg-[#0b0f24] border border-purple-900/60 rounded-2xl p-5 shadow-xl">
          <h3 className="text-base font-bold font-cinzel text-amber-300 mb-1 flex items-center gap-2">
            <span>📜</span>
            <span>Ancient Grimoire Formulas</span>
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Combine exact ingredients into the bubbling cauldron to brew legendary draughts.
          </p>

          <div className="space-y-3">
            {MAGICAL_RECIPES.map((recipe) => (
              <div
                key={recipe.id}
                className="p-3 bg-[#11173d] border border-purple-950 rounded-xl text-xs"
              >
                <div className="font-bold text-white mb-1 font-cinzel flex justify-between">
                  <span>{recipe.name}</span>
                  <span className="text-amber-400 font-mono-code font-bold">
                    +{recipe.rewardCredits} CR
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] mb-2">{recipe.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {recipe.requiredIngredients.map((ingId) => {
                    const ing = SPELL_INGREDIENTS.find((i) => i.id === ingId);
                    return (
                      <span
                        key={ingId}
                        className="px-2 py-0.5 rounded text-[10px] font-orbitron bg-purple-950 border border-purple-800/60 text-purple-200"
                      >
                        {ing?.symbol} {ing?.name}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center: The Cauldron Station */}
        <div className="lg:col-span-2 bg-[#0b0f24] border border-purple-900/60 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold font-cinzel text-white flex items-center gap-2">
                <span>🧪</span>
                <span>The Lumina Cauldron</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono-code">
                Slots Filled: {selectedIngredients.length} / 2
              </span>
            </div>

            {/* Visual Cauldron representation */}
            <div className="w-48 h-48 mx-auto my-4 rounded-full bg-gradient-to-b from-[#2e1065] to-[#090d1f] border-4 border-purple-500/80 shadow-2xl relative flex flex-col items-center justify-center overflow-hidden">
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-purple-600/40 to-transparent animate-pulse" />
              <div className="text-4xl animate-bounce">
                {selectedIngredients.length === 0 ? '✨' : '🫧'}
              </div>
              <div className="text-xs font-orbitron font-bold text-purple-200 mt-2">
                {selectedIngredients.length === 0
                  ? 'Cauldron Ready'
                  : `${selectedIngredients.length} Reagents Mixed`}
              </div>
            </div>

            {/* Feedback notification */}
            {cauldronFeedback && (
              <div
                className={`p-3 rounded-xl text-xs font-orbitron text-center mb-4 border ${
                  cauldronFeedback.includes('Success')
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                    : 'bg-rose-950/60 border-rose-500 text-rose-300'
                }`}
              >
                {cauldronFeedback}
              </div>
            )}

            {/* Ingredient Selection Shelf */}
            <div className="text-xs font-orbitron text-slate-400 mb-2">REAGENT APOTHECARY</div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-6">
              {SPELL_INGREDIENTS.map((ing) => {
                const isSelected = selectedIngredients.includes(ing.id);
                return (
                  <button
                    key={ing.id}
                    onClick={() => toggleIngredient(ing.id)}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center transition cursor-pointer ${
                      isSelected
                        ? 'border-purple-400 bg-purple-900/60 text-white scale-105 shadow'
                        : 'border-slate-800 bg-[#12183b] text-slate-300 hover:border-purple-700'
                    }`}
                  >
                    <span className="text-2xl mb-1">{ing.symbol}</span>
                    <span className="text-[10px] font-orbitron text-center leading-tight">
                      {ing.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Brew CTA */}
          <button
            onClick={handleBrew}
            disabled={selectedIngredients.length === 0}
            className="w-full py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 disabled:opacity-40 text-white font-orbitron font-bold rounded-xl shadow-lg cursor-pointer"
          >
            STIR CAULDRON & TRANSMUTE POTION
          </button>
        </div>
      </div>

      {/* SORTING CEREMONY MODAL */}
      {sortingModal && (
        <div className="fixed inset-0 z-50 bg-[#060814]/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-[#0b0f24] border-2 border-purple-700 rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setSortingModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              ✕
            </button>
            <div className="text-center mb-6">
              <span className="text-4xl">🎩</span>
              <h3 className="text-xl font-bold font-cinzel text-white mt-1">
                The Great Sorting Ceremony
              </h3>
              <p className="text-xs text-slate-300">
                Align your spirit with one of the four legendary student houses of CreditVerse.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {HOUSES.map((h) => (
                <button
                  key={h.id}
                  onClick={() => {
                    playMagicChime();
                    onSelectHouse(h.id);
                    setSortingModal(false);
                  }}
                  className={`p-4 rounded-xl border text-left transition cursor-pointer ${
                    currentHouseId === h.id
                      ? 'border-amber-400 bg-purple-950/60 shadow'
                      : 'border-slate-800 bg-[#12183b] hover:border-purple-600'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{h.badge}</span>
                    <span className="font-bold font-cinzel text-white text-sm">{h.name}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{h.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
