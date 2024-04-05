//--------------------------------------------------------------------------------------------------
// Imports
//--------------------------------------------------------------------------------------------------
import type { OpaqueOption, Options, Requires, RequiresVal, OpaqueOptions } from './options';
import type { FormatArgs, FormattingFlags, MessageStyles } from './styles';
import type { Concrete, NamingRules } from './utils';

import { tf, fg, ErrorItem, ConnectiveWords } from './enums';
import {
  RequiresAll,
  RequiresOne,
  RequiresNot,
  isOpt,
  getParamCount,
  getOptionNames,
} from './options';
import { style, TerminalString, ErrorMessage, WarnMessage } from './styles';
import { findSimilar, matchNamingRules } from './utils';

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
    [ErrorItem.invalidParamCount]: 'Option %o has invalid parameter count [%n].',
    [ErrorItem.variadicWithClusterLetter]:
      'Variadic option %o has cluster letters. It may only appear as the last option in a cluster.',
    [ErrorItem.invalidBooleanParameter]: 'Invalid parameter to %o: %s1. Possible values are {%s2}.',
  },
  connectives: {
    [ConnectiveWords.and]: 'and',
    [ConnectiveWords.or]: 'or',
    [ConnectiveWords.not]: 'not',
    [ConnectiveWords.no]: 'no',
    [ConnectiveWords.equals]: '==',
    [ConnectiveWords.notEquals]: '!=',
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
   * The message styles.
   */
  readonly styles?: MessageStyles;
  /**
   * The message phrases.
   */
  readonly phrases?: Readonly<Partial<Record<ErrorItem, string>>>;
  /**
   * The connective words.
   */
  readonly connectives?: Readonly<Partial<Record<ConnectiveWords, string>>>;
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
export type OptionInfo = [key: string, name: string, option: OpaqueOption, marker?: string];

/**
 * The validation context.
 * @internal
 */
type ValidateContext = [
  config: ConcreteConfig,
  options: OpaqueOptions,
  flags: ValidationFlags,
  warning: WarnMessage,
  visited: Set<OpaqueOptions>,
  prefix: string,
];

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
      registerNames(this.names, this.letters, key, option);
      if (option.positional) {
        const marker = typeof option.positional === 'string' ? option.positional : undefined;
        this.positional = [key, option.preferredName ?? '', option, marker];
      }
    }
  }

  /**
   * Validates all options' definitions, including command options recursively.
   * @param flags The validation flags
   * @returns The validation result
   */
  validate(flags: ValidationFlags = {}): ValidationResult {
    const warning = new WarnMessage();
    const visited = new Set<OpaqueOptions>();
    const context: ValidateContext = [this.config, this.options, flags, warning, visited, ''];
    validate(context);
    return warning.length ? { warning } : {};
  }

  /**
   * Normalizes the value of an option and checks its validity against any constraint.
   * @template T The option value data type
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
 * Validates all options' definitions, including command options recursively.
 * @param context The validation context
 * @throws On duplicate positional option
 */
function validate(context: ValidateContext) {
  const [config, options, flags, , , prefix] = context;
  const names = new Map<string, string>();
  const letters = new Map<string, string>();
  let positional = ''; // to check for duplicate positional options
  for (const key in options) {
    const option = options[key];
    validateNames(context, names, letters, key, option);
    validateOption(context, key, option);
    if (option.positional) {
      if (positional) {
        const args = { o1: prefix + key, o2: prefix + positional };
        throw error(config, ErrorItem.duplicatePositionalOption, args);
      }
      positional = key;
    }
  }
  if (flags.detectNamingInconsistencies) {
    validateAllNames(context, names.keys());
  }
}

/**
 * Registers an option's names.
 * @param nameToKey The map of option names to keys
 * @param letterToKey The map of cluster letters to key
 * @param key The option key
 * @param option The option definition
 */
function registerNames(
  nameToKey: Map<string, string>,
  letterToKey: Map<string, string>,
  key: string,
  option: OpaqueOption,
) {
  const names = getOptionNames(option);
  for (const name of names) {
    nameToKey.set(name, key);
  }
  if (!option.preferredName) {
    option.preferredName = names[0];
  }
  if (option.clusterLetters) {
    for (const letter of option.clusterLetters) {
      letterToKey.set(letter, key);
    }
  }
}

/**
 * Registers or validates an option's names.
 * @param context The validation context
 * @param nameToKey The map of option names to keys
 * @param letterToKey The map of cluster letters to key
 * @param key The option key
 * @param option The option definition
 * @throws On empty positional marker, option with no name, invalid option name, duplicate name or
 * duplicate cluster letter
 */
function validateNames(
  context: ValidateContext,
  nameToKey: Map<string, string>,
  letterToKey: Map<string, string>,
  key: string,
  option: OpaqueOption,
) {
  const [config, , , , , prefix] = context;
  if (option.positional === '') {
    throw error(config, ErrorItem.emptyPositionalMarker, { o: prefix + key });
  }
  const names = getOptionNames(option);
  if (!option.positional && !names.length) {
    throw error(config, ErrorItem.unnamedOption, { o: prefix + key });
  }
  for (const name of names) {
    if (name.match(/[\s=]+/)) {
      throw error(config, ErrorItem.invalidOptionName, { o: prefix + key, s: name });
    }
    if (nameToKey.has(name)) {
      throw error(config, ErrorItem.duplicateOptionName, { o: prefix + key, s: name });
    }
    nameToKey.set(name, key);
  }
  if (option.clusterLetters) {
    for (const letter of option.clusterLetters) {
      if (letter.includes(' ')) {
        throw error(config, ErrorItem.invalidClusterLetter, { o: prefix + key, s: letter });
      }
      if (letterToKey.has(letter)) {
        throw error(config, ErrorItem.duplicateClusterLetter, { o: prefix + key, s: letter });
      }
      letterToKey.set(letter, key);
    }
  }
}

/**
 * Validates the options' names against a set of rules.
 * @param context The validation context
 * @param names The list of option names
 */
function validateAllNames(context: ValidateContext, names: Iterable<string>) {
  const [config, options, , warning, , prefix] = context;
  const prefix2 = prefix.slice(0, -1); // remove trailing dot
  const visited = new Set<string>();
  for (const name of names) {
    if (visited.has(name)) {
      continue;
    }
    const similar = findSimilar(name, names, 0.8);
    if (similar.length) {
      warning.push(
        format(config, ErrorItem.tooSimilarOptionNames, { o: prefix2, s1: name, s2: similar }),
      );
      for (const similarName of similar) {
        visited.add(similarName);
      }
    }
  }
  getNamesInEachSlot(options).forEach((slot, i) => {
    const match = matchNamingRules(slot, namingConventions);
    // produce a warning for each naming rule category with more than one match,
    // with a list of key-value pairs (rule name, first match) as info
    for (const key in match) {
      const entries = Object.entries(match[key]);
      if (entries.length > 1) {
        const list = entries.map(([rule, name]) => rule + ': ' + name);
        warning.push(format(config, ErrorItem.mixedNamingConvention, { o: prefix, n: i, s: list }));
      }
    }
  });
}

/**
 * Creates a formatted message.
 * The message always ends with a single line break.
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
  return new TerminalString()
    .seq(config.styles.text)
    .format(config.styles, config.phrases[kind], args, flags)
    .break();
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
  const result: Array<Array<string>> = [];
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
 * @param context The validation context
 * @param key The option key
 * @param option The option definition
 * @throws On invalid constraint definition, invalid default, example or fallback value
 */
function validateOption(context: ValidateContext, key: string, option: OpaqueOption) {
  const [config, , , warning, visited, prefix] = context;
  const [min, max] = getParamCount(option);
  // no need to verify a flag option's default value
  if (max) {
    validateConstraints(config, prefix + key, option);
    // non-niladic function options are ignored in value validation
    validateValue(config, prefix + key, option, option.default);
    validateValue(config, prefix + key, option, option.example);
    validateValue(config, prefix + key, option, option.fallback);
  }
  if (min < max && option.clusterLetters) {
    warning.push(format(config, ErrorItem.variadicWithClusterLetter, { o: prefix + key }));
  }
  if (option.requires) {
    validateRequirements(context, key, option.requires);
  }
  if (option.requiredIf) {
    validateRequirements(context, key, option.requiredIf);
  }
  if (option.version === '') {
    throw error(config, ErrorItem.emptyVersionDefinition, { o: prefix + key });
  }
  if (option.type === 'command') {
    const cmdOpts = option.options;
    if (cmdOpts) {
      const opts = (typeof cmdOpts === 'function' ? cmdOpts() : cmdOpts) as OpaqueOptions;
      if (!visited.has(opts)) {
        visited.add(opts);
        context[1] = opts;
        context[5] = prefix + key + '.';
        validate(context);
      }
    }
  }
}

/**
 * Validates an option's requirements.
 * @param context The validation context
 * @param key The option key
 * @param requires The option requirements
 */
function validateRequirements(context: ValidateContext, key: string, requires: Requires) {
  if (typeof requires === 'string') {
    validateRequirement(context, key, requires);
  } else if (requires instanceof RequiresNot) {
    validateRequirements(context, key, requires.item);
  } else if (requires instanceof RequiresAll || requires instanceof RequiresOne) {
    for (const item of requires.items) {
      validateRequirements(context, key, item);
    }
  } else if (typeof requires === 'object') {
    for (const requiredKey in requires) {
      validateRequirement(context, key, requiredKey, requires[requiredKey]);
    }
  }
}

/**
 * Validates an option requirement.
 * @param context The validation context
 * @param key The option key
 * @param requiredKey The required option key
 * @param requiredValue The required value, if any
 * @throws On option requiring itself, unknown required option, invalid required option or
 * incompatible required values
 */
function validateRequirement(
  context: ValidateContext,
  key: string,
  requiredKey: string,
  requiredValue?: RequiresVal[string],
) {
  const [config, options, , , , prefix] = context;
  if (requiredKey === key) {
    throw error(config, ErrorItem.invalidSelfRequirement, { o: prefix + requiredKey });
  }
  if (!(requiredKey in options)) {
    throw error(config, ErrorItem.unknownRequiredOption, { o: prefix + requiredKey });
  }
  const option = options[requiredKey];
  if (isOpt.msg(option)) {
    throw error(config, ErrorItem.invalidRequiredOption, { o: prefix + requiredKey });
  }
  const noValue = {};
  if ((requiredValue ?? noValue) === noValue) {
    if (option.required || option.default !== undefined) {
      throw error(config, ErrorItem.invalidRequiredValue, { o: prefix + requiredKey });
    }
    return;
  }
  if (isOpt.ukn(option)) {
    throw error(config, ErrorItem.invalidRequiredOption, { o: prefix + requiredKey });
  }
  validateValue(config, prefix + requiredKey, option, requiredValue);
}

/**
 * Checks the sanity of the option's constraints.
 * @param config The validator configuration
 * @param key The option key (plus the prefix, if any)
 * @param option The option definition
 * @throws On invalid enums definition, invalid numeric range or invalid parameter count
 */
function validateConstraints(config: ConcreteConfig, key: string, option: OpaqueOption) {
  const enums = option.enums;
  if (enums) {
    if (!enums.length) {
      throw error(config, ErrorItem.emptyEnumsDefinition, { o: key });
    }
    const set = new Set(enums);
    if (set.size !== enums.length) {
      for (const value of enums) {
        if (!set.delete(value)) {
          const [spec, alt] = isOpt.str(option) ? ['s', 0] : ['n', 1];
          throw error(config, ErrorItem.duplicateEnumValue, { o: key, [spec]: value }, { alt });
        }
      }
    }
  }
  const range = option.range;
  if (range) {
    const [min, max] = range;
    // handles NaN
    if (!(min < max)) {
      throw error(config, ErrorItem.invalidNumericRange, { o: key, n: range });
    }
  }
  const paramCount = option.paramCount;
  if (typeof paramCount === 'object') {
    const [min, max] = paramCount;
    // handles NaN
    if (!(min < max) || min < 0) {
      throw error(config, ErrorItem.invalidParamCount, { o: key, n: paramCount });
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
  if (value === undefined || typeof value === 'function') {
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
  const enums = option.enums;
  if (enums && !enums.includes(value)) {
    const args = { o: name, s1: value, s2: enums };
    throw error(config, ErrorItem.enumsConstraintViolation, args, { alt: 0, sep: ',' });
  }
  const regex = option.regex;
  if (regex && !regex.test(value)) {
    const args = { o: name, s: value, r: regex };
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
  const enums = option.enums;
  if (enums && !enums.includes(value)) {
    const args = { o: name, n1: value, n2: enums };
    throw error(config, ErrorItem.enumsConstraintViolation, args, { alt: 1, sep: ',' });
  }
  const range = option.range;
  // handles NaN
  if (range && !(value >= range[0] && value <= range[1])) {
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
  const limit = option.limit;
  if (limit !== undefined && value.length > limit) {
    const args = { o: name, n1: value.length, n2: limit };
    throw error(config, ErrorItem.limitConstraintViolation, args);
  }
  return value;
}
