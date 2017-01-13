var pg = require('pg');
var database = {
  pg: require('pg'),
  wait: require('wait.for'),
  addRoom: function(room_id){
    var connectionString = "postgres://zqxkhxtvbcixhh:31d7a5de47ceb68d3f06d8bb54c66f2294a4f6f0bb2b94bc90376967e6efbb7a@ec2-54-235-204-221.compute-1.amazonaws.com:5432/da593sra73eng5"
    // var connectionString = process.env.DATABASE_URL;
    this.pg.defaults.ssl = true;
    this.pg.connect(connectionString, function(err, client) {
      if (err) throw err;
      console.log('Connected to adding row!!!');
      var query = "INSERT INTO rooms (room_id) VALUES ('" + room_id + "');"
      client.query(query);

      /*client
        .query('SELECT table_schema,table_name FROM information_schema.tables;')
        .on('row', function(row) {
          console.log(JSON.stringify(row));
        });*/
    });
  },
  updateRoom: function(room_id, roomData){
    var connectionString = "postgres://zqxkhxtvbcixhh:31d7a5de47ceb68d3f06d8bb54c66f2294a4f6f0bb2b94bc90376967e6efbb7a@ec2-54-235-204-221.compute-1.amazonaws.com:5432/da593sra73eng5"
    // var connectionString = process.env.DATABASE_URL;
    this.pg.defaults.ssl = true;
    this.pg.connect(connectionString, function(err, client) {
      if (err) throw err;
      console.log('Connected to updating row!!!');
      var query = "UPDATE rooms SET (field, moved, player1, player2) = ('" + roomData.field + "', '" + roomData.moved + "', '" + roomData.player1 + "', '" + roomData.player2 + "') WHERE room_id = '" + room_id + "';";

      client.query(query);

      /*client
        .query('SELECT table_schema,table_name FROM information_schema.tables;')
        .on('row', function(row) {
          console.log(JSON.stringify(row));
        });*/
    });
  },

  searchRoom: function(room_id){
    var connectionString = "postgres://zqxkhxtvbcixhh:31d7a5de47ceb68d3f06d8bb54c66f2294a4f6f0bb2b94bc90376967e6efbb7a@ec2-54-235-204-221.compute-1.amazonaws.com:5432/da593sra73eng5"
    // var connectionString = process.env.DATABASE_URL;
    var result = null;
    var self = this;
    pg.defaults.ssl = true;
    pg.connect(connectionString, function(err, client, done) {
      if (err) throw err;
      console.log('Connected to searching row!!!');
      var query = "SELECT * FROM rooms WHERE room_id = '" + room_id + "';";

      var qr = client.query(query);
      //var result = null;
      qr.on('row', function(row) {
        console.log("ROOM FOUNDED IN DB");
        result = JSON.stringify(row);
        console.log(result);
        //return result;
      });
      /*qr.on('end', function() {
        done();
        //return result;
      });*/
      /*client
        .query('SELECT table_schema,table_name FROM information_schema.tables;')
        .on('row', function(row) {
          console.log(JSON.stringify(row));
        });*/
    });
    console.log("Result of searching function:");
    console.log(result);
    //return result;
  }

}

module.exports = database;
