import React from "react";
import Card from "./../Card";

const Tableau = ({ cards }) => {
    return (
        <>
        <div className="tableau">
            {cards.map((card, index) => (
                <Card key={index} suit={card.suit} rank={card.rank} />
            ))}
        </div>
        <h1> THIS IS Tableau </h1>
        </>
    );
};

export default Tableau;
