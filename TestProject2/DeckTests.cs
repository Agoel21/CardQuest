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
     * Deck Tests.
     */
    [TestClass]
    public class DeckTests
    {
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
    }
}

       