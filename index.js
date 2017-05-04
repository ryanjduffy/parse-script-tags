const babylon = require("babylon");
const types = require("babel-types");

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

function parseScript({source, line}) {
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

function parseScripts(locations, parser = parseScript) {
  return locations.map(parser);
}

function generateWhitespace(length) {
  return Array.from(new Array(length + 1)).join(" ");
}

function calcLineAndColumn(source, index) {
  const lines = source
    .substring(0, index)
    .replace(/\r\l?/, "\n")
    .split(/\n/);
  const line = lines.length;
  const column = lines.pop().length + 1;

  return {
    column,
    line
  };
}

function adjustForLineAndColumn(fullSource, location) {
  const {column, line} = calcLineAndColumn(fullSource, location.index);
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
  ).reduce((main, script) => {
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

  const program = types.program(scripts.statements);
  const file = types.file(
    program,
    scripts.comments,
    scripts.tokens
  );

  const end = calcLineAndColumn(source, source.length);
  file.start = program.start = 0;
  file.end = program.end = source.length;
  file.loc = program.loc = {
    start: {
      line: 1,
      column: 0
    },
    end
  }

  return file;
}

function extractScriptTags(source) {
  return parseScripts(
    getCandidateScriptLocations(source),
    loc => {
      const ast = parseScript(loc);

      if (ast) {
        return loc;
      }

      return null;
    }
  ).filter(
    s => s !== null
  );
}

export default parseScriptTags;
export {
  extractScriptTags,
  generateWhitespace,
  getCandidateScriptLocations,
  parseScript,
  parseScripts,
  parseScriptTags
};
