using static CSCE361CardGames.Controllers.SetupController;
using static CSCE361CardGames.Controllers.PlayerController;
using static CSCE361CardGames.Models.CardModel;
using static CSCE361CardGames.Models.DeckModel;

namespace CSCE361CardGames.Controllers
{
    public class Crazy8sController
    {
        interface ICrazy8sBoard
        {
            void AddPlayer(Player player);
            void SetTurnOrder();
            void DistributeCards(Deck deck);
            void GenerateBoard();

        }

        public class Crazy8sBoard : ICrazy8sBoard
        {
            public List<Player> Players = new();
            public CardPile Stockpile = new();

            public void AddPlayer(Player player)
            {
                if (Players.Count < 6)
                {
                    Players.Add(player);
                }
                else
                {
                    Console.WriteLine("Maximum of 6 players supported");
                }
            }

            public void SetTurnOrder()
            {
                Random random = new();
                int i = random.Next(Players.Count);

                //TODO: finish this method to enforce a turn order

            }

            public void DistributeCards(Deck deckOfCards)
            {
                foreach (Player player in Players)
                {
                    player.Hand.GrabCards(deckOfCards, 5);
                }
            }

            public void GenerateBoard()
            {
                Deck deck = new();
                deck.FillDeck();
                deck.ShuffleDeck();

                DistributeCards(deck);

                Stockpile.SetCards(deck.deckOfCards);

                SetTurnOrder();

            }


        }
}
