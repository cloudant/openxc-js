/* Copyright 2014 Cloudant
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var OPENXC_VENDOR_ID = 7108;//0x1bc4;
var OPENXC_PRODUCT_ID = 1; //ox1;

var DEVICE_INFO = {"vendorId": OPENXC_VENDOR_ID, "productId": OPENXC_PRODUCT_ID};

var openXCDevice;
var usb = chrome.usb;
var openxc = document.getElementById('openxc');
var usbButton = document.getElementById('usb');
var demoButton = document.getElementById('demo');
var stopButton = document.getElementById('stop');
var dataSelect = document.getElementById('data');
var devMode = document.getElementById('devMode');
var mapFrame = document.getElementById('mapFrame');
var syncButton = document.getElementById('sync');
var worker;
var debug = true;

var update=function(e) {
  if ((e.type == 'error') || (e.type == 'status')) {
    var opt = {
      type: "basic",
      title: e.type,
      message: e.message,
      iconUrl: "../Cloudant_16x16.png"
    }
    chrome.notifications.create("usb", opt, function(id){});
  }
  else if ((e.type == 'alert')) {
    var features = e.data.features;
    for (var i = 0; i < features.length; i++) {
      var f = features[i];
      chrome.tts.speak(f.message);
    }
  }
  else if (debug) {
    if (typeof e == "object"){
      mapFrame.contentWindow.postMessage(e, '*');
    } else {
      console.log(e);
    }
  }
};

var onEvent=function(usbEvent) {
  if (usbEvent.resultCode) {
    var opt = {
      type: "basic",
      title: "Device error",
      message: String.fromCharCode.apply(null, new Uint16Array(usbEvent.data)),
      iconUrl: "../Cloudant_16x16.png"
    }
    chrome.notifications.create("usb", opt, function(id){});
    console.log("Error: " + usbEvent.error);
    return;
  }

  // event data is an arraybuffer
  update(JSON.parse(String.fromCharCode.apply(null, 
                        new Uint16Array(usbEvent.data))));

  usb.interruptTransfer(openXCDevice, transfer, onEvent);
};

var gotPermission = function(result) {
  console.log('App was granted the "usbDevices" permission.');
  usb.findDevices(DEVICE_INFO, 
    function(devices) {
      if (!devices || !devices.length) {
        console.log('device not found');
        return;
      }
      console.log('Found device: ' + devices[0].handle);
      openXCDevice = devices[0];
      // stop debug
      if (worker)
         worker.postMessage({"cmd": "stop"});
      usb.interruptTransfer(openXCDevice, transfer, onEvent);
  });
};

var runTrace = function(v) {
  if(typeof(Worker) !== "undefined") {
    worker = new Worker('src/vehicle_simulator.js'); 
    worker.onmessage = function(event) {
      update(event.data);
    };  
    worker.postMessage({"cmd" : "start", "value" : v});
  }
  else {
    var opt = {
      type: "basic",
      title: "Web Workers",
      message: "Cannot create web workers - try updating browser",
      iconUrl: "../Cloudant_16x16.png"
    }
    chrome.notifications.create("usb", opt, function(id){});
    console.log("Browser does not support workers");
  }
};

var permissionObj = {permissions: [{'usbDevices': [DEVICE_INFO]}]};

usbButton.addEventListener('click', function(e) {
  dataSelect.disabled = true;
  syncButton.disabled = true;
  chrome.permissions.request( permissionObj, function(result) {
    if (result) {
      gotPermission();
    } else {
      var opt = {
        type: "basic",
        title: "USB Permissions",
        message: "OpenXC device not found",
        iconUrl: "../Cloudant_16x16.png"
      }
      chrome.notifications.create("usb", opt, function(id){});
      console.log('App was not granted the "OpenXC USB device" permission.');
      console.log(chrome.runtime.lastError);
    }
  });
});

demoButton.addEventListener('click', function(e) {
  // get the selected trace file
  dataSelect.disabled = false;
  syncButton.disabled = false;
  if (worker)
     worker.postMessage({"cmd" : "stop"}); 
  
  var fileEntry = dataSelect.value;
  if (!fileEntry) {
    var opt = {
      type: "basic",
      title: "Select trace file",
      message: "Please select a trace file",
      iconUrl: "../Cloudant_16x16.png"
    }
    chrome.notifications.create("usb", opt, function(id){});
  } else {
    runTrace(fileEntry);
  }
});

stopButton.addEventListener('click', function(e) {
  if (worker)
     worker.postMessage({"cmd": "stop"}); 
});

dataSelect.addEventListener('click', function(e){
  // chrome.tts.speak('Hello, world.');
  chrome.fileSystem.chooseEntry({type: 'openFile'}, function(readOnlyEntry) {
    readOnlyEntry.file(function(file) {
      runTrace(file);
    });
  });
});

devMode.addEventListener('click', function(e) {
  if (e.checked == true)
    debug = true;
  else 
    debug = false;
});

syncButton.addEventListener('click', function(e){ 
  if (worker) {
    worker.postMessage({"cmd": "sync"});
  }
});

chrome.permissions.contains(permissionObj, function(result) {
  if (result) {
    gotPermission();
  }
});