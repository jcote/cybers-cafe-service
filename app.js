var server = require('http').createServer();
var io = require('socket.io')(server);

var assets = [];

var players = [];

function Player (id) {
    this.id = id;
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.entity = null;
}

var entity = {
    "position": [
        0,
        0.5,
        0
    ],
    "scale": [
        1,
        1,
        1
    ],
    "name": "Box",
//    "parent": null, //"e8ae4254-6751-11e5-bd2a-8438356164ca",
    "resource_id": "877bfc38-a779-11e6-8e09-22000ac481df",
    "components": {
        "model": {
            "lightMapSizeMultiplier": 1,
            "castShadows": true,
            "castShadowsLightmap": true,
            "lightmapped": false,
            "materialAsset": null,
            "receiveShadows": true,
            "enabled": true,
            "castShadowsLightMap": false,
            "asset": null,
            "lightmapSizeMultiplier": 1,
            "type": "box",
            "lightMapped": false,
            "isStatic": false
        }
    },
    "rotation": [
        0,
        0,
        0
    ],
    "enabled": true,
    "children": [],
    "tags": []
};


io.sockets.on('connection', function(socket) {
    socket.on ('initialize', function () {
            var idNum = players.length;
            var newPlayer = new Player (idNum);
            players.push (newPlayer);

             console.log ('Player joined (' + idNum + ').');

            socket.emit ('playerData', {id: idNum, players: players});
            socket.broadcast.emit ('playerJoined', newPlayer);
    });

    socket.on ('positionUpdate', function (data) {
            players[data.id].x = data.x;
            players[data.id].y = data.y;
            players[data.id].z = data.z;

        socket.broadcast.emit ('playerMoved', data);
    });

    socket.on ('getEntity', function () {
        var data = {};
        data.entity = entity;
        socket.emit('addEntity', data);
    });
});

console.log ('Server listening on port 59595.');
server.listen(59595);