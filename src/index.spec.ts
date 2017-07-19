/// <reference path="../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../node_modules/@types/chai/index.d.ts" />
/// <reference path="../node_modules/@types/node/index.d.ts" />
import 'mocha';
import * as chai from 'chai';
let expect = chai.expect, assert = chai.assert;
import * as sinon from 'sinon';

let JSONPlugin = require('./index');

describe('JSONPlugin', () => {
  let p: any;
  beforeEach(() => {
    p = new JSONPlugin();
  });

  describe('#traverse', () => {
    it('should correctly traverse a given object with a given JSONPath', () => {
      let obj = { chris: ["one", "two", "three"] };
      let tr = p["traverse"](obj, "$.chris[1]");
      expect(tr.result).to.equal("two");
    });
  });
});
