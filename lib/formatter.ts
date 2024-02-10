//--------------------------------------------------------------------------------------------------
// Imports and Exports
//--------------------------------------------------------------------------------------------------
import type {
  Option,
  Options,
  Requires,
  OptionStyles,
  ValuedOption,
  ArrayOption,
} from './options.js';
import type { Style } from './styles.js';

import { isArray, isNiladic } from './options.js';
import { fg, isStyle, StyledString, styleToString } from './styles.js';

export type { HelpConfig };
export { HelpFormatter, HelpItem, defaultConfig };

//--------------------------------------------------------------------------------------------------
// Types
//--------------------------------------------------------------------------------------------------
/**
 * Precomputed texts.
 */
type HelpEntry = {
  readonly names: StyledString;
  readonly param: StyledString;
  readonly desc: StyledString;
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
 * Precomputed styles.
 */
type HelpStyles = {
  readonly names: string;
  readonly param: string;
  readonly desc: string;
  readonly regex: string;
  readonly boolean: string;
  readonly string: string;
  readonly number: string;
  readonly option: string;
  readonly whitespace: string;
};

/**
 * Help format configuration.
 */
type HelpConfig = {
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
     * The indentation level for the parameter column, relative to the beginning of the line.
     */
    readonly paramAbsolute?: number;
    /**
     * The indentation level for the description column, relative to the beginning of the line.
     */
    readonly descAbsolute?: number;
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
  readonly styles?: OptionStyles & {
    /**
     * The style of regular expressions.
     */
    readonly regex?: Style;
    /**
     * The style of booleans.
     */
    readonly boolean?: Style;
    /**
     * The style of strings.
     */
    readonly string?: Style;
    /**
     * The style of numbers.
     */
    readonly number?: Style;
    /**
     * The style of option names
     */
    readonly option?: Style;
    /**
     * The style of whitespace.
     */
    readonly whitespace?: Style;
  };

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
  desc = 'desc',
  negation = 'negation',
  separator = 'separator',
  multivalued = 'multivalued',
  positional = 'positional',
  append = 'append',
  trim = 'trim',
  case = 'case',
  round = 'round',
  enums = 'enums',
  regex = 'regex',
  range = 'range',
  unique = 'unique',
  limit = 'limit',
  requires = 'requires',
  required = 'required',
  default = 'default',
  deprecated = 'deprecated',
}

/**
 * The default configuration used by the formatter.
 */
const defaultConfig: HelpConfig = {
  indent: {
    names: 2,
    param: 2,
    desc: 2,
  },
  breaks: {
    names: 0,
    param: 0,
    desc: 0,
  },
  styles: {
    names: { clear: true },
    param: { clear: true, fg: fg.brightBlack },
    desc: { clear: true },
    regex: { fg: fg.red },
    boolean: { fg: fg.yellow },
    string: { fg: fg.green },
    number: { fg: fg.yellow },
    option: { fg: fg.magenta },
    whitespace: { clear: true },
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
  private readonly config: HelpConfig;
  private readonly indent: HelpIndent;
  private readonly styles: HelpStyles;

  /**
   * Creates a help message formatter.
   * @param options The option definitions
   * @param config The format configuration
   */
  constructor(
    private readonly options: Options,
    config: HelpConfig = {},
  ) {
    this.config = HelpFormatter.mergeConfigs(defaultConfig, config);
    this.styles = this.getStyles();
    this.nameWidths = this.getNameWidths();
    for (const key in options) {
      const option = options[key];
      if (option.hide) {
        continue;
      }
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
      this.namesWidth = Math.max(this.namesWidth, names.length);
      this.paramWidth = Math.max(this.paramWidth, param.length);
    }
    this.indent = this.getIndent();
  }

  /**
   * Merges two format configurations.
   * @param configA The first configuration
   * @param configB The second configuration, which may override settings from the first
   * @returns The merged configuration
   */
  private static mergeConfigs(configA: HelpConfig, configB: HelpConfig): HelpConfig {
    return {
      indent: Object.assign({}, configA.indent, configB.indent),
      breaks: Object.assign({}, configA.breaks, configB.breaks),
      styles: Object.assign({}, configA.styles, configB.styles),
      hidden: Object.assign({}, configA.hidden, configB.hidden),
      items: configB.items ?? configA.items,
    };
  }

  /**
   * @returns The precomputed style strings
   */
  private getStyles(): HelpStyles {
    return {
      names: styleToString(this.config.styles?.names),
      param: styleToString(this.config.styles?.param),
      desc: styleToString(this.config.styles?.desc),
      regex: styleToString(this.config.styles?.regex),
      boolean: styleToString(this.config.styles?.boolean),
      string: styleToString(this.config.styles?.string),
      number: styleToString(this.config.styles?.number),
      option: styleToString(this.config.styles?.option),
      whitespace: styleToString(this.config.styles?.whitespace),
    };
  }

  /**
   * @returns The precomputed indentation strings
   */
  private getIndent(): HelpIndent {
    const namesIndent = this.config.indent!.names!;
    const paramIndent = this.config.indent!.paramAbsolute
      ? this.config.indent!.paramAbsolute - (namesIndent + this.namesWidth)
      : this.config.indent!.param!;
    const descIndent = this.config.indent!.descAbsolute
      ? this.config.indent!.descAbsolute -
        (namesIndent + this.namesWidth + paramIndent + this.paramWidth)
      : this.config.indent!.desc!;
    const indent = {
      names: ' '.repeat(Math.max(0, namesIndent)),
      param: ' '.repeat(Math.max(0, paramIndent)),
      desc: ' '.repeat(Math.max(0, descIndent)),
    };
    const breaks = {
      names: '\n'.repeat(Math.max(0, this.config.breaks!.names!)),
      param: '\n'.repeat(Math.max(0, this.config.breaks!.param!)),
      desc: '\n'.repeat(Math.max(0, this.config.breaks!.desc!)),
    };
    const paramStart = namesIndent + this.namesWidth + paramIndent;
    const descStart = paramStart + this.paramWidth + descIndent;
    const paramBlank = this.config.indent!.paramAbsolute ?? paramStart;
    const descBlank = this.config.indent!.descAbsolute ?? descStart;
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
          result.push(name.length);
        } else if (name.length > result[i]) {
          result[i] = name.length;
        }
      });
    }
    return result;
  }

  /**
   * Formats an option's names to be printed on the console.
   * @param option The option definition
   * @returns A styled string with the formatted names
   */
  private formatNames(option: Option): StyledString {
    const result = new StyledString();
    if (this.config.hidden?.names) {
      return result;
    }
    const namesStyle = option.styles?.names
      ? styleToString(option.styles?.names)
      : this.styles.names;
    this.formatNames2(option.names, namesStyle, result);
    return result;
  }

  /**
   * Formats a list of names to be printed on the console.
   * @param names The list of names
   * @param namesStyle The names style
   * @param result The resulting string
   */
  private formatNames2(names: Array<string>, namesStyle: string, result: StyledString) {
    const whitespaceStyle = this.styles.whitespace;
    let sep = '';
    let prefix = '';
    function formatName(name: string, width: number) {
      if (sep || prefix) {
        result.style(whitespaceStyle).append((name ? sep : '  ') + prefix);
      }
      if (name) {
        result.style(namesStyle).append(name);
        sep = ', ';
      } else {
        sep = '  ';
      }
      prefix = ' '.repeat(width - name.length);
    }
    names.forEach((name, i) => formatName(name, this.nameWidths[i]));
  }

  /**
   * Formats an option's parameter to be printed on the console.
   * @param option The option definition
   * @returns A styled string with the formatted option parameter
   */
  private formatParam(option: Option): StyledString {
    const result = new StyledString();
    if (this.config.hidden?.param || isNiladic(option)) {
      return result;
    }
    if (option.example !== undefined) {
      this.formatValue(option, 'example', result);
    } else {
      const paramStyle = option.styles?.param
        ? styleToString(option.styles?.param)
        : this.styles.param;
      const param = option.paramName
        ? option.paramName.includes('<')
          ? option.paramName
          : `<${option.paramName}>`
        : `<${option.type}>`;
      result.style(paramStyle).append(param);
    }
    return result;
  }

  /**
   * Formats an option's description to be printed on the console.
   * @param option The option definition
   * @returns A styled string with the formatted option description
   */
  private formatDescription(option: Option): StyledString {
    const result = new StyledString();
    if (this.config.hidden?.desc || !this.config.items) {
      return result;
    }
    const descStyle = option.styles?.desc ? styleToString(option.styles?.desc) : this.styles.desc;
    for (const item of this.config.items) {
      switch (item) {
        case HelpItem.desc:
          this.formatDesc(option, descStyle, result);
          break;
        case HelpItem.negation:
          this.formatNegation(option, descStyle, result);
          break;
        case HelpItem.separator:
          this.formatSeparator(option, descStyle, result);
          break;
        case HelpItem.multivalued:
          this.formatMultivalued(option, descStyle, result);
          break;
        case HelpItem.positional:
          this.formatPositional(option, descStyle, result);
          break;
        case HelpItem.append:
          this.formatAppend(option, descStyle, result);
          break;
        case HelpItem.trim:
          this.formatTrim(option, descStyle, result);
          break;
        case HelpItem.case:
          this.formatCase(option, descStyle, result);
          break;
        case HelpItem.round:
          this.formatRound(option, descStyle, result);
          break;
        case HelpItem.enums:
          this.formatEnums(option, descStyle, result);
          break;
        case HelpItem.regex:
          this.formatRegex(option, descStyle, result);
          break;
        case HelpItem.range:
          this.formatRange(option, descStyle, result);
          break;
        case HelpItem.unique:
          this.formatUnique(option, descStyle, result);
          break;
        case HelpItem.limit:
          this.formatLimit(option, descStyle, result);
          break;
        case HelpItem.requires:
          this.formatRequires(option, descStyle, result);
          break;
        case HelpItem.required:
          this.formatRequired(option, descStyle, result);
          break;
        case HelpItem.default:
          this.formatDefault(option, descStyle, result);
          break;
        case HelpItem.deprecated:
          this.formatDeprecated(option, descStyle, result);
          break;
        default: {
          const _exhaustiveCheck: never = item;
          return _exhaustiveCheck;
        }
      }
    }
    return result;
  }

  /**
   * Formats an option's user-provided description to be included in the description.
   * @param values The option definition
   * @param descStyle The description style
   * @param result The resulting string
   */
  private formatDesc(option: Option, descStyle: string, result: StyledString) {
    if (option.desc) {
      const words = option.desc.split(' ');
      if (!words.at(-1)!.endsWith('.')) {
        words[words.length - 1] += '.';
      }
      result.style(descStyle).append(...words);
    }
  }

  /**
   * Formats an option's negation names to be included in the description.
   * @param values The option definition
   * @param descStyle The description style
   * @param result The resulting string
   */
  private formatNegation(option: Option, descStyle: string, result: StyledString) {
    if ('negationNames' in option && option.negationNames) {
      result.style(descStyle).append('Can', 'be', 'negated', 'with');
      const names = option.negationNames;
      names.forEach((name, i) => {
        result.style(this.styles.option).append(name);
        if (i < names.length - 1) {
          result.style(descStyle).append('or');
        }
      });
      result.style(descStyle).append('.');
    }
  }

  /**
   * Formats an option's separator string to be included in the description.
   * @param values The option definition
   * @param descStyle The description style
   * @param result The resulting string
   */
  private formatSeparator(option: Option, descStyle: string, result: StyledString) {
    if ('separator' in option && option.separator) {
      result.style(descStyle).append('Values', 'are', 'delimited', 'by');
      result.style(this.styles.string).append(`'${option.separator}'`);
      result.style(descStyle).append('.');
    }
  }

  /**
   * Formats an option's multivalued nature to be included in the description.
   * @param values The option definition
   * @param descStyle The description style
   * @param result The resulting string
   */
  private formatMultivalued(option: Option, descStyle: string, result: StyledString) {
    if (isArray(option) && !option.separator) {
      result.style(descStyle).append('Accepts', 'multiple', 'parameters.');
    }
  }

  /**
   * Formats an option's positional attribute to be included in the description.
   * @param values The option definition
   * @param descStyle The description style
   * @param result The resulting string
   */
  private formatPositional(option: Option, descStyle: string, result: StyledString) {
    if ('positional' in option && option.positional) {
      result.style(descStyle).append('Accepts', 'positional', 'parameters.');
    }
  }

  /**
   * Formats an option's append attribute to be included in the description.
   * @param values The option definition
   * @param descStyle The description style
   * @param result The resulting string
   */
  private formatAppend(option: Option, descStyle: string, result: StyledString) {
    if ('append' in option && option.append) {
      result.style(descStyle).append('May', 'be', 'specified', 'multiple', 'times.');
    }
  }

  /**
   * Formats an option's trim normalization to be included in the description.
   * @param values The option definition
   * @param descStyle The description style
   * @param result The resulting string
   */
  private formatTrim(option: Option, descStyle: string, result: StyledString) {
    if ('trim' in option && option.trim) {
      result.style(descStyle).append('Values', 'will', 'be', 'trimmed.');
    }
  }

  /**
   * Formats an option's case normalization to be included in the description.
   * @param values The option definition
   * @param descStyle The description style
   * @param result The resulting string
   */
  private formatCase(option: Option, descStyle: string, result: StyledString) {
    if ('case' in option && option.case) {
      result
        .style(descStyle)
        .append('Values', 'will', 'be', 'converted', 'to', option.case + 'case.');
    }
  }

  /**
   * Formats an option's rounding normalization to be included in the description.
   * @param values The option definition
   * @param descStyle The description style
   * @param result The resulting string
   */
  private formatRound(option: Option, descStyle: string, result: StyledString) {
    if ('round' in option && option.round) {
      result.style(descStyle);
      if (option.round === 'trunc') {
        result.append('Values', 'will', 'be', 'truncated.');
      } else {
        result.append('Values', 'will', 'be', 'rounded', 'to', 'the', option.round, 'integer.');
      }
    }
  }

  /**
   * Formats an option's enumerated values to be included in the description.
   * @param values The option definition
   * @param descStyle The description style
   * @param result The resulting string
   */
  private formatEnums(option: Option, descStyle: string, result: StyledString) {
    if ('enums' in option && option.enums) {
      result.style(descStyle).append('Values', 'must', 'be', 'one', 'of', '{');
      if (option.type === 'string' || option.type === 'strings') {
        this.formatStrings(option.enums, descStyle, result);
      } else {
        this.formatNumbers(option.enums, descStyle, result);
      }
      result.style(descStyle).append('}.');
    }
  }

  /**
   * Formats an option's regex constraint to be included in the description.
   * @param values The option definition
   * @param descStyle The description style
   * @param result The resulting string
   */
  private formatRegex(option: Option, descStyle: string, result: StyledString) {
    if ('regex' in option && option.regex) {
      result.style(descStyle).append('Values', 'must', 'match', 'the', 'regex');
      result.style(this.styles.regex).append(String(option.regex));
      result.style(descStyle).append('.');
    }
  }

  /**
   * Formats an option's range constraint to be included in the description.
   * @param values The option definition
   * @param descStyle The description style
   * @param result The resulting string
   */
  private formatRange(option: Option, descStyle: string, result: StyledString) {
    if ('range' in option && option.range) {
      result.style(descStyle).append('Values', 'must', 'be', 'in', 'the', 'range', '[');
      this.formatNumbers(option.range, descStyle, result);
      result.style(descStyle).append('].');
    }
  }

  /**
   * Formats an option's unique constraint to be included in the description.
   * @param values The option definition
   * @param descStyle The description style
   * @param result The resulting string
   */
  private formatUnique(option: Option, descStyle: string, result: StyledString) {
    if ('unique' in option && option.unique) {
      result.style(descStyle).append('Duplicate', 'values', 'will', 'be', 'removed.');
    }
  }

  /**
   * Formats an option's limit constraint to be included in the description.
   * @param values The option definition
   * @param descStyle The description style
   * @param result The resulting string
   */
  private formatLimit(option: Option, descStyle: string, result: StyledString) {
    if ('limit' in option && option.limit !== undefined) {
      result.style(descStyle).append('Value', 'count', 'is', 'limited', 'to');
      result.style(this.styles.number).append(`${option.limit}`);
      result.style(descStyle).append('.');
    }
  }

  /**
   * Formats an option's requirements to be included in the description.
   * @param values The option definition
   * @param descStyle The description style
   * @param result The resulting string
   */
  private formatRequires(option: Option, descStyle: string, result: StyledString) {
    if (option.requires) {
      result.style(descStyle).append('Requires');
      this.formatRequiresRecursive(option.requires, descStyle, result);
      result.style(descStyle).append('.');
    }
  }

  /**
   * Formats an option's required attribute to be included in the description.
   * @param values The option definition
   * @param descStyle The description style
   * @param result The resulting string
   */
  private formatRequired(option: Option, descStyle: string, result: StyledString) {
    if (option.required) {
      result.style(descStyle).append('Always required.');
    }
  }

  /**
   * Formats an option's default value to be included in the description.
   * @param values The option definition
   * @param descStyle The description style
   * @param result The resulting string
   */
  private formatDefault(option: Option, descStyle: string, result: StyledString) {
    if ('default' in option && option.default !== undefined) {
      result.style(descStyle).append('Defaults', 'to');
      this.formatValue(option, 'default', result);
      result.style(descStyle).append('.');
    }
  }

  /**
   * Formats a deprecation reason to be included in the description.
   * @param values The option definition
   * @param descStyle The description style
   * @param result The resulting string
   */
  private formatDeprecated(option: Option, descStyle: string, result: StyledString) {
    if (option.deprecated) {
      const words = option.deprecated.split(' ');
      if (!words.at(-1)!.endsWith('.')) {
        words[words.length - 1] += '.';
      }
      result.style(descStyle).append('Deprecated', 'for', ...words);
    }
  }

  /**
   * Formats a list of strings to be included in the description.
   * @param values The string values
   * @param descStyle The description style
   * @param result The resulting string
   */
  private formatStrings(values: Array<string>, descStyle: string, result: StyledString) {
    values.forEach((value, i) => {
      result.style(this.styles.string).append(`'${value}'`);
      if (i < values.length - 1) {
        result.style(descStyle).append(',');
      }
    });
  }

  /**
   * Formats a list of numbers to be included in the description.
   * @param values The number values
   * @param descStyle The description style
   * @param result The resulting string
   */
  private formatNumbers(values: Array<number>, descStyle: string, result: StyledString) {
    values.forEach((value, i) => {
      result.style(this.styles.number).append(value.toString());
      if (i < values.length - 1) {
        result.style(descStyle).append(',');
      }
    });
  }

  /**
   * Recursively formats an option's requirements to be included in the description.
   * @param requires The option requirements
   * @param descStyle The description style
   * @param result The resulting string
   */
  private formatRequiresRecursive(requires: Requires, descStyle: string, result: StyledString) {
    if (typeof requires === 'string') {
      const [key, value] = requires.split(/=(.*)/, 2);
      const option = this.options[key];
      const preferredName = option.preferredName ?? option.names.find((name) => name)!;
      result.style(this.styles.option).append(preferredName);
      if (value) {
        result.style(descStyle).append('=');
        result.style(this.styles.string).append(`'${value}'`);
      }
    } else {
      result.style(descStyle).append('(');
      requires.items.forEach((item, i) => {
        this.formatRequiresRecursive(item, descStyle, result);
        if (i < requires.items.length - 1) {
          result.style(descStyle).append(requires.op);
        }
      });
      result.style(descStyle).append(')');
    }
  }

  /**
   * Formats a value from an option's property.
   * @param option The option definition
   * @param prop The option property
   * @param result The resulting string
   */
  private formatValue(option: ValuedOption, prop: 'default' | 'example', result: StyledString) {
    function assert(_condition: unknown): asserts _condition {}
    if (option.type === 'flag') {
      assert(prop === 'default');
      result.style(this.styles.boolean).append(`${option[prop]!}`);
    } else if (option.type === 'boolean') {
      result.style(this.styles.boolean).append(`${option[prop]!}`);
    } else if (option.type === 'string') {
      result.style(this.styles.string).append(`'${option[prop]!}'`);
    } else if (option.type === 'number') {
      result.style(this.styles.number).append(option[prop]!.toString());
    } else if (option.separator) {
      const values = option[prop]!.map((value) => value.toString());
      result.style(this.styles.string).append(`'${values.join(option.separator)}'`);
    } else {
      this.formatArrayValue(option, prop, result);
    }
  }

  /**
   * Formats a value from an array option's property.
   * @param option The option definition
   * @param prop The option property
   * @param result The resulting string
   */
  private formatArrayValue(option: ArrayOption, prop: 'default' | 'example', result: StyledString) {
    let values: Array<string>;
    if (option.type === 'strings') {
      values = option[prop]!.map((value) => `'${value}'`);
      result.style(this.styles.string);
    } else {
      values = option[prop]!.map((value) => value.toString());
      result.style(this.styles.number);
    }
    if (prop === 'example') {
      result.append(values.join(' '));
    } else {
      result.append(...values);
    }
  }

  /**
   * Formats a help message for the default option group.
   * @param width The desired console width
   * @returns The formatted help message
   */
  formatHelp(width = process.stdout.columns): string {
    const entries = this.groups.get('');
    return entries ? this.formatEntries(width, entries) : '';
  }

  /**
   * Formats help messages for all option groups.
   * @param width The desired console width
   * @returns The formatted help messages
   */
  formatGroups(width = process.stdout.columns): Map<string, string> {
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
    function formatCol(line: StyledString, indent: string, str: StyledString, width: number) {
      line.append(indent).appendStyled(str);
      line.style(whitespaceStyle).append(' '.repeat(width - str.length));
    }
    const whitespaceStyle = this.styles.whitespace;
    const lines = new Array<string>();
    for (const entry of entries) {
      const line = new StyledString().style(whitespaceStyle);
      formatCol(line, this.indent.names, entry.names, this.namesWidth);
      formatCol(line, this.indent.param, entry.param, this.paramWidth);
      line.append(this.indent.desc);
      this.wrapDesc(lines, entry.desc, width, line.string, this.indent.wrap);
    }
    return lines.join('\n');
  }

  /**
   * Wraps the option description to fit in the console.
   * @param lines The resulting lines to append to
   * @param desc The description styled string
   * @param width The desired console width
   * @param prefix The prefix at the start of the first line
   * @param indent The indentation at the start of each wrapped line
   */
  private wrapDesc(
    lines: Array<string>,
    desc: StyledString,
    width: number,
    prefix: string,
    indent: string,
  ) {
    const maxWordLen = desc.strings.reduce(
      (acc, word) => (isStyle(word) ? acc : Math.max(acc, word.length)),
      0,
    );
    if (width >= indent.length + maxWordLen) {
      width -= indent.length;
      indent = this.styles.whitespace + indent;
    } else {
      prefix += '\n';
      indent = '';
    }
    const punctuation = '.,;!?';
    const closingBrackets = [...')]}'];
    const openingBrackets = [...'{[('];
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
    }
    for (const word of desc.strings) {
      if (isStyle(word)) {
        nextStyle = word;
        continue;
      }
      if (
        merge ||
        punctuation.includes(word) ||
        closingBrackets.find((char) => word.startsWith(char))
      ) {
        currentWord += nextStyle + word;
        currentLen += word.length;
        merge = false;
      } else {
        addWord();
        if (currentStyle) {
          lastStyle = currentStyle;
          currentStyle = '';
        }
        currentWord = nextStyle + word;
        currentLen = word.length;
        merge = openingBrackets.findIndex((char) => word.startsWith(char)) >= 0;
      }
      if (nextStyle) {
        currentStyle = nextStyle;
        nextStyle = '';
      }
    }
    addWord();
    lines.push(line.join(''));
  }
}
