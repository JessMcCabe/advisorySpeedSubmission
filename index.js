// Use Blynk to get the GPS co-ordinates
var Blynk = require("blynk-library");

// Send data to WIA to analyse
var wia = require('wia')('<WIA API KEY>');

// Use SenseHAT to display information to the user
var sense = require("node-sense-hat");
//sense.setRotation(180);
var imu = sense.Imu;
var IMU = new imu.IMU();
const senseHat = require("sense-hat-led");
var AUTH = '<GoogleAPIKey>';
//const fetch = require("node-fetch");
var blynk = new Blynk.Blynk(AUTH);
senseHat.setRotation(0);
//Virtual Pin 4 captures the GPS Co-ordinates
var v4 = new blynk.VirtualPin(4);
// XMLHttpRequest required to send a request to the Google API(s)
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
// Colours that we will use for displaying the speed
var white = [255, 255, 255];
var green = [0, 255, 0];
var orange = [255, 165, 0]
var red = [255, 0, 0];
var colour = [];
//Previous and current lat & lon

var prevTimeStmp;
var currTimeStmp;
var approxSpeed = 0;
var prevCurrLoc = [];
prevCurrLoc[0] = 0; //prevLat
prevCurrLoc[1] = 0; //prevLon
prevCurrLoc[2] = 0; //prevTime
prevCurrLoc[3] = 0; //CurrLat
prevCurrLoc[4] = 0; //CurrLon
prevCurrLoc[5] = 0; //currTime



//Clear the senseHat Display
senseHat.clear();

// When data is captured on V4 log the lat, lon & Speed 
// Speed from Blynk in not accuracte - manually calculate the speed given 2 sets of gps points (or look for a library that can do this more easily)
v4.on('write', function (param) {
   currTimeStmp = Date.now();
   console.log("v4: lat. " + param[0]),
      console.log("v4: lon. " + param[1]),
      console.log("v4: speed. " + param[3])
   var locs = prevCurrLocCal(param[0], param[1], currTimeStmp);
   var millisec = (locs[5] - locs[2]); // 60000 / 60);
   console.log("Previous and current locations are: " + locs[0], locs[1], locs[2], locs[3], locs[4], locs[5]);
   var dist = distance(locs[0], locs[1], locs[3], locs[4], "K");
   console.log("Distance is approx: " + dist);

   approxSpeed = speed(dist, millisec); //dist, prev time , curr time


   /************************************************************************************************ 
    * 
    * HARD CODE VALUES FOR TESTING THE DISPLAY
    * 
    ************************************************************************************************/

   //To test - set the speed to 60KM
   //approxSpeed = 37;


   console.log("Approx speed is: " + approxSpeed);
   //var temp = call to met
   var temp = 3.0; // hard code so we can test the display adjusts appropriately


   /************************************************************************************************ 
       * 
       * HARD CODE VALUES FOR TESTING THE DISPLAY
       * 
       ************************************************************************************************/








   //This section sends the Get request to the opencage API and sends the lat & Lon 

   // Create a request variable and assign a new XMLHttpRequest object to it.
   var request = new XMLHttpRequest()
   //fetch('https://api.opencagedata.com/geocode/v1/json?key=<OPENCAGEAPIKEY>&q=param[0]%2Cparam[1]&pretty=1&no_annotations=1')
   //.then(res => res.json())
   //.then(data => console.log(data.data.results[0].components.road));
   // Open a new connection, using the GET request on the URL endpoint
   request.open('GET', 'https://api.opencagedata.com/geocode/v1/json?key=<OPENCAGEAPIKEY>&q=param[0]%2Cparam[1]&pretty=1&no_annotations=1', true) //asynchronous

   request.onload = function () {
      // Begin accessing JSON data here
      if (request.status == 200) {
         // Success!
         var data = JSON.parse(request.responseText);
         //console.log("Data returned");
         //console.log(data.results[0].components.road)

      } else if (request.status <= 500) {
         // We reached our target server, but it returned an error

         console.log("unable to geocode! Response code: " + request.status);
         var data = JSON.parse(request.responseText);
         console.log(data.status.message);
      } else {
         console.log("server error");
      }

      //console.log(data.results[0].components.road)
      //return data.results[0].components.road;//This is the road we are identified as being on

      var road = data.results[0].components.road
      if (typeof road === 'undefined') {
         road = "Undefined"
      }

      // If temperature is considered low enough to adjust driving speed, then decide what colour range the speed is in
      if (cautionTemp(temp)) {
         //Determine what category colour speed should be in
         //set colour
         console.log("Road is showing as: " + road);
         colour = setColourCondition(approxSpeed, road, temp)
      }
      else {

         colour = green;
      }
      senseHat.showMessage(approxSpeed.toString(), .5, colour, [0, 0, 0]);


   };

   request.onerror = function () {
      // There was a connection error of some sort
      console.log("unable to connect to server");








   };


   // Send request
   request.send()



   wia.locations.publish({
      latitude: param[0],
      longitude: param[1]
   });
   wia.events.publish({
      name: 'speed',
      data: approxSpeed

   });
   wia.events.publish({
      name: 'colour',
      data: colour

   });



   //Publish the data to WIA - update this so we only send certain data to WIA so as not to spam it!



});//end v4 write




function prevCurrLocCal(newLat, newLon, currTimeStmp) {


   //remove first 3 values
   prevCurrLoc.shift();
   prevCurrLoc.shift();
   prevCurrLoc.shift();

   //add new 3 values
   prevCurrLoc.push(newLat);
   prevCurrLoc.push(newLon);
   prevCurrLoc.push(currTimeStmp);

   return prevCurrLoc;
}





// From https://www.geodatasource.com/developers/javascript

function distance(lat1, lon1, lat2, lon2, unit) {
   if ((lat1 == lat2) && (lon1 == lon2)) {
      return 0;
   }
   else {
      var radlat1 = Math.PI * lat1 / 180;
      var radlat2 = Math.PI * lat2 / 180;
      var theta = lon1 - lon2;
      var radtheta = Math.PI * theta / 180;
      var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
      if (dist > 1) {
         dist = 1;
      }
      dist = Math.acos(dist);
      dist = dist * 180 / Math.PI;
      dist = dist * 60 * 1.1515;
      if (unit == "K") { dist = dist * 1.609344 }
      if (unit == "N") { dist = dist * 0.8684 }
      return dist
   }
}

function speed(dist, millisecs) {

   var speed;

   var distance = dist;

   console.log("seconds in the speed function is " + millisecs);
   var seconds = 0;
   seconds = (millisecs / 1000)

   var mins = seconds / 60

   var hours = mins / 60


   console.log("Distance is - " + distance);

   speed = distance / hours;
   console.log("Calculated Km/hr is: " + Math.round(speed));

   if (Number.isNaN(speed)) {
      return 0;
   }
   else
      return Math.round(speed);
}

function cautionTemp(temp) {
   var caution = false;
   if (temp <= 4.0) {
      caution = true;
   }
   return caution;
}


//Only based on cautionary Temp so far
function setColourCondition(approxSpeed, road, temp) {
   var colour;
   //
   var roadType = determineRoadType(road);
   // Motorways
   if (roadType === 'Motorway') {

      if (approxSpeed >= 80) {
         colour = red;
      }
      else if (approxSpeed <= 79 && approxSpeed >= 50) {
         colour = orange;
      }
      else if (approxSpeed <= 49) {
         colour = green;
      }
   }
   else if (roadType === 'National') {

      if (approxSpeed >= 80) {
         colour = red;
      }
      else if (approxSpeed <= 79 && approxSpeed >= 50) {
         colour = orange;
      }
      else if (approxSpeed <= 49) {
         colour = green;
      }
   }
   else if (roadType === 'Regional') {

      if (approxSpeed >= 70) {
         colour = red;
      }
      else if (approxSpeed <= 69 && approxSpeed >= 60) {
         colour = orange;
      }
      else if (approxSpeed <= 49) {
         colour = green;
      }
   }
   else if (roadType === 'Local') {

      if (approxSpeed >= 70) {
         colour = red;
      }
      else if (approxSpeed <= 69 && approxSpeed >= 60) {
         colour = orange;
      }
      else if (approxSpeed <= 49) {
         colour = green;
      }
   }
   else if (roadType === 'Undefined') {

      if (approxSpeed >= 60) {
         colour = red;
      }
      else if (approxSpeed <= 59 && approxSpeed >= 40) {
         colour = orange;
      }
      else if (approxSpeed <= 39) {
         colour = green;
      }
   }
   return colour;
}


function determineRoadType(road) {
   var roadID = road.charAt(0);

   switch (roadID) {
      case 'N':
         roadType = "National";
         break;
      case 'M':
         roadType = "Motorway";
         break;
      case 'L':
         roadType = "Local";
         break;
      case 'R':
         roadType = "Regional";
         break;
      case 'U':
         roadType = "Undefined";
         break;
      default:
         roadType = "Undefined";
   }

   return roadType;
}

wia.stream.connect();
