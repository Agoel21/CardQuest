import React from "react";


const Card = ({ suit, rank }) => {
    const color = suit === "D" || suit === "H" ? "red" : "black";

    return (
        <div className={`card ${color}`}>
            <div className="card-rank">{rank}</div>
            <div className="card-suit">{suit}</div>
        </div>
    );
};

export default Card;
