using static CSCE361CardGames.Models.CardModel;
using static CSCE361CardGames.Models.DeckModel;
using static CSCE361CardGames.Controllers.CardPileController;

namespace CSCE361CardGames.Controllers
{
    public class PlayerController
    {

        interface IPlayer
        {
            //TODO?
        }

        public class Player : IPlayer
        {
            public string PlayerName { get; set; } = string.Empty;
            public CardPile Hand = new();

        }
    }
}
