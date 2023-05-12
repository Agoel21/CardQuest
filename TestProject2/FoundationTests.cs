using static CSCE361CardGames.Controllers.SolitaireBoardController;
using static CSCE361CardGames.Controllers.FoundationController;
using static CSCE361CardGames.Controllers.CardPileController;
using static CSCE361CardGames.Models.DeckModel;
using static CSCE361CardGames.Models.CardModel;
using CSCE361CardGames.Models;

namespace CardGamesTests
{
    /*
     * Tests for methods/classes in FoundationController
     */
    [TestClass]
    public class FoundationTests
    {
        [TestMethod]
        public void FoundationCompareSuitTest()
        {
            SolitaireBoard board = new SolitaireBoard();
            Card card = new Card(Card.Suits.Diamonds, Card.Ranks.Ace);
            Assert.AreEqual(board.DiamondsFoundation.Suit, Card.Suits.Diamonds);
        }

        [TestMethod]
        public void FoundationSuccessfulStackTest()
        {
            SolitaireBoard board = new SolitaireBoard();
            Card first = new Card(Card.Suits.Diamonds, Card.Ranks.Ace);
            Card second = new Card(Card.Suits.Diamonds, Card.Ranks.Two);
            board.DiamondsFoundation.SuitStack(first);
            board.DiamondsFoundation.SuitStack(second);
            Assert.AreEqual(board.DiamondsFoundation.SuitFoundation.AvailableCards[0], first);
            Assert.AreEqual(board.DiamondsFoundation.SuitFoundation.AvailableCards[1], second);
        }

        [TestMethod]
        public void FoundationWrongSuitTest()
        {
            SolitaireBoard board = new SolitaireBoard();
            Card first = new Card(Card.Suits.Diamonds, Card.Ranks.Ace);
            Card second = new Card(Card.Suits.Spades, Card.Ranks.Two);
            board.DiamondsFoundation.SuitStack(first);
            board.DiamondsFoundation.SuitStack(second);
            Assert.AreEqual(board.DiamondsFoundation.SuitFoundation.AvailableCards.Count, 1);
        }

        [TestMethod]
        public void FoundationWrongRankTest()
        {
            SolitaireBoard board = new SolitaireBoard();
            Card first = new Card(Card.Suits.Diamonds, Card.Ranks.Ace);
            Card second = new Card(Card.Suits.Diamonds, Card.Ranks.Three);
            board.DiamondsFoundation.SuitStack(first);
            board.DiamondsFoundation.SuitStack(second);
            Assert.AreEqual(board.DiamondsFoundation.SuitFoundation.AvailableCards.Count, 1);
        }
    }
}