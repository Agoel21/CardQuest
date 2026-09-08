import { Link } from 'react-router-dom';
import { makeCard, Rank, Suit } from '../engine';
import { PlayingCard } from '../ui/PlayingCard';
import './Home.css';

const FAN = [
  makeCard(Suit.Spades, Rank.Ace),
  makeCard(Suit.Hearts, Rank.King),
  makeCard(Suit.Clubs, Rank.Eight),
  makeCard(Suit.Diamonds, Rank.Queen),
];

const GAMES = [
  {
    to: '/klondike',
    name: 'Klondike',
    blurb: 'The classic patience game. Build four foundations, ace to king.',
    players: 'Solo',
  },
  {
    to: '/crazy-8s',
    name: 'Crazy 8s',
    blurb: 'Shed your hand by matching rank or suit. Eights are wild.',
    players: 'vs computer',
  },
];

export function Home() {
  return (
    <div className="home">
      <section className="home__intro">
        <div className="home__copy">
          <h1 className="home__title">Card games that run in the browser.</h1>
          <p className="home__lede">
            No install, no account, no server keeping score. Pick a game and play.
          </p>
          <Link to="/klondike" className="btn btn--primary home__cta">
            Play Klondike
          </Link>
        </div>

        <div className="home__fan" aria-hidden="true">
          {FAN.map((card, i) => (
            <div className="home__fan-card" style={{ '--i': i } as React.CSSProperties} key={i}>
              <PlayingCard card={card} />
            </div>
          ))}
        </div>
      </section>

      <section className="home__games" aria-label="Available games">
        {GAMES.map((game) => (
          <Link to={game.to} className="game-card" key={game.to}>
            <h2 className="game-card__name">{game.name}</h2>
            <p className="game-card__blurb">{game.blurb}</p>
            <span className="game-card__players">{game.players}</span>
          </Link>
        ))}
      </section>
    </div>
  );
}
