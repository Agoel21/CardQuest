using System;
using ConsoleApp1.Models.DeckController; //TODO: change this namespace once that gets fixed


namespace CSCE361CardGames.Controllers
{
    public class SetupController
    {
        interface ICardPile
        {
            void setCards(List<Card> cards);
            void grabCards(Deck deck, int amount);
            void removeCardAt(int index);
        }

        public class CardPile : ICardPile
        {
            public List<Card> availableCards;

            public void setCards(List<Card> cards)
            {
                availableCards = cards;
            }

            public void grabCards(Deck deck, int amount)
            {
                if (amount <= deck.Count && amount > 0)
                {
                    Random random = new Random();
                    for (int i = 0; i < amount; i++)
                    {
                        availableCards.Add(deck.takeFromDeckAt(random.Next(deck.Count));
                    }
                }
                else
                {
                    Console.WriteLine("Attempted to take more cards than remain in the deck, or a non-positive amount of cards");
                }
            }

            public void removeCardAt(int index)
            {
                availableCards.removeAt(index);
            }
        }
    }
}

