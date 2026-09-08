/**
 * Hearts board.
 *
 * Four players, thirteen cards each. Before every hand the table passes
 * three cards in a direction that rotates hand over hand (left, right,
 * across, then a held hand with no pass), the two of clubs holder opens
 * the first trick, and everyone must follow suit when they can. Hearts and
 * the queen of spades are worth points, points are bad, and the game ends
 * once somebody crosses 100 - lowest cumulative score wins.
 *
 * The one wrinkle worth flagging: shooting the moon. A player who takes
 * every point card in a hand scores nothing for it, and everyone else takes
 * 26. `handPointsFor` folds that swap in, so callers never have to special
 * case it themselves.
 */
import {
  Card, Deck, makeCard, makeRng, Player, randomSeed, Rank, Rng, sameCard, Suit,
} from '../../engine';

export const PLAYER_COUNT = 4;
export const HAND_SIZE = 13;
export const TARGET_SCORE = 100;

export type HeartsPhase = 'passing' | 'playing' | 'handComplete' | 'gameOver';
export type PassDirection = 'left' | 'right' | 'across' | 'none';

export interface TrickCard {
  playerId: string;
  card: Card;
}

const TWO_OF_CLUBS = makeCard(Suit.Clubs, Rank.Two);
const QUEEN_OF_SPADES = makeCard(Suit.Spades, Rank.Queen);

function isHeart(card: Card): boolean {
  return card.suit === Suit.Hearts;
}

function isQueenOfSpades(card: Card): boolean {
  return sameCard(card, QUEEN_OF_SPADES);
}

/** Hearts and the queen of spades: the only cards worth anything. */
function isPointCard(card: Card): boolean {
  return isHeart(card) || isQueenOfSpades(card);
}

export class HeartsBoard {
  readonly players: Player[];
  /** Cumulative score across all hands, keyed by player id. */
  readonly scores: Map<string, number> = new Map();
  /** Cards played so far in the trick currently on the table. */
  readonly currentTrick: TrickCard[] = [];
  /** Every card played this hand, in play order, across all tricks so far. */
  readonly cardsPlayedThisHand: TrickCard[] = [];
  readonly seed: number;

  handNumber = 0;
  currentPlayerIndex = 0;
  heartsBroken = false;
  phase: HeartsPhase = 'passing';

  /**
   * Held on the board so that a hand dealt without an explicit `rng`
   * continues the same deterministic sequence as the one before it, the
   * same reasoning as Crazy8sBoard's stock recycling.
   */
  private rng: Rng;

  /** No hearts or the queen of spades may fall on this hand's opening trick. */
  private isFirstTrick = true;

  /** Cards each player has actually won, used to settle the hand's score. */
  private readonly tricksTaken: Map<string, Card[]> = new Map();

  /** This hand's chosen-but-not-yet-exchanged passes, keyed by player id. */
  private readonly pendingPasses: Map<string, Card[]> = new Map();

  constructor(seed: number = randomSeed(), players?: Player[]) {
    this.seed = seed;
    this.rng = makeRng(seed);
    this.players = players && players.length === PLAYER_COUNT
      ? players
      : Array.from({ length: PLAYER_COUNT }, (_, i) => new Player(`seat-${i}`, `Seat ${i + 1}`));

    for (const player of this.players) {
      this.scores.set(player.id, 0);
      this.tricksTaken.set(player.id, []);
    }
  }

  get currentPlayer(): Player | undefined {
    return this.players[this.currentPlayerIndex];
  }

  /** Rotates left, right, across, hold, then repeats every four hands. */
  get passDirection(): PassDirection {
    switch (this.handNumber % 4) {
      case 0: return 'left';
      case 1: return 'right';
      case 2: return 'across';
      default: return 'none';
    }
  }

  /** The lowest cumulative score, but only once somebody has reached 100. */
  get winner(): Player | undefined {
    const gameHasEnded = [...this.scores.values()].some((s) => s >= TARGET_SCORE);
    if (!gameHasEnded) return undefined;

    let best: Player | undefined;
    let bestScore = Infinity;
    for (const player of this.players) {
      const score = this.scores.get(player.id) ?? 0;
      if (score < bestScore) {
        bestScore = score;
        best = player;
      }
    }
    return best;
  }

  /**
   * Deals a fresh hand: shuffles, deals thirteen cards each, and either
   * opens the passing phase or, on a held hand, goes straight to play.
   */
  startHand(rng: Rng = this.rng): void {
    this.rng = rng;
    this.currentTrick.splice(0, this.currentTrick.length);
    this.cardsPlayedThisHand.splice(0, this.cardsPlayedThisHand.length);
    this.pendingPasses.clear();
    this.heartsBroken = false;
    this.isFirstTrick = true;

    for (const player of this.players) {
      player.hand.clear();
      this.tricksTaken.set(player.id, []);
    }

    const deck = Deck.shuffled(rng);
    for (const player of this.players) {
      deck.dealInto(player.hand, HAND_SIZE);
    }

    if (this.passDirection === 'none') {
      this.beginPlay();
    } else {
      this.phase = 'passing';
    }
  }

  /** The current player's legal plays: follow suit, first-trick and hearts-broken rules applied. */
  legalPlaysFor(player: Player): Card[] {
    const hand = player.hand.toArray();
    if (hand.length === 0) return [];

    const leading = this.currentTrick.length === 0;

    if (leading) {
      if (this.isFirstTrick) {
        const twoOfClubs = hand.find((c) => sameCard(c, TWO_OF_CLUBS));
        return twoOfClubs ? [twoOfClubs] : hand;
      }
      if (!this.heartsBroken) {
        const nonHearts = hand.filter((c) => !isHeart(c));
        return nonHearts.length > 0 ? nonHearts : hand;
      }
      return hand;
    }

    const ledSuit = this.currentTrick[0]!.card.suit;
    const sameSuit = hand.filter((c) => c.suit === ledSuit);
    if (sameSuit.length > 0) return sameSuit;

    // Void in the led suit: free to discard, except no hearts or the queen
    // of spades on the first trick, unless that is literally all that's left.
    if (this.isFirstTrick) {
      const safe = hand.filter((c) => !isPointCard(c));
      return safe.length > 0 ? safe : hand;
    }
    return hand;
  }

  /** Records `playerId`'s chosen pass. Must be exactly three cards from their hand. */
  selectPassCards(playerId: string, cards: Card[]): boolean {
    if (this.phase !== 'passing') return false;
    if (cards.length !== 3) return false;

    const player = this.players.find((p) => p.id === playerId);
    if (!player) return false;

    const distinctCount = new Set(cards.map((c) => `${c.suit}-${c.rank}`)).size;
    if (distinctCount !== 3) return false;
    if (!cards.every((c) => player.hand.contains(c))) return false;

    this.pendingPasses.set(playerId, [...cards]);
    return true;
  }

  /**
   * Applies all four passes at once (never one at a time, so nobody can
   * infer a neighbour's pass from watching cards leave in sequence), then
   * hands the lead to whoever now holds the two of clubs.
   */
  executePass(): void {
    if (this.phase !== 'passing') return;
    if (this.pendingPasses.size !== PLAYER_COUNT) return;

    const direction = this.passDirection;
    if (direction === 'none') {
      this.pendingPasses.clear();
      this.beginPlay();
      return;
    }

    const outgoing = this.players.map((p) => this.pendingPasses.get(p.id) ?? []);

    // Remove every outgoing card before adding any, so a full round-trip
    // never depends on the order players are iterated in.
    this.players.forEach((player, i) => {
      for (const card of outgoing[i]!) player.hand.remove(card);
    });
    this.players.forEach((_player, i) => {
      const target = this.players[this.passTargetIndex(i, direction)];
      for (const card of outgoing[i]!) target?.hand.add(card);
    });

    this.pendingPasses.clear();
    this.beginPlay();
  }

  /** Plays `card` for the current player, if it is one of their legal plays. */
  playCard(card: Card): boolean {
    if (this.phase !== 'playing') return false;
    const player = this.currentPlayer;
    if (!player) return false;

    const legal = this.legalPlaysFor(player);
    if (!legal.some((c) => sameCard(c, card))) return false;
    if (!player.hand.remove(card)) return false;

    const entry: TrickCard = { playerId: player.id, card };
    this.currentTrick.push(entry);
    this.cardsPlayedThisHand.push(entry);

    if (isPointCard(card)) this.heartsBroken = true;

    if (this.currentTrick.length < PLAYER_COUNT) {
      this.currentPlayerIndex = (this.currentPlayerIndex + 1) % PLAYER_COUNT;
    }
    return true;
  }

  /**
   * Resolves the trick once four cards are down: highest card of the led
   * suit wins, its player leads next. Returns the winning player id.
   */
  resolveTrick(): string | undefined {
    if (this.currentTrick.length !== PLAYER_COUNT) return undefined;

    const ledSuit = this.currentTrick[0]!.card.suit;
    let winner = this.currentTrick[0]!;
    for (const entry of this.currentTrick) {
      if (entry.card.suit === ledSuit && entry.card.rank > winner.card.rank) winner = entry;
    }

    const taken = this.tricksTaken.get(winner.playerId) ?? [];
    taken.push(...this.currentTrick.map((e) => e.card));
    this.tricksTaken.set(winner.playerId, taken);

    this.currentTrick.splice(0, this.currentTrick.length);
    this.isFirstTrick = false;

    const winnerIndex = this.players.findIndex((p) => p.id === winner.playerId);
    if (winnerIndex >= 0) this.currentPlayerIndex = winnerIndex;

    if (this.players.every((p) => p.hand.isEmpty)) {
      for (const player of this.players) {
        const points = this.handPointsFor(player.id);
        this.scores.set(player.id, (this.scores.get(player.id) ?? 0) + points);
      }
      this.handNumber += 1;
      const gameOver = [...this.scores.values()].some((s) => s >= TARGET_SCORE);
      this.phase = gameOver ? 'gameOver' : 'handComplete';
    }

    return winner.playerId;
  }

  /**
   * This hand's points for `playerId`: one per heart, thirteen for the
   * queen of spades, with the shoot-the-moon swap (0 for the shooter, 26
   * for everyone else) applied automatically.
   */
  handPointsFor(playerId: string): number {
    const shooter = this.players.find((p) => this.rawHandPoints(p.id) === 26);
    if (shooter) return shooter.id === playerId ? 0 : 26;
    return this.rawHandPoints(playerId);
  }

  private rawHandPoints(playerId: string): number {
    const taken = this.tricksTaken.get(playerId) ?? [];
    let total = 0;
    for (const card of taken) {
      if (isHeart(card)) total += 1;
      else if (isQueenOfSpades(card)) total += 13;
    }
    return total;
  }

  /** Finds the two of clubs and hands them the lead to open the hand. */
  private beginPlay(): void {
    const holderIndex = this.players.findIndex((p) => p.hand.contains(TWO_OF_CLUBS));
    this.currentPlayerIndex = holderIndex >= 0 ? holderIndex : 0;
    this.phase = 'playing';
  }

  private passTargetIndex(seatIndex: number, direction: 'left' | 'right' | 'across'): number {
    if (direction === 'left') return (seatIndex + 1) % PLAYER_COUNT;
    if (direction === 'right') return (seatIndex + PLAYER_COUNT - 1) % PLAYER_COUNT;
    return (seatIndex + 2) % PLAYER_COUNT;
  }
}
