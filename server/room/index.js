//Комната для игры
//Хранит 2-х игроков(http-соединения), идентификатор комнаты, пригласительную ссылку, логику игры
//Реализует процессы игры и чата
var Room = function(href){
    this.player1 = {player: null, nowTurn: true, playerNumber: 1};
    this.player2 = {player: null, nowTurn: false, playerNumber: 2};
    this.id = "?" + Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, Room.prototype.getIdLength());
    this.inviteLink = href + this.id;
    this.field = [0,0,0,0,0,0,0,0,0];
    this.canDelete = true;

};
Room.prototype.getIdLength = function(){
  return 4;
}
//Добавление в комнату игрока 1
Room.prototype.addPlayer1 = function(socket){
    this.player1.player = socket;
};
//Добавление в комнату игрока 2
Room.prototype.addPlayer2 = function(socket){
    this.player2.player = socket;
};




/*Room.prototype.saveTurn = function(player,n){
    if (player == this.player1){
        this.field[n-1] = 1;
    }
    else if (player == this.player2){
        this.field[n-1] = -1;
    }
};*/
Room.prototype.winner = function(){
    if((this.field[0]+this.field[1]+this.field[2]==3) ||
        (this.field[3]+this.field[4]+this.field[5]==3) ||
        (this.field[6]+this.field[7]+this.field[8]==3) ||
        (this.field[0]+this.field[3]+this.field[6]==3) ||
        (this.field[1]+this.field[4]+this.field[7]==3) ||
        (this.field[2]+this.field[5]+this.field[8]==3) ||
        (this.field[4]+this.field[6]+this.field[2]==3) ||
        (this.field[0]+this.field[4]+this.field[8]==3)
    ) {
        return this.player1;
    }
    else if (
        (this.field[0]+this.field[1]+this.field[2]==-3) ||
        (this.field[3]+this.field[4]+this.field[5]==-3) ||
        (this.field[6]+this.field[7]+this.field[8]==-3) ||
        (this.field[0]+this.field[3]+this.field[6]==-3) ||
        (this.field[1]+this.field[4]+this.field[7]==-3) ||
        (this.field[2]+this.field[5]+this.field[8]==-3) ||
        (this.field[4]+this.field[6]+this.field[2]==-3) ||
        (this.field[0]+this.field[4]+this.field[8]==-3)
    ){
        return this.player2;
    }
    else if (
        (this.field[0] != 0) &&
        (this.field[1] != 0) &&
        (this.field[2] != 0) &&
        (this.field[3] != 0) &&
        (this.field[4] != 0) &&
        (this.field[5] != 0) &&
        (this.field[6] != 0) &&
        (this.field[7] != 0) &&
        (this.field[8] != 0)
    ){
        return "pat";
    }
    else
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
      self.canDelete = false;
    }
    var player2OpponentOffline;
    var player1OpponentOffline;
    self.player1.player ? player2OpponentOffline = false : player2OpponentOffline = true;
    self.player2.player ? player1OpponentOffline = false : player1OpponentOffline = true;

    for (var i = 0; i < arguments.length; i++) {
      if (arguments[i]){
        if (arguments[i] == self.player1.player){
          arguments[i].emit('game status', {playerNumber: self.player1.playerNumber, nowTurn: self.player1.nowTurn, roomId: self.id, field: self.field});
          arguments[i].emit('opponent status', {opponentOffline: player1OpponentOffline});
        }
        else if (arguments[i] == self.player2.player){
          arguments[i].emit('game status', {playerNumber: self.player2.playerNumber, nowTurn: self.player2.nowTurn, roomId: self.id, field: self.field});
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
    var saveTurn = function(player,n){
        if (player == self.player1){
            self.field[n-1] = 1;
        }
        else if (player == self.player2){
            self.field[n-1] = -1;
        }
    };
    if (data.playerNumber == 1){
      console.log("Первый походил! Квадрат № " + data.targetId);
      saveTurn(self.player1,data.targetId);
    }
    else if (data.playerNumber == 2){
      console.log("Второй походил! Квадрат № " + data.targetId);
      saveTurn(self.player2,data.targetId);
    }
    if (!self.winner()) {
      self.player1.nowTurn = !self.player1.nowTurn;
      self.player2.nowTurn = !self.player2.nowTurn;
    }
    else{
      self.player1.nowTurn = false;
      self.player2.nowTurn = false;
    }
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
  this.field = [0,0,0,0,0,0,0,0,0];
  this.canDelete = true;
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



  /*if (self.player1.player){
    var requestsCount1 = 0;
    self.player1.player.on('restart request', function(){
      console.log("restart request from player1 getted")
      requestsCount1++;
      self.player2.player.emit('restart request');
      if (requestsCount1 == 1){
        //self.player2.player.removeAllListeners('restart request');
        self.player2.player.once('restart accepted', function(){
          self.player1.player.emit('restart accepted');
          self.setNewGame(1);
          self.game();

        });
        console.log("restart CANCELED FROM PLAYER2 LISTENING");
        self.player2.player.on('restart canceled', function(){
          console.log("restart CANCELED FROM PLAYER2 RECEIVED");
          self.player1.player.emit('restart canceled');
        });
      }
    })
  }
  if (self.player2.player){
    var requestsCount2 = 0;
    self.player2.player.on('restart request', function(){
      console.log("restart request from player2 getted");
      requestsCount2++;
      self.player1.player.emit('restart request');
      if (requestsCount2 == 1){
        //self.player1.player.removeAllListeners('restart request');
        self.player1.player.once('restart accepted', function(){
          self.player2.player.emit('restart accepted');
          self.setNewGame(2);
          self.game();

        });
        console.log("restart CANCELED FROM PLAYER1 LISTENING");
        self.player1.player.on('restart canceled', function(){
          console.log("restart CANCELED FROM PLAYER1 RECEIVED");
          self.player2.player.emit('restart canceled');
        });
      }
    })
  }*/


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
