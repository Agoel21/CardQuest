/** Ported from TestProject2/SolitaireBoardTests.cs (8 tests). */
import { describe, expect, it } from 'vitest';
import { SolitaireBoard } from '../../src/games/solitaire/board';
import { makeCard, makeRng, Rank, Suit } from '../../src/engine';

describe('SolitaireBoard', () => {
  it('moves a playable card to its foundation', () => {
    const board = new SolitaireBoard(1);
    board.generate();
    const ace = makeCard(Suit.Hearts, Rank.Ace);
    board.columns[0]!.active.setCards([ace]);
    expect(board.tryAutoMove(board.columns[0]!, ace)).toBe(true);
    expect(board.foundationFor(Suit.Hearts).pile.at(0)).toEqual(ace);
  });

  it('moves a card onto another column', () => {
    const board = new SolitaireBoard(1);
    board.generate();
    const sevenSpades = makeCard(Suit.Spades, Rank.Seven);
    const sixHearts = makeCard(Suit.Hearts, Rank.Six);
    board.columns[1]!.active.setCards([sevenSpades]);
    board.columns[0]!.active.setCards([sixHearts]);

    expect(board.tryAutoMove(board.columns[0]!, sixHearts)).toBe(true);
    expect(board.columns[1]!.active.at(0)).toEqual(sevenSpades);
    expect(board.columns[1]!.active.at(1)).toEqual(sixHearts);
  });

  it('plays from the waste pile', () => {
    const board = new SolitaireBoard(1);
    board.generate();
    const ace = makeCard(Suit.Clubs, Rank.Ace);
    board.waste.active.add(ace);
    expect(board.tryAutoMove(board.waste, ace)).toBe(true);
    expect(board.foundationFor(Suit.Clubs).pile.at(0)).toEqual(ace);
  });

  it('leaves a card in place when no move exists', () => {
    const board = new SolitaireBoard(1);
    const card = makeCard(Suit.Spades, Rank.Seven);
    board.columns[0]!.active.add(card);
    expect(board.tryAutoMove(board.columns[0]!, card)).toBe(false);
    expect(board.columns[0]!.active.at(0)).toEqual(card);
  });

  it('flips a card from the stock to the waste', () => {
    const board = new SolitaireBoard(1);
    const six = makeCard(Suit.Diamonds, Rank.Six);
    const king = makeCard(Suit.Spades, Rank.King);
    board.waste.active.add(six);
    board.stock.add(king);
    board.flipFromStock();
    expect(board.waste.reserve.at(0)).toEqual(six);
    expect(board.waste.active.at(0)).toEqual(king);
  });

  it('recycles the waste when the stock is empty', () => {
    const board = new SolitaireBoard(1);
    const card = makeCard(Suit.Clubs, Rank.Four);
    board.waste.active.add(card);
    board.flipFromStock();
    expect(board.waste.active.at(0)).toEqual(card);
  });

  it('moves a card back from a foundation onto a column', () => {
    const board = new SolitaireBoard(1);
    board.generate();
    const aceSpades = makeCard(Suit.Spades, Rank.Ace);
    const twoHearts = makeCard(Suit.Hearts, Rank.Two);
    board.foundationFor(Suit.Spades).pile.add(aceSpades);
    board.columns[0]!.active.setCards([twoHearts]);

    expect(board.moveFromFoundation(board.foundationFor(Suit.Spades))).toBe(true);
    expect(board.columns[0]!.active.at(0)).toEqual(twoHearts);
    expect(board.columns[0]!.active.at(1)).toEqual(aceSpades);
  });

  it('leaves a foundation card alone when no column accepts it', () => {
    const board = new SolitaireBoard(1);
    const aceSpades = makeCard(Suit.Spades, Rank.Ace);
    board.foundationFor(Suit.Spades).pile.add(aceSpades);
    expect(board.moveFromFoundation(board.foundationFor(Suit.Spades))).toBe(false);
    expect(board.foundationFor(Suit.Spades).pile.at(0)).toEqual(aceSpades);
  });

  // Added: a correct Klondike deal is 28 tableau cards and 24 in stock.
  it('deals a standard Klondike layout', () => {
    const board = new SolitaireBoard(7);
    board.generate(makeRng(7));
    let tableau = 0;
    board.columns.forEach((column, index) => {
      expect(column.reserve.size).toBe(index);
      expect(column.active.size).toBe(1);
      tableau += column.reserve.size + column.active.size;
    });
    expect(tableau).toBe(28);
    expect(board.stock.size).toBe(24);
  });

  // Added: no card may ever be dealt twice.
  it('deals 52 distinct cards', () => {
    const board = new SolitaireBoard(3);
    board.generate(makeRng(3));
    const seen = new Set<string>();
    for (const column of board.columns) {
      for (const c of [...column.reserve.toArray(), ...column.active.toArray()]) {
        seen.add(`${c.suit}-${c.rank}`);
      }
    }
    for (const c of board.stock.toArray()) seen.add(`${c.suit}-${c.rank}`);
    expect(seen.size).toBe(52);
  });
});
