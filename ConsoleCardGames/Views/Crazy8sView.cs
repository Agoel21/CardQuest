using static CSCE361CardGames.Models.CardModel;
using static CSCE361CardGames.Models.DeckModel;
using static CSCE361CardGames.Models.PlayerModel;
using static CSCE361CardGames.Controllers.CardPileController;
using static CSCE361CardGames.Controllers.Crazy8sController;
using static CSCE361CardGames.Controllers.GameController;

using CSCE361CardGames.Models;
using CSCE361CardGames.Controllers;

namespace CSCE361CardGamesConsole.Views
{

    /*
     * A functional console representation of Crazy 8s that allows
     * 2-6 players. 
     * 
     */

    public class Crazy8sView
    {

        public interface ICrazy8sGame
        {
            /*
             * Walks the players through the setup process,
             * including setting a player number and
             * initializing that number of players.
             */
            void InstantiatePlayers();

            /*
             * Prints the cards in the hands of all players
             * on the board.
             */
            void PrintAllHands();

            /*
             * Allows the current player to make a move
             * by use of numeric inputs.
             */
            void PromptMove();

            /*
             * Upon playing an 8, the current player is prompted
             * to choose the active suit, enforcing wildcard rules.
             */
            void ChooseWildcard();

            /*
             * Initializes a game of Crazy 8s.
             */
            void StartCrazy8sGame();

        }

        public class Crazy8sGame : ICrazy8sGame
        {
            public Crazy8sBoard Board = new();
            public Card? PreviousActiveCard { get; set; }
            public bool WildCardJustPlayed { get; set; }
            public bool WinnerWasFound { get; set; }
            public DateTime StartTime = new();
            public DateTime EndTime = new();

            public void InstantiatePlayers()
            {
                Console.WriteLine("How many players will there be?");

                string? entry = "";
                int playerCount = 0;
                while (!int.TryParse(entry, out playerCount) || (playerCount < 2 || playerCount > 6))
                {
                    Console.Write("Please enter a number in the range 2 to 6: ");
                    entry = Console.ReadLine();
                }

                for (int i = 1; i <= playerCount; i++)
                {
                    string? playerName = "";
                    while (string.IsNullOrEmpty(playerName))
                    {
                        Console.Write($"Player {i}, please enter a name: ");
                        playerName = Console.ReadLine();
                    }
                    Board.AddPlayer(new Player(playerName));
                }

                Console.WriteLine("Welcome, players!");

            }
            public void PrintAllHands()
            {
                foreach (Player p in Board.Players)
                {
                    Console.WriteLine($"{p.PlayerName}'s Hand");
                    foreach (Card c in p.Hand.AvailableCards)
                    {
                        Console.WriteLine($"{c.Rank} of {c.Suit}");
                    }
                    Console.WriteLine("");
                }
            }

            public void PromptMove()
            {
                Console.WriteLine($"Active Card: {Board.ActiveCard?.Rank} of {Board.ActiveCard?.Suit}");
                Console.WriteLine($"Active Suit: {Board.ActiveSuit}");
                Console.WriteLine($"{Board.CurrentPlayer?.Value.PlayerName}'s turn");

                Console.WriteLine("0: Draw a card.");
                int i = 1;
                if (Board.CurrentPlayer != null)
                {
                    foreach (Card c in Board.CurrentPlayer.Value.Hand.AvailableCards)
                    {
                        Console.WriteLine($"{i}: {c.Rank} of {c.Suit}");
                        i++;
                    }

                    string? selection = Console.ReadLine();
                    int choice;
                    while (!int.TryParse(selection, out choice))
                    {
                        selection = Console.ReadLine();
                    }

                    if (choice == 0)
                    {
                        Board.DrawFromStockPile();
                    }
                    else if ((choice - 1) < Board.CurrentPlayer.Value.Hand.AvailableCards.Count)
                    {
                        PreviousActiveCard = Board.ActiveCard;
                        Board.PlayCard(Board.CurrentPlayer.Value.Hand.AvailableCards[choice - 1]);
                        if (!Board.ActiveCard!.Equals(PreviousActiveCard) && Board.ActiveCard.Rank.Equals(Card.Ranks.Eight))
                        {
                            WildCardJustPlayed = true;
                        }
                    }
                }

                Console.WriteLine();
            }

            public void ChooseWildcard()
            {
                char choice = ' ';
                while (choice != '1' && choice != '2' && choice != '3' && choice != '4')
                {
                    Console.WriteLine($"{Board.CurrentPlayer?.Value.PlayerName}, choose a wildcard suit: \n 1) Clubs \n 2) Diamonds \n 3) Hearts \n 4) Spades");
                    choice = (char)Console.ReadKey().Key;
                }
                Board.ActiveSuit = (Card.Suits)(choice - 48);
                Board.PassTurn();
            }

            public void StartCrazy8sGame()
            {

                InstantiatePlayers();

                Board.GenerateBoard();

                StartTime = DateTime.Now;

                PrintAllHands();

                while (Board.CurrentPlayer != null && !WinnerWasFound)
                {
                    if (WildCardJustPlayed)
                    {
                        ChooseWildcard();
                        WildCardJustPlayed = false;
                        Console.WriteLine();
                    }

                    PromptMove();

                    if (Board.CurrentPlayer.Value.Hand.AvailableCards.Count == 0)
                    {
                        WinnerWasFound = true;
                    }

                    Console.WriteLine();

                }

                Console.WriteLine($"{Board.CurrentPlayer?.Value.PlayerName} wins!");

                EndTime = DateTime.Now;

                GameController dataWriter = new();
                dataWriter.WriteGameToDatabase(StartTime, EndTime, Board.CurrentPlayer!.Value.PlayerName);

                
                Console.WriteLine();

            }
        }
    }
}