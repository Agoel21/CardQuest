import "./Solitaire.css";
import { useEffect, useState } from "react";
import Card from "../Card"
import Waste from "./Waste"
import Tableau from "./Tableau"
import Stock from "./Stock"
import Foundation from "./Foundation";
import { Container, Row, Col } from "react-bootstrap";


function Solitaire () {
   
    const [deck, setDeck] = useState([]);
       
      function createDeck(){
          const rank = [
            "ace",
            "two",
            "three",
            "four",
            "five",
            "six",
            "seven",
            "eight",
            "nine",
            "ten",
            "jack",
            "queen",
            "king",
          ];
          const suit = ["diamonds", "clubs", "hearts", "spades"];
          let deck = [];
          for (let i = 0; i < 13; i++) {
            for (let j = 0; j < 4; j++) {
              deck.push({ rank: rank[i], suit: suit[j] });
            }
          }
          return deck;
        };

        useEffect(() => { 
            const newDeck = createDeck(); 
            setDeck(newDeck) 
        }, []);
            

  
      return (
        <> 
    
        <Container fluid>
        <Row>
        <Col xs={2} md={1} className='column'>
            <div className='stock'> 
                {/* <div><img src= {require("../../assets/back.png")} alt="Stock" height= "150 px" width= "100 px"/></div>
                <div>Waste Pile</div> */}
                <div className="stock-back"></div>
                <div className="stock-waste"></div>
          </div>
          <div><button className="btn btn-primary">Restart</button></div>
        </Col>
        <Col xs={12} md={6} className='middle-column'>
            <Row>
                <Col xs={2} md={1} className='tableau'>
                    <button onClick={()=>console.log(deck)}>Click</button>
                {/* <img src={require(`../../assets/${deck[0].rank}_of_${deck[0].suit}.png`)} alt="Card0"/> */}
                </Col>
                <Col xs={2} md={1} className='tableau'>
                </Col>
                <Col xs={2} md={1} className='tableau'>
                </Col>
                <Col xs={2} md={1} className='tableau'>
                </Col>
                <Col xs={2} md={1} className='tableau'>
                </Col>
                <Col xs={2} md={1} className='tableau'>
                </Col>
                <Col xs={2} md={1} className='tableau'>
                </Col>
            </Row>
        </Col>
        <Col xs={2} md={1} className='column'>
            <div className="foundation">
                <div className="foundation-heart"></div>
                <div className="foundation-spade"></div>
                <div className="foundation-diamond"></div>
                <div className="foundation-club"></div>
            </div>
        </Col>
      </Row>
        </Container>
          {/* <div>
            <Card />
            HIIIIII......
          </div>
          <div>
            <Waste cards={deck} />
          </div>
          <div>
            <Tableau cards={deck} />
          </div>
          <div>
            <Foundation suit={selectedSuit} cards={deck} />
          </div>
          <div> <Stock cards={deck} onDraw={this.handleDrawCard}/> </div> */}
        </>
      );
    };

    export default Solitaire;