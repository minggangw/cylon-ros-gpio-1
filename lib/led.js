/*
 * Copyright 2017 Intel Corporation
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

"use strict";

var Cylon = require("cylon");
var rosnodejs = require("rosnodejs");

var Led = module.exports = function Led(opts) {
  Led.__super__.constructor.apply(this, arguments);

  this._isHigh = false;
  this._name = opts.name;
  this._rosNode = null;

  if (this.pin == null) {
    throw new Error("No pin specified for LED. Cannot proceed");
  }
};

Cylon.Utils.subclass(Led, Cylon.Driver);

Led.prototype.start = function(callback) {
  this._topicHandlers = [
    { topic: "turnOn_" + this._name, handler: this._turnOn },
    { topic: "turnOff_" + this._name, handler: this._turnOff },
    { topic: "toggle_" + this._name, handler: this._toggle }
  ];

  rosnodejs.initNode("/cylon-ros", {
    messages: ["std_msgs/String", "std_msgs/Bool", "std_msgs/Int32",
        "std_msgs/Float32"]
  }).then((rosNode) => {
    this._rosNode = rosNode;
    this._topicHandlers.forEach((topicHandler) => {
      rosNode.subscribe(
          "/" + topicHandler.topic,
          "std_msgs/String",
          () => { topicHandler.handler.call(this); },
          { queueSize: 1,
            latching: true,
            throttleMs: 1 });
    });
    callback();
  });
};

Led.prototype.halt = function(callback) {
  this._topicHandlers.forEach((topicHandler) => {
    this._rosNode.unsubscribe("/" + topicHandler.topic);
  });
  callback();
};

Led.prototype._toggle = function() {
  if (this._isHigh) {
    this._turnOff();
  } else {
    this._turnOn();
  }
};

Led.prototype._turnOn = function() {
  this._isHigh = true;
  this.connection.digitalWrite(this.pin, 1, null);
};

Led.prototype._turnOff = function() {
  this._isHigh = false;
  this.connection.digitalWrite(this.pin, 0, null);
};
