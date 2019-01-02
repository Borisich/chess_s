//Звуки

var Sm = require('soundmanager2');
var soundManager = Sm.soundManager;


soundManager.setup({
  onready: function(){
    soundManager.createSound({
        id: 'new_message',
        url: '../sounds/new_message.mp3'
    });
    soundManager.createSound({
        id: 'my_turn',
        url: '../sounds/my_turn.mp3'
    });
    soundManager.createSound({
        id: 'turn_finished',
        url: '../sounds/turn_finished.mp3'
    });
    soundManager.createSound({
        id: 'win',
        url: '../sounds/win.mp3'
    });
    soundManager.createSound({
        id: 'loose',
        url: '../sounds/loose.mp3'
    });
    soundManager.createSound({
        id: 'disconnect',
        url: '../sounds/disconnect.ogg'
    });
    soundManager.createSound({
        id: 'pat',
        url: '../sounds/pat.mp3'
    });
  }
});

module.exports = soundManager;
