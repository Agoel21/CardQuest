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
            //TODO: enforce numeric stacking rules here, only allow cards of the assigned suit to be added
            /*
            * Takes a Card as a paremeter and adds
            * the Card to a foundation of the 
            * same suit.
            */
            void suitStack(Card card);
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
            * card of the foundation.
            */
            public void suitStack(Card newCard)
            {
                if (newCard.Suit.Equals(suit))
                {
                    if (suitFoundation.availableCards.Count <= 0 || newCard.Rank == suitFoundation.availableCards[suitFoundation.availableCards.Count - 1].Rank + 1)
                    {
                        suitFoundation.AddCard(newCard);
                    }
                    /*
                    if (newCard.Rank.Equals(suitFoundation.availableCards[suitFoundation.availableCards.Count-1].Rank + 1))
                    {
                        suitFoundation.AddCard(newCard);
                    }
                    else if (suitFoundation.availableCards.Count == 0)
                    {
                        suitFoundation.AddCard(newCard);
                    }
                    */
                }
            }
        }
    }
}
