/** Go Fish rules and AI. */
import { describe, expect, it } from 'vitest';
import { makeCard, makeRng, Player, Rank, Suit } from '../../src/engine';
import { GoFishBoard, STARTING_HAND_SIZE, TOTAL_BOOKS } from '../../src/games/gofish/board';
import { GO_FISH_STRATEGIES } from '../../src/ai/gofishStrategy';
import { Difficulty } from '../../src/ai/strategy';

function newBoard(seed = 1) {
  const board = new GoFishBoard(seed);
  board.addPlayer(new Player('you', 'You'));
  board.addPlayer(new Player('cpu', 'Computer'));
  board.generate(makeRng(seed));
  return board;
}

describe('GoFishBoard', () => {
  it('deals seven cards each and the rest to stock', () => {
    const board = newBoard();
    const dealt = board.players.reduce((n, p) => n + p.handSize, 0);
    const booked = [...board.books.values()].reduce((n, r) => n + r.length * 4, 0);
    expect(dealt + booked + board.stock.size).toBe(52);
    // A book claimed straight off the deal can leave a hand short of seven.
    expect(dealt + booked).toBe(STARTING_HAND_SIZE * 2);
  });

  it('deals 52 distinct cards', () => {
    const board = newBoard(9);
    const seen = new Set<string>();
    for (const p of board.players) {
      for (const c of p.hand.toArray()) seen.add(`${c.suit}-${c.rank}`);
    }
    for (const c of board.stock.toArray()) seen.add(`${c.suit}-${c.rank}`);
    const bookedCards = [...board.books.values()].reduce((n, r) => n + r.length * 4, 0);
    expect(seen.size + bookedCards).toBe(52);
  });

  it('transfers every matching card and keeps the turn', () => {
    const board = new GoFishBoard(1);
    const you = new Player('you', 'You');
    const cpu = new Player('cpu', 'CPU');
    board.addPlayer(you);
    board.addPlayer(cpu);
    you.hand.setCards([makeCard(Suit.Clubs, Rank.Five)]);
    cpu.hand.setCards([
      makeCard(Suit.Hearts, Rank.Five),
      makeCard(Suit.Spades, Rank.Five),
      makeCard(Suit.Clubs, Rank.Nine),
    ]);

    const result = board.ask(Rank.Five);
    expect(result.gotCards).toBe(2);
    expect(result.turnPassed).toBe(false);
    expect(board.currentPlayer).toBe(you);
    expect(you.handSize).toBe(3);
    expect(cpu.handSize).toBe(1);
  });

  it('goes fishing and passes the turn when the opponent has none', () => {
    const board = new GoFishBoard(1);
    const you = new Player('you', 'You');
    const cpu = new Player('cpu', 'CPU');
    board.addPlayer(you);
    board.addPlayer(cpu);
    you.hand.setCards([makeCard(Suit.Clubs, Rank.Five)]);
    cpu.hand.setCards([makeCard(Suit.Clubs, Rank.Nine)]);
    board.stock.setCards([makeCard(Suit.Hearts, Rank.King)]);

    const result = board.ask(Rank.Five);
    expect(result.wentFishing).toBe(true);
    expect(result.drewAskedRank).toBe(false);
    expect(result.turnPassed).toBe(true);
    expect(board.currentPlayer).toBe(cpu);
  });

  it('keeps the turn when the drawn card is the asked rank', () => {
    const board = new GoFishBoard(1);
    const you = new Player('you', 'You');
    const cpu = new Player('cpu', 'CPU');
    board.addPlayer(you);
    board.addPlayer(cpu);
    you.hand.setCards([makeCard(Suit.Clubs, Rank.Five)]);
    cpu.hand.setCards([makeCard(Suit.Clubs, Rank.Nine)]);
    board.stock.setCards([makeCard(Suit.Hearts, Rank.Five)]);

    const result = board.ask(Rank.Five);
    expect(result.drewAskedRank).toBe(true);
    expect(result.turnPassed).toBe(false);
    expect(board.currentPlayer).toBe(you);
  });

  it('scores a book and removes those cards from hand', () => {
    const board = new GoFishBoard(1);
    const you = new Player('you', 'You');
    const cpu = new Player('cpu', 'CPU');
    board.addPlayer(you);
    board.addPlayer(cpu);
    you.hand.setCards([
      makeCard(Suit.Clubs, Rank.Five),
      makeCard(Suit.Diamonds, Rank.Five),
    ]);
    cpu.hand.setCards([
      makeCard(Suit.Hearts, Rank.Five),
      makeCard(Suit.Spades, Rank.Five),
    ]);

    const result = board.ask(Rank.Five);
    expect(result.bookedRank).toBe(Rank.Five);
    expect(board.bookCountFor(you)).toBe(1);
    expect(you.hand.toArray().some((c) => c.rank === Rank.Five)).toBe(false);
  });

  it('refuses a rank the asker does not hold', () => {
    const board = newBoard(4);
    const you = board.players[0]!;
    const missing = ([Rank.Ace, Rank.Two, Rank.Three, Rank.King] as Rank[]).find(
      (r) => !board.canAsk(you, r),
    );
    if (missing === undefined) return;
    expect(board.ask(missing).gotCards).toBe(0);
  });

  it('is deterministic for a seed', () => {
    const a = newBoard(77).players[0]!.hand.toArray();
    const b = newBoard(77).players[0]!.hand.toArray();
    expect(a).toEqual(b);
  });

  it('plays 200 complete games per difficulty without an illegal ask', () => {
    const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];

    for (const difficulty of difficulties) {
      const strategy = GO_FISH_STRATEGIES[difficulty];
      let illegalAsks = 0;
      let completed = 0;

      for (let seed = 0; seed < 200; seed++) {
        const board = newBoard(seed);
        const rng = makeRng(seed + 31337);
        const askedBy = new Map<string, Rank[]>();

        for (let turn = 0; turn < 2000 && !board.isOver; turn++) {
          const player = board.currentPlayer;
          if (!player) break;

          const counts = new Map<Rank, number>();
          for (const card of player.hand.toArray()) {
            counts.set(card.rank, (counts.get(card.rank) ?? 0) + 1);
          }
          const opponent = board.players.find((p) => p !== player)!;

          const rank = strategy.chooseRank(
            {
              askableRanks: board.ranksInHand(player),
              counts,
              opponentAskedFor: askedBy.get(opponent.id) ?? [],
            },
            rng,
          );

          if (rank === undefined) {
            board.passTurn();
            continue;
          }
          if (!board.canAsk(player, rank)) illegalAsks++;
          askedBy.set(player.id, [...(askedBy.get(player.id) ?? []), rank]);
          board.ask(rank);
        }

        if (board.isOver) completed++;
      }

      expect(illegalAsks).toBe(0);
      expect(completed).toBe(200);
    }
  });

  it('never books more than thirteen ranks in total', () => {
    for (let seed = 0; seed < 60; seed++) {
      const board = newBoard(seed);
      const rng = makeRng(seed);
      for (let turn = 0; turn < 2000 && !board.isOver; turn++) {
        const player = board.currentPlayer;
        if (!player) break;
        const ranks = board.ranksInHand(player);
        if (ranks.length === 0) {
          board.passTurn();
          continue;
        }
        board.ask(ranks[rng.nextInt(ranks.length)]!);
      }
      const total = [...board.books.values()].reduce((n, r) => n + r.length, 0);
      expect(total).toBeLessThanOrEqual(TOTAL_BOOKS);
    }
  });
});
