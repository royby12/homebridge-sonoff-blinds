var request = require('request');
var Service, Characteristic;

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory('homebridge-sonoff-blinds', 'SonOffBlinds', Sonoffblinds);
}

function Sonoffblinds(log, config){

    this.log            = log; // log file
    this.name           = config["name"];
    this.sonoffURL      = config["sonoffURL"];
    this.UpChannel      = config["UpChannel"];
    this.DownChannel    = config["DownChannel"];
    this.durationUp     = config["time_up"];
    this.durationDown   = config["time_down"];
    this.durationBMU    = config["time_botton_margine_up"]    || 0;
    this.durationBMD    = config["time_botton_margine_down"]  || 0;
    this.timeout        = config["timeout"]                   || 5000;

    this.lastPosition           = 0; // Last know position, (0-100%)
    this.currentPositionState   = 2; // 2 = Stopped , 1=Moving Up , 0=Moving Down.
    this.currentTargetPosition  = 0; //  Target Position, (0-100%)

}


Sonoffblinds.prototype = {
    getCurrentPosition : function(callback) {
      this.log("Requested CurrentPosition: %s", this.lastPosition);
      callback(null, this.lastPosition);
    },

    getPositionState : function(callback) {
      this.log("Requested PositionState: %s", this.currentPositionState);
      callback(null, this.currentPositionState);
    },

    getTargetPosition : function(callback) {
      this.log("Requested TargetPosition: %s", this.currentTargetPosition);
      callback(null, this.currentTargetPosition);
    },

    setTargetPosition : function(pos, callback) {

    this.log("Setting target position to %s", pos);
    if (this.currentPositionState != 2) {
      this.log("Blinds are moving. You need to wait. I will do nothing.");
      callback();
      return false;
    }

    if (this.currentPosition == pos) {
      this.log("Current position already matches target position. There is nothing to do.");
      callback();
      return true;
    }

    this.currentTargetPosition = pos;
    moveUp = (this.currentTargetPosition > this.lastPosition);

    var withoutmarginetimeUP;
    var withoutmarginetimeDOWN;
    var duration;
    var onRequestURL;
    withoutmarginetimeUP=this.durationUp-this.durationBMU;
    withoutmarginetimeDOWN=this.durationDown-this.durationBMD;

    if (moveUp) {
      //http://<ip>/cm?cmnd=Power%20On
      onRequestURL = "http://" + this.sonoffURL + "/cm?cmnd=Power" + this.UpChannel + "%20On";
      if(this.lastPosition==0){
           duration = ((this.currentTargetPosition - this.lastPosition) / 100 * withoutmarginetimeUP)+this.durationBMU;
      }
      else{
           duration = (this.currentTargetPosition - this.lastPosition) / 100 * withoutmarginetimeUP;
      }
    }
    else {
      onRequestURL = "http://" + this.sonoffURL + "/cm?cmnd=Power" + this.DownChannel + "%20On";
      if(this.currentTargetPosition==0){
           duration = ((this.lastPosition-this.currentTargetPosition) / 100 * withoutmarginetimeDOWN)+this.durationBMD;
      }else
      {
           duration = (this.lastPosition-this.currentTargetPosition) / 100 * withoutmarginetimeDOWN;
      }
    }

    this.log("Duration: %s ms", duration);
    this.log(moveUp ? "Moving up" : "Moving down");
    this.blindsService.setCharacteristic(Characteristic.PositionState, (moveUp ? 1 : 0));
    this.currentPositionState = (moveUp ? 1 : 0);

    setTimeout(this.setFinalBlindsState.bind(this), duration);
    this.httpRequest(onRequestURL);
    clearTimeout(this.duration);
    callback();

    return true;
    },

    setFinalBlindsState : function() {

    var offRequestURL;
    if (moveUp) {
      offRequestURL = "http://" + this.sonoffURL + "/cm?cmnd=Power" + this.UpChannel + "%20Off";
    }
    else {
      offRequestURL = "http://" + this.sonoffURL + "/cm?cmnd=Power" + this.DownChannel + "%20Off";
    }
    this.httpRequest(offRequestURL);
    this.currentPositionState = 2;
    this.blindsService.setCharacteristic(Characteristic.PositionState, 2);
    this.blindsService.setCharacteristic(Characteristic.CurrentPosition, this.currentTargetPosition);
    this.lastPosition = this.currentTargetPosition;
    this.log("Successfully moved to target position: %s", this.currentTargetPosition);
    return true;
    },

    //Built-in function to start pin on sonoff and start the procedure of lifting or lowering the blinds
    httpRequest: function (url, body, method, callback) {
		var callbackMethod = callback;
		this.log("Sending API to:", url);
		request({
			url: url,
			body: body,
			method: method,
			timeout: this.timeout,
			rejectUnauthorized: false
			},
			function (error, response, responseBody) {
				if (callbackMethod) {
					callbackMethod(error, response, responseBody);
				}
				else {
					//this.log("callbackMethod not defined!");
				}
			})
	},

    getServices: function() {
        var that = this;

        var informationService = new Service.AccessoryInformation();

        informationService
            .setCharacteristic(Characteristic.Manufacturer, "ROYBY12 BLINDS")
            .setCharacteristic(Characteristic.Model, "SonOff Blinds")
            .setCharacteristic(Characteristic.SerialNumber, "Version 1.0.0");

        this.blindsService = new Service.WindowCovering(this.name);

        // Retrieve current position (0-100)
        this.blindsService.getCharacteristic(Characteristic.CurrentPosition)
                .on('get', this.getCurrentPosition.bind(this));

        // Detecting status positions, paused, lifting and lowering
        // 0 = Downhill; 1 = Lift; 2 = Stopped;
        this.blindsService.getCharacteristic(Characteristic.PositionState)
                .on('get', this.getPositionState.bind(this));

        // Retrieve or Set Target Positions (0-100)
        this.blindsService.getCharacteristic(Characteristic.TargetPosition)
                .on('get', this.getTargetPosition.bind(this))
                .on('set', this.setTargetPosition.bind(this));

        return [this.blindsService];
    }
}
