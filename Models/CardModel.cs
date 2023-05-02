/*
 * This model defines the class/interface for
 * a card object.
 */

namespace CSCE361CardGames.Models
{
    public class CardModel
    {
        /*
         * Interface for the Card class.
         */
        interface ICard
        {
            /*
             * Methods for getting and setting the suit or rank
             * of a card and getting the color of a card.
             */
            Card.Suits Suit { get; set; }
            Card.Ranks Rank { get; set; }
            Card.Colors Color { get; }

        }

        public class Card : ICard
        {
            public enum Suits
            {
                Clubs = 1,
                Diamonds,
                Hearts,
                Spades
            }

            public enum Ranks
            {
                Ace = 1,
                Two,
                Three,
                Four,
                Five,
                Six,
                Seven,
                Eight,
                Nine,
                Ten,
                Jack,
                Queen,
                King
            }

            public enum Colors
            {
                Red,
                Black
            }

            private Suits suit;
            private Ranks rank;
            private Colors color;

            public Card(Suits _suit, Ranks _rank)
            {
                suit = _suit;
                rank = _rank;
                if (suit == Suits.Clubs || suit == Suits.Spades)
                {
                    color = Colors.Black;
                }
                else
                {
                    color = Colors.Red;
                }
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

            public Colors Color
            {
                get { return color; }
            }
        }
    }
}