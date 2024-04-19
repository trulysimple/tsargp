import { describe, describe as on, expect, it as should, vi } from 'vitest';
import { type Options } from '../../lib/options';
import { ArgumentParser } from '../../lib/parser';

process.env['FORCE_WIDTH'] = '0'; // omit styles

describe('ArgumentParser', () => {
  on('parse', () => {
    should('handle a flag option with value from environment variable', async () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f'],
          env: ['FLAG'],
          parse: vi.fn(() => true),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      process.env['FLAG'] = '1';
      await expect(parser.parse([])).resolves.toEqual({ flag: true });
      expect(options.flag.parse).toHaveBeenCalledWith(['1'], {
        values: { flag: true }, // should have been { flag: undefined } at the time of call
        index: NaN,
        name: 'FLAG',
        comp: false,
        format: expect.anything(),
      });
      expect(options.flag.parse).toHaveBeenCalled();
    });

    should('handle a single-valued option with value from positional argument', async () => {
      const options = {
        single: {
          type: 'single',
          positional: true,
          preferredName: 'preferred',
          parse: vi.fn((param) => param),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['1', '2'])).resolves.toEqual({ single: '2' });
      expect(options.single.parse).toHaveBeenCalledWith('1', {
        values: { single: '2' }, // should have been { single: undefined } at the time of call
        index: 0,
        name: 'preferred',
        comp: false,
        format: expect.anything(),
      });
      expect(options.single.parse).toHaveBeenCalledWith('2', {
        values: { single: '2' }, // should have been { single: undefined } at the time of call
        index: 1,
        name: 'preferred',
        comp: false,
        format: expect.anything(),
      });
      expect(options.single.parse).toHaveBeenCalledTimes(2);
    });

    should('handle an array-valued option with asynchronous parse callback', async () => {
      const options = {
        array: {
          type: 'array',
          names: ['-a'],
          async parse(param) {
            return param === this.type; // test `this`
          },
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-a', 'abc'])).resolves.toEqual({ array: [false] });
      await expect(parser.parse(['-a', 'array'])).resolves.toEqual({ array: [true] });
    });

    should('handle a function option with value from named argument', async () => {
      const options = {
        function: {
          type: 'function',
          names: ['-f'],
          parse: vi.fn((param) => param),
        },
      } as const satisfies Options;
      const parser = new ArgumentParser(options);
      await expect(parser.parse(['-f', '1'])).resolves.toEqual({ function: ['1'] });
      expect(options.function.parse).toHaveBeenCalledWith(['1'], {
        values: { function: ['1'] }, // should have been { function: undefined } at the time of call
        index: 0,
        name: '-f',
        comp: false,
        format: expect.anything(),
      });
      expect(options.function.parse).toHaveBeenCalled();
    });
  });
});
