/*
* This model defines the player class and interface.
*/

using static CSCE361CardGames.Models.CardModel;
using static CSCE361CardGames.Models.DeckModel;
using static CSCE361CardGames.Controllers.CardPileController;

namespace CSCE361CardGames.Models
{
    public class PlayerModel
    {

        /*
         * Interface for the Player class
         */
        interface IPlayer
        {
            //TODO?
        }

        /*
         * The player class, used for multiplayer games, 
         * which assigns each player a name and a hand.
         */
        public class Player : IPlayer
        {
            public string PlayerName { get; set; } = string.Empty;
            public CardPile Hand = new();

            public Player(string playerName)
            {
                PlayerName = playerName;
            }

        }
    }
}