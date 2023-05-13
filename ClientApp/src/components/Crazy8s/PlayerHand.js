import React from 'react';
import Card from '../Card';

export function PlayerHand({ player, cards, isCurrentPlayer, playCard, drawCard }) {
    return ( 
    <div>
     <h2>Player {player.player}</h2>
        <div>
            {player.cards.map((card, index) => (
            <Card key={index} card={card} />
        ))}
        </div>
     </div>
       
    );
}