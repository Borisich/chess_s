const path = require("path");
var express = require("express");
var app = express();

var server = require("http").createServer(app);
var io = require("socket.io").listen(server);
io.attach(server, {
  pingInterval: 15000,
  pingTimeout: 8000
});

app.set("port", process.env.WS_PORT || 3561);

var db = require("./database.js");

server.listen(app.get("port"), function() {
  console.log("Node app is running on port", app.get("port"));
});

var Room = require("./room");

console.log("Ok, google. Server is running");

//массив комнат для одновременной игры
var rooms = [];
//с методами поиска по разным критериям
rooms.searchByPlayer = function(player) {
  for (var i = 0; i < rooms.length; i++) {
    if (rooms[i].player1 && rooms[i].player2)
      if (
        rooms[i].player1.player == player ||
        rooms[i].player2.player == player
      ) {
        return { room: rooms[i], roomNumber: i };
      }
  }
  return false;
};

setInterval(() => {
  console.log("periodic process for rooms");
  rooms.forEach(room => {
    removeRoomFromArrayIfEmpty(room);
    console.log(room.id);
  });
}, 1 * 60 * 1000);

rooms.searchById = function(id) {
  for (var i = 0; i < rooms.length; i++) {
    if (rooms[i].id == id) {
      return { room: rooms[i], roomNumber: i };
    }
  }
  return false;
};

function removeRoomFromArrayIfEmpty(room) {
  if (!room.player1.player && !room.player2.player) {
    const index = rooms.findIndex(r => r.id === room.id);
    if (index !== -1) {
      rooms.splice(index, 1);
      console.log(`room ${room.id} deleted from memory`);
    }
  }
}

//Поиск комнаты и старт игры, если комната найдена
function gameSearch(receivedRoomId, player1Join, player2Join, socket, href) {
  function gameStart(roomId) {
    console.log("gameStart! function running...");
    var room = rooms.searchById(roomId).room;
    if (room) {
      console.log(room.id);
      console.log("initialRoom: " + room.initialRoom);
      //Добавляем игрока в комнату, если его ещё нет
      if (player2Join) {
        // if ((!room.player2.player) || (room.player2.player && room.initialRoom)){
        //   room.addPlayer2(socket);
        //   room.game();
        //   room.chat();
        // }
        // else {
        //   socket.emit("room is full");
        //   socket.disconnect();
        // }
        room.addPlayer2(socket);
        room.game();
        room.chat();
        room.listenOpponentsNames();
      } else if (player1Join) {
        // if ((!room.player1.player) || (room.player1.player && room.initialRoom)){
        //   room.addPlayer1(socket);
        //   room.game();
        //   room.chat();
        // }
        // else {
        //   socket.emit("room is full");
        //   socket.disconnect();
        // }
        room.addPlayer1(socket);
        room.game();
        room.chat();
        room.listenOpponentsNames();
      } else {
        socket.emit("game not found");
        socket.disconnect();
      }
    } else {
      socket.emit("game not found");
      socket.disconnect();
      console.log("game not found from server");
    }
  }

  var room = rooms.searchById(receivedRoomId).room;
  if (!room) {
    db.searchRoom(receivedRoomId, rooms, gameStart, href);
  } else {
    gameStart(receivedRoomId);
  }
}

io.on("connection", function(socket) {
  //отправка присоединившемуся клиенту запрос: пришли свои url параметры (url?params)
  socket.emit("require url params");
  socket.on("url params", function(data) {
    
    const href = data.href.slice(0, data.href.length - (Room.prototype.getIdLength() + 2))
    
    //Проверка параметров.
    //Если есть параметры, попытаться найти комнату с таким id
    //Если их нет, то создать комнату, отправить пригласительную ссылку на подключение к игре другого клиента
    var player1Join = false;
    var player2Join = false;
    if (data.params) {
      console.log("Получены параметры от клиента: " + data.params);
      //Если длина на 1 больше чем надо - возможно кто-то хочет восстановить игру
      if (data.params.length == Room.prototype.getIdLength() + 2) {
        console.log(
          "кто-то хочет законнектиться! Последний символ: " +
            data.params.substr(5, 5)
        );
        console.log("ID комнаты: " + data.params.substr(0, 5));
        //анализируем последний символ: должен быть 1 или 2
        if (data.params.substr(5, 5) == "1") {
          player1Join = true;
          data.params = data.params.substr(0, 5);
        }
        if (data.params.substr(5, 5) == "2") {
          player2Join = true;
          data.params = data.params.substr(0, 5);
        }
      }
      //Если есть комната с таким id, то начать игру
      gameSearch(data.params, player1Join, player2Join, socket, href);
    } else {
      console.log("Создание комнаты...");
      room = new Room(data.href);
      console.log("Создана комната " + room.id);

      //создадим в базе
      console.log("TRYING TO SAVE GAME IN DATABASE...");
      db.addRoom(
        room.id,
        {
          field: JSON.stringify(room.field),
          moved: JSON.stringify(room.moved),
          player1: JSON.stringify(room.player1),
          player2: JSON.stringify(room.player2),
          lostFigures: JSON.stringify(room.lostFigures)
        },
        () => {
          console.log("DONE");

          if (!room.player1.player) {
            room.addPlayer1(socket);
          }

          rooms.push(room);
          console.log("Количество активных комнат: " + rooms.length);
          socket.emit("invite link", room.inviteLink);
          socket.on("link getted", function() {
            console.log("Клиент получил ссылку для приглашения другого игрока");
          });
        }
      );
    }
  });

  //при отключении игрока
  socket.on("disconnect", function() {
    var roomDisconnected = rooms.searchByPlayer(socket);
    if (roomDisconnected) {
      if (roomDisconnected.room.player1.player == socket) {
        roomDisconnected.room.player1.player = null;
        console.log("Отключился игрок 1");
        if (roomDisconnected.room.player2.player) {
          roomDisconnected.room.player2.player.emit("opponent status", {
            opponentOffline: true
          });
        }
      } else if (roomDisconnected.room.player2.player == socket) {
        roomDisconnected.room.player2.player = null;
        console.log("Отключился игрок 2");
        if (roomDisconnected.room.player1.player) {
          roomDisconnected.room.player1.player.emit("opponent status", {
            opponentOffline: true
          });
        }
      }
      //удаляем комнату, если её разрешено удалять
      if (
        // roomDisconnected.room.initialRoom
        !roomDisconnected.room.player1.player &&
        !roomDisconnected.room.player2.player
      ) {
        rooms.splice(roomDisconnected.roomNumber, 1);
        console.log(
          "Игрок отключился, удалена комната " + roomDisconnected.room.id
        );
        console.log("Количество активных комнат: " + rooms.length);
      }
    }
    console.log("Количество активных комнат: " + rooms.length);
  });
});
