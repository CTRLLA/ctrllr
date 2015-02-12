var

  /** console coloring lib */
  colors = require('colors'),

  /** log helper */
  Logger = require('ctrl-logger');

/* ==========================================================================
 Logger - wrapper for pretty logs
 ========================================================================== */

/**
 * styles and prints message to console
 * @param msg {String} message to print
 * @param color {String} color of message
 * @param indent {Number} spaces to indent
 */
Logger.prototype.format = function(msg, color, indent) {
  if (indent) {
    for (var i = 0, len = indent; i < len; i++) {
      msg = ' ' + msg;
    }
  }

  if (color) {
    msg = colors[color](msg);
  }
  console.log(msg);
};

/**
 * prints the value of an assertion
 * @param success {Boolean} whether or not the assertion passed
 * @param message {String} the message to print
 */
Logger.prototype.meta = function(success, message) {
  for (var i = 0, len = 16; i < len; i++) {
    message = ' ' + message;
  }

  var color = success ? 'green' : 'red';
  message = colors[color](message);
  console.log(message);
};

/**
 * prints the value of an assertion
 * @param success {Boolean} whether or not the assertion passed
 * @param message {String} the message to print
 */
Logger.prototype.assertion = function(success, message) {
  for (var i = 0, len = 8; i < len; i++) {
    message = ' ' + message;
  }

  var color = success ? 'green' : 'red';
  message = colors[color](message);
  console.log(message);
};

/* ==========================================================================
 Initialization / Exports
 ========================================================================== */

module.exports = Logger;