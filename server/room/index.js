//Комната для игры
//Хранит 2-х игроков(http-соединения), идентификатор комнаты, пригласительную ссылку, логику игры
//Реализует процессы игры и чата
var Room = function(href){
    this.player1 = {player: null, nowTurn: true, playerNumber: 1, lastOpponentTurn: null};
    this.player2 = {player: null, nowTurn: false, playerNumber: 2, lastOpponentTurn: null};
    this.id = "?" + Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, Room.prototype.getIdLength());
    this.inviteLink = href + this.id;
    this.field = Room.prototype.makeInitialField();//[0,0,0,0,0,0,0,0,0];
    this.moved = {
      rook_w_l: false,
      rook_w_r: false,
      king_w: false,
      rook_b_l: false,
      rook_b_r: false,
      king_b: false
    };
    this.initialRoom = true;
    this.lostFigures = {
      figures: [],
      lastMarkedWhite: false,
      lastMarkedBlack: false
    };

};
Room.prototype.getIdLength = function(){
  return 4;
}
//Добавление в комнату игрока 1
Room.prototype.addPlayer1 = function(socket){
  !this.player1 ? this.player1 = {} : {};
  this.player1.player = socket;
};
//Добавление в комнату игрока 2
Room.prototype.addPlayer2 = function(socket){
  !this.player2 ? this.player2 = {} : {};
  this.player2.player = socket;
};

Room.prototype.makeInitialField = function(){
  var result = [];
    //середина поля
    for (var i=0; i<8; i++){
      result[i] = [];
      for (var j=2; j<6; j++){
        result[i][j]="empty";
      }
    }
    //расстановка фигур
    result[0][0]="rook_w";
    result[1][0]="knight_w";
    result[2][0]="bishop_w";
    result[3][0]="queen_w";
    result[4][0]="king_w";
    result[5][0]="bishop_w";
    result[6][0]="knight_w";
    result[7][0]="rook_w";
    result[0][1]="pawn_w";
    result[1][1]="pawn_w";
    result[2][1]="pawn_w";
    result[3][1]="pawn_w";
    result[4][1]="pawn_w";
    result[5][1]="pawn_w";
    result[6][1]="pawn_w";
    result[7][1]="pawn_w";

    result[0][6]="pawn_b";
    result[1][6]="pawn_b";
    result[2][6]="pawn_b";
    result[3][6]="pawn_b";
    result[4][6]="pawn_b";
    result[5][6]="pawn_b";
    result[6][6]="pawn_b";
    result[7][6]="pawn_b";
    result[0][7]="rook_b";
    result[1][7]="knight_b";
    result[2][7]="bishop_b";
    result[3][7]="queen_b";
    result[4][7]="king_b";
    result[5][7]="bishop_b";
    result[6][7]="knight_b";
    result[7][7]="rook_b";

    return result;
};


Room.prototype.winner = function(){
  /*

  Определяем мат

  return this.player1;

  return this.player2;

  return "pat";
  */
  return null;
};

Room.prototype.chat = function(){
    var self = this;
    if (self.player1.player){
      self.player1.player.removeAllListeners('message');
      self.player1.player.on('message', function(text){
          self.player1.player.emit('message dilivered to server',text);
          self.player2.player ? self.player2.player.emit('message',text) : {};
      });
    }
    if (self.player2.player){
      self.player2.player.removeAllListeners('message');
      self.player2.player.on('message', function(text){
          self.player2.player.emit('message dilivered to server',text);
          self.player1.player ? self.player1.player.emit('message',text) : {};
      });
    }
};


Room.prototype.game = function(){
  var self = this;
  console.log("Game "+self.id+" started!");
  self.restartGameListener();

  //Отправка игрокам (игроку) информации о состоянии игры
  function sendGameStatus(){
    if (self.player1.player && self.player2.player) {
      self.initialRoom = false;
    }
    var player2OpponentOffline;
    var player1OpponentOffline;
    self.player1.player ? player2OpponentOffline = false : player2OpponentOffline = true;
    self.player2.player ? player1OpponentOffline = false : player1OpponentOffline = true;


    for (var i = 0; i < arguments.length; i++) {
      if (arguments[i]){
        if (arguments[i] == self.player1.player){
          arguments[i].emit('game status', {playerNumber: self.player1.playerNumber, nowTurn: self.player1.nowTurn, roomId: self.id, field: self.field, moved: self.moved, lastOpponentTurn: self.player1.lastOpponentTurn, lostFigures: self.lostFigures});
          arguments[i].emit('opponent status', {opponentOffline: player1OpponentOffline});
        }
        else if (arguments[i] == self.player2.player){
          arguments[i].emit('game status', {playerNumber: self.player2.playerNumber, nowTurn: self.player2.nowTurn, roomId: self.id, field: self.field, moved: self.moved, lastOpponentTurn: self.player2.lastOpponentTurn, lostFigures: self.lostFigures});
          arguments[i].emit('opponent status', {opponentOffline: player2OpponentOffline});
        }
      }
    }
    if (self.winner()){
        self.endGame();
    }
  }


  //обработка информации о ходе игрока
  function turnProcessing(data){
    var isCheck = function(player){
      //для игрока 1
      //находим координаты белого короля
      var king_wCoords = {};
      for (var i=0; i<self.field.length; i++){
        for (var j=0; j<self.field[i].length; j++){
          if (self.field[i][j] == "king_w"){
            king_wCoords = {
              i: i,
              j: j
            }
            break;
          }
        }
      }
      var hypoteticPawnCoords = null;
      //атакует ли черная пешка?
      hypoteticPawnCoords = {
        i: king_wCoords.i-1,
        j: king_wCoords.j+1
      };
      if ((hypoteticPawnCoords.i >= 0) && (hypoteticPawnCoords.j <= 7)){
        if (self.field[hypoteticPawnCoords.i][hypoteticPawnCoords.j] == "pawn_b") return true
      }

      hypoteticPawnCoords = {
        i: king_wCoords.i+1,
        j: king_wCoords.j+1
      };
      if ((hypoteticPawnCoords.i <= 7) && (hypoteticPawnCoords.j <= 7)){
        if (self.field[hypoteticPawnCoords.i][hypoteticPawnCoords.j] == "pawn_b") return true
      }

      //атакует ли черная ладья или ферзь?
      for (var i = king_wCoords.i; i >= 0; i--){
        if ((self.field[i][king_wCoords.j] != "king_w") && (self.field[i][king_wCoords.j] != "empty") && (self.field[i][king_wCoords.j] != "rook_b") && (self.field[i][king_wCoords.j] != "queen_b")){
          //если другая фигура
          break;
        }
        if ((self.field[i][king_wCoords.j] == "rook_b") || (self.field[i][king_wCoords.j] == "queen_b")) return true;
      }
      for (var i = king_wCoords.i; i <= 7; i++){
        if ((self.field[i][king_wCoords.j] != "king_w") && (self.field[i][king_wCoords.j] != "empty") && (self.field[i][king_wCoords.j] != "rook_b") && (self.field[i][king_wCoords.j] != "queen_b")){
          //если другая фигура
          break;
        }
        if ((self.field[i][king_wCoords.j] == "rook_b") || (self.field[i][king_wCoords.j] == "queen_b")) return true;
      }
      for (var j = king_wCoords.j; j >= 0; j--){
        if ((self.field[king_wCoords.i][j] != "king_w") && (self.field[king_wCoords.i][j] != "empty") && (self.field[king_wCoords.i][j] != "rook_b") && (self.field[king_wCoords.i][j] != "queen_b")){
          //если другая фигура
          break;
        }
        if ((self.field[king_wCoords.i][j] == "rook_b") || (self.field[king_wCoords.i][j] == "queen_b")) return true;
      }
      for (var j = king_wCoords.j; j <= 7; j++){
        if ((self.field[king_wCoords.i][j] != "king_w") && (self.field[king_wCoords.i][j] != "empty") && (self.field[king_wCoords.i][j] != "rook_b") && (self.field[king_wCoords.i][j] != "queen_b")){
          //если другая фигура
          break;
        }
        if ((self.field[king_wCoords.i][j] == "rook_b") || (self.field[king_wCoords.i][j] == "queen_b")) return true;
      }

      //атакует ли черный слон или ферзь?
      for (var i = king_wCoords.i, j = king_wCoords.j; ((i >= 0) && (j <= 7)); i--, j++){
        if ((self.field[i][j] != "king_w") && (self.field[i][j] != "empty") && (self.field[i][j] != "bishop_b") && (self.field[i][j] != "queen_b")){
          //если другая фигура
          break;
        }
        if ((self.field[i][j] == "bishop_b") || (self.field[i][j] == "queen_b")) return true;
      }
      for (var i = king_wCoords.i, j = king_wCoords.j; ((i <= 7) && (j <= 7)); i++, j++){
        if ((self.field[i][j] != "king_w") && (self.field[i][j] != "empty") && (self.field[i][j] != "bishop_b") && (self.field[i][j] != "queen_b")){
          //если другая фигура
          break;
        }
        if ((self.field[i][j] == "bishop_b") || (self.field[i][j] == "queen_b")) return true;
      }
      for (var i = king_wCoords.i, j = king_wCoords.j; ((i <= 7) && (j >= 0)); i++, j--){
        if ((self.field[i][j] != "king_w") && (self.field[i][j] != "empty") && (self.field[i][j] != "bishop_b") && (self.field[i][j] != "queen_b")){
          //если другая фигура
          break;
        }
        if ((self.field[i][j] == "bishop_b") || (self.field[i][j] == "queen_b")) return true;
      }
      for (var i = king_wCoords.i, j = king_wCoords.j; ((i >= 0) && (j >= 0)); i--, j--){
        if ((self.field[i][j] != "king_w") && (self.field[i][j] != "empty") && (self.field[i][j] != "bishop_b") && (self.field[i][j] != "queen_b")){
          //если другая фигура
          break;
        }
        if ((self.field[i][j] == "bishop_b") || (self.field[i][j] == "queen_b")) return true;
      }

      //атакует ли черный конь?
      var hypoteticKnightCoords = [
      {
        i: king_wCoords.i+1,
        j: king_wCoords.j+2
      },
      {
        i: king_wCoords.i+2,
        j: king_wCoords.j+1
      },
      {
        i: king_wCoords.i+2,
        j: king_wCoords.j-1
      },
      {
        i: king_wCoords.i+1,
        j: king_wCoords.j-2
      },
      {
        i: king_wCoords.i-1,
        j: king_wCoords.j-2
      },
      {
        i: king_wCoords.i-2,
        j: king_wCoords.j-1
      },
      {
        i: king_wCoords.i-2,
        j: king_wCoords.j+1
      },
      {
        i: king_wCoords.i-1,
        j: king_wCoords.j+2
      }]
      for (var i=0; i<hypoteticKnightCoords.length; i++){
        if ((hypoteticKnightCoords[i].i <= 7) && (hypoteticKnightCoords[i].i >= 0) && (hypoteticKnightCoords[i].j <= 7) && (hypoteticKnightCoords[i].j >= 0)) {
          if (self.field[hypoteticKnightCoords[i].i][hypoteticKnightCoords[i].j] == "knight_b") return true
        }
      }

      //атакует ли черный король?
      var hypoteticKingCoords = [
      {
        i: king_wCoords.i-1,
        j: king_wCoords.j+1
      },
      {
        i: king_wCoords.i+0,
        j: king_wCoords.j+1
      },
      {
        i: king_wCoords.i+1,
        j: king_wCoords.j+1
      },
      {
        i: king_wCoords.i+1,
        j: king_wCoords.j+0
      },
      {
        i: king_wCoords.i+1,
        j: king_wCoords.j-1
      },
      {
        i: king_wCoords.i-0,
        j: king_wCoords.j-1
      },
      {
        i: king_wCoords.i-1,
        j: king_wCoords.j-1
      },
      {
        i: king_wCoords.i-1,
        j: king_wCoords.j+0
      }]
      for (var i=0; i<hypoteticKingCoords.length; i++){
        if ((hypoteticKingCoords[i].i <= 7) && (hypoteticKingCoords[i].i >= 0) && (hypoteticKingCoords[i].j <= 7) && (hypoteticKingCoords[i].j >= 0)) {
          if (self.field[hypoteticKingCoords[i].i][hypoteticKingCoords[i].j] == "king_b") return true
        }
      }



      return false;

    }
    var saveTurn = function(player,field,moved,turnContent,lostFigure){
        if (player == self.player1){
            self.field = field;
            self.moved = moved;
            self.player2.lastOpponentTurn = turnContent;
        }
        else if (player == self.player2){
            self.field = field;
            self.moved = moved;
            self.player1.lastOpponentTurn = turnContent;
        }
        self.lostFigures.lastMarkedWhite = false;
        self.lostFigures.lastMarkedBlack = false;
        if (lostFigure) {
          //определяем кого съели - белого или черного
          if (lostFigure[lostFigure.length-1] == "w"){
            self.lostFigures.lastMarkedWhite = true;
          }
          if (lostFigure[lostFigure.length-1] == "b"){
            self.lostFigures.lastMarkedBlack = true;
          }
          self.lostFigures.figures.push(lostFigure);
        }
        if (!self.winner()) {
          self.player1.nowTurn = !self.player1.nowTurn;
          self.player2.nowTurn = !self.player2.nowTurn;
        }
        else{
          self.player1.nowTurn = false;
          self.player2.nowTurn = false;
        }
        //save to DB
        var db = require('../database.js');
        console.log("SAVING TURN TO DATABASE...");
        var p1 = {player: null, nowTurn: self.player1.nowTurn, playerNumber: self.player1.playerNumber, lastOpponentTurn: self.player1.lastOpponentTurn};
        var p2 = {player: null, nowTurn: self.player2.nowTurn, playerNumber: self.player2.playerNumber, lastOpponentTurn: self.player2.lastOpponentTurn};


        db.updateRoom(self.id, {field: JSON.stringify(self.field), moved: JSON.stringify(self.moved), player1: JSON.stringify(p1), player2: JSON.stringify(p2), lostFigures: JSON.stringify(self.lostFigures)});
        console.log("Room update DONE");
    };
    if (data.playerNumber == 1){
      console.log("Первый походил!");
      saveTurn(self.player1,data.field,data.moved,data.turnContent,data.lostFigure);
    }
    else if (data.playerNumber == 2){
      console.log("Второй походил!");
      saveTurn(self.player2,data.field,data.moved,data.turnContent,data.lostFigure);
    }
    if (isCheck()){
      console.log("ШАХ БЕЛОМУ ЁПТ")
    };
    sendGameStatus(self.player1.player, self.player2.player);
  };

  function turnDoneListen(){
    for (var i = 0; i < arguments.length; i++) {
      if (arguments[i]){
          arguments[i].removeAllListeners('turn done');
          arguments[i].on('turn done', function(data){
            turnProcessing(data);
          });
      }
    }
  }
  turnDoneListen(self.player1.player, self.player2.player);
  sendGameStatus(self.player1.player, self.player2.player);

};

//Установка параметров комнаты в состояние начала игры
Room.prototype.setNewGame = function(number){
  var self = this;
  switch (number) {
    case 1:
      self.player1.nowTurn = true;
      self.player2.nowTurn = false;
      break;
    case 2:
      self.player2.nowTurn = true;
      self.player1.nowTurn = false;
      break;
    default:
      self.player1.nowTurn = true;
      self.player2.nowTurn = false;
  }
  self.field = Room.prototype.makeInitialField();;
  self.initialRoom = true;
  self.lostFigures = [];
};

Room.prototype.restartGameListener = function(){
  var self = this;
  if (self.player1.player){
    self.player1.player.removeAllListeners('restart request');
    self.player1.player.on('restart request', function(){
      self.player2.player.emit('restart request');
    });
    self.player1.player.removeAllListeners('restart accepted');
    self.player1.player.on('restart accepted', function(){
      self.player2.player.emit('restart accepted');
      self.setNewGame(2);
      self.game();
    });
    self.player1.player.removeAllListeners('restart canceled');
    self.player1.player.on('restart canceled', function(){
      self.player2.player.emit('restart canceled');
    });
  }
  if (self.player2.player){
    self.player2.player.removeAllListeners('restart request');
    self.player2.player.on('restart request', function(){
      self.player1.player.emit('restart request');
    });
    self.player2.player.removeAllListeners('restart accepted');
    self.player2.player.on('restart accepted', function(){
      self.player1.player.emit('restart accepted');
      self.setNewGame(1);
      self.game();
    });
    self.player2.player.removeAllListeners('restart canceled');
    self.player2.player.on('restart canceled', function(){
      self.player1.player.emit('restart canceled');
    });
  }
};
Room.prototype.endGame = function(reason){
    console.log("Игра закончилась!");
    var self = this;
    self.player1.nowTurn = false;
    self.player2.nowTurn = false;
    if (!reason) {
        switch (self.winner()) {
            case self.player1:
                console.log("Первый выиграл!");
                self.player1.player ? self.player1.player.emit('end game', 'win') : {};
                self.player2.player ? self.player2.player.emit('end game', 'loose') : {};
                break;
            case self.player2:
                console.log("Второй выиграл!");
                self.player1.player ? self.player1.player.emit('end game', 'loose') : {};
                self.player2.player ? self.player2.player.emit('end game', 'win') : {};
                break;
            case "pat":
                console.log("Ничья!");
                self.player1.player ? self.player1.player.emit('end game', 'pat') : {};
                self.player2.player ? self.player2.player.emit('end game', 'pat') : {};
                break;
            default:
        }
    }
    else{
        switch (reason) {
            case "disconnect":
                console.log("Причина: игрок отключился");
                /*self.player1 ? self.player1.player.emit('end game', 'disconnect'):{};
                self.player2 ? self.player2.player.emit('end game', 'disconnect'):{};
                break;*/
            default:
        }
    }

};
module.exports = Room;
