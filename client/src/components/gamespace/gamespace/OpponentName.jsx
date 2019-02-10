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
            document.title = name ? `${name} - Chess game - ${document.URL}` : document.URL;
            self.setState({
                opponentName: name,
                changesSaved: true,
            });
        });
    },

    submitForm: function(e){
        var self = this;
        e.preventDefault();
        socket.emit('opponent name', self.state.opponentName);

        socket.once('opponent name dilivered to server', function(){
            console.log('DELIVERED')
            self.setState({
                changesSaved: true,
            });
            document.getElementById('opponentname').blur();
            document.title = self.state.opponentName ? `${self.state.opponentName} - Chess game - ${document.URL}` : document.URL;
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
            <div className='opponentNameContainer'>
                <span
                    style={{
                        marginRight: '5px',
                        color: 'gray',
                    }}
                >
                    Соперник:
                </span>
                <form onSubmit={this.submitForm} id="chatform">
                    <input
                        style={{
                            borderColor: this.state.changesSaved ? 'unset' : 'orange',
                            outline: 'none',
                        }}
                        spellCheck="false"
                        id="opponentname" 
                        autoComplete="off" 
                        placeholder="Имя соперника..."
                        value={this.state.opponentName} 
                        onChange={this.handleUserInput}
                    />
                </form>
            </div>
        )
    }
});

module.exports = OpponentName;
