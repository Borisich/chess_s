const locally = true;


var express = require('express');
var app = express();

var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

app.set('port', (process.env.PORT || 80));
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://mirt.spb.ru');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

app.get('/', function(request, response) {
  response.send('Hello man');
});


server.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

var Room = require('./room');

console.log('Ok, google. Server is running');

//массив комнат для одновременной игры
var rooms = [];
//с методами поиска по разным критериям
rooms.searchByPlayer = function(player){
    for (var i = 0; i< rooms.length; i++){
        if ((rooms[i].player1.player == player)||(rooms[i].player2.player == player)){
            return { room: rooms[i], roomNumber: i};
        }
    }
    return false;
};
rooms.searchById = function(id){
    for (var i = 0; i< rooms.length; i++){
        if (rooms[i].id== id){
            return { room: rooms[i], roomNumber: i};
        }
    }
    return false;
};

io.on('connection', function (socket) {
    //отправка присоединившемуся клиенту запрос: пришли свои url параметры (url?params)
    socket.emit('require url params');
    socket.on('url params', function (data) {
        //Проверка параметров.
        //Если есть параметры, попытаться найти комнату с таким id
        //Если их нет, то создать комнату, отправить пригласительную ссылку на подключение к игре другого клиента
        if (data.params){
            console.log("Получены параметры от клиента: " + data.params);
            //Если длина на 1 больше чем надо - возможно кто-то хочет восстановить игру
            if (data.params.length == Room.prototype.getIdLength()+2){
              console.log("кто-то хочет законнектиться! Последний символ: " + data.params.substr(5,5))
              console.log("ID комнаты: " + data.params.substr(0,5))
              //анализируем последний символ: должен быть 1 или 2
              if (data.params.substr(5,5) == "1"){
                var player1Join = true;
                data.params = data.params.substr(0,5);
              }
              if (data.params.substr(5,5) == "2"){
                var player2Join = true;
                data.params = data.params.substr(0,5);
              }
            }
            //Если есть комната с таким id, то начать игру
            var room = rooms.searchById(data.params).room;
            if (room)
            {
                console.log("Комната существует! Игра найдена");
                //Добавляем игрока в комнату, если его ещё нет
                if (!room.player2.player && !player2Join && !player1Join) {
                    room.addPlayer2(socket);
                    //запускаем игру и чат
                    room.game();
                    room.chat();
                }
                else if (!room.player2.player && player2Join){
                  room.addPlayer2(socket);
                  room.game();
                  room.chat();
                  player2Join = false;
                }
                else if (!room.player1.player && player1Join){
                  room.addPlayer1(socket);
                  room.game();
                  room.chat();
                  player1Join = false;
                }
                else
                {
                    socket.emit("room is full");
                }
            }
            else {
                socket.emit("game not found");
            }
        }
        else{
            console.log("Создание комнаты...");
            room = new Room(data.href);
            console.log("Создана комната "+room.id);

            if (!room.player1.player) {
              room.addPlayer1(socket);
            }

            rooms.push(room);
            console.log("Количество активных комнат: "+rooms.length);
            socket.emit('invite link', room.inviteLink);
            socket.on('link getted', function(){
               console.log("Клиент получил ссылку для приглашения другого игрока");
            });
        }
    });
    //при отключении игрока игра завершается
    socket.on('disconnect', function () {

        var roomForDelete = rooms.searchByPlayer(socket);
        if (roomForDelete) {
          if (roomForDelete.room.player1.player == socket){
            roomForDelete.room.player1.player = null;
            console.log("Отключился игрок 1");
            //roomForDelete.room.player2.player ? roomForDelete.room.sendGameStatus(roomForDelete.room.player2.player) : {};

            if (roomForDelete.room.player2.player) roomForDelete.room.player2.player.emit('opponent status', {opponentOffline: true});
          }
          else{
            roomForDelete.room.player2.player = null;
            console.log("Отключился игрок 2");
            //roomForDelete.room.player1.player ? roomForDelete.room.sendGameStatus(roomForDelete.room.player1.player) : {};
            if (roomForDelete.room.player1.player) roomForDelete.room.player1.player.emit('opponent status', {opponentOffline: true});
          }
          //удаляем комнату, если её разрешено удалять
          if (roomForDelete.room.canDelete){
            rooms.splice(roomForDelete.roomNumber, 1);
            console.log("Игрок отключился, удалена комната " + roomForDelete.room.id);
            console.log("Количество активных комнат: "+rooms.length);
          }
        }

        /*if (roomForDelete) {
            rooms.splice(roomForDelete.roomNumber, 1);
            console.log("Игрок отключился, удалена комната " + roomForDelete.room.id);
            roomForDelete.room.endGame("disconnect");
        }
        else{
            console.log("Игрок отключился, его комнаты уже не существует");
        }*/

        console.log("Количество активных комнат: "+rooms.length);
    });
});
