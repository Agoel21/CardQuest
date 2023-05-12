import React, { Component } from 'react';

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
              
      </div>
    );
  }
}
