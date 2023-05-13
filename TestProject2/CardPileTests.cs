using static CSCE361CardGames.Controllers.CardPileController;
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

        [TestMethod]
        public void CardPileGrabCardsTest()
        {
            Deck deck = new Deck();
            deck.FillDeck();
            CardPile pile = new CardPile();
            pile.GrabCards(deck, 10);
            Assert.AreEqual(10, pile.AvailableCards.Count);
        }

        [TestMethod]
        public void TakeCardAtTest()
        {
            Deck deck = new Deck();
            deck.FillDeck();
            CardPile pile = new CardPile();
            pile.GrabCards(deck, 10);

            Card targetCard = pile.AvailableCards[6];
            Card actualCard = pile.TakeCardAt(6);

            Assert.AreEqual(targetCard, actualCard);
            Assert.AreEqual(pile.AvailableCards.Count, 9);
        }

        [TestMethod]
        public void RemoveCardTest()
        {
            List<Card> cardToAdd = new();
            Card targetCard = new Card(Card.Suits.Clubs, Card.Ranks.Ace);
            cardToAdd.Add(targetCard);

            CardPile pile = new CardPile();
            pile.AvailableCards = cardToAdd;

            pile.RemoveCard(targetCard);

            Assert.IsFalse(pile.AvailableCards.Contains(targetCard));
            Assert.AreEqual(pile.AvailableCards.Count, 0);
        }

        [TestMethod]
        public void RemoveCardAtTest()
        {
            Deck deck = new Deck();
            deck.FillDeck();
            CardPile pile = new CardPile();
            pile.AvailableCards = deck.DeckOfCards;

            Card targetCard = pile.AvailableCards[6];

            pile.RemoveCardAt(6);

            Assert.IsFalse(pile.AvailableCards.Contains(targetCard));
            Assert.AreEqual(pile.AvailableCards.Count, 51);
        }


        [TestMethod]
        public void AddCardTest()
        {
            CardPile pile = new CardPile();
            Card newCard = new Card(Card.Suits.Clubs, Card.Ranks.Ace);
            pile.AddCard(newCard);

            Assert.IsTrue(pile.AvailableCards.Contains(newCard));
        }

    }
}