/** Ported from TestProject2/FoundationTests.cs (4 tests). */
import { describe, expect, it } from 'vitest';
import { Foundation, makeCard, Rank, Suit } from '../../src/engine';

describe('Foundation', () => {
  it('knows its suit', () => {
    expect(new Foundation(Suit.Diamonds).suit).toBe(Suit.Diamonds);
  });

  it('stacks ace then two of the same suit', () => {
    const foundation = new Foundation(Suit.Diamonds);
    const ace = makeCard(Suit.Diamonds, Rank.Ace);
    const two = makeCard(Suit.Diamonds, Rank.Two);
    expect(foundation.tryStack(ace)).toBe(true);
    expect(foundation.tryStack(two)).toBe(true);
    expect(foundation.pile.at(0)).toEqual(ace);
    expect(foundation.pile.at(1)).toEqual(two);
  });

  it('rejects the wrong suit', () => {
    const foundation = new Foundation(Suit.Diamonds);
    foundation.tryStack(makeCard(Suit.Diamonds, Rank.Ace));
    expect(foundation.tryStack(makeCard(Suit.Spades, Rank.Two))).toBe(false);
    expect(foundation.size).toBe(1);
  });

  it('rejects a rank that skips', () => {
    const foundation = new Foundation(Suit.Diamonds);
    foundation.tryStack(makeCard(Suit.Diamonds, Rank.Ace));
    expect(foundation.tryStack(makeCard(Suit.Diamonds, Rank.Three))).toBe(false);
    expect(foundation.size).toBe(1);
  });

  // Added: an empty foundation only ever accepts an ace.
  it('rejects a non-ace onto an empty foundation', () => {
    expect(new Foundation(Suit.Hearts).tryStack(makeCard(Suit.Hearts, Rank.Two))).toBe(false);
  });

  // Added: win detection depends on this.
  it('is complete at thirteen cards', () => {
    const foundation = new Foundation(Suit.Hearts);
    for (let r = Rank.Ace; r <= Rank.King; r++) {
      expect(foundation.tryStack(makeCard(Suit.Hearts, r))).toBe(true);
    }
    expect(foundation.isComplete).toBe(true);
  });
});
