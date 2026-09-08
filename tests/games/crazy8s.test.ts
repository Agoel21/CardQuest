/** Ported from TestProject2/Crazy8sBoardTests.cs (13 tests). */
import { describe, expect, it } from 'vitest';
import { Crazy8sBoard, MAX_PLAYERS, STARTING_HAND_SIZE } from '../../src/games/crazy8s/board';
import { Deck, makeCard, makeRng, Player, Rank, Suit } from '../../src/engine';

const player = (name: string) => new Player(name, name);

describe('Crazy8sBoard', () => {
  it('adds a player', () => {
    const board = new Crazy8sBoard(1);
    const p = player('player');
    board.addPlayer(p);
    expect(board.players[0]).toBe(p);
  });

  it('caps the table at six players', () => {
    const board = new Crazy8sBoard(1);
    for (let i = 0; i < 7; i++) board.addPlayer(player(`p${i}`));
    expect(board.players.length).toBe(MAX_PLAYERS);
  });

  it('distributes five cards to each player', () => {
    const board = new Crazy8sBoard(1);
    board.addPlayer(player('p1'));
    board.addPlayer(player('p2'));
    board.addPlayer(player('p3'));
    board.distribute(Deck.full());
    for (const p of board.players) {
      expect(p.handSize).toBe(STARTING_HAND_SIZE);
    }
  });

  it('plays a card of the same rank', () => {
    const board = new Crazy8sBoard(1);
    board.activeCard = makeCard(Suit.Clubs, Rank.Ace);
    const test = makeCard(Suit.Spades, Rank.Ace);
    expect(board.playCard(test)).toBe(true);
    expect(board.activeCard.suit).toBe(Suit.Spades);
    expect(board.activeCard).toEqual(test);
  });

  it('plays a card of the same suit', () => {
    const board = new Crazy8sBoard(1);
    board.activeCard = makeCard(Suit.Clubs, Rank.Ace);
    board.activeSuit = Suit.Clubs;
    const test = makeCard(Suit.Clubs, Rank.Two);
    expect(board.playCard(test)).toBe(true);
    expect(board.activeCard.rank).toBe(Rank.Two);
    expect(board.activeCard).toEqual(test);
  });

  it('accepts the nominated suit while an eight is active', () => {
    const board = new Crazy8sBoard(1);
    board.activeCard = makeCard(Suit.Diamonds, Rank.Eight);
    board.activeSuit = Suit.Hearts;
    const test = makeCard(Suit.Hearts, Rank.Three);
    expect(board.playCard(test)).toBe(true);
    expect(board.activeCard).toEqual(test);
  });

  it('rejects the wrong suit while an eight is active', () => {
    const board = new Crazy8sBoard(1);
    board.activeCard = makeCard(Suit.Diamonds, Rank.Eight);
    board.activeSuit = Suit.Hearts;
    const test = makeCard(Suit.Diamonds, Rank.Three);
    expect(board.playCard(test)).toBe(false);
    expect(board.activeCard).not.toEqual(test);
  });

  it('accepts an eight while an eight is active', () => {
    const board = new Crazy8sBoard(1);
    board.activeCard = makeCard(Suit.Diamonds, Rank.Eight);
    board.activeSuit = Suit.Hearts;
    const test = makeCard(Suit.Clubs, Rank.Eight);
    expect(board.playCard(test)).toBe(true);
    expect(board.activeCard).toEqual(test);
  });

  it('accepts an eight onto any active card', () => {
    const board = new Crazy8sBoard(1);
    board.activeCard = makeCard(Suit.Diamonds, Rank.Three);
    const test = makeCard(Suit.Spades, Rank.Eight);
    expect(board.playCard(test)).toBe(true);
    expect(board.activeCard).toEqual(test);
  });

  it('draws from the stock', () => {
    const board = new Crazy8sBoard(42);
    const p = player('test_player');
    board.addPlayer(p);
    board.generate();
    const handBefore = p.handSize;
    const stockBefore = board.stock.size;
    board.drawFromStock();
    expect(p.handSize).not.toBe(handBefore);
    expect(board.stock.size).not.toBe(stockBefore);
  });

  it('recycles the discard pile when the stock runs dry', () => {
    const board = new Crazy8sBoard(42);
    const p = player('test_player');
    board.addPlayer(p);
    board.generate();
    const handBefore = p.handSize;

    // Empty the stock, and seed the discard so there is something to recycle.
    board.stock.clear();
    board.discard.setCards(Deck.full().toArray());
    board.drawFromStock();

    expect(p.handSize).toBe(handBefore + 1);
    expect(board.stock.size).toBe(51);
    expect(board.discard.size).toBe(0);
  });

  it('passes the turn to the next player', () => {
    const board = new Crazy8sBoard(42);
    const p1 = player('player_1');
    const p2 = player('player_2');
    board.addPlayer(p1);
    board.addPlayer(p2);
    board.generate();
    board.passTurn();
    expect(board.currentPlayer).toBe(p2);
  });

  it('wraps the turn around to the first player', () => {
    const board = new Crazy8sBoard(42);
    const p1 = player('player_1');
    const p2 = player('player_2');
    board.addPlayer(p1);
    board.addPlayer(p2);
    board.generate();
    board.passTurn();
    expect(board.currentPlayer).toBe(p2);
    board.passTurn();
    expect(board.currentPlayer).toBe(p1);
  });

  // Added: the opening card must never be an eight, since nobody could
  // nominate a suit before the first turn.
  it('never starts on an eight', () => {
    for (let seed = 0; seed < 60; seed++) {
      const board = new Crazy8sBoard(seed);
      board.addPlayer(player('p1'));
      board.generate(makeRng(seed));
      expect(board.activeCard?.rank).not.toBe(Rank.Eight);
    }
  });

  // Added: an eight must not silently skip its suit nomination.
  it('holds the turn open until a suit is nominated after an eight', () => {
    const board = new Crazy8sBoard(1);
    board.addPlayer(player('p1'));
    board.addPlayer(player('p2'));
    board.generate();
    const first = board.currentPlayer;

    board.playCard(makeCard(Suit.Spades, Rank.Eight));
    expect(board.awaitingSuitChoice).toBe(true);
    expect(board.currentPlayer).toBe(first);

    board.chooseSuit(Suit.Hearts);
    expect(board.awaitingSuitChoice).toBe(false);
    expect(board.activeSuit).toBe(Suit.Hearts);
    expect(board.currentPlayer).not.toBe(first);
  });
});
