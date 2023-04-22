using System;
using ConsoleApp1.Models.DeckController; //TODO: also fix this namespace
using CSCE361CardGames.Controllers.SetupController;

namespace CSCE361CardGames.Controllers
{
    public class SolitaireController
    {
        interface ITableauColumn
        {
            public void buildColumn(Deck deck, int amountForReserve);
            //TODO: enforce alternating color/descending numbers here
        }

        public class TableauColumn : ITableauColumn
        {
            public CardPile reserve;
            public CardPile active;

            public void buildColumn(Deck deck, int amountForReserve)
            {
                reserve.grabCards(deck, amountForReserve);
                active.grabCards(deck, 1);
            }
        }

        interface IFoundation
        {
            //TODO: enforce numeric stacking rules here, only allow cards of the assigned suit to be added
        }

        public class Foundation(Card.Suits suit) : IFoundation
	    {
            public Card.Suits suit = suit;
		    public CardPile suitFoundation;
        }

        interface ISolitaireBoard
        {
            public void generateBoard();
        }

        public class SolitaireBoard : ISolitaireBoard
        {
            public Foundation clubsFoundation(Clubs);
            public Foundation diamondsFoundation(Diamonds);
            public Foundation heartsFoundation(Hearts);
            public Foundation spadesFoundation(Spades);

            public TableauColumn columnOne;
            public TableauColumn columnTwo;
            public TableauColumn columnThree;
            public TableauColumn columnFour;
            public TableauColumn columnFive;
            public TableauColumn columnSix;
            public TableauColumn columnSeven;

            public CardPile stockpile;


            public void generateBoard()
            {
                var deck = new Deck();
                deck.fillDeck();

                columnOne.buildColumn(deck, 0);
                columnTwo.buildColumn(deck, 1);
                columnThree.buildColumn(deck, 2);
                columnFour.buildColumn(deck, 3);
                columnFive.buildColumn(deck, 4);
                columnSix.buildColumn(deck, 5);
                columnSeven.buildColumn(deck, 6);

                stockpile.setCards(deck.deckOfCards);


            }
        }
    }
}
