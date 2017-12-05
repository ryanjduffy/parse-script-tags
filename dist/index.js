"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parseScriptTags = exports.parseScripts = exports.parseScript = exports.getCandidateScriptLocations = exports.generateWhitespace = exports.extractScriptTags = undefined;

var _babelTypes = require("babel-types");

var types = _interopRequireWildcard(_babelTypes);

var _babylon = require("babylon");

var babylon = _interopRequireWildcard(_babylon);

var _customParse = require("./customParse.js");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function parseScript(_ref) {
  var source = _ref.source,
      line = _ref.line;

  // remove empty or only whitespace scripts
  if (source.length === 0 || /^\s+$/.test(source)) {
    return null;
  }

  try {
    return babylon.parse(source, {
      sourceType: "script",
      startLine: line
    });
  } catch (e) {
    return null;
  }
}

function parseScripts(locations) {
  var parser = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : parseScript;

  return (0, _customParse.parseScripts)(locations, parser);
}

function extractScriptTags(source) {
  return parseScripts((0, _customParse.getCandidateScriptLocations)(source), function (loc) {
    var ast = parseScript(loc);

    if (ast) {
      return loc;
    }

    return null;
  }).filter(types.isFile);
}

function parseScriptTags(source) {
  var parser = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : parseScript;

  return (0, _customParse.parseScriptTags)(source, parser);
}

exports.default = parseScriptTags;
exports.extractScriptTags = extractScriptTags;
exports.generateWhitespace = _customParse.generateWhitespace;
exports.getCandidateScriptLocations = _customParse.getCandidateScriptLocations;
exports.parseScript = parseScript;
exports.parseScripts = parseScripts;
exports.parseScriptTags = parseScriptTags;