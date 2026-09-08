/** Ported from TestProject2/DeckTests.cs (3 tests), plus shuffle-quality tests. */
import { describe, expect, it } from 'vitest';
import { Deck, makeRng, Rank, sameCard, Suit, makeCard, shuffleInPlace } from '../../src/engine';

describe('Deck', () => {
  it('fills to 52 cards', () => {
    expect(Deck.full().size).toBe(52);
  });

  it('takes a known card from a known position', () => {
    const deck = Deck.full();
    const card = deck.takeAt(0);
    expect(card).toBeDefined();
    expect(sameCard(card!, makeCard(Suit.Clubs, Rank.Ace))).toBe(true);
  });

  it('no longer starts with the ace of clubs once shuffled', () => {
    const deck = Deck.shuffled(makeRng(12345));
    const card = deck.takeAt(0);
    expect(sameCard(card!, makeCard(Suit.Clubs, Rank.Ace))).toBe(false);
  });

  it('refuses to grow beyond 52 cards', () => {
    const deck = Deck.full();
    expect(deck.add(makeCard(Suit.Clubs, Rank.Ace))).toBe(false);
    expect(deck.size).toBe(52);
  });

  // The multiplayer sync depends on this: same seed must mean same deal.
  it('is deterministic for a given seed', () => {
    const a = Deck.shuffled(makeRng(99)).toArray();
    const b = Deck.shuffled(makeRng(99)).toArray();
    const c = Deck.shuffled(makeRng(100)).toArray();
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });

  /**
   * Regression test for the biased shuffle in the original C#, which drew
   * from the full range rather than [0, j]. With a correct Fisher-Yates,
   * each card should land in each position roughly uniformly.
   */
  it('shuffles without positional bias', () => {
    const rng = makeRng(7);
    const trials = 6000;
    const firstPositionCounts = new Map<string, number>();

    for (let i = 0; i < trials; i++) {
      const items = [0, 1, 2, 3, 4];
      shuffleInPlace(items, rng);
      const key = String(items[0]);
      firstPositionCounts.set(key, (firstPositionCounts.get(key) ?? 0) + 1);
    }

    const expected = trials / 5;
    for (const count of firstPositionCounts.values()) {
      // Allow a generous 20% band; a biased shuffle misses this badly.
      expect(Math.abs(count - expected)).toBeLessThan(expected * 0.2);
    }
  });
});
