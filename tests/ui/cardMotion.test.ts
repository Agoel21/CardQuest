import { describe, expect, it } from 'vitest';
import { Rank, Suit } from '../../src/engine';
import { cardMotionId } from '../../src/ui/useCardMotion';

describe('card motion identity', () => {
  it('keeps a card identity stable while it changes piles', () => {
    const card = { suit: Suit.Hearts, rank: Rank.Queen };

    expect(cardMotionId(card)).toBe('3-12');
    expect(cardMotionId({ ...card })).toBe(cardMotionId(card));
  });

  it('does not confuse different cards during a FLIP transition', () => {
    expect(cardMotionId({ suit: Suit.Clubs, rank: Rank.Ace }))
      .not.toBe(cardMotionId({ suit: Suit.Spades, rank: Rank.Ace }));
  });
});
