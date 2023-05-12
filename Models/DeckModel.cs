/*
 * This model defines the class/interface for
 * creating and manipulating a deck of cards.
 */

using static CSCE361CardGames.Models.CardModel;

namespace CSCE361CardGames.Models
{
    public class DeckModel

    {
        /*
         * Interface for the Deck class.
         */
        interface IDeck
        {
            /*
             * Fills newly created deck with 52 cards of
             * every suit and rank.
             */
            void FillDeck();

            /*
             * Randomizes the order in the list of cards.
             */
            void ShuffleDeck();

            /*
             * Adds the provided card to the deck if
             * the deck does not already contain 52 cards.
             */
            void AddToDeck(Card card);

            /*
             * Removes the requested card from the deck.
             */
            void TakeFromDeck(Card card);

            /*
             * Removes the card from the deck at the
             * provided index.
             */
            Card TakeFromDeckAt(int index);
            //List<Card> TakeNumCards(int num);
            /*
            Card[] getDeckOfCards { get; }
            */
        }
        
        public class Deck : IDeck
        {

            public List<Card> DeckOfCards;

            public Deck()
            {
                DeckOfCards = new List<Card>();
            }

            public void FillDeck()
            {
                foreach (Card.Suits s in Enum.GetValues(typeof(Card.Suits)))
                {
                    foreach (Card.Ranks r in Enum.GetValues(typeof(Card.Ranks)))
                    {
                        Card card = new Card(s, r);
                        DeckOfCards.Add(card);
                    }
                }
            }

            /* Adapted from: https://code-maze.com/csharp-randomize-list/ */
            public void ShuffleDeck()
            {
                Random random = new Random();
                for (int j = DeckOfCards.Count - 1; j > 0; j--)
                {
                    var i = random.Next(DeckOfCards.Count);
                    Card temp = DeckOfCards[i];
                    DeckOfCards[i] = DeckOfCards[j];
                    DeckOfCards[j] = temp;
                }
            }

            public void AddToDeck(Card card)
            {
                if (DeckOfCards.Count() < 52)
                {
                    DeckOfCards.Add(card);
                }
                else
                {
                    Console.WriteLine("Deck is already full");
                }
            }


            public void TakeFromDeck(Card card)
            {
                DeckOfCards.Remove(card);
            }

            public Card TakeFromDeckAt(int index)
            {
                Card removed = DeckOfCards[index];
                DeckOfCards.RemoveAt(index);
                return removed;
            }
            /*
            public List<Card> TakeNumCards(int num)
            {
                List<Card> cards = new List<Card>();
                for (int i = 0; i < num; i++)
                {
                    cards.Add(TakeFromDeckAt(i));
                }

                return cards;
            }
            */
            /*
            public List<Card> getDeckOfCards
            {
                get { return deckOfCards; }
            }
            */
        }
    }
}