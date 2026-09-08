/**
 * FreeCell board.
 *
 * Eight tableau columns dealt entirely face-up, four free cells and four
 * suit foundations. The board owns move *legality*; rendering and input
 * live in the UI layer.
 *
 * Unlike Klondike there is no face-down reserve at all: every dealt card is
 * playable from the moment the game starts, and any card (not just a king)
 * may occupy an empty column. Both of these are load-bearing differences
 * from `SolitaireBoard`, not omissions, so they are called out here rather
 * than silently mirrored.
 */
import {
  Card, colorOf, Deck, Foundation, makeRng, randomSeed, Rng, sameCard, Suit, SUITS,
  TableauColumn,
} from '../../engine';

export const COLUMN_COUNT = 8;
export const FREE_CELL_COUNT = 4;

/** Column n receives this many cards: the first four get one extra. */
const DEAL_COUNTS = [7, 7, 7, 7, 6, 6, 6, 6];

export class FreeCellBoard {
  readonly columns: TableauColumn[];
  readonly freeCells: (Card | undefined)[];
  readonly foundations: Foundation[];
  readonly seed: number;

  constructor(seed: number = randomSeed()) {
    this.seed = seed;
    this.foundations = SUITS.map((suit) => new Foundation(suit));
    this.columns = Array.from({ length: COLUMN_COUNT }, () => new TableauColumn());
    this.freeCells = Array.from({ length: FREE_CELL_COUNT }, () => undefined);
  }

  foundationFor(suit: Suit): Foundation {
    const found = this.foundations.find((f) => f.suit === suit);
    if (!found) throw new Error(`No foundation for suit ${suit}`);
    return found;
  }

  /**
   * Deals a fresh game entirely face-up. Columns 0-3 get seven cards each,
   * columns 4-7 get six, for the standard 52-card FreeCell layout.
   */
  generate(rng: Rng = makeRng(this.seed)): void {
    const deck = Deck.shuffled(rng);
    this.columns.forEach((column, index) => {
      column.reserve.clear();
      column.active.clear();
      deck.dealInto(column.active, DEAL_COUNTS[index] ?? 0);
    });
    this.freeCells.forEach((_, i) => {
      this.freeCells[i] = undefined;
    });
  }

  /** The game is won when all four foundations hold thirteen cards. */
  get isWon(): boolean {
    return this.foundations.every((f) => f.isComplete);
  }

  get emptyFreeCellCount(): number {
    return this.freeCells.filter((card) => card === undefined).length;
  }

  get emptyColumnCount(): number {
    return this.columns.filter((column) => column.isEmpty).length;
  }

  /**
   * The largest run size a supermove can carry right now: (1 + free cells)
   * doubled once for every empty column, since each empty column can hold an
   * intermediate stack during the move. When the destination itself is an
   * empty column, that column cannot also serve as a waypoint, so it is
   * excluded from the count.
   */
  maxMovableRun(toEmptyColumn: boolean): number {
    const freeCells = this.emptyFreeCellCount;
    const emptyColumns = toEmptyColumn
      ? Math.max(0, this.emptyColumnCount - 1)
      : this.emptyColumnCount;
    return (1 + freeCells) * Math.pow(2, emptyColumns);
  }

  /**
   * Whether `cards` (top-to-bottom, i.e. `cards[0]` is the card that would
   * land on the destination) may be placed on column `columnIndex`. Checks
   * the run's own validity, the supermove size limit, and the destination's
   * top card, all without mutating anything.
   */
  canMoveToColumn(cards: Card[], columnIndex: number): boolean {
    const column = this.columns[columnIndex];
    const first = cards[0];
    if (!column || !first) return false;
    if (!isValidRun(cards)) return false;
    if (cards.length > this.maxMovableRun(column.isEmpty)) return false;

    const top = column.active.peek();
    if (!top) return true;
    return colorOf(first) !== colorOf(top) && first.rank === top.rank - 1;
  }

  /**
   * Moves `cards` (a run currently sitting on top of `fromColumnIndex`) onto
   * `toColumnIndex`. Returns whether the move happened.
   */
  moveToColumn(cards: Card[], fromColumnIndex: number, toColumnIndex: number): boolean {
    if (fromColumnIndex === toColumnIndex) return false;
    const from = this.columns[fromColumnIndex];
    const first = cards[0];
    if (!from || !first) return false;
    if (!this.canMoveToColumn(cards, toColumnIndex)) return false;

    const index = from.active.indexOf(first);
    if (index === -1) return false;
    const actualRun = from.active.toArray().slice(index);
    if (actualRun.length !== cards.length) return false;
    for (let i = 0; i < cards.length; i++) {
      const expected = cards[i];
      const actual = actualRun[i];
      if (!expected || !actual || !sameCard(expected, actual)) return false;
    }

    const to = this.columns[toColumnIndex];
    if (!to) return false;
    from.takeFrom(first);
    to.active.addMany(actualRun);
    return true;
  }

  /** Moves the top card of a column into an empty free cell, if one exists. */
  moveToFreeCell(card: Card, fromColumnIndex: number): boolean {
    const emptyIndex = this.freeCells.findIndex((c) => c === undefined);
    if (emptyIndex === -1) return false;

    const column = this.columns[fromColumnIndex];
    const top = column?.active.peek();
    if (!column || !top || !sameCard(top, card)) return false;

    column.active.takeTop();
    this.freeCells[emptyIndex] = card;
    return true;
  }

  /** Moves a free cell's card onto a tableau column, if that column accepts it. */
  moveFromFreeCell(cellIndex: number, toColumnIndex: number): boolean {
    const card = this.freeCells[cellIndex];
    if (!card) return false;
    if (!this.canMoveToColumn([card], toColumnIndex)) return false;

    const column = this.columns[toColumnIndex];
    if (!column) return false;
    column.active.add(card);
    this.freeCells[cellIndex] = undefined;
    return true;
  }

  /** Moves a column's top card to its foundation, if legal. */
  moveToFoundation(card: Card, fromColumnIndex: number): boolean {
    const column = this.columns[fromColumnIndex];
    const top = column?.active.peek();
    if (!column || !top || !sameCard(top, card)) return false;

    const foundation = this.foundationFor(card.suit);
    if (!foundation.canAccept(card)) return false;

    column.active.takeTop();
    foundation.pile.add(card);
    return true;
  }

  /** Moves a free cell's card to its foundation, if legal. */
  moveFreeCellToFoundation(cellIndex: number): boolean {
    const card = this.freeCells[cellIndex];
    if (!card) return false;

    const foundation = this.foundationFor(card.suit);
    if (!foundation.tryStack(card)) return false;

    this.freeCells[cellIndex] = undefined;
    return true;
  }
}

/**
 * Whether `cards` form a descending run in alternating colour, e.g.
 * black-8, red-7, black-6. An empty or single-card list is trivially valid.
 */
export function isValidRun(cards: Card[]): boolean {
  for (let i = 1; i < cards.length; i++) {
    const prev = cards[i - 1];
    const curr = cards[i];
    if (!prev || !curr) return false;
    if (curr.rank !== prev.rank - 1) return false;
    if (colorOf(curr) === colorOf(prev)) return false;
  }
  return true;
}
