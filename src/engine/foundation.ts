/**
 * A foundation pile: one per suit, built up from Ace to King.
 */
import { Card, Rank, Suit } from './card';
import { CardPile } from './pile';

export class Foundation {
  readonly suit: Suit;
  readonly pile: CardPile;

  constructor(suit: Suit, pile: CardPile = new CardPile()) {
    this.suit = suit;
    this.pile = pile;
  }

  get size(): number {
    return this.pile.size;
  }

  /** A foundation is complete once the King is placed. */
  get isComplete(): boolean {
    return this.pile.size === 13;
  }

  /** Whether `card` may legally be placed here, without placing it. */
  canAccept(card: Card): boolean {
    if (card.suit !== this.suit) return false;
    const top = this.pile.peek();
    if (!top) return card.rank === Rank.Ace;
    return card.rank === top.rank + 1;
  }

  /** Places `card` if legal. Returns whether it was placed. */
  tryStack(card: Card): boolean {
    if (!this.canAccept(card)) return false;
    this.pile.add(card);
    return true;
  }

  toJSON(): { suit: Suit; cards: Card[] } {
    return { suit: this.suit, cards: this.pile.toArray() };
  }

  static fromJSON(data: { suit: Suit; cards: Card[] }): Foundation {
    return new Foundation(data.suit, new CardPile(data.cards));
  }
}
