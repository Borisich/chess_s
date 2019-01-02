
var React = require('react');
var socket = require('../../../../services/socket.js');
var soundManager = require('../../../../sounds/sounds.js');

var StatusBar = require('./StatusBar.jsx');

var GameField = React.createClass({
    getInitialState: function(){
        function getInitialFieldState(){
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
          result[0][0].moved = false;
          result[1][0]="knight_w";
          result[2][0]="bishop_w";
          result[3][0]="queen_w";
          /*result[1][0]="empty";
          result[2][0]="empty";
          result[3][0]="empty";*/
          result[4][0]="king_w";
          result[4][0].moved = false;
          result[5][0]="bishop_w";
          result[6][0]="knight_w";
          /*result[5][0]="empty";
          result[6][0]="empty";*/
          result[7][0]="rook_w";
          result[7][0].moved = false;
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
          result[0][7].moved = false;
          result[1][7]="knight_b";
          result[2][7]="bishop_b";
          result[3][7]="queen_b";
          /*result[1][7]="empty";
          result[2][7]="empty";
          result[3][7]="empty";*/
          result[4][7]="king_b";
          result[4][7].moved = false;
          result[5][7]="bishop_b";
          result[6][7]="knight_b";
          /*result[5][7]="empty";
          result[6][7]="empty";*/
          result[7][7]="rook_b";
          result[7][7].moved = false;

          //console.log(result);
          return result;
        };
        function getInitialFieldState1(){
          var result = [];
          //result.moved = null;
          //середина поля
          for (var i=0; i<8; i++){
            result[i] = [];
            for (var j=0; j<8; j++){
              result[i][j]="empty";
            }
          }
        //  console.log(result);
          return result;
        };

        return {
            shown: false,
            //fieldState: ["empty","empty","empty","empty","empty","empty","empty","empty","empty"],
            fieldState: getInitialFieldState1(),
            moved: {},
            lastOpponentTurn: null,
            myTurn: true,
            frameColorClass: "framecolormyturn",
            selectedFigure: {
              selected: false,
              i: undefined,
              j: undefined,
              class: undefined
            },
            myNumber: 1,
            statusText: "",
            connectionText: "",
            buttonsDescriptionText: "",
            statusButton1: {
              disabled: true,
              visible: false,
              text: "",
              onClick: function(){}
            },
            statusButton2: {
              disabled: true,
              visible: false,
              text: "",
              onClick: function(){}
            },
        };
    },
    timeoutData: {
      frameColorClass: null,
      timeoutId: null,
    },
    gameStatusListen: true,
    componentDidMount: function () {
        var self = this;
        self.addGameStatusListener();
        socket.on('opponent status', function (data) {
          console.log("opponentOffline: " + data.opponentOffline);
          data.opponentOffline ? self.setState({connectionText: "Соперник не в сети"}) : self.setState({connectionText: ""});
        });
        socket.on ('game not found', function() {
          self.setState({
            shown: false
          });
        });
        socket.on ('room is full', function() {
          self.setState({
            shown: false
          });
        });
        socket.on ('invite link', function() {
          self.setState({
            shown: false
          });
        });

        //Обработка события "конец игры"
        self.addEndGameListenerOnce();
    },
    addEndGameListenerOnce: function(){
      var self = this;
      socket.once('end game', function(data){
          self.myTurn = false;
          //socket.removeAllListeners('game status');
          self.gameStatusListen = false;
          switch (data){
              case "loose":
                  soundManager.play('loose');
                  self.setState({statusText: "Игра закончилась. Вы проиграли"});
                  console.log("Игра закончилась. Вы проиграли");
                  break;
              case "win":
                  soundManager.play('win');
                  self.setState({statusText: "Игра закончилась. Вы выиграли!! УРАА!"});
                  console.log("Игра закончилась. Вы выиграли!! УРАА!");
                  break;
              case "pat":
                  soundManager.play('pat');
                  self.setState({statusText: "Игра закончилась. Ничья"});
                  console.log("Игра закончилась. Ничья");
                  break;
              case "disconnect":
                  soundManager.play('disconnect');
                  self.setState({statusText: "Игра закончилась. Игрок отключился"});
                  console.log("Дисконнект");
                  break;
              default:
          }
          //Показать кнопку "начать заново" и установить обработчик приема

          self.setState({statusButton1: {
              disabled: false,
              visible: true,
              text: "Начать заново",
              onClick: self.sendRestartRequest
            }
          });
          self.receiveRestartRequest();
      })
    },
    addGameStatusListener: function(){
      var self = this;
      socket.on('game status', function (gameData) {
        if (self.gameStatusListen){
          var frameColorClassNew = null;
          var myTurnNew = null;
          var myNumberNew = null;
          var fieldStateNew = null;
          var movedNew = null;
          var lastOpponentTurnNew = null;
          var statusTextNew = null;

          frameColorClassNew = "";
          gameData.nowTurn ? frameColorClassNew = "framecolormyturn" : frameColorClassNew = "framecolornotmyturn";
          if (self.isCheck(gameData.field)){
            frameColorClassNew = "framecolorcheck";
          }

          myTurnNew = gameData.nowTurn;
          myNumberNew = gameData.playerNumber;
          fieldStateNew = gameData.field;
          movedNew = gameData.moved;
          lastOpponentTurnNew = gameData.lastOpponentTurn;

          if (gameData.nowTurn) {
            soundManager.play('my_turn');
            statusTextNew = "Ваш ход!";
          } else {
            statusTextNew = "Ход соперника...";
          }
          self.setState({
            shown: true,
            frameColorClass: frameColorClassNew,
            myTurn: myTurnNew,
            myNumber: myNumberNew,
            fieldState: fieldStateNew,
            moved: movedNew,
            lastOpponentTurn: lastOpponentTurnNew,
            statusText: statusTextNew
          });
          if (self.isMate()){
            //отправим на сервер информацию о проигрыше
            socket.emit("i loose",  self.state.myNumber);
            //alert("i loose sended");
          }
        }
      });
    },
    restartGame: function(){
      var self = this;
      socket.removeAllListeners('restart canceled');
      //self.addGameStatusListener();
      self.gameStatusListen = true;
      self.addEndGameListenerOnce();
      self.setState({statusButton1: {
          disabled: false,
          visible: false,
          text: "",
          onClick: function(){}
        }
      });
    },
    sendRestartRequest: function(){
      var self = this;
      console.log('restart request sended');
      self.setState({statusButton1: {
          disabled: true,
          visible: true,
          text: "Ожидание ответа соперника...",
          onClick: self.sendRestartRequest
        },
        buttonsDescriptionText: ""
      });
      socket.removeAllListeners('restart request');
      console.log('restart request listening disabled');
      socket.emit('restart request', this.state.myNumber);
      socket.once('restart accepted', function(){
        self.restartGame();

      });
      socket.on('restart canceled', function(data){
        console.log("Test");
        socket.removeAllListeners('restart accepted');
        self.receiveRestartRequest();
        self.setState({statusButton1: {
            disabled: false,
            visible: true,
            text: "Начать заново",
            onClick: self.sendRestartRequest
          },
          buttonsDescriptionText: "Соперник отклонил приглашение"
        });
      });
    },
    receiveRestartRequest: function(){
      var self = this;
      console.log("Restart requesting enabled");

      socket.on('restart request',function(data){
        console.log("Restart request from opponent getted");
        self.setState({
          statusButton1: {
            disabled: false,
            visible: true,
            text: "Ок",
            onClick: self.restartGameAccepted
          },
          statusButton2: {
              disabled: false,
              visible: true,
              text: "Нет",
              onClick: self.cancelRestart
          },
          buttonsDescriptionText: "Соперник предлагает начать игру заново."
        });
      });
    },
    restartGameAccepted: function(){
      var self = this;
      console.log("RestartGame function running");
      self.setState({
        statusButton1: {
          disabled: false,
          visible: false,
          text: "",
          onClick: function(){}
        },
        statusButton2: {
            disabled: false,
            visible: false,
            text: "",
            onClick: function(){}
        },
        buttonsDescriptionText: ""
      });
      socket.emit('restart accepted');
      self.restartGame();
    },
    cancelRestart: function(){
      var self = this;
      self.setState({
        statusButton1: {
            disabled: false,
            visible: true,
            text: "Начать заново",
            onClick: self.sendRestartRequest
        },
        statusButton2: {
            disabled: false,
            visible: false,
            text: "",
            onClick: function(){}
        },
        buttonsDescriptionText: ""
      });
      socket.emit('restart canceled');
    },
    getFieldStateById: function(id){
      //var self = this;
      var i = (id-1) % 8;
      var jCalc = (64-id+1);
      var jCalc2 = ((jCalc % 8) ? jCalc/8 : (jCalc-1)/8);
      var j = Math.floor(jCalc2);
      var cs = this.state.fieldState[i][j];

      return {
        class: cs,
        i: i,
        j: j
      }
    },
    /*getFigureByCoords: function(i,j){

    },*/
    isMyFigure: function(cl){
      var result = false;
      if (this.state.myNumber == 1){
        switch (cl) {
          case "rook_w":
          case "knight_w":
          case "bishop_w":
          case "king_w":
          case "queen_w":
          case "pawn_w":
            result = true;
            break;
          default:
            result = false;
        }
      }
      if (this.state.myNumber == 2){
        switch (cl) {
          case "rook_b":
          case "knight_b":
          case "bishop_b":
          case "king_b":
          case "queen_b":
          case "pawn_b":
            result = true;
            break;
          default:
            result = false;
        }
      }
      return result;
    },
    isZoneUnderAttack: function(fieldState, zone, myNumber){
      //zone - объект. {i: ..., j: ....}
      var self = this;
      var ending = "";
      if (myNumber == 1){
        ending = "_b"
      }
      else if (myNumber == 2){
        ending = "_w"
      }
      var hypoteticPawnCoords = null;
      //атакует ли черная пешка?
      if (myNumber == 1) {
        hypoteticPawnCoords = {
          i: zone.i-1,
          j: zone.j+1
        };
        if ((hypoteticPawnCoords.i >= 0) && (hypoteticPawnCoords.j <= 7)){
          if (fieldState[hypoteticPawnCoords.i][hypoteticPawnCoords.j] == "pawn_b") return true
        }

        hypoteticPawnCoords = {
          i: zone.i+1,
          j: zone.j+1
        };
        if ((hypoteticPawnCoords.i <= 7) && (hypoteticPawnCoords.j <= 7)){
          if (fieldState[hypoteticPawnCoords.i][hypoteticPawnCoords.j] == "pawn_b") return true
        }
      }
      //атакует ли белая пешка?
      if (myNumber == 2) {
        hypoteticPawnCoords = {
          i: zone.i-1,
          j: zone.j-1
        };
        if ((hypoteticPawnCoords.i >= 0) && (hypoteticPawnCoords.j <= 7)){
          if (fieldState[hypoteticPawnCoords.i][hypoteticPawnCoords.j] == "pawn_w") return true
        }

        hypoteticPawnCoords = {
          i: zone.i+1,
          j: zone.j-1
        };
        if ((hypoteticPawnCoords.i <= 7) && (hypoteticPawnCoords.j <= 7)){
          if (fieldState[hypoteticPawnCoords.i][hypoteticPawnCoords.j] == "pawn_w") return true
        }
      }

      //атакует ли ладья или ферзь?
      for (var i = zone.i-1; i >= 0; i--){
        if ((fieldState[i][zone.j] != "empty") && (fieldState[i][zone.j] != "rook"+ending) && (fieldState[i][zone.j] != "queen"+ending)){
          //если другая фигура
          break;
        }
        if ((fieldState[i][zone.j] == "rook"+ending) || (fieldState[i][zone.j] == "queen"+ending)) return true;
      }
      for (var i = zone.i+1; i <= 7; i++){
        if ((fieldState[i][zone.j] != "empty") && (fieldState[i][zone.j] != "rook"+ending) && (fieldState[i][zone.j] != "queen"+ending)){
          //если другая фигура
          break;
        }
        if ((fieldState[i][zone.j] == "rook"+ending) || (fieldState[i][zone.j] == "queen"+ending)) return true;
      }
      for (var j = zone.j-1; j >= 0; j--){
        if ((fieldState[zone.i][j] != "empty") && (fieldState[zone.i][j] != "rook"+ending) && (fieldState[zone.i][j] != "queen"+ending)){
          //если другая фигура
          break;
        }
        if ((fieldState[zone.i][j] == "rook"+ending) || (fieldState[zone.i][j] == "queen"+ending)) return true;
      }
      for (var j = zone.j+1; j <= 7; j++){
        if ((fieldState[zone.i][j] != "empty") && (fieldState[zone.i][j] != "rook"+ending) && (fieldState[zone.i][j] != "queen"+ending)){
          //если другая фигура
          break;
        }
        if ((fieldState[zone.i][j] == "rook"+ending) || (fieldState[zone.i][j] == "queen"+ending)) return true;
      }

      //атакует ли слон или ферзь?
      for (var i = zone.i-1, j = zone.j+1; ((i >= 0) && (j <= 7)); i--, j++){
        if ((fieldState[i][j] != "empty") && (fieldState[i][j] != "bishop"+ending) && (fieldState[i][j] != "queen"+ending)){
          //если другая фигура
          break;
        }
        if ((fieldState[i][j] == "bishop"+ending) || (fieldState[i][j] == "queen"+ending)) return true;
      }
      for (var i = zone.i+1, j = zone.j+1; ((i <= 7) && (j <= 7)); i++, j++){
        if ((fieldState[i][j] != "empty") && (fieldState[i][j] != "bishop"+ending) && (fieldState[i][j] != "queen"+ending)){
          //если другая фигура
          break;
        }
        if ((fieldState[i][j] == "bishop"+ending) || (fieldState[i][j] == "queen"+ending)) return true;
      }
      for (var i = zone.i+1, j = zone.j-1; ((i <= 7) && (j >= 0)); i++, j--){
        if ((fieldState[i][j] != "empty") && (fieldState[i][j] != "bishop"+ending) && (fieldState[i][j] != "queen"+ending)){
          //если другая фигура
          break;
        }
        if ((fieldState[i][j] == "bishop"+ending) || (fieldState[i][j] == "queen"+ending)) return true;
      }
      for (var i = zone.i-1, j = zone.j-1; ((i >= 0) && (j >= 0)); i--, j--){
        if ((fieldState[i][j] != "empty") && (fieldState[i][j] != "bishop"+ending) && (fieldState[i][j] != "queen"+ending)){
          //если другая фигура
          break;
        }
        if ((fieldState[i][j] == "bishop"+ending) || (fieldState[i][j] == "queen"+ending)) return true;
      }

      //атакует ли конь?
      var hypoteticKnightCoords = [
      {
        i: zone.i+1,
        j: zone.j+2
      },
      {
        i: zone.i+2,
        j: zone.j+1
      },
      {
        i: zone.i+2,
        j: zone.j-1
      },
      {
        i: zone.i+1,
        j: zone.j-2
      },
      {
        i: zone.i-1,
        j: zone.j-2
      },
      {
        i: zone.i-2,
        j: zone.j-1
      },
      {
        i: zone.i-2,
        j: zone.j+1
      },
      {
        i: zone.i-1,
        j: zone.j+2
      }]
      for (var i=0; i<hypoteticKnightCoords.length; i++){
        if ((hypoteticKnightCoords[i].i <= 7) && (hypoteticKnightCoords[i].i >= 0) && (hypoteticKnightCoords[i].j <= 7) && (hypoteticKnightCoords[i].j >= 0)) {
          if (fieldState[hypoteticKnightCoords[i].i][hypoteticKnightCoords[i].j] == "knight"+ending) return true
        }
      }

      //атакует ли черный король?
      var hypoteticKingCoords = [
      {
        i: zone.i-1,
        j: zone.j+1
      },
      {
        i: zone.i+0,
        j: zone.j+1
      },
      {
        i: zone.i+1,
        j: zone.j+1
      },
      {
        i: zone.i+1,
        j: zone.j+0
      },
      {
        i: zone.i+1,
        j: zone.j-1
      },
      {
        i: zone.i-0,
        j: zone.j-1
      },
      {
        i: zone.i-1,
        j: zone.j-1
      },
      {
        i: zone.i-1,
        j: zone.j+0
      }]
      for (var i=0; i<hypoteticKingCoords.length; i++){
        if ((hypoteticKingCoords[i].i <= 7) && (hypoteticKingCoords[i].i >= 0) && (hypoteticKingCoords[i].j <= 7) && (hypoteticKingCoords[i].j >= 0)) {
          if (fieldState[hypoteticKingCoords[i].i][hypoteticKingCoords[i].j] == "king"+ending) return true
        }
      }

      return false;
    },

    isCheck: function(fieldState){
      var self = this;
      var ending = "";
      if (this.state.myNumber == 1){
        ending = "_w"
      }
      else if (this.state.myNumber == 2){
        ending = "_b"
      }
      //находим координаты короля
      var king_Coords = {};
      for (var i=0; i<self.state.fieldState.length; i++){
        for (var j=0; j<self.state.fieldState[i].length; j++){
          if (fieldState[i][j] == "king"+ending){
            king_Coords = {
              i: i,
              j: j
            }
            break;
          }
        }
      }
      return this.isZoneUnderAttack(fieldState, king_Coords, this.state.myNumber)
    },

    isMate: function(){
      if (this.isCheck(this.state.fieldState)){
        var cloneObject = function(obj){
          var res = {};
          res = JSON.parse(JSON.stringify(obj));
          return res;
        };
        //составим массив своих фигур с координатами
        var myFigures = [];
        for (var i = 0; i<8; i++){
          for (var j = 0; j<8; j++){
            if (this.isMyFigure(this.state.fieldState[i][j])){
              myFigures.push(
                {
                  i: i,
                  j: j,
                  class: this.state.fieldState[i][j]
                }
              );
            }
          }
        }
        console.log ("my figures:");
        console.log (myFigures);
        //перебор всех вариантов ходов для всех фигур.
        for (var i=0; i<myFigures.length; i++){
          var fromP = myFigures[i];
          for (var x=0; x<8; x++){
            for (var y=0; y<8; y++){
              var toP = {
                class: this.state.fieldState[x][y],
                i: x,
                j: y
              };
              var turnPossibleResult = this.isTurnPossible(fromP, toP);
              var tmpFieldState = null;
              tmpFieldState = cloneObject(this.state.fieldState);
              //проверка возможности хода
              if (turnPossibleResult){
                if (typeof(turnPossibleResult == 'object')){
                  //рокировка. Нельзя при шахе
                }

                tmpFieldState[fromP.i][fromP.j] = "empty";

                if (turnPossibleResult == "queen_w")
                {
                  tmpFieldState[toP.i][toP.j] = "queen_w";
                }
                else if (turnPossibleResult == "queen_b") {
                  tmpFieldState[toP.i][toP.j] = "queen_b";
                }
                else {
                  tmpFieldState[toP.i][toP.j] = fromP.class;
                }
                console.log("turnPossibleResult");
                console.log(turnPossibleResult);
                console.log(fromP);
                console.log(toP);
                if (!this.isCheck(tmpFieldState)){
                  return false;
                }
              }
            }
          }
        }
        return true;
      }
    },

    isTurnPossible: function(selectedFigure, placeToMove){
      var result = false;
      var opponentAttacked = function(){
        var s = selectedFigure.class[selectedFigure.class.length-1];
        if (s == "b"){
          if (whiteFigures.indexOf(placeToMove.class) != -1){
            result = true
          }
          else {
            result = false
          }
        }
        if (s == "w"){
          if (blackFigures.indexOf(placeToMove.class) != -1){
            result = true
          }
          else {
            result = false
          }
        }
        return result;
      };
      var blackFigures = ["rook_b","knight_b","bishop_b","king_b","queen_b","pawn_b"];
      var whiteFigures = ["rook_w","knight_w","bishop_w","king_w","queen_w","pawn_w"];
      switch (selectedFigure.class) {
        case "pawn_w":
          if ((selectedFigure.i == placeToMove.i) && (selectedFigure.j == placeToMove.j-1) && (placeToMove.class == "empty")){
            result = true;
            //в дамки
            if (placeToMove.j == 7) result = "queen_w";
          };
          if ((selectedFigure.i == placeToMove.i) && (selectedFigure.j == placeToMove.j-2) && (placeToMove.class == "empty") && (selectedFigure.j == 1)){
            result = true;
          };
          //поедание
          if (((selectedFigure.i == placeToMove.i+1) || (selectedFigure.i == placeToMove.i-1)) && (selectedFigure.j == placeToMove.j-1) && opponentAttacked()){
            result = true;
            //в дамки
            if (placeToMove.j == 7) result = "queen_w";
          };


          break;
        case "pawn_b":
          if ((selectedFigure.i == placeToMove.i) && (selectedFigure.j == placeToMove.j+1) && (placeToMove.class == "empty")){
            result = true;
            //в дамки
            if (placeToMove.j == 0) result = "queen_b";
          };
          if ((selectedFigure.i == placeToMove.i) && (selectedFigure.j == placeToMove.j+2) && (placeToMove.class == "empty") && (selectedFigure.j == 6)){
            result = true;
          };
          //поедание
          if (((selectedFigure.i == placeToMove.i+1) || (selectedFigure.i == placeToMove.i-1)) && (selectedFigure.j == placeToMove.j+1) && opponentAttacked()){
            result = true;
            //в дамки
            if (placeToMove.j == 0) result = "queen_b";
          };
          break;
        case "rook_b":
        case "rook_w":
          var f = true;
          if(selectedFigure.i == placeToMove.i){
            var minJ = Math.min(selectedFigure.j, placeToMove.j);
            var maxJ = Math.max(selectedFigure.j, placeToMove.j);
            if (minJ == maxJ) {
              break;
            }
            for (var j = minJ+1; j < maxJ; j++) {
              if (this.state.fieldState[selectedFigure.i][j] != "empty"){
                f = false;
                break;
              }
            }
          }
          else if(selectedFigure.j == placeToMove.j){
            var minI = Math.min(selectedFigure.i, placeToMove.i);
            var maxI = Math.max(selectedFigure.i, placeToMove.i);
            if (minI == maxI) {
              break;
            }
            for (var i = minI+1; i < maxI; i++) {
              if (this.state.fieldState[i][selectedFigure.j] != "empty"){
                f = false;
                break;
              }
            }
          }
          else {
            f = false;
          }
          if (f){
            if ((placeToMove.class == "empty") || opponentAttacked()){
              result = true;
            };
          }
          break;
        case "knight_b":
        case "knight_w":
          var f = false;
          if(Math.abs(placeToMove.i-selectedFigure.i) == 1){
            if(Math.abs(placeToMove.j-selectedFigure.j) == 2){
              f = true;
            }
          }
          if(Math.abs(placeToMove.i-selectedFigure.i) == 2){
            if(Math.abs(placeToMove.j-selectedFigure.j) == 1){
              f = true;
            }
          }
          if (f){
            if ((placeToMove.class == "empty") || opponentAttacked()){
              result = true;
            };
          }
          break;
        case "bishop_b":
        case "bishop_w":
          /*var f = true;
          if (Math.abs(placeToMove.i-selectedFigure.i) == Math.abs(placeToMove.j-selectedFigure.j)){
            var minJ = Math.min(selectedFigure.j, placeToMove.j);
            var maxJ = Math.max(selectedFigure.j, placeToMove.j);
            var minI = Math.min(selectedFigure.i, placeToMove.i);
            var maxI = Math.max(selectedFigure.i, placeToMove.i);
            for (var j = minJ+1, i = minI+1; j < maxJ; j++, i++) {
              if (this.state.fieldState[i][j] != "empty"){
                f = false;
                break;
              }
            }
            if (f){
              if ((placeToMove.class == "empty") || opponentAttacked()){
                result = true;
              };
            }
          }*/
          var f = true;
          if (Math.abs(placeToMove.i-selectedFigure.i) == Math.abs(placeToMove.j-selectedFigure.j)){
            var i = selectedFigure.i;
            var j = selectedFigure.j;
            var di = (placeToMove.i - selectedFigure.i)/Math.abs(selectedFigure.i - placeToMove.i);
            var dj = (placeToMove.j - selectedFigure.j)/Math.abs(selectedFigure.j - placeToMove.j);
            //alert("i j di dj" + i + " "+ j + " "+ di + " "+ dj + " ");
            for (var a=0; a < Math.abs(selectedFigure.i - placeToMove.i)-1; a++ ){
              i = i+di;
              j = j+dj;
              if (this.state.fieldState[i][j] != "empty"){
                f = false;
                break;
              }
            }
            if (f){
              if ((placeToMove.class == "empty") || opponentAttacked()){
                result = true;
              };
            }
          }
          break;
        case "queen_b":
        case "queen_w":
          var f_b = true;
          var f_r = true;
          //Объединяем ладью и слона
          //Слон
          if (Math.abs(placeToMove.i-selectedFigure.i) == Math.abs(placeToMove.j-selectedFigure.j)){
            var i = selectedFigure.i;
            var j = selectedFigure.j;
            var di = (placeToMove.i - selectedFigure.i)/Math.abs(selectedFigure.i - placeToMove.i);
            var dj = (placeToMove.j - selectedFigure.j)/Math.abs(selectedFigure.j - placeToMove.j);
            //alert("i j di dj" + i + " "+ j + " "+ di + " "+ dj + " ");
            for (var a=0; a < Math.abs(selectedFigure.i - placeToMove.i)-1; a++ ){
              i = i+di;
              j = j+dj;
              if (this.state.fieldState[i][j] != "empty"){
                f_b = false;
                break;
              }
            }
          } else {
            f_b = false;
          }
          //Ладья
          if(selectedFigure.i == placeToMove.i){
            var minJ = Math.min(selectedFigure.j, placeToMove.j);
            var maxJ = Math.max(selectedFigure.j, placeToMove.j);
            if (minJ == maxJ) {
              break;
            }
            for (var j = minJ+1; j < maxJ; j++) {
              if (this.state.fieldState[selectedFigure.i][j] != "empty"){
                f_r = false;
                break;
              }
            }
          } else if(selectedFigure.j == placeToMove.j){
            var minI = Math.min(selectedFigure.i, placeToMove.i);
            var maxI = Math.max(selectedFigure.i, placeToMove.i);
            if (minI == maxI) {
              break;
            }
            for (var i = minI+1; i < maxI; i++) {
              if (this.state.fieldState[i][selectedFigure.j] != "empty"){
                f_r = false;
                break;
              }
            }
          } else {
            f_r = false;
          }
          //alert("f_b: " + f_b + " f_r: " + f_r);
          if (f_b || f_r){
            if ((placeToMove.class == "empty") || opponentAttacked()){
              result = true;
            };
          }
          break;
        case "king_b":
        case "king_w":
          if((Math.abs(placeToMove.i-selectedFigure.i) <= 1) && (Math.abs(placeToMove.j-selectedFigure.j) <= 1)){
            if ((placeToMove.i == selectedFigure.i) && (placeToMove.j == selectedFigure.j)){
              break;
            }
            if ((placeToMove.class == "empty") || opponentAttacked()){
              result = true;
            };
          }
          //Рокировка
          var f = true;
          if((Math.abs(placeToMove.i-selectedFigure.i) == 2) && (Math.abs(placeToMove.j-selectedFigure.j) == 0)){
            if (((placeToMove.i == 6) && (placeToMove.j == 0)) && !this.state.moved.king_w && !this.state.moved.rook_w_r){
              for (var i=5; i<7; i++){
                if(this.state.fieldState[i][0] != "empty"){
                  f = false;
                }
              }
              if (f){
                result = {
                  i: 6,
                  j: 0
                }
              }
            }
            if (((placeToMove.i == 2) && (placeToMove.j == 0)) && !this.state.moved.king_w && !this.state.moved.rook_w_l){
              for (var i=1; i<4; i++){
                if(this.state.fieldState[i][0] != "empty"){
                  f = false;
                }
              }
              if (f){
                result = {
                  i: 2,
                  j: 0
                }
              }
            }


            if (((placeToMove.i == 6) && (placeToMove.j == 7)) && !this.state.moved.king_b && !this.state.moved.rook_b_r){
              for (var i=5; i<7; i++){
                if(this.state.fieldState[i][7] != "empty"){
                  f = false;
                }
              }
              if (f){
                result = {
                  i: 6,
                  j: 7
                }
              }
            }
            if (((placeToMove.i == 2) && (placeToMove.j == 7)) && !this.state.moved.king_b && !this.state.moved.rook_b_l){
              for (var i=1; i<4; i++){
                if(this.state.fieldState[i][7] != "empty"){
                  f = false;
                }
              }
              if (f){
                result = {
                  i: 2,
                  j: 7
                }
              }
            }

          }
          break;

        default:
         result = false;
      }
      return (result);
    },
    clickHandler: function(e){
        //var self = this;
        var cloneObject = function(obj){
          var res = {};
          res = JSON.parse(JSON.stringify(obj));
          return res;
        };
        if (this.state.myTurn){
          if (!this.state.selectedFigure.selected){ //Выделяем фигуру
            var target = e.target;
            var selectedFigure = this.getFieldStateById(target.id);
            //alert (selectedFigure.class + " " + selectedFigure.i + " " + selectedFigure.j)
            if (this.isMyFigure(selectedFigure.class)){
              this.setState({
                selectedFigure: {
                  selected: true,
                  i: selectedFigure.i,
                  j: selectedFigure.j,
                  class: selectedFigure.class
                }
              });
            }
          }
          else{ //перемещаем фигуру
            var target = e.target;
            var placeToMove = this.getFieldStateById(target.id);
            var turnPossibleResult = this.isTurnPossible(this.state.selectedFigure, placeToMove);
            var tmpFieldState = cloneObject(this.state.fieldState);
            //проверка возможности хода
            if (turnPossibleResult){
              if (typeof(turnPossibleResult == 'object')){
                //рокировка. Передвинем ладью
                if ((turnPossibleResult.i == 6) && ((turnPossibleResult.j == 0))){
                  //белая правая
                  tmpFieldState[7][0] = "empty";
                  tmpFieldState[5][0] = "rook_w";
                }
                if ((turnPossibleResult.i == 2) && ((turnPossibleResult.j == 0))){
                  //белая левая
                  tmpFieldState[0][0] = "empty";
                  tmpFieldState[3][0] = "rook_w";
                }
                if ((turnPossibleResult.i == 6) && ((turnPossibleResult.j == 7))){
                  //белая левая
                  tmpFieldState[7][7] = "empty";
                  tmpFieldState[5][7] = "rook_b";
                }
                if ((turnPossibleResult.i == 2) && ((turnPossibleResult.j == 7))){
                  //белая левая
                  tmpFieldState[0][7] = "empty";
                  tmpFieldState[3][7] = "rook_b";
                }
              }
              //Если съели кого-то, то перенесем эту фигуру в зону съеденных
              var lostFigure = null;
              if (placeToMove.class != "empty"){
                lostFigure = placeToMove.class;
                this.props.addLostFigure(lostFigure);
              }

              tmpFieldState[this.state.selectedFigure.i][this.state.selectedFigure.j] = "empty";

              if (turnPossibleResult == "queen_w")
              {
                tmpFieldState[placeToMove.i][placeToMove.j] = "queen_w";
              }
              else if (turnPossibleResult == "queen_b") {
                tmpFieldState[placeToMove.i][placeToMove.j] = "queen_b";
              }
              else {
                tmpFieldState[placeToMove.i][placeToMove.j] = this.state.selectedFigure.class;
              }
              var i = this.state.selectedFigure.i;
              var j = this.state.selectedFigure.j;
              var tmp2 = this.state.moved;
              if((i==0) && (j==0)){
                tmp2.rook_w_l = true;
              }
              if((i==4) && (j==0)){
                tmp2.king_w = true;
              }
              if((i==7) && (j==0)){
                tmp2.rook_w_r = true;
              }
              if((i==0) && (j==7)){
                tmp2.rook_b_l = true;
              }
              if((i==4) && (j==7)){
                tmp2.king_b = true;
              }
              if((i==7) && (j==7)){
                tmp2.rook_b_r = true;
              }
              if (!this.isCheck(tmpFieldState)){
                //отправить свой ход на сервер
                var turnContent = [
                  [this.state.selectedFigure.i,this.state.selectedFigure.j],
                  [placeToMove.i,placeToMove.j]
                ];
                socket.emit('turn done',{playerNumber: this.state.myNumber, field: tmpFieldState, moved: this.state.moved, turnContent: turnContent, lostFigure: lostFigure});
                soundManager.play('turn_finished');

                this.setState({
                  myTurn: false,
                  frameColorClass: "framecolornotmyturn",
                  fieldState: tmpFieldState,
                  moved: tmp2,
                  selectedFigure: {
                    selected: false,
                    i: undefined,
                    j: undefined,
                    class: undefined
                  }
                });
              }
              else {
                var self = this;
                if (!this.timeoutData.timeoutId){
                  this.timeoutData.frameColorClass = self.state.frameColorClass;
                  this.setState({
                    frameColorClass: "framecolorcheck",
                    statusText: "Король в опасности!",
                  });
                }
                else{
                  clearTimeout(this.timeoutData.timeoutId);
                }
                var func = function(){
                  self.timeoutData.timeoutId = null;
                  self.setState({
                    frameColorClass: self.state.myTurn ? self.timeoutData.frameColorClass : self.state.frameColorClass
                  })
                }
                this.timeoutData.timeoutId = setTimeout(func, 1000);
              }


            }
            else{
              //Снять выделение
              if ((this.state.selectedFigure.i == placeToMove.i) && (this.state.selectedFigure.j == placeToMove.j)){
                this.setState({
                  statusText: "Ваш ход!",
                  selectedFigure: {
                    selected: false,
                    i: undefined,
                    j: undefined,
                    class: undefined
                  }
                })
              }
            }
          }




            /*if (this.state.fieldState[target.id-1] == "empty"){
                this.setState({myTurn: false});
                //обновить поле
                var tmp = this.state.fieldState;
                if (this.state.myNumber == 1){
                  tmp[target.id-1] = "x";
                }
                else if (this.state.myNumber == 2){
                  tmp[target.id-1] = "o";
                }
                this.setState({fieldState: tmp})
                //отправить свой ход на сервер
                socket.emit('turn done',{playerNumber: this.state.myNumber, targetId: target.id});
                soundManager.play('turn_finished');
            }*/
        }
        //console.log("fieldState: ");
        //console.log(this.state.fieldState);
    },

    render: function(){
      var self = this;
      function htmlField(){
        //console.log("FIELD STATE:");
        //console.log(self.state.fieldState);
        //console.log("moved:");
        //console.log(self.state.fieldState.moved);
        var result = [];
        var cnt=1;
        var framecnt=100;
        /*var frameColorClass = self.state.myTurn ? "framecolormyturn" : "framecolornotmyturn";
        if (self.isCheck(self.state.fieldState)){
          //alert("check!");
          frameColorClass = "framecolorcheck";
        };*/
        function horizontalFrame(){
          for (var i=0; i<self.state.fieldState[0].length; i++){
            result.push(<div id={framecnt} className={"horizontframe " + self.state.frameColorClass} key={framecnt}>{String.fromCharCode(i+65)}</div>);
            framecnt++;
          }
        };
        function verticalFrame(j){
          result.push(<div id={framecnt} className={"verticalframe " + self.state.frameColorClass} key={framecnt}>{j}</div>);
          framecnt++;
        };
        function cornerFrame(){
          result.push(<div id={framecnt} className={"cornerframe " + self.state.frameColorClass} key={framecnt}></div>);
          framecnt++;
        };
        var selected = "";
        var previousTurnMarked = "";
        //верхняя рамка
        cornerFrame()
        horizontalFrame();
        cornerFrame()
        //поле
        for (var j=self.state.fieldState.length-1; j>-1; j--){
          //боковая рамка
          verticalFrame(j+1);
          for(var i=0; i<self.state.fieldState[j].length; i++){
            if (self.state.selectedFigure.selected){
              if ((self.state.selectedFigure.i == i) && (self.state.selectedFigure.j == j)){
                selected = "selected";
              }
            };
            if (self.state.lastOpponentTurn){
              if (((self.state.lastOpponentTurn[0][0] == i) && (self.state.lastOpponentTurn[0][1] == j)) || ((self.state.lastOpponentTurn[1][0] == i) && (self.state.lastOpponentTurn[1][1] == j))){
                previousTurnMarked = "previousTurnMarked";
              }
            };
            result.push(<div id={cnt} className={self.state.fieldState[i][j]+" "+((i+j) % 2 ? "white" : "black") + " " + selected + " " + previousTurnMarked} key={cnt}></div>);
            cnt++;
            selected = "";
            previousTurnMarked = "";
          }
          //боковая рамка
          verticalFrame(j+1);
        }
        //нижняя рамка
        cornerFrame()
        horizontalFrame();
        cornerFrame()
        return result;
      };
      if (this.state.shown) {

          return (
              <div>

                <div onClick={this.clickHandler}>
                  {htmlField()}
                </div>
                <div>
                  <StatusBar text={this.state.statusText} connectionText={this.state.connectionText} button1={this.state.statusButton1} button2={this.state.statusButton2} buttonsDescriptionText={this.state.buttonsDescriptionText}/>
                </div>
              </div>
          );
      }
      else return <div></div>
  }
});

module.exports = GameField;
