var server = require('http').createServer();
var io = require('socket.io')(server);
var config = require('./config');

function getModel () {
  return require('./entities/model-' + config.get('DATA_BACKEND'));
}

var players = [];

function Player (id) {
    this.id = id;
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.entity = null;
}

io.sockets.on('connection', function(socket) {
    socket.on ('initialize', function () {
            var idNum = players.length;
            var newPlayer = new Player (idNum);
            players.push (newPlayer);

             console.log ('Player joined (' + idNum + ').');

            socket.emit ('playerData', {id: idNum, players: players});
            socket.broadcast.emit ('playerJoined', newPlayer);

            // TODO: prevent field 'id' from being overwritten with google datastore id
            getModel().list('Asset', 10, null, function (err, assets, cursor) {
                if (err) {
                  console.log("db asset list error: " + err);
                  return err;
                }

                for (var key in assets) {
                    var data = {};
                    data.asset = assets[key];            
                    socket.emit('addAsset', data);
                    console.log('emit asset');
                }
            });

            // TODO: prevent field 'id' from being overwritten with google datastore id
            getModel().list('Entity', 10, null, function (err, entities, cursor) {
                if (err) {
                  console.log("db entity list error: " + err);
                  return err;
                }

                for (var key in entities) {
                    var data = {};
                    data.entity = entities[key];
                    socket.emit('addEntity', data);
                    console.log('emit entity');
                }
            });
    });

    socket.on ('positionUpdate', function (data) {
        if (players[data.id]) {
            players[data.id].x = data.x;
            players[data.id].y = data.y;
            players[data.id].z = data.z;
        }
        socket.broadcast.emit ('playerMoved', data);
    });

});

console.log ('Server listening on port 59595.');
server.listen(59595);