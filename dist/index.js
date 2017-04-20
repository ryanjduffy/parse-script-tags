"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var babylon = require('babylon');

var startScript = /<script[^>]*>/im;
var endScript = /<\/script\s*>/im;

function getCandidateScriptLocations(source, index) {
  var i = index || 0;
  var str = source.substring(i);

  var startMatch = startScript.exec(str);
  if (startMatch) {
    var startsAt = startMatch.index + startMatch[0].length;
    var afterStart = str.substring(startsAt);
    var endMatch = endScript.exec(afterStart);
    if (endMatch) {
      var locLength = endMatch.index;
      var locIndex = i + startsAt;

      return [adjustForLineAndColumn(source, {
        index: locIndex,
        length: locLength,
        source: source.substring(locIndex, locIndex + locLength)
      })].concat(_toConsumableArray(getCandidateScriptLocations(source, locIndex + locLength + endMatch[0].length)));
    }
  }

  return [];
}

function parseScript(source) {
  try {
    return babylon.parse(source, {
      sourceType: "script"
    });
  } catch (e) {
    return null;
  }
}

function parseScripts(locations) {
  var parser = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : parseScript;

  return locations.map(function (loc) {
    // remove empty or only whitespace scripts
    if (loc.source.length === 0 || /^\s+$/.test(loc.source)) {
      return null;
    }

    return parser(loc.source);
  });
}

function generateWhitespace(length) {
  return Array.from(new Array(length + 1)).join(" ");
}

function adjustForLineAndColumn(fullSource, location) {
  var index = location.index;

  var lines = fullSource.substring(0, index).split(/\n/);
  var line = lines.length;
  var column = lines.pop().length + 1;

  return Object.assign({}, location, {
    line: line,
    column: column,
    // prepend whitespace for scripts that do not start on the first column
    source: generateWhitespace(column) + location.source
  });
}

function parseScriptTags(source, parser) {
  var scripts = parseScripts(getCandidateScriptLocations(source), parser).filter(function (s) {
    return s !== null;
  });

  return scripts;
}

exports.default = parseScriptTags;
exports.extractScriptTags = parseScriptTags;
exports.generateWhitespace = generateWhitespace;
exports.getCandidateScriptLocations = getCandidateScriptLocations;
exports.parseScript = parseScript;
exports.parseScripts = parseScripts;
exports.parseScriptTags = parseScriptTags;