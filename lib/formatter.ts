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

import { RequiresAll, RequiresNot, RequiresOne, isArray, isNiladic } from './options';
import { fg, isStyle, style, TerminalString, tf } from './styles';

export { HelpFormatter, HelpItem, type HelpFormat };

//--------------------------------------------------------------------------------------------------
// Types
//--------------------------------------------------------------------------------------------------
/**
 * Precomputed texts.
 */
type HelpEntry = {
  readonly names: TerminalString;
  readonly param: TerminalString;
  readonly desc: TerminalString;
};

/**
 * Precomputed indentation.
 */
type HelpIndent = {
  readonly names: string;
  readonly param: string;
  readonly desc: string;
  readonly wrap: string;
};

/**
 * A concrete version of the help format.
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
     * The indentation level for the names column, relative to the beginning of the line.
     */
    readonly names?: number;
    /**
     * The indentation level for the parameter column, relative to the end of the names column.
     */
    readonly param?: number;
    /**
     * The indentation level for the description column, relative to the end of the parameter column.
     */
    readonly desc?: number;
    /**
     * True if the indentation level for the parameter column should be relative to the beginning
     * of the line.
     */
    readonly paramAbsolute?: boolean;
    /**
     * True if the indentation level for the description column should be relative to the beginning
     * of the line.
     */
    readonly descAbsolute?: boolean;
  };

  /**
   * The number of line breaks to insert before each column.
   */
  readonly breaks?: {
    /**
     * The number of line breaks to insert before the names column.
     */
    readonly names?: number;
    /**
     * The number of line breaks to insert before the parameter column.
     */
    readonly param?: number;
    /**
     * The number of line breaks to insert before the description column.
     */
    readonly desc?: number;
  };

  /**
   * Select individual columns that should not be displayed.
   */
  readonly hidden?: {
    /**
     * Hide the names column.
     */
    readonly names?: boolean;
    /**
     * Hide the parameter column.
     */
    readonly param?: boolean;
    /**
     * Hide the description column.
     */
    readonly desc?: boolean;
  };

  /**
   * The default option styles and the styles of other elements.
   */
  readonly styles?: OptionStyles & OtherStyles;

  /**
   * The order of items to be shown in the option description.
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
  desc,
  negation,
  separator,
  multivalued,
  positional,
  append,
  trim,
  case,
  round,
  enums,
  regex,
  range,
  unique,
  limit,
  requires,
  required,
  default,
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
    whitespace: style(tf.clear),
  },
  items: [
    HelpItem.desc,
    HelpItem.negation,
    HelpItem.separator,
    HelpItem.multivalued,
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
 * Implements formatting of help messages for predefined options.
 */
class HelpFormatter {
  private readonly groups = new Map<string, Array<HelpEntry>>();
  private readonly nameWidths = new Array<number>();
  private readonly namesWidth: number = 0;
  private readonly paramWidth: number = 0;
  private readonly config: ConcreteFormat;
  private readonly indent: HelpIndent;

  /**
   * Keep this in-sync with {@link HelpItem}.
   */
  private readonly format: Array<typeof this.formatDesc> = [
    this.formatDesc.bind(this),
    this.formatNegation.bind(this),
    this.formatSeparator.bind(this),
    this.formatMultivalued.bind(this),
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
    this.config = HelpFormatter.mergeConfig(config);
    this.nameWidths = this.getNameWidths();
    for (const key in options) {
      const option = options[key];
      if (!option.hide) {
        const entry = this.formatOption(option);
        this.namesWidth = Math.max(this.namesWidth, entry.names.length);
        this.paramWidth = Math.max(this.paramWidth, entry.param.length);
      }
    }
    this.indent = this.getIndent();
  }

  /**
   * Merges a user-provided format configuration with the default configuration.
   * @param config The user configuration, which may override default settings
   * @returns The merged configuration
   */
  private static mergeConfig(config: HelpFormat): ConcreteFormat {
    return {
      indent: Object.assign({}, defaultConfig.indent, config.indent),
      breaks: Object.assign({}, defaultConfig.breaks, config.breaks),
      styles: Object.assign({}, defaultConfig.styles, config.styles),
      hidden: Object.assign({}, defaultConfig.hidden, config.hidden),
      items: config.items ?? defaultConfig.items,
    };
  }

  /**
   * @returns The precomputed indentation strings
   */
  private getIndent(): HelpIndent {
    const namesIndent = this.config.indent.names;
    const paramIndent = this.config.indent.paramAbsolute
      ? this.config.indent.param - (namesIndent + this.namesWidth)
      : this.config.indent.param;
    const descIndent = this.config.indent.descAbsolute
      ? this.config.indent.desc - (namesIndent + this.namesWidth + paramIndent + this.paramWidth)
      : this.config.indent.desc;
    const indent = {
      names: ' '.repeat(Math.max(0, namesIndent)),
      param: ' '.repeat(Math.max(0, paramIndent)),
      desc: ' '.repeat(Math.max(0, descIndent)),
    };
    const breaks = {
      names: '\n'.repeat(Math.max(0, this.config.breaks.names)),
      param: '\n'.repeat(Math.max(0, this.config.breaks.param)),
      desc: '\n'.repeat(Math.max(0, this.config.breaks.desc)),
    };
    const paramStart = namesIndent + this.namesWidth + paramIndent;
    const descStart = paramStart + this.paramWidth + descIndent;
    const paramBlank = this.config.indent.paramAbsolute ? this.config.indent.param : paramStart;
    const descBlank = this.config.indent.descAbsolute ? this.config.indent.desc : descStart;
    const blanks = {
      param: ' '.repeat(Math.max(0, paramBlank)),
      desc: ' '.repeat(Math.max(0, descBlank)),
    };
    return {
      names: breaks.names + indent.names,
      param: breaks.param ? breaks.param + blanks.param : indent.param,
      desc: breaks.desc ? breaks.desc + blanks.desc : indent.desc,
      wrap: blanks.desc,
    };
  }

  /**
   * @returns The maximum length of each name slot
   */
  private getNameWidths(): Array<number> {
    const result = new Array<number>();
    for (const key in this.options) {
      const option = this.options[key];
      option.names.forEach((name, i) => {
        if (i == result.length) {
          result.push(name?.length ?? 0);
        } else if (name && name.length > result[i]) {
          result[i] = name.length;
        }
      });
    }
    return result;
  }

  /**
   * Formats an option to be printed on the console.
   * @param option The option definition
   * @returns The help entry
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
   * Formats an option's names to be printed on the console.
   * @param option The option definition
   * @returns A styled string with the formatted names
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
   * Formats a list of names to be printed on the console.
   * @param names The list of names
   * @param namesStyle The names style
   * @param result The resulting string
   */
  private formatNames2(names: Array<string | null>, namesStyle: Style, result: TerminalString) {
    const whitespaceStyle = this.config.styles.whitespace;
    let sep = '';
    let prefix = '';
    function formatName(name: string | null, width: number) {
      if (sep || prefix) {
        result.addSequence(whitespaceStyle).addText((name ? sep : '  ') + prefix);
      }
      if (name) {
        result.addSequence(namesStyle).addText(name);
        sep = ', ';
      } else {
        sep = '  ';
      }
      prefix = ' '.repeat(width - (name?.length ?? 0));
    }
    names.forEach((name, i) => formatName(name, this.nameWidths[i]));
  }

  /**
   * Formats an option's parameter to be printed on the console.
   * @param option The option definition
   * @returns A styled string with the formatted option parameter
   */
  private formatParam(option: Option): TerminalString {
    const result = new TerminalString();
    if (this.config.hidden?.param || isNiladic(option)) {
      return result;
    }
    if (option.example !== undefined) {
      this.formatValue(option, option.example, result);
    } else {
      const paramStyle = option.styles?.param ?? this.config.styles.param;
      const param = option.paramName
        ? option.paramName.includes('<')
          ? option.paramName
          : `<${option.paramName}>`
        : `<${option.type}>`;
      result.addSequence(paramStyle).addText(param);
    }
    return result;
  }

  /**
   * Formats an option's description to be printed on the console.
   * @param option The option definition
   * @returns A styled string with the formatted option description
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
      result.addSequence(descStyle).addOther(splitWords(option.desc));
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
      const names = option.negationNames;
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
      this.formatString(option.separator, result);
      result.addSequence(descStyle).addText('.');
    }
  }

  /**
   * Formats an option's multivalued nature to be included in the description.
   * @param values The option definition
   * @param descStyle The description style
   * @param result The resulting string
   */
  private formatMultivalued(option: Option, descStyle: Style, result: TerminalString) {
    if (isArray(option) && !option.separator) {
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
        this.formatArray(option.enums, descStyle, result, formatFn, ['{', '}']);
      } else {
        const formatFn = this.formatNumber.bind(this);
        this.formatArray(option.enums, descStyle, result, formatFn, ['{', '}']);
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
      this.formatArray(option.range, descStyle, result, formatFn, ['[', ']']);
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
      this.formatRequiresRecursive(option.requires, descStyle, result);
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
      result.addOther(splitWords(option.deprecated));
    }
  }

  /**
   * Formats a list of values to be printed on the console.
   * @param option The option definition
   * @param values The array values
   * @param descStyle The description style
   * @param result The resulting string
   */
  private formatArrayVal<T extends string | number>(
    option: ArrayOption,
    value: Array<T>,
    result: TerminalString,
    formatFn: (value: T, result: TerminalString) => void,
    descStyle?: Style,
  ) {
    if (descStyle) {
      this.formatArray(value, descStyle, result, formatFn, ['[', ']']);
    } else if (option.separator) {
      this.formatString(value.join(option.separator), result);
    } else {
      const style = this.config.styles.whitespace;
      this.formatArray(value, style, result, formatFn, undefined, ' ');
    }
  }

  /**
   * Formats a list of values to be included in the description.
   * @param values The array values
   * @param descStyle The description style
   * @param result The resulting string
   */
  private formatArray<T extends string | number>(
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
   * Formats a boolean value to be printed on the console.
   * @param values The boolean value
   * @param result The resulting string
   */
  private formatBoolean(value: boolean, result: TerminalString) {
    result.addSequence(this.config.styles.boolean).addText(value.toString());
  }

  /**
   * Formats a string value to be printed on the console.
   * @param values The string value
   * @param result The resulting string
   */
  private formatString(value: string, result: TerminalString) {
    result.addSequence(this.config.styles.string).addText(`'${value}'`);
  }

  /**
   * Formats a number value to be printed on the console.
   * @param values The number value
   * @param result The resulting string
   */
  private formatNumber(value: number, result: TerminalString) {
    result.addSequence(this.config.styles.number).addText(value.toString());
  }

  /**
   * Formats a regex value to be printed on the console.
   * @param values The regex value
   * @param result The resulting string
   */
  private formatRegex2(value: RegExp, result: TerminalString) {
    result.addSequence(this.config.styles.regex).addText(String(value));
  }

  /**
   * Formats an option name to be printed on the console.
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
  private formatRequiresRecursive(
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
      this.formatRequiresRecursive(requires.item, descStyle, result, !negate);
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
      this.formatRequiresRecursive(item, descStyle, result, negate);
      if (i < requires.items.length - 1) {
        result.addSequence(descStyle).addText(op);
      }
    });
    if (requires.items.length > 1) {
      result.addSequence(descStyle).addText(')');
    }
  }

  /**
   * Formats a map of key-value pairs to be included in the description.
   * @param requires The requirement expression
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
   * Formats a map of key-value pairs to be included in the description.
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
        this.formatArrayVal(option, value as Array<string>, result, formatFn, descStyle);
        break;
      }
      case 'numbers': {
        assert(typeof value === 'object');
        const formatFn = this.formatNumber.bind(this);
        this.formatArrayVal(option, value as Array<number>, result, formatFn, descStyle);
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
   * @param width The desired console width
   * @returns The formatted help message
   */
  formatHelp(width = process.stdout.columns ?? process.stderr.columns): string {
    const entries = this.groups.get('');
    return entries ? this.formatEntries(width, entries) : '';
  }

  /**
   * Formats help messages for all option groups.
   * @param width The desired console width
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
   * @param width The desired console width
   * @returns The formatted help message
   */
  private formatEntries(width: number, entries: Array<HelpEntry>): string {
    function formatCol(line: TerminalString, indent: string, str: TerminalString, width: number) {
      line.addText(indent).addOther(str);
      line.addSequence(whitespaceStyle).addText(' '.repeat(width - str.length));
    }
    const whitespaceStyle = this.config.styles.whitespace;
    const lines = new Array<string>();
    for (const entry of entries) {
      const line = new TerminalString().addSequence(whitespaceStyle);
      formatCol(line, this.indent.names, entry.names, this.namesWidth);
      formatCol(line, this.indent.param, entry.param, this.paramWidth);
      line.addText(this.indent.desc);
      wrapText(lines, entry.desc, width, line.string, this.indent.wrap, whitespaceStyle);
    }
    return lines.join('\n');
  }
}

//--------------------------------------------------------------------------------------------------
// Functions
//--------------------------------------------------------------------------------------------------
function splitWords(text: string): TerminalString {
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
  return paragraphs.reduce((acc, para, i) => {
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
                  acc.addSequence(str);
                } else if (str) {
                  acc.addText(str);
                }
              }
            }
          } else {
            acc.addText(...words);
          }
        }
      } else {
        acc.addText('\n', item);
      }
    });
    if (i < paragraphs.length - 1) {
      acc.addText('\n\n');
    }
    return acc;
  }, new TerminalString());
}

/**
 * Wraps the option description to fit in the console.
 * @param lines The resulting lines to append to
 * @param text The text to be wrapped (styled string)
 * @param width The desired console width
 * @param prefix The prefix at the start of the first line
 * @param indent The indentation at the start of each wrapped line
 * @param whitespaceStyle The style for whitespace
 */
function wrapText(
  lines: Array<string>,
  text: TerminalString,
  width: number,
  prefix: string,
  indent: string,
  whitespaceStyle: Style,
) {
  const firstStyle = text.strings.length && isStyle(text.strings[0]) ? text.strings[0] : '';
  const descStyle = firstStyle != whitespaceStyle ? firstStyle : '';
  if (width >= indent.length + text.maxTextLen) {
    width -= indent.length;
    indent = whitespaceStyle + indent;
  } else {
    prefix += '\n';
    indent = '';
  }
  const punctuation = /^[.,:;!?](?!=)/;
  const closingBrackets = /^[)\]}]/;
  const openingBrackets = /^[{[(]/;
  let line = [prefix];
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
      line.push(space + currentWord);
      lineLength += space.length + currentLen;
    } else {
      lines.push(line.join(''));
      line = [indent, lastStyle, currentWord];
      lineLength = currentLen;
    }
    if (currentStyle) {
      lastStyle = descStyle;
      if ((descStyle && currentStyle != descStyle) || currentStyle != whitespaceStyle) {
        lastStyle += currentStyle;
      }
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
      lines.push(line.join(''));
      if (word == '\n\n') {
        lines.push('');
      }
      line = [indent, lastStyle];
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
  lines.push(line.join(''));
}
