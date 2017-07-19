/// <reference path="../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../node_modules/@types/chai/index.d.ts" />
import 'mocha';
import * as chai from 'chai';
let expect = chai.expect, assert = chai.assert;
import * as sinon from 'sinon';

describe('something', () => {
  it('bad', () => {
    expect(true).to.be.true;
  });
});
