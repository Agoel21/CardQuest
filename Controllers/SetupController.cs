using static CSCE361CardGames.Models.CardModel;
using static CSCE361CardGames.Models.DeckModel;


namespace CSCE361CardGames.Controllers
{
    public class SetupController
    {
        interface ICardPile
        {
            void SetCards(List<Card> cards);
            void GrabCards(Deck deck, int amount);
            void RemoveCardAt(int index);
            void AddCard(Card card);

        }

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
                    Console.WriteLine("Attempted to take more cards than remain in the deck, or a non-positive amount of cards");
                }
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