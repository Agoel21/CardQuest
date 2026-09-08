/** Ported from TestProject2/PlayerTests.cs (2 tests). */
import { describe, expect, it } from 'vitest';
import { CardPile, Deck, Player } from '../../src/engine';

describe('Player', () => {
  it('keeps its name', () => {
    expect(new Player('p1', 'test_name').name).toBe('test_name');
  });

  it('accepts a hand of cards', () => {
    const hand = new CardPile(Deck.full().toArray());
    const player = new Player('p1', 'test_name');
    player.hand.setCards(hand.toArray());
    expect(player.hand.toArray()).toEqual(hand.toArray());
  });

  // Added: shedding games end on an empty hand.
  it('reports an empty hand', () => {
    const player = new Player('p1', 'test_name');
    expect(player.hasEmptyHand).toBe(true);
    player.hand.setCards(Deck.full().toArray().slice(0, 1));
    expect(player.hasEmptyHand).toBe(false);
  });
});
