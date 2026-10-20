/**
 * Core Economy and Progression rules for CREDITVERSE.
 * Decoupled pure logic functions for deterministic leveling, credit math, and validations.
 */

export interface RankInfo {
  rank: 'Beginner' | 'Explorer' | 'Hunter' | 'Elite' | 'Master' | 'Legend';
  title: string;
  minLevel: number;
  badgeColor: string;
}

export const RANKS: RankInfo[] = [
  { rank: 'Legend', title: 'Cosmic Shadow Sovereign', minLevel: 25, badgeColor: '#f59e0b' },
  { rank: 'Master', title: 'Grand Multiverse Master', minLevel: 18, badgeColor: '#ec4899' },
  { rank: 'Elite', title: 'Shadow Monarch Vanguard', minLevel: 12, badgeColor: '#8b5cf6' },
  { rank: 'Hunter', title: 'Awakened Dungeon Hunter', minLevel: 7, badgeColor: '#3b82f6' },
  { rank: 'Explorer', title: 'Multiverse Seeker', minLevel: 3, badgeColor: '#10b981' },
  { rank: 'Beginner', title: 'Novice Recruit', minLevel: 1, badgeColor: '#94a3b8' },
];

/**
 * Calculates XP required to reach the next level from the current level.
 * Formula: Base 100 XP + 60 XP * (level - 1)^1.2
 */
export function calculateXPForNextLevel(level: number): number {
  if (level <= 1) return 100;
  return Math.round(100 + 60 * Math.pow(level - 1, 1.25));
}

/**
 * Derives player rank based on current level.
 */
export function calculateRank(level: number): RankInfo {
  const safeLevel = Math.max(1, Math.floor(level));
  for (const r of RANKS) {
    if (safeLevel >= r.minLevel) {
      return r;
    }
  }
  return RANKS[RANKS.length - 1];
}

/**
 * Streak multiplier calculation:
 * Grants +5% bonus per streak day up to a max +50% (at 10 days).
 */
export function applyStreakBonus(baseCredits: number, streakDays: number): number {
  const safeStreak = Math.max(0, streakDays);
  const bonusMultiplier = 1 + Math.min(safeStreak * 0.05, 0.5);
  return Math.round(baseCredits * bonusMultiplier);
}

/**
 * Validates whether a player has sufficient credits to purchase an item.
 * Ensures credit balance never drops below zero.
 */
export function validatePurchase(
  currentCredits: number,
  itemPrice: number
): { allowed: boolean; remainingCredits: number; error?: string } {
  if (itemPrice < 0) {
    return { allowed: false, remainingCredits: currentCredits, error: 'Price cannot be negative' };
  }
  if (currentCredits < itemPrice) {
    return {
      allowed: false,
      remainingCredits: currentCredits,
      error: `Insufficient credits: need ${itemPrice}, but have ${currentCredits}`,
    };
  }
  return {
    allowed: true,
    remainingCredits: currentCredits - itemPrice,
  };
}

/**
 * Calculates rewards for the Shadow Dungeon run based on monsters defeated, floor, and no-damage bonus.
 */
export function calculateFloorExtractionBonus(
  floor: number,
  monstersDefeated: number,
  noDamage: boolean
): { creditsEarned: number; xpEarned: number } {
  const safeFloor = Math.max(1, floor);
  const baseCredits = safeFloor * 10 + monstersDefeated * 2;
  const baseXP = safeFloor * 30 + monstersDefeated * 10;
  const multiplier = noDamage ? 1.5 : 1.0;

  return {
    creditsEarned: Math.round(baseCredits * multiplier),
    xpEarned: Math.round(baseXP * multiplier),
  };
}

/**
 * Pre-defined GDG on Campus event promo codes.
 */
export const PROMO_CODES: Record<string, { credits: number; title: string }> = {
  GDGOC2026: { credits: 100, title: 'GDG on Campus Welcome Airdrop' },
  HACKFEST: { credits: 150, title: 'Hacktoberfest Hackathon Bonus' },
  CREDITVERSE: { credits: 200, title: 'Pioneer Dimension Explorer' },
  SOLOLEVEL: { credits: 75, title: 'Awakened Hunter Awakening' },
  KGFROCKY: { credits: 80, title: 'Sultan of Narachi Gold' },
};

/**
 * Validates a campus event redemption code.
 */
export function evaluateCode(
  redeemCode: string,
  claimedCodes: string[]
): { valid: boolean; credits: number; title: string; error?: string } {
  const normalized = (redeemCode || '').trim().toUpperCase();
  if (!normalized) {
    return { valid: false, credits: 0, title: '', error: 'Please enter a code' };
  }
  if (claimedCodes.includes(normalized)) {
    return { valid: false, credits: 0, title: '', error: 'This code has already been redeemed on this account' };
  }
  const promo = PROMO_CODES[normalized];
  if (!promo) {
    return { valid: false, credits: 0, title: '', error: 'Invalid or expired redemption code' };
  }
  return {
    valid: true,
    credits: promo.credits,
    title: promo.title,
  };
}
