/**
 * An ordered pile of cards — the shared primitive behind hands, stocks,
 * wastes, foundations and tableau columns.
 *
 * Index 0 is the bottom of the pile; the last element is the top.
 */
import { Card, sameCard } from './card';

export class CardPile {
  private cards: Card[];

  constructor(cards: Card[] = []) {
    this.cards = [...cards];
  }

  get size(): number {
    return this.cards.length;
  }

  get isEmpty(): boolean {
    return this.cards.length === 0;
  }

  /** Defensive copy: callers must not be able to mutate pile internals. */
  toArray(): Card[] {
    return [...this.cards];
  }

  at(index: number): Card | undefined {
    return this.cards[index];
  }

  /** The card currently on top, or undefined when the pile is empty. */
  peek(): Card | undefined {
    return this.cards[this.cards.length - 1];
  }

  setCards(cards: Card[]): void {
    this.cards = [...cards];
  }

  add(card: Card): void {
    this.cards.push(card);
  }

  addMany(cards: Card[]): void {
    this.cards.push(...cards);
  }

  /** Removes and returns the top card. */
  takeTop(): Card | undefined {
    return this.cards.pop();
  }

  takeAt(index: number): Card | undefined {
    if (index < 0 || index >= this.cards.length) return undefined;
    return this.cards.splice(index, 1)[0];
  }

  removeAt(index: number): void {
    if (index < 0 || index >= this.cards.length) return;
    this.cards.splice(index, 1);
  }

  /** Removes the first card equal by value; returns whether one was found. */
  remove(card: Card): boolean {
    const index = this.indexOf(card);
    if (index === -1) return false;
    this.cards.splice(index, 1);
    return true;
  }

  indexOf(card: Card): number {
    return this.cards.findIndex((c) => sameCard(c, card));
  }

  contains(card: Card): boolean {
    return this.indexOf(card) !== -1;
  }

  /** Removes and returns `card` plus everything stacked above it. */
  takeFrom(card: Card): Card[] {
    const index = this.indexOf(card);
    if (index === -1) return [];
    return this.cards.splice(index);
  }

  clear(): void {
    this.cards = [];
  }

  toJSON(): Card[] {
    return this.toArray();
  }

  static fromJSON(cards: Card[]): CardPile {
    return new CardPile(cards);
  }
}
