//Компонент строки состояния
var React = require('react');

var StatusBar = React.createClass({
  handleClickButton1: function(){
    this.props.button1.onClick();
  },
  handleClickButton2: function(){
    this.props.button2.onClick();
  },
  render: function(){
    var button1 = null;
    if (this.props.button1.visible){
      button1 = <button disabled={this.props.button1.disabled} onClick={this.handleClickButton1} >{this.props.button1.text}</button>
    };
    var button2 = null;
    if (this.props.button2.visible){
      button2 = <button disabled={this.props.button2.disabled} onClick={this.handleClickButton2} >{this.props.button2.text}</button>
    };
    return (
      <div>
        {this.props.text} <font color="#F5B1B1">{this.props.connectionText}</font> <br/><br/>
        {this.props.buttonsDescriptionText} <br/>
        {button1} {button2}
      </div>
      )
  }
});

module.exports = StatusBar;
