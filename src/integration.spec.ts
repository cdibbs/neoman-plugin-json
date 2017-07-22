/// <reference path="../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../node_modules/@types/chai/index.d.ts" />
import 'mocha';
import * as chai from 'chai';
let expect = chai.expect, assert = chai.assert;
import * as sinon from 'sinon';

let JSONPlugin = require('./index');
import * as json from './parsers/json';
import * as jsonPath from './parsers/json-path';

describe('jsonPath parsing', () => {
  describe('typical examples', () => {
    let examples = {
      "$": <any>['$', []],
      "$.chris.was.here": ['$', [['id', 'chris'], ['id', 'was'], ['id', 'here']]],
      "$.santas[3].clause": ['$', [['id', 'santas'], ['id', 3], ['id', 'clause']]],
      "$.santas[3][4].clause": ['$', [['id', 'santas'], ['id', 3], ['id', 4], ['id', 'clause']]],
      "$.one": ['$', [['id', 'one']]],
      "$[3]": ['$', [['id', 3]]],
      "$[3][4]": ['$', [['id', 3], ['id', 4]]],
      "$[3][4].four[5]": ['$', [['id', 3], ['id', 4], ['id', 'four'], ['id', 5]]],
      "$[3].four": ['$', [['id', 3], ['id', 'four']]],
      "$[3].four.five": ['$', [['id', 3], ['id', 'four'], ['id', 'five']]],
    };

    Object.keys(examples).map(k => {
      let expected = examples[k];
      it(`parses ${k} correctly`, () => {
        let result: any;
        assert.doesNotThrow(() => {
          try {
            result = jsonPath.parse(k);
          } catch(err) {
            throw new Error(err.message);
          }
        });
        expect(result).to.deep.equal(expected);
      });
    });

  });

  describe('typical failure examples', () => {
    let examples = [
      "$.",
      //"$.[3]", //FIXME
      "one",
      "1",
      "$one",
      "$..[3]",
      "$.[.]"
    ];
    examples.map(ex => {
      it(`fails to parse ${ex}`, () => {
        let result: any;
        assert.throws(() => {
            result = jsonPath.parse(ex);
        });
      });
    });

  });
});

describe('json parsing', () => {
  describe('typical examples', () => {
    let o1 = '{ "one": "two" }';
    let o2 = '{ "1": [0, 1] }';

    it(`parses ${o1}`, () => {
        let result: any;
        assert.doesNotThrow(() => {
          try {
            result = json.parse(o1);
          } catch(err) {
            throw new Error(err.message);
          }
        });
        //console.log(JSON.stringify(result, null, 2))
        expect(result.orig).to.deep.equal({ "one": "two" });
        expect(result.v).to.exist;
        expect(result.meta).to.exist;
        expect(result.meta.first_line).to.equal(1);
        expect(result.meta.last_line).to.equal(1);
        expect(result.meta.first_column).to.equal(0);
        expect(result.meta.last_column).to.equal(16);
        expect(result.meta.range).to.deep.equal([0,16]);
        
    });

    it(`parses ${o2}`, () => {
        let result: any;
        assert.doesNotThrow(() => {
          try {
            result = json.parse(o2);
          } catch(err) {
            throw new Error(err.message);
          }
        });
        //console.log(JSON.stringify(result, null, 2))
        expect(result.orig).to.deep.equal({ "1": [0, 1] });
        expect(result.meta).to.exist;
        expect(result.v).to.exist;
        expect(result.v[0].type).to.equal("member");
        expect(result.v[0].orig).to.deep.equal(["1", [0,1]]);
        expect(result.v[0].meta).to.exist;
        expect(result.v[0].v[0].type).to.equal("string");
        expect(result.v[0].v[1].type).to.equal("array");
        expect(result.v[0].v[1].v[0].type).to.equal("number");
        expect(result.v[0].v[1].v[0].meta).to.exist;
        expect(result.v[1]).not.to.exist;
    });

  });
});

describe("full replacements", () => {
  let p: any;
  beforeEach(() => {
    p = new JSONPlugin();
  });

  it('should error on non-JSON', () => {
    expect(() => {
      let content = [
        "If I speak in the tongues of men or of angels, but do not have love, I am only a resounding gong or a clanging cymbal.",
        "If I have the gift of prophecy and can fathom all mysteries and all knowledge, and if I have a faith that can move mountains,",
        "but do not have love, I am nothing. If I give all I possess to the poor and give over my body to hardship that I may boast,",
        "but do not have love, I gain nothing."
      ].join("\n");
      let subject = "$.one.cor.13"

      p.transform("", content, subject, "here i am");
    }).to.throw("Not valid JSON");
  });

  it('should perform basic replace', () => {
    let content = "{ \"one\": \"two\", \"three\": [ \"four\", { \"five\" : 6 } ] }";
    let subject = "$.three[1].five";
    let result = p.transform("/tmp/path", content, subject, "7", { type: "number" });
    expect(result).to.equal("{ \"one\": \"two\", \"three\": [ \"four\", { \"five\" : 7 } ] }");
  });

  it('should operate regardless of new line characters', () => {
    let content = "{\n  \"name\"\: \"htmlproj\"\n}";
    let subject = "$.name";
    let result = p.transform("/tmp/path", content, subject, "test2", { type: "string" });
    expect(result).to.equal("{\n  \"name\"\: \"test2\"\n}");
  });

  it('should error on bad subject', () => {
    expect(() => {
      let content = "{ \"one\": \"two\", \"three\": [ \"four\", { \"five\" : 6 } ] }";
      let subject = "$.three[0].five";
      let result = p.transform("/tmp/path", content, subject, "7");
      expect(result).to.equal("{ \"one\": \"two\", \"three\": [ \"four\", { \"five\" : 7 } ] }");
    }).to.throw()
      .and.property('message').to.contain("not an array or object").and.to.contain("$[\"three\"][0] ");
  });

  it('should error on invalid resulting JSON, if not overridden', () => {

  });

  it('should not error on invalid resulting JSON, if overridden', () => {

  });
});