using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CSCE361CardGames.Controllers
{
    public class DeckController
    {
        interface ICard
        {
            Card.Suits Suit { get; set; }
            Card.Ranks Rank { get; set; }
        }

        public class Card : ICard
        {
            public enum Suits
            {
                Clubs,
                Diamonds,
                Hearts,
                Spades
            }

            public enum Ranks
            {
                Ace, Two, Three, Four, Five, Six,
                Seven, Eight, Nine, Ten, Jack, Queen, King
            }

            private Suits suit;
            private Ranks rank;

            public Card(Suits _suit, Ranks _rank)
            {
                this.suit = _suit;
                this.rank = _rank;
            }

            public Suits Suit
            {
                get { return suit; }
                set { suit = value; }
            }

            public Ranks Rank
            {
                get { return rank; }
                set { rank = value; }
            }
        }

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

            public List<Card> deckOfCards = new();

            public void FillDeck()
            {
                int i = 0;
                foreach (Card.Suits s in Enum.GetValues(typeof(Card.Suits)))
                {
                    foreach (Card.Ranks r in Enum.GetValues(typeof(Card.Ranks)))
                    {
                        Card card = new(s, r);
                        deckOfCards.Add(card);
                        i++;
                    }
                }
            }

            /* Adapted from: https://code-maze.com/csharp-randomize-list/ */
            public void ShuffleDeck()
            {
                Random random = new();
                for (int j = deckOfCards.Count - 1; j > 0; j--)
                {
                    var i = random.Next(deckOfCards.Count);
                    (deckOfCards[j], deckOfCards[i]) = (deckOfCards[i], deckOfCards[j]);
                }
            }

            public void AddToDeck(Card card)
            {
                if (deckOfCards.Count < 52)
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
                List<Card> cards = new();
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