/**
 * Wire protocol for two-player games.
 *
 * The design is HOST-AUTHORITATIVE. The host runs the only real board; the
 * guest holds a read-only mirror and sends intents. That choice is what makes
 * desync impossible: there is exactly one copy of the truth, so the two sides
 * cannot quietly diverge and disagree about who won.
 *
 * The cost is that the host can, in principle, cheat. For a friendly game of
 * cards between two people who chose to play each other, that is the right
 * trade. Making it cheat-proof would need a referee, and a referee needs a
 * server that is always on, which cannot be had for free permanently.
 */
import { Card, Suit } from '../engine';

export const PROTOCOL_VERSION = 1;

/** What the guest may ask the host to do. */
export type GuestIntent =
  | { type: 'playCard'; card: Card }
  | { type: 'chooseSuit'; suit: Suit }
  | { type: 'draw' }
  | { type: 'requestState' };

/** What the host tells the guest. */
export type HostMessage =
  | { type: 'welcome'; protocolVersion: number; hostName: string }
  | { type: 'state'; snapshot: GameSnapshot }
  | { type: 'rejected'; reason: string }
  | { type: 'opponentLeft' };

export type NetMessage =
  | { from: 'guest'; payload: GuestIntent }
  | { from: 'host'; payload: HostMessage };

/**
 * What the guest is allowed to see.
 *
 * The host sends the guest's own hand but only a COUNT for its own, so a
 * guest who opens devtools still cannot read the host's cards. Hiding
 * information at the point of serialisation is the only place it can be
 * hidden honestly; filtering it in the UI would not.
 */
export interface GameSnapshot {
  yourHand: Card[];
  /**
   * Which of `yourHand` is legal right now.
   *
   * Computed by the host and shipped with the snapshot rather than worked out
   * client-side. The guest has no board to ask, and duplicating the rules on
   * the guest would mean two implementations that could disagree, which is
   * exactly what host authority exists to prevent.
   */
  legalPlays: Card[];
  opponentHandSize: number;
  activeCard: Card | undefined;
  activeSuit: Suit | undefined;
  stockSize: number;
  yourTurn: boolean;
  awaitingSuitChoice: boolean;
  /** Set once someone has gone out. */
  winner: 'you' | 'opponent' | undefined;
}
