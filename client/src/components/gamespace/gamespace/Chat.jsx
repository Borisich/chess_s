//компонент чата
var React = require('react');
var Messages = require('./Messages.jsx');

var socket = require('../../../../services/socket.js');

var soundManager = require('../../../../sounds/sounds.js');
var Chat = React.createClass({

    getInitialState: function () {
        return {
            playerNumber: 1,
            shown: false,
            userInput: "",
            messageList: []
        };
    },

    componentDidMount: function () {
        var self = this;
        socket.on('game status', function (gameData) {
            console.log("Игра началась");
            self.setState({
                shown: true,
                playerNumber: gameData.playerNumber,
            });
        });
        socket.on('message',function(text){
            var msg = {
                text: text,
                class: "othermessage"
            };
            var tmp = self.state.messageList;
            tmp.unshift(msg);
            self.setState({
                messageList: tmp
            });
            soundManager.play('new_message');
        });
        
        socket.on('messages',function(messages){
            let messageList = messages.map(messageDBdata => {
                return {
                    text: messageDBdata.message,
                    class: messageDBdata.player === self.state.playerNumber ? "yourmessage" : "othermessage",
                }
            });
            self.setState({
                messageList,
            });
        });
    },


    submitForm: function(e){
        var self = this;
        e.preventDefault();
        socket.emit('message',this.state.userInput);

        self.setState({userInput: ""});
        socket.once('message dilivered to server',function(text){
            var msg = {
                text: text,
                class: "yourmessage"
            };
            var tmp = self.state.messageList;
            tmp.unshift(msg);
            self.setState({
                messageList: tmp
            });
        });
        return false;
    },


    handleUserInput: function(e){
        this.setState({
            userInput: e.target.value
        });
    },

    render: function(){
        if (this.state.shown) {
            return (
                <div>
                    <form onSubmit={this.submitForm} id="chatform">
                        <input id="chatinput" autoComplete="off" autoFocus placeholder="Сообщение..."
                               value={this.state.userInput} onChange={this.handleUserInput}/>
                    </form>
                    <Messages data={this.state.messageList}/>
                </div>
            )
        }
        else
            return <div></div>
    }
});

module.exports = Chat;
