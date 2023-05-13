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
                Console.WriteLine("H: See game rules.");
                Console.WriteLine("Q: Quit playing.");

                char choice = ' ';
                while (choice != '1' && choice != '2' && choice != 'H' && choice != 'Q')
                {
                    Console.Write("Enter 1 for Solitaire, 2 for Crazy 8s, H for game rules, or Q to quit: ");
                    choice = (char)Console.ReadKey().Key;
                    Console.WriteLine();
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
                else if (choice.Equals('H'))
                {
                    Console.ForegroundColor = ConsoleColor.Red;
                    Console.WriteLine("How to Play: Klondike Solitaire");
                    Console.ForegroundColor = ConsoleColor.White;
                    Console.WriteLine("Objective: Get all 52 cards into the foundations in ascending order.");
                    Console.WriteLine();
                    Console.WriteLine("Rules:");
                    Console.WriteLine("- Cards in columns are placed in alternating colors.");
                    Console.WriteLine("- Cards are placed in descending order (4 goes on top of 5, queen goes on top of king).");
                    Console.WriteLine("- Only Kings can be moved onto empty slots.");
                    Console.WriteLine("- Cards are placed into the foundation in ascending order (Ace, 2, 3, ..., 10, Jack, Queen, King).");
                    Console.WriteLine("- All or parts of columns can be moved all at once onto a different column if the back most card of the grabbed column can be put on the topmost card of the other column.");
                    Console.WriteLine("- Cards can be drawn from the deck one at a time. These cards are moved to the waste, where only the top most card can be played into the tableau. Thus, to use a card after already drawing a new one (and the new one can't be played), the rest of the deck has to be drawn into the waste, cycle back to the top, and drawn until the desired card is back at the top of the waste.");
                    Console.WriteLine("- The top most hidden card is revealed when the full column of revealed cards is moved off.");

                    Console.WriteLine();
                    Console.WriteLine();

                    Console.ForegroundColor = ConsoleColor.Cyan;
                    Console.WriteLine("How to Play: Crazy Eights");
                    Console.ForegroundColor = ConsoleColor.White;
                    Console.WriteLine("Objective: Be the first to empty your hand of cards.");
                    Console.WriteLine();
                    Console.WriteLine("Rules:");
                    Console.WriteLine("On your turn, you may...");
                    Console.WriteLine("     - Play a valid card from your hand onto the card pile");
                    Console.WriteLine("     - Play an 8");
                    Console.WriteLine("     - Draw card(s) from the deck.");
                    Console.WriteLine("A valid card is a card with the same suit or rank (number/face) as the card on the top of the center pile.");
                    Console.WriteLine("Eights:");
                    Console.WriteLine("Cards with the number 8 are the exception to the valid cards: eights are considered wild cards.\n" +
                                      "Wild cards can be placed onto any card.\n" +
                                      "A player who plays an Eight then declares the new suit that can be played, replacing the old suit.\n" +
                                      "For example, imagine that the current card on the center pile is a 5 of Hearts. A player can place any 8 and declare the new suit as Clubs.\n" +
                                      " The next player can only play cards that are Clubs, play an 8, or draw from the stockpile.");



                }
                else if (choice.Equals('Q'))
                {
                    ContinuePlaying = false;
                }
            }

        }
    }
}

