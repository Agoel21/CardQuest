using static CSCE361CardGames.Controllers.CardPileController;
using static CSCE361CardGames.Controllers.FoundationController;
using static CSCE361CardGames.Controllers.TableauColumnController;
using static CSCE361CardGames.Models.CardModel;
using static CSCE361CardGames.Models.DeckModel;

namespace CSCE361CardGames.Controllers
{
    public class SolitaireBoardController
    {
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
