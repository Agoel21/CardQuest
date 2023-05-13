import React from "react";
import "./Card.css"

const Card = ({ suit, rank, index }) => {
    const color = suit === "D" || suit === "H" ? "red" : "black";

    return (
        <div className={`card ${color}`}>
            <div>{rank}</div>
            <div>{suit}</div>
            <div>{index}</div>
        </div>
    );
};

export default Card;
