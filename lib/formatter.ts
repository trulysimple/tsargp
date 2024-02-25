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
} from './options';
import type { Style } from './styles';

import { RequiresAll, RequiresNot, RequiresOne, isArray, isVariadic, isNiladic } from './options';
import { fg, isStyle, move, mv, style, TerminalString, tf } from './styles';

export { HelpFormatter, HelpItem, type HelpFormat };

//--------------------------------------------------------------------------------------------------
// Types
//--------------------------------------------------------------------------------------------------
/**
 * Precomputed texts used by the formatter.
 */
type HelpEntry = {
  readonly names: TerminalString;
  readonly param: TerminalString;
  readonly desc: TerminalString;
};

/**
 * A concrete version of the help format configuration.
 */
type ConcreteFormat = Concrete<HelpFormat>;

/**
 * The user-provided help format configuration.
 */
type HelpFormat = {
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
    readonly desc?: number;
    /**
     * True if the indentation level for the parameter column should be relative to the beginning
     * of the line instead of the end of the names column. (Defaults to false)
     */
    readonly paramAbsolute?: boolean;
    /**
     * True if the indentation level for the description column should be relative to the beginning
     * of the line instead of the end of the parameter column. (Defaults to false)
     */
    readonly descAbsolute?: boolean;
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
    readonly desc?: number;
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
    readonly desc?: boolean;
  };

  /**
   * The default option styles and styles of other text elements.
   */
  readonly styles?: OptionStyles & OtherStyles;

  /**
   * The order of items to be shown in the option description.
   * @see HelpItem
   */
  readonly items?: Array<HelpItem>;
};

//--------------------------------------------------------------------------------------------------
// Constants
//--------------------------------------------------------------------------------------------------
/**
 * The kind of items that can be shown in the option description.
 */
const enum HelpItem {
  /**
   * The user-provided option description.
   */
  desc,
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
   * The option default value, if any.
   */
  default,
  /**
   * Reports if the option is deprecated.
   */
  deprecated,
}

/**
 * The default configuration used by the formatter.
 */
const defaultConfig: ConcreteFormat = {
  indent: {
    names: 2,
    param: 2,
    desc: 2,
    paramAbsolute: false,
    descAbsolute: false,
  },
  breaks: {
    names: 0,
    param: 0,
    desc: 0,
  },
  hidden: {
    names: false,
    param: false,
    desc: false,
  },
  styles: {
    names: style(tf.clear),
    param: style(tf.clear, fg.brightBlack),
    desc: style(tf.clear),
    regex: style(fg.red),
    boolean: style(fg.yellow),
    string: style(fg.green),
    number: style(fg.yellow),
    option: style(fg.magenta),
    text: style(tf.clear),
  },
  items: [
    HelpItem.desc,
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
  ],
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
  private readonly descStart: number;

  /**
   * Keep this in-sync with {@link HelpItem}.
   */
  private readonly format: Array<typeof this.formatDesc> = [
    this.formatDesc.bind(this),
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
  ];

  /**
   * Creates a help message formatter.
   * @param options The option definitions
   * @param config The format configuration
   */
  constructor(
    private readonly options: Options,
    config: HelpFormat = {},
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
    this.descStart = Math.max(
      1,
      this.config.indent.descAbsolute
        ? this.config.indent.desc + 1
        : this.paramStart + paramWidth + this.config.indent.desc,
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
    const desc = this.formatDescription(option);
    const entry: HelpEntry = { names, param, desc };
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
    const namesStyle = option.styles?.names ?? this.config.styles.names;
    this.formatNames2(option.names, namesStyle, result);
    return result;
  }

  /**
   * Formats a list of names to be printed on the terminal.
   * @param names The list of option names
   * @param namesStyle The names style
   * @param result The resulting string
   */
  private formatNames2(names: Option['names'], namesStyle: Style, result: TerminalString) {
    const textStyle = this.config.styles.text;
    let prev = false;
    let prefix = 0;
    function formatName(name: string | null, width: number) {
      if (prev && name) {
        result.addSequence(textStyle).addText(',');
      } else if (prefix) {
        prefix++;
      }
      if (prefix) {
        result.addSequence(move(prefix, mv.cuf));
      }
      if (name) {
        result.addSequence(namesStyle).addText(name);
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
    if (this.config.hidden?.param || isNiladic(option)) {
      return result;
    }
    if ('example' in option && option.example !== undefined) {
      this.formatValue(option, option.example, result);
    } else if ('paramName' in option && option.paramName) {
      const paramStyle = option.styles?.param ?? this.config.styles.param;
      const param = option.paramName.includes('<') ? option.paramName : `<${option.paramName}>`;
      result.addSequence(paramStyle).addText(param);
    } else {
      const paramStyle = option.styles?.param ?? this.config.styles.param;
      result.addSequence(paramStyle).addText(`<${option.type}>`);
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
    if (this.config.hidden?.desc) {
      return result;
    }
    const descStyle = option.styles?.desc ?? this.config.styles.desc;
    for (const item of this.config.items) {
      this.format[item](option, descStyle, result);
    }
    return result;
  }

  /**
   * Formats an option's user-provided description to be included in the description.
   * @param values The option definition
   * @param descStyle The description style
   * @param result The resulting string
   */
  private formatDesc(option: Option, descStyle: Style, result: TerminalString) {
    if (option.desc) {
      result.addSequence(descStyle);
      splitWords(option.desc, result);
    }
  }

  /**
   * Formats an option's negation names to be included in the description.
   * @param values The option definition
   * @param descStyle The description style
   * @param result The resulting string
   */
  private formatNegation(option: Option, descStyle: Style, result: TerminalString) {
    if ('negationNames' in option && option.negationNames) {
      result.addSequence(descStyle).addText('Can', 'be', 'negated', 'with');
      const names = option.negationNames.filter((name) => name);
      names.forEach((name, i) => {
        this.formatName(name, result);
        if (i < names.length - 1) {
          result.addSequence(descStyle).addText('or');
        }
      });
      result.addSequence(descStyle).addText('.');
    }
  }

  /**
   * Formats an option's separator string to be included in the description.
   * @param values The option definition
   * @param descStyle The description style
   * @param result The resulting string
   */
  private formatSeparator(option: Option, descStyle: Style, result: TerminalString) {
    if ('separator' in option && option.separator) {
      result.addSequence(descStyle).addText('Values', 'are', 'delimited', 'by');
      if (typeof option.separator === 'string') {
        this.formatString(option.separator, result);
      } else {
        this.formatRegex2(option.separator, result);
      }
      result.addSequence(descStyle).addText('.');
    }
  }

  /**
   * Formats an option's variadic nature to be included in the description.
   * @param values The option definition
   * @param descStyle The description style
   * @param result The resulting string
   */
  private formatVariadic(option: Option, descStyle: Style, result: TerminalString) {
    if (isArray(option) && isVariadic(option)) {
      result.addSequence(descStyle).addText('Accepts', 'multiple', 'parameters.');
    }
  }

  /**
   * Formats an option's positional attribute to be included in the description.
   * @param values The option definition
   * @param descStyle The description style
   * @param result The resulting string
   */
  private formatPositional(option: Option, descStyle: Style, result: TerminalString) {
    if ('positional' in option && option.positional) {
      result.addSequence(descStyle).addText('Accepts', 'positional');
      if (typeof option.positional === 'string') {
        result.addText('parameters', 'preceded', 'by');
        this.formatName(option.positional, result);
        result.addSequence(descStyle).addText('.');
      } else {
        result.addText('parameters.');
      }
    }
  }

  /**
   * Formats an option's append attribute to be included in the description.
   * @param values The option definition
   * @param descStyle The description style
   * @param result The resulting string
   */
  private formatAppend(option: Option, descStyle: Style, result: TerminalString) {
    if ('append' in option && option.append) {
      result.addSequence(descStyle).addText('May', 'be', 'specified', 'multiple', 'times.');
    }
  }

  /**
   * Formats an option's trim normalization to be included in the description.
   * @param values The option definition
   * @param descStyle The description style
   * @param result The resulting string
   */
  private formatTrim(option: Option, descStyle: Style, result: TerminalString) {
    if ('trim' in option && option.trim) {
      result.addSequence(descStyle).addText('Values', 'will', 'be', 'trimmed.');
    }
  }

  /**
   * Formats an option's case normalization to be included in the description.
   * @param values The option definition
   * @param descStyle The description style
   * @param result The resulting string
   */
  private formatCase(option: Option, descStyle: Style, result: TerminalString) {
    if ('case' in option && option.case) {
      result
        .addSequence(descStyle)
        .addText('Values', 'will', 'be', 'converted', 'to', option.case + 'case.');
    }
  }

  /**
   * Formats an option's rounding normalization to be included in the description.
   * @param values The option definition
   * @param descStyle The description style
   * @param result The resulting string
   */
  private formatRound(option: Option, descStyle: Style, result: TerminalString) {
    if ('round' in option && option.round) {
      result.addSequence(descStyle);
      if (option.round === 'trunc') {
        result.addText('Values', 'will', 'be', 'truncated.');
      } else {
        result.addText('Values', 'will', 'be', 'rounded', 'to', 'the', option.round, 'integer.');
      }
    }
  }

  /**
   * Formats an option's enumerated values to be included in the description.
   * @param values The option definition
   * @param descStyle The description style
   * @param result The resulting string
   */
  private formatEnums(option: Option, descStyle: Style, result: TerminalString) {
    if ('enums' in option && option.enums) {
      result.addSequence(descStyle).addText('Values', 'must', 'be', 'one', 'of');
      if (option.type === 'string' || option.type === 'strings') {
        const formatFn = this.formatString.bind(this);
        this.formatArray2(option.enums, descStyle, result, formatFn, ['{', '}']);
      } else {
        const formatFn = this.formatNumber.bind(this);
        this.formatArray2(option.enums, descStyle, result, formatFn, ['{', '}']);
      }
      result.addSequence(descStyle).addText('.');
    }
  }

  /**
   * Formats an option's regex constraint to be included in the description.
   * @param values The option definition
   * @param descStyle The description style
   * @param result The resulting string
   */
  private formatRegex(option: Option, descStyle: Style, result: TerminalString) {
    if ('regex' in option && option.regex) {
      result.addSequence(descStyle).addText('Values', 'must', 'match', 'the', 'regex');
      this.formatRegex2(option.regex, result);
      result.addSequence(descStyle).addText('.');
    }
  }

  /**
   * Formats an option's range constraint to be included in the description.
   * @param values The option definition
   * @param descStyle The description style
   * @param result The resulting string
   */
  private formatRange(option: Option, descStyle: Style, result: TerminalString) {
    if ('range' in option && option.range) {
      result.addSequence(descStyle).addText('Values', 'must', 'be', 'in', 'the', 'range');
      const formatFn = this.formatNumber.bind(this);
      this.formatArray2(option.range, descStyle, result, formatFn, ['[', ']']);
      result.addSequence(descStyle).addText('.');
    }
  }

  /**
   * Formats an option's unique constraint to be included in the description.
   * @param values The option definition
   * @param descStyle The description style
   * @param result The resulting string
   */
  private formatUnique(option: Option, descStyle: Style, result: TerminalString) {
    if ('unique' in option && option.unique) {
      result.addSequence(descStyle).addText('Duplicate', 'values', 'will', 'be', 'removed.');
    }
  }

  /**
   * Formats an option's limit constraint to be included in the description.
   * @param values The option definition
   * @param descStyle The description style
   * @param result The resulting string
   */
  private formatLimit(option: Option, descStyle: Style, result: TerminalString) {
    if ('limit' in option && option.limit !== undefined) {
      result.addSequence(descStyle).addText('Value', 'count', 'is', 'limited', 'to');
      this.formatNumber(option.limit, result);
      result.addSequence(descStyle).addText('.');
    }
  }

  /**
   * Formats an option's requirements to be included in the description.
   * @param values The option definition
   * @param descStyle The description style
   * @param result The resulting string
   */
  private formatRequires(option: Option, descStyle: Style, result: TerminalString) {
    if (option.requires) {
      result.addSequence(descStyle).addText('Requires');
      this.formatRequirements(option.requires, descStyle, result);
      result.addSequence(descStyle).addText('.');
    }
  }

  /**
   * Formats an option's required attribute to be included in the description.
   * @param values The option definition
   * @param descStyle The description style
   * @param result The resulting string
   */
  private formatRequired(option: Option, descStyle: Style, result: TerminalString) {
    if (option.required) {
      result.addSequence(descStyle).addText('Always required.');
    }
  }

  /**
   * Formats an option's default value to be included in the description.
   * @param values The option definition
   * @param descStyle The description style
   * @param result The resulting string
   */
  private formatDefault(option: Option, descStyle: Style, result: TerminalString) {
    if ('default' in option && option.default !== undefined) {
      result.addSequence(descStyle).addText('Defaults', 'to');
      this.formatValue(option, option.default, result, descStyle);
      result.addSequence(descStyle).addText('.');
    }
  }

  /**
   * Formats a deprecation reason to be included in the description.
   * @param values The option definition
   * @param descStyle The description style
   * @param result The resulting string
   */
  private formatDeprecated(option: Option, descStyle: Style, result: TerminalString) {
    if (option.deprecated) {
      result.addSequence(descStyle).addText('Deprecated', 'for');
      splitWords(option.deprecated, result);
    }
  }

  /**
   * Formats a list of values to be printed on the terminal.
   * @param option The option definition
   * @param values The array values
   * @param result The resulting string
   * @param formatFn The function to convert a value to string
   * @param descStyle The description style
   */
  private formatArray<T extends string | number>(
    option: ArrayOption,
    value: Array<T>,
    result: TerminalString,
    formatFn: (value: T, result: TerminalString) => void,
    descStyle?: Style,
  ) {
    if (descStyle) {
      this.formatArray2(value, descStyle, result, formatFn, ['[', ']']);
    } else if ('separator' in option && option.separator) {
      if (typeof option.separator === 'string') {
        this.formatString(value.join(option.separator), result);
      } else {
        this.formatString(value.join(option.separator.source), result);
      }
    } else {
      const textStyle = this.config.styles.text;
      this.formatArray2(value, textStyle, result, formatFn, undefined, ' ');
    }
  }

  /**
   * Formats a list of values to be printed on the terminal.
   * @param values The array values
   * @param descStyle The description style
   * @param result The resulting string
   * @param formatFn The function to convert a value to string
   * @param brackets An optional pair of brackets to surround the values
   * @param separator An optional separator to delimit the values
   */
  private formatArray2<T extends string | number>(
    values: Array<T>,
    descStyle: Style,
    result: TerminalString,
    formatFn: (value: T, result: TerminalString) => void,
    brackets?: [string, string],
    separator = ',',
  ) {
    if (brackets) {
      result.addSequence(descStyle).addText(brackets[0]);
    }
    values.forEach((value, i) => {
      formatFn(value, result);
      if (i < values.length - 1) {
        result.addSequence(descStyle).addText(separator);
      }
    });
    if (brackets) {
      result.addSequence(descStyle).addText(brackets[1]);
    }
  }

  /**
   * Formats a boolean value to be printed on the terminal.
   * @param value The boolean value
   * @param result The resulting string
   */
  private formatBoolean(value: boolean, result: TerminalString) {
    result.addSequence(this.config.styles.boolean).addText(value.toString());
  }

  /**
   * Formats a string value to be printed on the terminal.
   * @param value The string value
   * @param result The resulting string
   */
  private formatString(value: string, result: TerminalString) {
    result.addSequence(this.config.styles.string).addText(`'${value}'`);
  }

  /**
   * Formats a number value to be printed on the terminal.
   * @param value The number value
   * @param result The resulting string
   */
  private formatNumber(value: number, result: TerminalString) {
    result.addSequence(this.config.styles.number).addText(value.toString());
  }

  /**
   * Formats a regex value to be printed on the terminal.
   * @param value The regex value
   * @param result The resulting string
   */
  private formatRegex2(value: RegExp, result: TerminalString) {
    result.addSequence(this.config.styles.regex).addText(String(value));
  }

  /**
   * Formats an option name to be printed on the terminal.
   * @param name The option name
   * @param result The resulting string
   */
  private formatName(name: string, result: TerminalString) {
    result.addSequence(this.config.styles.option).addText(name);
  }

  /**
   * Recursively formats an option's requirements to be included in the description.
   * @param requires The option requirements
   * @param descStyle The description style
   * @param result The resulting string
   * @param negate True if the requirement should be negated
   */
  private formatRequirements(
    requires: Requires,
    descStyle: Style,
    result: TerminalString,
    negate: boolean = false,
  ) {
    if (typeof requires === 'string') {
      const option = this.options[requires];
      const name = option.preferredName ?? option.names.find((name) => name) ?? 'unnamed';
      if (negate) {
        result.addSequence(descStyle).addText('no');
      }
      this.formatName(name, result);
    } else if (requires instanceof RequiresNot) {
      this.formatRequirements(requires.item, descStyle, result, !negate);
    } else if (requires instanceof RequiresAll || requires instanceof RequiresOne) {
      this.formatRequiresExp(requires, descStyle, result, negate);
    } else {
      this.formatRequiresVal(requires, descStyle, result, negate);
    }
  }

  /**
   * Formats a requirement expression to be included in the description.
   * @param requires The requirement expression
   * @param descStyle The description style
   * @param result The resulting string
   * @param negate True if the requirement should be negated
   */
  private formatRequiresExp(
    requires: RequiresAll | RequiresOne,
    descStyle: Style,
    result: TerminalString,
    negate: boolean,
  ) {
    const op = requires instanceof RequiresAll ? (negate ? 'or' : 'and') : negate ? 'and' : 'or';
    if (requires.items.length > 1) {
      result.addSequence(descStyle).addText('(');
    }
    requires.items.forEach((item, i) => {
      this.formatRequirements(item, descStyle, result, negate);
      if (i < requires.items.length - 1) {
        result.addSequence(descStyle).addText(op);
      }
    });
    if (requires.items.length > 1) {
      result.addSequence(descStyle).addText(')');
    }
  }

  /**
   * Formats a map of requirements to be included in the description.
   * @param requires The requirement map
   * @param descStyle The description style
   * @param result The resulting string
   * @param negate True if the requirement should be negated
   */
  private formatRequiresVal(
    requires: RequiresVal,
    descStyle: Style,
    result: TerminalString,
    negate: boolean,
  ) {
    const entries = Object.entries(requires);
    if (entries.length > 1) {
      result.addSequence(descStyle).addText('(');
    }
    entries.forEach(([key, value], i) => {
      this.formatRequiredValue(this.options[key], value, descStyle, result, negate);
      if (i < entries.length - 1) {
        result.addSequence(descStyle).addText('and');
      }
    });
    if (entries.length > 1) {
      result.addSequence(descStyle).addText(')');
    }
  }

  /**
   * Formats an option's required value to be included in the description.
   * @param option The option definition
   * @param value The option value
   * @param descStyle The description style
   * @param result The resulting string
   * @param negate True if the requirement should be negated
   */
  private formatRequiredValue(
    option: Option,
    value: RequiresVal[string],
    descStyle: Style,
    result: TerminalString,
    negate: boolean,
  ) {
    function assert(_condition: unknown): asserts _condition {}
    const name = option.preferredName ?? option.names.find((name) => name) ?? 'unnamed';
    if ((value === null && !negate) || (value === undefined && negate)) {
      result.addSequence(descStyle).addText('no');
    }
    this.formatName(name, result);
    if (value !== null && value !== undefined) {
      assert(!isNiladic(option));
      result.addSequence(descStyle).addText(negate ? '!=' : '=');
      this.formatValue(option, value, result, descStyle);
    }
  }

  /**
   * Formats a value from an option's property.
   * @param option The option definition
   * @param value The option value
   * @param result The resulting string
   * @param descStyle The description style, if in the description
   */
  private formatValue(
    option: ValuedOption,
    value: ValuedOption['default'],
    result: TerminalString,
    descStyle?: Style,
  ) {
    if (value === undefined) {
      return;
    }
    function assert(_condition: unknown): asserts _condition {}
    switch (option.type) {
      case 'flag':
      case 'boolean':
        assert(typeof value === 'boolean');
        this.formatBoolean(value, result);
        break;
      case 'string':
        assert(typeof value === 'string');
        this.formatString(value, result);
        break;
      case 'number':
        assert(typeof value === 'number');
        this.formatNumber(value, result);
        break;
      case 'strings': {
        assert(typeof value === 'object');
        const formatFn = this.formatString.bind(this);
        this.formatArray(option, value as Array<string>, result, formatFn, descStyle);
        break;
      }
      case 'numbers': {
        assert(typeof value === 'object');
        const formatFn = this.formatNumber.bind(this);
        this.formatArray(option, value as Array<number>, result, formatFn, descStyle);
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
    for (const { names, param, desc } of entries) {
      formatCol(names, this.namesStart, this.config.breaks.names);
      formatCol(param, this.paramStart, this.config.breaks.param);
      formatCol(desc, this.descStart, this.config.breaks.desc, true);
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
 * Merges a user-provided format configuration with the default configuration.
 * @param config The user configuration, which may override default settings
 * @returns The merged configuration
 */
function mergeConfig(config: HelpFormat): ConcreteFormat {
  return {
    indent: Object.assign({}, defaultConfig.indent, config.indent),
    breaks: Object.assign({}, defaultConfig.breaks, config.breaks),
    styles: Object.assign({}, defaultConfig.styles, config.styles),
    hidden: Object.assign({}, defaultConfig.hidden, config.hidden),
    items: config.items ?? defaultConfig.items,
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
 * Split a text into words and style sequences.
 * @param text The text to be split
 * @param result The resulting string to append to
 */
function splitWords(text: string, result: TerminalString) {
  const regex = {
    para: /(?:[ \t]*\r?\n){2,}/,
    item: /\r?\n[ \t]*(-|\*|\d+\.) /,
    word: /\s+/,
    // eslint-disable-next-line no-control-regex
    style: /((?:\x9b[\d;]+m)+)/,
    itemBegin: /^(-|\*|\d+\.) /,
    punctEnd: /[.,:;!?]$/,
  };
  const paragraphs = text.split(regex.para);
  paragraphs.forEach((para, i) => {
    para.split(regex.item).forEach((item, j) => {
      if (j % 2 == 0) {
        item = item.trim();
        if (item) {
          if (j == 0 && !item.match(regex.itemBegin) && !item.match(regex.punctEnd)) {
            item += '.';
          }
          const words = item.split(regex.word);
          if (item.includes('\x9b')) {
            for (const word of words) {
              for (const str of word.split(regex.style)) {
                if (isStyle(str)) {
                  result.addSequence(str);
                } else if (str) {
                  result.addText(str);
                }
              }
            }
          } else {
            result.addText(...words);
          }
        }
      } else {
        result.addText('\n', item);
      }
    });
    if (i < paragraphs.length - 1) {
      result.addText('\n\n');
    }
  });
}

/**
 * Wraps an option's description to fit in the terminal width.
 * @param result The resulting strings to append to
 * @param text The terminal string to be wrapped
 * @param width The desired terminal width
 * @param start The column number to start each line at
 */
function wrapText(result: Array<string>, text: TerminalString, width: number, start: number) {
  const startStyle = text.strings.length && isStyle(text.strings[0]) ? text.strings[0] : '';
  let moveToStart = '';
  if (width >= start + text.maxTextLen) {
    width -= start;
    moveToStart = move(start, mv.cha);
    result.push(moveToStart);
  } else {
    result.push('\n');
  }
  moveToStart += startStyle;
  const punctuation = /^[.,:;!?](?!=)/;
  const closingBrackets = /^[)\]}]/;
  const openingBrackets = /^[{[(]/;
  let merge = false;
  let lineLength = 0;
  let currentLen = 0;
  let currentWord = '';
  let currentStyle = '';
  let nextStyle = '';
  let lastStyle = '';
  function addWord() {
    if (!currentLen) {
      return;
    }
    const space = lineLength ? ' ' : '';
    if (lineLength + space.length + currentLen <= width) {
      result.push(space + currentWord);
      lineLength += space.length + currentLen;
    } else {
      result.push('\n', moveToStart, lastStyle, currentWord);
      lineLength = currentLen;
    }
    if (currentStyle) {
      lastStyle = currentStyle != startStyle ? currentStyle : '';
      currentStyle = '';
    }
  }
  for (const word of text.strings) {
    if (!word) {
      continue;
    }
    if (isStyle(word)) {
      nextStyle = word;
      continue;
    }
    if (word.startsWith('\n')) {
      addWord();
      result.push(word, moveToStart, lastStyle);
      lineLength = 0;
      currentWord = '';
      currentLen = 0;
      continue;
    }
    if (merge || word.match(punctuation) || word.match(closingBrackets)) {
      currentWord += nextStyle + word;
      currentLen += word.length;
      merge = false;
    } else {
      addWord();
      currentWord = nextStyle + word;
      currentLen = word.length;
      merge = word.match(openingBrackets) !== null;
    }
    if (nextStyle) {
      currentStyle = nextStyle;
      nextStyle = '';
    }
  }
  addWord();
}
