using static CSCE361CardGames.Controllers.CardPileController;
using static CSCE361CardGames.Models.CardModel;

namespace CSCE361CardGames.Controllers
{
    public class FoundationController
    {
        /*
         * Interface for the Foundation class
        */
        interface IFoundation
        {
            /*
            * Takes a Card as a paremeter and adds
            * the Card to a foundation of the 
            * same suit. Returns 1 if addition was
            * possible, 0 if not.
            */
            int suitStack(Card card);
        }

        /*
        * A class that acts as a foundation, 
        * which is a pile of cards that must
        * have cards of the same suit.
        */
        public class Foundation : IFoundation
        {
            public Card.Suits suit;
            public CardPile suitFoundation = new();

            /*
            * A constructor for creating a foundation. 
            * Defines the suit for the foundation.
            */
            public Foundation(Card.Suits suit)
            {
                this.suit = suit;
            }

            /*
            * Adds a Card named newCard to the
            * existing foundation if newCard's
            * suit is equal to suit and newCard's
            * rank is one higher than the top
            * card of the foundation. Returns 1 if
            * card was added and 0 otherwise.
            */
            public int suitStack(Card newCard)
            {
                if (newCard.Suit != suit)
                {
                    return 0;
                }

                switch (suitFoundation.availableCards.Any())
                {
                    case false when newCard.Rank == Card.Ranks.Ace:
                        suitFoundation.AddCard(newCard);
                        return 1;
                    case false when newCard.Rank != Card.Ranks.Ace:
                        return 0;
                }

                if (newCard.Rank.Equals(suitFoundation.availableCards.Last().Rank + 1))
                {
                    suitFoundation.AddCard(newCard);
                    return 1;
                }
                return 0;
            }
        }
    }
}
