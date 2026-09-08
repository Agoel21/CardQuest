/**
 * WebRTC transport over PeerJS.
 *
 * PeerJS's free broker is used for SIGNALLING ONLY: it introduces the two
 * browsers to each other and then steps out of the way. Once the handshake is
 * done, every card played travels directly between the two machines, so there
 * is no server in the loop, nothing metered, and no running cost.
 *
 * Known limitation, stated plainly because the README repeats it: a direct
 * connection needs one side to be reachable through its NAT. Home networks
 * usually manage it. Symmetric NATs, common on corporate and some mobile
 * networks, do not, and the fix for those is a TURN relay, which no provider
 * offers free permanently. On such a network the connection simply fails, and
 * the UI says so rather than hanging.
 */
import Peer, { DataConnection } from 'peerjs';
import { ConnectionState, Transport } from './transport';

/** Public STUN only. No account, no key, no bill. */
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:global.stun.twilio.com:3478' },
];

const CONNECT_TIMEOUT_MS = 20_000;

/** Room codes are short and unambiguous: no O/0 or I/1 to mis-type. */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ROOM_PREFIX = 'cardquest-';

export function makeRoomCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
}

export class PeerTransport<TSend, TReceive> implements Transport<TSend, TReceive> {
  state: ConnectionState = 'idle';

  private peer: Peer | undefined;
  private connection: DataConnection | undefined;
  private handlers: ((message: TReceive) => void)[] = [];
  private stateHandlers: ((state: ConnectionState, detail?: string) => void)[] = [];
  private timeout: ReturnType<typeof setTimeout> | undefined;
  /** Queues sends issued before the data channel opened. */
  private outbox: TSend[] = [];

  private setState(state: ConnectionState, detail?: string): void {
    this.state = state;
    for (const handler of this.stateHandlers) handler(state, detail);
  }

  /** Opens a room and waits for someone to join with `code`. */
  host(code: string): void {
    this.setState('connecting');
    this.peer = new Peer(ROOM_PREFIX + code, { config: { iceServers: ICE_SERVERS } });

    this.peer.on('open', () => this.armTimeout('No one joined.'));
    this.peer.on('connection', (connection) => this.adopt(connection));
    this.peer.on('error', (error) => this.fail(error));
  }

  /** Joins the room identified by `code`. */
  join(code: string): void {
    this.setState('connecting');
    this.peer = new Peer({ config: { iceServers: ICE_SERVERS } });

    this.peer.on('open', () => {
      this.armTimeout('Could not reach the other player.');
      const connection = this.peer!.connect(ROOM_PREFIX + code, { reliable: true });
      this.adopt(connection);
    });
    this.peer.on('error', (error) => this.fail(error));
  }

  private armTimeout(message: string): void {
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      if (this.state !== 'connected') {
        this.setState('error', message);
        this.close();
      }
    }, CONNECT_TIMEOUT_MS);
  }

  private adopt(connection: DataConnection): void {
    this.connection = connection;

    connection.on('open', () => {
      clearTimeout(this.timeout);
      this.setState('connected');
      for (const message of this.outbox) connection.send(message);
      this.outbox = [];
    });

    connection.on('data', (data) => {
      for (const handler of this.handlers) handler(data as TReceive);
    });

    connection.on('close', () => this.setState('disconnected', 'Opponent left'));
    connection.on('error', (error) => this.fail(error));
  }

  private fail(error: unknown): void {
    clearTimeout(this.timeout);
    const message = error instanceof Error ? error.message : String(error);

    // PeerJS reports a taken host id when a room code collides.
    if (message.includes('is taken')) {
      this.setState('error', 'That room code is already in use. Try another.');
      return;
    }
    if (message.includes('Could not connect to peer')) {
      this.setState('error', 'No room with that code, or the host has gone.');
      return;
    }
    this.setState('error', message);
  }

  send(message: TSend): void {
    if (this.connection?.open) this.connection.send(message);
    else this.outbox.push(message);
  }

  onMessage(handler: (message: TReceive) => void): () => void {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter((h) => h !== handler);
    };
  }

  onStateChange(handler: (state: ConnectionState, detail?: string) => void): () => void {
    this.stateHandlers.push(handler);
    return () => {
      this.stateHandlers = this.stateHandlers.filter((h) => h !== handler);
    };
  }

  close(): void {
    clearTimeout(this.timeout);
    this.connection?.close();
    this.peer?.destroy();
    this.connection = undefined;
    this.peer = undefined;
  }
}
