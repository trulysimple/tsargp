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

export { HelpFormatter, HelpItem, type FormatConfig };

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
   * @see HelpItem
   */
  readonly items?: ReadonlyArray<HelpItem>;

  /**
   * The phrases to be used for each kind of help item.
   */
  readonly phrases?: Readonly<Partial<Record<HelpItem, string>>>;
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
const enum HelpItem {
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
    HelpItem.synopsis,
    HelpItem.negation,
    HelpItem.separator,
    HelpItem.variadic,
    HelpItem.positional,
    HelpItem.append,
    HelpItem.trim,
    HelpItem.case,
    HelpItem.round,
    HelpItem.enums,
    HelpItem.regex,
    HelpItem.range,
    HelpItem.unique,
    HelpItem.limit,
    HelpItem.requires,
    HelpItem.required,
    HelpItem.default,
    HelpItem.deprecated,
    HelpItem.link,
  ],
  phrases: {
    [HelpItem.synopsis]: '%s',
    [HelpItem.negation]: 'Can be negated with %s.',
    [HelpItem.separator]: 'Values are delimited by %s.',
    [HelpItem.variadic]: 'Accepts multiple parameters.',
    [HelpItem.positional]: 'Accepts positional parameters(| that may be preceded by %s).',
    [HelpItem.append]: 'May be specified multiple times.',
    [HelpItem.trim]: 'Values will be trimmed.',
    [HelpItem.case]: 'Values will be converted to (lowercase|uppercase).',
    [HelpItem.round]:
      'Values will be (truncated|rounded down|rounded up|rounded to the nearest integer).',
    [HelpItem.enums]: 'Values must be one of {%s}.',
    [HelpItem.regex]: 'Values must match the regex %s.',
    [HelpItem.range]: 'Values must be in the range [%s].',
    [HelpItem.unique]: 'Duplicate values will be removed.',
    [HelpItem.limit]: 'Value count is limited to %s.',
    [HelpItem.requires]: 'Requires %s.',
    [HelpItem.required]: 'Always required.',
    [HelpItem.default]: 'Defaults to %s.',
    [HelpItem.deprecated]: 'Deprecated for %s',
    [HelpItem.link]: 'Refer to %s for details.',
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
   * Keep this in-sync with {@link HelpItem}.
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
    if (this.config.hidden?.names) {
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
  private formatNameSlots(names: Option['names'], style: Style, result: TerminalString) {
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
    names?.forEach((name, i) => formatName(name, this.nameWidths[i]));
  }

  /**
   * Formats an option's parameter to be printed on the terminal.
   * @param option The option definition
   * @returns A terminal string with the formatted option parameter
   */
  private formatParam(option: Option): TerminalString {
    const result = new TerminalString();
    if (this.config.hidden?.param || isNiladic(option)) {
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
    if (this.config.hidden?.descr || !this.config.items.length) {
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
  private formatSynopsis(option: Option, _phrase: string, _style: Style, result: TerminalString) {
    if (option.desc) {
      result.splitText(option.desc, '.');
    }
  }

  /**
   * Formats an option's negation names to be included in the description.
   * @param values The option definition
   * @param phrase The help item phrase
   * @param style The description style
   * @param result The resulting string
   */
  private formatNegation(option: Option, _phrase: string, style: Style, result: TerminalString) {
    if ('negationNames' in option && option.negationNames) {
      result.addWords('Can', 'be', 'negated', 'with');
      const names = option.negationNames.filter((name) => name);
      names.forEach((name, i) => {
        this.formatName(name, style, result);
        if (i < names.length - 1) {
          result.addWords('or');
        }
      });
      result.addWords('.');
    }
  }

  /**
   * Formats an option's separator string to be included in the description.
   * @param values The option definition
   * @param phrase The help item phrase
   * @param style The description style
   * @param result The resulting string
   */
  private formatSeparator(option: Option, _phrase: string, style: Style, result: TerminalString) {
    if ('separator' in option && option.separator) {
      result.addWords('Values', 'are', 'delimited', 'by');
      if (typeof option.separator === 'string') {
        this.formatString(option.separator, style, result);
      } else {
        this.formatRegExp(option.separator, style, result);
      }
      result.addWords('.');
    }
  }

  /**
   * Formats an option's variadic nature to be included in the description.
   * @param values The option definition
   * @param phrase The help item phrase
   * @param style The description style
   * @param result The resulting string
   */
  private formatVariadic(option: Option, _phrase: string, _style: Style, result: TerminalString) {
    if (isArray(option) && isVariadic(option)) {
      result.addWords('Accepts', 'multiple', 'parameters.');
    }
  }

  /**
   * Formats an option's positional attribute to be included in the description.
   * @param values The option definition
   * @param phrase The help item phrase
   * @param style The description style
   * @param result The resulting string
   */
  private formatPositional(option: Option, _phrase: string, style: Style, result: TerminalString) {
    if ('positional' in option && option.positional) {
      result.addWords('Accepts', 'positional');
      if (typeof option.positional === 'string') {
        result.addWords('parameters', 'preceded', 'by');
        this.formatName(option.positional, style, result);
        result.addWords('.');
      } else {
        result.addWords('parameters.');
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
  private formatAppend(option: Option, _phrase: string, _style: Style, result: TerminalString) {
    if ('append' in option && option.append) {
      result.addWords('May', 'be', 'specified', 'multiple', 'times.');
    }
  }

  /**
   * Formats an option's trim normalization to be included in the description.
   * @param values The option definition
   * @param phrase The help item phrase
   * @param style The description style
   * @param result The resulting string
   */
  private formatTrim(option: Option, _phrase: string, _style: Style, result: TerminalString) {
    if ('trim' in option && option.trim) {
      result.addWords('Values', 'will', 'be', 'trimmed.');
    }
  }

  /**
   * Formats an option's case normalization to be included in the description.
   * @param values The option definition
   * @param phrase The help item phrase
   * @param style The description style
   * @param result The resulting string
   */
  private formatCase(option: Option, _phrase: string, _style: Style, result: TerminalString) {
    if ('case' in option && option.case) {
      result.addWords('Values', 'will', 'be', 'converted', 'to', option.case + 'case.');
    }
  }

  /**
   * Formats an option's rounding normalization to be included in the description.
   * @param values The option definition
   * @param phrase The help item phrase
   * @param style The description style
   * @param result The resulting string
   */
  private formatRound(option: Option, _phrase: string, _style: Style, result: TerminalString) {
    if ('round' in option && option.round) {
      result.addWords('Values', 'will', 'be');
      switch (option.round) {
        case 'trunc':
          result.addWords('truncated.');
          break;
        case 'floor':
          result.addWords('rounded', 'down.');
          break;
        case 'ceil':
          result.addWords('rounded', 'up.');
          break;
        case 'round':
          result.addWords('rounded', 'to', 'the', 'nearest', 'integer.');
          break;
      }
    }
  }

  /**
   * Formats an option's enumerated values to be included in the description.
   * @param values The option definition
   * @param phrase The help item phrase
   * @param style The description style
   * @param result The resulting string
   */
  private formatEnums(option: Option, _phrase: string, style: Style, result: TerminalString) {
    if ('enums' in option && option.enums) {
      result.addWords('Values', 'must', 'be', 'one', 'of');
      if (option.type === 'string' || option.type === 'strings') {
        const formatFn = this.formatString.bind(this);
        this.formatArray2(option.enums, style, result, formatFn, ['{', '}']);
      } else {
        const formatFn = this.formatNumber.bind(this);
        this.formatArray2(option.enums, style, result, formatFn, ['{', '}']);
      }
      result.addWords('.');
    }
  }

  /**
   * Formats an option's regex constraint to be included in the description.
   * @param values The option definition
   * @param phrase The help item phrase
   * @param style The description style
   * @param result The resulting string
   */
  private formatRegex(option: Option, _phrase: string, style: Style, result: TerminalString) {
    if ('regex' in option && option.regex) {
      result.addWords('Values', 'must', 'match', 'the', 'regex');
      this.formatRegExp(option.regex, style, result);
      result.addWords('.');
    }
  }

  /**
   * Formats an option's range constraint to be included in the description.
   * @param values The option definition
   * @param phrase The help item phrase
   * @param style The description style
   * @param result The resulting string
   */
  private formatRange(option: Option, _phrase: string, style: Style, result: TerminalString) {
    if ('range' in option && option.range) {
      result.addWords('Values', 'must', 'be', 'in', 'the', 'range');
      const formatFn = this.formatNumber.bind(this);
      this.formatArray2(option.range, style, result, formatFn, ['[', ']']);
      result.addWords('.');
    }
  }

  /**
   * Formats an option's unique constraint to be included in the description.
   * @param values The option definition
   * @param phrase The help item phrase
   * @param style The description style
   * @param result The resulting string
   */
  private formatUnique(option: Option, _phrase: string, _style: Style, result: TerminalString) {
    if ('unique' in option && option.unique) {
      result.addWords('Duplicate', 'values', 'will', 'be', 'removed.');
    }
  }

  /**
   * Formats an option's limit constraint to be included in the description.
   * @param values The option definition
   * @param phrase The help item phrase
   * @param style The description style
   * @param result The resulting string
   */
  private formatLimit(option: Option, _phrase: string, style: Style, result: TerminalString) {
    if ('limit' in option && option.limit !== undefined) {
      result.addWords('Value', 'count', 'is', 'limited', 'to');
      this.formatNumber(option.limit, style, result);
      result.addWords('.');
    }
  }

  /**
   * Formats an option's requirements to be included in the description.
   * @param values The option definition
   * @param phrase The help item phrase
   * @param style The description style
   * @param result The resulting string
   */
  private formatRequires(option: Option, _phrase: string, style: Style, result: TerminalString) {
    if (option.requires) {
      result.addWords('Requires');
      this.formatRequirements(option.requires, style, result);
      result.addWords('.');
    }
  }

  /**
   * Formats an option's required attribute to be included in the description.
   * @param values The option definition
   * @param phrase The help item phrase
   * @param style The description style
   * @param result The resulting string
   */
  private formatRequired(option: Option, _phrase: string, _style: Style, result: TerminalString) {
    if ('required' in option && option.required) {
      result.addWords('Always required.');
    }
  }

  /**
   * Formats an option's default value to be included in the description.
   * @param values The option definition
   * @param phrase The help item phrase
   * @param style The description style
   * @param result The resulting string
   */
  private formatDefault(option: Option, _phrase: string, style: Style, result: TerminalString) {
    if (
      'default' in option &&
      option.default !== undefined &&
      typeof option.default !== 'function'
    ) {
      result.addWords('Defaults', 'to');
      this.formatValue(option, option.default, result, style, true);
      result.addWords('.');
    }
  }

  /**
   * Formats an option's deprecation reason to be included in the description.
   * @param values The option definition
   * @param phrase The help item phrase
   * @param style The description style
   * @param result The resulting string
   */
  private formatDeprecated(option: Option, _phrase: string, _style: Style, result: TerminalString) {
    if (option.deprecated) {
      result.addWords('Deprecated', 'for').splitText(option.deprecated, '.');
    }
  }

  /**
   * Formats an option's external resource reference to be included in the description.
   * @param values The option definition
   * @param phrase The help item phrase
   * @param style The description style
   * @param result The resulting string
   */
  private formatLink(option: Option, _phrase: string, style: Style, result: TerminalString) {
    if (option.link) {
      result.addWords('Refer', 'to');
      this.formatURL(option.link, style, result);
      result.addWords('for', 'details.');
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
      this.formatArray2(value, style, result, formatFn, ['[', ']']);
    } else if ('separator' in option && option.separator) {
      if (typeof option.separator === 'string') {
        this.formatString(value.join(option.separator), style, result);
      } else {
        this.formatString(value.join(option.separator.source), style, result);
      }
    } else {
      this.formatArray2(value, style, result, formatFn, undefined, ' ');
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
    brackets?: [string, string],
    separator = ',',
  ) {
    if (brackets) {
      result.addWords(brackets[0]);
    }
    values.forEach((value, i) => {
      formatFn(value, style, result);
      if (i < values.length - 1) {
        result.addWords(separator);
      }
    });
    if (brackets) {
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
    const str = value.toString();
    result.addText(this.config.styles.boolean + str + style, str.length);
  }

  /**
   * Formats a string value to be printed on the terminal.
   * @param value The string value
   * @param style The style to revert to
   * @param result The resulting string
   */
  private formatString(value: string, style: Style, result: TerminalString) {
    const str = `'${value}'`;
    result.addText(this.config.styles.string + str + style, str.length);
  }

  /**
   * Formats a number value to be printed on the terminal.
   * @param value The number value
   * @param style The style to revert to
   * @param result The resulting string
   */
  private formatNumber(value: number, style: Style, result: TerminalString) {
    const str = value.toString();
    result.addText(this.config.styles.number + str + style, str.length);
  }

  /**
   * Formats a regex value to be printed on the terminal.
   * @param value The regex value
   * @param style The style to revert to
   * @param result The resulting string
   */
  private formatRegExp(value: RegExp, style: Style, result: TerminalString) {
    const str = value.toString();
    result.addText(this.config.styles.regex + str + style, str.length);
  }

  /**
   * Formats a URL value to be printed on the terminal.
   * @param value The URL value
   * @param style The style to revert to
   * @param result The resulting string
   */
  private formatURL(value: URL, style: Style, result: TerminalString) {
    const str = value.href;
    result.addText(this.config.styles.url + str + style, str.length);
  }

  /**
   * Formats an option name to be printed on the terminal.
   * @param name The option name
   * @param style The style to revert to
   * @param result The resulting string
   */
  private formatName(name: string, style: Style, result: TerminalString) {
    result.addText(this.config.styles.option + name + style, name.length);
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
    if (!option.hide) {
      option.names?.forEach((name, i) => {
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
    const len = text.lengths[i];
    if (word.startsWith('\n')) {
      addWord();
      result.push(word, moveToStart);
      lineLength = 0;
      currentWord = '';
      currentLen = 0;
      continue;
    }
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
