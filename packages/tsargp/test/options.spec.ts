import { describe, describe as on, describe as when, expect, it as should } from 'vitest';
import { type Options, OptionRegistry, valuesFor } from '../lib/options';

describe('OptionRegistry', () => {
  on('constructor', () => {
    should('handle zero options', () => {
      expect(() => new OptionRegistry({})).not.toThrow();
    });

    when('registering option names', () => {
      should('ignore null values', () => {
        const options = {
          flag: {
            type: 'flag',
            names: ['-f', null],
          },
        } as const satisfies Options;
        const registry = new OptionRegistry(options);
        expect(registry.names).toHaveLength(1);
        expect(registry.names.get('-f')).toEqual('flag');
        expect(options.flag).toHaveProperty('preferredName', '-f');
      });

      should('include the positional marker', () => {
        const options = {
          single: {
            type: 'single',
            positional: '',
            preferredName: 'preferred',
          },
        } as const satisfies Options;
        const registry = new OptionRegistry(options);
        expect(registry.names).toHaveLength(1);
        expect(registry.names.get('')).toEqual('single');
        expect(registry.positional).toEqual(['single', options.single, 'preferred']);
      });
    });

    when('registering cluster letters', () => {
      should('register each letter', () => {
        const options = {
          flag: {
            type: 'flag',
            cluster: 'fF',
          },
        } as const satisfies Options;
        const registry = new OptionRegistry(options);
        expect(registry.letters).toHaveLength(2);
        expect(registry.letters.get('f')).toEqual('flag');
        expect(registry.letters.get('F')).toEqual('flag');
      });
    });
  });
});

describe('valuesFor', () => {
  should('return an empty object', () => {
    expect(valuesFor({})).toEqual({});
  });
});
