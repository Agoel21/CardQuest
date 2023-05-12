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
    [TestClass]
    public class UnitTest1
    {
        /*
         * Card Tests
         */
        [TestMethod]
        public void CompareRankTest()
        {
            Card card = new Card(Card.Suits.Spades, Card.Ranks.Five);
            Assert.AreEqual(card.Rank + 1, Card.Ranks.Six);
        }

        /*
         * Deck Tests.
         */
        [TestMethod]
        public void DeckTest()
        {
            Deck deck = new Deck();
            deck.FillDeck();
            Assert.AreEqual(52, deck.DeckOfCards.Count());
        }

        [TestMethod]
        public void TakeFromDeckTest()
        {
            Deck deck = new Deck();
            deck.FillDeck();
            Card card = deck.TakeFromDeckAt(0);
            Card aceOfClubs = new Card(Card.Suits.Clubs, Card.Ranks.Ace);
            Assert.AreEqual(aceOfClubs.Suit, card.Suit);
        }

        [TestMethod]
        public void TakeFromDeckShuffleTest()
        {
            Deck deck = new Deck();
            deck.FillDeck();
            deck.ShuffleDeck();
            Card card = deck.TakeFromDeckAt(0);
            Card aceOfClubs = new Card(Card.Suits.Clubs, Card.Ranks.Ace);
            Assert.AreNotEqual(aceOfClubs, card);
        }

        /*
         * Tests for methods/classes in SetupController.
         */
        [TestMethod]
        public void CardPileSetCardsTest()
        {
            Deck deck = new Deck();
            deck.FillDeck();
            CardPile pile = new CardPile();
            pile.SetCards(deck.DeckOfCards);
            Assert.AreEqual(deck.DeckOfCards, pile.AvailableCards);
        }

        /*
         * Tests for methods/classes in SolitaireController
         */
        [TestMethod]
        public void TableauBuildColumnTest()
        {
            Deck deck = new Deck();
            deck.FillDeck();
            TableauColumn col = new TableauColumn();
            col.BuildColumn(deck, 5);
            Assert.AreEqual(col.Active.AvailableCards.Count, 1);
            Assert.AreEqual(col.Reserve.AvailableCards.Count, 5);
        }

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

        /*
         * Tests for methods/classes in the PlayerModel.
         */
        [TestMethod]
        public void SetPlayerNameTest()
        {
            Player p = new Player("test_name");
            Assert.AreEqual(p.PlayerName, "test_name");
        }

        [TestMethod]
        public void SetPlayerHandTest()
        {
            Deck deck = new Deck();
            deck.FillDeck();
            CardPile hand = new CardPile();
            hand.SetCards(deck.DeckOfCards);

            Player p = new Player("test_name");
            p.Hand.SetCards(hand.AvailableCards);
            Assert.AreEqual(p.Hand.AvailableCards, hand.AvailableCards);
        }

        /*
         * Tests for methods/classes in Crazy8sController.
         */
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
            board.PassTurn();

            Assert.AreEqual(board.CurrentPlayer?.Value, player1);
        }
    }
}