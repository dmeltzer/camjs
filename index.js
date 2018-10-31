var e131 = require('e131')

var _ = require('underscore');

let axios = require('axios');
var server = new e131.Server({
  universe: 1,
  port: 5568,
  ip: '10.200.60.81'
});

var cameraIPS = [
  {
    'ip': '10.200.36.104',
    'startAddress': 1
  }
]

class Camera {
  constructor(ip, startAddress) {
    this.ip = ip;
    this.startAddress = startAddress;
    this.pan = [0,0];
    this.tilt = [0,0];
    this.ptTimeout = false;

    this.timerCount = setInterval(function() {this.clearTimers()}.bind(this), 130);
  }

  get startAddress() {
    return this.dmxAddress;
  }

  clearTimers() {
    this.timeOut = false;
  }
  set startAddress(address) {
    this.dmxAddress = address;
  }
  updatePosition(data) {
    if(this.timeOut) {
      return;
    }
    this.timeOut = true;
    let newPan = [data[0],data[1]];
    let newTilt = [data[2],data[3]];
    let newZoom = data[4];
    let newFocus = data[5];
    let newIris = data[6];

    if(this.pan[0] != newPan[0]
      || this.pan[1] != newPan[1]
      || this.tilt[0] != newTilt[0]
      || this.tilt[1] != newTilt[1])
        {
      this.pan = newPan;
      this.tilt = newTilt;
      console.log(newPan);
      this.generatePanTiltUrl(),1300,true;
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
    this.generateUrl(Camera.PTCOMMAND, this.convertTo16Bit(this.pan), this.convertTo16Bit(this.tilt));
  }
  generateFocusUrl() {
    this.generateUrl(Camera.FOCUSCMD, this.clampToStrangeHex(this.focus));
  }
  generateZoomUrl() {
    this.generateUrl(Camera.ZOOMCOMMAND, this.clampToStrangeHex(this.zoom));
  }
  generateIrisUrl() {
    this.generateUrl(Camera.IRISCMD, this.clampToStrangeHex(this.iris));
  }
  generateUrl(commandType, value1, value2 = null) {
    console.log(value1);
    let commandString = commandType.replace('%1', value1)

    if(value2 != null)
      commandString = commandString.replace('%2', value2);
  commandString = encodeURIComponent(commandString);
    let url = Camera.urlScheme.replace('{CAMERA_IP}', this.ip).replace('{COMMAND}', commandString);
    console.log("Would hit this URL: " +url);
    this.sendHTTP(url);
  }

  convertTo16Bit(values) {
    return this.toHex(((( values[0] & 0xff ) << 8) | (values[1] & 0xff)));
  }

  clampToStrangeHex(value) {
    value = (value+1) * 16;
    if( value < 1365)
        value = 1365;
    if( value > 4096)
        value = 4096;
    console.log("strange hex is" +value);
    return  ("000"+(Number(value).toString(16))).slice(-3).toUpperCase()

  }
  async sendHTTP(url) {
    try {
     const response = await axios.get(url);
	// const response = "dummy";
      // console.log(response);
    } catch (error) {
      console.error(error);
    }
  }

  toHex(d) {
    return  ("0000"+(Number(d).toString(16))).slice(-4).toUpperCase()
  }

}

Camera.urlScheme = "http://{CAMERA_IP}/cgi-bin/aw_ptz?cmd={COMMAND}&res=1"
Camera.PTCOMMAND = "#APC%1%2"
Camera.ZOOMCOMMAND = "#AXZ%1"
Camera.FOCUSCMD = "#AXF%1"
Camera.IRISCMD = "#AXI%1"

var cameras = Array();
// this.parseSACNData();
server.on('listening', function() {
  console.log('server listening on port %d, universes %j', this.port, this.universes);
  cameraIPS.forEach((camera) => {
    cameras.push(new Camera(camera.ip, camera.startAddress));
  });
});
server.on('packet', function (packet) {
  var sourceName = packet.getSourceName();
  var sequenceNumber = packet.getSequenceNumber();
  var universe = packet.getUniverse();
  var slotsData = packet.getSlotsData();
  cameras.forEach((camera) => {
    camera.updatePosition(slotsData.slice(camera.startAddress-1,camera.startAddress+6));
  });
});
