var server = require('http').createServer();
var io = require('socket.io')(server);
var config = require('./config');
const async = require('async');
const sqlRecord = require('./entities/records-cloudsql');

function getModel () {
  return require('./entities/model-' + config.get('DATA_BACKEND'));
}

var players = [];
const timeoutInMs = 60000;

function Player (id) {
    this.id = id;
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.entity = null;
    this.timestamp = Date.now();
}

function emitAsset (socket, asset) {
    var data = {};
    data.asset = asset;            
    socket.emit('addAsset', data);
    console.log('emit asset ' + asset.id);
}

function emitEntity (socket, entity, entityRecord) {
    entity.objectId = entity.id;
    entity.id = entityRecord.id;
    entity.position = [ entityRecord.posX, entityRecord.posY, entityRecord.posZ ];
    entity.rotation = [ entityRecord.rotX, entityRecord.rotY, entityRecord.rotZ ];
    entity.scale = [ entityRecord.sclX, entityRecord.sclY, entityRecord.sclZ ];
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
            return callback(err);
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
        if (err) {
            console.log("db entity read error: " + err);
            return callback(err);
        }
        if (entity) {
          emitEntity(socket, entity, entityRecord);
        }
        cb();
    });
  });
}

function relayAssetsAndEntities(socket, point, callback) {
    sqlRecord.listEntityRecords(point, 10, 10, null, function (err, entities, hasMore) {
        if (err) {
          console.log("sql entity list error: " + err);
          return callback(err);
        }

        async.each(Object.keys(entities), function(key, cb) {
          var entityRecord = entities[key];
          if (entityRecord.assetIds.length == 0) {
            getModel().read('Entity', entityRecord.objectId, function(err, entity) {
                if (err) {
                    console.log("db entity read error: " + err);
                    return cb(err);
                }
                if (entity) {
                  emitEntity(socket, entity, entityRecord);
                }
                cb();
            });
          } else {
            emitAssetsAndEntity(socket, entityRecord, cb);
          }
        }, function(err, results) {
            if (err) {
                return callback(err);
            }
            callback();
        });                      
    });
};

io.sockets.on('connection', function(socket) {
    // Create new player
    socket.on ('initialize', function () {
        var idNum = players.length;
        var newPlayer = new Player (idNum);
        players.push(newPlayer);

         console.log ('Player joined (' + idNum + ').');

        socket.emit ('playerData', {id: idNum, players: players});
        socket.broadcast.emit ('playerJoined', newPlayer);

        // Transmit entities and assets in range
        var point = [newPlayer.x, newPlayer.y, newPlayer.z];
        relayAssetsAndEntities(socket, point, function(err) {
            if (err) {
                return err;
            }
        });
    });

    socket.on ('ping', function(id) {
        if (players[id]) {
            players[id].timestamp = Date.now();
        }
    });

    // Move players
    socket.on ('positionUpdate', function (data) {
        if (players[data.id]) {
            players[data.id].x = data.x;
            players[data.id].y = data.y;
            players[data.id].z = data.z;
            players[data.id].timestamp = Date.now();
            if (players[data.id].deleted) {
                console.log("Player rejoined (" + data.id + ")");
                socket.broadcast.emit ('playerJoined', players[data.id]);
                delete players[data.id].deleted;
            }
        }
        socket.broadcast.emit ('playerMoved', data);
    });

    // Remove stale players
    setInterval(function() {
        currentTimeInMs = Date.now();
        for (var i = 0; i < players.length; i++) {
            if (players[i].deleted) {
                continue;
            }
            if ((currentTimeInMs - players[i].timestamp) > timeoutInMs) {
                players[i].deleted = true;
                socket.broadcast.emit ('playerDropped', players[i].id);
                console.log("Player removed (" + players[i].id + ")");
            }
        }
    }, 5000);

    socket.on('error', function(err) {
        console.log("Socket error: " + err);
    });
});

console.log ('Server listening on port 59595.');
server.listen(59595);