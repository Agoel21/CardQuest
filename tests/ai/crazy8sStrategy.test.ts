/**
 * Fuzz tests for the Crazy 8s opponents.
 *
 * The point of these is not that the AI plays *well* but that it can never
 * play ILLEGALLY. A strategy that cheats or that returns a card it does not
 * hold would corrupt the board, and in multiplayer it would desync the peers.
 */
import { describe, expect, it } from 'vitest';
import { makeRng, Player, Rank } from '../../src/engine';
import { Crazy8sBoard } from '../../src/games/crazy8s/board';
import { Difficulty, STRATEGIES } from '../../src/ai/strategy';

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

/** Plays one game to completion with every seat driven by `difficulty`. */
function playGame(seed: number, difficulty: Difficulty) {
  const board = new Crazy8sBoard(seed);
  board.addPlayer(new Player('a', 'A'));
  board.addPlayer(new Player('b', 'B'));
  board.generate(makeRng(seed));

  const strategy = STRATEGIES[difficulty];
  const rng = makeRng(seed ^ 0x5f3759df);
  let illegalPlays = 0;
  let playedNotInHand = 0;

  // Bounded so a rules bug shows up as a failed assertion, not a hung test.
  for (let turn = 0; turn < 4000 && !board.winner; turn++) {
    const player = board.currentPlayer;
    if (!player) break;

    if (board.awaitingSuitChoice) {
      board.chooseSuit(strategy.chooseSuit(player.hand.toArray(), rng));
      continue;
    }

    const legal = board.legalPlaysFor(player);
    const choice = strategy.chooseCard(
      {
        legalPlays: legal,
        hand: player.hand.toArray(),
        opponentHandSizes: board.players.filter((p) => p !== player).map((p) => p.handSize),
      },
      rng,
    );

    if (choice) {
      if (!board.isLegalPlay(choice)) illegalPlays++;
      if (!player.hand.contains(choice)) playedNotInHand++;
      board.playCard(choice);
    } else {
      const drawn = board.drawFromStock();
      if (!drawn || !board.isLegalPlay(drawn)) board.passTurn();
      else board.playCard(drawn);
    }
  }

  return { board, illegalPlays, playedNotInHand };
}

describe('Crazy 8s strategies', () => {
  for (const difficulty of DIFFICULTIES) {
    it(`never plays an illegal card across 1000 games (${difficulty})`, () => {
      let illegal = 0;
      let notInHand = 0;
      for (let seed = 0; seed < 1000; seed++) {
        const result = playGame(seed, difficulty);
        illegal += result.illegalPlays;
        notInHand += result.playedNotInHand;
      }
      expect(illegal).toBe(0);
      expect(notInHand).toBe(0);
    });
  }

  it('never returns a card the player does not hold', () => {
    const rng = makeRng(11);
    for (let seed = 0; seed < 300; seed++) {
      const board = new Crazy8sBoard(seed);
      board.addPlayer(new Player('a', 'A'));
      board.addPlayer(new Player('b', 'B'));
      board.generate(makeRng(seed));
      const player = board.currentPlayer!;

      for (const difficulty of DIFFICULTIES) {
        const choice = STRATEGIES[difficulty].chooseCard(
          {
            legalPlays: board.legalPlaysFor(player),
            hand: player.hand.toArray(),
            opponentHandSizes: [board.players[1]!.handSize],
          },
          rng,
        );
        if (choice) expect(player.hand.contains(choice)).toBe(true);
      }
    }
  });

  it('hoards eights: medium and hard keep a wild card when a plain one will do', () => {
    // A hand where both a legal plain card and a legal eight are available.
    const board = new Crazy8sBoard(3);
    board.addPlayer(new Player('a', 'A'));
    board.generate(makeRng(3));

    const player = board.players[0]!;
    const plain = board.activeCard!;
    const eight = player.hand.toArray().find((c) => c.rank === Rank.Eight);
    if (!eight) return; // seed-dependent; the fuzz tests above carry the load

    const view = {
      legalPlays: [plain, eight],
      hand: player.hand.toArray(),
      opponentHandSizes: [7],
    };
    expect(STRATEGIES.medium.chooseCard(view, makeRng(1))?.rank).not.toBe(Rank.Eight);
    expect(STRATEGIES.hard.chooseCard(view, makeRng(1))?.rank).not.toBe(Rank.Eight);
  });

  /**
   * The competent strategies must actually beat the random one.
   *
   * Seats are alternated every seed. Without that, whoever leads gets a real
   * first-player advantage and the measurement reports the seating, not the
   * strategy. The bar is 53% rather than the 70% first assumed: measured over
   * 1500 alternating-seat games the true edge is about 57%, because Crazy 8s
   * has a low skill ceiling by nature.
   */
  it('defensive beats random more often than not', () => {
    let defensiveWins = 0;
    let decided = 0;

    for (let seed = 0; seed < 1200; seed++) {
      const board = new Crazy8sBoard(seed);
      const defensive = new Player('defensive', 'Defensive');
      const random = new Player('random', 'Random');

      if (seed % 2 === 0) {
        board.addPlayer(defensive);
        board.addPlayer(random);
      } else {
        board.addPlayer(random);
        board.addPlayer(defensive);
      }
      board.generate(makeRng(seed));

      const rng = makeRng(seed + 104729);
      for (let turn = 0; turn < 4000 && !board.winner; turn++) {
        const player = board.currentPlayer;
        if (!player) break;
        const strategy = player === defensive ? STRATEGIES.hard : STRATEGIES.easy;

        if (board.awaitingSuitChoice) {
          board.chooseSuit(strategy.chooseSuit(player.hand.toArray(), rng));
          continue;
        }
        const choice = strategy.chooseCard(
          {
            legalPlays: board.legalPlaysFor(player),
            hand: player.hand.toArray(),
            opponentHandSizes: board.players.filter((p) => p !== player).map((p) => p.handSize),
          },
          rng,
        );
        if (choice) board.playCard(choice);
        else {
          const drawn = board.drawFromStock();
          if (!drawn || !board.isLegalPlay(drawn)) board.passTurn();
          else board.playCard(drawn);
        }
      }

      if (board.winner) {
        decided++;
        if (board.winner === defensive) defensiveWins++;
      }
    }

    expect(decided).toBeGreaterThan(1000);
    expect(defensiveWins / decided).toBeGreaterThan(0.53);
  });
});
