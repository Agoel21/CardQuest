/*
 * This controller is meant to handle the 
 * connection to the database.
 */

using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using Microsoft.Extensions.Configuration;
using static CSCE361CardGames.Models.CardModel;
using static CSCE361CardGames.Models.DeckModel;

namespace CSCE361CardGames.Controllers
{

    /*
     * This class sets up the database
     * connection and includes the Post()
     * method which can be used to check if the 
     * connection was successful.
     */
    [Route("[controller]")]
    [ApiController]
    public class GameController : ControllerBase
    {
        private readonly IConfiguration _configuration;

        public GameController(IConfiguration configuration)
        {
            _configuration = configuration;
        }
        [HttpGet]
        public IEnumerable<Card> Get()
        {

            Deck deck = new Deck();
            deck.FillDeck();
            deck.ShuffleDeck();

            return deck.DeckOfCards;
        }

        [HttpPost]
        public string Post()
        {
            string connectionString = _configuration.GetConnectionString("DefaultConnection");

            using (SqlConnection connection = new SqlConnection(connectionString))
            {
                string query = "SELECT * FROM [dbo].[Games]";

                using (SqlCommand command = new SqlCommand(query, connection))
                {
                    connection.Open();
                }
            }
            return "Post";
        }

        public void WriteGameToDatabase(DateTime startTime, DateTime endTime, string winner)
        {
            // if winner matches some injection attack preventing REGEX
            string connectionString = _configuration.GetConnectionString("DefaultConnection");

            using (SqlConnection connection = new SqlConnection(connectionString))
            {
                SqlCommand command = new("INSERT into [dbo].[Games](StartTime, EndTime, Winner) values (@startTime, @endTime, @winner)", connection);
                command.Parameters["@startTime"].Value = startTime;
                command.Parameters["@startTime"].Value = endTime;
                command.Parameters["@startTime"].Value = winner;

                using (command)
                {
                    connection.Open();
                    command.BeginExecuteNonQuery();
                }
            }
        }

        /*
        [HttpPost]
        public string Post([FromBody] LoginCredentials credentials)
        {
            string username = credentials.Username;
            string password = credentials.Password;

            return username + " " + password;
        }
        */

        /*
        PUT: api/Game/{id
        }
        [HttpPut("{id}")]
        public IActionResult UpdateGame(int id, [FromBody] Game game)
        {
            // Construct the connection string using the "DefaultConnection" configuration value
            string connectionString = _configuration.GetConnectionString("DefaultConnection")!;


            using (SqlConnection connection = new SqlConnection(connectionString))
            {
                string query = "UPDATE games SET StartTime = @StartTime, EndTime = @EndTime, Winner = @Winner WHERE Id = @Id";

                using (SqlCommand command = new SqlCommand(query, connection))
                {
                    command.Parameters.AddWithValue("@Id", id);
                    command.Parameters.AddWithValue("@StartTime", game.StartTime);
                    command.Parameters.AddWithValue("@EndTime", game.EndTime);
                    command.Parameters.AddWithValue("@Winner", game.Winner);

                    connection.Open();

                    int rowsAffected = command.ExecuteNonQuery();

                    if (rowsAffected > 0)
                    {
                        // Update successful
                        return Ok();
                    }
                    else
                    {
                        // No records were updated (game with the specified id not found)
                        return NotFound();
                    }
                }
            }
        }
        */
    }
    

    public class Game
    {
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public string? Winner { get; set; }
    }
}