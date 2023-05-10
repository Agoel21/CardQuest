using System;
using static CSCE361CardGames.Models.CardModel;
using static CSCE361CardGames.Models.DeckModel;


namespace CSCE361CardGames.Controllers
{
    public class CardPileController
    {
        /*
         * Interface for modifying a pile of cards.
         */
        interface ICardPile
        {
            /*
             * Sets the card pile to a given list of cards.
             */
            void SetCards(List<Card> cards);
            /*
             * Grabs a given amount of cards in a random order from the given deck 
             * and adds those taken cards to the card pile.
             */
            void GrabCards(Deck deck, int amount);
            /*
             * Removes a card from the pile at a given index, but retains the card.
             */
            Card TakeCardAt(int index);
            /*
             * Removes a specified card from the pile, rather than an index.
             */
            void RemoveCard(Card card);
            /*
             * Removes a card from the pile at a given index.
             */
            void RemoveCardAt(int index);
            /*
             * Adds a card to the card pile.
             */
            void AddCard(Card card);
        }

        /*
         * Representation of a pile of cards.
         */
        public class CardPile : ICardPile
        {
            public List<Card> availableCards = new();

            public void SetCards(List<Card> cards)
            {
                availableCards = cards;
            }

            public void GrabCards(Deck deck, int amount)
            {
                if (amount <= deck.deckOfCards.Count && amount > 0)
                {
                    Random random = new Random();
                    for (int i = 0; i < amount; i++)
                    {
                        availableCards.Add(deck.TakeFromDeckAt(random.Next(deck.deckOfCards.Count)));
                    }
                }
                else
                {
                    // Console.WriteLine("Attempted to take more cards than remain in the deck, or a non-positive amount of cards");
                }
            }

            public Card TakeCardAt(int index)
            {
                Card targetCard = availableCards[index];
                availableCards.RemoveAt(index);
                return targetCard;
            }

            public void RemoveCard(Card card)
            {
                availableCards.Remove(card);
            }

            public void RemoveCardAt(int index)
            {
                availableCards.RemoveAt(index);
            }

            public void AddCard(Card card)
            {
                availableCards.Add(card);
            }
        }
    }
}

