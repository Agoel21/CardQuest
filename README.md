# CSCE361-Capstone-Project-Group8

## Notes For Grader
To play the card games the user must configure their startup project to be the CSCE361CardGamesConsole project. Running CSCE361CardGames will take the user to a webpage where nothing is displayed. 
## Overview
This project contains code that creates two card games, those being Solitaire and Crazy8s that can be played in the console.
The project mainly consists of C# and Javascript, with a SQL database acting as the backend. The project uses the Model-View-Controller 
architecture pattern. 
## Frontend
The front-end portion of the project is built with Javascript and Javascript's React library. There are boards for the card games as
well as placeholders for where card images would be in an actual game. Currently, the front-end is not functional and has no way to access
the models or controllers. All of the code for the front-end is located in the ClientApp folder, with most of the card game components being located in ClientApp/src/components.
## Database
The project also contains a database connection made in one of the controllers named GameController. The database can be connected to the project,
but it currently serves no purpose in the functionality of the card games. Currently the database is only functional on one team member's local SQL server. As a result, though other users can still run games as normal, their data will not be written into the database.
## UnitTests
The unit tests for the various methods within the controllers are found under the TestProject2 folder. The tests are separated into their own test files for each respective controller.

