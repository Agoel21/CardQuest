import React from "react";
import Card from "./Card";

const Foundation = ({ suit, cards }) => {
    return (
        <>
        <div className={`foundation ${suit}`}>
            <div className="foundation-suit">{suit}</div>
            {cards.map((card, index) => (
                <Card key={index} suit={card.suit} rank={card.rank} />
            ))}
        </div>
        <h1> This is foundation</h1>
        </>
    );
};

export default Foundation;

