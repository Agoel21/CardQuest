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
    }
}