var e131 = require('e131')

var _ = require('underscore');

var rateLimit = require('function-rate-limit');
let axios = require('axios');
var server = new e131.Server({
  universes: [1],
  ip: '192.168.100.121'
});

var cameraIPS = [
  {
    'ip': '10.200.34.101',
    'startAddress': 1
  }
]

class Camera {
  constructor(ip, startAddress) {
    this.ip = ip;
    this.startAddress = startAddress;
  }

  get startAddress() {
    return this.dmxAddress;
  }

  set startAddress(address) {
    this.dmxAddress = address;
  }
  updatePosition(data) {
    // console.log(data);
    // [this.pan,this.tilt,this.zoom,this.focus,this.iris] = data;
    let newPan = data[0];
    let newTilt = data[1];
    let newZoom = data[2];
    let newFocus = data[3];
    let newIris = data[4];

    
    if(this.pan != newPan || this.tilt != newTilt) {
      this.pan = newPan;
      this.tilt = newTilt;
    console.log(newPan);
      this.generatePanTiltUrl();
    }

    if (this.zoom != newZoom) {
      this.zoom = newZoom;
      this.generateZoomUrl();
    }
    if (this.focus != newFocus) {
      this.focus = newFocus;
      this.generateFocusUrl();
    }
    if (this.iris != newIris) {
      this.iris = newIris;
      this.generateIrisUrl();
    }
  }


  generatePanTiltUrl() {
    this.generateUrl(Camera.PTCOMMAND, this.pan, this.tilt);
  }
  generateFocusUrl() {
    this.generateUrl(Camera.FOCUSCMD, this.focus);
  }
  generateZoomUrl() {
    this.generateUrl(Camera.ZOOMCOMMAND, this.zoom);
  }
  generateIrisUrl() {
    this.generateUrl(Camera.IRISCMD, this.iris);
  }
  generateUrl(commandType, value1, value2 = null) {
    let commandString = commandType.replace('%1', this.toHex(value1))
    
    if(value2 != null)
      commandString = commandString.replace('%2', this.toHex(value2));
    let url = Camera.urlScheme.replace('{CAMERA_IP}', this.ip).replace('{COMMAND}', commandString);
    // console.log("Would hit this URL: " +url);
    this.sendHTTP(url);
  }

  async sendHTTP(url) {
    try {
      const response = await axios.get(url);
      console.log(response);
    } catch (error) {
      console.error(error);
    }
  }

  toHex(d) {
    return  ("0"+(Number(d).toString(16))).slice(-2).toUpperCase()
  }

}

Camera.command_updates = [
  'pantilt',
  'zoom',
  'focus',
  'iris'
];
Camera.urlScheme = "http://{CAMERA_IP}/cgi-bin/aw_ptz?cmd={COMMAND}&res=1"
Camera.PTCOMMAND = "#APC%1%2"
Camera.ZOOMCOMMAND = "#AXZ%1"
Camera.FOCUSCMD = "#AXF%1"
Camera.IRISCMD = "#I%1"

var cameras = Array();
// this.parseSACNData();
server.on('listening', function() {
  console.log('server listening on port %d, universes %j', this.port, this.universes);
  cameraIPS.forEach((camera) => {
    cameras.push(new Camera(camera.ip, camera.startAddress));
    // console.dir(cameras);
});
});
server.on('packet', function (packet) {
  var sourceName = packet.getSourceName();
  var sequenceNumber = packet.getSequenceNumber();
  var universe = packet.getUniverse();
  var slotsData = packet.getSlotsData();
  console.log('Packet');

  limitedCameraUpdates(slotsData);
    
});
 
var limitedCameraUpdates = rateLimit(1,140,function(slotsData) {
  cameras.forEach((camera) => {
    camera.updatePosition(slotsData.slice(camera.startAddress-1,camera.startAddress+4));
  });
});