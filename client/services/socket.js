var io = require('socket.io-client');

const locally = false;

if (locally){
  var socket = io('http://localhost:3561');
} else {
  // var socket = io('http://chs-server.herokuapp.com');
//   var socket = io('http://185.228.234.10');
    var socket = io('http://monkk.ru:3561');

}

module.exports = socket;
