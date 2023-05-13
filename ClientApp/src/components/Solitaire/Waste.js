import React from "react";
import Card from "./../Card";
import "./Solitaire.css";

const Waste = ({ cards }) => {
    return (
        <>
        <div className="card">
            {cards.length > 0 ? 
            (<Card 
                suit={cards[cards.length - 1].suit} 
                rank={cards[cards.length - 1].rank} />) : 
            (<div className="stock-waste"></div>)
            }
        </div>
        <h1> THIS IS Waste</h1>
        </>
        
    );
};

export default Waste;