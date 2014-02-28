// vehicle_simulator.js
importScripts('../lib/pouchdb-nightly.js');
importScripts('config.js');

// recreate database everytime
var dbName = 'cardemo';
PouchDB.destroy(dbName);
var db = new PouchDB(dbName);
var interval = config.interval; // milliseconds
var pollInterval = config.poll;
var query = config.query;
var dist = config.dist;
var id;

var remoteCouch = config.remoteCouch;

function clone(obj) {
  if(obj == null || typeof(obj) != 'object')
      return obj;
  var temp = obj.constructor(); // changed
  for(var key in obj)
      temp[key] = clone(obj[key]);
  return temp;
};

function getTrafficAlerts(lon, lat){
  var url = query + '?lon=' + lon + '&lat=' + lat + '&radius=' + dist + '&include_docs=true';
  var oReq =new XMLHttpRequest();
  oReq.open("GET", url, true);
  oReq.onload = function(e) {
    var features = JSON.parse(oReq.responseText); 
    self.postMessage({"type" : "alert", "data" : features});
  }
  oReq.send();
};

function runTrace(trace) {  
  var events = trace.split(/\r\n|\n/);
  var startTime = new Date().getTime();
  var firstTime;
  var lastTime = startTime;
  var lastPollTime = startTime;
  var lat;
  var lon; 
  var m;  
  var first = true;
  var obj = {
    "properties" : {},
    "geometry" :{
      "type" : "Point",
    }
  };
  
  for (var i=0; i < events.length; i++) {
    var l = events[i];
    if (l != ''){
      m = JSON.parse(l);
      if (!firstTime)
        firstTime = m.timestamp * 1000;
      
      if (m.name == 'latitude')
        lat = m.value;
      else if (m.name == 'longitude')
        lon = m.value
      else {
        // check whether we need to sync
        var doSync;

        if ((m.name == 'vehicle_speed') && (m.value == 0))
          doSync = true;
        else
          doSync = false;

        if (obj.properties[m.name]) {
          obj.properties[m.name].push(
            {
              "timestamp" : startTime + ((m.timestamp * 1000) - firstTime),
              "value": m.value
            }
          );
        } else {
          obj.properties[m.name] = [{
            "timestamp" : startTime + ((m.timestamp * 1000) - firstTime),
            "value": m.value
          }];
        }
      }

      if (lat && lon) {
        obj.timestamp = startTime + ((m.timestamp * 1000) - firstTime);
        obj.geometry.coordinates = [lon, lat];
        // update client
        if (first || (obj.timestamp - lastTime) > interval) {
          var poll = false;
          if ((obj.timestamp - lastPollTime) > pollInterval) {
            poll = true;
            lastPollTime = obj.timestamp;
          }

          var data = {"sync" : doSync, "poll": poll, "data" : clone(obj)}
          lastTime = obj.timestamp;
          id = setTimeout(function (evt) {
            evt.data._id = new Date().toISOString();
            db.put(evt.data);        
            self.postMessage(evt.data);
            if (evt.poll)
              getTrafficAlerts(evt.data.geometry.coordinates[0],
                evt.data.geometry.coordinates[1]);

            if (evt.sync) 
              sync([evt.data._id]);
          }, obj.timestamp - startTime, data);

          if (first) {
            getTrafficAlerts(lon, lat);
            first = false;
          }
        }

        // reset properties
        obj.properties = {};
      }
    }
  }

  id = setTimeout(function() {
    self.postMessage("Done");
  }, (m.timestamp * 1000) - firstTime + 1);
};

function openFile(file) {
  try {
      var reader = new FileReaderSync();
      reader.onerror = traceErrorHandler;
      var result = reader.readAsText(file, 'UTF-8');
      runTrace(result);
  } catch (e) {
    console.log(e);
    traceErrorHandler(e);
  }
};

function sync(ids) {
  if (db) {
    if (ids)
      db.replicate.to(remoteCouch, {"doc_ids" : ids})
    else {
      var resp = db.replicate.to(remoteCouch);
      var msg;
      if ((resp.ok == true) || (resp.cancelled == false)) {
        msg = {
          "type" : "status",
          "message" : "sync complete"
        };
      } else {
        msg = {
          "type" : "error",
          "message" : "unable to sync"
        };
        console.log(JSON.stringify(resp));
      }
      self.postMessage(msg);
    }
  }
};

function traceErrorHandler(e) {
  var msg = '';
  switch (e.code) {
    case FileError.QUOTA_EXCEEDED_ERR:
      msg = 'QUOTA_EXCEEDED_ERR';
      break;
    case FileError.NOT_FOUND_ERR:
      msg = 'NOT_FOUND_ERR';
      break;
    case FileError.SECURITY_ERR:
      msg = 'SECURITY_ERR';
      break;
    case FileError.INVALID_MODIFICATION_ERR:
      msg = 'INVALID_MODIFICATION_ERR';
      break;
    case FileError.INVALID_STATE_ERR:
      msg = 'INVALID_STATE_ERR';
      break;
    default:
      msg = 'Unknown File Error';
      break;
  };
  self.postMessage({
    "type" : "error",
    "message" : msg    
  });
  console.log('Trace Error: ' + msg);
};

onmessage = function (event) {
  var data = event.data;
  switch (data.cmd) {
    case 'start':
      self.postMessage('Worker started: ');
      openFile(data.value);
      break;
    case 'stop':
      self.postMessage('Worker stopped: ');
      while (id--) {
        clearTimeout(id);
      }
      break;
    case 'close':
      self.close(); // Terminates the worker.
      break;    
    case 'sync':
      self.postMessage('Sync received: ');
      sync();
      break;
    default:
      self.postMessage('Unknown command: ' + data.msg);
  };
};
