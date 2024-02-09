//--------------------------------------------------------------------------------------------------
// Imports and Exports
//--------------------------------------------------------------------------------------------------
import type { Option, Options, ParamOption, Requires, Styles } from './options.js';
import type { Style } from './styles.js';

import { isNiladic } from './options.js';
import { fg, isStyle, clearStyle, StyledString, styleToString } from './styles.js';

export { type HelpConfig, HelpFormatter, HelpItem };

//--------------------------------------------------------------------------------------------------
// Types
//--------------------------------------------------------------------------------------------------
/**
 * Pre-computed information about an option.
 */
type HelpEntry = {
  readonly names: StyledString;
  readonly type: StyledString;
  readonly desc: StyledString;
};

/**
 * Pre-computed indentation.
 */
type HelpIndent = {
  readonly names: string;
  readonly type: string;
  readonly desc: string;
  readonly wrap: string;
};

/**
 * Pre-computed styles.
 */
type HelpStyles = {
  readonly names: string;
  readonly type: string;
  readonly desc: string;
  readonly regex: string;
  readonly string: string;
  readonly number: string;
  readonly option: string;
  readonly whitespace: string;
};

/**
 * The kind of items that can be shown in the option description.
 */
const enum HelpItem {
  desc,
  separator = 'Values are delimited by',
  multivalued = 'Accepts multiple parameters.',
  positional = 'Accepts positional parameters.',
  append = 'May be specified multiple times.',
  unique = 'Duplicate values will be removed.',
  limit = 'Value count is limited to',
  trim = 'Values will be trimmed.',
  case = 'Values will be converted to',
  regex = 'Values must match the regex',
  range = 'Values must be in the range',
  enums = 'Values must be one of',
  requires = 'Requires',
  default = 'Defaults to',
  deprecated = 'Deprecated for',
}

/**
 * Help format configuration.
 */
type HelpConfig = {
  /**
   * The indentation level for each column.
   */
  readonly indent?: {
    readonly names?: number;
    readonly type?: number;
    readonly desc?: number;
    readonly typeAbsolute?: number;
    readonly descAbsolute?: number;
  };
  /**
   * The number of line breaks to insert before each column.
   */
  readonly breaks?: {
    readonly names?: number;
    readonly type?: number;
    readonly desc?: number;
  };
  /**
   * Select individual columns that should not be displayed.
   */
  readonly hidden?: {
    readonly names?: boolean;
    readonly type?: boolean;
    readonly desc?: boolean;
  };
  /**
   * The default styles.
   */
  readonly styles?: Styles & {
    example?: Style;
    default?: Style;
    regex?: Style;
    range?: Style;
    enum?: Style;
    string?: Style;
    number?: Style;
    option?: Style;
    whitespace?: Style;
  };
  /**
   * The order of items to be shown in the option description.
   */
  readonly items?: Array<HelpItem>;
};

//--------------------------------------------------------------------------------------------------
// Constants
//--------------------------------------------------------------------------------------------------
const defaultConfig: HelpConfig = {
  indent: {
    names: 2,
    type: 2,
    desc: 2,
  },
  breaks: {
    names: 0,
    type: 0,
    desc: 0,
  },
  styles: {
    names: [clearStyle],
    type: [clearStyle, fg.brightBlack],
    desc: [clearStyle],
    regex: [fg.red],
    string: [fg.green],
    number: [fg.yellow],
    option: [fg.magenta],
    whitespace: [clearStyle],
  },
  items: [
    HelpItem.desc,
    HelpItem.separator,
    HelpItem.multivalued,
    HelpItem.positional,
    HelpItem.append,
    HelpItem.unique,
    HelpItem.limit,
    HelpItem.trim,
    HelpItem.case,
    HelpItem.regex,
    HelpItem.range,
    HelpItem.enums,
    HelpItem.requires,
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
  private readonly entries: Array<HelpEntry> = [];
  private readonly nameWidths: Array<number> = [];
  private readonly namesWidth: number = 0;
  private readonly typeWidth: number = 0;
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
    this.config = HelpFormatter.getConfig(config);
    this.styles = this.getStyles();
    this.nameWidths = this.getNameWidths();
    for (const key in options) {
      const option = options[key];
      if (option.hide) {
        continue;
      }
      const names = this.formatNames(option);
      const type = this.formatType(option);
      const desc = this.formatDescription(option);
      this.entries.push({ names, type, desc });
      this.namesWidth = Math.max(this.namesWidth, names.length);
      this.typeWidth = Math.max(this.typeWidth, type.length);
    }
    this.indent = this.getIndent();
  }

  private static getConfig(config: HelpConfig): HelpConfig {
    return {
      indent: Object.assign({}, defaultConfig.indent, config.indent),
      breaks: Object.assign({}, defaultConfig.breaks, config.breaks),
      styles: Object.assign({}, defaultConfig.styles, config.styles),
      hidden: Object.assign({}, defaultConfig.hidden, config.hidden),
      items: config.items ?? defaultConfig.items,
    };
  }

  private getStyles(): HelpStyles {
    return {
      names: styleToString(this.config.styles?.names),
      type: styleToString(this.config.styles?.type),
      desc: styleToString(this.config.styles?.desc),
      regex: styleToString(this.config.styles?.regex),
      string: styleToString(this.config.styles?.string),
      number: styleToString(this.config.styles?.number),
      option: styleToString(this.config.styles?.option),
      whitespace: styleToString(this.config.styles?.whitespace),
    };
  }

  private getIndent(): HelpIndent {
    const indent = {
      names: ' '.repeat(Math.max(0, this.config.indent!.names!)),
      type: ' '.repeat(Math.max(0, this.config.indent!.type!)),
      desc: ' '.repeat(Math.max(0, this.config.indent!.desc!)),
    };
    const breaks = {
      names: '\n'.repeat(this.config.breaks!.names!),
      type: '\n'.repeat(this.config.breaks!.type!),
      desc: '\n'.repeat(this.config.breaks!.desc!),
    };
    const len0 = this.config.indent!.names!;
    const len1 =
      this.config.indent!.typeAbsolute ?? len0 + this.namesWidth + this.config.indent!.type!;
    const len2 =
      this.config.indent!.descAbsolute ?? len1 + this.typeWidth + this.config.indent!.desc!;
    const blanks = {
      type: ' '.repeat(Math.max(0, len1)),
      desc: ' '.repeat(Math.max(0, len2)),
    };
    return {
      names: breaks.names + indent.names,
      type: breaks.type ? breaks.type + blanks.type : indent.type,
      desc: breaks.desc ? breaks.desc + blanks.desc : indent.desc,
      wrap: blanks.desc,
    };
  }

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
   * @param option The option definition
   * @returns The formatted option names
   */
  private formatNames(option: Option): StyledString {
    const result = new StyledString();
    if (this.config.hidden?.names) {
      return result;
    }
    const whitespaceStyle = this.styles.whitespace;
    const namesStyle = option.styles?.names
      ? styleToString(option.styles?.names)
      : this.styles.names;
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
    option.names.forEach((name, i) => formatName(name, this.nameWidths[i]));
    return result;
  }

  /**
   * @param option The option definition
   * @returns The formatted option type (or examples)
   */
  private formatType(option: Option): StyledString {
    const result = new StyledString();
    if (this.config.hidden?.type) {
      return result;
    }
    if ('example' in option && option.example !== undefined) {
      this.formatValue(option, 'example', result);
    } else if (!isNiladic(option)) {
      const typeStyle = option.styles?.type ? styleToString(option.styles?.type) : this.styles.type;
      result.style(typeStyle).append(`<${option.type}>`);
    }
    return result;
  }

  /**
   * @param value The option value
   * @param prop The option property
   * @param result The resulting string
   */
  private formatValue(option: ParamOption, prop: 'default' | 'example', result: StyledString) {
    if (option.type === 'string') {
      result.style(this.styles.string).append(`'${option[prop]!}'`);
    } else if (option.type === 'number') {
      result.style(this.styles.number).append(option[prop]!.toString());
    } else if (option.separator) {
      const values = option[prop]!.map((value) => value.toString());
      result.style(this.styles.string).append(`'${values.join(option.separator)}'`);
    } else {
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
  }

  /**
   * @param option The option definition
   * @returns The formatted option description
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
          if (option.desc) {
            const words = option.desc.split(' ');
            if (!words.at(-1)!.endsWith('.')) {
              words[words.length - 1] += '.';
            }
            result.style(descStyle).append(...words);
          }
          break;
        case HelpItem.separator:
          if ('separator' in option && option.separator) {
            const words = HelpItem.separator.split(' ');
            result.style(descStyle).append(...words);
            result.style(this.styles.string).append(`'${option.separator}'`);
            result.style(descStyle).append('.');
          }
          break;
        case HelpItem.multivalued:
          if (!('separator' in option && option.separator)) {
            const words = HelpItem.multivalued.split(' ');
            result.style(descStyle).append(...words);
          }
          break;
        case HelpItem.positional:
          if ('positional' in option && option.positional) {
            const words = HelpItem.positional.split(' ');
            result.style(descStyle).append(...words);
          }
          break;
        case HelpItem.append:
          if ('append' in option && option.append) {
            const words = HelpItem.append.split(' ');
            result.style(descStyle).append(...words);
          }
          break;
        case HelpItem.unique:
          if ('unique' in option && option.unique) {
            const words = HelpItem.unique.split(' ');
            result.style(descStyle).append(...words);
          }
          break;
        case HelpItem.limit:
          if ('limit' in option && option.limit !== undefined) {
            const words = HelpItem.limit.split(' ');
            result.style(descStyle).append(...words);
            result.style(this.styles.number).append(`${option.limit}`);
            result.style(descStyle).append('.');
          }
          break;
        case HelpItem.trim:
          if ('trim' in option && option.trim) {
            const words = HelpItem.trim.split(' ');
            result.style(descStyle).append(...words);
          }
          break;
        case HelpItem.case:
          if ('case' in option && option.case) {
            const words = HelpItem.case.split(' ');
            result.style(descStyle).append(...words, option.case + '-case.');
          }
          break;
        case HelpItem.regex:
          if ('regex' in option && option.regex) {
            const words = HelpItem.regex.split(' ');
            result.style(descStyle).append(...words);
            result.style(this.styles.regex).append(String(option.regex));
            result.style(descStyle).append('.');
          }
          break;
        case HelpItem.range:
          if ('range' in option && option.range) {
            const words = HelpItem.range.split(' ');
            result.style(descStyle).append(...words, '[');
            this.formatNumbers(option.range, descStyle, result);
            result.style(descStyle).append('].');
          }
          break;
        case HelpItem.enums:
          if ('enums' in option && option.enums) {
            const words = HelpItem.enums.split(' ');
            result.style(descStyle).append(...words, '{');
            if (option.type === 'string' || option.type === 'strings') {
              this.formatStrings(option.enums, descStyle, result);
            } else {
              this.formatNumbers(option.enums, descStyle, result);
            }
            result.style(descStyle).append('}.');
          }
          break;
        case HelpItem.requires:
          if (option.requires) {
            const words = HelpItem.requires.split(' ');
            result.style(descStyle).append(...words);
            this.formatRequires(option.requires, descStyle, result);
            result.style(descStyle).append('.');
          }
          break;
        case HelpItem.default:
          if ('default' in option && option.default !== undefined) {
            const words = HelpItem.default.split(' ');
            result.style(descStyle).append(...words);
            this.formatValue(option, 'default', result);
            result.style(descStyle).append('.');
          }
          break;
        case HelpItem.deprecated:
          if (option.deprecated) {
            const words = (HelpItem.deprecated + ' ' + option.deprecated).split(' ');
            if (!words.at(-1)!.endsWith('.')) {
              words[words.length - 1] += '.';
            }
            result.style(descStyle).append(...words);
          }
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
   * @param values The string values
   * @param descStyle The custom description style
   * @param result The resulting text
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
   * @param values The number values
   * @param descStyle The custom description style
   * @param result The resulting text
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
   * @param requires The option requirements
   * @param descStyle The custom description style
   * @param result The resulting text
   */
  private formatRequires(requires: Requires, descStyle: string, result: StyledString) {
    if (typeof requires === 'string') {
      const [key, value] = requires.split(/=(.*)/, 2);
      const option = this.options[key];
      const preferredName = option.preferredName ?? option.names.find((name) => name)!;
      result.style(this.styles.option).append(`${preferredName}`);
      if (value) {
        result.style(descStyle).append('=');
        result.style(this.styles.string).append(`'${value}'`);
      }
    } else {
      result.style(descStyle).append('(');
      requires.items.forEach((item, i) => {
        this.formatRequires(item, descStyle, result);
        if (i < requires.items.length - 1) {
          result.style(descStyle).append(requires.op);
        }
      });
      result.style(descStyle).append(')');
    }
  }

  /**
   * Formats a help message to be printed on the console.
   * @param width The desired console width
   * @returns The formatted help message
   */
  formatHelp(width = process.stdout.columns): string {
    function formatCol(line: StyledString, indent: string, text: StyledString, width: number) {
      line.append(indent).append(text.string);
      line.style(whitespaceStyle).append(' '.repeat(width - text.length));
    }
    const whitespaceStyle = this.styles.whitespace;
    const lines = new Array<string>();
    for (const entry of this.entries) {
      const line = new StyledString().style(whitespaceStyle);
      formatCol(line, this.indent.names, entry.names, this.namesWidth);
      formatCol(line, this.indent.type, entry.type, this.typeWidth);
      line.append(this.indent.desc);
      this.wrapDesc(lines, entry.desc, width, line.string, this.indent.wrap);
    }
    return lines.join('\n') + clearStyle;
  }

  /**
   * Wraps the option description to fit in the console.
   * @param lines The console lines
   * @param desc The description
   * @param width The desired console width
   * @param prefix The prefix at the start of the first line
   * @param indent The indentation at the start of each wrapped line
   * @returns The wrapped text
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
