var e131 = require('e131')

var server = new e131.Server([1])

var cameraStartAddresses = [1];



// Struct Generator
const Struct = (...keys) => ((...v) => keys.reduce((o, k, i) => {o[k] = v[i]; return o}, {}));

// this.parseSACNData();
server.on('listening', function() {
  console.log('server listening on port %d, universes %j', this.port, this.universes);
});
server.on('packet', function (packet) {
  var sourceName = packet.getSourceName();
  var sequenceNumber = packet.getSequenceNumber();
  var universe = packet.getUniverse();
  var slotsData = packet.getSlotsData();
  
  cameraStartAddresses.forEach((camera) => {
        cameras[camera] = Camera(slotsData.slice(camera-1,camera+4));
        console.dir(cameras);
    });
 
//   console.log('source="%s", seq=%d, universe=%d, slots=%d',
    // sourceName, sequenceNumber, universe, slotsData.length);
//   console.log('slots data = %s', slotsData.toString('hex'));
});


var Camera = Struct("pan","tilt","zoom","focus","iris");

    
var cameras = [];
// cameraStartAddresses.forEach((camera) => {
//         cameras[camera] = Camera(slotsData.slice(camera-1,camera+4));
//         console.dir(camera);
//     });
// var fixture = {
//     "pan": 0,
//     "tilt": 0,
//     "zoom": 0,
//     "focus": 0,
//     "iris": 0
// }
// function parsesACNData(slotsData) {
