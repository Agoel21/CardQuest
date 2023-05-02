import React from "react";
import Card from "./ClientApp/src/components/Card";

const Tableau = ({ cards }) => {
    return (
        <div className="tableau">
            {cards.map((card, index) => (
                <Card key={index} suit={card.suit} rank={card.rank} />
            ))}
        </div>
    );
};

export default Tableau;
