/**
 * Crazy 8s board.
 *
 * Players shed cards matching the active card's rank or the active suit.
 * An eight is wild: it may always be played, and its player then nominates
 * the suit that the next player must follow.
 */
import {
  Card, CardPile, Deck, makeRng, Player, randomSeed, Rank, Rng, shuffleInPlace, Suit,
} from '../../engine';

export const MAX_PLAYERS = 6;
export const STARTING_HAND_SIZE = 5;

export class Crazy8sBoard {
  readonly players: Player[] = [];
  readonly stock: CardPile = new CardPile();
  readonly discard: CardPile = new CardPile();
  activeCard: Card | undefined;
  activeSuit: Suit | undefined;
  currentPlayerIndex = 0;
  readonly seed: number;

  /** Set when an eight has been played and its player must nominate a suit. */
  awaitingSuitChoice = false;

  /**
   * Held on the board rather than passed in, so that recycling the discard
   * pile mid-game stays deterministic from the seed. Multiplayer depends on
   * both peers reaching the same shuffled stock.
   */
  private rng: Rng;

  constructor(seed: number = randomSeed()) {
    this.seed = seed;
    this.rng = makeRng(seed);
  }

  get currentPlayer(): Player | undefined {
    return this.players[this.currentPlayerIndex];
  }

  /** The first player with an empty hand, if any. */
  get winner(): Player | undefined {
    return this.players.find((p) => p.hasEmptyHand);
  }

  addPlayer(player: Player): boolean {
    if (this.players.length >= MAX_PLAYERS) return false;
    this.players.push(player);
    return true;
  }

  /** Deals a starting hand to every seated player. */
  distribute(deck: Deck): void {
    for (const player of this.players) {
      deck.dealInto(player.hand, STARTING_HAND_SIZE);
    }
  }

  /**
   * Deals a new game. The starting card is never an eight, since that would
   * demand a suit nomination before anyone has had a turn.
   */
  generate(rng: Rng = makeRng(this.seed)): void {
    this.rng = rng;
    const deck = Deck.shuffled(rng);
    this.distribute(deck);
    this.stock.setCards(deck.toArray());

    let starter = this.stock.takeTop();
    while (starter && starter.rank === Rank.Eight) {
      this.discard.add(starter);
      starter = this.stock.takeTop();
    }

    this.activeCard = starter;
    this.activeSuit = starter?.suit;
    this.currentPlayerIndex = 0;
  }

  /** Whether `card` may legally be played onto the current active card. */
  isLegalPlay(card: Card): boolean {
    if (!this.activeCard) return false;
    if (card.rank === Rank.Eight) return true;
    return card.rank === this.activeCard.rank || card.suit === this.activeSuit;
  }

  /** The current player's legal plays. */
  legalPlaysFor(player: Player): Card[] {
    return player.hand.toArray().filter((card) => this.isLegalPlay(card));
  }

  /**
   * Plays `card` for the current player.
   *
   * Playing an eight leaves the turn open until `chooseSuit` is called, so
   * the wild card's suit nomination cannot be skipped.
   */
  playCard(card: Card): boolean {
    if (!this.isLegalPlay(card) || this.awaitingSuitChoice) return false;

    const player = this.currentPlayer;
    if (player && !player.hand.remove(card)) {
      // Card is not in hand — reject rather than conjuring it onto the table.
      if (this.players.length > 0) return false;
    }

    if (this.activeCard) this.discard.add(this.activeCard);
    this.activeCard = card;

    if (card.rank === Rank.Eight) {
      this.awaitingSuitChoice = true;
      return true;
    }

    this.activeSuit = card.suit;
    if (!this.winner) this.passTurn();
    return true;
  }

  /** Nominates the suit after an eight, then advances the turn. */
  chooseSuit(suit: Suit): boolean {
    if (!this.awaitingSuitChoice) return false;
    this.activeSuit = suit;
    this.awaitingSuitChoice = false;
    if (!this.winner) this.passTurn();
    return true;
  }

  /**
   * Draws one card for the current player, recycling the discard pile when
   * the stock is exhausted.
   *
   * Deliberate deviation from the original C#: `DrawFromStockPile` recycled
   * the pile and then passed the turn WITHOUT dealing anyone a card, so a
   * player unlucky enough to empty the stock simply lost their draw. Under
   * the standard rules the stock is rebuilt and the draw proceeds, which is
   * what this does.
   */
  drawFromStock(): Card | undefined {
    if (this.stock.isEmpty) this.recycleDiscard();
    const card = this.stock.takeTop();
    if (card) this.currentPlayer?.hand.add(card);
    return card;
  }

  /**
   * Rebuilds the stock from the discard pile.
   *
   * The pile is reshuffled, not just tipped back over. Without this the
   * "new" stock is the old one in a fixed order, so from the first recycle
   * onwards the deck is fully predictable to anyone who tracked the
   * discards, and every subsequent cycle repeats the same two orderings.
   */
  private recycleDiscard(): void {
    if (this.discard.isEmpty) return;
    const recycled = this.discard.toArray();
    shuffleInPlace(recycled, this.rng);
    this.stock.addMany(recycled);
    this.discard.clear();
  }

  passTurn(): void {
    if (this.players.length === 0) return;
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
  }
}
