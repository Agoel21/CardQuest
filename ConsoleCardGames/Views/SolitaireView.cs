using System.ComponentModel.DataAnnotations;
using static CSCE361CardGames.Models.DeckModel;
using static CSCE361CardGames.Controllers.CardPileController;
using static CSCE361CardGames.Controllers.SolitaireBoardController;
using static CSCE361CardGames.Controllers.FoundationController;
using static CSCE361CardGames.Controllers.TableauColumnController;
using static CSCE361CardGames.Models.CardModel;
using CSCE361CardGames.Controllers;
using System;

namespace CSCE361CardGamesConsole.Views
{
    public class SolitaireView
    {
        public void PrintReserve(TableauColumn column)
        {
            int count = 0;
            Console.WriteLine("Reserve:");
            foreach (Card card in column.Reserve.AvailableCards)
            {
                if (card.Color == Card.Colors.Black)
                {
                    Console.ForegroundColor = ConsoleColor.DarkGray;
                }
                Console.Write(count + ": " + card.Rank + " of " + card.Suit + "\n");
                Console.ForegroundColor = ConsoleColor.Red;
                count++;
            }
            Console.WriteLine();
        }

        public void PrintActive(TableauColumn column)
        {
            Console.WriteLine("Active:");
            int count = 0;
            foreach (Card card in column.Active.AvailableCards)
            {
                if (card.Color == Card.Colors.Black)
                {
                    Console.ForegroundColor = ConsoleColor.DarkGray;
                }
                Console.Write(count + ": " + card.Rank + " of " + card.Suit + "\n");
                Console.ForegroundColor = ConsoleColor.Red;
                count++;
            }
            Console.WriteLine();
        }

        public void PrintFoundation(Foundation foundation)
        {
            int count = 0;

            foreach (Card card in foundation.SuitFoundation.AvailableCards)
            {
                if (card.Color == Card.Colors.Black)
                {
                    Console.ForegroundColor = ConsoleColor.DarkGray;
                }
                Console.Write(count + ": " + card.Rank + " of " + card.Suit + "\n");
                Console.ForegroundColor = ConsoleColor.Red;
                count++;
            }

            Console.WriteLine();
        }

        public void PlaySolitaire() //temp name probably
        {
            Deck deck = new Deck();
            deck.FillDeck();
            deck.ShuffleDeck();
            SolitaireBoard board = new SolitaireBoard();
            board.GenerateBoard();
            while (true)
            {
                Console.WriteLine("-------------------------------------------------------------------------------");
                Console.WriteLine("Waste");
                Console.WriteLine("waste pile = " + board.WasteColumn.Reserve.AvailableCards.Count);
                PrintActive(board.WasteColumn);
                Console.WriteLine("Column 1");
                Console.WriteLine("reserve = " + board.ColumnOne.Reserve.AvailableCards.Count);
                PrintActive(board.ColumnOne);
                Console.WriteLine("Column 2");
                Console.WriteLine("reserve = " + board.ColumnTwo.Reserve.AvailableCards.Count);
                PrintActive(board.ColumnTwo);
                Console.WriteLine("Column 3");
                Console.WriteLine("reserve = " + board.ColumnThree.Reserve.AvailableCards.Count);
                PrintActive(board.ColumnThree);
                Console.WriteLine("Column 4");
                Console.WriteLine("reserve = " + board.ColumnFour.Reserve.AvailableCards.Count);
                PrintActive(board.ColumnFour);
                Console.WriteLine("Column 5");
                Console.WriteLine("reserve = " + board.ColumnFive.Reserve.AvailableCards.Count);
                PrintActive(board.ColumnFive);
                Console.WriteLine("Column 6");
                Console.WriteLine("reserve = " + board.ColumnSix.Reserve.AvailableCards.Count);
                PrintActive(board.ColumnSix);
                Console.WriteLine("Column 7");
                Console.WriteLine("reserve = " + board.ColumnSeven.Reserve.AvailableCards.Count);
                PrintActive(board.ColumnSeven);
                Console.WriteLine("ClubsFoundation:");
                PrintFoundation(board.ClubsFoundation);
                Console.WriteLine("DiamondsFoundation:");
                PrintFoundation(board.DiamondsFoundation);
                Console.WriteLine("HeartsFoundation:");
                PrintFoundation(board.HeartsFoundation);
                Console.WriteLine("SpadesFoundation:");
                PrintFoundation(board.SpadesFoundation);

                Console.WriteLine("Select Card as 'column,card index'");
                Console.WriteLine("0,?: choose top card of waste pile (index doesn't matter)");
                Console.WriteLine("1-7,0-LastIndex: choose columns 1-7, then index of card in active pile");
                Console.WriteLine("8,?: Add card from stockpile to waste pile (index doesn't matter)");
                Console.WriteLine("9,0-3: Move card back from foundation to tableau. 0=Clubs, 1=Diamonds, 2=Hearts, 3=Spades");
                var choicesLine = Console.ReadLine();
                var data = choicesLine?.Split(',');
                int columnChoice;
                int cardIndexChoice;
                while (data.Length != 2)
                {
                    Console.WriteLine("Invalid Input");
                    choicesLine = Console.ReadLine();
                    data = choicesLine?.Split(',');
                }

                while (!int.TryParse(data[0], out columnChoice) || !int.TryParse(data[1], out cardIndexChoice))
                {
                    Console.WriteLine("Invalid Input");
                    choicesLine = Console.ReadLine();
                    data = choicesLine?.Split(',');
                    while (data?.Length != 2)
                    {
                        Console.WriteLine("Invalid Input");
                        choicesLine = Console.ReadLine();
                        data = choicesLine?.Split(',');
                    }
                }


                switch (columnChoice)
                {
                    case 0:
                        if (board.WasteColumn.Active.AvailableCards.Count != 0)
                            board.CheckBoard(board.WasteColumn, board.WasteColumn.Active.AvailableCards.Last());
                        break;
                    case 1:
                        if (board.ColumnOne.Active.AvailableCards.Count != 0 &&
                            Enumerable.Range(0, board.ColumnOne.Active.AvailableCards.Count).Contains(cardIndexChoice))
                            board.CheckBoard(board.ColumnOne, board.ColumnOne.Active.AvailableCards[cardIndexChoice]);
                        break;
                    case 2:
                        if (board.ColumnTwo.Active.AvailableCards.Count != 0 &&
                            Enumerable.Range(0, board.ColumnTwo.Active.AvailableCards.Count).Contains(cardIndexChoice))
                            board.CheckBoard(board.ColumnTwo, board.ColumnTwo.Active.AvailableCards[cardIndexChoice]);
                        break;
                    case 3:
                        if (board.ColumnThree.Active.AvailableCards.Count != 0 &&
                            Enumerable.Range(0, board.ColumnThree.Active.AvailableCards.Count).Contains(cardIndexChoice))
                            board.CheckBoard(board.ColumnThree,
                                board.ColumnThree.Active.AvailableCards[cardIndexChoice]);
                        break;
                    case 4:
                        if (board.ColumnFour.Active.AvailableCards.Count != 0 &&
                            Enumerable.Range(0, board.ColumnFour.Active.AvailableCards.Count).Contains(cardIndexChoice))
                            board.CheckBoard(board.ColumnFour, board.ColumnFour.Active.AvailableCards[cardIndexChoice]);
                        break;
                    case 5:
                        if (board.ColumnFive.Active.AvailableCards.Count != 0 &&
                            Enumerable.Range(0, board.ColumnFive.Active.AvailableCards.Count).Contains(cardIndexChoice))
                            board.CheckBoard(board.ColumnFive, board.ColumnFive.Active.AvailableCards[cardIndexChoice]);
                        break;
                    case 6:
                        if (board.ColumnSix.Active.AvailableCards.Count != 0 &&
                            Enumerable.Range(0, board.ColumnSix.Active.AvailableCards.Count).Contains(cardIndexChoice))
                            board.CheckBoard(board.ColumnSix, board.ColumnSix.Active.AvailableCards[cardIndexChoice]);
                        break;
                    case 7:
                        if (board.ColumnSeven.Active.AvailableCards.Count != 0 &&
                            Enumerable.Range(0, board.ColumnSeven.Active.AvailableCards.Count).Contains(cardIndexChoice))
                            board.CheckBoard(board.ColumnSeven,
                                board.ColumnSeven.Active.AvailableCards[cardIndexChoice]);
                        break;
                    case 8:
                        board.FlipFromStockpile();
                        break;
                    case 9:
                        switch (cardIndexChoice)
                        {
                            case 0:
                                if (board.ClubsFoundation.SuitFoundation.AvailableCards.Count != 0)
                                    board.MoveFromFoundation(board.ClubsFoundation);
                                break;
                            case 1:
                                if (board.DiamondsFoundation.SuitFoundation.AvailableCards.Count != 0)
                                    board.MoveFromFoundation(board.DiamondsFoundation);
                                break;
                            case 2:
                                if (board.HeartsFoundation.SuitFoundation.AvailableCards.Count != 0)
                                    board.MoveFromFoundation(board.HeartsFoundation);
                                break;
                            case 3:
                                if (board.SpadesFoundation.SuitFoundation.AvailableCards.Count != 0)
                                    board.MoveFromFoundation(board.SpadesFoundation);
                                break;
                        }
                        break;
                }
            }
        }
    }
}