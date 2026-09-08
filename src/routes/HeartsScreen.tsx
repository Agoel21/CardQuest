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
import './GameScreen.css';
import './Hearts.css';

const AI_TURN_DELAY_MS = 700;

const SEAT_NAMES = ['You', 'West', 'North', 'East'];

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
  const [, setVersion] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [message, setMessage] = useState('Pick 3 cards to pass.');
  const [selectedPass, setSelectedPass] = useState<Card[]>([]);
  const aiPassHandledForHand = useRef<number>(-1);

  if (!boardRef.current) boardRef.current = newBoard();
  const board = boardRef.current;

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  const you = board.players[0]!;
  const isYourTurn = board.currentPlayer === you;
  const winner = board.winner;

  const newGame = useCallback(() => {
    boardRef.current = newBoard();
    aiPassHandledForHand.current = -1;
    setSelectedPass([]);
    setMessage('Pick 3 cards to pass.');
    refresh();
  }, [refresh]);

  const toggleSelected = useCallback((card: Card) => {
    setSelectedPass((prev) => {
      if (prev.some((c) => sameCard(c, card))) return prev.filter((c) => !sameCard(c, card));
      if (prev.length >= 3) return prev;
      return [...prev, card];
    });
  }, []);

  const confirmPass = useCallback(() => {
    if (selectedPass.length !== 3) return;
    board.selectPassCards(you.id, selectedPass);
    setSelectedPass([]);
    if (board.phase === 'passing') {
      board.executePass();
    }
    setMessage(board.phase === 'playing' ? 'Cards passed. Play begins.' : 'Waiting on the table.');
    refresh();
  }, [board, selectedPass, you.id, refresh]);

  const playCard = useCallback(
    (card: Card) => {
      if (!isYourTurn || winner || board.phase !== 'playing') return;
      const legal = board.legalPlaysFor(you);
      if (!legal.some((c) => sameCard(c, card))) {
        setMessage('That card cannot be played right now.');
        return;
      }
      board.playCard(card);
      if (board.currentTrick.length === 4) {
        board.resolveTrick();
        setMessage(board.phase === 'playing' ? 'Trick taken. Next lead.' : 'Hand complete.');
      } else {
        setMessage('Waiting on the table.');
      }
      refresh();
    },
    [board, isYourTurn, winner, you, refresh],
  );

  const dealNextHand = useCallback(() => {
    board.startHand();
    aiPassHandledForHand.current = -1;
    setSelectedPass([]);
    setMessage(board.phase === 'passing' ? 'Pick 3 cards to pass.' : 'Your lead.');
    refresh();
  }, [board, refresh]);

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
      board.playCard(choice);
      if (board.currentTrick.length === 4) {
        board.resolveTrick();
        setMessage(board.phase === 'playing' ? 'Trick taken.' : 'Hand complete.');
      } else {
        setMessage(`${player.name} played. ${board.currentPlayer === you ? 'Your turn.' : 'Waiting.'}`);
      }
      refresh();
    }, AI_TURN_DELAY_MS);

    return () => clearTimeout(timer);
  });

  const yourHand = you.hand.toArray();
  const leaderOfTrick = board.currentTrick[0]?.playerId;

  return (
    <div className="game">
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
        {board.players.map((p, i) => {
          if (p === you) return null;
          return (
            <div className="hearts__opponent" key={p.id}>
              <span className="hearts__seat-label">
                {p.name}
                {board.currentPlayer === p && !winner ? ' (playing)' : ''}
              </span>
              <span className="hearts__opponent-count">{p.handSize} cards</span>
              <div className="hearts__opponent-cards">
                {Array.from({ length: p.handSize }, (_, j) => (
                  <PlayingCard key={`${i}-${j}`} faceDown />
                ))}
              </div>
            </div>
          );
        })}
      </section>

      <section className="hearts__trick" aria-label="Current trick">
        {board.currentTrick.length === 0 ? (
          <p className="game__hint">No cards on the table yet.</p>
        ) : (
          board.currentTrick.map((entry) => {
            const player = board.players.find((p) => p.id === entry.playerId);
            return (
              <div className="hearts__trick-card" key={entry.playerId}>
                <PlayingCard card={entry.card} />
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

      <section className="hearts__hand" aria-label="Your hand">
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
                playable={
                  board.phase === 'playing'
                  && isYourTurn
                  && !winner
                  && board.legalPlaysFor(you).some((c) => sameCard(c, card))
                }
                onClick={() => playCard(card)}
              />
            ))
          )}
        </div>
      </section>

      <p className="game__hint">
        {board.heartsBroken ? 'Hearts have been broken.' : 'Hearts are not broken yet.'}
        {' '}Highlighted cards in your hand are legal plays.
      </p>

      <p className="visually-hidden">
        {yourHand.map((c) => cardLabel(c)).join(', ')}
      </p>
    </div>
  );
}
