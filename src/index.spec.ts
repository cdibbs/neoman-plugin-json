/// <reference path="../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../node_modules/@types/chai/index.d.ts" />
/// <reference path="../node_modules/@types/node/index.d.ts" />
import 'mocha';
import * as chai from 'chai';
let expect = chai.expect, assert = chai.assert;
import * as sinon from 'sinon';
import { ParamsModel } from './types';
import { TraversalResult, JSONPointer } from './traversal-result';

let JSONPlugin = require('./index');
let JSONParser = require('./parsers/json');

describe('JSONPlugin', () => {
  let p: any;
  beforeEach(() => {
    p = new JSONPlugin();
  });

  describe('#configure', () => {
    it('should setup plugin configuration', () => {
      p.configure("something");
      expect(p["pluginConfiguration"]).to.equal("something");
    });
  });

  describe('#traverse', () => {
    it('should correctly traverse a given object with a given JSONPath', () => {
      let sobj = '{ "chris": ["one", "two", "three"] }';
      let pobj = JSONParser.parse(sobj);
      let tr = p["traverse"](pobj, "$.chris[1]");
      expect(tr).to.exist;
      expect(tr.destination).to.exist;
      expect(tr.destination.type).to.equal("string");
      expect(tr.parent).to.exist;
      expect(tr.parent.destination.type).to.equal("member");
      expect(tr.destination.meta.first_column).to.equal(19);
      expect(tr.destination.meta.last_column).to.equal(24);
    });
    it('should correctly traverse a given object with a given JSONPath', () => {
      let sobj = '{ "nonsense": 1, "chris": ["one", { "two": [1, 3.141] }, "three"] }';
      let pobj = JSONParser.parse(sobj);
      let tr = p["traverse"](pobj, "$.chris[1]");
      expect(tr).to.exist;
      expect(tr.destination).to.exist;
      expect(tr.destination.type).to.equal("object");
      expect(tr.parent).to.exist;
      expect(tr.parent.destination.type).to.equal("member");
      tr = p["traverse"](pobj, "$.chris[1].two[1]");
      expect(tr).to.exist;
      expect(tr.destination).to.exist;
      expect(tr.destination.type).to.equal("number");
      expect(tr.destination.orig).to.equal(3.141);
      expect(tr.destination.v).to.equal("3.141");
      expect(tr.parent).to.exist;
      expect(tr.parent.destination.type).to.equal("member");      
      expect(tr.destination.meta.first_column).to.equal(47);
      expect(tr.destination.meta.last_column).to.equal(52);
    });
    it('should throw when traversing non-existant path', () => {
      assert.throws(() => {
        let sobj = '{ "chris": "something" }';
        let pobj = JSONParser.parse(sobj);
        let tr = p["traverse"](pobj, "$.john[1]");
      });
      assert.throws(() => {
        let sobj = '{ "chris": ["one", "two", "three"] }';
        let pobj = JSONParser.parse(sobj);
        let tr = p["traverse"](pobj, "$.chris[1].john");
      });
    });
    it('should set subject according to depth', () => {
      let sobj = '{ "nonsense": 1, "chris": ["one", { "two": [1, 3.141] }, "three"] }';
      let pobj = JSONParser.parse(sobj);

      let tr = p["traverse"](pobj, "$.chris[1]");

      expect(tr.subject).to.equal('$["chris"][1]');
      expect(tr.parent.subject).to.equal('$["chris"]');
      expect(tr.parent.parent.subject).to.equal("$");
    });
  });

  describe('#coerseString', () => {
    it('should take a string, and return the same', () => {

    });
  });

  describe('#applyTransform', () => {
    let getTransformValueStub: sinon.SinonStub;
    let testContent: string, testSubject: string;
    let testVal: string | Function;
    let testRetVal: string;
    let testParams: ParamsModel;
    let testTravResult: TraversalResult;
    beforeEach(() => {
      testContent = "test content", testSubject = "$.something", testVal = "test value", testParams = { };
      testRetVal = "test return value";
      testTravResult = { parent: null, subject: "bogus", destination: <JSONPointer>{ meta: { range: [0, 0] } } };
      getTransformValueStub = sinon.stub();
      getTransformValueStub.returns(testRetVal);
      p["getTransformValue"] = getTransformValueStub;
    });
    it('should get transform value', () => {
      let stub = sinon.stub();
      p["getTransformValue"] = stub;
      let content = "chris was here";
      let subject = "";
      let travResult = { destination: { meta: { range: [6, 9] } } };
      let params = new ParamsModel();

      p["applyTransform"](content, subject, travResult, "", params);

      sinon.assert.calledWith(stub, "", subject, travResult, params);
    });
    it('should call remove when type remove', () => {
      let removeStub = sinon.stub(), getValStub = sinon.stub();
      p["getTransformValue"] = getValStub;
      p["transform_remove"] = removeStub;
      let content = "one", subject = "two", travResult = { destination: { meta: { range: [6, 9] } } }, val = "three", params = new ParamsModel();
      params.action = "remove";

      p["applyTransform"](content, subject, travResult, val, params);

      sinon.assert.calledWith(removeStub, content, travResult);
    });
    it('should call append when type append', () => {
      let appendStub = sinon.stub(), getValStub = sinon.stub();
      let replaceVal = { "weird": "thing" };
      getValStub.returns(replaceVal)
      p["getTransformValue"] = getValStub;
      p["transform_append"] = appendStub;
      let content = "one", subject = "two", travResult = { destination: { meta: { range: [6, 9] } } }, val = "three", params = new ParamsModel();
      params.action = "append";

      p["applyTransform"](content, subject, travResult, val, params);

      sinon.assert.calledWith(appendStub, content, replaceVal, travResult);
    });

    it('should call prepend when prepend', () => {
      let stub = sinon.stub();
      p["transform_prepend"] = stub;
      testParams.action = "prepend";

      p["applyTransform"](testContent, testSubject, testTravResult, testVal, testParams);

      sinon.assert.calledWith(stub, testContent, testRetVal, testTravResult);
    });

    it('should call insertAfter when insertAfter', () => {
      let stub = sinon.stub();
      p["transform_insertAfter"] = stub;
      testTravResult.parent = testTravResult; // only a dispatch test, doesn't matter
      testParams.action = "insertAfter";

      p["applyTransform"](testContent, testSubject, testTravResult, testVal, testParams);

      sinon.assert.calledWith(stub, testContent, testRetVal, testTravResult);
    });

    it('should call insertBefore when insertBefore', () => {
      let stub = sinon.stub();
      p["transform_insertBefore"] = stub;
      testTravResult.parent = testTravResult; // only a dispatch test, doesn't matter
      testParams.action = "insertBefore";

      p["applyTransform"](testContent, testSubject, testTravResult, testVal, testParams);

      sinon.assert.calledWith(stub, testContent, testRetVal, testTravResult);
    });
  });

  describe('#transform_set', () => {
    it('should set the string at the right location', () => {
      let content = "chris was here";
      let travResult = { destination: { meta: { range: [6, 9] } } };
      let result = p["transform_set"](content, "is", travResult);
      expect(result).to.equal("chris is here");
    });
  });

  describe('#transform_append', () => {
    it('should append to a non-empty array', () => {
      let content = '{ "one": [1, 2, 3] }';
      let metajson = JSONParser.parse(content);
      let travResult = p["traverse"](metajson, "$.one");
      let result = p["transform_append"](content, "4", travResult);

      expect(result).to.deep.equal('{ "one": [1, 2, 3, 4] }');
    });

    it('should append to an empty array', () => {
      let content = '{ "one": [] }';
      let metajson = JSONParser.parse(content);
      let travResult = p["traverse"](metajson, "$.one");
      let result = p["transform_append"](content, "4", travResult);

      expect(result).to.deep.equal('{ "one": [4] }');
    });

    it('should try to copy formatting', () => {
      let content =
'{ "one": [\n\
    1,\n\
    2,\n\
    3\n\
] }';
      let metajson = JSONParser.parse(content);
      let travResult = p["traverse"](metajson, "$.one");
      let result = p["transform_append"](content, "4", travResult);

      expect(result).to.deep.equal(
'{ "one": [\n\
    1,\n\
    2,\n\
    3,\n\
    4\n\
] }'
      );
    });
  });

  describe('#transform_prepend', () => {
    it('should prepend to a non-empty array', () => {
      let content = '{ "one": [1, 2, 3] }';
      let metajson = JSONParser.parse(content);
      let travResult = p["traverse"](metajson, "$.one");
      let result = p["transform_prepend"](content, "0", travResult);

      expect(result).to.deep.equal('{ "one": [0, 1, 2, 3] }');
    });

    it('should prepend to an empty array', () => {
      let content = '{ "one": [] }';
      let metajson = JSONParser.parse(content);
      let travResult = p["traverse"](metajson, "$.one");
      let result = p["transform_prepend"](content, "0", travResult);

      expect(result).to.deep.equal('{ "one": [0] }');
    });

    it('should try to copy formatting', () => {
      let content =
'{ "one": [\n\
    1,\n\
    2,\n\
    3\n\
] }';
      let metajson = JSONParser.parse(content);
      let travResult = p["traverse"](metajson, "$.one");
      let result = p["transform_prepend"](content, "0", travResult);

      expect(result).to.deep.equal(
'{ "one": [\n\
    0,\n\
    1,\n\
    2,\n\
    3\n\
] }'
      );
    });
  });

    describe('#transform_insertBefore', () => {
    it('should insert before a middle element in a non-empty array', () => {
      let content = '{ "one": [1, 2, 3] }';
      let metajson = JSONParser.parse(content);
      let travResult = p["traverse"](metajson, "$.one[1]");
      let result = p["transform_insertBefore"](content, "0", travResult);

      expect(result).to.deep.equal('{ "one": [1, 0, 2, 3] }');
    });

    it('should insert before the first element in a non-empty array', () => {
      let content = '{ "one": [1, 2, 3] }';
      let metajson = JSONParser.parse(content);
      let travResult = p["traverse"](metajson, "$.one[0]");
      let result = p["transform_insertBefore"](content, "0", travResult);

      expect(result).to.deep.equal('{ "one": [0, 1, 2, 3] }');
    });

    it('should insert before the last element in a non-empty array', () => {
      let content = '{ "one": [1, 2, 3] }';
      let metajson = JSONParser.parse(content);
      let travResult = p["traverse"](metajson, "$.one[2]");
      let result = p["transform_insertBefore"](content, "0", travResult);

      expect(result).to.deep.equal('{ "one": [1, 2, 0, 3] }');
    });

    it('should throw on element does not exist', () => {
      expect(() => {
        let content = '{ "one": [] }';
        let metajson = JSONParser.parse(content);
        let travResult = p["traverse"](metajson, "$.one[0]");
        let result = p["transform_insertBefore"](content, "0", travResult);
      }).to.throw().and.property('message').to.contain('does not exist');
    });

    it('should try to copy formatting', () => {
      let content =
'{ "one": [\n\
    1,\n\
    2,\n\
    3\n\
] }';
      let metajson = JSONParser.parse(content);
      let travResult = p["traverse"](metajson, "$.one[1]");
      let result = p["transform_insertBefore"](content, "0", travResult);

      expect(result).to.deep.equal(
'{ "one": [\n\
    1,\n\
    0,\n\
    2,\n\
    3\n\
] }'
      );
    });
  });

  describe('#transform_insertAfter', () => {
    it('should insert after a middle element in a non-empty array', () => {
      let content = '{ "one": [1, 2, 3] }';
      let metajson = JSONParser.parse(content);
      let travResult = p["traverse"](metajson, "$.one[1]");
      let result = p["transform_insertAfter"](content, "0", travResult);

      expect(result).to.deep.equal('{ "one": [1, 2, 0, 3] }');
    });

    it('should insert after the first element in a non-empty array', () => {
      let content = '{ "one": [1, 2, 3] }';
      let metajson = JSONParser.parse(content);
      let travResult = p["traverse"](metajson, "$.one[0]");
      let result = p["transform_insertAfter"](content, "0", travResult);

      expect(result).to.deep.equal('{ "one": [1, 0, 2, 3] }');
    });

    it('should insert after the last element in a non-empty array', () => {
      let content = '{ "one": [1, 2, 3] }';
      let metajson = JSONParser.parse(content);
      let travResult = p["traverse"](metajson, "$.one[2]");
      let result = p["transform_insertAfter"](content, "0", travResult);

      expect(result).to.deep.equal('{ "one": [1, 2, 3, 0] }');
    });

    it('should throw on element does not exist', () => {
      expect(() => {
        let content = '{ "one": [] }';
        let metajson = JSONParser.parse(content);
        let travResult = p["traverse"](metajson, "$.one[0]");
        let result = p["transform_insertAfter"](content, "0", travResult);
      }).to.throw().and.property('message').to.contain('does not exist');
    });

    it('should try to copy formatting', () => {
      let content =
'{ "one": [\n\
    1,\n\
    2,\n\
    3\n\
] }';
      let metajson = JSONParser.parse(content);
      let travResult = p["traverse"](metajson, "$.one[1]");
      let result = p["transform_insertAfter"](content, "0", travResult);

      expect(result).to.deep.equal(
'{ "one": [\n\
    1,\n\
    2,\n\
    0,\n\
    3\n\
] }'
      );
    });
  });

  describe('#transform_remove', () => {
    it('should remove an array element', () => {
      let content = '{ "one": [1, 2, 3] }';
      let metajson = JSONParser.parse(content);
      let travResult = p["traverse"](metajson, "$.one[1]");
      let result = p["transform_remove"](content, travResult);

      expect(result).to.deep.equal('{ "one": [1, 3] }');
    });
    it('should remove first array element', () => {
      let content = '{ "one": [1, 2, 3] }';
      let metajson = JSONParser.parse(content);
      let travResult = p["traverse"](metajson, "$.one[0]");
      let result = p["transform_remove"](content, travResult);

      expect(result).to.deep.equal('{ "one": [2, 3] }');
    });
    it('should remove last array element', () => {
      let content = '{ "one": [1, 2, 3] }';
      let metajson = JSONParser.parse(content);
      let travResult = p["traverse"](metajson, "$.one[2]");
      let result = p["transform_remove"](content, travResult);

      expect(result).to.deep.equal('{ "one": [1, 2] }');
    });
    it('should remove an object member pair', () => {
      let content = '{ "one":  { "a": "b", "c": "d", "e": "f" } }';
      let metajson = JSONParser.parse(content);
      let travResult = p["traverse"](metajson, "$.one.c");
      let result = p["transform_remove"](content, travResult);

      expect(result).to.deep.equal('{ "one":  { "a": "b", "e": "f" } }');
    });
    it('should remove first object member pair', () => {
      let content = '{ "one":  { "a": "b", "c": "d", "e": "f" } }';
      let metajson = JSONParser.parse(content);
      let travResult = p["traverse"](metajson, "$.one.a");
      let result = p["transform_remove"](content, travResult);

      expect(result).to.deep.equal('{ "one":  { "c": "d", "e": "f" } }');
    });
    it('should remove last object member pair', () => {
      let content = '{ "one":  { "a": "b", "c": "d", "e": "f" } }';
      let metajson = JSONParser.parse(content);
      let travResult = p["traverse"](metajson, "$.one.e");
      let result = p["transform_remove"](content, travResult);

      expect(result).to.deep.equal('{ "one":  { "a": "b", "c": "d" } }');
    });
  });

  describe('#getTransformValue', () => {
    it('should call the replace function with the needed parameters', () => {
      let content = "chris was here";
      let subject = "";
      let travResult = { destination: { meta: { range: [6, 9] } } };
      let fn = sinon.stub();
      fn.returns("would be");
      let params = new ParamsModel();
      let result = p["applyTransform"](content, subject, travResult, fn, params);
      expect(result).to.equal("chris \"would be\" here");
      sinon.assert.calledWith(fn, subject, travResult);
    });
  });
});
