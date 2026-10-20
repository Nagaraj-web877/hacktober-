import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateXPForNextLevel,
  calculateRank,
  applyStreakBonus,
  validatePurchase,
  calculateFloorExtractionBonus,
  evaluateCode,
} from './economy.ts';

test('calculateXPForNextLevel increases smoothly with level', () => {
  assert.equal(calculateXPForNextLevel(1), 100);
  assert.ok(calculateXPForNextLevel(2) > 100);
  assert.ok(calculateXPForNextLevel(10) > calculateXPForNextLevel(5));
});

test('calculateRank returns correct rank thresholds', () => {
  assert.equal(calculateRank(1).rank, 'Beginner');
  assert.equal(calculateRank(2).rank, 'Beginner');
  assert.equal(calculateRank(3).rank, 'Explorer');
  assert.equal(calculateRank(7).rank, 'Hunter');
  assert.equal(calculateRank(12).rank, 'Elite');
  assert.equal(calculateRank(18).rank, 'Master');
  assert.equal(calculateRank(25).rank, 'Legend');
  assert.equal(calculateRank(50).rank, 'Legend');
});

test('applyStreakBonus calculates proper multiplier capped at 50%', () => {
  assert.equal(applyStreakBonus(100, 0), 100);
  assert.equal(applyStreakBonus(100, 2), 110); // +10%
  assert.equal(applyStreakBonus(100, 10), 150); // +50% cap
  assert.equal(applyStreakBonus(100, 25), 150); // still +50% cap
});

test('validatePurchase ensures balance cannot go negative', () => {
  const okResult = validatePurchase(500, 250);
  assert.equal(okResult.allowed, true);
  assert.equal(okResult.remainingCredits, 250);

  const exactResult = validatePurchase(250, 250);
  assert.equal(exactResult.allowed, true);
  assert.equal(exactResult.remainingCredits, 0);

  const failResult = validatePurchase(100, 250);
  assert.equal(failResult.allowed, false);
  assert.equal(failResult.remainingCredits, 100);
  assert.ok(failResult.error?.includes('Insufficient credits'));

  const negativePrice = validatePurchase(100, -50);
  assert.equal(negativePrice.allowed, false);
});

test('calculateFloorExtractionBonus grants base plus no-damage bonus', () => {
  const normal = calculateFloorExtractionBonus(1, 5, false);
  assert.equal(normal.creditsEarned, 20); // 10 + 10
  assert.equal(normal.xpEarned, 80); // 30 + 50

  const flawless = calculateFloorExtractionBonus(1, 5, true);
  assert.equal(flawless.creditsEarned, 30); // 20 * 1.5
  assert.equal(flawless.xpEarned, 120); // 80 * 1.5
});

test('evaluateCode handles valid, claimed, and invalid promo codes', () => {
  const valid = evaluateCode('GDGOC2026', []);
  assert.equal(valid.valid, true);
  assert.equal(valid.credits, 100);

  const claimed = evaluateCode('GDGOC2026', ['GDGOC2026']);
  assert.equal(claimed.valid, false);
  assert.ok(claimed.error?.includes('already been redeemed'));

  const invalid = evaluateCode('FAKECODE99', []);
  assert.equal(invalid.valid, false);
  assert.ok(invalid.error?.includes('Invalid'));
});
