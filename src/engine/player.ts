/** A seated player and the hand they hold. */
import { Card } from './card';
import { CardPile } from './pile';

export class Player {
  readonly id: string;
  name: string;
  readonly hand: CardPile;

  constructor(id: string, name: string, hand: CardPile = new CardPile()) {
    this.id = id;
    this.name = name;
    this.hand = hand;
  }

  get handSize(): number {
    return this.hand.size;
  }

  /** In shedding games such as Crazy 8s, an empty hand wins. */
  get hasEmptyHand(): boolean {
    return this.hand.isEmpty;
  }

  toJSON(): { id: string; name: string; hand: Card[] } {
    return { id: this.id, name: this.name, hand: this.hand.toArray() };
  }

  static fromJSON(data: { id: string; name: string; hand: Card[] }): Player {
    return new Player(data.id, data.name, new CardPile(data.hand));
  }
}
