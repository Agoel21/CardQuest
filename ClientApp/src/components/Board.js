import React, { useState, useEffect } from "react";
import Card from "./ClientApp/src/components/Card";
import Tableau from "./ClientApp/src/components/Tableau";
import Foundation from "./ClientApp/src/components/Foundation";
import Stock from "./ClientApp/src/components/Stock";

const Board = () => {
    const [deck, setDeck] = useState([]);
    const [tableau, setTableau] = useState([[], [], [], [], [], [], [] ]);
    const [foundations, setFoundations] = useState({
        D: [],
        C: [],
        H: [],
        S: [],
    });
    
    return (
        <div className="solitaire">
            <div className="tableau">
                {[0, 1, 2, 3, 4, 5, 6].map((index) => (
                    <Tableau key={index} cards={tableau[index]} />
                ))}
            </div>
            <div className="foundations">
                {["D", "C", "H", "S"].map((suit) => (
                    <Foundation key={suit} suit={suit} cards={foundations[suit]} />
                ))}
            </div>
          
        </div>
    );
};

export default Board;
