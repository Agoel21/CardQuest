import { describe, expect, it } from 'vitest';
import { FreeCellBoard } from '../../src/games/freecell/board';
import { makeCard, makeRng, Rank, Suit } from '../../src/engine';

describe('FreeCellBoard', () => {
  it('deals 52 distinct cards', () => {
    const board = new FreeCellBoard(1);
    board.generate(makeRng(1));
    const seen = new Set<string>();
    for (const column of board.columns) {
      for (const c of column.active.toArray()) {
        seen.add(`${c.suit}-${c.rank}`);
      }
    }
    expect(seen.size).toBe(52);
  });

  it('deals columns of 7,7,7,7,6,6,6,6 with no face-down reserve', () => {
    const board = new FreeCellBoard(2);
    board.generate(makeRng(2));
    const sizes = board.columns.map((c) => c.active.size);
    expect(sizes).toEqual([7, 7, 7, 7, 6, 6, 6, 6]);
    for (const column of board.columns) {
      expect(column.reserve.size).toBe(0);
    }
  });

  it('produces the same deal for the same seed', () => {
    const a = new FreeCellBoard(42);
    a.generate(makeRng(42));
    const b = new FreeCellBoard(42);
    b.generate(makeRng(42));
    for (let i = 0; i < a.columns.length; i++) {
      expect(b.columns[i]!.active.toArray()).toEqual(a.columns[i]!.active.toArray());
    }
  });

  it('moves a card to a free cell and back', () => {
    const board = new FreeCellBoard(3);
    const sevenClubs = makeCard(Suit.Clubs, Rank.Seven);
    board.columns[0]!.active.setCards([sevenClubs]);

    expect(board.moveToFreeCell(sevenClubs, 0)).toBe(true);
    expect(board.freeCells).toContainEqual(sevenClubs);
    expect(board.columns[0]!.active.isEmpty).toBe(true);

    expect(board.moveFromFreeCell(0, 0)).toBe(true);
    expect(board.columns[0]!.active.at(0)).toEqual(sevenClubs);
    expect(board.freeCells[0]).toBeUndefined();
  });

  it('blocks further free-cell moves once all four are full', () => {
    const board = new FreeCellBoard(4);
    const cards = [
      makeCard(Suit.Clubs, Rank.Two),
      makeCard(Suit.Diamonds, Rank.Three),
      makeCard(Suit.Hearts, Rank.Four),
      makeCard(Suit.Spades, Rank.Five),
    ];
    cards.forEach((card, i) => {
      board.columns[i]!.active.setCards([card]);
      expect(board.moveToFreeCell(card, i)).toBe(true);
    });
    expect(board.freeCells.every((c) => c !== undefined)).toBe(true);

    const oneMore = makeCard(Suit.Clubs, Rank.Six);
    board.columns[4]!.active.setCards([oneMore]);
    expect(board.moveToFreeCell(oneMore, 4)).toBe(false);
    expect(board.columns[4]!.active.at(0)).toEqual(oneMore);
  });

  it('moves an ace to its foundation', () => {
    const board = new FreeCellBoard(5);
    const aceHearts = makeCard(Suit.Hearts, Rank.Ace);
    board.columns[0]!.active.setCards([aceHearts]);

    expect(board.moveToFoundation(aceHearts, 0)).toBe(true);
    expect(board.foundationFor(Suit.Hearts).pile.at(0)).toEqual(aceHearts);
  });

  it('rejects a non-ace onto an empty foundation', () => {
    const board = new FreeCellBoard(6);
    const twoHearts = makeCard(Suit.Hearts, Rank.Two);
    board.columns[0]!.active.setCards([twoHearts]);

    expect(board.moveToFoundation(twoHearts, 0)).toBe(false);
    expect(board.columns[0]!.active.at(0)).toEqual(twoHearts);
    expect(board.foundationFor(Suit.Hearts).size).toBe(0);
  });

  it('enforces alternating colour, descending rank on the tableau', () => {
    const board = new FreeCellBoard(7);
    const eightSpades = makeCard(Suit.Spades, Rank.Eight);
    const sevenClubs = makeCard(Suit.Clubs, Rank.Seven); // same colour: illegal
    const sevenHearts = makeCard(Suit.Hearts, Rank.Seven); // alternating: legal
    board.columns[0]!.active.setCards([eightSpades]);

    expect(board.canMoveToColumn([sevenClubs], 0)).toBe(false);
    expect(board.canMoveToColumn([sevenHearts], 0)).toBe(true);

    board.columns[1]!.active.setCards([sevenHearts]);
    expect(board.moveToColumn([sevenHearts], 1, 0)).toBe(true);
    expect(board.columns[0]!.active.at(1)).toEqual(sevenHearts);
  });

  it('accepts any card, not just a king, onto an empty column', () => {
    const board = new FreeCellBoard(8);
    const fourDiamonds = makeCard(Suit.Diamonds, Rank.Four);
    board.columns[0]!.active.setCards([fourDiamonds]);
    // column 1 is empty

    expect(board.canMoveToColumn([fourDiamonds], 1)).toBe(true);
    expect(board.moveToColumn([fourDiamonds], 0, 1)).toBe(true);
    expect(board.columns[1]!.active.at(0)).toEqual(fourDiamonds);
  });

  it('computes maxMovableRun from free cells and empty columns', () => {
    const board = new FreeCellBoard(9);
    // All 4 free cells and all 8 columns empty at construction.
    expect(board.maxMovableRun(false)).toBe((1 + 4) * Math.pow(2, 8));
    expect(board.maxMovableRun(true)).toBe((1 + 4) * Math.pow(2, 7));

    // Fill one free cell and put a card in two columns (no longer empty).
    board.freeCells[0] = makeCard(Suit.Clubs, Rank.King);
    board.columns[0]!.active.setCards([makeCard(Suit.Clubs, Rank.Two)]);
    board.columns[1]!.active.setCards([makeCard(Suit.Diamonds, Rank.Three)]);
    expect(board.maxMovableRun(false)).toBe((1 + 3) * Math.pow(2, 6));
    expect(board.maxMovableRun(true)).toBe((1 + 3) * Math.pow(2, 5));

    // No free cells, no empty columns at all.
    board.freeCells[1] = makeCard(Suit.Hearts, Rank.King);
    board.freeCells[2] = makeCard(Suit.Spades, Rank.King);
    board.freeCells[3] = makeCard(Suit.Diamonds, Rank.King);
    for (const column of board.columns) {
      if (column.active.isEmpty) column.active.setCards([makeCard(Suit.Clubs, Rank.Four)]);
    }
    expect(board.maxMovableRun(false)).toBe(1);
  });

  it('rejects a run larger than the current supermove limit', () => {
    const board = new FreeCellBoard(10);
    // No free cells empty and no empty columns anywhere: only single-card
    // moves are allowed, since maxMovableRun collapses to (1+0)*2^0 = 1.
    board.freeCells[0] = makeCard(Suit.Clubs, Rank.King);
    board.freeCells[1] = makeCard(Suit.Hearts, Rank.King);
    board.freeCells[2] = makeCard(Suit.Spades, Rank.King);
    board.freeCells[3] = makeCard(Suit.Diamonds, Rank.King);
    for (const column of board.columns) {
      column.active.setCards([makeCard(Suit.Clubs, Rank.Four)]);
    }

    const eightSpades = makeCard(Suit.Spades, Rank.Eight);
    const sevenHearts = makeCard(Suit.Hearts, Rank.Seven);
    board.columns[0]!.active.setCards([eightSpades, sevenHearts]);
    board.columns[2]!.active.setCards([makeCard(Suit.Diamonds, Rank.Nine)]);

    expect(board.maxMovableRun(false)).toBe(1);
    expect(board.canMoveToColumn([eightSpades, sevenHearts], 2)).toBe(false);
  });

  it('moves a free cell card straight to its foundation', () => {
    const board = new FreeCellBoard(11);
    const aceClubs = makeCard(Suit.Clubs, Rank.Ace);
    board.freeCells[0] = aceClubs;

    expect(board.moveFreeCellToFoundation(0)).toBe(true);
    expect(board.foundationFor(Suit.Clubs).pile.at(0)).toEqual(aceClubs);
    expect(board.freeCells[0]).toBeUndefined();
  });

  it('is won once all four foundations are complete', () => {
    const board = new FreeCellBoard(12);
    expect(board.isWon).toBe(false);
    for (const foundation of board.foundations) {
      for (let rank = Rank.Ace; rank <= Rank.King; rank++) {
        foundation.pile.add(makeCard(foundation.suit, rank));
      }
    }
    expect(board.isWon).toBe(true);
  });
});
