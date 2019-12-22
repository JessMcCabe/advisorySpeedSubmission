# advisorySpeedSubmission
Submission for RaspberryPi IOT Project

Raspberry Pi will run a program written in Javascript. The program is an advisory speed limit display. 

GPS Co-ordinates retreived from BLYNK running on android phone. 
Road data retreived from OpenCage API
Speed & distance calculated within the program based on the GPS co-ordinates retreived from BLYNK.
Advisory speed is calculated based on weather conditions (Not yet Implemented but would be retreived from Met Eireann API) and current road. Speed would then be displayed on the RPi in Red(Dangerous speed), Orange(Ok but not ideal speed)  or Green (Safe speed)

Data then recorded in WIA IOT platform. 

Requirements to run - 

Raspberry Pi run on mobile power source (Power Bank)
Mobile Hotspot for connectivity (Phone and Laptop and RPi to connect to the hotspot)
BLYNK App on Android sending data to RPi
Putty to remotely connect to RPi and run program

- Log in to RPi via putty
- Run Index.js
- Run Blynk

Blynk will send Lat & Lon to program running on the RPi
These will then be sent in a HTTP Get request to the OpenCage API
OpenCage will then return a JSON object
Retrive the Road info from the JSON object
Determine weather condition (currently hard coded and only based on Temperature, in future to request several weather aspects from Met API
Determine advisory speed ranges based on weather and road
Display current speed in Red/Orange or Green. 
Send data to WIA to be recorded


API Keys not included
