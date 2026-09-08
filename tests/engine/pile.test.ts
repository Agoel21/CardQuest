/** Ported from TestProject2/CardPileTests.cs (6 tests). */
import { describe, expect, it } from 'vitest';
import { CardPile, Deck, makeCard, Rank, Suit } from '../../src/engine';

describe('CardPile', () => {
  it('sets cards from a deck', () => {
    const deck = Deck.full();
    const pile = new CardPile();
    pile.setCards(deck.toArray());
    expect(pile.toArray()).toEqual(deck.toArray());
  });

  it('takes a fixed number of cards from a deck', () => {
    const deck = Deck.full();
    const pile = new CardPile();
    deck.dealInto(pile, 10);
    expect(pile.size).toBe(10);
    expect(deck.size).toBe(42);
  });

  it('takes the card at an index and shrinks', () => {
    const deck = Deck.full();
    const pile = new CardPile();
    deck.dealInto(pile, 10);
    const target = pile.at(6);
    const actual = pile.takeAt(6);
    expect(actual).toEqual(target);
    expect(pile.size).toBe(9);
  });

  it('removes a card by value', () => {
    const target = makeCard(Suit.Clubs, Rank.Ace);
    const pile = new CardPile([target]);
    expect(pile.remove(target)).toBe(true);
    expect(pile.contains(target)).toBe(false);
    expect(pile.size).toBe(0);
  });

  it('removes a card at an index', () => {
    const pile = new CardPile(Deck.full().toArray());
    const target = pile.at(6)!;
    pile.removeAt(6);
    expect(pile.contains(target)).toBe(false);
    expect(pile.size).toBe(51);
  });

  it('adds a card', () => {
    const pile = new CardPile();
    const card = makeCard(Suit.Clubs, Rank.Ace);
    pile.add(card);
    expect(pile.contains(card)).toBe(true);
  });

  // Added: callers must not be able to mutate pile internals.
  it('returns a defensive copy from toArray', () => {
    const pile = new CardPile([makeCard(Suit.Clubs, Rank.Ace)]);
    pile.toArray().push(makeCard(Suit.Spades, Rank.King));
    expect(pile.size).toBe(1);
  });
});
