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
            * suit is equal to suit.
            */
            public void suitStack(Card newCard)
            {
                if (newCard.Suit == suit)
                {
                    suitFoundation.AddCard(newCard);
                }
            }
        }

        /*
        * Interface for SolitaireBoard Class.
        */
        interface ISolitaireBoard
        {
            /*
            * Builds the board for Solitaire.
            */
            public void GenerateBoard();
        }

        /*
        * A class that is used to create the
        * board for Solitaire, defines four 
        * foundations for each suit and
        * uses a method named GenerateBoard()
        * to create the tableau columns and 
        * stockpile.
        */
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

            /*
            * Builds a Solitaire board by 
            * building seven columns and
            * creating a stockpile for left
            * over cards.
            */
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
