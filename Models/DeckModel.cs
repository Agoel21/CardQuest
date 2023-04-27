using static CSCE361CardGames.Models.CardModel;

namespace CSCE361CardGames.Models //TODO: fix this namespace
{
    public class DeckModel

    {

        interface IDeck
        {
            void FillDeck();
            void ShuffleDeck();
            void AddToDeck(Card card);
            void TakeFromDeck(Card card);
            Card TakeFromDeckAt(int index);
            List<Card> TakeNumCards(int num);
            /*
            Card[] getDeckOfCards { get; }
            */
        }

        public class Deck : IDeck
        {

            public List<Card> deckOfCards;

            public Deck()
            {
                deckOfCards = new List<Card>();
            }

            public void FillDeck()
            {
                foreach (Card.Suits s in Enum.GetValues(typeof(Card.Suits)))
                {
                    foreach (Card.Ranks r in Enum.GetValues(typeof(Card.Ranks)))
                    {
                        Card card = new Card(s, r);
                        deckOfCards.Add(card);
                    }
                }
            }

            /* Adapted from: https://code-maze.com/csharp-randomize-list/ */
            public void ShuffleDeck()
            {
                Random random = new Random();
                for (int j = deckOfCards.Count - 1; j > 0; j--)
                {
                    var i = random.Next(deckOfCards.Count);
                    Card temp = deckOfCards[i];
                    deckOfCards[i] = deckOfCards[j];
                    deckOfCards[j] = temp;
                }
            }

            public void AddToDeck(Card card)
            {
                /*
                Card[] newDeck = new Card[nonFullDeck.deckOfCards.Length + 1];
                if (card != Array.Find(deckOfCards, element => element == card) || newDeck.Length < 52)
                {
                }
                */
                if (deckOfCards.Count() < 52)
                {
                    deckOfCards.Add(card);
                }
                else
                {
                    Console.WriteLine("Deck is already full");
                }
            }


            public void TakeFromDeck(Card card)
            {
                deckOfCards.Remove(card);
            }

            public Card TakeFromDeckAt(int index)
            {
                Card removed = deckOfCards[index];
                deckOfCards.RemoveAt(index);
                return removed;
            }

            public List<Card> TakeNumCards(int num)
            {
                List<Card> cards = new List<Card>();
                for (int i = 0; i < num; i++)
                {
                    cards.Add(TakeFromDeckAt(i));
                }

                return cards;
            }

            /*
            public List<Card> getDeckOfCards
            {
                get { return deckOfCards; }
            }
            */
        }
    }
}