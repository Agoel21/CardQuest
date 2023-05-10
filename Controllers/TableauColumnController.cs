using static CSCE361CardGames.Controllers.CardPileController;
using static CSCE361CardGames.Models.CardModel;
using static CSCE361CardGames.Models.DeckModel;

namespace CSCE361CardGames.Controllers
{
    public class TableauColumnController
    {
        /*
         * Interface for the TableauColumn class
         */
        interface ITableauColumn
        {
            /*
            * Takes a deck and integer as parameters
            * and adds cards to a new column.
            */
            public void BuildColumn(Deck deck, int amountForReserve);
            //TODO: enforce alternating color/descending numbers here
            /*
            * Returns the top card from the active
            * stack of the column.
            */
            public Card RemoveFromColumn();
            /*
            * Takes a card as a parameter and
            * adds the card to the active stack
            * of the column.
            */
            public void AddToColumn(Card card);
        }

        /*
         * This class acts as a tableau column which
         * is a pile of cards with some active cards
         * (facing up) and some reserve cards (facing
         * down).
         */
        public class TableauColumn : ITableauColumn
        {
            public CardPile reserve = new();
            public CardPile active = new();

            /*
            * Builds a column by adding cards to the 
            * reserve pile and the active pile.
            */
            public void BuildColumn(Deck deck, int amountForReserve)
            {
                reserve.GrabCards(deck, amountForReserve);
                active.GrabCards(deck, 1);
            }

            /*
            * Removes the top card from the active pile
            * and returns it.
            */
            public Card RemoveFromColumn()
            {
                Card currentTopCard = active.availableCards.Last();
                int index = active.availableCards.IndexOf(currentTopCard);
                active.RemoveCardAt(index);
                if (active.availableCards.Count == 0 && reserve.availableCards.Count != 0)
                {
                    //logic for if need to flip reserve card or pile is empty
                }
                return currentTopCard;
            }

            /*
            * Adds a given card to the active pile
            * if the color doesn't match and the 
            * given card is one rank lower than the 
            * current card on top of the active pile.
            */
            public void AddToColumn(Card card)
            {
                Card currentTopCard = active.availableCards.Last();
                if (card.Color != currentTopCard.Color
                    && card.Rank == (currentTopCard.Rank - 1))
                {
                    active.AddCard(card);
                }
            }
        }
    }
}
