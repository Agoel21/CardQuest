/**
 * Klondike Solitaire board.
 *
 * Seven tableau columns, four suit foundations, a stock and a waste pile.
 * The board owns move *legality*; rendering and input live in the UI layer.
 */
import {
  Card, CardPile, Deck, Foundation, makeRng, randomSeed, Rank, Rng, sameCard, Suit, SUITS,
  TableauColumn,
} from '../../engine';

export const COLUMN_COUNT = 7;

export class SolitaireBoard {
  readonly foundations: Foundation[];
  readonly columns: TableauColumn[];
  readonly stock: CardPile;
  readonly waste: TableauColumn;
  readonly seed: number;

  constructor(seed: number = randomSeed()) {
    this.seed = seed;
    this.foundations = SUITS.map((suit) => new Foundation(suit));
    this.columns = Array.from({ length: COLUMN_COUNT }, () => new TableauColumn());
    this.stock = new CardPile();
    this.waste = new TableauColumn();
  }

  foundationFor(suit: Suit): Foundation {
    const found = this.foundations.find((f) => f.suit === suit);
    if (!found) throw new Error(`No foundation for suit ${suit}`);
    return found;
  }

  /** Deals a fresh game. Column n receives n face-down cards plus one face-up. */
  generate(rng: Rng = makeRng(this.seed)): void {
    const deck = Deck.shuffled(rng);
    this.columns.forEach((column, index) => column.build(deck, index));
    this.stock.setCards(deck.toArray());
  }

  /** The game is won when all four foundations hold thirteen cards. */
  get isWon(): boolean {
    return this.foundations.every((f) => f.isComplete);
  }

  /**
   * Attempts the best available move for `card` from `source`: a foundation
   * first (only when it is the single top card), then any other column.
   */
  tryAutoMove(source: TableauColumn, card: Card): boolean {
    const index = source.active.indexOf(card);
    if (index === -1) return false;

    const isTopCard = source.active.size - index === 1;
    if (isTopCard) {
      for (const foundation of this.foundations) {
        if (foundation.tryStack(card)) {
          source.takeFrom(card);
          return true;
        }
      }
    }

    const run = source.active.toArray().slice(index);
    for (const column of this.columns) {
      if (column === source) continue;
      if (column.canAccept(run)) {
        source.takeFrom(card);
        column.tryAdd(run);
        return true;
      }
    }
    return false;
  }

  /**
   * Turns one card from the stock to the waste, recycling the waste when the
   * stock is empty.
   *
   * The recycled waste is deliberately NOT reshuffled. Standard Klondike
   * turns the waste back over as a block, so the same cards reappear in the
   * same order; that predictability is part of the game and is what makes a
   * deal winnable or not. The original C# shuffled here, which quietly made
   * every deal non-deterministic and unwinnable-by-analysis.
   */
  flipFromStock(): void {
    const face = this.waste.active.at(0);
    if (face) {
      this.waste.reserve.add(face);
      this.waste.active.removeAt(0);
    }

    if (this.stock.isEmpty) {
      this.stock.addMany(this.waste.reserve.toArray());
      this.waste.reserve.clear();
    }

    const next = this.stock.takeTop();
    if (next) this.waste.active.add(next);
  }

  /** Moves a foundation's top card back to a tableau column, if one accepts it. */
  moveFromFoundation(foundation: Foundation): boolean {
    const card = foundation.pile.peek();
    if (!card) return false;

    for (const column of this.columns) {
      if (column.canAccept([card])) {
        column.tryAdd([card]);
        foundation.pile.removeAt(foundation.pile.size - 1);
        return true;
      }
    }
    return false;
  }

  /** True when no legal move remains anywhere on the board. */
  hasAnyMove(): boolean {
    if (!this.stock.isEmpty || this.waste.active.size > 0) return true;

    const sources: TableauColumn[] = [...this.columns, this.waste];
    for (const source of sources) {
      for (const card of source.active.toArray()) {
        const index = source.active.indexOf(card);
        const isTop = source.active.size - index === 1;
        if (isTop && this.foundations.some((f) => f.canAccept(card))) return true;

        const run = source.active.toArray().slice(index);
        if (this.columns.some((c) => c !== source && c.canAccept(run))) return true;
      }
    }
    return false;
  }
}

/** Whether `cards` form a descending, alternating-colour run. */
export function isValidRun(cards: Card[]): boolean {
  for (let i = 1; i < cards.length; i++) {
    const prev = cards[i - 1];
    const curr = cards[i];
    if (!prev || !curr) return false;
    if (curr.rank !== prev.rank - 1) return false;
  }
  return true;
}

export { Rank, sameCard };
