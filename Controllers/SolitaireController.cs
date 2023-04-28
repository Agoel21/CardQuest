/*
 * This controller defines the classes/interfaces
 * for tableaus, foundations, and the solitaire
 * board.
 */

using static CSCE361CardGames.Models.CardModel;
using static CSCE361CardGames.Models.DeckModel;
using static CSCE361CardGames.Controllers.SetupController;

namespace CSCE361CardGames.Controllers
{
    public class SolitaireController
    {
        /*
         * Interface for the TableauColumn class
         */
        interface ITableauColumn
        {
            public void BuildColumn(Deck deck, int amountForReserve);
            //TODO: enforce alternating color/descending numbers here
            public Card RemoveFromColumn();
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

            public void BuildColumn(Deck deck, int amountForReserve)
            {
                reserve.GrabCards(deck, amountForReserve);
                active.GrabCards(deck, 1);
            }

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

        interface IFoundation
        {
            //TODO: enforce numeric stacking rules here, only allow cards of the assigned suit to be added
            void suitStack(Card card);
        }

        public class Foundation : IFoundation
        {
            public Card.Suits suit;
            public CardPile suitFoundation = new();
            public Foundation(Card.Suits suit)
            {
                this.suit = suit;
            }

            public void suitStack(Card newCard)
            {
                if (newCard.Suit == suit)
                {
                    suitFoundation.AddCard(newCard);
                }
            }
        }

        interface ISolitaireBoard
        {
            public void GenerateBoard();
        }

        public class SolitaireBoard : ISolitaireBoard
        {
            public Foundation ClubsFoundation = new Foundation(Card.Suits.Clubs);
            public Foundation DiamondsFoundation = new Foundation(Card.Suits.Diamonds);
            public Foundation HeartsFoundation = new Foundation(Card.Suits.Hearts);
            public Foundation SpadesFoundation = new Foundation(Card.Suits.Spades);

            public TableauColumn ColumnOne = new TableauColumn();
            public TableauColumn ColumnTwo = new TableauColumn();
            public TableauColumn ColumnThree = new TableauColumn();
            public TableauColumn ColumnFour = new TableauColumn();
            public TableauColumn ColumnFive = new TableauColumn();
            public TableauColumn ColumnSix = new TableauColumn();
            public TableauColumn ColumnSeven = new TableauColumn();

            public CardPile stockpile = new();


            public void GenerateBoard()
            {
                var deck = new Deck();
                deck.FillDeck();
                deck.ShuffleDeck();

                ColumnOne.BuildColumn(deck, 0);
                ColumnTwo.BuildColumn(deck, 1);
                ColumnThree.BuildColumn(deck, 2);
                ColumnFour.BuildColumn(deck, 3);
                ColumnFive.BuildColumn(deck, 4);
                ColumnSix.BuildColumn(deck, 5);
                ColumnSeven.BuildColumn(deck, 6);

                stockpile.SetCards(deck.deckOfCards);


            }
        }
    }
}
