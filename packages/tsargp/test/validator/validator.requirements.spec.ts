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
      expect(() => validator.validate()).toThrow(`Option requires requires itself.`);
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
      expect(() => validator.validate()).toThrow(`Unknown option unknown in requirement.`);
    });

    it('should throw an error on required help option', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f'],
          requires: 'required',
        },
        required: {
          type: 'help',
          names: ['-h'],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(`Invalid option required in requirement.`);
    });

    it('should throw an error on required version option', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f'],
          requires: 'required',
        },
        required: {
          type: 'version',
          names: ['-v'],
          version: '',
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(`Invalid option required in requirement.`);
    });

    it('should throw an error on function option required with a value', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f1'],
          requires: { required: 1 },
        },
        required: {
          type: 'function',
          names: ['-f2'],
          exec: () => {},
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(`Invalid option required in requirement.`);
    });

    it('should throw an error on command option required with a value', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f1'],
          requires: { required: 1 },
        },
        required: {
          type: 'command',
          names: ['-c'],
          options: {},
          cmd: () => {},
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(`Invalid option required in requirement.`);
    });

    it('should throw an error on option required to be present despite being always required', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f1'],
          requires: { required: undefined },
        },
        required: {
          type: 'flag',
          names: ['-f2'],
          required: true,
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(
        `Option required has invalid required value. Option is always required or has a default value.`,
      );
    });

    it('should throw an error on option required to be absent despite being always required', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f1'],
          requires: { required: null },
        },
        required: {
          type: 'flag',
          names: ['-f2'],
          required: true,
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(
        `Option required has invalid required value. Option is always required or has a default value.`,
      );
    });

    it('should throw an error on option required to be present despite having a default value', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f1'],
          requires: { required: undefined },
        },
        required: {
          type: 'flag',
          names: ['-f2'],
          default: true,
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(
        `Option required has invalid required value. Option is always required or has a default value.`,
      );
    });

    it('should throw an error on option required to be absent despite having a default value', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f1'],
          requires: { required: null },
        },
        required: {
          type: 'flag',
          names: ['-f2'],
          default: true,
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(
        `Option required has invalid required value. Option is always required or has a default value.`,
      );
    });

    it('should allow a function option required to be present or absent', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f1'],
          requires: { required1: undefined, required2: null },
        },
        required1: {
          type: 'function',
          names: ['-f2'],
          exec: () => {},
        },
        required2: {
          type: 'function',
          names: ['-f3'],
          exec: () => {},
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).not.toThrow();
    });

    it('should allow a command option required to be present or absent', () => {
      const options = {
        flag: {
          type: 'flag',
          names: ['-f1'],
          requires: { required1: undefined, required2: null },
        },
        required1: {
          type: 'command',
          names: ['-c1'],
          options: {},
          cmd: () => {},
        },
        required2: {
          type: 'command',
          names: ['-c2'],
          options: {},
          cmd: () => {},
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).not.toThrow();
    });

    it('should allow a flag option required to be present or absent', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f1'],
          requires: { required1: undefined, required2: null },
        },
        required1: {
          type: 'flag',
          names: ['-f2'],
        },
        required2: {
          type: 'flag',
          names: ['-f3'],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).not.toThrow();
    });

    it('should allow a flag option required with a value', () => {
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
      expect(() => validator.validate()).not.toThrow();
    });

    it('should throw an error on flag option required with an incompatible value', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f1'],
          requires: { required: 'abc' },
        },
        required: {
          type: 'flag',
          names: ['-f2'],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(
        `Option required has incompatible required value <abc>. Should be of type 'boolean'.`,
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
        `Option required has incompatible required value <1>. Should be of type 'boolean'.`,
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
        `Option required has incompatible required value <1>. Should be of type 'string'.`,
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
        `Option required has incompatible required value <1>. Should be of type 'number'.`,
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
        `Option required has incompatible required value <1>. Should be of type 'object'.`,
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
        `Option required has incompatible required value <1>. Should be of type 'string'.`,
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
        `Option required has incompatible required value <1>. Should be of type 'object'.`,
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
        `Option required has incompatible required value <1>. Should be of type 'number'.`,
      );
    });

    it('should throw an error on option required by its own presence', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f1'],
          requiredIf: req.all('other', req.one({ requires: 'o' })),
        },
        other: {
          type: 'flag',
          names: ['-f2'],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(`Option requires requires itself.`);
    });

    it('should throw an error on option required if an unknown option is present', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f1'],
          requiredIf: req.all('other', req.one({ unknown: 'o' })),
        },
        other: {
          type: 'flag',
          names: ['-f2'],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(`Unknown option unknown in requirement.`);
    });

    it('should throw an error on option required if a help option is present', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f'],
          requiredIf: 'other',
        },
        other: {
          type: 'help',
          names: ['-h'],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(`Invalid option other in requirement.`);
    });

    it('should throw an error on option required if a version option is present', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f'],
          requiredIf: 'other',
        },
        other: {
          type: 'version',
          names: ['-v'],
          version: '',
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(`Invalid option other in requirement.`);
    });

    it('should throw an error on option required if a function option has a value', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f1'],
          requiredIf: { other: 1 },
        },
        other: {
          type: 'function',
          names: ['-f2'],
          exec: () => {},
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(`Invalid option other in requirement.`);
    });

    it('should throw an error on option required if a command option has a value', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f1'],
          requiredIf: { other: 1 },
        },
        other: {
          type: 'command',
          names: ['-c'],
          options: {},
          cmd: () => {},
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(`Invalid option other in requirement.`);
    });

    it('should throw an error on option required if another is present despite being always required', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f1'],
          requiredIf: { other: undefined },
        },
        other: {
          type: 'flag',
          names: ['-f2'],
          required: true,
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(
        `Option other has invalid required value. Option is always required or has a default value.`,
      );
    });

    it('should throw an error on option required if another is absent despite being always required', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f1'],
          requiredIf: { other: null },
        },
        other: {
          type: 'flag',
          names: ['-f2'],
          required: true,
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(
        `Option other has invalid required value. Option is always required or has a default value.`,
      );
    });

    it('should throw an error on option required if another is present despite having a default value', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f1'],
          requiredIf: { other: undefined },
        },
        other: {
          type: 'flag',
          names: ['-f2'],
          default: true,
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(
        `Option other has invalid required value. Option is always required or has a default value.`,
      );
    });

    it('should throw an error on option required if another is absent despite having a default value', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f1'],
          requiredIf: { other: null },
        },
        other: {
          type: 'flag',
          names: ['-f2'],
          default: true,
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(
        `Option other has invalid required value. Option is always required or has a default value.`,
      );
    });

    it('should allow an option required if a function option is present or absent', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f1'],
          requiredIf: { other1: undefined, other2: null },
        },
        other1: {
          type: 'function',
          names: ['-f2'],
          exec: () => {},
        },
        other2: {
          type: 'function',
          names: ['-f3'],
          exec: () => {},
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).not.toThrow();
    });

    it('should allow an option required if a command option is present or absent', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f1'],
          requiredIf: { other1: undefined, other2: null },
        },
        other1: {
          type: 'command',
          names: ['-c1'],
          options: {},
          cmd: () => {},
        },
        other2: {
          type: 'command',
          names: ['-c2'],
          options: {},
          cmd: () => {},
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).not.toThrow();
    });

    it('should allow an option required if a flag option is present or absent', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f1'],
          requiredIf: { other1: undefined, other2: null },
        },
        other1: {
          type: 'flag',
          names: ['-f2'],
        },
        other2: {
          type: 'flag',
          names: ['-f3'],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).not.toThrow();
    });

    it('should allow an option required if a flag option has a value', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f1'],
          requiredIf: { other: true },
        },
        other: {
          type: 'flag',
          names: ['-f2'],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).not.toThrow();
    });

    it('should throw an error on option required if a flag option has an incompatible value', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f1'],
          requiredIf: { other: 'abc' },
        },
        other: {
          type: 'flag',
          names: ['-f2'],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(
        `Option other has incompatible required value <abc>. Should be of type 'boolean'.`,
      );
    });

    it('should throw an error on option required if a boolean option has an incompatible value', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f'],
          requiredIf: { other: 1 },
        },
        other: {
          type: 'boolean',
          names: ['-b'],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(
        `Option other has incompatible required value <1>. Should be of type 'boolean'.`,
      );
    });

    it('should throw an error on option required if a string option has an incompatible value', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f'],
          requiredIf: { other: 1 },
        },
        other: {
          type: 'string',
          names: ['-s'],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(
        `Option other has incompatible required value <1>. Should be of type 'string'.`,
      );
    });

    it('should throw an error on option required if a number option has an incompatible value', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f'],
          requiredIf: { other: '1' },
        },
        other: {
          type: 'number',
          names: ['-n'],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(
        `Option other has incompatible required value <1>. Should be of type 'number'.`,
      );
    });

    it('should throw an error on option required if a strings option has an incompatible value', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f'],
          requiredIf: { other: 1 },
        },
        other: {
          type: 'strings',
          names: ['-ss'],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(
        `Option other has incompatible required value <1>. Should be of type 'object'.`,
      );
    });

    it('should throw an error on option required if a strings option has an incompatible array element', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f'],
          requiredIf: { other: [1] },
        },
        other: {
          type: 'strings',
          names: ['-ss'],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(
        `Option other has incompatible required value <1>. Should be of type 'string'.`,
      );
    });

    it('should throw an error on option required if a numbers option has an incompatible value', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f'],
          requiredIf: { other: 1 },
        },
        other: {
          type: 'numbers',
          names: ['-ns'],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(
        `Option other has incompatible required value <1>. Should be of type 'object'.`,
      );
    });

    it('should throw an error on option required if a numbers option has an incompatible array element', () => {
      const options = {
        requires: {
          type: 'flag',
          names: ['-f'],
          requiredIf: { other: ['1'] },
        },
        other: {
          type: 'numbers',
          names: ['-ns'],
        },
      } as const satisfies Options;
      const validator = new OptionValidator(options);
      expect(() => validator.validate()).toThrow(
        `Option other has incompatible required value <1>. Should be of type 'number'.`,
      );
    });
  });
});
