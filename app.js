var server = require('http').createServer();
var io = require('socket.io')(server);

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
        2.5,
        5
    ],
    "scale": [
        1,
        1,
        1
    ],
    "name": "Box",
    "parent": "e8ae4254-6751-11e5-bd2a-8438356164ca",
    "resource_id": "877bfc38-a779-11e6-8e09-22000ac481df",
    "components": {
        "model": {
            "lightMapSizeMultiplier": 1,
            "castShadows": true,
            "castShadowsLightmap": true,
            "lightmapped": false,
            "materialAsset": 5816460,
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

var assets = {
    "5816460": {
        "tags": [],
        "name": "New Material",
        "revision": 1,
        "preload": true,
        "meta": null,
        "data": {
            "shader": "blinn",
            "ambient": [
                0,
                0,
                0
            ],
            "ambientTint": false,
            "aoMap": null,
            "aoMapVertexColor": false,
            "aoMapChannel": "r",
            "aoMapUv": 0,
            "aoMapTiling": [
                1,
                1
            ],
            "aoMapOffset": [
                0,
                0
            ],
            "occludeSpecular": 1,
            "diffuse": [
                1,
                1,
                1
            ],
            "diffuseMap": 5816484,
            "diffuseMapVertexColor": false,
            "diffuseMapChannel": "rgb",
            "diffuseMapUv": 0,
            "diffuseMapTiling": [
                1,
                1
            ],
            "diffuseMapOffset": [
                0,
                0
            ],
            "diffuseMapTint": false,
            "specular": [
                0.23,
                0.23,
                0.23
            ],
            "specularMapVertexColor": false,
            "specularMapChannel": "rgb",
            "specularMapUv": 0,
            "specularMap": 0,
            "specularMapTiling": [
                1,
                1
            ],
            "specularMapOffset": [
                0,
                0
            ],
            "specularMapTint": false,
            "specularAntialias": true,
            "useMetalness": false,
            "metalnessMap": 0,
            "metalnessMapVertexColor": false,
            "metalnessMapChannel": "r",
            "metalnessMapUv": 0,
            "metalnessMapTiling": [
                1,
                1
            ],
            "metalnessMapOffset": [
                0,
                0
            ],
            "metalnessMapTint": false,
            "metalness": 1,
            "conserveEnergy": true,
            "shininess": 32,
            "glossMap": 0,
            "glossMapVertexColor": false,
            "glossMapChannel": "r",
            "glossMapUv": 0,
            "glossMapTiling": [
                1,
                1
            ],
            "glossMapOffset": [
                0,
                0
            ],
            "fresnelModel": 0,
            "fresnelFactor": 0,
            "emissive": [
                0,
                0,
                0
            ],
            "emissiveMap": 0,
            "emissiveMapVertexColor": false,
            "emissiveMapChannel": "rgb",
            "emissiveMapUv": 0,
            "emissiveMapTiling": [
                1,
                1
            ],
            "emissiveMapOffset": [
                0,
                0
            ],
            "emissiveMapTint": false,
            "emissiveIntensity": 1,
            "normalMap": 0,
            "normalMapTiling": [
                1,
                1
            ],
            "normalMapOffset": [
                0,
                0
            ],
            "normalMapUv": 0,
            "bumpMapFactor": 1,
            "heightMap": 0,
            "heightMapChannel": "r",
            "heightMapUv": 0,
            "heightMapTiling": [
                1,
                1
            ],
            "heightMapOffset": [
                0,
                0
            ],
            "heightMapFactor": 1,
            "alphaTest": 0,
            "opacity": 1,
            "opacityMap": 0,
            "opacityMapVertexColor": false,
            "opacityMapChannel": "r",
            "opacityMapUv": 0,
            "opacityMapTiling": [
                1,
                1
            ],
            "opacityMapOffset": [
                0,
                0
            ],
            "reflectivity": 1,
            "refraction": 0,
            "refractionIndex": 0.6666666666666666,
            "sphereMap": 0,
            "cubeMap": 0,
            "cubeMapProjection": 0,
            "cubeMapProjectionBox": {
                "center": [
                    0,
                    0,
                    0
                ],
                "halfExtents": [
                    0.5,
                    0.5,
                    0.5
                ]
            },
            "lightMap": 5816484,
            "lightMapVertexColor": false,
            "lightMapChannel": "rgb",
            "lightMapUv": 1,
            "lightMapTiling": [
                1,
                1
            ],
            "lightMapOffset": [
                0,
                0
            ],
            "depthTest": true,
            "depthWrite": true,
            "cull": 1,
            "blendType": 3,
            "shadowSampleType": 1,
            "useFog": true,
            "useLighting": true,
            "useSkybox": true,
            "useGammaTonemap": true
        },
        "type": "material",
        "file": null,
        "region": "eu-west-1",
        "id": "5816460"
    },
    "5816484": {
        "tags": [],
        "name": "1478204423322s.jpg",
        "revision": 1,
        "preload": true,
        "meta": {
            "compress": {
                "alpha": false,
                "dxt": false,
                "pvr": false,
                "pvrBpp": 4,
                "etc1": false
            },
            "format": "jpeg",
            "type": "TrueColor",
            "width": 256,
            "height": 256,
            "alpha": false,
            "depth": 8,
            "srgb": true,
            "interlaced": false
        },
        "data": {
            "addressu": "repeat",
            "addressv": "repeat",
            "minfilter": "linear_mip_linear",
            "magfilter": "linear",
            "anisotropy": 1,
            "rgbm": false,
            "mipmaps": true
        },
        "type": "texture",
        "file": {
            "filename": "1478204423322s.jpg",
            "hash": "0bb52b8f8aba81c88b889953eee80d65",
            "size": 6327,
            "variants": {},
            "url": "files/assets/5816484/1/1478204423322s.jpg"
        },
        "region": "eu-west-1",
        "id": "5816484"
    }
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
        if (players[data.id]) {
            players[data.id].x = data.x;
            players[data.id].y = data.y;
            players[data.id].z = data.z;
        }
        socket.broadcast.emit ('playerMoved', data);
    });

    socket.on ('getEntity', function () {
        for (id in assets) {
            var data = {};
            data.asset = assets[id];            
            socket.emit('addAsset', data);
            console.log('emit asset');
        }

        var data = {};
        data.entity = entity;
        socket.emit('addEntity', data);
        console.log('emit entity');
    });
});

console.log ('Server listening on port 59595.');
server.listen(59595);