/**
 * Host and guest sessions for a two-player Crazy 8s game.
 *
 * The host owns the board and is the only side that mutates it. The guest
 * never runs game logic at all: it renders the last snapshot it was sent and
 * asks the host to do things. Every rule check therefore happens exactly once,
 * in one place, which is what makes a desync structurally impossible rather
 * than merely unlikely.
 */
import { Card, Player, randomSeed, Suit } from '../engine';
import { Crazy8sBoard } from '../games/crazy8s/board';
import { GameSnapshot, GuestIntent, HostMessage, PROTOCOL_VERSION } from './protocol';
import { Transport } from './transport';

export class HostSession {
  readonly board: Crazy8sBoard;
  private readonly transport: Transport<HostMessage, GuestIntent>;
  private readonly host: Player;
  private readonly guest: Player;
  private unsubscribe: (() => void) | undefined;

  constructor(
    transport: Transport<HostMessage, GuestIntent>,
    hostName = 'Host',
    guestName = 'Guest',
    seed: number = randomSeed(),
  ) {
    this.transport = transport;
    this.board = new Crazy8sBoard(seed);
    this.host = new Player('host', hostName);
    this.guest = new Player('guest', guestName);
    this.board.addPlayer(this.host);
    this.board.addPlayer(this.guest);
    this.board.generate();

    this.unsubscribe = transport.onMessage((intent) => this.handle(intent));
  }

  start(): void {
    this.transport.send({
      type: 'welcome',
      protocolVersion: PROTOCOL_VERSION,
      hostName: this.host.name,
    });
    this.pushState();
  }

  /** The host's own view, for rendering its side of the table. */
  snapshotForHost(): GameSnapshot {
    return this.snapshotFor(this.host, this.guest);
  }

  private snapshotFor(viewer: Player, opponent: Player): GameSnapshot {
    const winner = this.board.winner;
    const isViewersTurn = this.board.currentPlayer === viewer;
    return {
      yourHand: viewer.hand.toArray(),
      legalPlays: isViewersTurn ? this.board.legalPlaysFor(viewer) : [],
      opponentHandSize: opponent.handSize,
      activeCard: this.board.activeCard,
      activeSuit: this.board.activeSuit,
      stockSize: this.board.stock.size,
      yourTurn: this.board.currentPlayer === viewer,
      awaitingSuitChoice: this.board.awaitingSuitChoice && this.board.currentPlayer === viewer,
      winner: winner ? (winner === viewer ? 'you' : 'opponent') : undefined,
    };
  }

  private pushState(): void {
    this.transport.send({ type: 'state', snapshot: this.snapshotFor(this.guest, this.host) });
  }

  /**
   * Applies a guest intent, after checking it is actually the guest's turn and
   * that the card is one the guest holds. Both checks matter: without them a
   * modified client could play out of turn or play a card it does not have.
   */
  private handle(intent: GuestIntent): void {
    if (intent.type === 'requestState') {
      this.pushState();
      return;
    }

    if (this.board.currentPlayer !== this.guest) {
      this.transport.send({ type: 'rejected', reason: 'Not your turn.' });
      this.pushState();
      return;
    }

    switch (intent.type) {
      case 'playCard': {
        if (!this.guest.hand.contains(intent.card)) {
          this.transport.send({ type: 'rejected', reason: 'You do not hold that card.' });
          break;
        }
        if (!this.board.isLegalPlay(intent.card)) {
          this.transport.send({ type: 'rejected', reason: 'That is not a legal play.' });
          break;
        }
        this.board.playCard(intent.card);
        break;
      }
      case 'chooseSuit': {
        if (!this.board.chooseSuit(intent.suit)) {
          this.transport.send({ type: 'rejected', reason: 'No suit choice is pending.' });
        }
        break;
      }
      case 'draw': {
        const drawn = this.board.drawFromStock();
        if (!drawn || !this.board.isLegalPlay(drawn)) this.board.passTurn();
        break;
      }
    }

    this.pushState();
  }

  /** Host-side moves. Applied directly, then mirrored to the guest. */
  playCard(card: Card): boolean {
    if (this.board.currentPlayer !== this.host) return false;
    if (!this.board.isLegalPlay(card)) return false;
    const played = this.board.playCard(card);
    this.pushState();
    return played;
  }

  chooseSuit(suit: Suit): boolean {
    const chosen = this.board.chooseSuit(suit);
    this.pushState();
    return chosen;
  }

  draw(): void {
    if (this.board.currentPlayer !== this.host) return;
    const drawn = this.board.drawFromStock();
    if (!drawn || !this.board.isLegalPlay(drawn)) this.board.passTurn();
    this.pushState();
  }

  close(): void {
    this.unsubscribe?.();
    this.transport.send({ type: 'opponentLeft' });
    this.transport.close();
  }
}

export class GuestSession {
  snapshot: GameSnapshot | undefined;
  hostName = 'Host';
  lastRejection: string | undefined;

  private readonly transport: Transport<GuestIntent, HostMessage>;
  private readonly listeners: (() => void)[] = [];
  private unsubscribe: (() => void) | undefined;

  constructor(transport: Transport<GuestIntent, HostMessage>) {
    this.transport = transport;
    this.unsubscribe = transport.onMessage((message) => this.handle(message));
  }

  private handle(message: HostMessage): void {
    switch (message.type) {
      case 'welcome':
        // A version mismatch means the two sides disagree about the wire
        // format, so fail loudly rather than misinterpreting later messages.
        if (message.protocolVersion !== PROTOCOL_VERSION) {
          this.lastRejection = 'The other player is running a different version of the game.';
          break;
        }
        this.hostName = message.hostName;
        break;
      case 'state':
        // Deliberately does NOT clear lastRejection. The host always pushes a
        // fresh state straight after a rejection, so clearing here would wipe
        // the reason before the UI ever rendered it. A rejection stands until
        // the guest tries something else.
        this.snapshot = message.snapshot;
        break;
      case 'rejected':
        this.lastRejection = message.reason;
        break;
      case 'opponentLeft':
        this.lastRejection = 'The host left the game.';
        break;
    }
    for (const listener of this.listeners) listener();
  }

  onChange(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index >= 0) this.listeners.splice(index, 1);
    };
  }

  playCard(card: Card): void {
    this.lastRejection = undefined;
    this.transport.send({ type: 'playCard', card });
  }

  chooseSuit(suit: Suit): void {
    this.lastRejection = undefined;
    this.transport.send({ type: 'chooseSuit', suit });
  }

  draw(): void {
    this.lastRejection = undefined;
    this.transport.send({ type: 'draw' });
  }

  requestState(): void {
    this.transport.send({ type: 'requestState' });
  }

  close(): void {
    this.unsubscribe?.();
    this.transport.close();
  }
}
