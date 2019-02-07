var pg = require('pg');
pg.defaults.ssl = true;
var Room = require('./room');

var database = {
  // connectionString: "postgres://zqxkhxtvbcixhh:31d7a5de47ceb68d3f06d8bb54c66f2294a4f6f0bb2b94bc90376967e6efbb7a@ec2-54-235-204-221.compute-1.amazonaws.com:5432/da593sra73eng5",
  connectionString: "postgres://ijcxjhryrjtdea:943ca728598acba6554c74e137295f196096780b32f7067ab0a825a8b9ec5e0c@ec2-54-243-184-111.compute-1.amazonaws.com:5432/d3jc5i1p0kjj1v",
  addRoom: function(room_id, roomData){
    pg.connect(this.connectionString, function(err, client) {
      if (err) {
        console.log('Failed to connect');
        console.log(err);
        throw err;
      }
      console.log('Connected to adding row!!!');
      var query = "INSERT INTO rooms (room_id, field, moved, player1, player2, lost_figures) VALUES ('" + room_id + "', '" + roomData.field + "', '" + roomData.moved + "', '" + roomData.player1 + "', '" + roomData.player2 +"', '" + roomData.lostFigures +"');"
      client.query(query, function(err, res) {
        if (err) {
          console.log('Failed to INSERT', err);
        }
        done();
      });
    });
  },

  updateRoom: function(room_id, roomData){
    console.log('We want to update room...!');
    pg.connect(this.connectionString, function(err, client, done) {
      console.log('connect function called...');
      if (err) {
        console.log('Shit happened!');
        throw err;
      }
      console.log('Connected to updating row!!!');
      var query = "UPDATE rooms SET (field, moved, player1, player2, lost_figures) = ('" + roomData.field + "', '" + roomData.moved + "', '" + roomData.player1 + "', '" + roomData.player2 + "', '" + roomData.lostFigures +"') WHERE room_id = '" + room_id + "';";
      //client.query(query);
      client.query(query, function(err,res) {
        if (err) {
          console.log('Failed to UPDATE', err);
        }
        done();
        console.log('DONE called');
      });
      console.log('updated.');
    });
  },

  searchRoom: function(room_id, rooms, callback){
    var result = null;
    pg.connect(this.connectionString, function(err, client, done) {
      if (err) throw err;
      //console.log('Connected to searching row!!!');
      var query = "SELECT * FROM rooms WHERE room_id = '" + room_id + "';";
      var qr = client.query(query);
      var found = false;
      qr.on('row', function(row) {
        if (!found){
          found = true;
          //console.log("ROOM FOUNDED IN DB. callback function...");
          result = JSON.stringify(row);
          //console.log(result);
          //console.log("callback function...");
          //console.log("row.room_id: " + row.room_id);
          var restoredRoom = new Room();
          restoredRoom.player1 = JSON.parse(row.player1);// || {player: null};
          restoredRoom.player2 = JSON.parse(row.player2);// || {player: null};
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
      qr.on('end', function() {
        if (!found){
          callback(room_id);
        }
      });
    });
    //console.log("Result of searching function:");
    //console.log(result);
    //return result;
  }
}

module.exports = database;
