/**
 * A tableau column: a face-down reserve with a face-up active stack on top.
 *
 * Active cards build down in alternating colours; only a King may occupy an
 * empty column. Emptying the active stack flips the next reserve card up.
 */
import { Card, colorOf, Rank } from './card';
import { Deck } from './deck';
import { CardPile } from './pile';

export class TableauColumn {
  readonly reserve: CardPile;
  readonly active: CardPile;

  constructor(reserve: CardPile = new CardPile(), active: CardPile = new CardPile()) {
    this.reserve = reserve;
    this.active = active;
  }

  /** Deals `reserveCount` face-down cards plus one face-up card. */
  build(deck: Deck, reserveCount: number): void {
    deck.dealInto(this.reserve, reserveCount);
    deck.dealInto(this.active, 1);
  }

  get isEmpty(): boolean {
    return this.reserve.isEmpty && this.active.isEmpty;
  }

  /** The face-up card a move can be built onto. */
  get topCard(): Card | undefined {
    return this.active.peek();
  }

  /**
   * Whether `cards` (a valid descending alternating run) may be placed here.
   * Only the first card matters; the run's own validity is the caller's job.
   */
  canAccept(cards: Card[]): boolean {
    const first = cards[0];
    if (!first) return false;

    const top = this.active.peek();
    if (!top) return first.rank === Rank.King;

    return colorOf(first) !== colorOf(top) && first.rank === top.rank - 1;
  }

  /** Places `cards` if legal. Returns whether they were placed. */
  tryAdd(cards: Card[]): boolean {
    if (!this.canAccept(cards)) return false;
    this.active.addMany(cards);
    return true;
  }

  /**
   * Removes `card` and everything above it, then flips up the next reserve
   * card if that emptied the active stack. Returns the cards removed.
   */
  takeFrom(card: Card): Card[] {
    const taken = this.active.takeFrom(card);
    if (taken.length === 0) return [];
    this.flipIfNeeded();
    return taken;
  }

  /** Exposes the next reserve card when the active stack has been emptied. */
  flipIfNeeded(): void {
    if (this.active.isEmpty && !this.reserve.isEmpty) {
      const flipped = this.reserve.takeTop();
      if (flipped) this.active.add(flipped);
    }
  }

  toJSON(): { reserve: Card[]; active: Card[] } {
    return { reserve: this.reserve.toArray(), active: this.active.toArray() };
  }

  static fromJSON(data: { reserve: Card[]; active: Card[] }): TableauColumn {
    return new TableauColumn(new CardPile(data.reserve), new CardPile(data.active));
  }
}
