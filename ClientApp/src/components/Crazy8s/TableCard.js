import React from 'react';
import Card from '../Card';

export function TableCard({ card }) {
  return (
    <div>
      <h2>Table Card</h2>
      <Card card={card} />
      <p>
        {card.rank !== '8' && `Must match ${card.rank} or ${card.suit}`}
        {card.rank === '8' && 'Choose a suit'}
      </p>
    </div>
  );
}
