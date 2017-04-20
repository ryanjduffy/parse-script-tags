const babylon = require('babylon');

const startScript = /<script[^>]*>/im;
const endScript = /<\/script\s*>/im;

function getCandidateScriptLocations(source, index) {
  const i = index || 0;
  const str = source.substring(i);

  const startMatch = startScript.exec(str);
  if (startMatch) {
    const startsAt = startMatch.index + startMatch[0].length;
    const afterStart = str.substring(startsAt);
    const endMatch = endScript.exec(afterStart);
    if (endMatch) {
      const locLength = endMatch.index;
      const locIndex = i + startsAt;

      return [
        adjustForLineAndColumn(source, {
          index: locIndex,
          length: locLength,
          source: source.substring(locIndex, locIndex + locLength)
        }),
        ...getCandidateScriptLocations(
          source,
          locIndex + locLength + endMatch[0].length
        )
      ];
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

function parseScripts(locations, parser = parseScript) {
  return locations.map(loc => {
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
  const { index } = location;
  const lines = fullSource.substring(0, index).split(/\n/);
  const line = lines.length;
  const column = lines.pop().length + 1;

  return Object.assign({}, location, {
    line,
    column,
    // prepend whitespace for scripts that do not start on the first column
    source: generateWhitespace(column) + location.source
  });
}

function parseScriptTags(source, parser) {
  const scripts = parseScripts(
    getCandidateScriptLocations(source),
    parser
  ).filter(
    s => s !== null
  );

  return scripts;
}

export default parseScriptTags;
export {
  parseScriptTags as extractScriptTags,
  generateWhitespace,
  getCandidateScriptLocations,
  parseScript,
  parseScripts,
  parseScriptTags
};
