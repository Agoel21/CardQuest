using static CSCE361CardGames.Controllers.TableauColumnController;
using static CSCE361CardGames.Controllers.CardPileController;
using static CSCE361CardGames.Models.DeckModel;
using static CSCE361CardGames.Models.CardModel;
using CSCE361CardGames.Models;
using Microsoft.EntityFrameworkCore.Metadata.Internal;

namespace CardGamesTests
{
    /*
     * Tests for methods/classes in TableauColumnController
     */
    [TestClass]
    public class TableauColumnTests
    {
        
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
        public void RemoveFromColumnTest()
        {
            Deck deck = new Deck();
            deck.FillDeck();
            TableauColumn col = new TableauColumn();
            col.BuildColumn(deck, 1);

            Card activeCard = col.Active.AvailableCards[0];
            Card reserveCard = col.Reserve.AvailableCards[0];
            col.RemoveFromColumn(activeCard);

            Assert.AreEqual(col.Active.AvailableCards[0], reserveCard);
        }

        [TestMethod]
        public void AcceptKingOntoEmptyColumnTest()
        {
            TableauColumn col = new TableauColumn();
            List<Card> listToAdd = new();
            Card king = new Card(Card.Suits.Hearts, Card.Ranks.King);
            listToAdd.Add(king);

            int result = col.AddToColumn(listToAdd);
            Assert.IsTrue(col.Active.AvailableCards.Contains(king));
        }

        [TestMethod]
        public void RejectNonKingOntoEmptyColumnTest()
        {
            TableauColumn col = new TableauColumn();
            List<Card> listToAdd = new();
            Card tester = new Card(Card.Suits.Hearts, Card.Ranks.Ace);
            listToAdd.Add(tester);

            int result = col.AddToColumn(listToAdd);
            Assert.IsFalse(col.Active.AvailableCards.Contains(tester));
        }
    }
}