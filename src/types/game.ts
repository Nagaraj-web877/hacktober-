/**
 * Types and interfaces for CREDITVERSE.
 */

export type WorldId = 'anime' | 'magical' | 'mystery' | 'cartoon' | 'cinema' | 'gdgoc';

export type CharacterRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

export interface CharacterDialogueNode {
  id: string;
  speakerText: string;
  mood?: 'neutral' | 'intense' | 'proud' | 'playful' | 'mysterious';
  options: {
    label: string;
    nextNodeId?: string;
    action?: 'claim_secret_reward' | 'start_dungeon' | 'lore_reveal' | 'close';
    rewardCredits?: number;
    requiredLevel?: number;
  }[];
}

export interface Character {
  id: string;
  name: string;
  title: string;
  universe: 'Anime Realm' | 'Magical Academy' | 'Supernatural Mystery' | 'Indian Cartoon' | 'Meme & Cinema';
  worldId: WorldId;
  rarity: CharacterRarity;
  price: number;
  unlockedByDefault?: boolean;
  avatarIcon: string;
  bannerColor: string;
  glowColor: string;
  stats: {
    str: number;
    int: number;
    agi: number;
    foc: number;
  };
  bio: string;
  signatureCatchphrase: string;
  specialAbility: string;
  dialogueGreeting: string;
  dialogueTree: Record<string, CharacterDialogueNode>;
  voicePitch: number; // for Web Speech pitch modulation
}

export interface CompanionSkin {
  id: string;
  name: string;
  rarity: CharacterRarity;
  price: number;
  glowColor: string;
  eyeColor: string;
  description: string;
}

export interface CompanionState {
  name: string;
  level: number;
  xp: number;
  mood: 'happy' | 'ready' | 'sleepy' | 'victorious' | 'curious';
  activeSkinId: string;
  unlockedSkinIds: string[];
  bondPoints: number;
}

export interface DailyTrainingTask {
  id: string;
  title: string;
  category: 'agility' | 'intelligence' | 'focus' | 'strength';
  description: string;
  rewardCredits: number;
  rewardXP: number;
  completed: boolean;
  type: 'speed_reflex' | 'logic_rune' | 'memory_grid' | 'code_decipher';
}

export interface TreasureHuntStep {
  step: number;
  title: string;
  realm: string;
  riddle: string;
  clue: string;
  solutionHint: string;
  acceptedAnswers: string[];
  creditsReward: number;
  coords: { x: number; y: number };
}

export interface TriviaQuestion {
  id: string;
  category: 'kannada_cinema' | 'indian_cinema' | 'hollywood_cinema' | 'internet_meme' | 'anime_lore' | 'gdg_tech';
  question: string;
  clueType?: 'text' | 'emoji' | 'dialogue_complete' | 'silhouette';
  clueContent?: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  creditsReward: number;
}

export interface SpellIngredient {
  id: string;
  name: string;
  element: 'fire' | 'water' | 'void' | 'starlight' | 'herb';
  color: string;
  symbol: string;
}

export interface MagicalRecipe {
  id: string;
  name: string;
  description: string;
  requiredIngredients: string[]; // IDs
  rewardCredits: number;
  housePoints: number;
}

export interface WalletTransaction {
  id: string;
  type: 'earn' | 'spend';
  amount: number;
  description: string;
  timestamp: number;
}

export interface UserProfile {
  username: string;
  title: string;
  credits: number;
  level: number;
  xp: number;
  streak: number;
  lastLoginDate: string;
  unlockedCharacterIds: string[];
  favoriteCharacterId: string;
  selectedHouseId: 'ignis' | 'lumina' | 'noctis' | 'terra';
  housePoints: {
    ignis: number;
    lumina: number;
    noctis: number;
    terra: number;
  };
  claimedCodes: string[];
  unlockedBadges: string[];
  inventory: string[];
  transactions: WalletTransaction[];
  dailyTasksCompletedDate: string;
  currentTreasureStep: number;
}
