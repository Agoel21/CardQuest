using Microsoft.AspNetCore.Mvc;
using static CSCE361CardGames.Controllers.DeckController.Card;

namespace CSCE361CardGames.Controllers
{
    public class DeckController : Controller
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
            void takeFromDeck();
            Card[] getDeckOfCards { get; }
        }

        public class Deck : IDeck
        {
            public Card[] deckOfCards;

            public Deck()
            {
                deckOfCards = new Card[52];
            }

            public void fillDeck()
            {
                int i = 0;
                foreach (Card.Suits s in Enum.GetValues(typeof(Card.Suits)))
                {
                    foreach (Card.Ranks r in Enum.GetValues(typeof(Card.Ranks)))
                    {
                        deckOfCards[i] = new Card(s, r);
                        i++;
                    }
                }
            }

            public void shuffleDeck()
            {
                Random random = new Random();
                deckOfCards = deckOfCards.OrderBy(c => random.Next()).ToArray();
            }

            public void addToDeck(Card card)
            {

            }

            public void takeFromDeck()
            {

            }

            public Card[] getDeckOfCards
            {
                get { return deckOfCards; }
            }
        }
    }
}
