import React, { useState, useEffect } from "react";
// import Card from "./ClientApp/src/components/Card";
// import Tableau from "./ClientApp/src/components/Tableau";
// import Foundation from "./ClientApp/src/components/Foundation";
// import Stock from "./ClientApp/src/components/Stock";

const Board = () => {
    const [deck, setDeck] = useState([]);
    const [tableau, setTableau] = useState([[], [], [], [], [], [], [] ]);
    const [foundations, setFoundations] = useState({
        D: [],
        C: [],
        H: [],
        S: [],
    });
    const [stock, setStock] = useState([]);
    const [waste, setWaste] = useState([]);
    
    function shuffle(array) {
        let currentIndex = array.length;
        let temporaryValue, randomIndex;
        while (0 !== currentIndex) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }
        return array;
    }

    function dealCards() {
        let shuffledDeck = shuffle(deck);
        let newTableau = [[], [], [], [], [], [], []];
        for (let i = 0; i < 7; i++) {
            for (let j = i; j < 7; j++) {
                let card = shuffledDeck.pop();
                if (j === i) {
                    card.isFaceUp = true;
                }
                newTableau[j].push(card);
            }
        }
        setTableau(newTableau);
        setStock(shuffledDeck);
    }

    function drawFromStock() {
        if (stock.length === 0) {
            setStock([...waste].reverse());
            setWaste([]);
        } else {
            let newWaste = [...waste];
            newWaste.push(stock.pop());
            setWaste(newWaste);
            setStock([...stock]);
        }
    }

    // useEffect(() => {
    //     setDeck(createDeck()); //Todo in controller
    //     dealCards();
    // }, []);

    return (
        <div className="solitaire">
            <div className="tableau">
                {[0, 1, 2, 3, 4, 5, 6].map((index) => (
                    <div></div>
                    // <Tableau key={index} cards={tableau[index]} />
                ))}
            </div>
            <div className="foundations">
                {["D", "C", "H", "S"].map((suit) => (
                    // <Foundation key={suit} suit={suit} cards={foundations[suit]} />
                    <div></div>

                ))}
            </div>
            {/* <Stock drawCard={drawFromStock} cards={stock} waste={waste} /> */}
        </div>
    );
};

export default Board;
