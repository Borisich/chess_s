var pg = require("pg");
pg.defaults.ssl = true;
var Room = require("./room");

var database = {
  connectionString: process.env.DB_URL,
  addRoom: function(room_id, roomData, callback) {
    pg.connect(this.connectionString, function(err, client, done) {
      if (err) {
        console.log("Failed to connect");
        console.log(err);
        throw err;
      }
      console.log("Connected to adding row!!!");
      var query =
        "INSERT INTO rooms (room_id, field, moved, player1, player2, lost_figures) VALUES ('" +
        room_id +
        "', '" +
        roomData.field +
        "', '" +
        roomData.moved +
        "', '" +
        roomData.player1 +
        "', '" +
        roomData.player2 +
        "', '" +
        roomData.lostFigures +
        "');";
      client.query(query, function(err, res) {
        if (err) {
          console.log("Failed to INSERT", err);
        }
        callback();
        done();
      });
    });
  },

  updateRoom: function(room_id, roomData) {
    console.log("We want to update room...!");
    pg.connect(this.connectionString, function(err, client, done) {
      console.log("connect function called...");
      if (err) {
        console.log("Shit happened!");
        throw err;
      }
      console.log("Connected to updating row!!!");
      var query =
        "UPDATE rooms SET (field, moved, player1, player2, lost_figures) = ('" +
        roomData.field +
        "', '" +
        roomData.moved +
        "', '" +
        roomData.player1 +
        "', '" +
        roomData.player2 +
        "', '" +
        roomData.lostFigures +
        "') WHERE room_id = '" +
        room_id +
        "';";
      //client.query(query);
      client.query(query, function(err, res) {
        if (err) {
          console.log("Failed to UPDATE", err);
        }
        done();
        console.log("DONE called");
      });
      console.log("updated.");
    });
  },

  updateOpponentName: function(room_id, player, opponentName) {
    console.log(
      "We want to updateOpponentName...!",
      room_id,
      player,
      opponentName
    );
    pg.connect(this.connectionString, function(err, client, done) {
      console.log("connect function called...");
      if (err) {
        console.log("Shit happened!");
        throw err;
      }
      console.log("Connected to updating row!!!");
      var query = `UPDATE rooms SET player${player} = player${player}::jsonb || '{"opponentName": "${opponentName}"}'::jsonb WHERE room_id = '${room_id}';`;
      client.query(query, function(err, res) {
        if (err) {
          console.log("Failed to UPDATE", err);
        }
        done();
        console.log("DONE called");
      });
      console.log("updated.");
    });
  },

  searchRoom: function(room_id, rooms, callback, href) {
    var result = null;
    pg.connect(this.connectionString, function(err, client, done) {
      if (err) throw err;
      //console.log('Connected to searching row!!!');
      var query = "SELECT * FROM rooms WHERE room_id = '" + room_id + "';";
      var qr = client.query(query);
      var found = false;
      qr.on("row", function(row) {
        if (!found) {
          found = true;
          //console.log("ROOM FOUNDED IN DB. callback function...");
          result = JSON.stringify(row);
          //console.log(result);
          //console.log("callback function...");
          //console.log("row.room_id: " + row.room_id);
          var restoredRoom = new Room(href);
          restoredRoom.player1 = JSON.parse(row.player1); // || {player: null};
          restoredRoom.player2 = JSON.parse(row.player2); // || {player: null};
          restoredRoom.id = row.room_id;
          restoredRoom.inviteLink = null;
          restoredRoom.field = JSON.parse(row.field);
          restoredRoom.moved = JSON.parse(row.moved);
          restoredRoom.lostFigures = JSON.parse(row.lost_figures);
          restoredRoom.initialRoom = false;
          rooms.push(restoredRoom);
          callback(row.room_id);
        }
      });
      qr.on("end", function() {
        if (!found) {
          callback(room_id);
        }
        done();
      });
    });
    //console.log("Result of searching function:");
    //console.log(result);
    //return result;
  },

  addChatMessage: function(room_id, playerNumber, message, callback) {
    pg.connect(this.connectionString, function(err, client, done) {
      if (err) {
        console.log("Failed to connect to add message");
        console.log(err);
        throw err;
      }
      console.log("Connected to adding message!!!");
      var query = `INSERT INTO chat_messages (room_id, player, message) VALUES ('${room_id}', '${playerNumber}', '${message}');`;
      console.log(query);
      client.query(query, function(err, res) {
        if (err) {
          console.log("Failed to INSERT message", err);
        }
        callback();
        done();
      });
    });
  },

  getRoomMessages: function(room_id, callback) {
    pg.connect(this.connectionString, function(err, client, done) {
      if (err) {
        console.log("Failed to connect to get messages");
        console.log(err);
        throw err;
      }
      console.log("Connected to getting message!!!");
      var query = `SELECT * FROM chat_messages WHERE room_id = '${room_id}' ORDER BY created_at DESC;`;
      client.query(query, (err, res) => {
        if (err) {
          console.log(err.stack);
        } else {
          callback(res.rows);
        }
        done();
      });
    });
  }
};

module.exports = database;
