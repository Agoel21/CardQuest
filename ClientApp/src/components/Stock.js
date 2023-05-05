import React from "react";
import Card from "./Card";

const Stock = ({ cards, onDraw }) => {
    return (
        <div className="stock" onClick={onDraw}>
            {cards.length > 0 ? (
                <Card suit="Back of Card" rank="Back of Card" />
            ) : (
                    <div className="stock-empty">Stock is empty</div>
                )}
        </div>
    );
};

export default Stock;

