//Компонент для отображения съеденных фигур

var React = require("react");
var socket = require("../../../services/socket.js");

var LostFigures = React.createClass({
  getInitialState: function() {
    return {
      shown: false
    };
  },
  componentDidMount: function() {
    var self = this;
    socket.on("game status", function() {
      self.setState({
        shown: true
      });
    });
  },
  whatSideIsFigure: function(figure) {
    if (figure[figure.length - 1] == "w") return "white";
    if (figure[figure.length - 1] == "b") return "black";
    return false;
  },
  render: function() {
    if (this.state.shown) {
      var lostFigures = this.props.lostFigures;

      const figuresToDisplay = [];

      for (var i = 0; i < lostFigures.length; i++) {
        if (this.whatSideIsFigure(lostFigures[i]) == this.props.side) {
          figuresToDisplay.push(lostFigures[i]);
        }
      }

      var divArray = [];

      figuresToDisplay.forEach((f, i) => {
        const isLast = i === figuresToDisplay.length - 1;
        const lastMarkedClass =
          isLast && this.props.lastMarked ? "lostFigureMarked" : "";
        divArray.push(
          <div className={`lostfigureframe ${f} ${lastMarkedClass}`} key={i} />
        );
      });

      return <div>{divArray.reverse()}</div>;
    } else {
      return null;
    }
  }
});

module.exports = LostFigures;
