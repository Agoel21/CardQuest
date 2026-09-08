/**
 * Card primitives.
 *
 * Numeric values deliberately mirror the original C# enums
 * (Clubs=1..Spades=4, Ace=1..King=13) so that ported tests and any
 * persisted state remain directly comparable to the legacy implementation.
 */

export enum Suit {
  Clubs = 1,
  Diamonds = 2,
  Hearts = 3,
  Spades = 4,
}

export enum Rank {
  Ace = 1,
  Two = 2,
  Three = 3,
  Four = 4,
  Five = 5,
  Six = 6,
  Seven = 7,
  Eight = 8,
  Nine = 9,
  Ten = 10,
  Jack = 11,
  Queen = 12,
  King = 13,
}

export enum Color {
  Red = 'red',
  Black = 'black',
}

export const SUITS: readonly Suit[] = [Suit.Clubs, Suit.Diamonds, Suit.Hearts, Suit.Spades];

export const RANKS: readonly Rank[] = [
  Rank.Ace, Rank.Two, Rank.Three, Rank.Four, Rank.Five, Rank.Six, Rank.Seven,
  Rank.Eight, Rank.Nine, Rank.Ten, Rank.Jack, Rank.Queen, Rank.King,
];

/**
 * A card is a plain, immutable, JSON-serialisable value.
 *
 * Serialisability is a hard requirement, not a stylistic choice: the whole
 * game state is sent over the wire during peer-to-peer multiplayer, so
 * nothing in the engine may rely on class identity or prototype methods
 * surviving a structuredClone / JSON round-trip.
 */
export interface Card {
  readonly suit: Suit;
  readonly rank: Rank;
}

export function makeCard(suit: Suit, rank: Rank): Card {
  return Object.freeze({ suit, rank });
}

/** Colour is derived, never stored, so it cannot drift out of sync with suit. */
export function colorOf(card: Card): Color {
  return card.suit === Suit.Clubs || card.suit === Suit.Spades ? Color.Black : Color.Red;
}

export function sameCard(a: Card, b: Card): boolean {
  return a.suit === b.suit && a.rank === b.rank;
}

const SUIT_NAMES: Record<Suit, string> = {
  [Suit.Clubs]: 'clubs',
  [Suit.Diamonds]: 'diamonds',
  [Suit.Hearts]: 'hearts',
  [Suit.Spades]: 'spades',
};

const RANK_NAMES: Record<Rank, string> = {
  [Rank.Ace]: 'ace', [Rank.Two]: 'two', [Rank.Three]: 'three', [Rank.Four]: 'four',
  [Rank.Five]: 'five', [Rank.Six]: 'six', [Rank.Seven]: 'seven', [Rank.Eight]: 'eight',
  [Rank.Nine]: 'nine', [Rank.Ten]: 'ten', [Rank.Jack]: 'jack', [Rank.Queen]: 'queen',
  [Rank.King]: 'king',
};

export function suitName(suit: Suit): string {
  return SUIT_NAMES[suit];
}

export function rankName(rank: Rank): string {
  return RANK_NAMES[rank];
}

/** Matches the existing asset filenames, e.g. "queen_of_spades". */
export function assetName(card: Card): string {
  return `${RANK_NAMES[card.rank]}_of_${SUIT_NAMES[card.suit]}`;
}

export function cardLabel(card: Card): string {
  const r = RANK_NAMES[card.rank];
  return `${r.charAt(0).toUpperCase()}${r.slice(1)} of ${SUIT_NAMES[card.suit]}`;
}
