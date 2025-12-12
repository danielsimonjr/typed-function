/**
 * Tests for debug.ts module
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  configureDebug,
  resetDebug,
  isDebugEnabled,
  getDebugLevel,
  addDebugHandler,
  emitDebugEvent,
  formatSignature,
  formatParam,
  formatArgs,
  wrapWithDebug,
  enableDebug,
  disableDebug,
  levelPriority,
  type DebugLevel,
  type DebugEvent,
  type DebugHandler,
} from '../src/debug.js';
import typed from '../src/index.js';

describe('debug module', () => {
  // Reset debug state before each test
  beforeEach(() => {
    resetDebug();
  });

  afterEach(() => {
    resetDebug();
    vi.restoreAllMocks();
  });

  describe('configureDebug', () => {
    it('should enable debug mode', () => {
      expect(isDebugEnabled()).toBe(false);
      configureDebug({ enabled: true });
      expect(isDebugEnabled()).toBe(true);
    });

    it('should set debug level', () => {
      expect(getDebugLevel()).toBe('info');
      configureDebug({ level: 'debug' });
      expect(getDebugLevel()).toBe('debug');
    });

    it('should add handler when provided', () => {
      const events: DebugEvent[] = [];
      const handler: DebugHandler = (event) => events.push(event);

      configureDebug({ enabled: true, handler });
      emitDebugEvent('function:create', { signatureCount: 1 }, 'test');

      expect(events.length).toBe(1);
      expect(events[0].type).toBe('function:create');
    });

    it('should enable timing when configured', () => {
      const events: DebugEvent[] = [];
      const handler: DebugHandler = (event) => events.push(event);

      configureDebug({ enabled: true, timing: true, handler });
      emitDebugEvent('function:create', {}, 'test');

      expect(events.length).toBe(1);
      // With timing, timestamp should be from performance.now() (small number)
      expect(events[0].timestamp).toBeLessThan(Date.now());
    });

    it('should enable stack traces when configured', () => {
      const events: DebugEvent[] = [];
      const handler: DebugHandler = (event) => events.push(event);

      configureDebug({ enabled: true, stackTraces: true, handler });
      emitDebugEvent('function:create', { test: 'value' }, 'test');

      expect(events.length).toBe(1);
      expect(events[0].data?.stack).toBeDefined();
      expect(typeof events[0].data?.stack).toBe('string');
    });

    it('should filter events by type', () => {
      const events: DebugEvent[] = [];
      const handler: DebugHandler = (event) => events.push(event);

      configureDebug({
        enabled: true,
        filter: ['function:create'],
        handler,
      });

      emitDebugEvent('function:create', {}, 'test');
      emitDebugEvent('function:call', {}, 'test');
      emitDebugEvent('dispatch:start', {}, 'test');

      expect(events.length).toBe(1);
      expect(events[0].type).toBe('function:create');
    });
  });

  describe('resetDebug', () => {
    it('should reset to default configuration', () => {
      configureDebug({ enabled: true, level: 'trace' });
      expect(isDebugEnabled()).toBe(true);
      expect(getDebugLevel()).toBe('trace');

      resetDebug();

      expect(isDebugEnabled()).toBe(false);
      expect(getDebugLevel()).toBe('info');
    });

    it('should clear handlers', () => {
      const events: DebugEvent[] = [];
      const handler: DebugHandler = (event) => events.push(event);

      configureDebug({ enabled: true, handler });
      resetDebug();
      configureDebug({ enabled: true });

      // Spy on console.log since there's no handler now
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      emitDebugEvent('function:create', { signatureCount: 1 }, 'test');

      expect(events.length).toBe(0);
      consoleSpy.mockRestore();
    });
  });

  describe('isDebugEnabled', () => {
    it('should return false by default', () => {
      expect(isDebugEnabled()).toBe(false);
    });

    it('should return true when enabled', () => {
      configureDebug({ enabled: true });
      expect(isDebugEnabled()).toBe(true);
    });
  });

  describe('getDebugLevel', () => {
    it('should return info by default', () => {
      expect(getDebugLevel()).toBe('info');
    });

    it('should return configured level', () => {
      configureDebug({ level: 'error' });
      expect(getDebugLevel()).toBe('error');
    });
  });

  describe('addDebugHandler', () => {
    it('should add handler and return removal function', () => {
      const events: DebugEvent[] = [];
      const handler: DebugHandler = (event) => events.push(event);

      configureDebug({ enabled: true });
      const remove = addDebugHandler(handler);

      emitDebugEvent('function:create', {}, 'test');
      expect(events.length).toBe(1);

      // Remove handler
      remove();

      // Spy on console.log since there's no handler now
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      emitDebugEvent('function:create', {}, 'test');
      expect(events.length).toBe(1); // Still 1, handler was removed
      consoleSpy.mockRestore();
    });

    it('should allow multiple handlers', () => {
      const events1: DebugEvent[] = [];
      const events2: DebugEvent[] = [];

      configureDebug({ enabled: true });
      addDebugHandler((event) => events1.push(event));
      addDebugHandler((event) => events2.push(event));

      emitDebugEvent('function:create', {}, 'test');

      expect(events1.length).toBe(1);
      expect(events2.length).toBe(1);
    });
  });

  describe('emitDebugEvent', () => {
    it('should not emit when debug is disabled', () => {
      const events: DebugEvent[] = [];
      const handler: DebugHandler = (event) => events.push(event);

      addDebugHandler(handler);
      emitDebugEvent('function:create', {}, 'test');

      expect(events.length).toBe(0);
    });

    it('should emit when debug is enabled', () => {
      const events: DebugEvent[] = [];
      const handler: DebugHandler = (event) => events.push(event);

      configureDebug({ enabled: true, handler });
      emitDebugEvent('function:create', { signatureCount: 5 }, 'myFunc');

      expect(events.length).toBe(1);
      expect(events[0].type).toBe('function:create');
      expect(events[0].fnName).toBe('myFunc');
      expect(events[0].data?.signatureCount).toBe(5);
    });

    it('should handle events without fnName', () => {
      const events: DebugEvent[] = [];
      const handler: DebugHandler = (event) => events.push(event);

      configureDebug({ enabled: true, handler });
      emitDebugEvent('type:register', { typeName: 'Custom' });

      expect(events.length).toBe(1);
      expect(events[0].fnName).toBeUndefined();
    });

    it('should handle events without data', () => {
      const events: DebugEvent[] = [];
      const handler: DebugHandler = (event) => events.push(event);

      configureDebug({ enabled: true, handler });
      emitDebugEvent('dispatch:start', undefined, 'test');

      expect(events.length).toBe(1);
      expect(events[0].data).toBeUndefined();
    });

    it('should ignore handler errors', () => {
      const errorHandler: DebugHandler = () => {
        throw new Error('Handler error');
      };
      const events: DebugEvent[] = [];
      const successHandler: DebugHandler = (event) => events.push(event);

      configureDebug({ enabled: true });
      addDebugHandler(errorHandler);
      addDebugHandler(successHandler);

      // Should not throw
      expect(() => emitDebugEvent('function:create', {}, 'test')).not.toThrow();
      expect(events.length).toBe(1);
    });

    it('should log to console when no custom handler', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      configureDebug({ enabled: true });
      emitDebugEvent('function:create', { signatureCount: 3 }, 'test');

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('logEvent (via emitDebugEvent)', () => {
    let consoleSpy: ReturnType<typeof vi.spyOn>;
    let warnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      configureDebug({ enabled: true });
    });

    afterEach(() => {
      consoleSpy.mockRestore();
      warnSpy.mockRestore();
    });

    it('should log function:create events', () => {
      emitDebugEvent('function:create', { signatureCount: 5 }, 'myFunc');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[typed-function:function:create]'),
      );
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('5 signatures'));
    });

    it('should log function:call events', () => {
      emitDebugEvent('function:call', { argCount: 2 }, 'myFunc');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[typed-function:function:call]'),
      );
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('2 arguments'));
    });

    it('should log dispatch:start events', () => {
      emitDebugEvent('dispatch:start', {}, 'myFunc');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[typed-function:dispatch:start]'),
      );
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('dispatching'));
    });

    it('should log dispatch:match events', () => {
      emitDebugEvent('dispatch:match', { signature: 'number, number' }, 'myFunc');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[typed-function:dispatch:match]'),
      );
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('number, number'));
    });

    it('should log dispatch:nomatch events with console.warn', () => {
      emitDebugEvent('dispatch:nomatch', {}, 'myFunc');
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[typed-function:dispatch:nomatch]'),
      );
    });

    it('should log dispatch:conversion events', () => {
      emitDebugEvent('dispatch:conversion', { from: 'string', to: 'number' }, 'myFunc');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[typed-function:dispatch:conversion]'),
      );
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('string -> number'));
    });

    it('should log type:register events', () => {
      emitDebugEvent('type:register', { typeName: 'CustomType' });
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[typed-function:type:register]'),
      );
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('CustomType'));
    });

    it('should log conversion:register events', () => {
      emitDebugEvent('conversion:register', { from: 'string', to: 'number' });
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[typed-function:conversion:register]'),
      );
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('string -> number'));
    });

    it('should log wasm:init events', () => {
      emitDebugEvent('wasm:init', { success: true });
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[typed-function:wasm:init]'),
      );
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('success'));
    });

    it('should log wasm:init failure events', () => {
      emitDebugEvent('wasm:init', { success: false });
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('failed'));
    });

    it('should log wasm:dispatch events', () => {
      emitDebugEvent('wasm:dispatch', {}, 'myFunc');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[typed-function:wasm:dispatch]'),
      );
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('WASM dispatch'));
    });

    it('should log cache:hit events', () => {
      emitDebugEvent('cache:hit', {}, 'myFunc');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[typed-function:cache:hit]'),
      );
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('cache hit'));
    });

    it('should log cache:miss events', () => {
      emitDebugEvent('cache:miss', {}, 'myFunc');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[typed-function:cache:miss]'),
      );
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('cache miss'));
    });

    it('should log events without fnName', () => {
      emitDebugEvent('type:register', { typeName: 'Test' });
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[typed-function:type:register]'),
      );
    });

    it('should handle missing data fields gracefully', () => {
      emitDebugEvent('function:create', {}, 'test');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('0 signatures'));
    });
  });

  describe('formatSignature', () => {
    it('should format signature with params', () => {
      const signature = {
        params: [{ name: 'number' }, { name: 'string' }],
        fn: () => {},
      };
      expect(formatSignature(signature as any)).toBe('number, string');
    });

    it('should format empty signature', () => {
      const signature = { params: [], fn: () => {} };
      expect(formatSignature(signature as any)).toBe('');
    });
  });

  describe('formatParam', () => {
    it('should format regular param', () => {
      const param = { name: 'number', restParam: false };
      expect(formatParam(param as any)).toBe('number');
    });

    it('should format rest param with prefix', () => {
      const param = { name: 'number', restParam: true };
      expect(formatParam(param as any)).toBe('...number');
    });
  });

  describe('formatArgs', () => {
    it('should format primitive types', () => {
      expect(formatArgs([1, 'hello', true])).toBe('number, string, boolean');
    });

    it('should format null', () => {
      expect(formatArgs([null])).toBe('null');
    });

    it('should format objects with constructor name', () => {
      expect(formatArgs([{ a: 1 }])).toBe('Object');
      expect(formatArgs([new Date()])).toBe('Date');
      expect(formatArgs([[1, 2, 3]])).toBe('Array');
    });

    it('should format function type', () => {
      expect(formatArgs([() => {}])).toBe('function');
    });

    it('should format undefined', () => {
      expect(formatArgs([undefined])).toBe('undefined');
    });

    it('should format empty args', () => {
      expect(formatArgs([])).toBe('');
    });
  });

  describe('wrapWithDebug', () => {
    it('should wrap typed function and emit events on call', () => {
      const events: DebugEvent[] = [];
      const handler: DebugHandler = (event) => events.push(event);

      const add = typed('add', {
        'number, number': (a: number, b: number) => a + b,
      });

      const debugAdd = wrapWithDebug(add);

      configureDebug({ enabled: true, handler });

      const result = debugAdd(2, 3);

      expect(result).toBe(5);
      expect(events.length).toBe(3);
      expect(events[0].type).toBe('function:call');
      expect(events[1].type).toBe('dispatch:start');
      expect(events[2].type).toBe('dispatch:match');
    });

    it('should emit nomatch event on error', () => {
      const events: DebugEvent[] = [];
      const handler: DebugHandler = (event) => events.push(event);

      const add = typed('add', {
        'number, number': (a: number, b: number) => a + b,
      });

      const debugAdd = wrapWithDebug(add);

      configureDebug({ enabled: true, handler });

      expect(() => debugAdd('wrong', 'types')).toThrow();

      const nomatchEvent = events.find((e) => e.type === 'dispatch:nomatch');
      expect(nomatchEvent).toBeDefined();
      expect(nomatchEvent?.data?.error).toBeDefined();
    });

    it('should preserve function properties', () => {
      const fn = typed('myFunc', {
        'number': (n: number) => n * 2,
      });

      const wrapped = wrapWithDebug(fn);

      expect(wrapped.name).toBe('myFunc');
      expect(wrapped.signatures).toBeDefined();
      expect(wrapped._typedFunctionData).toBeDefined();
    });

    it('should handle anonymous functions', () => {
      const events: DebugEvent[] = [];
      const handler: DebugHandler = (event) => events.push(event);

      const fn = typed({
        'number': (n: number) => n * 2,
      });

      const wrapped = wrapWithDebug(fn);

      configureDebug({ enabled: true, handler });
      wrapped(5);

      // Anonymous functions get name 'anonymous' from wrapWithDebug
      expect(events[0].fnName).toBe('anonymous');
    });

    it('should preserve this context', () => {
      const obj = {
        value: 10,
        add: typed('add', {
          'number': function(this: { value: number }, n: number) {
            return this.value + n;
          },
        }),
      };

      obj.add = wrapWithDebug(obj.add);

      configureDebug({ enabled: true });
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = obj.add(5);
      expect(result).toBe(15);

      consoleSpy.mockRestore();
    });
  });

  describe('enableDebug', () => {
    it('should enable debug with default info level', () => {
      enableDebug();
      expect(isDebugEnabled()).toBe(true);
      expect(getDebugLevel()).toBe('info');
    });

    it('should enable debug with specified level', () => {
      enableDebug('trace');
      expect(isDebugEnabled()).toBe(true);
      expect(getDebugLevel()).toBe('trace');
    });
  });

  describe('disableDebug', () => {
    it('should disable debug mode', () => {
      enableDebug();
      expect(isDebugEnabled()).toBe(true);

      disableDebug();
      expect(isDebugEnabled()).toBe(false);
    });
  });

  describe('levelPriority', () => {
    it('should have correct priority values', () => {
      expect(levelPriority.none).toBe(0);
      expect(levelPriority.error).toBe(1);
      expect(levelPriority.warn).toBe(2);
      expect(levelPriority.info).toBe(3);
      expect(levelPriority.debug).toBe(4);
      expect(levelPriority.trace).toBe(5);
    });

    it('should have increasing priority from error to trace', () => {
      const levels: DebugLevel[] = ['none', 'error', 'warn', 'info', 'debug', 'trace'];
      for (let i = 1; i < levels.length; i++) {
        expect(levelPriority[levels[i]]).toBeGreaterThan(levelPriority[levels[i - 1]]);
      }
    });
  });
});
