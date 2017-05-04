const babylon = require("babylon");

const expect = require("expect.js");
import {
  generateWhitespace,
  getCandidateScriptLocations,
  parseScripts,
  parseScriptTags
} from "../";

const SOURCES = {
  /* eslint-disable max-len */
  htmlEmpty:
    `
<script src="./some-file.js"></script>
<script>
    
</script>
    `
  ,
  htmlBasic:
    `
<script>var abc = 1;</script>
    `
  ,
  htmlBasicMultiLine:
    `
<script>
var abc = 1;
function def () {
  return abc;
}
</script>
    `
  ,
  htmlBasicMultiTag:
    `
<script>var abc = 1;</script>
<script>
var abc = 1;
function def () {
  return abc;
}
</script>
    `
  ,
  htmlBasicMultiTagInline:
    `
<script>var abc = 1;</script><script>function def () { return abc; }</script>
    `
  ,
  htmlScriptTagsInComments:
    `
<!-- <script><script><script>
none of this matters
</script> -->
<script>
var abc = 1;
function def () {
  return abc;
}
</script>
    `
  ,
  htmlScriptTagsWithWhitespace:
    `
<script
  type="text/javascript"
  defer
  async
>
var abc = 1;
function def () {
  return abc;
}
</script         >
    `
  ,
  htmlScriptTagsWithInvalid:
    `
<script>
This is not real script content;
</script>
    `
  /* eslint-enable max-len */
};

describe("extract-script-tags", () => {
  describe("#getCandidateScriptLocations", () => {
    it("should find the location and source of each possible script", () => {
      expect(getCandidateScriptLocations(SOURCES.htmlEmpty)).to.eql([
        {
          index: 30,
          length: 0,
          line: 2,
          column: 30,
          source: generateWhitespace(30)
        },
        {
          index: 48,
          length: 6,
          line: 3,
          column: 9,
          source: `${generateWhitespace(9)}
    
`
        }
      ]);

      expect(getCandidateScriptLocations(SOURCES.htmlBasic)).to.eql([
        {
          index: 9,
          length: 12,
          line: 2,
          column: 9,
          source: `${generateWhitespace(9)}var abc = 1;`
        }
      ]);

      expect(getCandidateScriptLocations(SOURCES.htmlBasicMultiLine)).to.eql([
        {
          index: 9,
          length: 48,
          line: 2,
          column: 9,
          source: `${generateWhitespace(9)}
var abc = 1;
function def () {
  return abc;
}
`
        }
      ]);

      expect(getCandidateScriptLocations(SOURCES.htmlBasicMultiTag)).to.eql([
        {
          index: 9,
          length: 12,
          line: 2,
          column: 9,
          source: `${generateWhitespace(9)}var abc = 1;`
        },
        {
          index: 39,
          length: 48,
          line: 3,
          column: 9,
          source: `${generateWhitespace(9)}
var abc = 1;
function def () {
  return abc;
}
`
        }
      ]);

      expect(
        getCandidateScriptLocations(SOURCES.htmlBasicMultiTagInline)
      ).to.eql([
        {
          index: 9,
          length: 12,
          line: 2,
          column: 9,
          source: `${generateWhitespace(9)}var abc = 1;`
        },
        {
          index: 38,
          length: 31,
          line: 2,
          column: 38,
          source: `${generateWhitespace(38)}function def () { return abc; }`
        }
      ]);

      expect(
        getCandidateScriptLocations(SOURCES.htmlScriptTagsInComments)
      ).to.eql([
        {
          index: 14,
          length: 38,
          line: 2,
          column: 14,
          source: `${generateWhitespace(14)}<script><script>
none of this matters
`
        },
        {
          index: 74,
          length: 48,
          line: 5,
          column: 9,
          source: `${generateWhitespace(9)}
var abc = 1;
function def () {
  return abc;
}
`
        }
      ]);

      expect(
        getCandidateScriptLocations(SOURCES.htmlScriptTagsWithWhitespace)
      ).to.eql([
        {
          index: 51,
          length: 48,
          line: 6,
          column: 2,
          source: `${generateWhitespace(2)}
var abc = 1;
function def () {
  return abc;
}
`
        }
      ]);
    });
  });

  describe("#parseScripts", () => {
    it("should not parse empty scripts", () => {
      const expected = [null, null];
      const actual = parseScripts([{ source: "" }, { source: "\n\t " }]);

      expect(actual).to.eql(expected);
    });

    it("should not parse scripts with markup", () => {
      const expected = [null, null, null];
      const actual = parseScripts([
        { source: "<p>Invalid</p>" },
        { source: "<script><script>" },
        { source: "<!-- \n multiline\nHTML comment\nwith <tags />\n-->" }
      ]);

      expect(actual).to.eql(expected);
    });

    it("should not parse scripts with invalid content", () => {
      const expected = [null, null];
      const actual = parseScripts([
        { source: "this isn't javascript" },
        { source: "this.isNearly(java script);" }
      ]);

      expect(actual).to.eql(expected);
    });
  });

  describe("#parseScriptTags", () => {
    it("should return an empty AST for empty scripts", () => {
      expect(parseScriptTags(SOURCES.htmlEmpty).tokens.length).to.eql(0);
    });

    it("should return a non-empty AST for valid scripts", () => {
      const scripts = parseScriptTags(SOURCES.htmlScriptTagsInComments);
      expect(scripts.tokens.length).to.not.eql(0);
    });
  });
});
