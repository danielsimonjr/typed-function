/**
 * Security tests ported from security.test.mjs
 * Tests for security handling in typed functions
 */

import { describe, it } from 'vitest';
import typed from '../src/index.js';

describe('security (legacy)', () => {
  it('should not allow bad code in the function name', () => {
    // simple example:
    // var fn = typed("(){}+console.log('hacked...');function a", {
    //   "": function () {}
    // });

    // example resulting in throwing an error if successful
    typed("(){}+(function(){throw new Error('Hacked... should not have executed this function!!!')})();function a", {
      '': function () {},
    });
  });
});
