//компонент имени соперника
var React = require('react');
var Messages = require('./Messages.jsx');

var socket = require('../../../../services/socket.js');

var soundManager = require('../../../../sounds/sounds.js');
var OpponentName = React.createClass({

    getInitialState: function () {
        return {
            opponentName: '',
            changesSaved: false,
        };
    },

    componentDidMount: function () {
        var self = this;
        socket.on('opponent name', function (name) {
            console.log('received:', name);
            self.setState({
                opponentName: name,
                changesSaved: true,
            });
        });
    },


    submitForm: function(e){
        var self = this;
        e.preventDefault();
        socket.emit('opponent name', this.state.opponentName);

        socket.once('opponent name dilivered to server', function(){
            self.setState({
                changesSaved: true,
            });
        });
        return false;
    },


    handleUserInput: function(e){
        this.setState({
            opponentName: e.target.value,
            changesSaved: false,
        });
    },

    render: function(){
        return (
            <div>
                <form onSubmit={this.submitForm} id="chatform">
                    <input id="opponentname" autoComplete="off" placeholder="Имя соперника..."
                           value={this.state.opponentName} onChange={this.handleUserInput}/>
                </form>
            </div>
        )
    }
});

module.exports = OpponentName;
