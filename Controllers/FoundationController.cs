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
            int SuitStack(Card card);
        }

        /*
        * A class that acts as a foundation, 
        * which is a pile of cards that must
        * have cards of the same suit.
        */
        public class Foundation : IFoundation
        {
            public Card.Suits Suit;
            public CardPile SuitFoundation = new();

            /*
            * A constructor for creating a foundation. 
            * Defines the suit for the foundation.
            */
            public Foundation(Card.Suits suit)
            {
                this.Suit = suit;
            }

            /*
            * Adds a Card named newCard to the
            * existing foundation if newCard's
            * suit is equal to suit and newCard's
            * rank is one higher than the top
            * card of the foundation. Returns 1 if
            * card was added and 0 otherwise.
            */
            public int SuitStack(Card newCard)
            {
                if (newCard.Suit != Suit)
                {
                    return 0;
                }

                switch (SuitFoundation.AvailableCards.Any())
                {
                    case false when newCard.Rank == Card.Ranks.Ace:
                        SuitFoundation.AddCard(newCard);
                        return 1;
                    case false when newCard.Rank != Card.Ranks.Ace:
                        return 0;
                }

                if (newCard.Rank.Equals(SuitFoundation.AvailableCards.Last().Rank + 1))
                {
                    SuitFoundation.AddCard(newCard);
                    return 1;
                }
                return 0;
            }
        }
    }
}
