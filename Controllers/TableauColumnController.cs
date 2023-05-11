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
            * Removes the chosen card and any cards above
            * from the active stack of the column.
            */
            public void RemoveFromColumn(Card card);

            /*
            * Takes a card(s) as a parameter and
            * adds the card to the active stack
            * of the column.
            */
            public int AddToColumn(List<Card> cards);
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
            * Removes the chosen card and any cards above it from active pile.
            */
            public void RemoveFromColumn(Card card)
            {
                int index = active.availableCards.FindIndex(c => c == card);

                active.availableCards.RemoveRange(index, active.availableCards.Count - index);
                if (active.availableCards.Count == 0 && reserve.availableCards.Count != 0)
                {
                    Card topReserveCard = reserve.availableCards.Last();
                    reserve.RemoveCardAt(reserve.availableCards.Count - 1);
                    active.AddCard(topReserveCard);
                }
            }

            /*
            * Adds a given card(s) to the active pile
            * if the color doesn't match and the 
            * given card is one rank lower than the 
            * current card on top of the active pile.
            * If column is empty only king may be placed.
            */
            public int AddToColumn(List<Card> cards)
            {
                switch (active.availableCards.Count)
                {
                    case 0 when cards[0].Rank == Card.Ranks.King:
                    {
                        foreach (var card in cards)
                        {
                            active.AddCard(card);
                        }
                        return 1;
                    }
                    case 0 when cards[0].Rank != Card.Ranks.King:
                        return 0;
                }

                Card currentTopCard = active.availableCards.Last();

                if (cards[0].Color == currentTopCard.Color
                    || cards[0].Rank != (currentTopCard.Rank - 1))
                {
                    return 0;
                }

                foreach (var card in cards)
                {
                    active.AddCard(card);
                }
                return 1;
            }
        }
    }
}
