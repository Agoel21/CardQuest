import React, { useState } from 'react';
import { Container, Row, Col } from "react-bootstrap";
import "./Crazy8s.css";
import { PlayerHand } from './PlayerHand';
import { TableCard } from './TableCard';

    export default function Crazy8s(){

      const players = [
        { player: 1, cards: [], isCurrentPlayer: true },
        { player: 2, cards: [], isCurrentPlayer: false },
        { player: 3, cards: [], isCurrentPlayer: false },
        { player: 4, cards: [], isCurrentPlayer: false },
        { player: 5, cards: [], isCurrentPlayer: false },
        { player: 6, cards: [], isCurrentPlayer: false },
      ];
      const [playerHands, setPlayerHands] = useState(players);
      const [tableCard, setTableCard] = useState(null);

      function playCard(playerIndex, cardIndex) {
        // TODO; update state to remove the card from the player's hand and add it to the table
      }
    
      function drawCard(playerIndex) {
        // TODO; update state to add a card to the player's hand from the deck
      }

      return (
        <>
        <Container>
          <Row style={{ height: '500px' }} className='row1'>
            <Col>
              <Row style={{ height: '250px' }} >
                <Col>
                  <div className='reserve'>
                    <div className="reserve-close"></div>
                  </div>
                </Col>
                <Col>
                  <div className='reserve'>
                    <div className="reserve-waste"></div>
                  </div>
                </Col>
              </Row>
              <Row>PLAYER 1</Row>
              <Row style={{ height: '250px' }} >
                <Col><img src={require('../../assets/ace_of_hearts.png')} alt="1" width='100px' height="150px"/></Col>
                <Col><img src={require('../../assets/ace_of_clubs.png')} alt="2" width='100px' height="150px"/></Col>           
                <Col><img src={require('../../assets/ace_of_diamonds.png')} alt="3" width='100px' height="150px"/></Col>
                <Col><img src={require('../../assets/ace_of_spades.png')} alt="4" width='100px' height="150px"/></Col>
                <Col><img src={require('../../assets/ace_of_hearts.png')} alt="5" width='100px' height="150px"/></Col>
              </Row>
            </Col>
          </Row>
          <Row style={{ height: '200px' }} className='row2 d-flex align-items-center justify-content-center'>
            <Col><button className="btn btn-primary btn-lg new-button">Restart</button></Col>
            <Col><button className="btn btn-primary btn-lg new-button">Rules</button></Col>
            <Col><button className="btn btn-primary btn-lg new-button">Draw</button></Col>
          </Row>
        </Container>
       </>
        );
    };
// export class Crazy8s extends Component {
//   static displayName = Crazy8s.name;

//   constructor(props) {
//     super(props);
//     this.state = { currentCount: 0 };
//     this.incrementCounter = this.incrementCounter.bind(this);
//   }

//   incrementCounter() {
//     this.setState({
//       currentCount: this.state.currentCount + 1
//     });
//   }

//   render() {
//     return (
//       <div>
//         <h1>Counter</h1>

//         <p>This is a simple example of a React component.</p>

//         <p aria-live="polite">Current count: <strong>{this.state.currentCount}</strong></p>

//         <button className="btn btn-primary" onClick={this.incrementCounter}>Increment</button>
//       </div>
//     );
//   }
// }
