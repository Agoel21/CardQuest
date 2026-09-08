/**
 * Go Fish against a computer opponent.
 *
 * You pick a rank from the ones you hold; the AI takes its turn on a timer so
 * the exchange reads as a conversation rather than the state snapping.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Card, makeRng, Player, randomSeed, Rank, rankName } from '../engine';
import { GoFishBoard } from '../games/gofish/board';
import { GO_FISH_STRATEGIES } from '../ai/gofishStrategy';
import { Difficulty, DIFFICULTY_LABELS } from '../ai/strategy';
import { PlayingCard } from '../ui/PlayingCard';
import { cardMotionId, useCardMotion } from '../ui/useCardMotion';
import './GameScreen.css';

const AI_TURN_DELAY_MS = 900;
const MAX_LOG = 5;

function bookTarget(root: HTMLDivElement | null): HTMLElement | null {
  return root?.querySelector<HTMLElement>('[data-book-target]') ?? null;
}

function newBoard(): GoFishBoard {
  const board = new GoFishBoard(randomSeed());
  board.addPlayer(new Player('you', 'You'));
  board.addPlayer(new Player('cpu', 'Computer'));
  board.generate();
  return board;
}

export function GoFishScreen() {
  const boardRef = useRef<GoFishBoard | null>(null);
  const rngRef = useRef(makeRng(randomSeed()));
  /** Ranks each player has asked for, which is public information. */
  const askedRef = useRef<Map<string, Rank[]>>(new Map());
  const [version, setVersion] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>('hard');
  const [log, setLog] = useState<string[]>(['Your turn. Ask for a rank you hold.']);
  const motion = useCardMotion(version);

  if (!boardRef.current) boardRef.current = newBoard();
  const board = boardRef.current;

  const refresh = useCallback(() => setVersion((v) => v + 1), []);
  const note = useCallback((line: string) => {
    setLog((entries) => [line, ...entries].slice(0, MAX_LOG));
  }, []);
  const animateBooked = useCallback((before: Card[]) => {
    const after = new Set(board.players.flatMap((player) => player.hand.toArray()).map(cardMotionId));
    const target = bookTarget(motion.rootRef.current);
    for (const card of before) {
      if (!after.has(cardMotionId(card))) motion.animateLeaving(cardMotionId(card), target);
    }
  }, [board, motion]);

  const you = board.players[0]!;
  const cpu = board.players[1]!;
  const isYourTurn = board.currentPlayer === you;

  const newGame = useCallback(() => {
    motion.queueDeal();
    boardRef.current = newBoard();
    askedRef.current = new Map();
    setLog(['Your turn. Ask for a rank you hold.']);
    refresh();
  }, [refresh, motion]);

  const askFor = useCallback(
    (rank: Rank) => {
      if (!isYourTurn || board.isOver) return;
      askedRef.current.set(you.id, [...(askedRef.current.get(you.id) ?? []), rank]);

      const before = board.players.flatMap((player) => player.hand.toArray());
      motion.capture();
      const result = board.ask(rank);
      animateBooked(before);
      if (result.gotCards > 0) {
        note(`You asked for ${rankName(rank)}s and took ${result.gotCards}. Go again.`);
      } else if (result.drewAskedRank) {
        note(`You fished and pulled a ${rankName(rank)}. Go again.`);
      } else {
        note(`You asked for ${rankName(rank)}s. Go fish.`);
      }
      if (result.bookedRank !== undefined) {
        note(`You booked the ${rankName(result.bookedRank)}s.`);
      }
      refresh();
    },
    [board, isYourTurn, you, note, refresh, motion, animateBooked],
  );

  useEffect(() => {
    if (board.isOver || board.currentPlayer !== cpu) return;

    const timer = setTimeout(() => {
      const counts = new Map<Rank, number>();
      for (const card of cpu.hand.toArray()) {
        counts.set(card.rank, (counts.get(card.rank) ?? 0) + 1);
      }

      const rank = GO_FISH_STRATEGIES[difficulty].chooseRank(
        {
          askableRanks: board.ranksInHand(cpu),
          counts,
          opponentAskedFor: askedRef.current.get(you.id) ?? [],
        },
        rngRef.current,
      );

      if (rank === undefined) {
        board.passTurn();
        note('The computer had nothing to ask for.');
        refresh();
        return;
      }

      askedRef.current.set(cpu.id, [...(askedRef.current.get(cpu.id) ?? []), rank]);
      const before = board.players.flatMap((member) => member.hand.toArray());
      motion.capture();
      const result = board.ask(rank);
      animateBooked(before);

      if (result.gotCards > 0) {
        note(`Computer asked for ${rankName(rank)}s and took ${result.gotCards}.`);
      } else if (result.drewAskedRank) {
        note(`Computer fished and pulled a ${rankName(rank)}.`);
      } else {
        note(`Computer asked for ${rankName(rank)}s and went fishing.`);
      }
      if (result.bookedRank !== undefined) {
        note(`Computer booked the ${rankName(result.bookedRank)}s.`);
      }
      refresh();
    }, AI_TURN_DELAY_MS);

    return () => clearTimeout(timer);
  });

  const winner = board.isOver ? board.winner : undefined;
  const askable = board.ranksInHand(you);

  return (
    <div className="game" ref={motion.rootRef}>
      <div className="game__header">
        <div>
          <h1 className="game__title">Go Fish</h1>
          <p className="game__subtitle">
            Ask for a rank you already hold. Collect four to score a book.
          </p>
        </div>
        <div className="game__controls">
          <label className="select">
            <span className="visually-hidden">Opponent style</span>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            >
              {(['easy', 'medium', 'hard'] as Difficulty[]).map((level) => (
                <option key={level} value={level}>
                  {DIFFICULTY_LABELS[level]}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="btn btn--primary" onClick={newGame}>
            New game
          </button>
        </div>
      </div>

      {board.isOver ? (
        <p
          className={`banner ${winner === you ? 'banner--win' : 'banner--stuck'}`}
          role="status"
        >
          {winner === you
            ? `You win, ${board.bookCountFor(you)} books to ${board.bookCountFor(cpu)}.`
            : winner === cpu
              ? `The computer wins, ${board.bookCountFor(cpu)} books to ${board.bookCountFor(you)}.`
              : `A draw at ${board.bookCountFor(you)} books each.`}
        </p>
      ) : (
        <p className="game__status" role="status">
          {isYourTurn ? 'Your turn.' : 'The computer is thinking.'}
        </p>
      )}

      <section className="gofish__scores" aria-label="Books">
        <div className="gofish__score" data-book-target="you">
          <span className="gofish__score-name">Your books</span>
          <span className="gofish__score-value">{board.bookCountFor(you)}</span>
        </div>
        <div className="gofish__score" data-book-target="cpu">
          <span className="gofish__score-name">Computer books</span>
          <span className="gofish__score-value">{board.bookCountFor(cpu)}</span>
        </div>
        <div className="gofish__score">
          <span className="gofish__score-name">Stock</span>
          <span className="gofish__score-value">{board.stock.size}</span>
        </div>
      </section>

      <section className="gofish__stock" data-card-motion-source aria-label={`${board.stock.size} cards in stock`}>
        <PlayingCard
          card={board.stock.peek()}
          faceDown
          motionId={board.stock.peek() ? cardMotionId(board.stock.peek()!) : undefined}
        />
        <span>{board.stock.size} in stock</span>
      </section>

      <section className="c8__opponent" aria-label="Computer hand">
        <span className="c8__seat-label">Computer holds {cpu.handSize}</span>
        <div className="c8__opponent-cards">
          {cpu.hand.toArray().map((card) => (
            <PlayingCard key={cardMotionId(card)} card={card} faceDown motionId={cardMotionId(card)} />
          ))}
        </div>
      </section>

      <section className="gofish__log" aria-label="Recent turns" aria-live="polite">
        {log.map((line, i) => (
          <p key={`${line}-${i}`} className={i === 0 ? 'gofish__log-line' : 'gofish__log-line is-old'}>
            {line}
          </p>
        ))}
      </section>

      {!board.isOver && (
        <section className="gofish__ask" aria-label="Ask for a rank">
          <span className="c8__seat-label">Ask for</span>
          <div className="gofish__ranks">
            {askable.map((rank) => (
              <button
                key={rank}
                type="button"
                className="btn"
                disabled={!isYourTurn}
                onClick={() => askFor(rank)}
              >
                {rankName(rank)}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="c8__hand" aria-label="Your hand">
        <span className="c8__seat-label">Your hand</span>
        <div className="c8__hand-cards">
          {you.hand.toArray().map((card) => (
            <PlayingCard key={`${card.suit}-${card.rank}`} card={card} motionId={cardMotionId(card)} />
          ))}
        </div>
      </section>
    </div>
  );
}
