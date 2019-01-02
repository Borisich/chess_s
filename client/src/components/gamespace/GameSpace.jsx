//компонент игрового поля.
var React = require('react');

var Chat = require('./gamespace/Chat.jsx');
var LostFigures = require('./gamespace/LostFigures.jsx');
var GameField = require('./gamespace/GameField.jsx');
var socket = require('../../../services/socket.js');

var GameSpace = React.createClass({
  getInitialState: function () {
      return {
        lostFigures: {
                      figures: [],
                      lastMarkedWhite: false,
                      lastMarkedBlack: false
                    }
      };
  },
  componentDidMount: function () {
    var self = this;
    /*this.setState({
      shown: true,
      lostFigures: this.props.lostFigures
    });*/

    socket.on('game status', function (data) {
      //alert ('gameStatus!');
      var lostFigures = [];
      if (data.lostFigures.figures){
        lostFigures = data.lostFigures.figures;
      }
      self.setState({
          lostFigures: {
                        figures: lostFigures,
                        lastMarkedWhite: data.lostFigures.lastMarkedWhite,
                        lastMarkedBlack: data.lostFigures.lastMarkedBlack
                      }
      });
    });
  },
  /*componentDidMount: function () {
      var self = this;
      console.log("STATE SETTED");
      console.log(self.state.lostFigures);
  },*/
  addLostFigure: function (figure){
    var tmp = this.state.lostFigures.figures;
    var lmw = this.state.lostFigures.lastMarkedWhite;
    var lmb = this.state.lostFigures.lastMarkedBlack;
    tmp.push(figure);
    this.setState({
      lostFigures:{
                    figures: tmp,
                    lastMarkedWhite: lmw,
                    lastMarkedBlack: lmb
                  }
    });
  },
  render: function(){
    return (
      <div>
        <div id="lostfiguresblack">
          <LostFigures lostFigures={this.state.lostFigures.figures} lastMarked={this.state.lostFigures.lastMarkedBlack} side='black'/>
        </div>
        <div id="field">
          <GameField addLostFigure={this.addLostFigure}/>
        </div>
        <div id="chat">
          <Chat/>
        </div>
        <div id="lostfigureswhite">
          <LostFigures lostFigures={this.state.lostFigures.figures} lastMarked={this.state.lostFigures.lastMarkedWhite} side='white'/>
        </div>
      </div>
    )
  }
})


module.exports = GameSpace;
