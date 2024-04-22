//--------------------------------------------------------------------------------------------------
// Imports
//--------------------------------------------------------------------------------------------------
import type { FormattingFlags, MessageConfig } from './styles.js';
import type {
  HelpSections,
  Options,
  OptionInfo,
  OptionValues,
  OpaqueOption,
  OpaqueOptionValues,
  Range,
  Requires,
  RequiresEntry,
  ResolveCallback,
  RequiresCallback,
} from './options.js';
import type { Args, PartialWithDepth, URL } from './utils.js';

import { ConnectiveWord, ParseError } from './enums.js';
import {
  fmt,
  cfg,
  ErrorFormatter,
  WarnMessage,
  HelpMessage,
  TextMessage,
  TerminalString,
} from './styles.js';
import { getParamCount, isMessage, visitRequirements, OptionRegistry } from './options.js';
import {
  getCmdLine,
  findSimilar,
  getEnv,
  getCompIndex,
  getEntries,
  getSymbol,
  isReadonlyArray,
  getKeys,
  isArray,
  findValue,
  getArgs,
  readFile,
  areEqual,
  getValues,
  mergeValues,
} from './utils.js';

//--------------------------------------------------------------------------------------------------
// Constants
//--------------------------------------------------------------------------------------------------
/**
 * The default help sections.
 */
const defaultSections: HelpSections = [
  { type: 'usage', title: 'Usage:', indent: 2 },
  { type: 'groups', title: 'Options:' },
];

/**
 * The default configuration used by the parser.
 */
const defaultConfig: ParserConfig = {
  ...cfg,
  phrases: {
    [ParseError.unknownOption]: 'Unknown option #0.(| Similar names are: #1.)',
    [ParseError.unsatisfiedRequirement]: 'Option #0 requires #1.',
    [ParseError.missingRequiredOption]: 'Option #0 is required.',
    [ParseError.mismatchedParamCount]:
      'Wrong number of parameters to option #0: requires (exactly|at least|at most|between) #1.',
    [ParseError.missingPackageJson]: 'Could not find a "package.json" file.',
    [ParseError.disallowedInlineParameter]:
      '(Option|Positional marker) #0 does not accept inline parameters.',
    [ParseError.choiceConstraintViolation]:
      'Invalid parameter to #0: #1. Value must be one of: #2.',
    [ParseError.regexConstraintViolation]:
      'Invalid parameter to #0: #1. Value must match the regex #2.',
    [ParseError.limitConstraintViolation]:
      'Option #0 has too many values: #1. Should have at most #2.',
    [ParseError.deprecatedOption]: 'Option #0 is deprecated and may be removed in future releases.',
    [ParseError.unsatisfiedCondRequirement]: 'Option #0 is required if #1.',
    [ParseError.invalidClusterOption]: 'Option letter #0 must be the last in a cluster.',
    [ParseError.missingInlineParameter]: 'Option #0 requires an inline parameter.',
  },
};

//--------------------------------------------------------------------------------------------------
// Public types
//--------------------------------------------------------------------------------------------------
/**
 * The configuration for error/warning messages.
 */
export type ParserConfig = MessageConfig & {
  /**
   * The parse error/warning phrases.
   */
  readonly phrases: Readonly<Record<ParseError, string>>;
};

/**
 * A partial parser configuration.
 */
export type ParseConfig = PartialWithDepth<ParserConfig>;

/**
 * The parsing flags.
 */
export type ParsingFlags = {
  /**
   * The program name.
   */
  readonly progName?: string;
  /**
   * The completion index of a raw command line.
   */
  readonly compIndex?: number;
  /**
   * The prefix of cluster arguments.
   * If set, then eligible arguments that have this prefix will be considered a cluster.
   */
  readonly clusterPrefix?: string;
};

/**
 * The parsing result.
 */
export type ParsingResult = {
  /**
   * The warnings generated by the parser, if any.
   */
  readonly warning?: WarnMessage;
};

/**
 * The command line or command-line arguments.
 */
export type CommandLine = string | Array<string>;

//--------------------------------------------------------------------------------------------------
// Internal types
//--------------------------------------------------------------------------------------------------
/**
 * Information about the current parsing context.
 */
type ParseContext = [
  registry: OptionRegistry,
  formatter: ErrorFormatter<ParseError>,
  values: OpaqueOptionValues,
  args: Array<string>,
  specifiedKeys: Set<string>,
  completing: boolean,
  warning: WarnMessage,
  progName?: string,
  clusterPrefix?: string,
];

/**
 * Information about the current argument sequence.
 */
type ParseEntry = [
  index: number,
  info?: OptionInfo,
  value?: string,
  comp?: boolean,
  marker?: boolean,
  isNew?: boolean,
];

/**
 * A function to check a requirement item.
 * @template T The type of the item
 */
type RequireItemFn<T> = (
  context: ParseContext,
  option: OpaqueOption,
  item: T,
  error: TerminalString,
  negate: boolean,
  invert: boolean,
) => boolean | Promise<boolean>;

//--------------------------------------------------------------------------------------------------
// Classes
//--------------------------------------------------------------------------------------------------
/**
 * Implements parsing of command-line arguments into option values.
 * @template T The type of the option definitions
 */
export class ArgumentParser<T extends Options = Options> {
  private readonly registry: OptionRegistry;
  private readonly formatter: ErrorFormatter<ParseError>;

  /**
   * Creates an argument parser based on a set of option definitions.
   * @param options The option definitions
   * @param config The parse configuration
   */
  constructor(options: T, config: ParseConfig = {}) {
    this.registry = new OptionRegistry(options);
    this.formatter = new ErrorFormatter(mergeValues(defaultConfig, config));
  }

  /**
   * Parses command-line arguments into option values.
   * @param cmdLine The command line or arguments
   * @param flags The parsing flags
   * @returns The options' values
   */
  async parse(cmdLine?: CommandLine, flags?: ParsingFlags): Promise<OptionValues<T>> {
    const values = {} as OptionValues<T>;
    await this.parseInto(values, cmdLine, flags);
    return values;
  }

  /**
   * Parses command-line arguments into option values.
   * @param values The options' values to parse into
   * @param cmdLine The command line or arguments
   * @param flags The parsing flags
   * @returns The parsing result
   */
  async parseInto(
    values: OptionValues<T>,
    cmdLine = getCmdLine(),
    flags?: ParsingFlags,
  ): Promise<ParsingResult> {
    const compIndex = flags?.compIndex ?? getCompIndex();
    const args = typeof cmdLine === 'string' ? getArgs(cmdLine, compIndex) : cmdLine;
    const context = createContext(
      this.registry,
      this.formatter,
      values,
      args,
      !!compIndex,
      flags?.progName,
      flags?.clusterPrefix,
    );
    await parseArgs(context);
    const warning = context[6];
    return warning.length ? { warning } : {};
  }
}

//--------------------------------------------------------------------------------------------------
// Functions
//--------------------------------------------------------------------------------------------------
/**
 * Initializes the command-line arguments for parsing.
 * @param registry The option registry
 * @param formatter The error formatter
 * @param values The option values
 * @param args The command-line arguments
 * @param completing True if performing completion
 * @param progName The program name, if any
 * @param clusterPrefix The cluster prefix, if any
 * @returns The parsing context
 */
function createContext(
  registry: OptionRegistry,
  formatter: ErrorFormatter<ParseError>,
  values: OpaqueOptionValues,
  args: Array<string>,
  completing: boolean,
  progName = process?.argv[1].split(/[\\/]/).at(-1),
  clusterPrefix?: string,
): ParseContext {
  if (!completing && progName && process?.title) {
    process.title += ' ' + progName;
  }
  for (const [key, option] of getEntries(registry.options)) {
    if (!(key in values) && (!isMessage(option.type) || option.saveMessage)) {
      values[key] = undefined;
    }
  }
  const specifiedKeys = new Set<string>();
  const warning = new WarnMessage();
  return [
    registry,
    formatter,
    values,
    args,
    specifiedKeys,
    completing,
    warning,
    progName,
    clusterPrefix,
  ];
}

//--------------------------------------------------------------------------------------------------
// Argument parsing
//--------------------------------------------------------------------------------------------------
/**
 * Parses a cluster argument.
 * @param context The parsing context
 * @param index The argument index
 * @returns True if the argument was a cluster
 */
function parseCluster(context: ParseContext, index: number): boolean {
  /** @ignore */
  function getOpt(letter: string): [string, OpaqueOption, string?] {
    const key = letters.get(letter) ?? '';
    const option = registry.options[key];
    const name = option.names?.find((name): name is string => name !== null);
    return [key, option, name];
  }
  const [registry, formatter, , args, , completing, , , prefix] = context;
  const cluster = args[index++];
  if (prefix === undefined || !cluster.startsWith(prefix) || cluster.length === prefix.length) {
    return false;
  }
  const letters = registry.letters;
  const rest = cluster.slice(prefix.length);
  const unknownIndex = [...rest].findIndex((letter) => !letters.has(letter));
  if (unknownIndex === 0) {
    return false; // do not consider it a cluster
  }
  if (unknownIndex > 0) {
    const name = getOpt(rest[0])[2];
    args.splice(index, 0, (name !== undefined ? name + '=' : '') + rest.slice(1));
    return true; // treat it as an inline parameter
  }
  for (let j = 0; j < rest.length && (!completing || index < args.length); ++j) {
    const letter = rest[j];
    const [, option, name] = getOpt(letter);
    const [min, max] = getParamCount(option);
    if (j < rest.length - 1 && (option.type === 'command' || min < max)) {
      throw formatter.error(ParseError.invalidClusterOption, {}, letter);
    }
    if (name !== undefined) {
      args.splice(index++, 0, name);
    }
    index += min;
  }
  return true;
}

/**
 * Parses the command-line arguments.
 * @param context The parsing context
 */
async function parseArgs(context: ParseContext) {
  const [registry, formatter, values, args, specifiedKeys, completing, warning] = context;
  let prev: ParseEntry = [-1];
  let paramCount: Range = [0, 0];
  let suggestNames = false;
  for (let i = 0, k = 0; i < args.length; i = prev[0]) {
    const next = findNext(context, prev);
    const [j, info, value, comp, marker, isNew] = next;
    if (isNew || !info) {
      if (prev[1]) {
        // process the previous sequence
        const breakLoop = await tryParseParams(context, prev[1], i, args.slice(k, j));
        if (breakLoop) {
          return; // skip requirements
        }
      }
      if (!info) {
        break; // finished
      }
      prev = next;
      const positional = info === registry.positional; // don't use option.positional for this check
      const [key, option, name] = info;
      paramCount = getParamCount(option);
      const [min, max] = paramCount;
      const hasValue = value !== undefined;
      if (!max || marker || (!positional && option.inline === false)) {
        if (comp) {
          throw new TextMessage();
        }
        if (hasValue) {
          if (completing) {
            // ignore disallowed inline parameters while completing
            prev[1] = undefined;
            prev[4] = false;
            continue;
          }
          const [alt, name2] = marker ? [1, `${option.positional}`] : [0, name];
          throw formatter.error(ParseError.disallowedInlineParameter, { alt }, getSymbol(name2));
        }
      } else if (min && !hasValue && option.inline) {
        if (completing) {
          // ignore required inline parameters while completing
          prev[1] = undefined;
          continue;
        }
        throw formatter.error(ParseError.missingInlineParameter, {}, getSymbol(name));
      }
      if (!completing && !specifiedKeys.has(key)) {
        if (option.deprecated !== undefined) {
          warning.push(formatter.create(ParseError.deprecatedOption, {}, getSymbol(name)));
        }
        specifiedKeys.add(key);
      }
      if (!max) {
        // comp === false
        const [breakLoop, skipCount] = await handleNiladic(context, info, j, args.slice(j + 1));
        if (breakLoop) {
          return; // skip requirements
        }
        prev[0] += skipCount;
        prev[1] = undefined;
        continue; // fetch more
      }
      if (!comp) {
        if (positional || !hasValue) {
          // positional marker, first positional parameter or option name
          k = hasValue ? j : j + 1;
        } else {
          // option name with inline parameter
          const breakLoop = await tryParseParams(context, info, j, [value]);
          if (breakLoop) {
            return; // skip requirements
          }
          prev[1] = undefined;
        }
        continue; // fetch more
      }
      // perform completion of first positional or inline parameter
      suggestNames = positional;
      k = j;
    }
    if (!info) {
      break; // finished
    }
    // comp === true
    const words = await completeParameter(values, info, i, args.slice(k, j), value);
    if (!marker && (suggestNames || (j > i && j - k >= paramCount[0]))) {
      words.push(...completeName(registry, value));
    }
    throw new TextMessage(...words);
  }
  await checkRequired(context);
}

/**
 * Finds the start of the next sequence in the command-line arguments, or a word to complete.
 * If a sequence is found, it is a new option specification (but the option can be the same).
 * @param context The parsing context
 * @param prev The previous parse entry
 * @returns The new parse entry
 */
function findNext(context: ParseContext, prev: ParseEntry): ParseEntry {
  const [registry, , , args, , completing] = context;
  const [index, info, prevVal, , marker] = prev;
  const inc = prevVal !== undefined ? 1 : 0;
  const positional = registry.positional;
  const [min, max] = info ? getParamCount(info[1]) : [0, 0];
  for (let i = index + 1; i < args.length; ++i) {
    const arg = args[i];
    const comp = completing && i + 1 === args.length;
    if (!info || (!marker && i - index + inc > min)) {
      const [name, value] = arg.split(/=(.*)/, 2);
      const key = registry.names.get(name);
      if (key) {
        if (comp && value === undefined) {
          throw new TextMessage(name);
        }
        const marker = name === positional?.[1].positional;
        const info: OptionInfo = marker ? positional : [key, registry.options[key], name];
        return [i, info, value, comp, marker, true];
      }
      if (parseCluster(context, i)) {
        if (comp) {
          throw new TextMessage();
        }
        continue;
      }
      if (!info || i - index + inc > max) {
        if (!positional) {
          if (comp) {
            throw new TextMessage(...completeName(registry, arg));
          }
          if (completing) {
            continue; // ignore unknown options during completion
          }
          reportUnknownName(context, name);
        }
        return [i, positional, arg, comp, false, true];
      }
    }
    if (comp) {
      return [i, info, arg, comp, marker, false];
    }
  }
  return [args.length];
}

/**
 * Reports an error of unknown option name.
 * @param context The parsing context
 * @param name The unknown option name
 */
function reportUnknownName(context: ParseContext, name: string): never {
  const [registry, formatter] = context;
  const similar = findSimilar(name, registry.names.keys(), 0.6);
  const alt = similar.length ? 1 : 0;
  const sep = formatter.config.connectives[ConnectiveWord.optionSep];
  throw formatter.error(
    ParseError.unknownOption,
    { alt, sep, open: '', close: '' },
    getSymbol(name),
    similar.map(getSymbol),
  );
}

/**
 * Completes an option name.
 * @param registry The option registry
 * @param prefix The name prefix, if any
 * @returns The completion words
 */
function completeName(registry: OptionRegistry, prefix?: string): Array<string> {
  const names = [...registry.names.keys()];
  return prefix ? names.filter((name) => name.startsWith(prefix)) : names;
}

/**
 * Completes an option parameter.
 * @param values The option values
 * @param info The option information
 * @param index The starting index of the argument sequence
 * @param prev The preceding parameters, if any
 * @param comp The word being completed
 * @returns The completion words
 */
async function completeParameter(
  values: OpaqueOptionValues,
  info: OptionInfo,
  index: number,
  prev: Array<string>,
  comp = '',
): Promise<Array<string>> {
  const [, option, name] = info;
  let words: Array<string>;
  if (option.complete) {
    try {
      // do not destructure `complete`, because the callback might need to use `this`
      words = await option.complete(comp, { values, index, name, prev });
    } catch (err) {
      // do not propagate errors during completion
      words = [];
    }
  } else {
    const choices = option.choices;
    words = isReadonlyArray<string>(choices) ? choices.slice() : choices ? getKeys(choices) : [];
    if (comp) {
      words = words.filter((word) => word.startsWith(comp));
    }
  }
  return words;
}

//--------------------------------------------------------------------------------------------------
// Parameter handling
//--------------------------------------------------------------------------------------------------
/**
 * Handles a non-niladic option, ignoring parsing errors when performing word completion.
 * @param context The parsing context
 * @param info The option information
 * @param index The starting index of the argument sequence
 * @param params The option parameters, if any
 * @returns True if the parsing loop should be broken
 */
async function tryParseParams(
  context: ParseContext,
  info: OptionInfo,
  index: number,
  params: Array<string>,
): Promise<boolean> {
  try {
    // use await here instead of return, in order to catch errors
    const [breakLoop] = await parseParams(context, info, index, params);
    return breakLoop;
  } catch (err) {
    // do not propagate parsing errors during completion
    if (!context[5]) {
      throw err;
    }
    return false;
  }
}

/**
 * Handles a non-niladic option.
 * @param context The parsing context
 * @param info The option information
 * @param index The starting index of the argument sequence
 * @param params The option parameter(s)
 * @returns [True if the parsing loop should be broken, number of additional processed arguments]
 */
async function parseParams(
  context: ParseContext,
  info: OptionInfo,
  index: number,
  params: Array<string>,
): Promise<[boolean, number]> {
  /** @ignore */
  function error(kind: ParseError, flags: FormattingFlags, ...args: Args) {
    return formatter.error(kind, flags, getSymbol(name), ...args);
  }
  /** @ignore */
  function parse(param: string): unknown {
    // do not destructure `parse`, because the callback might need to use `this`
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return rec && param in rec ? rec[param] : option.parse?.(param as any, seq) ?? param;
  }
  const [, formatter, values, , , comp] = context;
  const [key, option, name] = info;
  const breakLoop = !!option.break && !comp;
  // if index is NaN, we are in the middle of requirements checking
  if (index >= 0 && breakLoop) {
    await checkRequired(context);
  }
  const format = formatter.format.bind(formatter);
  const seq = { values, index, name, comp, format };
  if (option.type === 'flag') {
    // do not destructure `parse`, because the callback might need to use `this`
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    values[key] = option.parse ? await option.parse(params as any, seq) : true;
    const skipCount = Math.max(0, option.skipCount ?? 0);
    return [breakLoop, skipCount];
  }
  const separator = option.separator;
  if (separator) {
    params = params.flatMap((param) => param.split(separator));
  }
  if (index >= 0) {
    const [min, max] = getParamCount(option);
    if (params.length < min || params.length > max) {
      // this may happen when the sequence comes from either the positional marker or environment data
      // comp === false, otherwise completion would have taken place by now
      const [alt, val] =
        min === max ? [0, min] : !min ? [2, max] : isFinite(max) ? [3, [min, max]] : [1, min];
      const sep = formatter.config.connectives[ConnectiveWord.and];
      const flags = { alt, sep, mergePrev: false };
      throw error(ParseError.mismatchedParamCount, flags, val);
    }
  }
  if (option.type === 'function') {
    // do not destructure `parse`, because the callback might need to use `this`
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    values[key] = option.parse ? await option.parse(params as any, seq) : null;
    return [breakLoop, 0];
  }
  const regex = option.regex;
  if (regex) {
    const mismatch = params.find((param) => !param.match(regex));
    if (mismatch) {
      throw error(ParseError.regexConstraintViolation, {}, mismatch, regex);
    }
  }
  const choices = option.choices;
  const [keys, rec] = isReadonlyArray<string>(choices)
    ? [choices]
    : [option.parse ? undefined : choices && getKeys(choices), choices];
  if (keys) {
    const mismatch = params.find((param) => !keys.includes(param));
    if (mismatch) {
      throw error(ParseError.choiceConstraintViolation, { open: '', close: '' }, mismatch, keys);
    }
  }
  if (option.type === 'single') {
    values[key] = await parse(params[0]);
  } else {
    const prev = (option.append && (values[key] as Array<unknown>)) ?? [];
    // do not use `map` with `Promise.all`, because the promises need to be chained
    for (const param of params) {
      prev.push(await parse(param));
    }
    values[key] = normalizeArray(formatter, option, name, prev);
  }
  return [breakLoop, 0];
}

/**
 * Normalizes the value of an array-valued option and checks the validity of its element count.
 * @template T The type of the array element
 * @param formatter The error formatter
 * @param option The option definition
 * @param name The option name
 * @param value The option value
 * @returns The normalized array
 * @throws On value not satisfying the specified limit constraint
 */
function normalizeArray<T>(
  formatter: ErrorFormatter<ParseError>,
  option: OpaqueOption,
  name: string,
  value: Array<T>,
): Array<T> {
  if (option.unique) {
    const unique = new Set(value);
    value.length = 0; // reuse the same array
    value.push(...unique);
  }
  const limit = option.limit;
  if (limit !== undefined && value.length > limit) {
    throw formatter.error(
      ParseError.limitConstraintViolation,
      {},
      getSymbol(name),
      value.length,
      limit,
    );
  }
  return value;
}

//--------------------------------------------------------------------------------------------------
// Niladic option handling
//--------------------------------------------------------------------------------------------------
/**
 * Handles a niladic option.
 * @param context The parsing context
 * @param info The option information
 * @param index The starting index of the argument sequence
 * @param rest The remaining command-line arguments
 * @returns [True if the parsing loop should be broken, number of additional processed arguments]
 */
async function handleNiladic(
  context: ParseContext,
  info: OptionInfo,
  index: number,
  rest: Array<string>,
): Promise<[boolean, number]> {
  const comp = context[5];
  switch (info[1].type) {
    case 'help':
    case 'version':
      // skip message-valued options during completion
      if (!comp) {
        await handleMessage(context, info, rest);
      }
      return [!comp, 0];
    case 'command':
      if (!comp) {
        await checkRequired(context);
      }
      await handleCommand(context, info, index, rest);
      return [true, 0];
    default:
      // flag option: reuse non-niladic handling
      try {
        // use await here instead of return, in order to catch errors
        return await parseParams(context, info, index, rest);
      } catch (err) {
        // do not propagate parsing errors during completion
        if (!comp || err instanceof TextMessage) {
          throw err;
        }
        return [false, 0];
      }
  }
}

/**
 * Handles a command option.
 * @param context The parsing context
 * @param info The option information
 * @param index The starting index of the argument sequence
 * @param rest The remaining command-line arguments
 * @returns The result of parsing the command arguments
 */
async function handleCommand(
  context: ParseContext,
  info: OptionInfo,
  index: number,
  rest: Array<string>,
) {
  const [, formatter, values, , , comp, warning] = context;
  const [key, option, name] = info;
  // do not destructure `options`, because the callback might need to use `this`
  const cmdOptions =
    typeof option.options === 'function' ? await option.options() : option.options ?? {};
  const cmdRegistry = new OptionRegistry(cmdOptions);
  const param: OpaqueOptionValues = {};
  const cmdContext = createContext(
    cmdRegistry,
    formatter,
    param,
    rest,
    comp,
    name,
    option.clusterPrefix,
  );
  await parseArgs(cmdContext);
  warning.push(...cmdContext[6]);
  // comp === false, otherwise completion will have taken place by now
  if (option.parse) {
    const format = formatter.format.bind(formatter);
    const seq = { values, index, name, format };
    // do not destructure `parse`, because the callback might need to use `this`
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    values[key] = await option.parse(param as any, seq as any);
  } else {
    values[key] = param;
  }
}

/**
 * Handles a message-valued option.
 * @param context The parsing context
 * @param info The option information
 * @param rest The remaining command-line arguments
 * @throws The help or version message
 */
async function handleMessage(context: ParseContext, info: OptionInfo, rest: Array<string>) {
  const [, formatter, values] = context;
  const [key, option] = info;
  const message =
    option.type === 'help'
      ? await handleHelp(context, option, rest)
      : option.resolve
        ? await handleVersion(formatter, option.resolve)
        : option.version ?? '';
  if (option.saveMessage) {
    values[key] = message;
  } else {
    throw message;
  }
}

/**
 * Handles a help option.
 * @param context The parsing context
 * @param option The option definition
 * @param rest The remaining command-line arguments
 * @returns The help message
 */
async function handleHelp(
  context: ParseContext,
  option: OpaqueOption,
  rest: Array<string>,
): Promise<HelpMessage> {
  let [registry, formatter, , , , , , progName] = context;
  if (option.useNested && rest.length) {
    const cmdOpt = findValue(
      registry.options,
      (opt) => opt.type === 'command' && !!opt.names?.includes(rest[0]),
    );
    if (cmdOpt) {
      if (cmdOpt.options) {
        // do not destructure `options`, because the callback might need to use `this`
        const resolved =
          typeof cmdOpt.options === 'function' ? await cmdOpt.options() : cmdOpt.options;
        const helpOpt = findValue(resolved, (opt) => opt.type === 'help');
        if (helpOpt) {
          registry = new OptionRegistry(resolved);
          option = helpOpt;
          rest.splice(0, 1); // only if the command has help; otherwise, it may be an option filter
        }
      }
    }
  }
  const formats = option.formats;
  if (formats) {
    let format;
    if (option.useFormat && rest.length && rest[0] in formats) {
      format = rest[0];
      rest.splice(0, 1); // only if the format is recognized; otherwise, it may be an option filter
    }
    const helpConfig = option.config ?? {};
    if (option.useFilter) {
      helpConfig.filter = rest;
    }
    const formatterClass = format ? formats[format] : getValues(formats)[0];
    if (formatterClass) {
      const helpFormatter = new formatterClass(registry, formatter.config, helpConfig);
      return helpFormatter.sections(option.sections ?? defaultSections, progName);
    }
  }
  return new TextMessage(); // fallback to an empty message
}

/**
 * Resolve a package version using a module-resolve function.
 * @param formatter The error formatter
 * @param resolve The resolve callback
 * @returns The version string
 */
async function handleVersion(
  formatter: ErrorFormatter<ParseError>,
  resolve: ResolveCallback,
): Promise<string> {
  for (
    let path = './package.json', resolved = resolve(path), lastResolved;
    resolved !== lastResolved;
    lastResolved = resolved, path = '../' + path, resolved = resolve(path)
  ) {
    const data = await readFile(new URL(resolved));
    if (data !== undefined) {
      return JSON.parse(data).version;
    }
  }
  throw formatter.error(ParseError.missingPackageJson);
}

//--------------------------------------------------------------------------------------------------
// Requirements handling
//--------------------------------------------------------------------------------------------------
/**
 * Checks if required options were correctly specified.
 * This should only be called when completion is not in effect.
 * @param context The parsing context
 */
async function checkRequired(context: ParseContext) {
  const keys = getKeys(context[0].options);
  // we may need to serialize the following call
  await Promise.all(keys.map((key) => checkDefaultValue(context, key)));
  await Promise.all(keys.map((key) => checkRequiredOption(context, key)));
}

/**
 * Checks if there is an environment variable or default value for an option.
 * @param context The parsing context
 * @param key The option key
 * @returns A promise that must be awaited before continuing
 */
async function checkDefaultValue(context: ParseContext, key: string) {
  const [registry, formatter, values, , specifiedKeys] = context;
  if (specifiedKeys.has(key)) {
    return;
  }
  const option = registry.options[key];
  const names: Array<0 | string | URL> = option.stdin ? [0] : [];
  names.push(...(option.sources ?? []));
  for (const name of names) {
    const param = typeof name === 'string' ? getEnv(name) : await readFile(name);
    if (param !== undefined) {
      await parseParams(context, [key, option, `${name}`], NaN, [param]);
      specifiedKeys.add(key);
      return;
    }
  }
  const name = option.preferredName ?? '';
  if (option.required) {
    throw formatter.error(ParseError.missingRequiredOption, {}, getSymbol(name));
  }
  if ('default' in option) {
    // do not destructure `default`, because the callback might need to use `this`
    const value =
      typeof option.default === 'function' ? await option.default(values) : option.default;
    values[key] =
      option.type === 'array' && isArray(value)
        ? normalizeArray(formatter, option, name, value)
        : value;
  }
}

/**
 * Checks the requirements of an option.
 * @param context The parsing context
 * @param key The option key
 */
async function checkRequiredOption(context: ParseContext, key: string) {
  /** @ignore */
  function check(requires: Requires, negate: boolean, invert: boolean) {
    return checkRequires(context, option, requires, error, negate, invert);
  }
  const [registry, formatter, , , specifiedKeys] = context;
  const option = registry.options[key];
  const specified = specifiedKeys.has(key);
  const requires = option.requires;
  const requiredIf = option.requiredIf;
  const error = new TerminalString();
  if (
    (specified && requires && !(await check(requires, false, false))) ||
    (!specified && requiredIf && !(await check(requiredIf, true, true)))
  ) {
    const name = option.preferredName ?? '';
    const kind = specified
      ? ParseError.unsatisfiedRequirement
      : ParseError.unsatisfiedCondRequirement;
    throw formatter.error(kind, {}, getSymbol(name), error);
  }
}

/**
 * Checks the requirements of an option that was specified.
 * @param context The parsing context
 * @param option The option definition
 * @param requires The option requirements
 * @param error The terminal string error
 * @param negate True if the requirements should be negated
 * @param invert True if the requirements should be inverted
 * @returns True if the requirements were satisfied
 */
async function checkRequires(
  context: ParseContext,
  option: OpaqueOption,
  requires: Requires,
  error: TerminalString,
  negate: boolean,
  invert: boolean,
): Promise<boolean> {
  /** @ignore */
  function checkItems<T>(items: Array<T>, checkFn: RequireItemFn<T>, and: boolean) {
    return checkRequireItems(context, option, items, checkFn, error, negate, invert, and);
  }
  return visitRequirements(
    requires,
    (req) =>
      Promise.resolve(checkRequiresEntry(context, option, [req, undefined], error, negate, invert)),
    (req) => checkRequires(context, option, req.item, error, !negate, invert),
    (req) => checkItems(req.items, checkRequires, !negate),
    (req) => checkItems(req.items, checkRequires, negate),
    (req) => checkItems(getEntries(req), checkRequiresEntry, !negate),
    (req) => checkRequiresCallback(context, option, req, error, negate, invert),
  );
}

/**
 * Checks if a required option was specified with correct values.
 * @param context The parsing context
 * @param _option The requiring option definition
 * @param entry The required option key and value
 * @param error The terminal string error
 * @param negate True if the requirement should be negated
 * @param invert True if the requirements should be inverted
 * @returns True if the requirement was satisfied
 */
function checkRequiresEntry(
  context: ParseContext,
  _option: OpaqueOption,
  entry: RequiresEntry,
  error: TerminalString,
  negate: boolean,
  invert: boolean,
): boolean {
  const [registry, formatter, values, , specifiedKeys] = context;
  const [key, expected] = entry;
  const actual = values[key];
  const option = registry.options[key];
  const specified = specifiedKeys.has(key) || actual !== undefined; // consider default values
  const required = expected !== null;
  const name = option.preferredName ?? '';
  const { config } = formatter;
  const { connectives } = config;
  if (!specified || !required || expected === undefined) {
    if ((specified === required) !== negate) {
      return true;
    }
    if (specified !== invert) {
      error.word(connectives[ConnectiveWord.no]);
    }
    fmt.m(Symbol.for(name), config, error);
    return false;
  }
  if (areEqual(actual, expected) !== negate) {
    return true;
  }
  const connective =
    negate !== invert ? connectives[ConnectiveWord.notEquals] : connectives[ConnectiveWord.equals];
  fmt.m(Symbol.for(name), config, error);
  error.word(connective);
  fmt.v(expected, config, error, {});
  return false;
}

/**
 * Checks the items of a requirement expression or object.
 * @param context The parsing context
 * @param option The option definition
 * @param items The list of requirement items
 * @param itemFn The callback to execute on each item
 * @param error The terminal string error
 * @param negate True if the requirement should be negated
 * @param invert True if the requirements should be inverted
 * @param and If true, return on the first error; else return on the first success
 * @returns True if the requirement was satisfied
 */
async function checkRequireItems<T>(
  context: ParseContext,
  option: OpaqueOption,
  items: Array<T>,
  itemFn: RequireItemFn<T>,
  error: TerminalString,
  negate: boolean,
  invert: boolean,
  and: boolean,
): Promise<boolean> {
  const connectives = context[1].config.connectives;
  const connective = invert ? connectives[ConnectiveWord.and] : connectives[ConnectiveWord.or];
  if (!and && items.length > 1) {
    error.open(connectives[ConnectiveWord.exprOpen]);
  }
  let first = true;
  for (const item of items) {
    if (and || first) {
      first = false;
    } else {
      error.word(connective);
    }
    const success = await itemFn(context, option, item, error, negate, invert);
    if (success !== and) {
      return success;
    }
  }
  if (and) {
    return true;
  }
  if (items.length > 1) {
    error.close(connectives[ConnectiveWord.exprClose]);
  }
  return false;
}

/**
 * Checks the result of a requirement callback.
 * @param context The parsing context
 * @param option The option definition
 * @param callback The requirement callback
 * @param error The terminal string error
 * @param negate True if the requirements should be negated
 * @param invert True if the requirements should be inverted
 * @returns True if the requirements were satisfied
 */
async function checkRequiresCallback(
  context: ParseContext,
  option: OpaqueOption,
  callback: RequiresCallback,
  error: TerminalString,
  negate: boolean,
  invert: boolean,
): Promise<boolean> {
  const [, formatter, values] = context;
  const result = await callback.bind(option)(values);
  if (result === negate) {
    const { config } = formatter;
    if (negate !== invert) {
      error.word(config.connectives[ConnectiveWord.not]);
    }
    fmt.v(callback, config, error, {});
    return false;
  }
  return true;
}
