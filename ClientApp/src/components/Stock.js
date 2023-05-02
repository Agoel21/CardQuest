import React from "react";
import Card from "./ClientApp/src/components/Card";

const Stock = ({ cards, onDraw }) => {
    return (
        <div className="stock" onClick={onDraw}>
            {cards.length > 0 ? (
                <Card suit="back" rank="back" />
            ) : (
                    <div className="stock-empty">Stock is empty</div>
                )}
        </div>
    );
};

export default Stock;

