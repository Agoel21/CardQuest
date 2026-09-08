/**
 * Computer opponents for Hearts.
 *
 * A strategy only ever chooses among the board's own `legalPlaysFor` result.
 * The view handed to it carries its own hand, the current trick, every card
 * played so far this hand (with who played it, so a "hard" opponent can
 * notice a suit someone ran out of) and whether hearts are broken. It never
 * sees another player's hand, so playing well here means reading the table,
 * not cheating.
 */
import {
  Card, Rank, Rng, shuffleInPlace, Suit, SUITS,
} from '../engine';
import { Difficulty } from './strategy';
import { TrickCard } from '../games/hearts/board';

export interface HeartsView {
  /** This player's own hand. */
  hand: Card[];
  /** Cards played so far in the trick currently on the table. */
  currentTrick: TrickCard[];
  /** Every card played this hand, in play order, across all tricks so far. */
  cardsPlayedThisHand: TrickCard[];
  heartsBroken: boolean;
}

export interface HeartsStrategy {
  readonly name: string;
  /** Picks which of `legalPlays` to play this turn. */
  chooseCard(legalPlays: Card[], view: HeartsView, rng: Rng): Card;
  /** Picks the three cards to hand over before the hand starts. */
  choosePassCards(hand: Card[], rng: Rng): Card[];
}

function isHeart(card: Card): boolean {
  return card.suit === Suit.Hearts;
}

function isQueenOfSpades(card: Card): boolean {
  return card.suit === Suit.Spades && card.rank === Rank.Queen;
}

function isPointCard(card: Card): boolean {
  return isHeart(card) || isQueenOfSpades(card);
}

function lowest(cards: Card[]): Card {
  return cards.reduce((a, b) => (b.rank < a.rank ? b : a));
}

function highest(cards: Card[]): Card {
  return cards.reduce((a, b) => (b.rank > a.rank ? b : a));
}

/** The strongest card of the led suit played so far this trick. */
function currentTrickWinner(trick: TrickCard[], ledSuit: Suit): TrickCard {
  return trick
    .filter((entry) => entry.card.suit === ledSuit)
    .reduce((a, b) => (b.card.rank > a.card.rank ? b : a));
}

function randomThree(hand: Card[], rng: Rng): Card[] {
  const shuffled = [...hand];
  shuffleInPlace(shuffled, rng);
  return shuffled.slice(0, 3);
}

/** Passes its three highest spades and hearts, then its highest remaining cards. */
function passHighPointCards(hand: Card[]): Card[] {
  const pointSuited = hand
    .filter((c) => c.suit === Suit.Spades || c.suit === Suit.Hearts)
    .sort((a, b) => b.rank - a.rank);
  const chosen = pointSuited.slice(0, 3);

  if (chosen.length < 3) {
    const rest = hand
      .filter((c) => !(c.suit === Suit.Spades || c.suit === Suit.Hearts))
      .sort((a, b) => b.rank - a.rank);
    chosen.push(...rest.slice(0, 3 - chosen.length));
  }
  return chosen;
}

/** Plays a legal card at random, and passes three random cards. Beatable, and a baseline. */
export const easyHearts: HeartsStrategy = {
  name: 'Easy',
  chooseCard(legalPlays, _view, rng) {
    return legalPlays[rng.nextInt(legalPlays.length)] ?? legalPlays[0]!;
  },
  choosePassCards(hand, rng) {
    return randomThree(hand, rng);
  },
};

/**
 * Avoids taking pointed tricks when it has a choice, and dumps the queen of
 * spades the moment it is safe to (it can never win a trick it's void in).
 */
export const mediumHearts: HeartsStrategy = {
  name: 'Medium',
  chooseCard(legalPlays, view, _rng) {
    if (legalPlays.length === 1) return legalPlays[0]!;

    const leading = view.currentTrick.length === 0;
    if (leading) {
      const nonPoint = legalPlays.filter((c) => !isPointCard(c));
      return lowest(nonPoint.length > 0 ? nonPoint : legalPlays);
    }

    const ledSuit = view.currentTrick[0]!.card.suit;
    const followingSuit = legalPlays.filter((c) => c.suit === ledSuit);
    const isVoid = followingSuit.length === 0;

    if (isVoid) {
      const queen = legalPlays.find(isQueenOfSpades);
      if (queen) return queen;
      const hearts = legalPlays.filter(isHeart);
      if (hearts.length > 0) return highest(hearts);
      return highest(legalPlays);
    }

    const winner = currentTrickWinner(view.currentTrick, ledSuit);
    const nonWinning = followingSuit.filter((c) => c.rank < winner.card.rank);
    if (nonWinning.length > 0) return highest(nonWinning);
    return lowest(followingSuit.filter((c) => c.rank > winner.card.rank));
  },
  choosePassCards(hand) {
    return passHighPointCards(hand);
  },
};

/** Tracks which suits are known-exhausted, from cards discarded off the led suit. */
function computeVoidSuits(history: TrickCard[]): Map<string, Set<Suit>> {
  const voids = new Map<string, Set<Suit>>();
  for (let i = 0; i < history.length; i++) {
    const trickStart = i - (i % 4);
    const ledSuit = history[trickStart]!.card.suit;
    const entry = history[i]!;
    if (entry.card.suit !== ledSuit) {
      if (!voids.has(entry.playerId)) voids.set(entry.playerId, new Set());
      voids.get(entry.playerId)!.add(ledSuit);
    }
  }
  return voids;
}

/**
 * Everything Medium does, plus: leads away from suits it has seen an
 * opponent run dry (a void player is free to dump the queen of spades onto
 * a trick they cannot otherwise win), plays low rather than high when a
 * pointed trick cannot be avoided, and tries to void a whole suit of its
 * own when passing rather than just shedding high cards.
 */
export const hardHearts: HeartsStrategy = {
  name: 'Hard',
  chooseCard(legalPlays, view, _rng) {
    if (legalPlays.length === 1) return legalPlays[0]!;

    const leading = view.currentTrick.length === 0;
    const voidSuits = computeVoidSuits(view.cardsPlayedThisHand);
    const anyoneVoidIn = (suit: Suit) => [...voidSuits.values()].some((s) => s.has(suit));

    if (leading) {
      const legalToLead = view.heartsBroken
        ? legalPlays
        : legalPlays.filter((c) => !isHeart(c));
      const pool = legalToLead.length > 0 ? legalToLead : legalPlays;
      // Leading into a suit somebody is known void in risks them sluffing
      // the queen of spades straight onto our own lead.
      const safest = pool.filter((c) => !anyoneVoidIn(c.suit));
      return lowest(safest.length > 0 ? safest : pool);
    }

    const ledSuit = view.currentTrick[0]!.card.suit;
    const followingSuit = legalPlays.filter((c) => c.suit === ledSuit);
    const isVoid = followingSuit.length === 0;
    const trickIsPointed = view.currentTrick.some((entry) => isPointCard(entry.card));

    if (isVoid) {
      const queen = legalPlays.find(isQueenOfSpades);
      if (queen) return queen;
      const hearts = legalPlays.filter(isHeart);
      if (hearts.length > 0) return highest(hearts);
      return highest(legalPlays);
    }

    const winner = currentTrickWinner(view.currentTrick, ledSuit);
    const nonWinning = followingSuit.filter((c) => c.rank < winner.card.rank);
    if (nonWinning.length > 0) {
      // Into a pointed trick, keep the strong cards and let the low ones go.
      return trickIsPointed ? lowest(nonWinning) : highest(nonWinning);
    }
    return lowest(followingSuit.filter((c) => c.rank > winner.card.rank));
  },
  choosePassCards(hand, _rng) {
    let target: Suit | undefined;
    let smallestCount = 4;
    for (const suit of SUITS) {
      const count = hand.filter((c) => c.suit === suit).length;
      if (count > 0 && count <= 3 && count < smallestCount) {
        smallestCount = count;
        target = suit;
      }
    }

    const chosen: Card[] = target ? hand.filter((c) => c.suit === target) : [];
    if (chosen.length < 3) {
      const remaining = hand.filter((c) => !chosen.includes(c));
      const fill = passHighPointCards(remaining);
      for (const card of fill) {
        if (chosen.length >= 3) break;
        chosen.push(card);
      }
    }
    return chosen.slice(0, 3);
  },
};

export const HEARTS_STRATEGIES: Record<Difficulty, HeartsStrategy> = {
  easy: easyHearts,
  medium: mediumHearts,
  hard: hardHearts,
};
