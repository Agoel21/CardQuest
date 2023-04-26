using System;
using static CSCE361CardGames.Controllers.DeckController;
using static CSCE361CardGames.Controllers.DeckController.Card;
using static CSCE361CardGames.Controllers.SetupController;

namespace CSCE361CardGames.Controllers
{
    public class SolitaireController
    {
        interface ITableauColumn
        {
            public void BuildColumn(Deck deck, int amountForReserve);
            //TODO: enforce alternating color/descending numbers here
        }

        public class TableauColumn : ITableauColumn
        {
            public CardPile reserve = new();
            public CardPile active = new();

            public void BuildColumn(Deck deck, int amountForReserve)
            {
                reserve.GrabCards(deck, amountForReserve);
                active.GrabCards(deck, 1);
            }
        }

        interface IFoundation
        {
            //TODO: enforce numeric stacking rules here, only allow cards of the assigned suit to be added
            
        }

        public class Foundation : IFoundation
	    {
            public Suits suit;
            public CardPile suitFoundation = new();

            public Foundation(Suits suit)
            {
                this.suit = suit;
            }
        }

        interface ISolitaireBoard
        {
            public void GenerateBoard();
        }

        public class SolitaireBoard : ISolitaireBoard
        {
            public Foundation ClubsFoundation = new(Suits.Clubs);
            public Foundation DiamondsFoundation = new(Suits.Diamonds);
            public Foundation HeartsFoundation = new(Suits.Hearts);
            public Foundation SpadesFoundation = new(Suits.Spades);

            public TableauColumn columnOne = new();
            public TableauColumn columnTwo = new();
            public TableauColumn columnThree = new();
            public TableauColumn columnFour = new();
            public TableauColumn columnFive = new();
            public TableauColumn columnSix = new();
            public TableauColumn columnSeven = new();

            public CardPile stockpile = new();


            public void GenerateBoard()
            {
                var deck = new Deck();
                deck.FillDeck();

                columnOne.BuildColumn(deck, 0);
                columnTwo.BuildColumn(deck, 1);
                columnThree.BuildColumn(deck, 2);
                columnFour.BuildColumn(deck, 3);
                columnFive.BuildColumn(deck, 4);
                columnSix.BuildColumn(deck, 5);
                columnSeven.BuildColumn(deck, 6);

                stockpile.SetCards(deck.deckOfCards);


            }
        }
    }
}
