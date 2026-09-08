/** Ported from TestProject2/CardTests.cs (3 tests). */
import { describe, expect, it } from 'vitest';
import { colorOf, Color, makeCard, Rank, Suit, assetName } from '../../src/engine';

describe('Card', () => {
  it('compares rank greater than', () => {
    const card = makeCard(Suit.Spades, Rank.Five);
    expect(card.rank + 1).toBe(Rank.Six);
  });

  it('compares rank less than', () => {
    const card = makeCard(Suit.Spades, Rank.Five);
    expect(card.rank - 1).toBe(Rank.Four);
  });

  it('preserves the original numeric suit ordering', () => {
    expect(makeCard(Suit.Clubs, Rank.Ace).suit).toBe(1);
    expect(makeCard(Suit.Diamonds, Rank.Ace).suit).toBe(2);
    expect(makeCard(Suit.Hearts, Rank.Ace).suit).toBe(3);
    expect(makeCard(Suit.Spades, Rank.Ace).suit).toBe(4);
  });

  // Added: colour is derived, so it cannot drift out of sync with suit.
  it('derives colour from suit', () => {
    expect(colorOf(makeCard(Suit.Clubs, Rank.Two))).toBe(Color.Black);
    expect(colorOf(makeCard(Suit.Spades, Rank.Two))).toBe(Color.Black);
    expect(colorOf(makeCard(Suit.Hearts, Rank.Two))).toBe(Color.Red);
    expect(colorOf(makeCard(Suit.Diamonds, Rank.Two))).toBe(Color.Red);
  });

  // Added: guards the contract with the existing card image filenames.
  it('maps to the existing asset filenames', () => {
    expect(assetName(makeCard(Suit.Spades, Rank.Queen))).toBe('queen_of_spades');
    expect(assetName(makeCard(Suit.Diamonds, Rank.Nine))).toBe('nine_of_diamonds');
  });
});
