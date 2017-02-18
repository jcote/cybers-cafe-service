var server = require('http').createServer();
var io = require('socket.io')(server);
var config = require('./config');
const async = require('async');
const sqlRecord = require('./entities/records-cloudsql');

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

function emitAsset (socket, asset) {
    var data = {};
    data.asset = asset;            
    socket.emit('addAsset', data);
    console.log('emit asset ' + asset.id);
}

function emitEntity (socket, entity) {
    var data = {};
    data.entity = entity;
    socket.emit('addEntity', data);
    console.log('emit entity ' + entity.id);
}

function emitAssetsAndEntity(socket, entityRecord, cb) {
  // read & send dependent assets for entity record
  async.each(entityRecord.assetIds, function(assetId, callback) {    
    getModel().read('Asset', assetId, function (err, asset) {
        if (err) {
            console.log("db asset read error: " + err);
            callback(err);
        }
        if (asset) {
          emitAsset(socket, asset);
        }
        callback();
    });
  }, function(err, results) {
    if (err) {
        console.log('error reading assets: ' + err);
        return cb(err);
    }
    // after all its assets have transmitted
    // read & transmit the entity
    getModel().read('Entity', entityRecord.objectId, function(err, entity) {
        if (entity) {
          entity.objectId = entity.id;
          entity.id = entityRecord.id;
          emitEntity(socket, entity);
        }
        cb();
    });
  });
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
            sqlRecord.listEntityRecords(point, 10, 10, null, function (err, entities, hasMore) {
                if (err) {
                  console.log("db entity list error: " + err);
                  return err;
                }

                async.each(Object.keys(entities), function(key, cb) {
                  var entityRecord = entities[key];
                  if (entityRecord.assetIds.length == 0) {
                    getModel().read('Entity', entityRecord.objectId, function(err, entity) {
                        if (entity) {
                          emitEntity(socket, entity);
                        }
                        cb();
                    });
                  } else {
                    emitAssetsAndEntity(socket, entityRecord, cb);
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