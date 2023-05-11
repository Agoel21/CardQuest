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

            /*
             * Searches board for possible placement of selected card(s).
             */
            public void CheckBoard(TableauColumn currentColumn, Card chosenCard);

            /*
             * Flips top card from stockpile to
             * waste pile. If stockpile is empty, waste
             * pile is shuffled back into stockpile.
             */
            public void FlipFromStockpile();

            /*
             * Moves top card on chosen foundation to
             * tableau column if possible.
             */
            public void MoveFromFoundation(Foundation foundation);
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
            public List<Foundation> boardFoundations = new List<Foundation>();
            public List<TableauColumn> boardColumns = new List<TableauColumn>();

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

            public TableauColumn WasteColumn = new TableauColumn();

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


                boardFoundations.Add(ClubsFoundation);
                boardFoundations.Add(DiamondsFoundation);
                boardFoundations.Add(HeartsFoundation);
                boardFoundations.Add(SpadesFoundation);

                boardColumns.Add(ColumnOne);
                boardColumns.Add(ColumnTwo);
                boardColumns.Add(ColumnThree);
                boardColumns.Add(ColumnFour);
                boardColumns.Add(ColumnFive);
                boardColumns.Add(ColumnSix);
                boardColumns.Add(ColumnSeven);
            }

            public void CheckBoard(TableauColumn currentColumn, Card chosenCard)
            {
                int index = currentColumn.active.availableCards.FindIndex(c => c == chosenCard);
                int spotFoundFlag = 0;

                if (currentColumn.active.availableCards.Count - index == 1)
                {
                    foreach (var foundation in boardFoundations)
                    {
                        spotFoundFlag = foundation.suitStack(chosenCard);
                        if (spotFoundFlag != 1) continue;
                        currentColumn.RemoveFromColumn(chosenCard);
                        return;
                    }
                }

                foreach (var column in boardColumns)
                {
                    if (column.Equals(currentColumn)) continue;
                    spotFoundFlag +=
                        column.AddToColumn(currentColumn.active.availableCards.GetRange(index,
                            currentColumn.active.availableCards.Count - index));
                    if (spotFoundFlag != 1) continue;
                    currentColumn.RemoveFromColumn(chosenCard);
                    return;
                }
            }

            public void FlipFromStockpile()
            {
                if (WasteColumn.active.availableCards.Count > 0)
                {
                    WasteColumn.reserve.AddCard(WasteColumn.active.availableCards[0]);
                    WasteColumn.active.RemoveCardAt(0);
                }

                if (stockpile.availableCards.Count == 0)
                {
                    Random random = new Random();
                    for (int j = WasteColumn.reserve.availableCards.Count - 1; j > 0; j--)
                    {
                        var i = random.Next(WasteColumn.reserve.availableCards.Count);
                        (WasteColumn.reserve.availableCards[i], WasteColumn.reserve.availableCards[j])
                            = (WasteColumn.reserve.availableCards[j], WasteColumn.reserve.availableCards[i]);
                    }

                    stockpile.availableCards.AddRange(WasteColumn.reserve.availableCards);
                    WasteColumn.reserve.availableCards.RemoveRange(0, WasteColumn.reserve.availableCards.Count);
                }

                WasteColumn.active.AddCard(stockpile.availableCards.Last());
                stockpile.RemoveCardAt(stockpile.availableCards.Count - 1);
            }

            public void MoveFromFoundation(Foundation foundation)
            {
                int spotFoundFlag = 0;
                List<Card> movingCard = new List<Card>();
                movingCard.Add(foundation.suitFoundation.availableCards.Last());
                foreach (var column in boardColumns)
                {
                    spotFoundFlag += column.AddToColumn(movingCard);
                    if (spotFoundFlag != 1) continue;
                    foundation.suitFoundation.RemoveCardAt(foundation.suitFoundation.availableCards.Count - 1);
                    return;
                }
            }
        }
    }
}
