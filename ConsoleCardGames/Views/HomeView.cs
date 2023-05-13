using static CSCE361CardGamesConsole.Views.Crazy8sView;
using static CSCE361CardGamesConsole.Views.SolitaireView;

using CSCE361CardGamesConsole.Views;

namespace CSCE361CardGamesConsole
{
    public class HomeView
    {
        public static void Main()
        {

            bool ContinuePlaying = true;

            while (ContinuePlaying)
            {
                Console.ForegroundColor = ConsoleColor.White;
                Console.WriteLine("Welcome to Console Card Games! Please choose a game: ");
                Console.WriteLine("1: Solitare (Singleplayer)");
                Console.WriteLine("2: Crazy 8s (Multiplayer: 2-6 Players)");
                Console.WriteLine("Q: Quit playing.");

                char choice = ' ';
                while (choice != '1' && choice != '2' && choice != 'Q')
                {
                    Console.Write("Enter 1 for Solitaire, 2 for Crazy 8s, or Q to quit: ");
                    choice = (char)Console.ReadKey().Key;
                }
                Console.WriteLine();

                if (choice.Equals('1'))
                {
                    Console.ForegroundColor = ConsoleColor.Red;
                    Console.WriteLine("You selected Solitaire!");
                    SolitaireView newGame = new();
                    newGame.PlaySolitaire();

                }
                else if (choice.Equals('2'))
                {
                    Console.ForegroundColor = ConsoleColor.Cyan;
                    Console.WriteLine("You selected Crazy 8s!");
                    Crazy8sView.Crazy8sGame newGame = new();
                    newGame.StartCrazy8sGame();
                }
                else if (choice.Equals('Q'))
                {
                    ContinuePlaying = false;
                }
            }

        }
    }
}

