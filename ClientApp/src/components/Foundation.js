import React from "react";
import Card from "./ClientApp/src/components/Card";

const Foundation = ({ suit, cards }) => {
    return (
        <div className={`foundation ${suit}`}>
            <div className="foundation-suit">{suit}</div>
            {cards.map((card, index) => (
                <Card key={index} suit={card.suit} rank={card.rank} />
            ))}
        </div>
    );
};

export default Foundation;

