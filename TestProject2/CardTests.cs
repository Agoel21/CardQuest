using static CSCE361CardGames.Models.CardModel;
using CSCE361CardGames.Models;

namespace CardGamesTests
{
    /*
     * Card Tests
    */
    [TestClass]
    public class CardTests
    {
        [TestMethod]
        public void CompareRankGreaterThanTest()
        {
            Card card = new Card(Card.Suits.Spades, Card.Ranks.Five);
            Assert.AreEqual(card.Rank + 1, Card.Ranks.Six);
        }

        [TestMethod]
        public void CompareRankLessThanTest()
        {
            Card card = new Card(Card.Suits.Spades, Card.Ranks.Five);
            Assert.AreEqual(card.Rank - 1, Card.Ranks.Four);
        }

        [TestMethod]
        public void CompareSuitTest()
        {
            Card card = new Card(Card.Suits.Clubs, Card.Ranks.Ace);
            Assert.AreEqual(card.Suit, (Card.Suits)1);

            card = new Card(Card.Suits.Diamonds, Card.Ranks.Ace);
            Assert.AreEqual(card.Suit, (Card.Suits)2);

            card = new Card(Card.Suits.Hearts, Card.Ranks.Ace);
            Assert.AreEqual(card.Suit, (Card.Suits)3);

            card = new Card(Card.Suits.Spades, Card.Ranks.Ace);
            Assert.AreEqual(card.Suit, (Card.Suits)4);

        }
    }
}