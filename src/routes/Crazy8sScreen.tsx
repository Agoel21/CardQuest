/**
 * Crazy 8s against a computer opponent.
 *
 * The player is always seat 0. The AI takes its turn on a short timer so the
 * table reads as a turn being taken rather than the state snapping.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Card, makeRng, Player, randomSeed, Rank, Suit, suitName } from '../engine';
import { Crazy8sBoard } from '../games/crazy8s/board';
import { Difficulty, STRATEGIES } from '../ai/strategy';
import { CardSlot, PlayingCard } from '../ui/PlayingCard';
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
  const [, setVersion] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [message, setMessage] = useState('Your turn.');

  if (!boardRef.current) boardRef.current = newBoard();
  const board = boardRef.current;

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  const you = board.players[0]!;
  const cpu = board.players[1]!;
  const isYourTurn = board.currentPlayer === you;
  const winner = board.winner;

  const newGame = useCallback(() => {
    boardRef.current = newBoard();
    setMessage('Your turn.');
    refresh();
  }, [refresh]);

  const playCard = useCallback(
    (card: Card) => {
      if (!isYourTurn || winner || board.awaitingSuitChoice) return;
      if (!board.isLegalPlay(card)) {
        setMessage('That card does not match the rank or the suit.');
        return;
      }
      board.playCard(card);
      setMessage(board.awaitingSuitChoice ? 'Pick a suit.' : 'Computer is thinking.');
      refresh();
    },
    [board, isYourTurn, winner, refresh],
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
  }, [board, isYourTurn, winner, refresh]);

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
        board.playCard(choice);
        setMessage(board.awaitingSuitChoice ? 'Computer played an eight.' : 'Your turn.');
      } else {
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

  return (
    <div className="game">
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
          {Array.from({ length: cpu.handSize }, (_, i) => (
            <PlayingCard key={i} faceDown />
          ))}
        </div>
      </section>

      <section className="c8__table" aria-label="Table">
        <div className="c8__pile">
          {/* Never nest a clickable card inside a clickable slot: both
              handlers fire on one click and the player draws twice. */}
          {board.stock.isEmpty ? (
            <CardSlot label="Empty" onClick={isYourTurn ? drawCard : undefined} />
          ) : (
            <PlayingCard faceDown onClick={isYourTurn ? drawCard : undefined} />
          )}
          <span className="c8__pile-label">Draw</span>
        </div>

        <div className="c8__pile">
          {board.activeCard ? <PlayingCard card={board.activeCard} /> : <CardSlot label="Table" />}
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
                playable={isYourTurn && !winner && board.isLegalPlay(card)}
                onClick={() => playCard(card)}
              />
            ))
          )}
        </div>
      </section>

      <p className="game__hint">
        Highlighted cards are legal plays. With nothing playable, draw from the stock.
        {yourHand.some((c) => c.rank === Rank.Eight) ? ' An eight can always be played.' : ''}
      </p>
    </div>
  );
}
