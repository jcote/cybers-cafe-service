var server = require('http').createServer();
var io = require('socket.io')(server);
var config = require('./config');
const async = require('async');
const sqlRecord = require('./entities/records-cloudsql');
const mathUtils = require('./scripts/mathutils');

function getModel () {
  return require('./entities/model-' + config.get('DATA_BACKEND'));
}

var players = [];
const timeoutInMs = 60000;

function Player (id) {
    this.id = id;
    this.location = [0, 0]; // in tile addressed by $(x, z) \in Z x Z$
    this.position = [0, 0, 0]; // in space position relative to location tile center
    this.timestamp = Date.now();
}

function emitExpect (socket, count) {
    socket.emit('expect', count);
}

function emitAsset (socket, asset) {
    var data = {};
    data.asset = asset;            
    socket.emit('addAsset', data);
    console.log('emit asset ' + asset.id);
//    console.log(asset);
}

function emitEntity (socket, entity, entityRecord) {
    entity.objectId = entity.id;
    entity.id = entityRecord.id;
    entity.location = [ entityRecord.locX, entityRecord.locZ ];
    entity.position = [ entityRecord.posX, entityRecord.posY, entityRecord.posZ ];
    entity.rotation = [ entityRecord.rotX, entityRecord.rotY, entityRecord.rotZ ];
    entity.scale = [ entityRecord.sclX, entityRecord.sclY, entityRecord.sclZ ];
    var data = {};
    data.entity = entity;
    socket.emit('addEntity', data);
    console.log('emit entity ' + entity.id);
//    console.log(entity);
}

function emitAssetsAndEntity(socket, entityRecord, cb) {
  emitExpect(socket, entityRecord.assetIds.length);
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

// locationPair specifies the center tile for querying entities
// locationIngressPair specifies what side the player entered from so that it can determine
//                     what entities have already been transmitted, ex: 
//  ________
// [  |  | x]  locationPair        := o (locX,locZ)
// [  | o|  ]  locationIngressPair := x (1,1)
// [__|__|__]
//
// intersection is removed from the locationPair bounding box
// range specifies the size of bounding boxes
function relayAssetsAndEntities(socket, locationPair, locationIngressPair, range, callback) {
    var [locX, locZ] = locationPair;
    // TODO: use locationIngressPair to compute smaller bounding box(es)
    // TODO: use token
    sqlRecord.listEntityRecords(
            locX - range, 
            locX + range, 
            locZ - range, 
            locZ + range, 
            50, null, function (err, entities, hasMore) {
        if (err) {
          console.log("sql entity list error: " + err);
          return callback(err);
        }
        
        emitExpect(socket, Object.keys(entities).length);

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
        // TODO: Place new players in somewhat random location
        //       CLuster into 'happening' spots
        socket.emit ('playerData', {id: idNum, players: players});
        socket.broadcast.emit ('playerJoined', newPlayer);

        // Transmit entities and assets in range
        var locationPair = [0, 0];
        relayAssetsAndEntities(socket, locationPair, null, 2, function(err) {
            if (err) {
                console.log("Relay error: " + err);
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
        if (data.id in players) {
            players[data.id].location = data.location;
            players[data.id].position = data.position;
            players[data.id].timestamp = Date.now();
            if (players[data.id].deleted) {
                console.log("Player rejoined (" + data.id + ")");
                socket.broadcast.emit ('playerJoined', players[data.id]);
                delete players[data.id].deleted;
            }
            socket.broadcast.emit ('playerMoved', data); // TODO: purify 'data' before transmitting
        }
    });

    socket.on('locationUpdate', function (data) {
      // get tile select info & store by movement (known x,y) or by name (known)
      // send new neighbor tile info
      // send new entities
      
        // Transmit entities and assets in range
        relayAssetsAndEntities(socket, data.location, null, 2, function(err) {
            if (err) {
                return err;
            }
        });
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
try {
    server.listen(59595);
} catch (err) {
    console.log("Server error: " + err);
}