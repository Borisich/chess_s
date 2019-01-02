//Компонент для отображения съеденных фигур

var React = require('react');
var socket = require('../../../../services/socket.js');

var LostFigures = React.createClass({
  getInitialState: function () {
    return {
        shown: false
    };
  },
  componentDidMount: function () {
    var self = this;
    socket.on('game status', function () {
      self.setState({
          shown: true
      });
    });
  },
  whatSideIsFigure: function(figure){
    if (figure[figure.length-1] == "w") return "white";
    if (figure[figure.length-1] == "b") return "black";
    return false;
  },
  render: function(){
    /*console.log("PROPS:");
    console.log(this.props.lostFigures);
    console.log("STATE:");
    console.log(this.state.lostFigures);*/

    if (this.state.shown){
      var lostFigures = this.props.lostFigures;

      var lastIndexWhite = 0;
      var lastIndexBlack = 0;
      for (var i=0; i<lostFigures.length; i++){
        if (this.whatSideIsFigure(lostFigures[i]) == "black") lastIndexBlack = i;
        if (this.whatSideIsFigure(lostFigures[i]) == "white") lastIndexWhite = i;
      }

      var reorderedFigures= [];
      if (this.props.side == 'black'){
        var k = 0;
        for (var i=0; i<lostFigures.length; i++){
          if (this.whatSideIsFigure(lostFigures[i]) == "black"){
            if (k < 5) {
              reorderedFigures[3*k+2] = lostFigures[i];
              if (i == lastIndexBlack) lastIndexBlack = 3*k+2;
            }
            if ((k > 4) && (k < 10)) {
              reorderedFigures[3*k-14] = lostFigures[i];
              if (i == lastIndexBlack) lastIndexBlack = 3*k-14;
            }
            if (k > 9) {
              reorderedFigures[3*k-30] = lostFigures[i];
              if (i == lastIndexBlack) lastIndexBlack = 3*k-30;
            }
            k++;
          }
        }
      }

      if (this.props.side == 'white'){
        var k = 0;
        for (var i=0; i<lostFigures.length; i++){
          if (this.whatSideIsFigure(lostFigures[i]) == "white"){
            if (k < 5) {
              reorderedFigures[12-3*k] = lostFigures[i];
              if (i == lastIndexWhite) lastIndexWhite = 12-3*k;
            }
            if ((k > 4) && (k < 10)) {
              reorderedFigures[28-3*k] = lostFigures[i];
              if (i == lastIndexWhite) lastIndexWhite = 28-3*k;
            }
            if (k > 9) {
              reorderedFigures[44-3*k] = lostFigures[i];
              if (i == lastIndexWhite) lastIndexWhite = 44-3*k;
            }
            k++;
          }
        }
      }
      var divArray = [];
      var cls = "";
      var markedClass = "";
      for (var i=0; i<15; i++){
        if(this.props.lastMarked && (((this.props.side == "black") && (i == lastIndexBlack)) || ((this.props.side == "white") && (i == lastIndexWhite))) ){
            markedClass = "lostFigureMarked ";
        }
        cls = "lostfigureframe "+ markedClass + reorderedFigures[i]
        markedClass = "";
        divArray.push(
          <div className={cls} key={i}></div>
        );
      }
      return  (
              <div>
                {divArray}
              </div>
            )
    }
    else return null;
  }
});

module.exports = LostFigures;
