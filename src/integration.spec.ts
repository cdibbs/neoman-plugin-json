/// <reference path="../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../node_modules/@types/chai/index.d.ts" />
import 'mocha';
import * as chai from 'chai';
let expect = chai.expect, assert = chai.assert;
import * as sinon from 'sinon';

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
