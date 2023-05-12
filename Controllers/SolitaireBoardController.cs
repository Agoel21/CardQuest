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
            public List<Foundation> BoardFoundations = new List<Foundation>();
            public List<TableauColumn> BoardColumns = new List<TableauColumn>();

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

            public CardPile Stockpile = new();

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

                Stockpile.SetCards(deck.DeckOfCards);


                BoardFoundations.Add(ClubsFoundation);
                BoardFoundations.Add(DiamondsFoundation);
                BoardFoundations.Add(HeartsFoundation);
                BoardFoundations.Add(SpadesFoundation);

                BoardColumns.Add(ColumnOne);
                BoardColumns.Add(ColumnTwo);
                BoardColumns.Add(ColumnThree);
                BoardColumns.Add(ColumnFour);
                BoardColumns.Add(ColumnFive);
                BoardColumns.Add(ColumnSix);
                BoardColumns.Add(ColumnSeven);
            }

            public void CheckBoard(TableauColumn currentColumn, Card chosenCard)
            {
                int index = currentColumn.Active.AvailableCards.FindIndex(c => c == chosenCard);
                int spotFoundFlag = 0;

                if (currentColumn.Active.AvailableCards.Count - index == 1)
                {
                    foreach (var foundation in BoardFoundations)
                    {
                        spotFoundFlag = foundation.SuitStack(chosenCard);
                        if (spotFoundFlag != 1) continue;
                        currentColumn.RemoveFromColumn(chosenCard);
                        return;
                    }
                }

                foreach (var column in BoardColumns)
                {
                    if (column.Equals(currentColumn)) continue;
                    spotFoundFlag +=
                        column.AddToColumn(currentColumn.Active.AvailableCards.GetRange(index,
                            currentColumn.Active.AvailableCards.Count - index));
                    if (spotFoundFlag != 1) continue;
                    currentColumn.RemoveFromColumn(chosenCard);
                    return;
                }
            }

            public void FlipFromStockpile()
            {
                if (WasteColumn.Active.AvailableCards.Count > 0)
                {
                    WasteColumn.Reserve.AddCard(WasteColumn.Active.AvailableCards[0]);
                    WasteColumn.Active.RemoveCardAt(0);
                }

                if (Stockpile.AvailableCards.Count == 0)
                {
                    Random random = new Random();
                    for (int j = WasteColumn.Reserve.AvailableCards.Count - 1; j > 0; j--)
                    {
                        var i = random.Next(WasteColumn.Reserve.AvailableCards.Count);
                        (WasteColumn.Reserve.AvailableCards[i], WasteColumn.Reserve.AvailableCards[j])
                            = (WasteColumn.Reserve.AvailableCards[j], WasteColumn.Reserve.AvailableCards[i]);
                    }

                    Stockpile.AvailableCards.AddRange(WasteColumn.Reserve.AvailableCards);
                    WasteColumn.Reserve.AvailableCards.RemoveRange(0, WasteColumn.Reserve.AvailableCards.Count);
                }

                WasteColumn.Active.AddCard(Stockpile.AvailableCards.Last());
                Stockpile.RemoveCardAt(Stockpile.AvailableCards.Count - 1);
            }

            public void MoveFromFoundation(Foundation foundation)
            {
                int spotFoundFlag = 0;
                List<Card> movingCard = new List<Card>();
                movingCard.Add(foundation.SuitFoundation.AvailableCards.Last());
                foreach (var column in BoardColumns)
                {
                    spotFoundFlag += column.AddToColumn(movingCard);
                    if (spotFoundFlag != 1) continue;
                    foundation.SuitFoundation.RemoveCardAt(foundation.SuitFoundation.AvailableCards.Count - 1);
                    return;
                }
            }
        }
    }
}
