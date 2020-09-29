"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parseScriptTags = exports.parseScripts = exports.getCandidateScriptLocations = exports.generateWhitespace = undefined;

var _types = require("@babel/types");

var types = _interopRequireWildcard(_types);

var _parseScriptFragment = require("./parseScriptFragment.js");

var _parseScriptFragment2 = _interopRequireDefault(_parseScriptFragment);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var startScript = /<script[^>]*>/im;
var endScript = /<\/script\s*>/im;
// https://stackoverflow.com/questions/5034781/js-regex-to-split-by-line#comment5633979_5035005
var newLines = /\r\n|[\n\v\f\r\x85\u2028\u2029]/;

function getType(tag) {
  var fragment = (0, _parseScriptFragment2.default)(tag);

  if (fragment) {
    var type = fragment.attributes.type;

    return type ? type.toLowerCase() : null;
  }

  return null;
}

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
      var endIndex = locIndex + locLength + endMatch[0].length;

      // extract the complete tag (incl start and end tags and content). if the
      // type is invalid (= not JS), skip this tag and continue
      var tag = source.substring(i + startMatch.index, endIndex);
      var type = getType(tag);
      if (type && type !== "javascript" && type !== "text/javascript") {
        return getCandidateScriptLocations(source, endIndex);
      }

      return [adjustForLineAndColumn(source, {
        index: locIndex,
        length: locLength,
        source: source.substring(locIndex, locIndex + locLength)
      })].concat(_toConsumableArray(getCandidateScriptLocations(source, endIndex)));
    }
  }

  return [];
}

function parseScripts(locations, parser) {
  return locations.map(parser);
}

function generateWhitespace(length) {
  return Array.from(new Array(length + 1)).join(" ");
}

function calcLineAndColumn(source, index) {
  var lines = source.substring(0, index).split(newLines);
  var line = lines.length;
  var column = lines.pop().length + 1;

  return {
    column: column,
    line: line
  };
}

function adjustForLineAndColumn(fullSource, location) {
  var _calcLineAndColumn = calcLineAndColumn(fullSource, location.index),
      column = _calcLineAndColumn.column,
      line = _calcLineAndColumn.line;

  return Object.assign({}, location, {
    line: line,
    column: column,
    // prepend whitespace for scripts that do not start on the first column
    source: generateWhitespace(column) + location.source
  });
}

function parseScriptTags(source, parser) {
  var scripts = parseScripts(getCandidateScriptLocations(source), parser).filter(types.isFile).reduce(function (main, script) {
    return {
      statements: main.statements.concat(script.program.body),
      comments: main.comments.concat(script.comments),
      tokens: main.tokens.concat(script.tokens)
    };
  }, {
    statements: [],
    comments: [],
    tokens: []
  });

  var program = types.program(scripts.statements);
  var file = types.file(program, scripts.comments, scripts.tokens);

  var end = calcLineAndColumn(source, source.length);
  file.start = program.start = 0;
  file.end = program.end = source.length;
  file.loc = program.loc = {
    start: {
      line: 1,
      column: 0
    },
    end: end
  };

  return file;
}

exports.default = parseScriptTags;
exports.generateWhitespace = generateWhitespace;
exports.getCandidateScriptLocations = getCandidateScriptLocations;
exports.parseScripts = parseScripts;
exports.parseScriptTags = parseScriptTags;