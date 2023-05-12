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
     * Tests for methods/classes in CardPileController.
     */
    [TestClass]
    public class CardPileTests
    {
        [TestMethod]
        public void CardPileSetCardsTest()
        {
            Deck deck = new Deck();
            deck.FillDeck();
            CardPile pile = new CardPile();
            pile.SetCards(deck.DeckOfCards);
            Assert.AreEqual(deck.DeckOfCards, pile.AvailableCards);
        }

    }
}