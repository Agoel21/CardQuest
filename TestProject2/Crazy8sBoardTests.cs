using static CSCE361CardGames.Controllers.SolitaireBoardController;
using static CSCE361CardGames.Controllers.FoundationController;
using static CSCE361CardGames.Controllers.TableauColumnController;
using static CSCE361CardGames.Controllers.CardPileController;
using static CSCE361CardGames.Controllers.Crazy8sController;
using static CSCE361CardGames.Models.PlayerModel;
using static CSCE361CardGames.Models.DeckModel;
using static CSCE361CardGames.Models.CardModel;
using CSCE361CardGames.Models;

namespace CardGamesTests
{
    /*
     * Tests for methods/classes in Crazy8sController.
     */
    [TestClass]
    public class Crazy8sBoardTests {

        
        [TestMethod]
        public void AddPlayerTest()
        {
            Crazy8sBoard board = new Crazy8sBoard();
            Player p = new Player("player");
            board.AddPlayer(p);
            Assert.AreEqual(board.Players?.First?.Value, p);
        }

        [TestMethod]
        public void SixPlayerCapTest()
        {
            Crazy8sBoard board = new Crazy8sBoard();
            Player p = new Player("player");
            board.AddPlayer(p);
            board.AddPlayer(p);
            board.AddPlayer(p);
            board.AddPlayer(p);
            board.AddPlayer(p);
            board.AddPlayer(p);
            board.AddPlayer(p);
            Assert.AreEqual(board.Players.Count, 6);
        }

        [TestMethod]
        public void DistributeCardsTest()
        {
            Crazy8sBoard board = new Crazy8sBoard();
            Player player1 = new Player("player1");
            Player player2 = new Player("player2");
            Player player3 = new Player("player3");
            board.AddPlayer(player1);
            board.AddPlayer(player2);
            board.AddPlayer(player3);

            Deck deck = new();
            deck.FillDeck();
            board.DistributeCards(deck);
            foreach (Player player in board.Players)
            {
                Assert.AreEqual(player.Hand.AvailableCards.Count, 5);
            }
        }

        [TestMethod]
        public void PlayCardOfSameRankTest()
        {
            Crazy8sBoard board = new Crazy8sBoard();

            board.ActiveCard = new Card(Card.Suits.Clubs, Card.Ranks.Ace);
            Card testCard = new Card(Card.Suits.Spades, Card.Ranks.Ace);
            board.PlayCard(testCard);

            Assert.AreEqual(board.ActiveCard.Suit, Card.Suits.Spades);
            Assert.AreEqual(board.ActiveCard, testCard);
        }

        [TestMethod]
        public void PlayCardOfSameSuitTest()
        {
            Crazy8sBoard board = new Crazy8sBoard();

            board.ActiveCard = new Card(Card.Suits.Clubs, Card.Ranks.Ace);
            board.ActiveSuit = Card.Suits.Clubs;
            Card testCard = new Card(Card.Suits.Clubs, Card.Ranks.Two);
            board.PlayCard(testCard);

            Assert.AreEqual(board.ActiveCard.Rank, Card.Ranks.Two);
            Assert.AreEqual(board.ActiveCard, testCard);
        }

        [TestMethod]
        public void AcceptCorrectSuitWhenEightActiveTest()
        {
            Crazy8sBoard board = new Crazy8sBoard();

            board.ActiveCard = new Card(Card.Suits.Diamonds, Card.Ranks.Eight);
            board.ActiveSuit = Card.Suits.Hearts;
            Card testCard = new Card(Card.Suits.Hearts, Card.Ranks.Three);
            board.PlayCard(testCard);

            Assert.AreEqual(board.ActiveCard, testCard);
        }

        [TestMethod]
        public void RejectWrongSuitWhenEightActiveTest()
        {
            Crazy8sBoard board = new Crazy8sBoard();

            board.ActiveCard = new Card(Card.Suits.Diamonds, Card.Ranks.Eight);
            board.ActiveSuit = Card.Suits.Hearts;
            Card testCard = new Card(Card.Suits.Diamonds, Card.Ranks.Three);
            board.PlayCard(testCard);

            Assert.AreNotEqual(board.ActiveCard, testCard);
        }

        [TestMethod]
        public void AcceptEightWhenEightActiveTest()
        {
            Crazy8sBoard board = new Crazy8sBoard();

            board.ActiveCard = new Card(Card.Suits.Diamonds, Card.Ranks.Eight);
            board.ActiveSuit = Card.Suits.Hearts;
            Card testCard = new Card(Card.Suits.Clubs, Card.Ranks.Eight);
            board.PlayCard(testCard);

            Assert.AreEqual(board.ActiveCard, testCard);
        }

        [TestMethod]
        public void AcceptEightWhenAnyCardActiveTest()
        {
            Crazy8sBoard board = new Crazy8sBoard();

            board.ActiveCard = new Card(Card.Suits.Diamonds, Card.Ranks.Three);
            Card testCard = new Card(Card.Suits.Spades, Card.Ranks.Eight);
            board.PlayCard(testCard);

            Assert.AreEqual(board.ActiveCard, testCard);
        }

        [TestMethod]
        public void DrawFromStockPileTest()
        {
            Crazy8sBoard board = new Crazy8sBoard();
            Player player = new Player("test_player");
            board.AddPlayer(player);
            board.GenerateBoard();

            int initialAmountInHand = player.Hand.AvailableCards.Count;
            int initialAmountInStock = board.Stockpile.AvailableCards.Count;

            board.DrawFromStockPile();


            Assert.AreNotEqual(player.Hand.AvailableCards.Count, initialAmountInHand);
            Assert.AreNotEqual(board.Stockpile.AvailableCards.Count, initialAmountInStock);
        }

        [TestMethod]
        public void DrawFromEmptyStockPileTest()
        {
            Crazy8sBoard board = new Crazy8sBoard();
            Player player = new Player("test_player");
            board.AddPlayer(player);
            board.GenerateBoard();

            int initialAmountInHand = player.Hand.AvailableCards.Count;

            board.Stockpile.SetCards(new());

            Deck deck = new();
            deck.FillDeck();
            board.Activedeck.DeckOfCards = deck.DeckOfCards;

            board.DrawFromStockPile();

            Assert.AreEqual(player.Hand.AvailableCards.Count, initialAmountInHand);
            Assert.AreEqual(board.Stockpile.AvailableCards.Count, 52);
        }

        [TestMethod]
        public void PassTurnToNextTest()
        {
            Crazy8sBoard board = new Crazy8sBoard();
            Player player1 = new Player("player_1");
            Player player2 = new Player("player_2");
            board.AddPlayer(player1);
            board.AddPlayer(player2);

            board.GenerateBoard();
            board.PassTurn();

            Assert.AreEqual(board.CurrentPlayer?.Value, player2);
        }

        [TestMethod]
        public void PassTurnWrapAroundTest()
        {
            Crazy8sBoard board = new Crazy8sBoard();
            Player player1 = new Player("player_1");
            Player player2 = new Player("player_2");
            board.AddPlayer(player1);
            board.AddPlayer(player2);

            board.GenerateBoard();

            board.PassTurn();
            Assert.AreEqual(board.CurrentPlayer?.Value, player2);

            board.PassTurn();
            Assert.AreEqual(board.CurrentPlayer?.Value, player1);
        }
    }
}