import React from "react";
import Card from "./Card";

const Waste = ({ cards }) => {
    return (
        <>
        <div className="waste">
            {cards.length > 0 ? 
            (<Card suit={cards[cards.length - 1].suit} rank={cards[cards.length - 1].rank} />) : 
            (<div className="waste-empty">Waste is empty</div>)
            }
        </div>
        <h1> THIS IS Waste</h1>
        </>
        
    );
};

export default Waste;