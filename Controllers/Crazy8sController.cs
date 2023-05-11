/*
 * This controller defines the classes/interfaces
 * for Crazy 8s, including the Crazy 8s board.
 */

using static CSCE361CardGames.Controllers.CardPileController;
using static CSCE361CardGames.Models.PlayerModel;
using static CSCE361CardGames.Models.CardModel;
using static CSCE361CardGames.Models.DeckModel;

namespace CSCE361CardGames.Controllers
{
    public class Crazy8sController
    {
        /*
         * Interface for the Crazy8sBoard Class.
         */
        interface ICrazy8sBoard
        {
            /*
             * Adds a player to the board, for
             * a maximum of 6 players.
             */
            void AddPlayer(Player player);

            /*
             * Distributes 5 cards from the deck
             * to each player's hand.
             */
            void DistributeCards(Deck deck);

            /*
             * Generates a Crazy 8s board, distributing
             * cards to every player and choosing the 
             * starting card.
             */
            void GenerateBoard();

            /*
             * Puts the card from the top of the stockpile
             * (index 0) into the current player's hand.
             */
            void DrawFromStockPile();

            /*
             * Removes the indicated card from the current
             * player's hand and sets it as the active card.
             * Only allows this exchange if the indicated
             * card matches the rank and/or suit of the active
             * card. Then, passes to the next player unless
             * the move emptied the current player's hand
             * (in which case a winner has been determined).
             */
            void PlayCard(Card card);

            /*
             * Upon playing an 8, the current player is prompted
             * to choose the active suit, enforcing wildcard rules.
             * 
             * THIS IS A DEBUG METHOD AND SHOULD NOT REMAIN 
             * IN THIS CONTROLLER.
             */
            Card.Suits ChooseWildcard();

            /*
             * Sets card to the active card, and returns the previous
             * active card to the bottom of the stockpile (the end of
             * the list). Does not retain any cards with a null rank, 
             * which will originate when a wildcard is played.
             */
            void SwapActiveCardTo(Card card);

            /*
             * Sets the current player to the next player in the list.
             */
            void PassTurn();

        }

        public class Crazy8sBoard : ICrazy8sBoard
        {
            public LinkedList<Player> Players = new();
            public LinkedListNode<Player>? CurrentPlayer { get; set; }
            public CardPile Stockpile = new();
            public Deck Activedeck = new();
            public Card? ActiveCard { get; set; }
            public Card.Suits ActiveSuit;

            public void AddPlayer(Player player)
            {
                if (Players.Count < 6)
                {
                    Players.AddLast(player);
                }
                else
                {
                    Console.WriteLine("Maximum of 6 players supported");
                }
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
                ActiveCard = Stockpile.TakeCardAt(0);
                while (ActiveCard.Rank.Equals(Card.Ranks.Eight))
                {
                    SwapActiveCardTo(Stockpile.TakeCardAt(0));

                }

                ActiveSuit = ActiveCard.Suit;

                CurrentPlayer = Players.First ?? null;
            }

            public void DrawFromStockPile()
            {
                if (Stockpile.availableCards.Count > 0)
                {
                    CurrentPlayer?.Value.Hand.AddCard(Stockpile.TakeCardAt(0));
                }
                else
                {
                    Console.WriteLine("Stockpile empty! Shuffling cards."); //debug statement
                    Activedeck.ShuffleDeck();
                    foreach (Card c in Activedeck.deckOfCards)
                    {
                        Stockpile.AddCard(c);
                    }
                    Activedeck.deckOfCards.Clear();
                    PassTurn();
                }

            }
            public void PlayCard(Card card)
            {
                if (ActiveCard != null &&
                    (!card.Rank.Equals(Card.Ranks.Eight) &&
                    (card.Rank.Equals(ActiveCard.Rank) || card.Suit.Equals(ActiveSuit))))
                {
                    CurrentPlayer?.Value.Hand.RemoveCard(card);
                    SwapActiveCardTo(card);
                    ActiveSuit = ActiveCard.Suit;
                    if (CurrentPlayer != null && CurrentPlayer.Value.Hand.availableCards.Count > 0)
                    {
                        PassTurn();
                    }
                }
                else if (card.Rank.Equals(Card.Ranks.Eight))
                {
                    CurrentPlayer?.Value.Hand.RemoveCard(card);
                    SwapActiveCardTo(card);
                    //ActiveSuit = ChooseWildcard();
                    //if (CurrentPlayer != null && CurrentPlayer.Value.Hand.availableCards.Count > 0)
                    //{
                    //    PassTurn();
                    //}
                }
            }

            /*
             * Once the front end is implemented, this method MUST BE RELOCATED TO THE VIEW,
             * as it will take player input directly.
             * 
             * This is also UNTESTED as of right now, since we don't have the wildcard logic in yet.
             */
            public Card.Suits ChooseWildcard()
            {
                char choice = ' ';
                while (choice != '1' && choice != '2' && choice != '3' && choice != '4')
                {
                    Console.WriteLine("Choose a wildcard suit: \n 1) Clubs \n 2) Diamonds \n 3) Hearts \n 4) Spades");
                    choice = (char)Console.ReadKey().Key;
                }
                PassTurn();
                return (Card.Suits)(choice - 48);
            }

            public void SwapActiveCardTo(Card card)
            {
                if (ActiveCard != null)
                {
                    if (!ActiveCard.Rank.Equals(null))
                    {
                        Activedeck.AddToDeck(ActiveCard);
                    }
                    ActiveCard = card;
                }

            }

            public void PassTurn()
            {
                //Artificially circular linked list methodology adapted from https://stackoverflow.com/a/7332084
                CurrentPlayer = CurrentPlayer?.Next ?? CurrentPlayer?.List?.First;

            }
        }
    }
}