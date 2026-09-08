/**
 * Transport abstraction.
 *
 * The games talk to this interface, never to PeerJS directly, so the
 * networking can be swapped or stubbed. `LocalTransport` in particular lets
 * the whole multiplayer flow be tested without a network or a broker.
 */
export type ConnectionState =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error';

export interface Transport<TSend, TReceive> {
  readonly state: ConnectionState;
  send(message: TSend): void;
  onMessage(handler: (message: TReceive) => void): () => void;
  onStateChange(handler: (state: ConnectionState, detail?: string) => void): () => void;
  close(): void;
}

/**
 * An in-process transport that wires two endpoints straight to each other.
 * Used by the tests, and by "pass and play" on a single machine.
 */
export class LocalTransport<A, B> implements Transport<A, B> {
  state: ConnectionState = 'connected';
  private handlers: ((message: B) => void)[] = [];
  private stateHandlers: ((state: ConnectionState, detail?: string) => void)[] = [];
  private peer: LocalTransport<B, A> | undefined;

  /** Creates a connected pair. */
  static pair<X, Y>(): [LocalTransport<X, Y>, LocalTransport<Y, X>] {
    const a = new LocalTransport<X, Y>();
    const b = new LocalTransport<Y, X>();
    a.peer = b;
    b.peer = a;
    return [a, b];
  }

  send(message: A): void {
    if (this.state !== 'connected' || !this.peer) return;
    // Deliver asynchronously so local play has the same ordering semantics as
    // a real network, and a bug that depends on synchronous delivery cannot
    // hide here and then appear only over a real connection.
    queueMicrotask(() => this.peer?.receive(message));
  }

  private receive(message: unknown): void {
    for (const handler of this.handlers) handler(message as B);
  }

  onMessage(handler: (message: B) => void): () => void {
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
    this.state = 'disconnected';
    for (const handler of this.stateHandlers) handler('disconnected');
    this.peer?.remoteClosed();
  }

  private remoteClosed(): void {
    this.state = 'disconnected';
    for (const handler of this.stateHandlers) handler('disconnected', 'Opponent left');
  }
}
