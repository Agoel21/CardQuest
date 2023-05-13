import React, { Component } from 'react';
import { Container, Row, Col } from "react-bootstrap";
import "./Home.css"

export class Home extends Component {
    static displayName = Home.name;

  render() {

      return (
      <div class="home">
          <h1>Welcome to Card Games</h1>
              {/* <img src={require('../assets/ace_of_hearts.png')}
                  alt="Test Image"
                  
                  draggable
                  onDragStart={this.handleDragStart}
                  onDrag={this.handleDrag}
                  onDragEnd={this.handleDragEnd}
                
                
              /> */}
              {/* <Draggable type="foo" data="bar">
                  <div>
                      <img src={require('../assets/ace_of_clubs.png')} alt="Test Image" />
                  </div>
              </Draggable>

              <Droppable types={['foo']} onDrop={this.handleDrop}>
                  <div>
                      <img src={require('../assets/king_of_spades.png')} alt="Test Image" />
                  </div>
              </Droppable> */}
      </div>
    );
  }
}
