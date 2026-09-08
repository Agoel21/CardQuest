/**
 * Go Fish for two players.
 *
 * You ask an opponent for a rank you already hold. If they have any, they
 * hand over all of them and you go again. If not, you draw, and you go again
 * only if you happen to draw the rank you asked for. Four of a rank is a
 * "book", scored immediately.
 */
import { CardPile, Deck, makeRng, Player, randomSeed, Rank, RANKS, Rng } from '../../engine';

export const STARTING_HAND_SIZE = 7;
export const BOOK_SIZE = 4;
export const TOTAL_BOOKS = 13;

export interface AskResult {
  /** How many cards changed hands. */
  gotCards: number;
  wentFishing: boolean;
  drewAskedRank: boolean;
  turnPassed: boolean;
  bookedRank: Rank | undefined;
}

export class GoFishBoard {
  readonly players: Player[] = [];
  readonly stock: CardPile = new CardPile();
  readonly books = new Map<string, Rank[]>();
  currentPlayerIndex = 0;
  readonly seed: number;

  constructor(seed: number = randomSeed()) {
    this.seed = seed;
  }

  get currentPlayer(): Player | undefined {
    return this.players[this.currentPlayerIndex];
  }

  addPlayer(player: Player): void {
    this.players.push(player);
    this.books.set(player.id, []);
  }

  generate(rng: Rng = makeRng(this.seed)): void {
    const deck = Deck.shuffled(rng);
    for (const player of this.players) {
      deck.dealInto(player.hand, STARTING_HAND_SIZE);
      this.books.set(player.id, []);
      this.claimBooks(player);
    }
    this.stock.setCards(deck.toArray());
    this.currentPlayerIndex = 0;
  }

  bookCountFor(player: Player): number {
    return this.books.get(player.id)?.length ?? 0;
  }

  /** Distinct ranks the player is holding, which is what they may ask for. */
  ranksInHand(player: Player): Rank[] {
    const seen = new Set<Rank>();
    for (const card of player.hand.toArray()) seen.add(card.rank);
    return RANKS.filter((rank) => seen.has(rank));
  }

  canAsk(player: Player, rank: Rank): boolean {
    return player.hand.toArray().some((card) => card.rank === rank);
  }

  /** Moves any completed four-of-a-kind out of the hand and into the books. */
  private claimBooks(player: Player): Rank | undefined {
    let booked: Rank | undefined;
    for (const rank of RANKS) {
      const matching = player.hand.toArray().filter((card) => card.rank === rank);
      if (matching.length === BOOK_SIZE) {
        for (const card of matching) player.hand.remove(card);
        this.books.get(player.id)?.push(rank);
        booked = rank;
      }
    }
    return booked;
  }

  /**
   * A player whose hand empties while cards remain draws back in, otherwise
   * they could never take another turn and the game would stall.
   */
  private refillIfEmpty(player: Player): void {
    if (player.hand.isEmpty && !this.stock.isEmpty) {
      const card = this.stock.takeTop();
      if (card) player.hand.add(card);
      this.claimBooks(player);
    }
  }

  get isOver(): boolean {
    const booked = [...this.books.values()].reduce((sum, ranks) => sum + ranks.length, 0);
    if (booked >= TOTAL_BOOKS) return true;
    return this.stock.isEmpty && this.players.some((p) => p.hand.isEmpty);
  }

  /** The player with the most books, or undefined while tied or in progress. */
  get winner(): Player | undefined {
    if (!this.isOver) return undefined;
    const ranked = [...this.players].sort((a, b) => this.bookCountFor(b) - this.bookCountFor(a));
    const [first, second] = ranked;
    if (!first) return undefined;
    if (second && this.bookCountFor(first) === this.bookCountFor(second)) return undefined;
    return first;
  }

  passTurn(): void {
    if (this.players.length === 0) return;
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
  }

  /** The current player asks the other for `rank`. */
  ask(rank: Rank): AskResult {
    const asker = this.currentPlayer;
    const opponent = this.players[(this.currentPlayerIndex + 1) % this.players.length];

    const empty: AskResult = {
      gotCards: 0,
      wentFishing: false,
      drewAskedRank: false,
      turnPassed: false,
      bookedRank: undefined,
    };
    if (!asker || !opponent || !this.canAsk(asker, rank)) return empty;

    const taken = opponent.hand.toArray().filter((card) => card.rank === rank);
    if (taken.length > 0) {
      for (const card of taken) {
        opponent.hand.remove(card);
        asker.hand.add(card);
      }
      const bookedRank = this.claimBooks(asker);
      this.refillIfEmpty(asker);
      this.refillIfEmpty(opponent);
      return { ...empty, gotCards: taken.length, bookedRank };
    }

    // Go fish.
    const drawn = this.stock.takeTop();
    if (drawn) asker.hand.add(drawn);
    const bookedRank = this.claimBooks(asker);
    const drewAskedRank = drawn?.rank === rank;

    this.refillIfEmpty(asker);
    this.refillIfEmpty(opponent);

    if (!drewAskedRank) this.passTurn();

    return {
      gotCards: 0,
      wentFishing: true,
      drewAskedRank,
      turnPassed: !drewAskedRank,
      bookedRank,
    };
  }
}
