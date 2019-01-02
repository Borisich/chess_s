//Компонент для генерации всех сообщений

var React = require('react');

var Messages = React.createClass({
    render: function(){
        var list = this.props.data.map(function(message,i){
        return  (
                <p className={message.class} key={i}>
                    {message.text}
                </p>
            )
        });
        return (<div>
                {list}
            </div>
        );
    }
});

module.exports = Messages;
