//--------------------------------------------------------------------------------------------------
// Imports and Exports
//--------------------------------------------------------------------------------------------------
import type {
  Option,
  Options,
  Requires,
  RequiresVal,
  ParamOption,
  StringOption,
  StringsOption,
  NumberOption,
  NumbersOption,
  ArrayOption,
} from './options';
import type { Style } from './styles';

import { RequiresAll, RequiresOne, RequiresNot, isNiladic } from './options';
import { tf, fg, style, TerminalString, ErrorMessage } from './styles';

export type { Positional, Concrete, ErrorStyles, ErrorConfig, ConcreteStyles, ConcreteError };
export { OptionValidator, ErrorItem, defaultConfig, formatFunctions };

//--------------------------------------------------------------------------------------------------
// Constants
//--------------------------------------------------------------------------------------------------
/**
 * The kind of items that can be thrown as error messages.
 */
// Internal note: this needs to be defined before `defaultConfig`, otherwise bun chokes.
const enum ErrorItem {
  /**
   * Raised by the parser when an option parameter fails to be parsed.
   */
  parseError,
  /**
   * Raised by the parser when an option parameter fails to be parsed, and there are option name
   * suggestions.
   */
  parseErrorWithSimilar,
  /**
   * Raised by the parser when an option name is not found.
   */
  unknownOption,
  /**
   * Raised by the parser when an option name is not found, and there are option name suggestions.
   */
  unknownOptionWithSimilar,
  /**
   * Raised by the parser when an option requirement is not satisfied.
   */
  optionRequires,
  /**
   * Raised by the parser when an option that is required was not specified (or vice-versa).
   */
  missingRequiredOption,
  /**
   * Raised by the parser when an option parameter is expected but was not specified.
   */
  missingParameter,
  /**
   * Raised by the parser when it fails to find a "package.json" file when resolving the version.
   */
  missingPackageJson,
  /**
   * Raised by the parser when a positional marker is specified with an inline value.
   */
  positionalInlineValue,
  /**
   * Raised by the parser when a niladic option is specified with an inline value.
   */
  optionInlineValue,
  /**
   * Raised by the validator when a positional option has an empty positional marker string.
   */
  emptyPositionalMarker,
  /**
   * Raised by the validator when an option has an invalid name.
   */
  invalidOptionName,
  /**
   * Raised by the validator when a version option has an empty version string.
   */
  optionEmptyVersion,
  /**
   * Raised by the validator when an option requires itself.
   */
  optionRequiresItself,
  /**
   * Raised by the validator when an option requires an unknown option.
   */
  unknownRequiredOption,
  /**
   * Raised by the validator when an option requires a niladic option with a value.
   */
  niladicOptionRequiredValue,
  /**
   * Raised by the validator when an option has a zero-length enumeration array.
   */
  optionZeroEnum,
  /**
   * Raised by the validator when an option has a duplicate name.
   */
  duplicateOptionName,
  /**
   * Raised by the validator when there are two or more positional options.
   */
  duplicatePositionalOption,
  /**
   * Raised by the validator when a string enumeration constraint has duplicate values.
   */
  duplicateStringOptionEnum,
  /**
   * Raised by the validator when a number enumeration constraint has duplicate values.
   */
  duplicateNumberOptionEnum,
  /**
   * Raised by the validator when an option is required with a value of incompatible data type.
   */
  optionValueIncompatible,
  /**
   * Raised by either the parser or validator when a value fails to satisfy a string option's
   * enumeration constraint.
   */
  stringOptionEnums,
  /**
   * Raised by either the parser or validator when a value fails to satisfy a string option's
   * regex constraint.
   */
  stringOptionRegex,
  /**
   * Raised by either the parser or validator when a value fails to satisfy a number option's
   * enumeration constraint.
   */
  numberOptionEnums,
  /**
   * Raised by either the parser or validator when a value fails to satisfy a number option's
   * range constraint.
   */
  numberOptionRange,
  /**
   * Raised by either the parser or validator when a value fails to satisfy an array option's
   * limit constraint.
   */
  arrayOptionLimit,
}

/**
 * The error formatting functions.
 */
const formatFunctions = {
  /**
   * The boolean formatting function.
   */
  b: formatBoolean,
  /**
   * The string formatting function.
   */
  s: formatString,
  /**
   * The number formatting function.
   */
  n: formatNumber,
  /**
   * The regex formatting function.
   */
  r: formatRegExp,
  /**
   * The option name formatting function.
   */
  o: formatOption,
  /**
   * The option parameter formatting function.
   */
  p: formatParam,
  /**
   * The URL formatting function.
   */
  u: formatURL,
  /**
   * The terminal string formatting function.
   */
  t: formatTerm,
} as const satisfies Record<string, FormatFunction>;

/**
 * The default error messages configuration.
 */
const defaultConfig: ConcreteError = {
  styles: {
    boolean: style(fg.yellow),
    string: style(fg.green),
    number: style(fg.yellow),
    regex: style(fg.red),
    option: style(fg.brightMagenta),
    param: style(fg.brightBlack),
    url: style(fg.brightBlack),
    text: style(tf.clear),
  },
  phrases: {
    [ErrorItem.parseError]: '%t\n\nDid you mean to specify an option name instead of %o?',
    [ErrorItem.parseErrorWithSimilar]:
      '%t\n\nDid you mean to specify an option name instead of %o1? Similar names are %o2.',
    [ErrorItem.unknownOption]: 'Unknown option %o.',
    [ErrorItem.unknownOptionWithSimilar]: 'Unknown option %o1. Similar names are %o2.',
    [ErrorItem.optionRequires]: 'Option %o requires %t.',
    [ErrorItem.missingRequiredOption]: 'Option %o is required.',
    [ErrorItem.missingParameter]: 'Missing parameter to %o.',
    [ErrorItem.missingPackageJson]: 'Could not find a "package.json" file.',
    [ErrorItem.positionalInlineValue]: 'Positional marker %o does not accept inline values.',
    [ErrorItem.optionInlineValue]: 'Option %o does not accept inline values.',
    [ErrorItem.emptyPositionalMarker]: 'Option %o contains empty positional marker.',
    [ErrorItem.invalidOptionName]: 'Invalid option name %o.',
    [ErrorItem.optionEmptyVersion]: 'Option %o contains empty version.',
    [ErrorItem.optionRequiresItself]: 'Option %o requires itself.',
    [ErrorItem.unknownRequiredOption]: 'Unknown required option %o.',
    [ErrorItem.niladicOptionRequiredValue]: 'Required option %o does not accept values.',
    [ErrorItem.optionZeroEnum]: 'Option %o has zero enum values.',
    [ErrorItem.duplicateOptionName]: 'Duplicate option name %o.',
    [ErrorItem.duplicatePositionalOption]: 'Duplicate positional option %o.',
    [ErrorItem.duplicateStringOptionEnum]: 'Option %o has duplicate enum %s.',
    [ErrorItem.duplicateNumberOptionEnum]: 'Option %o has duplicate enum %n.',
    [ErrorItem.optionValueIncompatible]:
      'Option %o has incompatible value %p. Should be of type %s.',
    [ErrorItem.stringOptionEnums]: 'Invalid parameter to %o: %s1. Possible values are %s2.',
    [ErrorItem.stringOptionRegex]: 'Invalid parameter to %o: %s. Value must match the regex %r.',
    [ErrorItem.numberOptionEnums]: 'Invalid parameter to %o: %n1. Possible values are %n2.',
    [ErrorItem.numberOptionRange]: 'Invalid parameter to %o: %n1. Value must be in the range %n2.',
    [ErrorItem.arrayOptionLimit]: 'Option %o has too many values (%n1). Should have at most %n2.',
  },
};

//--------------------------------------------------------------------------------------------------
// Types
//--------------------------------------------------------------------------------------------------
/**
 * Information regarding a positional option. Used internally.
 */
type Positional = {
  key: string;
  name: string;
  option: Option;
  marker?: string;
};

/**
 * A set of formatting functions for error messages.
 */
type FormatFunction = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any,
  styles: ConcreteStyles,
  style: Style,
  result: TerminalString,
) => void;

/**
 * A set of styles for displaying text on the terminal.
 */
type ErrorStyles = {
  /**
   * The style of boolean values.
   */
  readonly boolean?: Style;
  /**
   * The style of string values.
   */
  readonly string?: Style;
  /**
   * The style of number values.
   */
  readonly number?: Style;
  /**
   * The style of regular expressions.
   */
  readonly regex?: Style;
  /**
   * The style of option names.
   */
  readonly option?: Style;
  /**
   * The style of option parameters.
   */
  readonly param?: Style;
  /**
   * The style of URLs.
   */
  readonly url?: Style;
  /**
   * The style of general text.
   */
  readonly text?: Style;
};

/**
 * The error messages configuration.
 */
type ErrorConfig = {
  /**
   * The error message styles
   */
  readonly styles?: ErrorStyles;
  /**
   * The error message phrases
   */
  readonly phrases?: Readonly<Partial<Record<ErrorItem, string>>>;
};

/**
 * A concrete version of the error messages configuration.
 */
type ConcreteError = Concrete<ErrorConfig>;

/**
 * A concrete version of the error message styles.
 */
type ConcreteStyles = ConcreteError['styles'];

/**
 * A helper type to remove optionality from types and properties.
 * @template T The source type
 */
type Concrete<T> = Exclude<
  {
    [K in keyof T]-?: Concrete<T[K]>;
  },
  undefined
>;

//--------------------------------------------------------------------------------------------------
// Classes
//--------------------------------------------------------------------------------------------------
/**
 * Implements a compilation of option definitions.
 */
class OptionValidator {
  readonly names = new Map<string, string>();
  readonly required = new Array<string>();
  readonly positional: Positional | undefined;

  /**
   * Creates an option validator based on a set of option definitions.
   * @param options The option definitions
   * @param config The error messages configuration
   * @throws On duplicate option names and duplicate positional options
   */
  constructor(
    readonly options: Options,
    readonly config: ConcreteError = defaultConfig,
  ) {
    for (const key in this.options) {
      const option = this.options[key];
      this.registerNames(key, option);
      if ('positional' in option && option.positional) {
        if (this.positional) {
          throw this.error(ErrorItem.duplicatePositionalOption, { o: key });
        }
        const marker = typeof option.positional === 'string' ? option.positional : undefined;
        this.positional = { key, name: option.preferredName ?? '', option, marker };
      }
      if ('required' in option && option.required) {
        this.required.push(key);
      }
    }
  }

  /**
   * Registers or validates an option's names.
   * @param key The option key
   * @param option The option definition
   * @param validate True if performing validation
   * @throws On invalid name, duplicate name or empty positional marker
   */
  private registerNames(key: string, option: Option, validate = false) {
    const names = option.names ? option.names.slice() : [];
    if (option.type === 'flag' && option.negationNames) {
      names.push(...option.negationNames);
    }
    if ('positional' in option && typeof option.positional === 'string') {
      if (validate && !option.positional) {
        throw this.error(ErrorItem.emptyPositionalMarker, { o: key });
      }
      names.push(option.positional);
    }
    for (const name of names) {
      if (!name) {
        continue;
      }
      if (!validate) {
        if (this.names.has(name)) {
          throw this.error(ErrorItem.duplicateOptionName, { o: name });
        }
        this.names.set(name, key);
      } else if (name.match(/[\s=]+/)) {
        throw this.error(ErrorItem.invalidOptionName, { o: name });
      }
    }
    if (!option.preferredName) {
      option.preferredName = names.find((name): name is string => !!name);
    }
  }

  /**
   * Validates all options' definitions
   * @throws On options with no name, invalid name, empty positional marker, invalid enum values,
   * invalid default value, invalid example value, invalid requirements, invalid required values,
   * version option with empty version and module-resolve function
   */
  validate() {
    for (const key in this.options) {
      const option = this.options[key];
      this.registerNames(key, option, true);
      if (!isNiladic(option)) {
        this.validateEnums(key, option);
        if (typeof option.default !== 'function') {
          this.validateValue(key, option, option.default);
        }
        this.validateValue(key, option, option.example);
      }
      // no need to verify flag option default value
      if (option.requires) {
        this.validateRequirements(key, option.requires);
      }
      if (option.type === 'version' && option.version === '') {
        throw this.error(ErrorItem.optionEmptyVersion, { o: key });
      }
    }
  }

  /**
   * Validates an option's requirements.
   * @param key The option key
   * @param requires The option requirements
   * @throws On invalid requirements or invalid required values
   */
  private validateRequirements(key: string, requires: Requires) {
    if (typeof requires === 'string') {
      this.validateRequirement(key, requires);
    } else if (requires instanceof RequiresNot) {
      this.validateRequirements(key, requires.item);
    } else if (requires instanceof RequiresAll || requires instanceof RequiresOne) {
      for (const item of requires.items) {
        this.validateRequirements(key, item);
      }
    } else {
      for (const requiredKey in requires) {
        this.validateRequirement(key, requiredKey, requires[requiredKey]);
      }
    }
  }

  /**
   * Validates an option requirement.
   * @param key The requiring option key
   * @param requiredKey The required option key
   * @param requiredValue The required value, if any
   * @throws On option requiring itself, unknown required option, niladic option required with value
   * or invalid required values for non-niladic options
   */
  private validateRequirement(
    key: string,
    requiredKey: string,
    requiredValue?: RequiresVal[string],
  ) {
    if (requiredKey === key) {
      throw this.error(ErrorItem.optionRequiresItself, { o: requiredKey });
    }
    if (!(requiredKey in this.options)) {
      throw this.error(ErrorItem.unknownRequiredOption, { o: requiredKey });
    }
    if (requiredValue !== undefined && requiredValue !== null) {
      const option = this.options[requiredKey];
      if (isNiladic(option)) {
        throw this.error(ErrorItem.niladicOptionRequiredValue, { o: requiredKey });
      }
      this.validateValue(requiredKey, option, requiredValue);
    }
  }

  /**
   * Checks the sanity of the option's enumerated values.
   * @param key The option key
   * @param option The option definition
   * @throws On zero or duplicate enumerated values or values not satisfying specified constraints
   */
  private validateEnums(key: string, option: ParamOption) {
    if ('enums' in option && option.enums) {
      if (!option.enums.length) {
        throw this.error(ErrorItem.optionZeroEnum, { o: key });
      }
      const set = new Set<string | number>(option.enums);
      if (set.size !== option.enums.length) {
        for (const value of option.enums) {
          if (!set.delete(value)) {
            if (option.type === 'string' || option.type === 'strings') {
              throw this.error(ErrorItem.duplicateStringOptionEnum, { o: key, s: value });
            }
            throw this.error(ErrorItem.duplicateNumberOptionEnum, { o: key, n: value });
          }
        }
      }
    }
  }

  /**
   * Asserts that an option value conforms to a type.
   * @param value The option value
   * @param key The option key
   * @param type The data type name
   * @throws On value not conforming to the given type
   */
  private assertType<T>(value: unknown, key: string, type: string): asserts value is T {
    if (typeof value !== type) {
      throw this.error(ErrorItem.optionValueIncompatible, { o: key, p: value, s: type });
    }
  }

  /**
   * Checks the sanity of the option's value (default, example or required).
   * @param key The option key
   * @param option The option definition
   * @param value The option value
   * @throws On value not satisfying specified constraints
   */
  private validateValue(key: string, option: ParamOption, value: ParamOption['example']) {
    if (value === undefined) {
      return;
    }
    switch (option.type) {
      case 'boolean':
        this.assertType<boolean>(value, key, 'boolean');
        break;
      case 'string':
        this.assertType<string>(value, key, 'string');
        this.normalizeString(option, key, value);
        break;
      case 'number':
        this.assertType<number>(value, key, 'number');
        this.normalizeNumber(option, key, value);
        break;
      case 'strings': {
        this.assertType<object>(value, key, 'object');
        const normalized = value.map((val) => {
          this.assertType<string>(val, key, 'string');
          return this.normalizeString(option, key, val);
        });
        this.normalizeArray(option, key, normalized);
        break;
      }
      case 'numbers': {
        this.assertType<object>(value, key, 'object');
        const normalized = value.map((val) => {
          this.assertType<number>(val, key, 'number');
          return this.normalizeNumber(option, key, val);
        });
        this.normalizeArray(option, key, normalized);
        break;
      }
      default: {
        const _exhaustiveCheck: never = option;
        return _exhaustiveCheck;
      }
    }
  }

  /**
   * Normalizes the value of a string option and checks its validity against any constraint.
   * @param option The option definition
   * @param name The option name (as specified on the command-line)
   * @param value The option value
   * @throws On value not satisfying the specified enumeration or regex constraint
   */
  normalizeString(option: StringOption | StringsOption, name: string, value: string): string {
    if (option.trim) {
      value = value.trim();
    }
    if (option.case) {
      value = option.case === 'lower' ? value.toLowerCase() : value.toLocaleUpperCase();
    }
    if ('enums' in option && option.enums && !option.enums.includes(value)) {
      throw this.error(ErrorItem.stringOptionEnums, { o: name, s1: value, s2: option.enums });
    }
    if ('regex' in option && option.regex && !option.regex.test(value)) {
      throw this.error(ErrorItem.stringOptionRegex, { o: name, s: value, r: option.regex });
    }
    return value;
  }

  /**
   * Normalizes the value of a number option and checks its validity against any constraint.
   * @param option The option definition
   * @param name The option name (as specified on the command-line)
   * @param value The option value
   * @throws On value not satisfying the specified enumeration or range constraint
   */
  normalizeNumber(option: NumberOption | NumbersOption, name: string, value: number): number {
    if (option.round) {
      value = Math[option.round](value);
    }
    if ('enums' in option && option.enums && !option.enums.includes(value)) {
      throw this.error(ErrorItem.numberOptionEnums, { o: name, n1: value, n2: option.enums });
    }
    if (
      'range' in option &&
      option.range &&
      !(value >= option.range[0] && value <= option.range[1]) // handles NaN as well
    ) {
      throw this.error(ErrorItem.numberOptionRange, { o: name, n1: value, n2: option.range });
    }
    return value;
  }

  /**
   * Normalizes the value of an array option and checks its validity against any constraint.
   * @param option The option definition
   * @param name The option name (as specified on the command-line)
   * @param value The option value
   * @throws On value not satisfying the specified limit constraint
   */
  normalizeArray(option: ArrayOption, name: string, value: Array<string | number>) {
    if (option.unique) {
      const unique = [...new Set(value)];
      value.length = 0;
      value.push(...unique);
    }
    if (option.limit !== undefined && value.length > option.limit) {
      throw this.error(ErrorItem.arrayOptionLimit, {
        o: name,
        n1: value.length,
        n2: option.limit,
      });
    }
  }

  /**
   * Creates an error with a formatted message.
   * @param kind The kind of error message
   * @param args The error arguments
   * @returns The formatted error
   */
  error(kind: ErrorItem, args?: Record<string, unknown>): ErrorMessage {
    const str = new TerminalString().addSequence(this.config.styles.text);
    const phrase = this.config.phrases[kind];
    if (args) {
      str.splitText(phrase, (spec) => {
        const arg = spec.slice(1);
        const fmt = arg[0];
        if (fmt in formatFunctions && arg in args) {
          const value = args[arg];
          const format = (formatFunctions as Record<string, FormatFunction>)[fmt];
          if (Array.isArray(value)) {
            str.addOpening('[');
            value.forEach((val, i) => {
              format(val, this.config.styles, this.config.styles.text, str);
              if (i < value.length - 1) {
                str.addClosing(',');
              }
            });
            str.addClosing(']');
          } else {
            format(value, this.config.styles, this.config.styles.text, str);
          }
        }
      });
    } else {
      str.splitText(phrase);
    }
    return new ErrorMessage(str);
  }
}

//--------------------------------------------------------------------------------------------------
// Functions
//--------------------------------------------------------------------------------------------------
/**
 * Formats a boolean value to be printed on the terminal.
 * @param value The boolean value
 * @param styles The error message styles
 * @param style The style to revert to
 * @param result The resulting string
 */
function formatBoolean(
  value: boolean,
  styles: ConcreteStyles,
  style: Style,
  result: TerminalString,
) {
  result.addAndRevert(styles.boolean, value.toString(), style);
}

/**
 * Formats a string value to be printed on the terminal.
 * @param value The string value
 * @param styles The error message styles
 * @param style The style to revert to
 * @param result The resulting string
 */
function formatString(value: string, styles: ConcreteStyles, style: Style, result: TerminalString) {
  result.addAndRevert(styles.string, `'${value}'`, style);
}

/**
 * Formats a number value to be printed on the terminal.
 * @param value The number value
 * @param styles The error message styles
 * @param style The style to revert to
 * @param result The resulting string
 */
function formatNumber(value: number, styles: ConcreteStyles, style: Style, result: TerminalString) {
  result.addAndRevert(styles.number, value.toString(), style);
}

/**
 * Formats a regex value to be printed on the terminal.
 * @param value The regex value
 * @param styles The error message styles
 * @param style The style to revert to
 * @param result The resulting string
 */
function formatRegExp(value: RegExp, styles: ConcreteStyles, style: Style, result: TerminalString) {
  result.addAndRevert(styles.regex, value.toString(), style);
}

/**
 * Formats a URL value to be printed on the terminal.
 * @param value The URL value
 * @param styles The error message styles
 * @param style The style to revert to
 * @param result The resulting string
 */
function formatURL(value: URL, styles: ConcreteStyles, style: Style, result: TerminalString) {
  result.addAndRevert(styles.url, value.href, style);
}

/**
 * Formats an option name to be printed on the terminal.
 * @param name The option name
 * @param styles The error message styles
 * @param style The style to revert to
 * @param result The resulting string
 */
function formatOption(name: string, styles: ConcreteStyles, style: Style, result: TerminalString) {
  result.addAndRevert(styles.option, name, style);
}

/**
 * Formats an option parameter to be printed on the terminal.
 * @param value The parameter value
 * @param styles The error message styles
 * @param style The style to revert to
 * @param result The resulting string
 */
function formatParam(value: unknown, styles: ConcreteStyles, style: Style, result: TerminalString) {
  result.addAndRevert(styles.param, `<${value}>`, style);
}

/**
 * Formats a previously formatted terminal string.
 * @param str The terminal string
 * @param result The resulting string
 */
function formatTerm(str: TerminalString, _1: ConcreteStyles, _2: Style, result: TerminalString) {
  result.addOther(str);
}
