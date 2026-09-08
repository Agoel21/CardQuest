/**
 * Go Fish opponents.
 *
 * The AI may use only what a real player at the table could know: its own
 * hand, and which ranks the opponent has asked for (an ask reveals that they
 * hold at least one of that rank). It never reads the opponent's hand.
 */
import { Rank, Rng } from '../engine';
import { Difficulty } from './strategy';

export interface GoFishView {
  /** Ranks the AI itself holds, and may therefore legally ask for. */
  askableRanks: Rank[];
  /** How many of each rank the AI holds. */
  counts: Map<Rank, number>;
  /** Ranks the opponent has asked about, so is known to hold. */
  opponentAskedFor: Rank[];
}

export interface GoFishStrategy {
  readonly name: string;
  chooseRank(view: GoFishView, rng: Rng): Rank | undefined;
}

function mostHeld(view: GoFishView): Rank | undefined {
  let best: Rank | undefined;
  let bestCount = 0;
  for (const rank of view.askableRanks) {
    const count = view.counts.get(rank) ?? 0;
    if (count > bestCount) {
      bestCount = count;
      best = rank;
    }
  }
  return best ?? view.askableRanks[0];
}

export const easyGoFish: GoFishStrategy = {
  name: 'Random',
  chooseRank(view, rng) {
    if (view.askableRanks.length === 0) return undefined;
    return view.askableRanks[rng.nextInt(view.askableRanks.length)];
  },
};

export const mediumGoFish: GoFishStrategy = {
  name: 'Balanced',
  chooseRank(view) {
    return mostHeld(view);
  },
};

/**
 * Asks first for ranks the opponent has previously asked about, since that is
 * hard evidence they hold one. This is the only real information edge in Go
 * Fish, and using it is what separates a thinking opponent from a guessing one.
 */
export const hardGoFish: GoFishStrategy = {
  name: 'Attentive',
  chooseRank(view) {
    const known = view.askableRanks.filter((rank) => view.opponentAskedFor.includes(rank));
    if (known.length > 0) {
      return known.sort(
        (a, b) => (view.counts.get(b) ?? 0) - (view.counts.get(a) ?? 0),
      )[0];
    }
    return mostHeld(view);
  },
};

export const GO_FISH_STRATEGIES: Record<Difficulty, GoFishStrategy> = {
  easy: easyGoFish,
  medium: mediumGoFish,
  hard: hardGoFish,
};
