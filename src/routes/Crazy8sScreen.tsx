/**
 * Crazy 8s against a computer opponent.
 *
 * The player is always seat 0. The AI takes its turn on a short timer so the
 * table reads as a turn being taken rather than the state snapping.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Card, makeRng, Player, randomSeed, Rank, Suit, suitName } from '../engine';
import { Crazy8sBoard } from '../games/crazy8s/board';
import { Difficulty, DIFFICULTY_LABELS, STRATEGIES } from '../ai/strategy';
import { CardSlot, PlayingCard } from '../ui/PlayingCard';
import { cardMotionId, useCardMotion } from '../ui/useCardMotion';
import { useCardDrag } from '../ui/useCardDrag';
import './GameScreen.css';

const AI_TURN_DELAY_MS = 700;

const SUIT_GLYPH: Record<Suit, string> = {
  [Suit.Clubs]: '♣',
  [Suit.Diamonds]: '♦',
  [Suit.Hearts]: '♥',
  [Suit.Spades]: '♠',
};

function newBoard(): Crazy8sBoard {
  const board = new Crazy8sBoard(randomSeed());
  board.addPlayer(new Player('you', 'You'));
  board.addPlayer(new Player('cpu', 'Computer'));
  board.generate();
  return board;
}

export function Crazy8sScreen() {
  const boardRef = useRef<Crazy8sBoard | null>(null);
  const rngRef = useRef(makeRng(randomSeed()));
  const [version, setVersion] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [message, setMessage] = useState('Your turn.');
  const motion = useCardMotion(version);

  if (!boardRef.current) boardRef.current = newBoard();
  const board = boardRef.current;

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  const you = board.players[0]!;
  const cpu = board.players[1]!;
  const isYourTurn = board.currentPlayer === you;
  const winner = board.winner;

  const newGame = useCallback(() => {
    motion.queueDeal();
    boardRef.current = newBoard();
    setMessage('Your turn.');
    refresh();
  }, [refresh, motion]);

  const playCard = useCallback(
    (card: Card) => {
      if (!isYourTurn || winner || board.awaitingSuitChoice) return;
      if (!board.isLegalPlay(card)) {
        setMessage('That card does not match the rank or the suit.');
        return;
      }
      motion.capture();
      board.playCard(card);
      setMessage(board.awaitingSuitChoice ? 'Pick a suit.' : 'Computer is thinking.');
      refresh();
    },
    [board, isYourTurn, winner, refresh, motion],
  );

  const chooseSuit = useCallback(
    (suit: Suit) => {
      board.chooseSuit(suit);
      setMessage('Computer is thinking.');
      refresh();
    },
    [board, refresh],
  );

  const drawCard = useCallback(() => {
    if (!isYourTurn || winner || board.awaitingSuitChoice) return;
    motion.capture();
    const drawn = board.drawFromStock();
    if (!drawn) {
      setMessage('Nothing left to draw. Passing.');
      board.passTurn();
    } else if (!board.isLegalPlay(drawn)) {
      setMessage('Nothing playable. Turn passes.');
      board.passTurn();
    } else {
      setMessage('You drew a playable card.');
    }
    refresh();
  }, [board, isYourTurn, winner, refresh, motion]);

  // The computer's turn, including its suit nomination after an eight.
  useEffect(() => {
    if (winner || board.currentPlayer !== cpu) return;

    const timer = setTimeout(() => {
      const strategy = STRATEGIES[difficulty];
      const rng = rngRef.current;

      if (board.awaitingSuitChoice) {
        const suit = strategy.chooseSuit(cpu.hand.toArray(), rng);
        board.chooseSuit(suit);
        setMessage(`Computer chose ${suitName(suit)}.`);
        refresh();
        return;
      }

      const choice = strategy.chooseCard(
        {
          legalPlays: board.legalPlaysFor(cpu),
          hand: cpu.hand.toArray(),
          opponentHandSizes: [you.handSize],
        },
        rng,
      );

      if (choice) {
        motion.capture();
        board.playCard(choice);
        setMessage(board.awaitingSuitChoice ? 'Computer played an eight.' : 'Your turn.');
      } else {
        motion.capture();
        const drawn = board.drawFromStock();
        if (!drawn || !board.isLegalPlay(drawn)) {
          board.passTurn();
          setMessage('Computer drew and passed. Your turn.');
        } else {
          board.playCard(drawn);
          setMessage('Computer drew and played. Your turn.');
        }
      }
      refresh();
    }, AI_TURN_DELAY_MS);

    return () => clearTimeout(timer);
  });

  const yourHand = you.hand.toArray();
  const drag = useCardDrag<Card>(useCallback((card, target) => {
    if (target !== 'c8-table' || !isYourTurn || winner || board.awaitingSuitChoice || !board.isLegalPlay(card)) {
      return false;
    }
    motion.capture();
    board.playCard(card);
    setMessage(board.awaitingSuitChoice ? 'Pick a suit.' : 'Computer is thinking.');
    refresh();
    return true;
  }, [board, isYourTurn, winner, motion, refresh]));

  return (
    <div className="game" ref={motion.rootRef}>
      <div className="game__header">
        <div>
          <h1 className="game__title">Crazy 8s</h1>
          <p className="game__subtitle">
            Match the rank or the suit. Eights are wild, and you name the suit.
          </p>
        </div>
        <div className="game__controls">
          <label className="select">
            <span className="visually-hidden">Opponent difficulty</span>
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

      {winner ? (
        <p className={`banner ${winner === you ? 'banner--win' : 'banner--stuck'}`} role="status">
          {winner === you ? 'You went out. Nice.' : 'The computer went out first.'}
        </p>
      ) : (
        <p className="game__status" role="status">
          {message}
        </p>
      )}

      <section className="c8__opponent" aria-label="Computer hand">
        <span className="c8__seat-label">Computer holds {cpu.handSize}</span>
        <div className="c8__opponent-cards">
          {cpu.hand.toArray().map((card) => (
            <PlayingCard key={cardMotionId(card)} card={card} faceDown motionId={cardMotionId(card)} />
          ))}
        </div>
      </section>

      <section className="c8__table" aria-label="Table">
        <div className="c8__pile" data-card-motion-source>
          {/* Never nest a clickable card inside a clickable slot: both
              handlers fire on one click and the player draws twice. */}
          {board.stock.isEmpty ? (
            <CardSlot label="Empty" onClick={isYourTurn ? drawCard : undefined} />
          ) : (
            <PlayingCard card={board.stock.peek()} faceDown motionId={board.stock.peek() ? cardMotionId(board.stock.peek()!) : undefined} onClick={isYourTurn ? drawCard : undefined} />
          )}
          <span className="c8__pile-label">Draw</span>
        </div>

        <div className="c8__pile">
          {board.activeCard ? <PlayingCard key={cardMotionId(board.activeCard)} card={board.activeCard} motionId={cardMotionId(board.activeCard)} flipIn dropTarget="c8-table" playable={drag.dragging} /> : <CardSlot label="Table" dropTarget="c8-table" playable={drag.dragging} />}
          <span className="c8__pile-label">
            Suit in play: {board.activeSuit ? (
              <strong>
                {SUIT_GLYPH[board.activeSuit]} {suitName(board.activeSuit)}
              </strong>
            ) : (
              'none'
            )}
          </span>
        </div>
      </section>

      {board.awaitingSuitChoice && isYourTurn && (
        <div className="c8__suit-choice" role="group" aria-label="Choose a suit">
          {([Suit.Clubs, Suit.Diamonds, Suit.Hearts, Suit.Spades] as Suit[]).map((suit) => (
            <button key={suit} type="button" className="btn" onClick={() => chooseSuit(suit)}>
              {SUIT_GLYPH[suit]} {suitName(suit)}
            </button>
          ))}
        </div>
      )}

      <section className="c8__hand" aria-label="Your hand">
        <span className="c8__seat-label">Your hand</span>
        <div className="c8__hand-cards">
          {yourHand.length === 0 ? (
            <p className="game__hint">No cards left.</p>
          ) : (
            yourHand.map((card) => (
              <PlayingCard
                key={`${card.suit}-${card.rank}`}
                card={card}
                motionId={cardMotionId(card)}
                playable={isYourTurn && !winner && board.isLegalPlay(card)}
                dragging={!!drag.data && cardMotionId(drag.data) === cardMotionId(card)}
                onClick={() => { if (!drag.consumeClick()) playCard(card); }}
                onPointerDown={(event) => drag.start(card, event)}
              />
            ))
          )}
        </div>
      </section>

      <p className="game__hint">
        Highlighted cards are legal plays. With nothing playable, draw from the stock.
        {yourHand.some((c) => c.rank === Rank.Eight) ? ' An eight can always be played.' : ''}
      </p>

      <section className="game__how-to" aria-labelledby="crazy-eights-how-to">
        <h2 id="crazy-eights-how-to">How to play</h2>
        <ol>
          <li>Play a card that matches the table card's rank or suit.</li>
          <li>Play an eight at any time, then choose the suit that continues play.</li>
          <li>Click or drag a highlighted card onto the table. Draw when none is available.</li>
          <li>Empty your hand before the computer does to win.</li>
        </ol>
      </section>
    </div>
  );
}
