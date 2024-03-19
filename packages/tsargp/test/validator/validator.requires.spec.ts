import { describe, expect, it } from 'vitest';
import { type Options, OptionValidator, req } from '../../lib';
import '../utils.spec';

describe('OptionValidator', () => {
  describe('validate', () => {
    it('should throw an error on option required by itself', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f1'],
          requires: req.all('required', req.one({ requires: 'o' })),
        },
        required: {
          type: 'flag',
          names: ['-f2'],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(/Option requires requires itself\./);
    });

    it('should throw an error on unknown required option', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f1'],
          requires: req.all('required', req.one({ unknown: 'o' })),
        },
        required: {
          type: 'flag',
          names: ['-f2'],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(/Unknown required option unknown\./);
    });

    it('should allow an option required to be present', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f1'],
          requires: { required: undefined },
        },
        required: {
          type: 'flag',
          names: ['-f2'],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).not.toThrow();
    });

    it('should allow an option required to be absent', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f1'],
          requires: { required: null },
        },
        required: {
          type: 'flag',
          names: ['-f2'],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).not.toThrow();
    });

    it('should throw an error on flag option required with a value', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f1'],
          requires: { required: true },
        },
        required: {
          type: 'flag',
          names: ['-f2'],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(
        /Required option required does not accept values\./,
      );
    });

    it('should throw an error on function option required with a value', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f1'],
          requires: { required: true },
        },
        required: {
          type: 'function',
          names: ['-f2'],
          exec: () => {},
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(
        /Required option required does not accept values\./,
      );
    });

    it('should throw an error on boolean option required with an incompatible value', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f'],
          requires: { required: 1 },
        },
        required: {
          type: 'boolean',
          names: ['-b'],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(
        /Option required has incompatible value <1>\. Should be of type 'boolean'\./,
      );
    });

    it('should throw an error on string option required with an incompatible value', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f'],
          requires: { required: 1 },
        },
        required: {
          type: 'string',
          names: ['-s'],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(
        /Option required has incompatible value <1>\. Should be of type 'string'\./,
      );
    });

    it('should throw an error on number option required with an incompatible value', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f'],
          requires: { required: '1' },
        },
        required: {
          type: 'number',
          names: ['-n'],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(
        /Option required has incompatible value <1>\. Should be of type 'number'\./,
      );
    });

    it('should throw an error on strings option required with an incompatible value', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f'],
          requires: { required: 1 },
        },
        required: {
          type: 'strings',
          names: ['-ss'],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(
        /Option required has incompatible value <1>\. Should be of type 'object'\./,
      );
    });

    it('should throw an error on strings option required with an incompatible array element', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f'],
          requires: { required: [1] },
        },
        required: {
          type: 'strings',
          names: ['-ss'],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(
        /Option required has incompatible value <1>\. Should be of type 'string'\./,
      );
    });

    it('should throw an error on numbers option required with an incompatible value', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f'],
          requires: { required: 1 },
        },
        required: {
          type: 'numbers',
          names: ['-ns'],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(
        /Option required has incompatible value <1>\. Should be of type 'object'\./,
      );
    });

    it('should throw an error on numbers option required with an incompatible array element', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f'],
          requires: { required: ['1'] },
        },
        required: {
          type: 'numbers',
          names: ['-ns'],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(
        /Option required has incompatible value <1>\. Should be of type 'number'\./,
      );
    });
  });
});
