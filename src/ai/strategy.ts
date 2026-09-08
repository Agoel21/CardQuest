/**
 * Computer opponents.
 *
 * A strategy only ever chooses among moves the board has already declared
 * legal. It never reaches into the board to mutate state, and it never sees
 * an opponent's hand, so a "hard" opponent is genuinely playing better rather
 * than cheating.
 */
import { Card, colorOf, Rank, Rng, Suit, SUITS } from '../engine';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Crazy8sView {
  /** The cards the AI may legally play this turn. */
  legalPlays: Card[];
  /** The AI's full hand, used for suit-nomination planning. */
  hand: Card[];
  /** How many cards each opponent holds. */
  opponentHandSizes: number[];
}

export interface Strategy {
  readonly name: string;
  /** Returns the card to play, or undefined to draw. */
  chooseCard(view: Crazy8sView, rng: Rng): Card | undefined;
  /** Nominates a suit after playing an eight. */
  chooseSuit(hand: Card[], rng: Rng): Suit;
}

function mostCommonSuit(hand: Card[], rng: Rng): Suit {
  const counts = new Map<Suit, number>();
  for (const card of hand) {
    if (card.rank === Rank.Eight) continue;
    counts.set(card.suit, (counts.get(card.suit) ?? 0) + 1);
  }
  let best: Suit | undefined;
  let bestCount = -1;
  for (const suit of SUITS) {
    const count = counts.get(suit) ?? 0;
    if (count > bestCount) {
      bestCount = count;
      best = suit;
    }
  }
  return best ?? SUITS[rng.nextInt(SUITS.length)]!;
}

/** Plays a legal card at random. Beatable, and useful as a baseline. */
export const easyStrategy: Strategy = {
  name: 'Easy',
  chooseCard(view, rng) {
    if (view.legalPlays.length === 0) return undefined;
    return view.legalPlays[rng.nextInt(view.legalPlays.length)];
  },
  chooseSuit(_hand, rng) {
    return SUITS[rng.nextInt(SUITS.length)]!;
  },
};

/**
 * Sheds high cards first and hoards its eights, since an eight is always
 * playable and is worth keeping for a turn where nothing else works.
 */
export const mediumStrategy: Strategy = {
  name: 'Medium',
  chooseCard(view) {
    if (view.legalPlays.length === 0) return undefined;
    const nonEights = view.legalPlays.filter((c) => c.rank !== Rank.Eight);
    const pool = nonEights.length > 0 ? nonEights : view.legalPlays;
    return [...pool].sort((a, b) => b.rank - a.rank)[0];
  },
  chooseSuit(hand, rng) {
    return mostCommonSuit(hand, rng);
  },
};

/**
 * Plays the card that leaves the strongest hand behind.
 *
 * Scores each legal play by how much follow-on the remaining hand keeps in
 * that suit, prefers to dump high cards, and saves eights unless holding one
 * is worse than playing it. Also plays more aggressively when an opponent is
 * close to going out.
 */
export const hardStrategy: Strategy = {
  name: 'Hard',
  chooseCard(view) {
    if (view.legalPlays.length === 0) return undefined;

    const opponentIsClose = view.opponentHandSizes.some((n) => n <= 2);

    const scored = view.legalPlays.map((card) => {
      const remaining = view.hand.filter((c) => c !== card);
      const sameSuitLeft = remaining.filter((c) => c.suit === card.suit).length;
      const sameRankLeft = remaining.filter((c) => c.rank === card.rank).length;

      let score = 0;
      // Keeping playable follow-ons in the same suit is worth a lot.
      score += sameSuitLeft * 3;
      score += sameRankLeft * 2;
      // Dumping high cards early is good; they are dead weight later.
      score += card.rank * 0.4;
      // An eight is a get-out-of-jail card. Spend it only under pressure.
      if (card.rank === Rank.Eight) score -= opponentIsClose ? 4 : 14;
      // Marginal: matching the table colour tends to keep options open.
      if (remaining.some((c) => colorOf(c) === colorOf(card))) score += 0.5;

      return { card, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.card;
  },
  chooseSuit(hand, rng) {
    return mostCommonSuit(hand, rng);
  },
};

export const STRATEGIES: Record<Difficulty, Strategy> = {
  easy: easyStrategy,
  medium: mediumStrategy,
  hard: hardStrategy,
};
