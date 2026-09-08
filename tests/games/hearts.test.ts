import { describe, expect, it } from 'vitest';
import { HeartsBoard, PLAYER_COUNT } from '../../src/games/hearts/board';
import {
  Card, makeCard, makeRng, Player, Rank, Suit,
} from '../../src/engine';
import {
  HEARTS_STRATEGIES, HeartsView,
} from '../../src/ai/heartsStrategy';
import { Difficulty } from '../../src/ai/strategy';

const seatedPlayers = () => [
  new Player('p0', 'p0'),
  new Player('p1', 'p1'),
  new Player('p2', 'p2'),
  new Player('p3', 'p3'),
];

const newBoard = (seed = 1) => {
  const board = new HeartsBoard(seed, seatedPlayers());
  board.startHand(makeRng(seed));
  return board;
};

/** Plays through complete tricks until the hand ends or plays run out. */
function playFullHand(board: HeartsBoard, chooseCard: (legal: Card[], board: HeartsBoard) => Card): void {
  let guard = 0;
  while (board.phase === 'playing' && guard < 1000) {
    guard++;
    const player = board.currentPlayer;
    if (!player) break;
    const legal = board.legalPlaysFor(player);
    if (legal.length === 0) break;
    const card = chooseCard(legal, board);
    board.playCard(card);
    if (board.currentTrick.length === 4) board.resolveTrick();
  }
}

describe('HeartsBoard - deal and passing', () => {
  it('deals 13 cards to each of the 4 players, 52 distinct cards total', () => {
    const board = newBoard(7);
    expect(board.players.length).toBe(PLAYER_COUNT);
    for (const p of board.players) expect(p.handSize).toBe(13);

    const all = board.players.flatMap((p) => p.hand.toArray());
    expect(all.length).toBe(52);
    const distinct = new Set(all.map((c) => `${c.suit}-${c.rank}`));
    expect(distinct.size).toBe(52);
  });

  it('rotates the pass direction by hand number: left, right, across, none', () => {
    const board = newBoard(2);
    expect(board.handNumber).toBe(0);
    expect(board.passDirection).toBe('left');

    board.handNumber = 1;
    expect(board.passDirection).toBe('right');
    board.handNumber = 2;
    expect(board.passDirection).toBe('across');
    board.handNumber = 3;
    expect(board.passDirection).toBe('none');
    board.handNumber = 4;
    expect(board.passDirection).toBe('left');
  });

  it('moves exactly 3 cards between the right players when passing left', () => {
    const board = newBoard(3);
    expect(board.phase).toBe('passing');
    expect(board.passDirection).toBe('left');

    const passes = board.players.map((p) => p.hand.toArray().slice(0, 3));
    board.players.forEach((p, i) => {
      const ok = board.selectPassCards(p.id, passes[i]!);
      expect(ok).toBe(true);
    });

    const before = board.players.map((p) => p.hand.toArray());
    board.executePass();

    expect(board.phase).toBe('playing');
    // Seat i passed left: seat (i+1)%4 should now hold seat i's 3 cards.
    board.players.forEach((_p, i) => {
      const target = board.players[(i + 1) % PLAYER_COUNT]!;
      for (const card of passes[i]!) {
        expect(target.hand.contains(card)).toBe(true);
      }
    });
    // Everyone still holds 13 cards after the swap.
    for (const p of board.players) expect(p.handSize).toBe(13);
    // Sanity: hands actually changed from what they were before the pass.
    board.players.forEach((p, i) => {
      expect(p.hand.toArray()).not.toEqual(before[i]);
    });
  });

  it('does not deal a passing phase on a held hand (hand number 3)', () => {
    const board = new HeartsBoard(9, seatedPlayers());
    board.handNumber = 3;
    board.startHand(makeRng(9));
    expect(board.passDirection).toBe('none');
    expect(board.phase).toBe('playing');
  });

  it('rejects a pass that is not exactly 3 cards', () => {
    const board = newBoard(11);
    const p0 = board.players[0]!;
    const two = p0.hand.toArray().slice(0, 2);
    expect(board.selectPassCards(p0.id, two)).toBe(false);
  });
});

describe('HeartsBoard - opening the hand', () => {
  it('the two of clubs holder leads the first trick', () => {
    const board = newBoard(4);
    // Hand 0 passes left; resolve the pass so play begins.
    board.players.forEach((p) => {
      board.selectPassCards(p.id, p.hand.toArray().slice(0, 3));
    });
    board.executePass();

    const leader = board.currentPlayer;
    expect(leader).toBeDefined();
    expect(leader!.hand.contains(makeCard(Suit.Clubs, Rank.Two))).toBe(true);
  });

  it('the leader\'s only legal opening play is the two of clubs', () => {
    const board = newBoard(4);
    board.players.forEach((p) => board.selectPassCards(p.id, p.hand.toArray().slice(0, 3)));
    board.executePass();

    const leader = board.currentPlayer!;
    const legal = board.legalPlaysFor(leader);
    expect(legal).toEqual([makeCard(Suit.Clubs, Rank.Two)]);
  });
});

/** Resolves a throwaway trick so the board's "first trick" restriction lifts. */
function clearFirstTrickFlag(board: HeartsBoard): void {
  board.currentTrick.push(
    { playerId: 'dummy-0', card: makeCard(Suit.Diamonds, Rank.Ace) },
    { playerId: 'dummy-1', card: makeCard(Suit.Diamonds, Rank.Three) },
    { playerId: 'dummy-2', card: makeCard(Suit.Diamonds, Rank.Four) },
    { playerId: 'dummy-3', card: makeCard(Suit.Diamonds, Rank.Six) },
  );
  board.resolveTrick();
}

describe('HeartsBoard - follow suit and hearts-broken rules', () => {
  it('forces players to follow suit when they can', () => {
    const board = newBoard(20);
    board.phase = 'playing';
    const [p0, p1] = board.players;
    p0!.hand.setCards([makeCard(Suit.Clubs, Rank.King), makeCard(Suit.Hearts, Rank.Two)]);
    p1!.hand.setCards([makeCard(Suit.Clubs, Rank.Five), makeCard(Suit.Diamonds, Rank.Nine)]);
    board.currentPlayerIndex = 0;
    board.playCard(makeCard(Suit.Clubs, Rank.King));

    board.currentPlayerIndex = 1;
    const legal = board.legalPlaysFor(p1!);
    expect(legal).toEqual([makeCard(Suit.Clubs, Rank.Five)]);
  });

  it('cannot lead a heart until hearts have been broken', () => {
    const board = newBoard(21);
    board.phase = 'playing';
    clearFirstTrickFlag(board);
    const p0 = board.players[0]!;
    p0.hand.setCards([makeCard(Suit.Hearts, Rank.King), makeCard(Suit.Clubs, Rank.Five)]);
    board.currentPlayerIndex = 0;
    board.heartsBroken = false;

    const legal = board.legalPlaysFor(p0);
    expect(legal).toEqual([makeCard(Suit.Clubs, Rank.Five)]);
  });

  it('may lead a heart once hearts are broken', () => {
    const board = newBoard(22);
    board.phase = 'playing';
    clearFirstTrickFlag(board);
    const p0 = board.players[0]!;
    p0.hand.setCards([makeCard(Suit.Hearts, Rank.King), makeCard(Suit.Clubs, Rank.Five)]);
    board.currentPlayerIndex = 0;
    board.heartsBroken = true;

    const legal = board.legalPlaysFor(p0);
    expect(legal).toEqual(expect.arrayContaining([
      makeCard(Suit.Hearts, Rank.King), makeCard(Suit.Clubs, Rank.Five),
    ]));
  });

  it('may lead a heart with nothing else, even unbroken', () => {
    const board = newBoard(23);
    board.phase = 'playing';
    clearFirstTrickFlag(board);
    const p0 = board.players[0]!;
    p0.hand.setCards([makeCard(Suit.Hearts, Rank.King), makeCard(Suit.Hearts, Rank.Two)]);
    board.currentPlayerIndex = 0;
    board.heartsBroken = false;

    const legal = board.legalPlaysFor(p0);
    expect(legal.length).toBe(2);
  });
});

describe('HeartsBoard - first trick point restriction', () => {
  it('forbids hearts and the queen of spades on the first trick when void', () => {
    const board = newBoard(30);
    board.phase = 'playing';
    // Force first-trick state by resetting via startHand path (private flag),
    // exercised here through resolveTrick never having been called.
    const p1 = board.players[1]!;
    p1.hand.setCards([
      makeCard(Suit.Hearts, Rank.Two), makeCard(Suit.Spades, Rank.Queen), makeCard(Suit.Diamonds, Rank.Five),
    ]);
    board.currentTrick.push({ playerId: board.players[0]!.id, card: makeCard(Suit.Clubs, Rank.Two) });

    const legal = board.legalPlaysFor(p1);
    expect(legal).toEqual([makeCard(Suit.Diamonds, Rank.Five)]);
  });

  it('allows hearts or the queen on the first trick if that is all that is left', () => {
    const board = newBoard(31);
    board.phase = 'playing';
    const p1 = board.players[1]!;
    p1.hand.setCards([makeCard(Suit.Hearts, Rank.Two), makeCard(Suit.Spades, Rank.Queen)]);
    board.currentTrick.push({ playerId: board.players[0]!.id, card: makeCard(Suit.Clubs, Rank.Two) });

    const legal = board.legalPlaysFor(p1);
    expect(legal.length).toBe(2);
  });
});

describe('HeartsBoard - trick resolution', () => {
  it('the highest card of the led suit wins, not the highest card overall', () => {
    const board = newBoard(40);
    board.phase = 'playing';
    board.currentTrick.push(
      { playerId: 'p0', card: makeCard(Suit.Clubs, Rank.Five) },
      { playerId: 'p1', card: makeCard(Suit.Hearts, Rank.King) },
      { playerId: 'p2', card: makeCard(Suit.Clubs, Rank.King) },
      { playerId: 'p3', card: makeCard(Suit.Clubs, Rank.Two) },
    );
    const winnerId = board.resolveTrick();
    expect(winnerId).toBe('p2');
  });
});

describe('HeartsBoard - scoring', () => {
  it('scores 1 per heart and 13 for the queen of spades', () => {
    const board = newBoard(50);
    board.phase = 'playing';
    board.currentTrick.push(
      { playerId: 'p0', card: makeCard(Suit.Hearts, Rank.Five) },
      { playerId: 'p1', card: makeCard(Suit.Hearts, Rank.King) },
      { playerId: 'p2', card: makeCard(Suit.Spades, Rank.Queen) },
      { playerId: 'p3', card: makeCard(Suit.Clubs, Rank.Two) },
    );
    // p1 has the highest club... wait led suit is hearts here (first card).
    const winnerId = board.resolveTrick();
    expect(winnerId).toBe('p1');
    expect(board.handPointsFor('p1')).toBe(15); // 2 hearts + queen of spades
  });

  it('shooting the moon scores the shooter 0 and everyone else 26', () => {
    const board = newBoard(60);
    // Force one player's hand to have taken every point card, by playing
    // out a rigged sequence of tricks where p0 always wins.
    board.phase = 'playing';

    const heartsAndQueen: Card[] = [];
    for (let r = Rank.Ace; r <= Rank.King; r++) heartsAndQueen.push(makeCard(Suit.Hearts, r));
    heartsAndQueen.push(makeCard(Suit.Spades, Rank.Queen));
    expect(heartsAndQueen.length).toBe(14); // all 13 hearts, plus the queen of spades

    // Award p0 every point card, one rigged trick at a time: p0 leads with
    // the point card, and everyone else follows with a lower off-suit club
    // (irrelevant here since only the led suit's rank decides the winner).
    for (const card of heartsAndQueen) {
      board.currentTrick.push(
        { playerId: 'p0', card },
        { playerId: 'p1', card: makeCard(Suit.Clubs, Rank.Two) },
        { playerId: 'p2', card: makeCard(Suit.Clubs, Rank.Three) },
        { playerId: 'p3', card: makeCard(Suit.Clubs, Rank.Four) },
      );
      board.resolveTrick();
    }

    expect(board.handPointsFor('p0')).toBe(0);
    expect(board.handPointsFor('p1')).toBe(26);
    expect(board.handPointsFor('p2')).toBe(26);
    expect(board.handPointsFor('p3')).toBe(26);
  });
});

describe('HeartsBoard - game end', () => {
  it('ends the game at 100+ points and declares the lowest score the winner', () => {
    const board = newBoard(70);
    board.scores.set(board.players[0]!.id, 40);
    board.scores.set(board.players[1]!.id, 101);
    board.scores.set(board.players[2]!.id, 90);
    board.scores.set(board.players[3]!.id, 88);

    expect(board.winner?.id).toBe(board.players[0]!.id);
  });

  it('has no winner while everyone is under 100', () => {
    const board = newBoard(71);
    board.scores.set(board.players[0]!.id, 40);
    board.scores.set(board.players[1]!.id, 99);
    expect(board.winner).toBeUndefined();
  });
});

describe('Hearts full-hand integration', () => {
  it('deals, passes, plays a whole hand out and lands on 26 (or 78 with a double moon) total points', () => {
    const board = newBoard(80);
    board.players.forEach((p) => board.selectPassCards(p.id, p.hand.toArray().slice(0, 3)));
    board.executePass();
    expect(board.phase).toBe('playing');

    playFullHand(board, (legal) => legal[0]!);

    expect(board.phase === 'handComplete' || board.phase === 'gameOver').toBe(true);
    for (const p of board.players) expect(p.hand.isEmpty).toBe(true);

    const total = board.players.reduce((sum, p) => sum + (board.scores.get(p.id) ?? 0), 0);
    expect([26, 78]).toContain(total);
  });
});

describe('Hearts AI fuzz test', () => {
  const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];

  for (const difficulty of difficulties) {
    it(`plays 200 legal hands at ${difficulty} difficulty with correct scoring`, () => {
      const strategy = HEARTS_STRATEGIES[difficulty];

      for (let hand = 0; hand < 200; hand++) {
        const seed = 1000 + hand;
        const board = new HeartsBoard(seed, seatedPlayers());
        const rng = makeRng(seed);
        board.startHand(rng);

        if (board.phase === 'passing') {
          for (const p of board.players) {
            const chosen = strategy.choosePassCards(p.hand.toArray(), rng);
            expect(chosen.length).toBe(3);
            const ok = board.selectPassCards(p.id, chosen);
            expect(ok).toBe(true);
          }
          board.executePass();
        }
        expect(board.phase).toBe('playing');

        let guard = 0;
        while (board.phase === 'playing' && guard < 2000) {
          guard++;
          const player = board.currentPlayer;
          expect(player).toBeDefined();
          const legal = board.legalPlaysFor(player!);
          expect(legal.length).toBeGreaterThan(0);

          const view: HeartsView = {
            hand: player!.hand.toArray(),
            currentTrick: board.currentTrick,
            cardsPlayedThisHand: board.cardsPlayedThisHand,
            heartsBroken: board.heartsBroken,
          };
          const chosenCard = strategy.chooseCard(legal, view, rng);

          // Every card actually played must have been in legalPlaysFor.
          expect(legal.some((c) => c.suit === chosenCard.suit && c.rank === chosenCard.rank)).toBe(true);

          const played = board.playCard(chosenCard);
          expect(played).toBe(true);

          if (board.currentTrick.length === 4) board.resolveTrick();
        }

        expect(guard).toBeLessThan(2000);
        for (const p of board.players) expect(p.hand.isEmpty).toBe(true);

        // Every hand distributes exactly 26 points, or 78 when the moon is shot.
        const total = board.players.reduce((sum, p) => sum + board.handPointsFor(p.id), 0);
        expect([26, 78]).toContain(total);
      }
    });
  }
});
