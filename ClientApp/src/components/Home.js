import React, { Component } from 'react';
import { Draggable, Droppable } from 'react-drag-and-drop';

export class Home extends Component {
    static displayName = Home.name;

  // Adapted from https://www.makeuseof.com/react-drag-and-drop-components/ 

  render() {

      return (
      <div>
        <h1>Solitaire</h1>
            <p>Welcome to solitaire!</p>
            <p></p>
              <img src={require('../assets/ace_of_hearts.png')}
                  alt="Test Image"
                  /*
                  draggable
                  onDragStart={this.handleDragStart}
                  onDrag={this.handleDrag}
                  onDragEnd={this.handleDragEnd}
                  //Drag me
                  */
              />
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
