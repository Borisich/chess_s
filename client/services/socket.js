var io = require('socket.io-client');

const locally = false;

if (locally){
  var socket = io('http://localhost');
} else {
  // var socket = io('http://chs-server.herokuapp.com');
  var socket = io('http://185.228.234.10');

}

module.exports = socket;
