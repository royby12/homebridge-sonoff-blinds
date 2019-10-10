# homebridge-sonoff-blinds

#### Homebridge plugin to control Blinds with Tasmota firmware.

## Installation

1. Install [homebridge](https://github.com/nfarina/homebridge#installation-details).

2. Install the Plugin
 ```
sudo npm install -g git+https://github.com/royby12/homebridge-sonoff-blinds.git
 ```

## Configuration Examples

#### Simple configuration (minimal):

 ```json 
{
    "accessory": "SonOffBlinds",
    "name": "TestBlinds",
    "sonoffURL": "[IP ONLY]",
    "UpChannel": 1,
    "DownChannel": 2,
    "time_up": 10000,
    "time_down": 10000
}
 ``` 
#### Advanced configuration:

 ```json 
{
    "accessory": "SonOffBlinds",
    "name": "TestBlinds",
    "sonoffURL": "[IP ONLY]",
    "UpChannel": 1,
    "DownChannel": 2,
    "time_up": 10000,
    "time_down": 10000,
    "time_botton_margine_up": 2000,     //Default is 0
    "time_botton_margine_down": 2000,   //Default is 0
    "timeout": 5000                     //Default is 5000
}
 ``` 

Physical connection:

![alt text](https://raw.githubusercontent.com/royby12/omebridge-sonoff-blinds/master/Dual.png)
