using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ConsoleApp1.Models
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
            void fillDeck();
            void shuffleDeck();
            void addToDeck(Card card);
            void takeFromDeck(Card card);
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

            public void fillDeck()
            {
                int i = 0;
                foreach (Card.Suits s in Enum.GetValues(typeof(Card.Suits)))
                {
                    foreach (Card.Ranks r in Enum.GetValues(typeof(Card.Ranks)))
                    {
                        Card card = new Card(s, r);
                        deckOfCards.Add(card);
                        i++;
                    }
                }
            }

            /* Adapted from: https://code-maze.com/csharp-randomize-list/ */
            public void shuffleDeck()
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

            public void addToDeck(Card card)
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


            public void takeFromDeck(Card card)
            {
                deckOfCards.Remove(card);
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