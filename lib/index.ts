//--------------------------------------------------------------------------------------------------
// Imports and Exports
//--------------------------------------------------------------------------------------------------
export {
  Color,
  Option,
  Options,
  HelpFormatter,
  ArgumentParser,
  StringOption,
  NumberOption,
  BooleanOption,
  StringsOption,
  NumbersOption,
  FunctionOption,
  HelpOption,
};

export {
  noColor,
  black,
  red,
  green,
  yellow,
  blue,
  magenta,
  cyan,
  white,
  brightBlack,
  brightRed,
  brightGreen,
  brightYellow,
  brightBlue,
  brightMagenta,
  brightCyan,
  brightWhite,
};

//--------------------------------------------------------------------------------------------------
// Constants
//--------------------------------------------------------------------------------------------------
const noColor = '\x1b[0m';
const black = '\x1b[30m';
const red = '\x1b[31m';
const green = '\x1b[32m';
const yellow = '\x1b[33m';
const blue = '\x1b[34m';
const magenta = '\x1b[35m';
const cyan = '\x1b[36m';
const white = '\x1b[37m';
const brightBlack = '\x1b[90m';
const brightRed = '\x1b[91m';
const brightGreen = '\x1b[92m';
const brightYellow = '\x1b[93m';
const brightBlue = '\x1b[94m';
const brightMagenta = '\x1b[95m';
const brightCyan = '\x1b[96m';
const brightWhite = '\x1b[97m';

//--------------------------------------------------------------------------------------------------
// Types
//--------------------------------------------------------------------------------------------------
/**
 * Represents a foreground text color (on terminals that support colors).
 */
type Color =
  | typeof noColor
  | typeof black
  | typeof red
  | typeof green
  | typeof yellow
  | typeof blue
  | typeof magenta
  | typeof cyan
  | typeof white
  | typeof brightBlack
  | typeof brightRed
  | typeof brightGreen
  | typeof brightYellow
  | typeof brightBlue
  | typeof brightMagenta
  | typeof brightCyan
  | typeof brightWhite;

/**
 * An option's attributes.
 * @template T The option type
 * @template D The option data type
 * @template V The default value data type
 */
type OptionAttributes<T, D, V = D> = {
  /**
   * The option names, as they appear on the command-line (e.g. `-h` or `--help`).
   */
  readonly names: Array<string>;
  /**
   * The option description.
   */
  readonly desc: string;
  /**
   * The option type. Booleans always default to false.
   */
  readonly type: T;
  /**
   * The option default value.
   */
  readonly default?: V;
  /**
   * The option acceptable values.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly accepts?: Array<V extends Array<any> ? V[number] : V>;
  /**
   * The option highlight color (on terminals that support colors).
   */
  readonly color?: Color;
  /**
   * The option deprecation reason.
   */
  readonly deprecated?: string;
  /**
   * @deprecated for internal use only.
   */
  readonly _value?: D;
};

/**
 * A command-line option that accepts a single string value.
 */
type StringOption = OptionAttributes<'string', string>;

/**
 * A command-line option that accepts a single number value.
 */
type NumberOption = OptionAttributes<'number', number>;

/**
 * A command-line flag which is enabled if specified. Always defaults to false.
 */
type BooleanOption = OptionAttributes<'boolean', boolean, undefined>;

/**
 * A command-line option that accepts a comma-separated list of strings.
 */
type StringsOption = OptionAttributes<'strings', Array<string>>;

/**
 * A command-line option that accepts a comma-separated list of numbers.
 */
type NumbersOption = OptionAttributes<'numbers', Array<number>>;

/**
 * A command-line option that executes a sub-command.
 */
type FunctionOption = OptionAttributes<'function', undefined, () => void>;

/**
 * A command-line option that prints a help message.
 */
type HelpOption = OptionAttributes<'help', undefined, (help: HelpFormatter) => void>;

/**
 * A command-line option that has no intrinsic value.
 */
type NonValuedOption = FunctionOption | HelpOption;

/**
 * A command-line option that accepts no parameter.
 */
type NiladicOption = BooleanOption | NonValuedOption;

/**
 * A command-line option that accepts a single parameter.
 */
type MonadicOption = StringOption | NumberOption | StringsOption | NumbersOption;

/**
 * A command-line option definition.
 */
type Option = NiladicOption | MonadicOption;

/**
 * A collection of option definitions.
 */
type Options = Readonly<Record<string, Option>>;

/**
 * A collection of option values.
 */
type OptionValues<T extends Options> = {
  [key in keyof T as T[key] extends NonValuedOption ? never : key]: T[key]['_value'];
};

/**
 * Help-related information about an option.
 */
type HelpEntry = {
  name: string;
  type: string;
  desc: string;
  color: Color;
};

//--------------------------------------------------------------------------------------------------
// Classes
//--------------------------------------------------------------------------------------------------
/**
 * Implements formatting of help messages for options.
 */
class HelpFormatter {
  private readonly entries: Array<HelpEntry> = [];
  private nameWidth: number = 0;
  private typeWidth: number = 0;

  /**
   * Creates a help message formatter.
   * @param options The option definitions
   * @param nameColor The default name color
   * @param typeColor The type color
   * @param descColor The description color
   */
  constructor(
    options: Options = {},
    private readonly nameColor: Color = noColor,
    private readonly typeColor: Color = brightBlack,
    private readonly descColor: Color = noColor,
  ) {
    for (const option of Object.values(options)) {
      this.addOption(option);
    }
  }

  /**
   * Adds an option to the list of option help entries.
   * @param option The option definition
   */
  addOption(option: Option) {
    const hasValue =
      option.type !== 'function' && option.type !== 'help' && option.type !== 'boolean';
    const name = option.names.join(', ');
    const type = hasValue ? `[${option.type}]` : '';
    const desc = HelpFormatter.formatDescription(option);
    const color = option.color ?? this.nameColor;
    this.entries.push({ name, type, desc, color });
    this.nameWidth = Math.max(this.nameWidth, name.length);
    this.typeWidth = Math.max(this.typeWidth, type.length);
  }

  private static formatDescription(option: Option): string {
    const isFunction = option.type === 'function' || option.type === 'help';
    const isArray = option.type === 'strings' || option.type === 'numbers';
    const hasDefault = !isFunction && option.default !== undefined;
    const formatText = isArray ? '. Values are comma-separated' : '';
    const defaultText = hasDefault ? `. Defaults to '${option.default}'` : '';
    const acceptsText = option.accepts ? `. Accepts values in [${option.accepts}]` : '';
    const deprecatedText = option.deprecated ? `. Deprecated for ${option.deprecated}` : '';
    return option.desc + formatText + defaultText + acceptsText + deprecatedText + '.';
  }

  /**
   * Formats a help message to be printed on the console.
   * @param width The desired console width
   * @returns The formatted help message
   */
  formatHelp(width: number = process.stdout.columns): string {
    const lines = new Array<string>();
    for (const entry of this.entries) {
      this.formatOption(lines, entry, width, '  ');
    }
    return lines.join('\n');
  }

  /**
   * Formats an option to be printed on the console.
   * @param lines The help lines
   * @param entry The option help entry
   * @param width The desired console width
   * @param indent The indentation at the start of the line
   * @returns The formatted option
   */
  private formatOption(lines: Array<string>, entry: HelpEntry, width: number, indent: string) {
    function formatColumn(color: Color, text: string, width: number) {
      return indent + color + text + ' '.repeat(width - text.length);
    }
    const nameColumn = formatColumn(entry.color, entry.name, this.nameWidth);
    const typeColumn = formatColumn(this.typeColor, entry.type, this.typeWidth);
    const prefix = nameColumn + typeColumn + indent + this.descColor;
    const prefixLen = indent.length * 3 + this.nameWidth + this.typeWidth;
    HelpFormatter.wrapText(lines, entry.desc, width - prefixLen, prefix, ' '.repeat(prefixLen));
  }

  /**
   * Wraps text to fit in the console.
   * @param lines The console lines
   * @param text The text to be wrapped
   * @param width The desired console width
   * @param prefix The prefix at the start of the first line
   * @param indent The indentation at the start of each wrapped line
   * @returns The wrapped text
   */
  private static wrapText(
    lines: Array<string>,
    text: string,
    width: number,
    prefix: string,
    indent: string,
  ) {
    let line = '';
    for (const word of text.split(' ')) {
      if (line.length + word.length > width) {
        lines.push(prefix + line);
        prefix = indent;
        line = word;
      } else {
        line += (line ? ' ' : '') + word;
      }
    }
    lines.push(prefix + line);
  }
}

/**
 * Implements parsing of command-line arguments into option values.
 * @template T The type of the options' definitions
 */
class ArgumentParser<T extends Options> {
  private nameToKey = new Map<string, keyof T>();
  private options: T;

  /**
   * Creates an argument parser based on a set of option definitions.
   * @param options The predefined options
   */
  constructor(options: T) {
    this.options = options;
    for (const key in options) {
      for (const name of options[key].names) {
        if (this.nameToKey.has(name)) {
          throw Error(`Duplicate option name: ${name}`);
        }
        this.nameToKey.set(name, key);
      }
    }
  }

  /**
   * Parses command-line arguments into option values.
   * @param values The options' values to parse into
   * @param args The command-line arguments
   */
  parseInto(values: OptionValues<T>, args = process.argv.slice(2)) {
    this.setDefaults(values);

    for (let i = 0; i < args.length; ++i) {
      if (!this.nameToKey.has(args[i])) {
        throw Error(`Unknown option: ${args[i]}`);
      }
      const key = this.nameToKey.get(args[i])!;
      const opt = this.options[key];

      if (opt.type === 'help') {
        if (opt.default) {
          opt.default(new HelpFormatter(this.options));
        }
        continue;
      } else if (opt.type === 'function') {
        if (opt.default) {
          opt.default();
        }
        continue;
      }
      const valueKey = key as keyof OptionValues<T>;

      if (opt.type === 'boolean') {
        values[valueKey] = true;
      } else if (i + 1 == args.length) {
        throw Error(`Missing parameter to: ${key as string}`);
      } else {
        this.handleValue(values, valueKey, opt, args[++i]);
      }
    }
  }

  /**
   * Initialize option values to their default values.
   * @param values The options' values
   */
  private setDefaults(values: OptionValues<T>) {
    for (const key in this.options) {
      const opt = this.options[key];
      const valueKey = key as keyof T as keyof OptionValues<T>;
      if (opt.type === 'boolean') {
        values[valueKey] = false;
      } else if (opt.type !== 'function' && opt.type !== 'help') {
        values[valueKey] = opt.default;
      }
    }
  }

  /**
   * Handles the value of an option.
   * @param values The options' values to parse into
   * @param key The option value key
   * @param opt The option definition
   * @param value The option value
   */
  private handleValue(
    values: OptionValues<T>,
    key: keyof OptionValues<T>,
    opt: MonadicOption,
    value: string,
  ) {
    if (opt.type === 'number') {
      if (opt.accepts && !opt.accepts.includes(Number(value))) {
        throw Error(`Invalid parameter to: ${key as string}. Possible values: ${opt.accepts}`);
      }
      values[key] = Number(value);
      return;
    }

    if (opt.type === 'string') {
      if (opt.accepts && !opt.accepts.includes(value)) {
        throw Error(`Invalid parameter to: ${key as string}. Possible values: ${opt.accepts}`);
      }
      values[key] = value;
      return;
    }

    if (opt.type === 'numbers') {
      values[key] = value.split(',').map((v) => {
        const val = Number(v);
        if (opt.accepts && !opt.accepts.includes(val)) {
          throw Error(`Invalid parameter to: ${key as string}. Possible values: ${opt.accepts}`);
        }
        return val;
      });
      return;
    }

    values[key] = value.split(',').map((v) => {
      const val = v.trim();
      if (opt.accepts && !opt.accepts.includes(val)) {
        throw Error(`Invalid parameter to: ${key as string}. Possible values: ${opt.accepts}`);
      }
      return val;
    });
    return;
  }
}
