//--------------------------------------------------------------------------------------------------
// Imports
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
  ParamValue,
  ValuedOption,
} from './options';
import type { Style } from './styles';
import type { Concrete, URL } from './utils';

import { tf, fg, ErrorItem } from './enums';
import { RequiresAll, RequiresOne, RequiresNot, isNiladic, isArray, isValued } from './options';
import { style, TerminalString, ErrorMessage, WarnMessage } from './styles';
import { assert } from './utils';

//--------------------------------------------------------------------------------------------------
// Constants
//--------------------------------------------------------------------------------------------------
/**
 * The error formatting functions.
 * @internal
 */
export const formatFunctions = {
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
 * @internal
 */
export const defaultConfig: ConcreteError = {
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
    [ErrorItem.unsatisfiedRequirement]: 'Option %o requires %t.',
    [ErrorItem.missingRequiredOption]: 'Option %o is required.',
    [ErrorItem.missingParameter]: 'Missing parameter to %o.',
    [ErrorItem.missingPackageJson]: 'Could not find a "package.json" file.',
    [ErrorItem.disallowedInlineValue]: 'Option %o does not accept inline values.',
    [ErrorItem.emptyPositionalMarker]: 'Option %o contains empty positional marker.',
    [ErrorItem.unnamedOption]: 'Non-positional option %o has no name.',
    [ErrorItem.invalidOptionName]: 'Invalid option name %o.',
    [ErrorItem.emptyVersionDefinition]: 'Option %o contains empty version.',
    [ErrorItem.invalidSelfRequirement]: 'Option %o requires itself.',
    [ErrorItem.unknownRequiredOption]: 'Unknown option %o in requirement.',
    [ErrorItem.invalidRequiredOption]: 'Non-valued option %o in requirement.',
    [ErrorItem.emptyEnumsDefinition]: 'Option %o has zero enum values.',
    [ErrorItem.duplicateOptionName]: 'Duplicate option name %o.',
    [ErrorItem.duplicatePositionalOption]: 'Duplicate positional option %o.',
    [ErrorItem.duplicateStringOptionEnum]: 'Option %o has duplicate enum %s.',
    [ErrorItem.duplicateNumberOptionEnum]: 'Option %o has duplicate enum %n.',
    [ErrorItem.incompatibleRequiredValue]:
      'Option %o has incompatible value %p. Should be of type %s.',
    [ErrorItem.stringEnumsConstraintViolation]:
      'Invalid parameter to %o: %s1. Possible values are %s2.',
    [ErrorItem.regexConstraintViolation]:
      'Invalid parameter to %o: %s. Value must match the regex %r.',
    [ErrorItem.numberEnumsConstraintViolation]:
      'Invalid parameter to %o: %n1. Possible values are %n2.',
    [ErrorItem.rangeConstraintViolation]:
      'Invalid parameter to %o: %n1. Value must be in the range %n2.',
    [ErrorItem.limitConstraintViolation]:
      'Option %o has too many values (%n1). Should have at most %n2.',
    [ErrorItem.deprecatedOption]: 'Option %o is deprecated and may be removed in future releases.',
    [ErrorItem.unsatisfiedCondRequirement]: 'Option %o is required if %t.',
    [ErrorItem.duplicateClusterLetter]: 'Duplicate cluster letter %o.',
    [ErrorItem.invalidClusterOption]: 'Option %o must be the last in a cluster.',
  },
};

//--------------------------------------------------------------------------------------------------
// Types
//--------------------------------------------------------------------------------------------------
/**
 * Information regarding a positional option.
 * @internal
 */
export type Positional = {
  key: string;
  name: string;
  option: Option;
  marker?: string;
};

/**
 * A set of formatting functions for error messages.
 * @internal
 */
export type FormatFunction = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any,
  styles: ConcreteStyles,
  style: Style,
  result: TerminalString,
) => void;

/**
 * A set of styles for displaying text on the terminal.
 */
export type ErrorStyles = {
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
 * The error message configuration.
 */
export type ErrorConfig = {
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
 * A concrete version of the error message configuration.
 */
export type ConcreteError = Concrete<ErrorConfig>;

/**
 * A concrete version of the error message styles.
 * @internal
 */
export type ConcreteStyles = ConcreteError['styles'];

//--------------------------------------------------------------------------------------------------
// Classes
//--------------------------------------------------------------------------------------------------
/**
 * Implements a compilation of option definitions.
 */
export class OptionValidator {
  readonly names = new Map<string, string>();
  readonly letters = new Map<string, string>();
  readonly positional: Positional | undefined;

  /**
   * Creates an option validator based on a set of option definitions.
   * @param options The option definitions
   * @param config The error message configuration
   */
  constructor(
    readonly options: Options,
    readonly config: ConcreteError = defaultConfig,
  ) {
    for (const key in this.options) {
      const option = this.options[key];
      this.registerNames(key, option);
      if ('positional' in option && option.positional) {
        const marker = typeof option.positional === 'string' ? option.positional : undefined;
        this.positional = { key, name: option.preferredName ?? '', option, marker };
      }
    }
  }

  /**
   * Registers or validates an option's names.
   * @param key The option key
   * @param option The option definition
   * @param validate True if performing validation
   * @param prefix The command prefix, if any
   * @throws On empty positional marker, option with no name, invalid option name, duplicate name or
   * duplicate cluster letter
   */
  private registerNames(key: string, option: Option, validate = false, prefix = '') {
    const names = option.names ? option.names.slice() : [];
    if (option.type === 'flag' && option.negationNames) {
      names.push(...option.negationNames);
    }
    if ('positional' in option) {
      if (validate && option.positional === '') {
        throw this.error(ErrorItem.emptyPositionalMarker, { o: prefix + key });
      }
      if (typeof option.positional === 'string') {
        names.push(option.positional);
      }
    } else if (validate && !names.find((name) => name)) {
      throw this.error(ErrorItem.unnamedOption, { o: prefix + key });
    }
    for (const name of names) {
      if (!name) {
        continue;
      }
      if (validate && name.match(/[\s=]+/)) {
        throw this.error(ErrorItem.invalidOptionName, { o: name });
      }
      if (validate && this.names.has(name)) {
        throw this.error(ErrorItem.duplicateOptionName, { o: name });
      }
      this.names.set(name, key);
    }
    if (!option.preferredName) {
      option.preferredName = names.find((name): name is string => !!name);
    }
    if ('clusterLetters' in option && option.clusterLetters) {
      for (const letter of option.clusterLetters) {
        if (validate && this.letters.has(letter)) {
          throw this.error(ErrorItem.duplicateClusterLetter, { o: prefix + letter });
        }
        this.letters.set(letter, key);
      }
    }
  }

  /**
   * Validates all options' definitions, including command options recursively.
   * @param prefix The command prefix, if any
   * @param visited The set of visited option definitions
   * @throws On duplicate positional option, invalid enum values, invalid default value or invalid
   * example value
   */
  validate(prefix = '', visited = new Set<Options>()) {
    let positional = false; // to check for duplicate positional options
    this.names.clear(); // to check for duplicate option names
    this.letters.clear(); // to check for duplicate cluster letters
    for (const key in this.options) {
      const option = this.options[key];
      this.registerNames(key, option, true, prefix);
      if (!isNiladic(option)) {
        if (option.positional) {
          if (positional) {
            throw this.error(ErrorItem.duplicatePositionalOption, { o: prefix + key });
          }
          positional = true;
        }
        this.validateEnums(prefix + key, option);
        if (typeof option.default !== 'function') {
          this.validateValue(prefix + key, option, option.default);
        }
        this.validateValue(prefix + key, option, option.example);
      }
      // no need to verify flag option default value
      if ('requires' in option && option.requires) {
        this.validateRequirements(prefix, key, option.requires);
      }
      if ('requiredIf' in option && option.requiredIf) {
        this.validateRequirements(prefix, key, option.requiredIf);
      }
      if (option.type === 'version' && option.version === '') {
        throw this.error(ErrorItem.emptyVersionDefinition, { o: prefix + key });
      }
      if (option.type === 'command') {
        const options = typeof option.options === 'function' ? option.options() : option.options;
        if (!visited.has(options)) {
          visited.add(options);
          new OptionValidator(options, this.config).validate(prefix + key + '.', visited);
        }
      }
    }
  }

  /**
   * Validates an option's requirements.
   * @param prefix The command prefix
   * @param key The option key
   * @param requires The option requirements
   */
  private validateRequirements(prefix: string, key: string, requires: Requires) {
    if (typeof requires === 'string') {
      this.validateRequirement(prefix, key, requires);
    } else if (requires instanceof RequiresNot) {
      this.validateRequirements(prefix, key, requires.item);
    } else if (requires instanceof RequiresAll || requires instanceof RequiresOne) {
      for (const item of requires.items) {
        this.validateRequirements(prefix, key, item);
      }
    } else if (typeof requires === 'object') {
      for (const requiredKey in requires) {
        this.validateRequirement(prefix, key, requiredKey, requires[requiredKey]);
      }
    }
  }

  /**
   * Validates an option requirement.
   * @param prefix The command prefix
   * @param key The option key
   * @param requiredKey The required option key
   * @param requiredValue The required value, if any
   * @throws On option requiring itself, unknown required option, invalid required option or
   * incompatible required values
   */
  private validateRequirement(
    prefix: string,
    key: string,
    requiredKey: string,
    requiredValue?: RequiresVal[string],
  ) {
    if (requiredKey === key) {
      throw this.error(ErrorItem.invalidSelfRequirement, { o: prefix + requiredKey });
    }
    if (!(requiredKey in this.options)) {
      throw this.error(ErrorItem.unknownRequiredOption, { o: prefix + requiredKey });
    }
    const option = this.options[requiredKey];
    if (!isValued(option)) {
      throw this.error(ErrorItem.invalidRequiredOption, { o: prefix + requiredKey });
    }
    if (requiredValue !== undefined && requiredValue !== null) {
      this.validateValue(prefix + requiredKey, option, requiredValue);
    }
  }

  /**
   * Checks the sanity of the option's enumerated values.
   * @param key The option key (plus the prefix, if any)
   * @param option The option definition
   * @throws On zero or duplicate enumerated values or values not satisfying specified constraints
   */
  private validateEnums(key: string, option: ParamOption) {
    if ('enums' in option && option.enums) {
      if (!option.enums.length) {
        throw this.error(ErrorItem.emptyEnumsDefinition, { o: key });
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
   * @param key The option key (plus the prefix, if any)
   * @param type The data type name
   * @throws On value not conforming to the given type
   */
  private assertType<T>(value: unknown, key: string, type: string): asserts value is T {
    if (typeof value !== type) {
      throw this.error(ErrorItem.incompatibleRequiredValue, { o: key, p: value, s: type });
    }
  }

  /**
   * Checks the sanity of the option's value (default, example or required).
   * @param key The option key (plus the prefix, if any)
   * @param option The option definition
   * @param value The option value
   * @throws On value not satisfying specified constraints
   */
  private validateValue(key: string, option: ValuedOption, value: unknown) {
    if (value === undefined) {
      return;
    }
    switch (option.type) {
      case 'flag':
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
        this.assertType<Array<string>>(value, key, 'object');
        const normalized = value.map((val) => {
          this.assertType<string>(val, key, 'string');
          return this.normalizeString(option, key, val);
        });
        this.normalizeArray(option, key, normalized);
        break;
      }
      case 'numbers': {
        this.assertType<Array<number>>(value, key, 'object');
        const normalized = value.map((val) => {
          this.assertType<number>(val, key, 'number');
          return this.normalizeNumber(option, key, val);
        });
        this.normalizeArray(option, key, normalized);
        break;
      }
    }
  }

  /**
   * Normalizes the value of a non-niladic option and checks its validity against any constraint.
   * @param option The option definition
   * @param name The option name (as specified on the command-line)
   * @param value The option value
   * @returns The normalized value
   * @throws On value not satisfying the specified enums, regex or range constraints
   */
  normalize<T extends ParamValue>(option: ParamOption, name: string, value: T): T {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      assert(option.type === 'string' || option.type === 'strings');
      return this.normalizeString(option, name, value) as T;
    }
    if (typeof value === 'number') {
      assert(option.type === 'number' || option.type === 'numbers');
      return this.normalizeNumber(option, name, value) as T;
    }
    assert(isArray(option));
    return this.normalizeArray(option, name, value as Array<string | number>) as T;
  }

  /**
   * Normalizes the value of a string option and checks its validity against any constraint.
   * @param option The option definition
   * @param name The option name (as specified on the command-line)
   * @param value The option value
   * @returns The normalized string
   * @throws On value not satisfying the specified enumeration or regex constraint
   */
  private normalizeString(
    option: StringOption | StringsOption,
    name: string,
    value: string,
  ): string {
    if (option.trim) {
      value = value.trim();
    }
    if (option.case) {
      value = option.case === 'lower' ? value.toLowerCase() : value.toLocaleUpperCase();
    }
    if ('enums' in option && option.enums && !option.enums.includes(value)) {
      throw this.error(ErrorItem.stringEnumsConstraintViolation, {
        o: name,
        s1: value,
        s2: option.enums,
      });
    }
    if ('regex' in option && option.regex && !option.regex.test(value)) {
      throw this.error(ErrorItem.regexConstraintViolation, { o: name, s: value, r: option.regex });
    }
    return value;
  }

  /**
   * Normalizes the value of a number option and checks its validity against any constraint.
   * @param option The option definition
   * @param name The option name (as specified on the command-line)
   * @param value The option value
   * @returns The normalized number
   * @throws On value not satisfying the specified enumeration or range constraint
   */
  private normalizeNumber(
    option: NumberOption | NumbersOption,
    name: string,
    value: number,
  ): number {
    if (option.round) {
      value = Math[option.round](value);
    }
    if ('enums' in option && option.enums && !option.enums.includes(value)) {
      throw this.error(ErrorItem.numberEnumsConstraintViolation, {
        o: name,
        n1: value,
        n2: option.enums,
      });
    }
    if (
      'range' in option &&
      option.range &&
      !(value >= option.range[0] && value <= option.range[1]) // handles NaN as well
    ) {
      throw this.error(ErrorItem.rangeConstraintViolation, {
        o: name,
        n1: value,
        n2: option.range,
      });
    }
    return value;
  }

  /**
   * Normalizes the value of an array option and checks its validity against any constraint.
   * @param option The option definition
   * @param name The option name (as specified on the command-line)
   * @param value The option value
   * @returns The normalized array
   * @throws On value not satisfying the specified limit constraint
   */
  private normalizeArray<T extends string | number>(
    option: ArrayOption,
    name: string,
    value: Array<T>,
  ): Array<T> {
    if (option.unique) {
      const unique = new Set(value);
      value.length = 0;
      value.push(...unique);
    }
    if (option.limit !== undefined && value.length > option.limit) {
      throw this.error(ErrorItem.limitConstraintViolation, {
        o: name,
        n1: value.length,
        n2: option.limit,
      });
    }
    return value;
  }

  /**
   * Creates a warning with a formatted message.
   * @param kind The kind of warning message
   * @param args The warning arguments
   * @returns The formatted warning
   */
  warn(kind: ErrorItem, args?: Record<string, unknown>): WarnMessage {
    return new WarnMessage(formatMessage(this.config, kind, args));
  }

  /**
   * Creates an error with a formatted message.
   * @param kind The kind of error message
   * @param args The error arguments
   * @returns The formatted error
   */
  error(kind: ErrorItem, args?: Record<string, unknown>): ErrorMessage {
    return new ErrorMessage(formatMessage(this.config, kind, args));
  }
}

//--------------------------------------------------------------------------------------------------
// Functions
//--------------------------------------------------------------------------------------------------
/**
 * Creates a terminal string with a formatted message.
 * @param config The error message configuration
 * @param kind The kind of error message
 * @param args The error arguments
 * @returns The terminal string
 */
function formatMessage(
  config: ConcreteError,
  kind: ErrorItem,
  args?: Record<string, unknown>,
): TerminalString {
  const result = new TerminalString().addSequence(config.styles.text);
  const phrase = config.phrases[kind];
  if (args) {
    result.splitText(phrase, (spec) => {
      const arg = spec.slice(1);
      const fmt = arg[0];
      if (fmt in formatFunctions && arg in args) {
        const value = args[arg];
        const format = (formatFunctions as Record<string, FormatFunction>)[fmt];
        if (Array.isArray(value)) {
          result.addOpening('[');
          value.forEach((val, i) => {
            format(val, config.styles, config.styles.text, result);
            if (i < value.length - 1) {
              result.addClosing(',');
            }
          });
          result.addClosing(']');
        } else {
          format(value, config.styles, config.styles.text, result);
        }
      }
    });
  } else {
    result.splitText(phrase);
  }
  return result;
}

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
 * @param _1 unused
 * @param _2 unused
 * @param result The resulting string
 */
function formatTerm(str: TerminalString, _1: ConcreteStyles, _2: Style, result: TerminalString) {
  result.addOther(str);
}
