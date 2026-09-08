/** Ported from TestProject2/TableauColumnTests.cs (4 tests). */
import { describe, expect, it } from 'vitest';
import { Deck, makeCard, Rank, Suit, TableauColumn } from '../../src/engine';

describe('TableauColumn', () => {
  it('builds a column with a reserve and one active card', () => {
    const column = new TableauColumn();
    column.build(Deck.full(), 5);
    expect(column.active.size).toBe(1);
    expect(column.reserve.size).toBe(5);
  });

  it('flips a reserve card up when the active stack empties', () => {
    const column = new TableauColumn();
    column.build(Deck.full(), 1);
    const activeCard = column.active.at(0)!;
    const reserveCard = column.reserve.at(0)!;
    column.takeFrom(activeCard);
    expect(column.active.at(0)).toEqual(reserveCard);
  });

  it('accepts a king onto an empty column', () => {
    const column = new TableauColumn();
    const king = makeCard(Suit.Hearts, Rank.King);
    expect(column.tryAdd([king])).toBe(true);
    expect(column.active.contains(king)).toBe(true);
  });

  it('rejects a non-king onto an empty column', () => {
    const column = new TableauColumn();
    const ace = makeCard(Suit.Hearts, Rank.Ace);
    expect(column.tryAdd([ace])).toBe(false);
    expect(column.active.contains(ace)).toBe(false);
  });

  // Added: Klondike requires descending, alternating colours.
  it('accepts a descending alternating-colour card', () => {
    const column = new TableauColumn();
    // Seed directly: an empty column only ever accepts a king.
    column.active.setCards([makeCard(Suit.Spades, Rank.Seven)]);
    expect(column.tryAdd([makeCard(Suit.Hearts, Rank.Six)])).toBe(true);
  });

  it('rejects a same-colour card', () => {
    const column = new TableauColumn();
    column.active.setCards([makeCard(Suit.Spades, Rank.Seven)]);
    expect(column.tryAdd([makeCard(Suit.Clubs, Rank.Six)])).toBe(false);
  });
});
