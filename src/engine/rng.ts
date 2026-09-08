/**
 * Deterministic, seedable pseudo-random number generator (mulberry32).
 *
 * The engine never touches Math.random. Two reasons, both load-bearing:
 *
 *  1. Multiplayer. Both peers must be able to derive an identical deal from
 *     a shared seed, so shuffling has to be reproducible.
 *  2. Testing. A fixed seed makes every deal reproducible, which turns
 *     otherwise-flaky game tests into deterministic ones.
 */
export interface Rng {
  /** Float in [0, 1). */
  next(): number;
  /** Integer in [0, maxExclusive). */
  nextInt(maxExclusive: number): number;
}

export function makeRng(seed: number): Rng {
  let state = seed >>> 0;

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next,
    nextInt(maxExclusive: number): number {
      if (maxExclusive <= 0) return 0;
      return Math.floor(next() * maxExclusive);
    },
  };
}

/** A seed for casual play, when reproducibility is not required. */
export function randomSeed(): number {
  return (Math.random() * 0xffffffff) >>> 0;
}

/**
 * Fisher-Yates, unbiased.
 *
 * The original C# shuffled with `random.Next(DeckOfCards.Count)` over the
 * *full* range on every iteration rather than `random.Next(j + 1)`. That is
 * the classic biased-shuffle bug: it produces n^n equally likely swap
 * sequences mapped onto n! permutations, so some orderings are measurably
 * more likely than others. This implementation draws from [0, j] instead.
 */
export function shuffleInPlace<T>(items: T[], rng: Rng): void {
  for (let j = items.length - 1; j > 0; j--) {
    const i = rng.nextInt(j + 1);
    const a = items[j] as T;
    const b = items[i] as T;
    items[j] = b;
    items[i] = a;
  }
}
