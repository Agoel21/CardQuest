using static CSCE361CardGames.Controllers.CardPileController;
using static CSCE361CardGames.Models.PlayerModel;
using static CSCE361CardGames.Models.DeckModel;
using static CSCE361CardGames.Models.CardModel;
using CSCE361CardGames.Models;

namespace CardGamesTests
{
    /*
     * Tests for methods/classes in the PlayerModel.
     */
    [TestClass]
    public class PlayerTests
    {
        
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
    }
}