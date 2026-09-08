/**
 * Hearts against three computer opponents.
 *
 * The player is always seat 0. Each AI seat takes its turn (and its pass,
 * during the passing phase) on a short timer so the table reads as turns
 * being taken rather than the state snapping, the same pattern Crazy 8s
 * uses. The board is a mutable engine object held in a ref; a `version`
 * counter forces the re-render since cloning the whole board on every play
 * would be wasted work for a 52-card, four-hand game.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Card, cardLabel, makeRng, Player, randomSeed, sameCard,
} from '../engine';
import { HeartsBoard } from '../games/hearts/board';
import { Difficulty } from '../ai/strategy';
import { HEARTS_STRATEGIES, HeartsView } from '../ai/heartsStrategy';
import { PlayingCard } from '../ui/PlayingCard';
import { cardMotionId, useCardMotion } from '../ui/useCardMotion';
import { useCardDrag } from '../ui/useCardDrag';
import './GameScreen.css';
import './Hearts.css';

const AI_TURN_DELAY_MS = 700;

const SEAT_NAMES = ['You', 'West', 'North', 'East'];

interface CollectedTrick {
  entries: { playerId: string; card: Card }[];
  winnerId: string;
}

function newBoard(): HeartsBoard {
  const players = SEAT_NAMES.map((name, i) => new Player(`seat-${i}`, name));
  const board = new HeartsBoard(randomSeed(), players);
  board.startHand();
  return board;
}

/** Renders the four seats' cumulative scores. */
function ScoreBoard({ board }: { board: HeartsBoard }) {
  return (
    <ul className="hearts__scores" aria-label="Cumulative scores">
      {board.players.map((p) => (
        <li key={p.id} className="hearts__score">
          <span className="hearts__score-name">{p.name}</span>
          <span className="hearts__score-value">{board.scores.get(p.id) ?? 0}</span>
        </li>
      ))}
    </ul>
  );
}

export function HeartsScreen() {
  const boardRef = useRef<HeartsBoard | null>(null);
  const rngRef = useRef(makeRng(randomSeed()));
  const [version, setVersion] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [message, setMessage] = useState('Pick 3 cards to pass.');
  const [selectedPass, setSelectedPass] = useState<Card[]>([]);
  const [collectedTrick, setCollectedTrick] = useState<CollectedTrick | null>(null);
  const aiPassHandledForHand = useRef<number>(-1);
  const collectionTimers = useRef<number[]>([]);

  if (!boardRef.current) boardRef.current = newBoard();
  const board = boardRef.current;
  const motion = useCardMotion(version);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  const you = board.players[0]!;
  const isYourTurn = board.currentPlayer === you;
  const winner = board.winner;

  const newGame = useCallback(() => {
    motion.queueDeal();
    boardRef.current = newBoard();
    aiPassHandledForHand.current = -1;
    setSelectedPass([]);
    setMessage('Pick 3 cards to pass.');
    refresh();
  }, [refresh, motion]);

  const toggleSelected = useCallback((card: Card) => {
    setSelectedPass((prev) => {
      if (prev.some((c) => sameCard(c, card))) return prev.filter((c) => !sameCard(c, card));
      if (prev.length >= 3) return prev;
      return [...prev, card];
    });
  }, []);

  const confirmPass = useCallback(() => {
    if (selectedPass.length !== 3) return;
    motion.capture();
    board.selectPassCards(you.id, selectedPass);
    setSelectedPass([]);
    if (board.phase === 'passing') {
      board.executePass();
    }
    setMessage(board.phase === 'playing' ? 'Cards passed. Play begins.' : 'Waiting on the table.');
    refresh();
  }, [board, selectedPass, you.id, refresh, motion]);

  const playCard = useCallback(
    /**
     * `release` is supplied when the move came from a drag, so the follow-up
     * animation starts where the player let go rather than replaying the drag
     * from the card's old position in the hand.
     */
    (card: Card, release?: { rect: DOMRect; ids: string[] }) => {
      if (!isYourTurn || winner || board.phase !== 'playing') return;
      const legal = board.legalPlaysFor(you);
      if (!legal.some((c) => sameCard(c, card))) {
        setMessage('That card cannot be played right now.');
        return;
      }
      motion.capture();
      if (release) motion.noteRelease(release.ids, release.rect);
      board.playCard(card);
      if (board.currentTrick.length === 4) {
        const entries = [...board.currentTrick];
        const winnerId = board.resolveTrick();
        if (winnerId) {
          setCollectedTrick({ entries, winnerId });
          const startTimer = window.setTimeout(() => {
            const target = motion.rootRef.current?.querySelector<HTMLElement>(
              `[data-hearts-seat="${winnerId}"]`,
            );
            for (const entry of entries) motion.animateLeaving(cardMotionId(entry.card), target);
            const finishTimer = window.setTimeout(() => setCollectedTrick(null), 330);
            collectionTimers.current.push(finishTimer);
          }, 0);
          collectionTimers.current.push(startTimer);
        }
        setMessage(board.phase === 'playing' ? 'Trick taken. Next lead.' : 'Hand complete.');
      } else {
        setMessage('Waiting on the table.');
      }
      refresh();
    },
    [board, isYourTurn, winner, you, refresh, motion],
  );

  const dealNextHand = useCallback(() => {
    motion.queueDeal();
    board.startHand();
    aiPassHandledForHand.current = -1;
    setSelectedPass([]);
    setMessage(board.phase === 'passing' ? 'Pick 3 cards to pass.' : 'Your lead.');
    refresh();
  }, [board, refresh, motion]);

  useEffect(() => () => {
    for (const timer of collectionTimers.current) window.clearTimeout(timer);
  }, []);

  // AI seats submit their passes as soon as a new passing phase opens, so
  // the human only ever waits on themselves.
  useEffect(() => {
    if (board.phase !== 'passing') return;
    if (aiPassHandledForHand.current === board.handNumber) return;
    aiPassHandledForHand.current = board.handNumber;

    const strategy = HEARTS_STRATEGIES[difficulty];
    for (const player of board.players) {
      if (player === you) continue;
      const chosen = strategy.choosePassCards(player.hand.toArray(), rngRef.current);
      board.selectPassCards(player.id, chosen);
    }
    refresh();
  });

  // The computer seats' turn to play, once passing is done.
  useEffect(() => {
    if (winner || board.phase !== 'playing' || isYourTurn) return;
    const player = board.currentPlayer;
    if (!player) return;

    const timer = setTimeout(() => {
      const strategy = HEARTS_STRATEGIES[difficulty];
      const legal = board.legalPlaysFor(player);
      const view: HeartsView = {
        hand: player.hand.toArray(),
        currentTrick: board.currentTrick,
        cardsPlayedThisHand: board.cardsPlayedThisHand,
        heartsBroken: board.heartsBroken,
      };
      const choice = strategy.chooseCard(legal, view, rngRef.current);
      motion.capture();
      board.playCard(choice);
      if (board.currentTrick.length === 4) {
        const entries = [...board.currentTrick];
        const winnerId = board.resolveTrick();
        if (winnerId) {
          setCollectedTrick({ entries, winnerId });
          const startTimer = window.setTimeout(() => {
            const target = motion.rootRef.current?.querySelector<HTMLElement>(
              `[data-hearts-seat="${winnerId}"]`,
            );
            for (const entry of entries) motion.animateLeaving(cardMotionId(entry.card), target);
            const finishTimer = window.setTimeout(() => setCollectedTrick(null), 330);
            collectionTimers.current.push(finishTimer);
          }, 0);
          collectionTimers.current.push(startTimer);
        }
        setMessage(board.phase === 'playing' ? 'Trick taken.' : 'Hand complete.');
      } else {
        setMessage(`${player.name} played. ${board.currentPlayer === you ? 'Your turn.' : 'Waiting.'}`);
      }
      refresh();
    }, AI_TURN_DELAY_MS);

    return () => clearTimeout(timer);
  });

  const yourHand = you.hand.toArray();
  const visibleTrick = collectedTrick?.entries ?? board.currentTrick;
  const leaderOfTrick = visibleTrick[0]?.playerId;
  const drag = useCardDrag<Card>(useCallback((card, target, releaseRect, ids) => {
    if (target !== 'hearts-trick' || !isYourTurn || winner || board.phase !== 'playing') return false;
    if (!board.legalPlaysFor(you).some((legal) => sameCard(legal, card))) return false;
    playCard(card, { rect: releaseRect, ids });
    return true;
  }, [board, isYourTurn, winner, you, playCard]));

  return (
    <div className="game" ref={motion.rootRef}>
      <div className="game__header">
        <div>
          <h1 className="game__title">Hearts</h1>
          <p className="game__subtitle">
            Avoid hearts and the queen of spades. Lowest score wins once someone reaches 100.
          </p>
        </div>
        <div className="game__controls">
          <label className="select">
            <span className="visually-hidden">Opponent difficulty</span>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </label>
          <button type="button" className="btn btn--primary" onClick={newGame}>
            New game
          </button>
        </div>
      </div>

      {winner ? (
        <p className={`banner ${winner === you ? 'banner--win' : 'banner--stuck'}`} role="status">
          {winner === you ? 'You win with the lowest score.' : `${winner.name} wins with the lowest score.`}
        </p>
      ) : (
        <p className="game__status" role="status">
          {message}
        </p>
      )}

      <ScoreBoard board={board} />

      <section className="hearts__opponents" aria-label="Other players">
        {board.players.map((p) => {
          if (p === you) return null;
          return (
            <div
              className={`hearts__opponent${board.currentPlayer === p && !winner ? ' is-active' : ''}`}
              data-hearts-seat={p.id}
              key={p.id}
            >
              <span className="hearts__seat-label">
                {p.name}
                {board.currentPlayer === p && !winner ? ' (playing)' : ''}
              </span>
              <span className="hearts__opponent-count">{p.handSize} cards</span>
              <div className="hearts__opponent-cards">
                {p.hand.toArray().map((card) => (
                  <PlayingCard key={cardMotionId(card)} card={card} faceDown motionId={cardMotionId(card)} />
                ))}
              </div>
            </div>
          );
        })}
      </section>

      <section className="hearts__trick" data-card-motion-source data-drop-target="hearts-trick" aria-label="Current trick">
        {visibleTrick.length === 0 ? (
          <p className="game__hint">No cards on the table yet.</p>
        ) : (
          visibleTrick.map((entry) => {
            const player = board.players.find((p) => p.id === entry.playerId);
            return (
              <div className="hearts__trick-card" key={entry.playerId}>
                <PlayingCard key={cardMotionId(entry.card)} card={entry.card} motionId={cardMotionId(entry.card)} flipIn />
                <span className="hearts__trick-label">
                  {player?.name ?? entry.playerId}
                  {entry.playerId === leaderOfTrick ? ' (led)' : ''}
                </span>
              </div>
            );
          })
        )}
      </section>

      {board.phase === 'handComplete' && !winner && (
        <p className="banner banner--stuck hearts__hand-banner" role="status">
          Hand complete.
          <button type="button" className="btn" onClick={dealNextHand}>
            Deal next hand
          </button>
        </p>
      )}

      {board.phase === 'passing' && !winner && (
        <section className="hearts__pass" role="group" aria-label="Choose 3 cards to pass">
          <p className="game__hint">
            Passing {board.passDirection === 'left' ? 'left' : board.passDirection === 'right' ? 'right' : 'across'}.
            Choose {3 - selectedPass.length} more card{3 - selectedPass.length === 1 ? '' : 's'}.
          </p>
          <div className="hearts__hand-cards">
            {yourHand.map((card) => (
              <PlayingCard
                key={`${card.suit}-${card.rank}`}
                card={card}
                selected={selectedPass.some((c) => sameCard(c, card))}
                playable
                onClick={() => toggleSelected(card)}
              />
            ))}
          </div>
          <button
            type="button"
            className="btn btn--primary"
            disabled={selectedPass.length !== 3}
            onClick={confirmPass}
          >
            Confirm pass
          </button>
        </section>
      )}

      <section
        className={`hearts__hand${isYourTurn && board.phase === 'playing' && !winner ? ' is-active' : ''}`}
        data-hearts-seat={you.id}
        aria-label="Your hand"
      >
        <span className="hearts__seat-label">
          Your hand{isYourTurn && board.phase === 'playing' && !winner ? ' (your turn)' : ''}
        </span>
        <div className="hearts__hand-cards">
          {yourHand.length === 0 ? (
            <p className="game__hint">No cards left.</p>
          ) : (
            yourHand.map((card) => (
              <PlayingCard
                key={`${card.suit}-${card.rank}`}
                card={card}
                motionId={cardMotionId(card)}
                playable={
                  board.phase === 'playing'
                  && isYourTurn
                  && !winner
                  && board.legalPlaysFor(you).some((c) => sameCard(c, card))
                }
                dragging={!!drag.data && sameCard(drag.data, card)}
                onClick={() => { if (!drag.consumeClick()) playCard(card); }}
                onPointerDown={board.phase === 'playing' ? (event) => drag.start(card, event) : undefined}
              />
            ))
          )}
        </div>
      </section>

      <p className="game__hint">
        {board.heartsBroken ? 'Hearts have been broken.' : 'Hearts are not broken yet.'}
        {' '}Highlighted cards in your hand are legal plays.
      </p>

      <section className="game__how-to" aria-labelledby="hearts-how-to">
        <h2 id="hearts-how-to">How to play</h2>
        <ol>
          <li>Choose three cards to pass when a hand begins, except on held hands.</li>
          <li>Follow the suit led whenever you can. The highest card in the led suit takes the trick.</li>
          <li>Avoid hearts and the queen of spades. They add points to tricks you take.</li>
          <li>Once a score reaches 100, the lowest total wins. Taking every point card shoots the moon.</li>
        </ol>
      </section>

      <p className="visually-hidden">
        {yourHand.map((c) => cardLabel(c)).join(', ')}
      </p>
    </div>
  );
}
