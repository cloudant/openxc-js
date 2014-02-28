# Cloudant Chrome OpenXC CAN
### Using HTML5 and Chrome to read directly from USB or Bluetooth
### Traffic trace simulator using WebWorkers 

This application demonstrates how to develop a HTML5 Chrome app to access USB and Bluetooth [OpenXC](http://openxcplatform.com/) Vehicle Interface devices. 

The application uses [PouchDB](http://pouchdb.com/) and [Cloudant](https://cloudant.com/) to synch the captured vehicle data even when the application is offline. If the vehicle slows and connectivity is available these metrics are synchronized with the server to enable crowd source traffic information for all streets. When WIFI is available then all the captured events for the whole journey can be synchronized with Cloudant for post-analysis.

The app queries the server at intervals for traffic information near to the car by using a geospatial radius search.

## Why a Chrome App?

[Chrome Apps](https://developers.google.com/chrome/apps/docs/developers_guide) 
  
  * Bluetooth / USB Connectivity
  * Runs on Windows, Mac, Linux, Android and iOS 
  * App runs in the background even when page is closed

## Features 

v1.0 March 2014 

  * Traffic Simulator
  	* Uses a WebWorker as a background thread and runs OpenXC trace files
  * Screen can be locked to disable visual cues
  * Text to Speech used for voice cues of traffic congestion
 
## Installation 

TODO: Insert link to Chrome WebStore.

## Configuration 

Configuration is in the app [manifest.json](https://raw.github.com/cloudant/openxc-js/master/manifest.json) and in [src/config.js](https://raw.github.com/cloudant/openxc-js/master/src/config.js) file.
  
## Running

Download a trace file (recommended sample is [data/london.json](https://raw.github.com/cloudant/openxc-js/master/data/london.json)) and store locally. Select this trace file as input.

## Issues

Find a bug or want to request a new feature?  Please let us know by submitting an issue.

## Contributing

Cloudant welcomes contributions from anyone and everyone. 

## Credit

## Licensing

Copyright 2014 Cloudant

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

A copy of the license is available in the repository's [license](https://raw.github.com/cloudant/openxc-js/master/LICENSE) file.
