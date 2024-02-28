//--------------------------------------------------------------------------------------------------
// Imports and Exports
//--------------------------------------------------------------------------------------------------
import type {
  Option,
  Options,
  Requires,
  ValuedOption,
  RequiresVal,
  OptionStyles,
  OtherStyles,
  ArrayOption,
  Concrete,
  ParamOption,
} from './options';
import type { Style } from './styles';

import { RequiresAll, RequiresNot, RequiresOne, isArray, isVariadic, isNiladic } from './options';
import { fg, move, mv, style, TerminalString, tf } from './styles';

export { HelpFormatter, DescItem, type FormatConfig };

//--------------------------------------------------------------------------------------------------
// Types
//--------------------------------------------------------------------------------------------------
/**
 * The help format configuration.
 */
type FormatConfig = {
  /**
   * The indentation level for each column.
   */
  readonly indent?: {
    /**
     * The indentation level for the names column. (Defaults to 2)
     */
    readonly names?: number;
    /**
     * The indentation level for the parameter column. (Defaults to 2)
     */
    readonly param?: number;
    /**
     * The indentation level for the description column. (Defaults to 2)
     */
    readonly descr?: number;
    /**
     * True if the indentation level for the parameter column should be relative to the beginning
     * of the line instead of the end of the names column. (Defaults to false)
     */
    readonly paramAbsolute?: boolean;
    /**
     * True if the indentation level for the description column should be relative to the beginning
     * of the line instead of the end of the parameter column. (Defaults to false)
     */
    readonly descrAbsolute?: boolean;
  };

  /**
   * The number of line breaks to insert before each column.
   */
  readonly breaks?: {
    /**
     * The number of line breaks to insert before the names column. (Defaults to 0)
     */
    readonly names?: number;
    /**
     * The number of line breaks to insert before the parameter column. (Defaults to 0)
     */
    readonly param?: number;
    /**
     * The number of line breaks to insert before the description column. (Defaults to 0)
     */
    readonly descr?: number;
  };

  /**
   * Select individual columns that should not be displayed.
   */
  readonly hidden?: {
    /**
     * True if the names column should be hidden. (Defaults to false)
     */
    readonly names?: boolean;
    /**
     * True if the parameter column should be hidden. (Defaults to false)
     */
    readonly param?: boolean;
    /**
     * True if the description column should be hidden. (Defaults to false)
     */
    readonly descr?: boolean;
  };

  /**
   * The default option styles and styles of other text elements.
   */
  readonly styles?: OptionStyles & OtherStyles;

  /**
   * The order of items to be shown in the option description.
   * @see DescItem
   */
  readonly items?: ReadonlyArray<DescItem>;

  /**
   * The phrases to be used for each kind of help item.
   *
   * If an item has a value, the `%s` specifier can be used to indicate where in the phrase to place
   * the value. If an item has multiple alternatives, such as {@link DescItem.case}, different texts
   * can separated with `|` and grouped in parentheses, like this:
   * `'Values will be converted to (lowercase|uppercase)'`.
   */
  readonly phrases?: Readonly<Partial<Record<DescItem, string>>>;
};

/**
 * A concrete version of the format configuration.
 */
type ConcreteFormat = Concrete<FormatConfig>;

/**
 * Precomputed texts used by the formatter.
 */
type HelpEntry = {
  readonly names: TerminalString;
  readonly param: TerminalString;
  readonly descr: TerminalString;
};

//--------------------------------------------------------------------------------------------------
// Constants
//--------------------------------------------------------------------------------------------------
/**
 * The kind of items that can be shown in the option description.
 */
const enum DescItem {
  /**
   * The option synopsis.
   */
  synopsis,
  /**
   * The negation names of a flag option, if any.
   */
  negation,
  /**
   * The element delimiter of an array option, if enabled.
   */
  separator,
  /**
   * Reports if an array option accepts multiple parameters.
   */
  variadic,
  /**
   * Reports if an option accepts positional arguments.
   */
  positional,
  /**
   * Reports if an array option can be specified multiple times.
   */
  append,
  /**
   * Reports if string parameters will be trimmed (leading and trailing whitespace removed).
   */
  trim,
  /**
   * The kind of case-conversion applied to string parameters, if enabled.
   */
  case,
  /**
   * The kind of rounding applied to number parameters, if enabled.
   */
  round,
  /**
   * The enumerated values that the option accepts as parameters, if any.
   */
  enums,
  /**
   * The regular expression that string parameters should match, if enabled.
   */
  regex,
  /**
   * The numeric range that number parameters should be within, if enabled.
   */
  range,
  /**
   * Reports if duplicate elements will be removed from an array option value.
   */
  unique,
  /**
   * The element count limit of an array option, if enabled.
   */
  limit,
  /**
   * The option requirements, if any.
   */
  requires,
  /**
   * Reports if the option is always required.
   */
  required,
  /**
   * The option's default value, if not a callback.
   */
  default,
  /**
   * Reports if the option is deprecated, and why.
   */
  deprecated,
  /**
   * The external resource reference, if any.
   */
  link,
}

/**
 * The default configuration used by the formatter.
 */
const defaultConfig: ConcreteFormat = {
  indent: {
    names: 2,
    param: 2,
    descr: 2,
    paramAbsolute: false,
    descrAbsolute: false,
  },
  breaks: {
    names: 0,
    param: 0,
    descr: 0,
  },
  hidden: {
    names: false,
    param: false,
    descr: false,
  },
  styles: {
    names: style(tf.clear),
    param: style(tf.clear, fg.brightBlack),
    descr: style(tf.clear),
    boolean: style(fg.yellow),
    string: style(fg.green),
    number: style(fg.yellow),
    regex: style(fg.red),
    option: style(fg.magenta),
    url: style(fg.brightBlack),
    text: style(tf.clear),
  },
  items: [
    DescItem.synopsis,
    DescItem.negation,
    DescItem.separator,
    DescItem.variadic,
    DescItem.positional,
    DescItem.append,
    DescItem.trim,
    DescItem.case,
    DescItem.round,
    DescItem.enums,
    DescItem.regex,
    DescItem.range,
    DescItem.unique,
    DescItem.limit,
    DescItem.requires,
    DescItem.required,
    DescItem.default,
    DescItem.deprecated,
    DescItem.link,
  ],
  phrases: {
    [DescItem.synopsis]: '%s',
    [DescItem.negation]: 'Can be negated with %s',
    [DescItem.separator]: 'Values are delimited by %s',
    [DescItem.variadic]: 'Accepts multiple parameters',
    [DescItem.positional]: 'Accepts positional parameters(| that may be preceded by %s)',
    [DescItem.append]: 'May be specified multiple times',
    [DescItem.trim]: 'Values will be trimmed',
    [DescItem.case]: 'Values will be converted to (lowercase|uppercase)',
    [DescItem.round]:
      'Values will be (truncated|rounded down|rounded up|rounded to the nearest integer)',
    [DescItem.enums]: 'Values must be one of %s',
    [DescItem.regex]: 'Values must match the regex %s',
    [DescItem.range]: 'Values must be in the range %s',
    [DescItem.unique]: 'Duplicate values will be removed',
    [DescItem.limit]: 'Value count is limited to %s',
    [DescItem.requires]: 'Requires %s',
    [DescItem.required]: 'Always required',
    [DescItem.default]: 'Defaults to %s',
    [DescItem.deprecated]: 'Deprecated for %s',
    [DescItem.link]: 'Refer to %s for details',
  },
};

//--------------------------------------------------------------------------------------------------
// Classes
//--------------------------------------------------------------------------------------------------
/**
 * Implements formatting of help messages for a set of option definitions.
 */
class HelpFormatter {
  private readonly groups = new Map<string, Array<HelpEntry>>();
  private readonly config: ConcreteFormat;
  private readonly nameWidths: Array<number>;
  private readonly namesStart: number;
  private readonly paramStart: number;
  private readonly descrStart: number;

  /**
   * Keep this in-sync with {@link DescItem}.
   */
  private readonly format: Array<typeof this.formatSynopsis> = [
    this.formatSynopsis.bind(this),
    this.formatNegation.bind(this),
    this.formatSeparator.bind(this),
    this.formatVariadic.bind(this),
    this.formatPositional.bind(this),
    this.formatAppend.bind(this),
    this.formatTrim.bind(this),
    this.formatCase.bind(this),
    this.formatRound.bind(this),
    this.formatEnums.bind(this),
    this.formatRegex.bind(this),
    this.formatRange.bind(this),
    this.formatUnique.bind(this),
    this.formatLimit.bind(this),
    this.formatRequires.bind(this),
    this.formatRequired.bind(this),
    this.formatDefault.bind(this),
    this.formatDeprecated.bind(this),
    this.formatLink.bind(this),
  ];

  /**
   * Creates a help message formatter.
   * @param options The option definitions
   * @param config The format configuration
   */
  constructor(
    private readonly options: Options,
    config: FormatConfig = {},
  ) {
    this.config = mergeConfig(config);
    this.nameWidths = getNameWidths(options);
    const namesWidth = this.nameWidths.reduce((acc, len) => acc + len, 2);
    let paramWidth = 0;
    for (const key in options) {
      const option = options[key];
      if (!option.hide) {
        const entry = this.formatOption(option);
        paramWidth = Math.max(paramWidth, entry.param.length);
      }
    }
    this.namesStart = Math.max(1, this.config.indent.names + 1);
    this.paramStart = Math.max(
      1,
      this.config.indent.paramAbsolute
        ? this.config.indent.param + 1
        : this.namesStart + namesWidth + this.config.indent.param,
    );
    this.descrStart = Math.max(
      1,
      this.config.indent.descrAbsolute
        ? this.config.indent.descr + 1
        : this.paramStart + paramWidth + this.config.indent.descr,
    );
  }

  /**
   * Formats an option to be printed on the terminal.
   * @param option The option definition
   * @returns The computed help entry
   */
  private formatOption(option: Option): HelpEntry {
    const names = this.formatNames(option);
    const param = this.formatParam(option);
    const descr = this.formatDescription(option);
    const entry: HelpEntry = { names, param, descr };
    const group = this.groups.get(option.group ?? '');
    if (!group) {
      this.groups.set(option.group ?? '', [entry]);
    } else {
      group.push(entry);
    }
    return entry;
  }

  /**
   * Formats an option's names to be printed on the terminal.
   * @param option The option definition
   * @returns A terminal string with the formatted names
   */
  private formatNames(option: Option): TerminalString {
    const result = new TerminalString();
    if (this.config.hidden.names || !option.names) {
      return result;
    }
    const style = option.styles?.names ?? this.config.styles.names;
    this.formatNameSlots(option.names, style, result);
    return result;
  }

  /**
   * Formats a list of names to be printed on the terminal.
   * @param names The list of option names
   * @param style The names style
   * @param result The resulting string
   */
  private formatNameSlots(
    names: ReadonlyArray<string | null>,
    style: Style,
    result: TerminalString,
  ) {
    const textStyle = this.config.styles.text;
    let prev = false;
    let prefix = 0;
    function formatName(name: string | null, width: number) {
      if (prev && name) {
        result.addWords(',');
      } else if (prefix) {
        prefix++;
      }
      if (prefix) {
        result.addText(move(prefix, mv.cuf));
      }
      if (name) {
        result.addText(style + name + textStyle, name.length);
        prev = true;
      } else {
        prev = false;
      }
      prefix = width - (name?.length ?? 0) + 1;
    }
    names.forEach((name, i) => formatName(name, this.nameWidths[i]));
  }

  /**
   * Formats an option's parameter to be printed on the terminal.
   * @param option The option definition
   * @returns A terminal string with the formatted option parameter
   */
  private formatParam(option: Option): TerminalString {
    const result = new TerminalString();
    if (this.config.hidden.param || isNiladic(option)) {
      return result;
    }
    const textStyle = this.config.styles.text;
    if ('example' in option && option.example !== undefined) {
      this.formatValue(option, option.example, result, textStyle, false);
    } else {
      const style = option.styles?.param ?? this.config.styles.param;
      const param =
        'paramName' in option && option.paramName
          ? option.paramName.includes('<')
            ? option.paramName
            : `<${option.paramName}>`
          : `<${option.type}>`;
      result.addText(style + param + textStyle, param.length);
    }
    return result;
  }

  /**
   * Formats an option's description to be printed on the terminal.
   * @param option The option definition
   * @returns A terminal string with the formatted option description
   */
  private formatDescription(option: Option): TerminalString {
    const result = new TerminalString();
    if (this.config.hidden.descr || !this.config.items.length) {
      return result;
    }
    const style = option.styles?.descr ?? this.config.styles.descr;
    result.addText(style, 0);
    for (const item of this.config.items) {
      const phrase = this.config.phrases[item];
      this.format[item](option, phrase, style, result);
    }
    return result;
  }

  /**
   * Formats an option's synopsis to be included in the description.
   * @param values The option definition
   * @param phrase The help item phrase
   * @param style The description style
   * @param result The resulting string
   */
  private formatSynopsis(option: Option, phrase: string, _style: Style, result: TerminalString) {
    if (option.desc) {
      const text = option.desc;
      result.splitText(phrase, () => result.splitText(text));
    }
  }

  /**
   * Formats an option's negation names to be included in the description.
   * @param values The option definition
   * @param phrase The help item phrase
   * @param style The description style
   * @param result The resulting string
   */
  private formatNegation(option: Option, phrase: string, style: Style, result: TerminalString) {
    if ('negationNames' in option && option.negationNames) {
      const names = option.negationNames.filter((name) => name);
      result.splitText(phrase, () => {
        names.forEach((name, i) => {
          this.formatName(name, style, result);
          if (i < names.length - 1) {
            result.addWords('or');
          }
        });
      });
    }
  }

  /**
   * Formats an option's separator string to be included in the description.
   * @param values The option definition
   * @param phrase The help item phrase
   * @param style The description style
   * @param result The resulting string
   */
  private formatSeparator(option: Option, phrase: string, style: Style, result: TerminalString) {
    if ('separator' in option && option.separator) {
      const sep = option.separator;
      result.splitText(phrase, () => {
        if (typeof sep === 'string') {
          this.formatString(sep, style, result);
        } else {
          this.formatRegExp(sep, style, result);
        }
      });
    }
  }

  /**
   * Formats an option's variadic nature to be included in the description.
   * @param values The option definition
   * @param phrase The help item phrase
   * @param style The description style
   * @param result The resulting string
   */
  private formatVariadic(option: Option, phrase: string, _style: Style, result: TerminalString) {
    if (isArray(option) && isVariadic(option)) {
      result.splitText(phrase);
    }
  }

  /**
   * Formats an option's positional attribute to be included in the description.
   * @param values The option definition
   * @param phrase The help item phrase
   * @param style The description style
   * @param result The resulting string
   */
  private formatPositional(option: Option, phrase: string, style: Style, result: TerminalString) {
    if ('positional' in option && option.positional) {
      const pos = option.positional;
      const [p, m] = splitPhrase(phrase);
      if (pos === true || !m) {
        result.splitText(p);
      } else {
        result.splitText(m, () => {
          this.formatName(pos, style, result);
        });
      }
    }
  }

  /**
   * Formats an option's append attribute to be included in the description.
   * @param values The option definition
   * @param phrase The help item phrase
   * @param style The description style
   * @param result The resulting string
   */
  private formatAppend(option: Option, phrase: string, _style: Style, result: TerminalString) {
    if ('append' in option && option.append) {
      result.splitText(phrase);
    }
  }

  /**
   * Formats an option's trim normalization to be included in the description.
   * @param values The option definition
   * @param phrase The help item phrase
   * @param style The description style
   * @param result The resulting string
   */
  private formatTrim(option: Option, phrase: string, _style: Style, result: TerminalString) {
    if ('trim' in option && option.trim) {
      result.splitText(phrase);
    }
  }

  /**
   * Formats an option's case normalization to be included in the description.
   * @param values The option definition
   * @param phrase The help item phrase
   * @param style The description style
   * @param result The resulting string
   */
  private formatCase(option: Option, phrase: string, _style: Style, result: TerminalString) {
    if ('case' in option && option.case) {
      const [l, u] = splitPhrase(phrase);
      result.splitText(option.case === 'lower' || !u ? l : u);
    }
  }

  /**
   * Formats an option's rounding normalization to be included in the description.
   * @param values The option definition
   * @param phrase The help item phrase
   * @param style The description style
   * @param result The resulting string
   */
  private formatRound(option: Option, phrase: string, _style: Style, result: TerminalString) {
    if ('round' in option && option.round) {
      const round = option.round;
      const [t, f, c, r] = splitPhrase(phrase);
      const text =
        round === 'trunc' || !f ? t : round === 'floor' || !c ? f : round === 'ceil' || !r ? c : r;
      result.splitText(text);
    }
  }

  /**
   * Formats an option's enumerated values to be included in the description.
   * @param values The option definition
   * @param phrase The help item phrase
   * @param style The description style
   * @param result The resulting string
   */
  private formatEnums(option: Option, phrase: string, style: Style, result: TerminalString) {
    if ('enums' in option && option.enums) {
      const enums = option.enums;
      const formatFn =
        option.type === 'string' || option.type === 'strings'
          ? this.formatString.bind(this)
          : this.formatNumber.bind(this);
      type FormatFn = (value: string | number, style: Style, result: TerminalString) => void;
      result.splitText(phrase, () => {
        this.formatArray2(enums, style, result, formatFn as FormatFn, ['{', '}'], ',');
      });
    }
  }

  /**
   * Formats an option's regex constraint to be included in the description.
   * @param values The option definition
   * @param phrase The help item phrase
   * @param style The description style
   * @param result The resulting string
   */
  private formatRegex(option: Option, phrase: string, style: Style, result: TerminalString) {
    if ('regex' in option && option.regex) {
      const regex = option.regex;
      result.splitText(phrase, () => {
        this.formatRegExp(regex, style, result);
      });
    }
  }

  /**
   * Formats an option's range constraint to be included in the description.
   * @param values The option definition
   * @param phrase The help item phrase
   * @param style The description style
   * @param result The resulting string
   */
  private formatRange(option: Option, phrase: string, style: Style, result: TerminalString) {
    if ('range' in option && option.range) {
      const range = option.range;
      const formatFn = this.formatNumber.bind(this);
      result.splitText(phrase, () => {
        this.formatArray2(range, style, result, formatFn, ['[', ']'], ',');
      });
    }
  }

  /**
   * Formats an option's unique constraint to be included in the description.
   * @param values The option definition
   * @param phrase The help item phrase
   * @param style The description style
   * @param result The resulting string
   */
  private formatUnique(option: Option, phrase: string, _style: Style, result: TerminalString) {
    if ('unique' in option && option.unique) {
      result.splitText(phrase);
    }
  }

  /**
   * Formats an option's limit constraint to be included in the description.
   * @param values The option definition
   * @param phrase The help item phrase
   * @param style The description style
   * @param result The resulting string
   */
  private formatLimit(option: Option, phrase: string, style: Style, result: TerminalString) {
    if ('limit' in option && option.limit !== undefined) {
      const limit = option.limit;
      result.splitText(phrase, () => {
        this.formatNumber(limit, style, result);
      });
    }
  }

  /**
   * Formats an option's requirements to be included in the description.
   * @param values The option definition
   * @param phrase The help item phrase
   * @param style The description style
   * @param result The resulting string
   */
  private formatRequires(option: Option, phrase: string, style: Style, result: TerminalString) {
    if (option.requires) {
      const requires = option.requires;
      result.splitText(phrase, () => {
        this.formatRequirements(requires, style, result);
      });
    }
  }

  /**
   * Formats an option's required attribute to be included in the description.
   * @param values The option definition
   * @param phrase The help item phrase
   * @param style The description style
   * @param result The resulting string
   */
  private formatRequired(option: Option, phrase: string, _style: Style, result: TerminalString) {
    if ('required' in option && option.required) {
      result.splitText(phrase);
    }
  }

  /**
   * Formats an option's default value to be included in the description.
   * @param values The option definition
   * @param phrase The help item phrase
   * @param style The description style
   * @param result The resulting string
   */
  private formatDefault(option: Option, phrase: string, style: Style, result: TerminalString) {
    if (
      'default' in option &&
      option.default !== undefined &&
      typeof option.default !== 'function'
    ) {
      const def = option.default;
      result.splitText(phrase, () => {
        this.formatValue(option, def, result, style, true);
      });
    }
  }

  /**
   * Formats an option's deprecation reason to be included in the description.
   * @param values The option definition
   * @param phrase The help item phrase
   * @param style The description style
   * @param result The resulting string
   */
  private formatDeprecated(option: Option, phrase: string, _style: Style, result: TerminalString) {
    if (option.deprecated) {
      const text = option.deprecated;
      result.splitText(phrase, () => result.splitText(text));
    }
  }

  /**
   * Formats an option's external resource reference to be included in the description.
   * @param values The option definition
   * @param phrase The help item phrase
   * @param style The description style
   * @param result The resulting string
   */
  private formatLink(option: Option, phrase: string, style: Style, result: TerminalString) {
    if (option.link) {
      const link = option.link;
      result.splitText(phrase, () => {
        this.formatURL(link, style, result);
      });
    }
  }

  /**
   * Formats a list of values to be printed on the terminal.
   * @param option The option definition
   * @param values The array values
   * @param result The resulting string
   * @param formatFn The function to convert a value to string
   * @param style The description style, if in the description
   * @param inDesc True if in the description
   */
  private formatArray<T extends string | number>(
    option: ArrayOption,
    value: ReadonlyArray<T>,
    result: TerminalString,
    formatFn: (value: T, style: Style, result: TerminalString) => void,
    style: Style,
    inDesc: boolean,
  ) {
    if (inDesc) {
      this.formatArray2(value, style, result, formatFn, ['[', ']'], ',');
    } else if ('separator' in option && option.separator) {
      if (typeof option.separator === 'string') {
        this.formatString(value.join(option.separator), style, result);
      } else {
        this.formatString(value.join(option.separator.source), style, result);
      }
    } else {
      this.formatArray2(value, style, result, formatFn, ['', ''], ' ');
    }
  }

  /**
   * Formats a list of values to be printed on the terminal.
   * @param values The array values
   * @param style The style to be applied
   * @param result The resulting string
   * @param formatFn The function to convert a value to string
   * @param brackets An optional pair of brackets to surround the values
   * @param separator An optional separator to delimit the values
   */
  private formatArray2<T extends string | number>(
    values: ReadonlyArray<T>,
    style: Style,
    result: TerminalString,
    formatFn: (value: T, style: Style, result: TerminalString) => void,
    brackets: [string, string],
    separator: string,
  ) {
    if (brackets[0]) {
      result.addWords(brackets[0]);
    }
    values.forEach((value, i) => {
      formatFn(value, style, result);
      if (i < values.length - 1) {
        result.addWords(separator);
      }
    });
    if (brackets[1]) {
      result.addWords(brackets[1]);
    }
  }

  /**
   * Formats a boolean value to be printed on the terminal.
   * @param value The boolean value
   * @param style The style to revert to
   * @param result The resulting string
   */
  private formatBoolean(value: boolean, style: Style, result: TerminalString) {
    result.addAndRevert(this.config.styles.boolean, value.toString(), style);
  }

  /**
   * Formats a string value to be printed on the terminal.
   * @param value The string value
   * @param style The style to revert to
   * @param result The resulting string
   */
  private formatString(value: string, style: Style, result: TerminalString) {
    result.addAndRevert(this.config.styles.string, `'${value}'`, style);
  }

  /**
   * Formats a number value to be printed on the terminal.
   * @param value The number value
   * @param style The style to revert to
   * @param result The resulting string
   */
  private formatNumber(value: number, style: Style, result: TerminalString) {
    result.addAndRevert(this.config.styles.number, value.toString(), style);
  }

  /**
   * Formats a regex value to be printed on the terminal.
   * @param value The regex value
   * @param style The style to revert to
   * @param result The resulting string
   */
  private formatRegExp(value: RegExp, style: Style, result: TerminalString) {
    result.addAndRevert(this.config.styles.regex, value.toString(), style);
  }

  /**
   * Formats a URL value to be printed on the terminal.
   * @param value The URL value
   * @param style The style to revert to
   * @param result The resulting string
   */
  private formatURL(value: URL, style: Style, result: TerminalString) {
    result.addAndRevert(this.config.styles.url, value.href, style);
  }

  /**
   * Formats an option name to be printed on the terminal.
   * @param name The option name
   * @param style The style to revert to
   * @param result The resulting string
   */
  private formatName(name: string, style: Style, result: TerminalString) {
    result.addAndRevert(this.config.styles.option, name, style);
  }

  /**
   * Recursively formats an option's requirements to be included in the description.
   * @param requires The option requirements
   * @param style The description style
   * @param result The resulting string
   * @param negate True if the requirement should be negated
   */
  private formatRequirements(
    requires: Requires,
    style: Style,
    result: TerminalString,
    negate: boolean = false,
  ) {
    if (typeof requires === 'string') {
      const option = this.options[requires];
      const name = option.preferredName ?? option.names?.find((name) => name) ?? 'unnamed';
      if (negate) {
        result.addWords('no');
      }
      this.formatName(name, style, result);
    } else if (requires instanceof RequiresNot) {
      this.formatRequirements(requires.item, style, result, !negate);
    } else if (requires instanceof RequiresAll || requires instanceof RequiresOne) {
      this.formatRequiresExp(requires, style, result, negate);
    } else {
      this.formatRequiresVal(requires, style, result, negate);
    }
  }

  /**
   * Formats a requirement expression to be included in the description.
   * @param requires The requirement expression
   * @param style The description style
   * @param result The resulting string
   * @param negate True if the requirement should be negated
   */
  private formatRequiresExp(
    requires: RequiresAll | RequiresOne,
    style: Style,
    result: TerminalString,
    negate: boolean,
  ) {
    const op = requires instanceof RequiresAll ? (negate ? 'or' : 'and') : negate ? 'and' : 'or';
    if (requires.items.length > 1) {
      result.addWords('(');
    }
    requires.items.forEach((item, i) => {
      this.formatRequirements(item, style, result, negate);
      if (i < requires.items.length - 1) {
        result.addWords(op);
      }
    });
    if (requires.items.length > 1) {
      result.addWords(')');
    }
  }

  /**
   * Formats a requirement object to be included in the description.
   * @param requires The requirement object
   * @param style The description style
   * @param result The resulting string
   * @param negate True if the requirement should be negated
   */
  private formatRequiresVal(
    requires: RequiresVal,
    style: Style,
    result: TerminalString,
    negate: boolean,
  ) {
    const entries = Object.entries(requires);
    if (entries.length > 1) {
      result.addWords('(');
    }
    entries.forEach(([key, value], i) => {
      this.formatRequiredValue(this.options[key], value, style, result, negate);
      if (i < entries.length - 1) {
        result.addWords('and');
      }
    });
    if (entries.length > 1) {
      result.addWords(')');
    }
  }

  /**
   * Formats an option's required value to be included in the description.
   * @param option The option definition
   * @param value The option value
   * @param style The description style
   * @param result The resulting string
   * @param negate True if the requirement should be negated
   */
  private formatRequiredValue(
    option: Option,
    value: RequiresVal[string],
    style: Style,
    result: TerminalString,
    negate: boolean,
  ) {
    function assert(_condition: unknown): asserts _condition {}
    const name = option.preferredName ?? option.names?.find((name) => name) ?? 'unnamed';
    if ((value === null && !negate) || (value === undefined && negate)) {
      result.addWords('no');
    }
    this.formatName(name, style, result);
    if (value !== null && value !== undefined) {
      assert(!isNiladic(option));
      result.addWords(negate ? '!=' : '=');
      this.formatValue(option, value, result, style, true);
    }
  }

  /**
   * Formats a value from an option's property.
   * @param option The option definition
   * @param value The option value
   * @param result The resulting string
   * @param style The style to revert to
   * @param inDesc True if in the description
   */
  private formatValue(
    option: ValuedOption,
    value: ParamOption['example'],
    result: TerminalString,
    style: Style,
    inDesc: boolean,
  ) {
    if (value === undefined) {
      return;
    }
    function assert(_condition: unknown): asserts _condition {}
    switch (option.type) {
      case 'flag':
      case 'boolean':
        assert(typeof value === 'boolean');
        this.formatBoolean(value, style, result);
        break;
      case 'string':
        assert(typeof value === 'string');
        this.formatString(value, style, result);
        break;
      case 'number':
        assert(typeof value === 'number');
        this.formatNumber(value, style, result);
        break;
      case 'strings': {
        assert(typeof value === 'object');
        const formatFn = this.formatString.bind(this);
        this.formatArray(option, value as ReadonlyArray<string>, result, formatFn, style, inDesc);
        break;
      }
      case 'numbers': {
        assert(typeof value === 'object');
        const formatFn = this.formatNumber.bind(this);
        this.formatArray(option, value as ReadonlyArray<number>, result, formatFn, style, inDesc);
        break;
      }
      default: {
        const _exhaustiveCheck: never = option;
        return _exhaustiveCheck;
      }
    }
  }

  /**
   * Formats a help message for the default option group.
   * @param width The desired terminal width
   * @returns The formatted help message
   */
  formatHelp(width = process.stdout.columns ?? process.stderr.columns): string {
    const entries = this.groups.get('');
    return entries ? this.formatEntries(width, entries) : '';
  }

  /**
   * Formats help messages for all option groups.
   * @param width The desired terminal width
   * @returns The formatted help messages
   */
  formatGroups(width = process.stdout.columns ?? process.stderr.columns): Map<string, string> {
    const groups = new Map<string, string>();
    for (const [group, entries] of this.groups.entries()) {
      groups.set(group, this.formatEntries(width, entries));
    }
    return groups;
  }

  /**
   * Formats a help message from a list of help entries.
   * @param width The desired terminal width
   * @param entries The help entries
   * @returns The formatted help message
   */
  private formatEntries(width: number, entries: Array<HelpEntry>): string {
    function formatCol(text: TerminalString, start: number, breaks: number, wrap = false) {
      if (text.length) {
        if (breaks > 0) {
          result.push('\n'.repeat(breaks)); // some terminals do not support cursor down movement
        }
        if (wrap) {
          wrapText(result, text, width, start);
        } else {
          result.push(move(start, mv.cha), ...text.strings);
        }
      }
    }
    const result = new Array<string>();
    for (const { names, param, descr } of entries) {
      formatCol(names, this.namesStart, this.config.breaks.names);
      formatCol(param, this.paramStart, this.config.breaks.param);
      formatCol(descr, this.descrStart, this.config.breaks.descr, true);
      result.push('\n');
    }
    result.length--; // pop the last line break
    return result.join('');
  }
}

//--------------------------------------------------------------------------------------------------
// Functions
//--------------------------------------------------------------------------------------------------
/**
 * Merges a format configuration with the default configuration.
 * @param config The configuration, which may override default settings
 * @returns The merged configuration
 */
function mergeConfig(config: FormatConfig): ConcreteFormat {
  return {
    indent: Object.assign({}, defaultConfig.indent, config.indent),
    breaks: Object.assign({}, defaultConfig.breaks, config.breaks),
    styles: Object.assign({}, defaultConfig.styles, config.styles),
    hidden: Object.assign({}, defaultConfig.hidden, config.hidden),
    items: config.items ?? defaultConfig.items,
    phrases: Object.assign({}, defaultConfig.phrases, config.phrases),
  };
}

/**
 * Gets the required width of each name slot for a set of options.
 * @param options The option definitions
 * @returns The required width of each name slot
 */
function getNameWidths(options: Options): Array<number> {
  const result = new Array<number>();
  for (const key in options) {
    const option = options[key];
    if (!option.hide && option.names) {
      option.names.forEach((name, i) => {
        if (i == result.length) {
          result.push(name?.length ?? 0);
        } else if (name && name.length > result[i]) {
          result[i] = name.length;
        }
      });
    }
  }
  return result;
}

/**
 * Wraps an option's description to fit in the terminal width.
 * @param result The resulting strings to append to
 * @param text The terminal string to be wrapped
 * @param width The desired terminal width
 * @param start The column number to start each line at
 */
function wrapText(result: Array<string>, text: TerminalString, width: number, start: number) {
  let moveToStart = '';
  if (width >= start + Math.max(...text.lengths)) {
    width -= start;
    moveToStart = move(start, mv.cha);
    result.push(moveToStart);
  } else {
    result.push('\n');
  }
  const punctuation = /^[.,:;!?](?!=)/;
  const closingBrackets = /^[)\]}]/;
  const openingBrackets = /^[{[(]/;
  let merge = false;
  let lineLength = 0;
  let currentLen = 0;
  let currentWord = '';
  let currentStyle = '';
  function addWord() {
    if (!currentLen) {
      return;
    }
    const space = lineLength ? ' ' : '';
    if (lineLength + space.length + currentLen <= width) {
      result.push(space + currentWord);
      lineLength += space.length + currentLen;
    } else {
      result.push('\n', moveToStart, currentWord);
      lineLength = currentLen;
    }
  }
  for (let i = 0; i < text.strings.length; ++i) {
    const word = text.strings[i];
    if (word.startsWith('\n')) {
      addWord();
      result.push(word, moveToStart);
      lineLength = 0;
      currentWord = '';
      currentLen = 0;
      continue;
    }
    const len = text.lengths[i];
    if (!len) {
      currentStyle = word;
      continue;
    }
    if (merge || word.match(punctuation) || word.match(closingBrackets)) {
      currentWord += currentStyle + word;
      currentLen += len;
      merge = false;
    } else {
      addWord();
      currentWord = currentStyle + word;
      currentLen = len;
      merge = word.match(openingBrackets) !== null;
    }
    currentStyle = '';
  }
  addWord();
}

/**
 * Split a phrase into multiple alternatives
 * @param phrase The help item phrase
 * @returns The phrase alternatives
 */
function splitPhrase(phrase: string): Array<string> {
  const [l, c, r] = phrase.split(/\((.*|.*)\)/, 3);
  return c ? c.split('|').map((alt) => l + alt + r) : [l];
}
