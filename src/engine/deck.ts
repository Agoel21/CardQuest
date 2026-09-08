/**
 * A standard 52-card deck.
 *
 * Unlike the original, dealing is explicit about *where* a card comes from:
 * the legacy `GrabCards` drew from a random index on each call, which meant
 * "deal 7 cards" silently re-randomised an already-shuffled deck. Here the
 * deck is shuffled once, deterministically, and dealing takes from the top.
 */
import { Card, makeCard, RANKS, SUITS } from './card';
import { CardPile } from './pile';
import { Rng, shuffleInPlace } from './rng';

export const FULL_DECK_SIZE = 52;

export class Deck {
  private cards: Card[];

  constructor(cards: Card[] = []) {
    this.cards = [...cards];
  }

  /** A full, ordered 52-card deck. */
  static full(): Deck {
    const cards: Card[] = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        cards.push(makeCard(suit, rank));
      }
    }
    return new Deck(cards);
  }

  /** A full deck shuffled with the given seeded generator. */
  static shuffled(rng: Rng): Deck {
    const deck = Deck.full();
    deck.shuffle(rng);
    return deck;
  }

  get size(): number {
    return this.cards.length;
  }

  get isEmpty(): boolean {
    return this.cards.length === 0;
  }

  toArray(): Card[] {
    return [...this.cards];
  }

  shuffle(rng: Rng): void {
    shuffleInPlace(this.cards, rng);
  }

  /** Adds a card, refusing to grow the deck beyond a standard 52. */
  add(card: Card): boolean {
    if (this.cards.length >= FULL_DECK_SIZE) return false;
    this.cards.push(card);
    return true;
  }

  remove(card: Card): boolean {
    const index = this.cards.findIndex((c) => c.suit === card.suit && c.rank === card.rank);
    if (index === -1) return false;
    this.cards.splice(index, 1);
    return true;
  }

  takeAt(index: number): Card | undefined {
    if (index < 0 || index >= this.cards.length) return undefined;
    return this.cards.splice(index, 1)[0];
  }

  /** Deals one card from the top of the deck. */
  deal(): Card | undefined {
    return this.cards.pop();
  }

  /** Deals `count` cards from the top; deals fewer if the deck runs out. */
  dealMany(count: number): Card[] {
    const dealt: Card[] = [];
    for (let i = 0; i < count; i++) {
      const card = this.deal();
      if (!card) break;
      dealt.push(card);
    }
    return dealt;
  }

  /** Deals `count` cards straight into a pile. */
  dealInto(pile: CardPile, count: number): void {
    pile.addMany(this.dealMany(count));
  }

  toJSON(): Card[] {
    return this.toArray();
  }

  static fromJSON(cards: Card[]): Deck {
    return new Deck(cards);
  }
}
