using static CSCE361CardGames.Controllers.SolitaireBoardController;
using static CSCE361CardGames.Controllers.FoundationController;
using static CSCE361CardGames.Controllers.TableauColumnController;
using static CSCE361CardGames.Controllers.CardPileController;
using static CSCE361CardGames.Models.DeckModel;
using static CSCE361CardGames.Models.CardModel;
using CSCE361CardGames.Models;

namespace CardGamesTests
{
    /*
     * Tests for methods/classes in SolitaireBoardController
     */
    [TestClass]
    public class SolitaireBoardTests
    {
        [TestMethod]
        public void PlayableFoundationMoveTest()
        {
            SolitaireBoard board = new SolitaireBoard();
            board.GenerateBoard();
            Card card = new Card(Card.Suits.Hearts, Card.Ranks.Ace);
            board.ColumnOne.Active.AvailableCards[0] = card;
            board.CheckBoard(board.ColumnOne, card);
            Assert.AreEqual(board.HeartsFoundation.SuitFoundation.AvailableCards[0], card);
        }

        [TestMethod]
        public void PlayableColumnMoveTest()
        {
            SolitaireBoard board = new SolitaireBoard();
            board.GenerateBoard();
            Card first = new Card(Card.Suits.Spades, Card.Ranks.Seven);
            Card second = new Card(Card.Suits.Hearts, Card.Ranks.Six);
            board.ColumnTwo.Active.AvailableCards[0] = first;
            board.ColumnOne.Active.AvailableCards[0] = second;
            board.CheckBoard(board.ColumnOne, second);
            Assert.AreEqual(board.ColumnTwo.Active.AvailableCards[0], first);
            Assert.AreEqual(board.ColumnTwo.Active.AvailableCards[1], second);
        }

        [TestMethod]
        public void PlayableFromWasteTest()
        {
            SolitaireBoard board = new SolitaireBoard();
            board.GenerateBoard();
            Card card = new Card(Card.Suits.Clubs, Card.Ranks.Ace);
            board.WasteColumn.Active.AvailableCards.Add(card);
            board.CheckBoard(board.WasteColumn, card);
            Assert.AreEqual(board.ClubsFoundation.SuitFoundation.AvailableCards[0], card);
        }

        [TestMethod]
        public void NoPlayableMovesTest()
        {
            SolitaireBoard board = new SolitaireBoard();
            Card card = new Card(Card.Suits.Spades, Card.Ranks.Seven);
            board.ColumnOne.Active.AvailableCards.Add(card);
            board.CheckBoard(board.ColumnOne, card);
            Assert.AreEqual(board.ColumnOne.Active.AvailableCards[0], card);
        }

        [TestMethod]
        public void PullFromStockpileTest()
        {
            SolitaireBoard board = new SolitaireBoard();
            Card first = new Card(Card.Suits.Diamonds, Card.Ranks.Six);
            Card second = new Card(Card.Suits.Spades, Card.Ranks.King);
            board.WasteColumn.Active.AvailableCards.Add(first);
            board.Stockpile.AvailableCards.Add(second);
            board.FlipFromStockpile();
            Assert.AreEqual(board.WasteColumn.Reserve.AvailableCards[0], first);
            Assert.AreEqual(board.WasteColumn.Active.AvailableCards[0], second);
        }

        [TestMethod]
        public void EmptyStockpileTest()
        {
            SolitaireBoard board = new SolitaireBoard();
            Card card = new Card(Card.Suits.Clubs, Card.Ranks.Four);
            board.WasteColumn.Active.AvailableCards.Add(card);
            board.FlipFromStockpile();
            Assert.AreEqual(board.WasteColumn.Active.AvailableCards[0], card);
        }

        [TestMethod]
        public void MoveFromFoundationSuccessTest()
        {
            SolitaireBoard board = new SolitaireBoard();
            board.GenerateBoard();
            Card first = new Card(Card.Suits.Spades, Card.Ranks.Ace);
            Card second = new Card(Card.Suits.Hearts, Card.Ranks.Two);
            board.SpadesFoundation.SuitFoundation.AvailableCards.Add(first);
            board.ColumnOne.Active.AvailableCards[0] = second;
            board.MoveFromFoundation(board.SpadesFoundation);
            Assert.AreEqual(board.ColumnOne.Active.AvailableCards[0], second);
            Assert.AreEqual(board.ColumnOne.Active.AvailableCards[1], first);
        }

        [TestMethod]
        public void MoveFromFoundationFailTest()
        {
            SolitaireBoard board = new SolitaireBoard();
            Card card = new Card(Card.Suits.Spades, Card.Ranks.Ace);
            board.SpadesFoundation.SuitFoundation.AvailableCards.Add(card);
            board.MoveFromFoundation(board.SpadesFoundation);
            Assert.AreEqual(board.SpadesFoundation.SuitFoundation.AvailableCards[0], card);
        }
    }
}