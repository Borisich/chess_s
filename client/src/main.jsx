var React = require('react');
var ReactDOM = require('react-dom');

/*var GameField = require('./components/GameField.jsx');
var Chat = require('./components/Chat.jsx');
var InviteLink = require('./components/InviteLink.jsx');



ReactDOM.render(<GameField/>, document.getElementById("field"));
ReactDOM.render(<Chat/>, document.getElementById("chat"));
ReactDOM.render(<InviteLink/>, document.getElementById("invitelink"));*/
//ReactDOM.render(<StatusBar/>, document.getElementById("status"));

var InviteLink = require('./components/invitelink/InviteLink.jsx');

var GameSpace = require('./components/gamespace/GameSpace.jsx');

ReactDOM.render(<InviteLink/>, document.getElementById("invitelink"));

ReactDOM.render(<GameSpace/>, document.getElementById("gamespace"));
