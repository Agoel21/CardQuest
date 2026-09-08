/**
 * Multiplayer tests, run over LocalTransport so they need no network and no
 * signalling broker. The session logic under test is byte-for-byte the same
 * as the one used over WebRTC; only the pipe differs.
 */
import { describe, expect, it } from 'vitest';
import { GuestIntent, HostMessage } from '../../src/net/protocol';
import { GuestSession, HostSession } from '../../src/net/session';
import { LocalTransport } from '../../src/net/transport';
import { Rank, Suit, makeCard } from '../../src/engine';

/** Lets queued microtask deliveries flush. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

function connect(seed = 42) {
  const [hostSide, guestSide] = LocalTransport.pair<HostMessage, GuestIntent>();
  const host = new HostSession(hostSide, 'Ana', 'Bo', seed);
  const guest = new GuestSession(guestSide);
  host.start();
  return { host, guest };
}

describe('multiplayer session', () => {
  it('sends the guest a snapshot on connect', async () => {
    const { guest } = connect();
    await settle();
    expect(guest.snapshot).toBeDefined();
    expect(guest.snapshot!.yourHand.length).toBe(5);
    expect(guest.snapshot!.opponentHandSize).toBe(5);
    expect(guest.hostName).toBe('Ana');
  });

  /**
   * The important one. The guest is sent only a COUNT of the host's cards, so
   * a guest reading the raw messages in devtools still learns nothing about
   * what the host holds.
   */
  it('never sends the host hand to the guest', async () => {
    const [hostSide, guestSide] = LocalTransport.pair<HostMessage, GuestIntent>();
    const seen: HostMessage[] = [];
    guestSide.onMessage((m) => seen.push(m));

    const host = new HostSession(hostSide, 'Ana', 'Bo', 7);
    host.start();
    await settle();

    const hostHand = host.board.players[0]!.hand.toArray();
    const wire = JSON.stringify(seen);
    for (const card of hostHand) {
      // The guest's own hand may legitimately contain the same rank/suit
      // values, so assert on the host's specific cards not being enumerable
      // beyond what the guest holds.
      const guestHolds = host.board.players[1]!.hand.contains(card);
      if (!guestHolds && card !== host.board.activeCard) {
        const appearances = wire.split(JSON.stringify(card)).length - 1;
        expect(appearances).toBe(0);
      }
    }
  });

  it('rejects a guest playing out of turn', async () => {
    const { host, guest } = connect();
    await settle();
    // Seed 42 starts on the host, so anything the guest sends is out of turn.
    expect(host.board.currentPlayer).toBe(host.board.players[0]);

    guest.playCard(guest.snapshot!.yourHand[0]!);
    await settle();
    expect(guest.lastRejection).toBe('Not your turn.');
  });

  it('rejects a guest playing a card it does not hold', async () => {
    const { host, guest } = connect();
    await settle();

    // Hand the turn to the guest without going through a play.
    host.board.passTurn();

    const held = new Set(
      host.board.players[1]!.hand.toArray().map((c) => `${c.suit}-${c.rank}`),
    );
    let ghost = makeCard(Suit.Spades, Rank.King);
    for (const suit of [Suit.Spades, Suit.Hearts, Suit.Clubs, Suit.Diamonds]) {
      for (let rank = Rank.Ace; rank <= Rank.King; rank++) {
        if (!held.has(`${suit}-${rank}`)) {
          ghost = makeCard(suit, rank);
        }
      }
    }

    guest.playCard(ghost);
    await settle();
    expect(guest.lastRejection).toBe('You do not hold that card.');
  });

  it('rejects an illegal guest play', async () => {
    const { host, guest } = connect();
    await settle();
    host.board.passTurn();

    const illegal = host.board.players[1]!.hand
      .toArray()
      .find((c) => !host.board.isLegalPlay(c));
    if (!illegal) return; // seed-dependent

    guest.playCard(illegal);
    await settle();
    expect(guest.lastRejection).toBe('That is not a legal play.');
  });

  it('mirrors host moves to the guest', async () => {
    const { host, guest } = connect();
    await settle();

    const legal = host.board.legalPlaysFor(host.board.players[0]!);
    if (legal.length === 0) return;

    host.playCard(legal[0]!);
    await settle();

    expect(guest.snapshot!.activeCard).toEqual(legal[0]);
    expect(guest.snapshot!.opponentHandSize).toBe(4);
  });

  /**
   * A full game driven entirely through the network layer. If host and guest
   * could ever disagree about the board, this would deadlock or end with both
   * sides claiming a different winner.
   */
  it('plays a complete game to a single agreed winner', async () => {
    const { host, guest } = connect(11);
    await settle();

    for (let turn = 0; turn < 3000 && !host.board.winner; turn++) {
      const board = host.board;
      const isHostTurn = board.currentPlayer === board.players[0];
      const player = board.currentPlayer!;

      if (board.awaitingSuitChoice) {
        const suit = player.hand.peek()?.suit ?? Suit.Hearts;
        if (isHostTurn) host.chooseSuit(suit);
        else guest.chooseSuit(suit);
        await settle();
        continue;
      }

      const legal = board.legalPlaysFor(player);
      if (isHostTurn) {
        if (legal[0]) host.playCard(legal[0]);
        else host.draw();
      } else {
        if (legal[0]) guest.playCard(legal[0]);
        else guest.draw();
      }
      await settle();
    }

    expect(host.board.winner).toBeDefined();

    const hostView = host.snapshotForHost();
    const guestView = guest.snapshot!;
    // Exactly one side won, and both agree on which.
    expect(hostView.winner).toBeDefined();
    expect(guestView.winner).toBeDefined();
    expect(hostView.winner).not.toBe(guestView.winner);
  });

  it('tells the guest when the host leaves', async () => {
    const { host, guest } = connect();
    await settle();
    host.close();
    await settle();
    expect(guest.lastRejection).toBe('The host left the game.');
  });
});
