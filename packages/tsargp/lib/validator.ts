//--------------------------------------------------------------------------------------------------
// Imports
//--------------------------------------------------------------------------------------------------
import type { OpaqueOption, Options, Requires, RequiresVal, OpaqueOptions } from './options';
import type { FormatArgs, FormattingFlags, FormatStyles, MessageStyles } from './styles';
import type { Concrete, NamingRules } from './utils';

import { tf, fg, ErrorItem } from './enums';
import {
  RequiresAll,
  RequiresOne,
  RequiresNot,
  isNiladic,
  isSpecial,
  isString,
  isUnknown,
} from './options';
import { style, TerminalString, ErrorMessage, WarnMessage } from './styles';
import { findSimilarNames, matchNamingRules } from './utils';

//--------------------------------------------------------------------------------------------------
// Constants
//--------------------------------------------------------------------------------------------------
/**
 * The default validator configuration.
 * @internal
 */
export const defaultConfig: ConcreteConfig = {
  styles: {
    boolean: style(fg.yellow),
    string: style(fg.green),
    number: style(fg.yellow),
    regex: style(fg.red),
    option: style(fg.brightMagenta),
    value: style(fg.brightBlack),
    url: style(fg.brightBlack),
    text: style(tf.clear),
  },
  phrases: {
    [ErrorItem.parseError]:
      'Did you mean to specify an option name instead of (%o|%o1)?(| Similar names are [%o2].)',
    [ErrorItem.unknownOption]: 'Unknown option (%o|%o1).(| Similar names are [%o2].)',
    [ErrorItem.unsatisfiedRequirement]: 'Option %o requires %p.',
    [ErrorItem.missingRequiredOption]: 'Option %o is required.',
    [ErrorItem.missingParameter]: 'Missing parameter to %o.',
    [ErrorItem.missingPackageJson]: 'Could not find a "package.json" file.',
    [ErrorItem.disallowedInlineValue]:
      '(Option|Positional marker) %o does not accept inline values.',
    [ErrorItem.emptyPositionalMarker]: 'Option %o contains empty positional marker.',
    [ErrorItem.unnamedOption]: 'Non-positional option %o has no name.',
    [ErrorItem.invalidOptionName]: 'Option %o has invalid name %s.',
    [ErrorItem.emptyVersionDefinition]: 'Option %o contains empty version.',
    [ErrorItem.invalidSelfRequirement]: 'Option %o requires itself.',
    [ErrorItem.unknownRequiredOption]: 'Unknown option %o in requirement.',
    [ErrorItem.invalidRequiredOption]: 'Invalid option %o in requirement.',
    [ErrorItem.invalidRequiredValue]:
      'Invalid required value for option %o. Option is always required or has a default value.',
    [ErrorItem.incompatibleRequiredValue]:
      'Incompatible required value %v for option %o. Should be of type %s.',
    [ErrorItem.emptyEnumsDefinition]: 'Option %o has zero enum values.',
    [ErrorItem.duplicateOptionName]: 'Option %o has duplicate name %s.',
    [ErrorItem.duplicatePositionalOption]: 'Duplicate positional option %o1: previous was %o2.',
    [ErrorItem.duplicateEnumValue]: 'Option %o has duplicate enum (%s|%n).',
    [ErrorItem.enumsConstraintViolation]:
      'Invalid parameter to %o: (%s1|%n1). Possible values are {(%s2|%n2)}.',
    [ErrorItem.regexConstraintViolation]:
      'Invalid parameter to %o: %s. Value must match the regex %r.',
    [ErrorItem.rangeConstraintViolation]:
      'Invalid parameter to %o: %n1. Value must be in the range [%n2].',
    [ErrorItem.limitConstraintViolation]:
      'Option %o has too many values (%n1). Should have at most %n2.',
    [ErrorItem.deprecatedOption]: 'Option %o is deprecated and may be removed in future releases.',
    [ErrorItem.unsatisfiedCondRequirement]: 'Option %o is required if %p.',
    [ErrorItem.duplicateClusterLetter]: 'Option %o has duplicate cluster letter %s.',
    [ErrorItem.invalidClusterOption]: 'Option letter %o must be the last in a cluster.',
    [ErrorItem.invalidClusterLetter]: 'Option %o has invalid cluster letter %s.',
    [ErrorItem.tooSimilarOptionNames]: '%o: Option name %s1 has too similar names [%s2].',
    [ErrorItem.mixedNamingConvention]: '%o: Name slot %n has mixed naming conventions [%s].',
    [ErrorItem.invalidNumericRange]: 'Option %o has invalid numeric range [%n].',
  },
};

/**
 * The naming convention rules.
 * @internal
 */
const namingConventions: NamingRules = {
  cases: {
    lowercase: (name, lower, upper) => name == lower && name != upper, // has at least one lower
    UPPERCASE: (name, lower, upper) => name != lower && name == upper, // has at least one upper
    Capitalized: (name, lower, upper) => name[0] != lower[0] && name != upper, // has at least one lower
  },
  dashes: {
    noDash: (name) => name[0] != '-',
    '-singleDash': (name) => name[0] == '-' && name[1] != '-',
    '--doubleDash': (name) => name[0] == '-' && name[1] == '-',
  },
  delimiters: {
    'kebab-case': (name) => !!name.match(/[^-]+-[^-]+/),
    snake_case: (name) => !!name.match(/[^_]+_[^_]+/),
    'colon:case': (name) => !!name.match(/[^:]+:[^:]+/),
  },
};

//--------------------------------------------------------------------------------------------------
// Public types
//--------------------------------------------------------------------------------------------------
/**
 * The validator configuration.
 */
export type ValidatorConfig = {
  /**
   * The message styles
   */
  readonly styles?: MessageStyles;
  /**
   * The message phrases
   */
  readonly phrases?: Readonly<Partial<Record<ErrorItem, string>>>;
};

/**
 * The validation flags.
 */
export type ValidationFlags = {
  /**
   * Whether the validation procedure should try to detect naming inconsistencies.
   */
  readonly detectNamingInconsistencies?: true;
};

/**
 * The validation result.
 */
export type ValidationResult = {
  /**
   * The warnings generated by the validator, if any.
   */
  readonly warning?: WarnMessage;
};

/**
 * A concrete version of the validator configuration.
 */
export type ConcreteConfig = Concrete<ValidatorConfig>;

//--------------------------------------------------------------------------------------------------
// Internal types
//--------------------------------------------------------------------------------------------------
/**
 * Information regarding an option.
 * @internal
 */
export type OptionInfo = {
  key: string;
  name: string;
  option: OpaqueOption;
  marker?: string;
};

//--------------------------------------------------------------------------------------------------
// Classes
//--------------------------------------------------------------------------------------------------
/**
 * Implements a compilation of option definitions.
 */
export class OptionValidator {
  readonly names = new Map<string, string>();
  readonly letters = new Map<string, string>();
  readonly positional: OptionInfo | undefined;
  readonly options: OpaqueOptions;

  /**
   * Creates an option validator based on a set of option definitions.
   * @param options The option definitions
   * @param config The validator configuration
   */
  constructor(
    options: Options,
    readonly config: ConcreteConfig = defaultConfig,
  ) {
    this.options = options as OpaqueOptions;
    for (const key in this.options) {
      const option = this.options[key];
      registerNames(this.config, this.names, this.letters, key, option);
      if (option.positional) {
        const marker = typeof option.positional === 'string' ? option.positional : undefined;
        this.positional = { key, name: option.preferredName ?? '', option, marker };
      }
    }
  }

  /**
   * Validates all options' definitions, including command options recursively.
   * @param flags The validation flags
   * @param prefix The command prefix, if any
   * @param visited The set of visited option definitions
   * @returns The validation result
   * @throws On duplicate positional option
   */
  validate(
    flags: ValidationFlags = {},
    prefix = '',
    visited = new Set<OpaqueOptions>(),
  ): ValidationResult {
    const warning = new WarnMessage();
    if (flags.detectNamingInconsistencies) {
      // validate names before clearing them
      validateNames(this.config, this.names, this.options, prefix, warning);
    }
    this.names.clear(); // to check for duplicate option names
    this.letters.clear(); // to check for duplicate cluster letters
    let positional = ''; // to check for duplicate positional options
    for (const key in this.options) {
      const option = this.options[key];
      registerNames(this.config, this.names, this.letters, key, option, true, prefix);
      validateOption(flags, this.options, this.config, prefix, key, option, visited, warning);
      if (option.positional) {
        if (positional) {
          throw this.error(ErrorItem.duplicatePositionalOption, {
            o1: prefix + key,
            o2: prefix + positional,
          });
        }
        positional = key;
      }
    }
    return warning.length ? { warning } : {};
  }

  /**
   * Normalizes the value of a verifiable option and checks its validity against any constraint.
   * @param option The option definition
   * @param name The option name (as specified on the command-line)
   * @param value The option value
   * @returns The normalized value
   * @throws On value not satisfying the specified enums, regex or range constraints
   */
  normalize<T>(option: OpaqueOption, name: string, value: T): T {
    const normalizeFn =
      typeof value === 'string'
        ? normalizeString
        : typeof value === 'number'
          ? normalizeNumber
          : Array.isArray(value)
            ? normalizeArray
            : undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return normalizeFn ? (normalizeFn as any)(this.config, option, name, value) : value;
  }

  /**
   * Creates a formatted message.
   * @param kind The kind of error or warning
   * @param args The message arguments
   * @param flags The formatting flags
   * @returns The formatted message
   */
  format(kind: ErrorItem, args?: FormatArgs, flags?: FormattingFlags): TerminalString {
    return format(this.config, kind, args, flags);
  }

  /**
   * Creates an error with a formatted message.
   * @param kind The kind of error message
   * @param args The message arguments
   * @param flags The formatting flags
   * @returns The formatted error
   */
  error(kind: ErrorItem, args?: FormatArgs, flags?: FormattingFlags): ErrorMessage {
    return new ErrorMessage(format(this.config, kind, args, flags));
  }
}

//--------------------------------------------------------------------------------------------------
// Functions
//--------------------------------------------------------------------------------------------------
/**
 * Registers or validates an option's names.
 * @param config The validator configuration
 * @param nameToKey The map of option names to keys
 * @param letterToKey The map of cluster letters to key
 * @param key The option key
 * @param option The option definition
 * @param validate True if performing validation
 * @param prefix The command prefix, if any
 * @throws On empty positional marker, option with no name, invalid option name, duplicate name or
 * duplicate cluster letter
 */
function registerNames(
  config: ConcreteConfig,
  nameToKey: Map<string, string>,
  letterToKey: Map<string, string>,
  key: string,
  option: OpaqueOption,
  validate = false,
  prefix = '',
) {
  const names = option.names?.slice() ?? [];
  if (option.negationNames) {
    names.push(...option.negationNames);
  }
  if (validate && option.positional === '') {
    throw error(config, ErrorItem.emptyPositionalMarker, { o: prefix + key });
  }
  if (typeof option.positional === 'string') {
    names.push(option.positional);
  }
  if (validate && !option.positional && !names.find((name) => name)) {
    throw error(config, ErrorItem.unnamedOption, { o: prefix + key });
  }
  for (const name of names) {
    if (!name) {
      continue;
    }
    if (validate && name.match(/[\s=]+/)) {
      throw error(config, ErrorItem.invalidOptionName, { o: prefix + key, s: name });
    }
    if (validate && nameToKey.has(name)) {
      throw error(config, ErrorItem.duplicateOptionName, { o: prefix + key, s: name });
    }
    nameToKey.set(name, key);
  }
  if (!option.preferredName) {
    option.preferredName = names.find((name): name is string => !!name);
  }
  if (option.clusterLetters) {
    for (const letter of option.clusterLetters) {
      if (validate && letter.includes(' ')) {
        throw error(config, ErrorItem.invalidClusterLetter, { o: prefix + key, s: letter });
      }
      if (validate && letterToKey.has(letter)) {
        throw error(config, ErrorItem.duplicateClusterLetter, { o: prefix + key, s: letter });
      }
      letterToKey.set(letter, key);
    }
  }
}

/**
 * Validates the option names against a set of rules.
 * @param config The validator configuration
 * @param nameToKey The map of option names to keys
 * @param options The option definitions
 * @param prefix The command prefix, if any
 * @param result The list of warnings to append to
 */
function validateNames(
  config: ConcreteConfig,
  nameToKey: Map<string, string>,
  options: OpaqueOptions,
  prefix: string,
  result: WarnMessage,
) {
  const visited = new Set<string>();
  for (const name of nameToKey.keys()) {
    if (visited.has(name)) {
      continue;
    }
    const similar = findSimilarNames(name, [...nameToKey.keys()], 0.8);
    if (similar.length) {
      result.push(
        format(config, ErrorItem.tooSimilarOptionNames, { o: prefix, s1: name, s2: similar }),
      );
      for (const similarName of similar) {
        visited.add(similarName);
      }
    }
  }
  getNamesInEachSlot(options).forEach((slot, i) => {
    const match = matchNamingRules(slot, namingConventions);
    for (const key in match) {
      const entries = Object.entries(match[key]);
      if (entries.length > 1) {
        const list = entries.map(([rule, name]) => rule + ': ' + name);
        result.push(format(config, ErrorItem.mixedNamingConvention, { o: prefix, n: i, s: list }));
      }
    }
  });
}

/**
 * Creates a formatted message.
 * @param config The validator configuration
 * @param kind The kind of error or warning
 * @param args The message arguments
 * @param flags The formatting flags
 * @returns The formatted message
 */
function format(
  config: ConcreteConfig,
  kind: ErrorItem,
  args?: FormatArgs,
  flags?: FormattingFlags,
): TerminalString {
  const styles: FormatStyles = config.styles;
  delete styles.current;
  return new TerminalString()
    .addSequence(styles.text)
    .formatArgs(styles, config.phrases[kind], args, flags)
    .addBreak();
}

/**
 * Creates an error with a formatted message.
 * @param config The validator configuration
 * @param kind The kind of error message
 * @param args The message arguments
 * @param flags The formatting flags
 * @returns The formatted error
 */
function error(
  config: ConcreteConfig,
  kind: ErrorItem,
  args?: FormatArgs,
  flags?: FormattingFlags,
): ErrorMessage {
  return new ErrorMessage(format(config, kind, args, flags));
}

/**
 * Collects the option names into lists according to their slot.
 * @param options The option definitions
 * @returns The names in each name slot
 */
function getNamesInEachSlot(options: OpaqueOptions): Array<Array<string>> {
  const result = new Array<Array<string>>();
  for (const key in options) {
    options[key].names?.forEach((name, i) => {
      if (name) {
        if (result[i]) {
          result[i].push(name);
        } else {
          result[i] = [name];
        }
      }
    });
  }
  return result;
}

/**
 * Validates an option's requirements.
 * @param flags The validation flags
 * @param options The option definitions
 * @param config The validator configuration
 * @param prefix The command prefix
 * @param key The option key
 * @param option The option definition
 * @param visited The set of visited option definitions
 * @param warning The warnings to append to
 * @throws On invalid enums definition, invalid default value or invalid example value
 */
function validateOption(
  flags: ValidationFlags,
  options: OpaqueOptions,
  config: ConcreteConfig,
  prefix: string,
  key: string,
  option: OpaqueOption,
  visited: Set<OpaqueOptions>,
  warning: WarnMessage,
) {
  if (!isNiladic(option)) {
    validateConstraints(config, prefix + key, option);
    if (typeof option.default !== 'function') {
      validateValue(config, prefix + key, option, option.default);
    }
    validateValue(config, prefix + key, option, option.example);
  }
  // no need to verify flag option default value
  if (option.requires) {
    validateRequirements(options, config, prefix, key, option.requires);
  }
  if (option.requiredIf) {
    validateRequirements(options, config, prefix, key, option.requiredIf);
  }
  if (option.version === '') {
    throw error(config, ErrorItem.emptyVersionDefinition, { o: prefix + key });
  }
  if (option.type === 'command') {
    const options = typeof option.options === 'function' ? option.options() : option.options;
    if (!visited.has(options as OpaqueOptions)) {
      visited.add(options as OpaqueOptions);
      const validator = new OptionValidator(options, config);
      const result = validator.validate(flags, prefix + key + '.', visited);
      if (result.warning) {
        warning.push(...result.warning);
      }
    }
  }
}

/**
 * Validates an option's requirements.
 * @param options The option definitions
 * @param config The validator configuration
 * @param prefix The command prefix
 * @param key The option key
 * @param requires The option requirements
 */
function validateRequirements(
  options: OpaqueOptions,
  config: ConcreteConfig,
  prefix: string,
  key: string,
  requires: Requires,
) {
  if (typeof requires === 'string') {
    validateRequirement(options, config, prefix, key, requires);
  } else if (requires instanceof RequiresNot) {
    validateRequirements(options, config, prefix, key, requires.item);
  } else if (requires instanceof RequiresAll || requires instanceof RequiresOne) {
    for (const item of requires.items) {
      validateRequirements(options, config, prefix, key, item);
    }
  } else if (typeof requires === 'object') {
    for (const requiredKey in requires) {
      validateRequirement(options, config, prefix, key, requiredKey, requires[requiredKey]);
    }
  }
}

/**
 * Validates an option requirement.
 * @param options The option definitions
 * @param config The validator configuration
 * @param prefix The command prefix
 * @param key The option key
 * @param requiredKey The required option key
 * @param requiredValue The required value, if any
 * @throws On option requiring itself, unknown required option, invalid required option or
 * incompatible required values
 */
function validateRequirement(
  options: OpaqueOptions,
  config: ConcreteConfig,
  prefix: string,
  key: string,
  requiredKey: string,
  requiredValue?: RequiresVal[string],
) {
  if (requiredKey === key) {
    throw error(config, ErrorItem.invalidSelfRequirement, { o: prefix + requiredKey });
  }
  if (!(requiredKey in options)) {
    throw error(config, ErrorItem.unknownRequiredOption, { o: prefix + requiredKey });
  }
  const option = options[requiredKey];
  if (isSpecial(option)) {
    throw error(config, ErrorItem.invalidRequiredOption, { o: prefix + requiredKey });
  }
  const noValue = {};
  if ((requiredValue ?? noValue) === noValue) {
    if (option.required || option.default !== undefined) {
      throw error(config, ErrorItem.invalidRequiredValue, { o: prefix + requiredKey });
    }
    return;
  }
  if (isUnknown(option)) {
    throw error(config, ErrorItem.invalidRequiredOption, { o: prefix + requiredKey });
  }
  validateValue(config, prefix + requiredKey, option, requiredValue);
}

/**
 * Checks the sanity of the option's constraints.
 * @param config The validator configuration
 * @param key The option key (plus the prefix, if any)
 * @param option The option definition
 * @throws On zero or duplicate enumerated values or invalid numeric range
 */
function validateConstraints(config: ConcreteConfig, key: string, option: OpaqueOption) {
  if (option.enums) {
    if (!option.enums.length) {
      throw error(config, ErrorItem.emptyEnumsDefinition, { o: key });
    }
    const set = new Set(option.enums);
    if (set.size !== option.enums.length) {
      for (const value of option.enums) {
        if (!set.delete(value)) {
          const [spec, alt] = isString(option) ? ['s', 0] : ['n', 1];
          throw error(config, ErrorItem.duplicateEnumValue, { o: key, [spec]: value }, { alt });
        }
      }
    }
  }
  if (option.range) {
    const [min, max] = option.range;
    // handles NaN as well
    if (!(min < max)) {
      throw error(config, ErrorItem.invalidNumericRange, { o: key, n: option.range });
    }
  }
}

/**
 * Checks the sanity of the option's value (default, example or required).
 * @param config The validator configuration
 * @param key The option key (plus the prefix, if any)
 * @param option The option definition
 * @param value The option value
 * @throws On value not satisfying specified constraints
 */
function validateValue(config: ConcreteConfig, key: string, option: OpaqueOption, value: unknown) {
  /** @ignore */
  function assertType<T>(value: unknown, type: string): asserts value is T {
    if (typeof value !== type) {
      throw error(config, ErrorItem.incompatibleRequiredValue, { o: key, v: value, s: type });
    }
  }
  if (value === undefined) {
    return;
  }
  switch (option.type) {
    case 'flag':
    case 'boolean':
      assertType<boolean>(value, 'boolean');
      break;
    case 'string':
      assertType<string>(value, 'string');
      normalizeString(config, option, key, value);
      break;
    case 'number':
      assertType<number>(value, 'number');
      normalizeNumber(config, option, key, value);
      break;
    case 'strings': {
      assertType<Array<string>>(value, 'object');
      const normalized = value.map((val) => {
        assertType<string>(val, 'string');
        return normalizeString(config, option, key, val);
      });
      normalizeArray(config, option, key, normalized);
      break;
    }
    case 'numbers': {
      assertType<Array<number>>(value, 'object');
      const normalized = value.map((val) => {
        assertType<number>(val, 'number');
        return normalizeNumber(config, option, key, val);
      });
      normalizeArray(config, option, key, normalized);
      break;
    }
  }
}

/**
 * Normalizes the value of a string option and checks its validity against any constraint.
 * @param config The validator configuration
 * @param option The option definition
 * @param name The option name (as specified on the command-line)
 * @param value The option value
 * @returns The normalized string
 * @throws On value not satisfying the specified enumeration or regex constraint
 */
function normalizeString(
  config: ConcreteConfig,
  option: OpaqueOption,
  name: string,
  value: string,
): string {
  if (option.trim) {
    value = value.trim();
  }
  if (option.case) {
    value = option.case === 'lower' ? value.toLowerCase() : value.toLocaleUpperCase();
  }
  if (option.enums && !option.enums.includes(value)) {
    const args = { o: name, s1: value, s2: option.enums };
    throw error(config, ErrorItem.enumsConstraintViolation, args, { alt: 0, sep: ',' });
  }
  if (option.regex && !option.regex.test(value)) {
    const args = { o: name, s: value, r: option.regex };
    throw error(config, ErrorItem.regexConstraintViolation, args);
  }
  return value;
}

/**
 * Normalizes the value of a number option and checks its validity against any constraint.
 * @param config The validator configuration
 * @param option The option definition
 * @param name The option name (as specified on the command-line)
 * @param value The option value
 * @returns The normalized number
 * @throws On value not satisfying the specified enumeration or range constraint
 */
function normalizeNumber(
  config: ConcreteConfig,
  option: OpaqueOption,
  name: string,
  value: number,
): number {
  if (option.conv) {
    value = Math[option.conv](value);
  }
  if (option.enums && !option.enums.includes(value)) {
    const args = { o: name, n1: value, n2: option.enums };
    throw error(config, ErrorItem.enumsConstraintViolation, args, { alt: 1, sep: ',' });
  }
  if (
    option.range &&
    !(value >= option.range[0] && value <= option.range[1]) // handles NaN as well
  ) {
    const args = { o: name, n1: value, n2: option.range };
    throw error(config, ErrorItem.rangeConstraintViolation, args);
  }
  return value;
}

/**
 * Normalizes the value of an array option and checks its validity against any constraint.
 * @param config The validator configuration
 * @param option The option definition
 * @param name The option name (as specified on the command-line)
 * @param value The option value
 * @returns The normalized array
 * @throws On value not satisfying the specified limit constraint
 */
function normalizeArray<T extends string | number>(
  config: ConcreteConfig,
  option: OpaqueOption,
  name: string,
  value: Array<T>,
): Array<T> {
  if (option.unique) {
    const unique = new Set(value);
    value.length = 0;
    value.push(...unique);
  }
  if (option.limit !== undefined && value.length > option.limit) {
    throw error(config, ErrorItem.limitConstraintViolation, {
      o: name,
      n1: value.length,
      n2: option.limit,
    });
  }
  return value;
}
