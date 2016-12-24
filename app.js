var server = require('http').createServer();
var io = require('socket.io')(server);
var config = require('./config');
const async = require('async');

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

            var point = [newPlayer.x, newPlayer.y, newPlayer.z];
            getModel().list('Entity', 10, null, function (err, entities, cursor) {
                if (err) {
                  console.log("db entity list error: " + err);
                  return err;
                }

                var dependentAssetIds = [];

                for (var key in entities) {
                    var entity = entities[key];
                    if ('assetIds' in entity && Array.isArray(entity.assetIds) && entity.assetIds.length > 0) {
                      dependentAssetIds = dependentAssetIds.concat(entity.assetIds);
                      console.log('added ' + entity.assetIds.length + ' depenent asset ids');
                    }
                }
                
                async.each(dependentAssetIds, function(assetId, callback) {
                    getModel().read('Asset', assetId, function (err, asset) {
                        if (err) {
                            console.log("db asset read error: " + err);
                            callback(err);
                        } else {
                            var data = {};
                            data.asset = asset;            
                            socket.emit('addAsset', data);
                            console.log('emit asset');
                            callback();
                        }
                    });
                  }, function(err, results) {
                    // after all the callbacks
                    if (err) {
                        console.log('error reading assets: ' + err);
                    } else {
                        console.log('done reading assets');
                        for (key in entities) {
                            var entity = entities[key];
                            var data = {};
                            data.entity = entity.entity;
                            socket.emit('addEntity', data);
                            console.log('emit entity');
                        }
                    }
                });            
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