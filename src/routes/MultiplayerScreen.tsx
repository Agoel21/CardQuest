/**
 * Crazy 8s against another person, over a direct browser-to-browser link.
 *
 * One side hosts and reads out a room code; the other joins with it. After
 * the handshake the two browsers talk directly, with no server in between.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Card, Suit, suitName } from '../engine';
import { GameSnapshot, GuestIntent, HostMessage } from '../net/protocol';
import { GuestSession, HostSession } from '../net/session';
import { makeRoomCode, PeerTransport } from '../net/peerTransport';
import { ConnectionState } from '../net/transport';
import { CardSlot, PlayingCard } from '../ui/PlayingCard';
import './GameScreen.css';

type Role = 'choosing' | 'hosting' | 'joining';

const SUIT_GLYPH: Record<Suit, string> = {
  [Suit.Clubs]: '♣',
  [Suit.Diamonds]: '♦',
  [Suit.Hearts]: '♥',
  [Suit.Spades]: '♠',
};

export function MultiplayerScreen() {
  const [role, setRole] = useState<Role>('choosing');
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [connection, setConnection] = useState<ConnectionState>('idle');
  const [detail, setDetail] = useState<string>();
  const [snapshot, setSnapshot] = useState<GameSnapshot>();
  const [rejection, setRejection] = useState<string>();

  const hostRef = useRef<HostSession | null>(null);
  const guestRef = useRef<GuestSession | null>(null);
  const transportRef = useRef<{ close(): void } | null>(null);

  // Tear the connection down if the player navigates away mid-game.
  useEffect(() => {
    return () => {
      hostRef.current?.close();
      guestRef.current?.close();
      transportRef.current?.close();
    };
  }, []);

  const startHosting = useCallback(() => {
    const code = makeRoomCode();
    setRoomCode(code);
    setRole('hosting');

    const transport = new PeerTransport<HostMessage, GuestIntent>();
    transportRef.current = transport;

    transport.onStateChange((state, why) => {
      setConnection(state);
      setDetail(why);
      if (state === 'connected' && !hostRef.current) {
        const session = new HostSession(transport, 'Host', 'Guest');
        hostRef.current = session;
        session.start();
        setSnapshot(session.snapshotForHost());
      }
    });

    transport.host(code);
  }, []);

  const startJoining = useCallback(() => {
    const code = joinCode.trim().toUpperCase();
    if (code.length < 4) return;
    setRole('joining');

    const transport = new PeerTransport<GuestIntent, HostMessage>();
    transportRef.current = transport;

    const session = new GuestSession(transport);
    guestRef.current = session;
    session.onChange(() => {
      setSnapshot(session.snapshot);
      setRejection(session.lastRejection);
    });

    transport.onStateChange((state, why) => {
      setConnection(state);
      setDetail(why);
    });

    transport.join(code);
  }, [joinCode]);

  const isHost = role === 'hosting';

  const refreshHostView = useCallback(() => {
    if (hostRef.current) setSnapshot(hostRef.current.snapshotForHost());
  }, []);

  const playCard = useCallback(
    (card: Card) => {
      if (isHost) {
        if (!hostRef.current?.playCard(card)) setRejection('That is not a legal play.');
        else setRejection(undefined);
        refreshHostView();
      } else {
        guestRef.current?.playCard(card);
      }
    },
    [isHost, refreshHostView],
  );

  const chooseSuit = useCallback(
    (suit: Suit) => {
      if (isHost) {
        hostRef.current?.chooseSuit(suit);
        refreshHostView();
      } else {
        guestRef.current?.chooseSuit(suit);
      }
    },
    [isHost, refreshHostView],
  );

  const draw = useCallback(() => {
    if (isHost) {
      hostRef.current?.draw();
      refreshHostView();
    } else {
      guestRef.current?.draw();
    }
  }, [isHost, refreshHostView]);

  // The host's own view is not pushed to it, so poll the board it owns.
  useEffect(() => {
    if (!isHost || connection !== 'connected') return;
    const id = setInterval(refreshHostView, 250);
    return () => clearInterval(id);
  }, [isHost, connection, refreshHostView]);

  if (role === 'choosing') {
    return (
      <div className="game">
        <div className="game__header">
          <div>
            <h1 className="game__title">Play a friend</h1>
            <p className="game__subtitle">
              Crazy 8s against someone on another computer, browser to browser.
            </p>
          </div>
        </div>

        <div className="mp__choices">
          <section className="mp__choice">
            <h2 className="mp__choice-title">Start a game</h2>
            <p className="mp__choice-text">
              You get a room code to send your opponent however you like.
            </p>
            <button type="button" className="btn btn--primary" onClick={startHosting}>
              Create room
            </button>
          </section>

          <section className="mp__choice">
            <h2 className="mp__choice-title">Join a game</h2>
            <p className="mp__choice-text">Enter the code your opponent sent you.</p>
            <div className="mp__join">
              <label className="visually-hidden" htmlFor="room-code">
                Room code
              </label>
              <input
                id="room-code"
                className="mp__input"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                maxLength={8}
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                className="btn"
                onClick={startJoining}
                disabled={joinCode.trim().length < 4}
              >
                Join
              </button>
            </div>
          </section>
        </div>

        <p className="game__hint">
          The connection is direct between the two browsers. It works on most home
          networks. Some corporate and mobile networks block direct connections
          entirely, and there is no free way around that, so on those it will fail
          rather than fall back.
        </p>
      </div>
    );
  }

  if (connection !== 'connected') {
    return (
      <div className="game">
        <h1 className="game__title">{isHost ? 'Waiting for your opponent' : 'Connecting'}</h1>

        {isHost && (
          <div className="mp__code-panel">
            <span className="mp__code-label">Room code</span>
            <strong className="mp__code">{roomCode}</strong>
            <button
              type="button"
              className="btn"
              onClick={() => navigator.clipboard?.writeText(roomCode)}
            >
              Copy code
            </button>
          </div>
        )}

        {connection === 'error' ? (
          <p className="banner banner--stuck" role="status">
            {detail ?? 'Could not connect.'}
          </p>
        ) : (
          <p className="game__status" role="status">
            {isHost ? 'Send the code to your opponent.' : 'Reaching the other browser.'}
          </p>
        )}

        <button type="button" className="btn" onClick={() => window.location.reload()}>
          Start over
        </button>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="game">
        <p className="game__status">Dealing.</p>
      </div>
    );
  }

  const { yourHand, legalPlays, opponentHandSize, activeCard, activeSuit, yourTurn, winner } =
    snapshot;

  const isLegal = (card: Card) =>
    legalPlays.some((c) => c.suit === card.suit && c.rank === card.rank);

  return (
    <div className="game">
      <div className="game__header">
        <div>
          <h1 className="game__title">Crazy 8s</h1>
          <p className="game__subtitle">
            {isHost ? `Room ${roomCode}` : 'Connected to the host.'}
          </p>
        </div>
      </div>

      {winner ? (
        <p className={`banner ${winner === 'you' ? 'banner--win' : 'banner--stuck'}`} role="status">
          {winner === 'you' ? 'You went out. Nice.' : 'Your opponent went out first.'}
        </p>
      ) : (
        <p className="game__status" role="status">
          {rejection ?? (yourTurn ? 'Your turn.' : 'Waiting for your opponent.')}
        </p>
      )}

      {detail === 'Opponent left' && (
        <p className="banner banner--stuck" role="status">
          Your opponent disconnected.
        </p>
      )}

      <section className="c8__opponent" aria-label="Opponent hand">
        <span className="c8__seat-label">Opponent holds {opponentHandSize}</span>
        <div className="c8__opponent-cards">
          {Array.from({ length: opponentHandSize }, (_, i) => (
            <PlayingCard key={i} faceDown />
          ))}
        </div>
      </section>

      <section className="c8__table" aria-label="Table">
        <div className="c8__pile">
          {snapshot.stockSize === 0 ? (
            <CardSlot label="Empty" />
          ) : (
            <PlayingCard faceDown onClick={yourTurn ? draw : undefined} />
          )}
          <span className="c8__pile-label">Draw</span>
        </div>

        <div className="c8__pile">
          {activeCard ? <PlayingCard card={activeCard} /> : <CardSlot label="Table" />}
          <span className="c8__pile-label">
            Suit in play:{' '}
            {activeSuit ? (
              <strong>
                {SUIT_GLYPH[activeSuit]} {suitName(activeSuit)}
              </strong>
            ) : (
              'none'
            )}
          </span>
        </div>
      </section>

      {snapshot.awaitingSuitChoice && (
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
          {yourHand.map((card) => (
            <PlayingCard
              key={`${card.suit}-${card.rank}`}
              card={card}
              playable={yourTurn && !winner && isLegal(card)}
              onClick={yourTurn && !winner ? () => playCard(card) : undefined}
            />
          ))}
        </div>
      </section>

      <p className="game__hint">
        Highlighted cards are legal plays. With nothing playable, draw from the stock.
      </p>
    </div>
  );
}
