//--------------------------------------------------------------------------------------------------
// Imports
//--------------------------------------------------------------------------------------------------
import type {
  OpaqueOption,
  Requires,
  RequiresVal,
  OpaqueOptions,
  RequiresAll,
  RequiresOne,
} from './options.js';
import type { FormatArgs, FormattingFlags, MessageStyles } from './styles.js';
import type { Concrete, NamingRules, Range } from './utils.js';

import { tf, fg, ErrorItem, ConnectiveWord } from './enums.js';
import { isOpt, getParamCount, getOptionNames, visitRequirements } from './options.js';
import { style, TerminalString, ErrorMessage, WarnMessage } from './styles.js';
import { findSimilar, getEntries, getValues, matchNamingRules } from './utils.js';

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
    [ErrorItem.unknownOption]: 'Unknown option (%o|%o1).(| Similar names are: %o2.)',
    [ErrorItem.unsatisfiedRequirement]: 'Option %o requires %p.',
    [ErrorItem.missingRequiredOption]: 'Option %o is required.',
    [ErrorItem.missingParameter]: 'Missing parameter to %o.',
    [ErrorItem.missingPackageJson]: 'Could not find a "package.json" file.',
    [ErrorItem.disallowedInlineParameter]:
      '(Option|Positional marker) %o does not accept inline parameters.',
    [ErrorItem.emptyPositionalMarker]: 'Option %o has empty positional marker.',
    [ErrorItem.unnamedOption]: 'Non-positional option %o has no name.',
    [ErrorItem.invalidOptionName]: 'Option %o has invalid name %s.',
    [ErrorItem.invalidVersionDefinition]: 'Option %o has empty version.',
    [ErrorItem.invalidSelfRequirement]: 'Option %o requires itself.',
    [ErrorItem.unknownRequiredOption]: 'Unknown option %o in requirement.',
    [ErrorItem.invalidRequiredOption]: 'Invalid option %o in requirement.',
    [ErrorItem.invalidRequiredValue]:
      'Invalid required value for option %o. Option is always required or has a default value.',
    [ErrorItem.incompatibleRequiredValue]:
      'Incompatible required value %v for option %o. Should be of type %s.',
    [ErrorItem.emptyEnumsDefinition]: 'Option %o has zero-length enumeration.',
    [ErrorItem.duplicateOptionName]: 'Option %o has duplicate name %s.',
    [ErrorItem.duplicatePositionalOption]: 'Duplicate positional option %o1: previous was %o2.',
    [ErrorItem.duplicateEnumValue]: 'Option %o has duplicate enumerator (%s|%n).',
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
    [ErrorItem.tooSimilarOptionNames]: '%o: Option name %s1 has too similar names: %s2.',
    [ErrorItem.mixedNamingConvention]: '%o: Name slot %n has mixed naming conventions: %s.',
    [ErrorItem.invalidNumericRange]: 'Option %o has invalid numeric range [%n].',
    [ErrorItem.invalidParamCount]: 'Option %o has invalid parameter count [%n].',
    [ErrorItem.variadicWithClusterLetter]:
      'Variadic option %o may only appear as the last option in a cluster.',
    [ErrorItem.missingInlineParameter]: 'Option %o requires an inline parameter.',
    [ErrorItem.invalidInlineConstraint]: 'Inline constraint for option %o has no effect.',
  },
  connectives: {
    [ConnectiveWord.and]: 'and',
    [ConnectiveWord.or]: 'or',
    [ConnectiveWord.not]: 'not',
    [ConnectiveWord.no]: 'no',
    [ConnectiveWord.equals]: '==',
    [ConnectiveWord.notEquals]: '!=',
    [ConnectiveWord.optionAlt]: '|',
    [ConnectiveWord.optionSep]: ',',
    [ConnectiveWord.stringSep]: ',',
    [ConnectiveWord.numberSep]: ',',
    [ConnectiveWord.stringQuote]: `'`,
  },
};

/**
 * The naming convention rules.
 */
const namingConventions: NamingRules = {
  cases: {
    lowercase: (name, lower, upper) => name === lower && name !== upper, // has at least one lower
    UPPERCASE: (name, lower, upper) => name !== lower && name === upper, // has at least one upper
    Capitalized: (name, lower, upper) => name[0] !== lower[0] && name !== upper, // has at least one lower
  },
  dashes: {
    noDash: (name) => name[0] !== '-',
    '-singleDash': (name) => name[0] === '-' && name[1] !== '-',
    '--doubleDash': (name) => name[0] === '-' && name[1] === '-',
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
  readonly connectives?: Readonly<Partial<Record<ConnectiveWord, string>>>;
};

/**
 * The validation flags.
 */
export type ValidationFlags = {
  /**
   * Whether the validation procedure should try to detect naming inconsistencies.
   */
  readonly detectNamingIssues?: true;
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

  /**
   * Creates an option validator based on a set of option definitions.
   * @param options The option definitions
   * @param config The validator configuration
   */
  constructor(
    readonly options: OpaqueOptions,
    readonly config: ConcreteConfig = defaultConfig,
  ) {
    for (const [key, option] of getEntries(this.options)) {
      registerNames(this.names, this.letters, key, option);
      const positional = option.positional;
      if (positional) {
        const marker = typeof positional === 'string' ? positional : undefined;
        this.positional = [key, option.preferredName ?? '', option, marker];
      }
    }
  }

  /**
   * Validates all options' definitions, including command options recursively.
   * @param flags The validation flags
   * @returns The validation result
   */
  async validate(flags: ValidationFlags = {}): Promise<ValidationResult> {
    const warning = new WarnMessage();
    const visited = new Set<OpaqueOptions>();
    const context: ValidateContext = [this.config, this.options, flags, warning, visited, ''];
    await validate(context);
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
    return new ErrorMessage(this.format(kind, args, flags));
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
async function validate(context: ValidateContext) {
  const [config, options, flags, , , prefix] = context;
  const names = new Map<string, string>();
  const letters = new Map<string, string>();
  let positional = ''; // to check for duplicate positional options
  for (const [key, option] of getEntries(options)) {
    validateNames(context, names, letters, key, option);
    await validateOption(context, key, option);
    if (option.positional) {
      if (positional) {
        const args = { o1: prefix + key, o2: prefix + positional };
        throw error(config, ErrorItem.duplicatePositionalOption, args);
      }
      positional = key;
    }
  }
  if (flags.detectNamingIssues) {
    detectNamingIssues(context, names.keys());
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
  const letters = option.clusterLetters;
  if (letters) {
    for (const letter of letters) {
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
  const [config] = context;
  const positional = option.positional;
  const prefixedKey = context[5] + key;
  if (positional === '') {
    throw error(config, ErrorItem.emptyPositionalMarker, { o: prefixedKey });
  }
  const names = getOptionNames(option);
  if (!positional && !names.length) {
    throw error(config, ErrorItem.unnamedOption, { o: prefixedKey });
  }
  for (const name of names) {
    if (name.match(/[\s=]+/)) {
      throw error(config, ErrorItem.invalidOptionName, { o: prefixedKey, s: name });
    }
    if (nameToKey.has(name)) {
      throw error(config, ErrorItem.duplicateOptionName, { o: prefixedKey, s: name });
    }
    nameToKey.set(name, key);
  }
  const letters = option.clusterLetters;
  if (letters) {
    for (const letter of letters) {
      if (letter.includes(' ')) {
        throw error(config, ErrorItem.invalidClusterLetter, { o: prefixedKey, s: letter });
      }
      if (letterToKey.has(letter)) {
        throw error(config, ErrorItem.duplicateClusterLetter, { o: prefixedKey, s: letter });
      }
      letterToKey.set(letter, key);
    }
  }
}

/**
 * Detects option naming issues.
 * @param context The validation context
 * @param names The list of option names
 */
function detectNamingIssues(context: ValidateContext, names: Iterable<string>) {
  const [config, options, , warning, , prefix] = context;
  const optionSep = config.connectives[ConnectiveWord.optionSep];
  const prefix2 = prefix.slice(0, -1); // remove trailing dot
  const visited = new Set<string>();
  for (const name of names) {
    if (visited.has(name)) {
      continue;
    }
    const similar = findSimilar(name, names, 0.8);
    if (similar.length) {
      const args = { o: prefix2, s1: name, s2: similar };
      warning.push(format(config, ErrorItem.tooSimilarOptionNames, args, { sep: optionSep }));
      for (const similarName of similar) {
        visited.add(similarName);
      }
    }
  }
  const stringSep = config.connectives[ConnectiveWord.stringSep];
  getNamesInEachSlot(options).forEach((slot, i) => {
    const match = matchNamingRules(slot, namingConventions);
    // produce a warning for each naming rule category with more than one match,
    // with a list of key-value pairs (rule name, first match) as info
    for (const obj of getValues(match)) {
      const entries = getEntries(obj);
      if (entries.length > 1) {
        const list = entries.map(([rule, name]) => rule + ': ' + name);
        const args = { o: prefix2, n: i, s: list };
        warning.push(format(config, ErrorItem.mixedNamingConvention, args, { sep: stringSep }));
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
  const { styles, phrases } = config;
  return new TerminalString().seq(styles.text).format(styles, phrases[kind], args, flags).break();
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
  for (const option of getValues(options)) {
    option.names?.forEach((name, i) => {
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
async function validateOption(context: ValidateContext, key: string, option: OpaqueOption) {
  const [config, , flags, warning, visited, prefix] = context;
  const prefixedKey = prefix + key;
  validateConstraints(config, prefixedKey, option);
  validateValue(config, prefixedKey, option, option.default);
  validateValue(config, prefixedKey, option, option.example);
  validateValue(config, prefixedKey, option, option.fallback);
  const [min, max] = getParamCount(option);
  if (option.inline !== undefined && max !== 1) {
    throw error(config, ErrorItem.invalidInlineConstraint, { o: key });
  }
  if (min < max && option.clusterLetters) {
    warning.push(format(config, ErrorItem.variadicWithClusterLetter, { o: prefixedKey }));
  }
  if (option.requires) {
    validateRequirements(context, key, option.requires);
  }
  if (option.requiredIf) {
    validateRequirements(context, key, option.requiredIf);
  }
  if (option.version === '') {
    throw error(config, ErrorItem.invalidVersionDefinition, { o: prefixedKey });
  }
  if (option.type === 'command') {
    const options = option.options;
    if (options) {
      const resolved = (typeof options === 'function' ? await options() : options) as OpaqueOptions;
      if (!visited.has(resolved)) {
        visited.add(resolved);
        // create a new context, to avoid changing the behavior of functions up in the call stack
        await validate([config, resolved, flags, warning, visited, prefixedKey + '.']);
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
  /** @ignore */
  function validateItems(req: RequiresAll | RequiresOne) {
    req.items.forEach((item) => validateRequirements(context, key, item));
  }
  /** @ignore */
  function validateVals(req: RequiresVal) {
    for (const [requiredKey, requiredVal] of getEntries(req)) {
      validateRequirement(context, key, requiredKey, requiredVal);
    }
  }
  visitRequirements(
    requires,
    (req) => validateRequirement(context, key, req),
    (req) => validateRequirements(context, key, req.item),
    validateItems,
    validateItems,
    validateVals,
    () => {}, // requirement callbacks are ignored
  );
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
  const prefixedKey = prefix + requiredKey;
  if (requiredKey === key) {
    throw error(config, ErrorItem.invalidSelfRequirement, { o: prefixedKey });
  }
  if (!(requiredKey in options)) {
    throw error(config, ErrorItem.unknownRequiredOption, { o: prefixedKey });
  }
  const option = options[requiredKey];
  if (isOpt.msg(option)) {
    throw error(config, ErrorItem.invalidRequiredOption, { o: prefixedKey });
  }
  const noValue = {};
  if ((requiredValue ?? noValue) === noValue) {
    if (option.required || option.default !== undefined) {
      throw error(config, ErrorItem.invalidRequiredValue, { o: prefixedKey });
    }
    return;
  }
  if (isOpt.ukn(option)) {
    throw error(config, ErrorItem.invalidRequiredOption, { o: prefixedKey });
  }
  validateValue(config, prefixedKey, option, requiredValue);
}

/**
 * Checks the sanity of the option's constraints.
 * @param config The validator configuration
 * @param key The option key (plus the prefix, if any)
 * @param option The option definition
 * @throws On invalid enums definition, invalid numeric range or invalid parameter count
 */
function validateConstraints(config: ConcreteConfig, key: string, option: OpaqueOption) {
  /** @ignore */
  function checkRange(range: Range, kind: ErrorItem, checkMin = false) {
    const [min, max] = range;
    // handles NaN
    if (!(min < max) || (checkMin && min < 0)) {
      const sep = config.connectives[ConnectiveWord.numberSep];
      throw error(config, kind, { o: key, n: range }, { sep });
    }
  }
  const enums = option.enums;
  const truth = option.truthNames;
  const falsity = option.falsityNames;
  if ((enums && !enums.length) || (truth && !truth.length) || (falsity && !falsity.length)) {
    throw error(config, ErrorItem.emptyEnumsDefinition, { o: key });
  }
  if (enums || truth || falsity) {
    const values = [...(enums ?? []), ...(truth ?? []), ...(falsity ?? [])];
    const set = new Set(values);
    if (set.size !== values.length) {
      for (const value of values) {
        if (!set.delete(value)) {
          const [spec, alt] = isOpt.num(option) ? ['n', 1] : ['s', 0];
          throw error(config, ErrorItem.duplicateEnumValue, { o: key, [spec]: value }, { alt });
        }
      }
    }
  }
  const range = option.range;
  if (range) {
    checkRange(range, ErrorItem.invalidNumericRange);
  }
  const paramCount = option.paramCount;
  if (typeof paramCount === 'object') {
    checkRange(paramCount, ErrorItem.invalidParamCount, true);
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
  function assert<T>(value: unknown, type: string): asserts value is T {
    if (typeof value !== type) {
      throw error(config, ErrorItem.incompatibleRequiredValue, { o: key, v: value, s: type });
    }
  }
  /** @ignore */
  function call<T>(
    normFn: (config: ConcreteConfig, option: OpaqueOption, name: string, value: T) => T,
    value: T,
  ) {
    return normFn(config, option, key, value);
  }
  if (value === undefined || typeof value === 'function') {
    return;
  }
  switch (option.type) {
    case 'flag':
    case 'boolean':
      assert<boolean>(value, 'boolean');
      break;
    case 'string':
      assert<string>(value, 'string');
      call(normalizeString, value);
      break;
    case 'number':
      assert<number>(value, 'number');
      call(normalizeNumber, value);
      break;
    case 'strings': {
      assert<Array<string>>(value, 'object');
      call(
        normalizeArray,
        value.map((val) => (assert<string>(val, 'string'), call(normalizeString, val))),
      );
      break;
    }
    case 'numbers': {
      assert<Array<number>>(value, 'object');
      call(
        normalizeArray,
        value.map((val) => (assert<number>(val, 'number'), call(normalizeNumber, val))),
      );
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
    const sep = config.connectives[ConnectiveWord.stringSep];
    throw error(config, ErrorItem.enumsConstraintViolation, args, { alt: 0, sep });
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
    const sep = config.connectives[ConnectiveWord.numberSep];
    throw error(config, ErrorItem.enumsConstraintViolation, args, { alt: 1, sep });
  }
  const range = option.range;
  // handles NaN
  if (range && !(value >= range[0] && value <= range[1])) {
    const args = { o: name, n1: value, n2: option.range };
    const sep = config.connectives[ConnectiveWord.numberSep];
    throw error(config, ErrorItem.rangeConstraintViolation, args, { sep });
  }
  return value;
}

/**
 * Normalizes the value of an array-valued option and checks its validity against any constraint.
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
