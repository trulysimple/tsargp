//--------------------------------------------------------------------------------------------------
// Imports and Exports
//--------------------------------------------------------------------------------------------------
import type { Option, Options, Requires, Styles } from './options.js';
import type { Style } from './styles.js';

import { isArray, isNiladic } from './options.js';
import { fg, isStyle, clearStyle, StyledString } from './styles.js';

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
 * The styles for the help message.
 */
type HelpStyles = Styles & {
  whitespace?: Style;
};

/**
 * The kind of items that can be shown in the option description.
 */
const enum HelpItem {
  desc,
  array,
  append,
  default,
  regex,
  range,
  enums,
  requires,
  deprecated,
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
  readonly styles?: HelpStyles;
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
    default: [clearStyle, fg.green],
    constraints: [clearStyle, fg.cyan],
    requires: [clearStyle, fg.brightMagenta],
    whitespace: [clearStyle],
  },
  items: [
    HelpItem.desc,
    HelpItem.array,
    HelpItem.append,
    HelpItem.default,
    HelpItem.regex,
    HelpItem.range,
    HelpItem.enums,
    HelpItem.requires,
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
  private readonly namesWidth: number = 0;
  private readonly typeWidth: number = 0;
  private readonly config: HelpConfig;
  private readonly indent: HelpIndent;

  /**
   * Creates a help message formatter.
   * @param options The option definitions
   * @param config The format configuration
   */
  constructor(
    private readonly options: Options,
    config: HelpConfig = {},
  ) {
    this.config = {
      indent: Object.assign({}, defaultConfig.indent, config.indent),
      breaks: Object.assign({}, defaultConfig.breaks, config.breaks),
      styles: Object.assign({}, defaultConfig.styles, config.styles),
      hidden: Object.assign({}, defaultConfig.hidden, config.hidden),
      items: config.items ?? defaultConfig.items,
    };
    const nameWidths = this.getNameWidths();
    for (const option of Object.values(options)) {
      const styles = Object.assign({}, this.config.styles, option.styles);
      const names = this.formatNames(option, nameWidths, styles);
      const type = this.formatType(option, styles);
      const desc = this.formatDescription(option, styles);
      this.entries.push({ names, type, desc });
      this.namesWidth = Math.max(this.namesWidth, names.length);
      this.typeWidth = Math.max(this.typeWidth, type.length);
    }
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
    this.indent = {
      names: breaks.names + indent.names,
      type: breaks.type ? breaks.type + blanks.type : indent.type,
      desc: breaks.desc ? breaks.desc + blanks.desc : indent.desc,
      wrap: blanks.desc,
    };
  }

  /**
   * @returns The maximum width of each name
   */
  private getNameWidths(): Array<number> {
    const result = new Array<number>();
    for (const option of Object.values(this.options)) {
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
   * @param widths The maximum width of each name
   * @param styles The styles to apply
   * @returns The formatted option names
   */
  private formatNames(option: Option, widths: Array<number>, styles: HelpStyles): StyledString {
    const result = new StyledString();
    if (this.config.hidden?.names) {
      return result;
    }
    let sep = '';
    let prefix = '';
    function formatName(name: string, width: number) {
      if (name) {
        if (sep || prefix) {
          result.style(styles.whitespace).append(sep + prefix);
        }
        result.style(styles.names).append(name);
        sep = ', ';
      } else {
        result.append(prefix);
        sep = '  ';
      }
      prefix = ' '.repeat(width - name.length);
    }
    option.names.forEach((name, i) => formatName(name, widths[i]));
    return result;
  }

  /**
   * @param option The option definition
   * @param styles The styles to apply
   * @returns The formatted option type (or examples)
   */
  private formatType(option: Option, styles: HelpStyles): StyledString {
    const result = new StyledString();
    if (this.config.hidden?.type) {
      return result;
    }
    const text =
      'example' in option ? `'${option.example}'` : isNiladic(option) ? '' : `<${option.type}>`;
    return result.style(text ? styles.type : []).append(text);
  }

  /**
   * @param option The option definition
   * @param styles The styles to apply
   * @returns The formatted option description
   */
  private formatDescription(option: Option, styles: HelpStyles): StyledString {
    const result = new StyledString();
    if (this.config.hidden?.desc || !this.config.items) {
      return result;
    }
    for (const item of this.config.items) {
      switch (item) {
        case HelpItem.desc:
          if (option.desc.length > 0) {
            const desc = option.desc + (option.desc.endsWith('.') ? '' : '.');
            result.style(styles.desc).append(...desc.split(' '));
          }
          break;
        case HelpItem.array:
          if (isArray(option)) {
            result.style(styles.desc).append('Values', 'are', 'comma-separated.');
          }
          break;
        case HelpItem.append:
          if ('append' in option && option.append) {
            result.style(styles.desc).append('May', 'be', 'specified', 'multiple', 'times.');
          }
          break;
        case HelpItem.default:
          if ('default' in option && option.type !== 'function') {
            result
              .style(styles.desc)
              .append('Defaults', 'to')
              .style(styles.default)
              .append(`'${option.default}'.`);
          }
          break;
        case HelpItem.regex:
          if ('regex' in option && option.regex) {
            result
              .style(styles.desc)
              .append('Accepts', 'values', 'matching')
              .style(styles.constraints)
              .append(`${String(option.regex)}.`);
          }
          break;
        case HelpItem.range:
          if ('range' in option && option.range) {
            result
              .style(styles.desc)
              .append('Accepts', 'values', 'in', 'the', 'range')
              .style(styles.constraints)
              .append(`[${option.range}].`);
          }
          break;
        case HelpItem.enums:
          if ('enums' in option && option.enums) {
            result
              .style(styles.desc)
              .append('Accepts', 'values', 'of')
              .style(styles.constraints)
              .append(`{${option.enums}}.`);
          }
          break;
        case HelpItem.requires:
          if (option.requires) {
            result
              .style(styles.desc)
              .append('Requires')
              .style(styles.requires)
              .append(`${HelpFormatter.formatRequires(option.requires, this.options)}.`);
          }
          break;
        case HelpItem.deprecated:
          if (option.deprecated) {
            const reason = option.deprecated + (option.deprecated.endsWith('.') ? '' : '.');
            result.style(styles.desc).append('Deprecated', 'for', ...reason.split(' '));
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
   * @param requires The option requirements
   * @param options The option definitions
   * @returns The formatted requirements description
   */
  private static formatRequires(requires: Requires, options: Options): string {
    function getRequiredName(key: string) {
      return options[key].names.find((name) => name)!;
    }
    if (typeof requires === 'string') {
      const [key, value] = requires.split('=');
      if (value) {
        return `${getRequiredName(key)}='${value}'`;
      }
      return getRequiredName(key);
    }
    const result = requires.items.map((item) => this.formatRequires(item, options));
    return `(${result.join(` ${requires.op} `)})`;
  }

  /**
   * Formats a help message to be printed on the console.
   * @param consoleWidth The desired console width
   * @returns The formatted help message
   */
  formatHelp(consoleWidth = process.stdout.columns): string {
    function formatCol(line: StyledString, indent: string, text: StyledString, width: number) {
      line
        .append(indent)
        .append(text.string)
        .style(whitespaceStyle)
        .append(' '.repeat(width - text.length));
    }

    const lines = new Array<string>();
    const whitespaceStyle = this.config.styles!.whitespace;
    const wrap = new StyledString().style(whitespaceStyle).append(this.indent.wrap).string;
    const width = consoleWidth - this.indent.wrap.length;
    for (const entry of this.entries) {
      const line = new StyledString().style(whitespaceStyle);
      formatCol(line, this.indent.names, entry.names, this.namesWidth);
      formatCol(line, this.indent.type, entry.type, this.typeWidth);
      line.append(this.indent.desc);

      if (this.indent.wrap.length >= consoleWidth) {
        // no space left: use native wrapping
        lines.push(line.string + entry.desc.strings.join(' '));
      } else {
        HelpFormatter.wrapDesc(lines, entry.desc, width, line.string, wrap);
      }
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
  private static wrapDesc(
    lines: Array<string>,
    desc: StyledString,
    width: number,
    prefix: string,
    indent: string,
  ) {
    let line = new Array<string>();
    let style = '';
    let space = '';
    let length = 0;
    for (const word of desc.strings) {
      if (isStyle(word)) {
        line.push(space + word);
        length += space.length;
        style = word;
        space = '';
      } else if (length + word.length < width) {
        // important: use strict less
        line.push(space + word);
        length += space.length + word.length;
        space = ' ';
      } else {
        lines.push(prefix + line.join(''));
        prefix = indent + style;
        line = [word];
        length = word.length;
        space = ' ';
      }
    }
    lines.push(prefix + line.join(''));
  }
}
