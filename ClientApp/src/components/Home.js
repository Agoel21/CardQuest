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
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Playing_card_heart_A.svg/200px-Playing_card_heart_A.svg.png?20070326034343"
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
                      <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Playing_card_heart_A.svg/200px-Playing_card_heart_A.svg.png?20070326034343" alt="Test Image" />
                  </div>
              </Draggable>

              <Droppable types={['foo']} onDrop={this.handleDrop}>
                  <div>
                      <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Playing_card_heart_A.svg/200px-Playing_card_heart_A.svg.png?20070326034343" alt="Test Image" />
                  </div>
              </Droppable> */}
      </div>
    );
  }
}
