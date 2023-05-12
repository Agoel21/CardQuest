import React from "react";
import Card from "./../Card";
import "./Solitaire.css";

const Stock = ({ cards, onDraw }) => {
    return (
        <div className="stock" onClick={onDraw}>
            {cards.length > 0 ? 
            (<Card suit="Back of Card" rank="Back of Card" />) : 
            (<div className="stock-waste">Stock is empty</div>)}
        </div>
    );
};

export default Stock;

