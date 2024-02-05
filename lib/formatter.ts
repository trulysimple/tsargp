//--------------------------------------------------------------------------------------------------
// Imports and Exports
//--------------------------------------------------------------------------------------------------
import type { Option, Options, Styles } from './options.js';
import type { Style } from './styles.js';

import { isArray, isNiladic } from './options.js';
import { fg, isStyle, noStyle, StyledString } from './styles.js';

export { type HelpConfig, HelpFormatter };

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
  whitespace: Style;
};

/**
 * Help format configuration.
 */
type HelpConfig = {
  /**
   * The desired indentation level for each column.
   * Negative numbers can be used in conjunction with line breaks to achieve a nesting effect.
   */
  readonly indent?: {
    readonly names?: number;
    readonly type?: number;
    readonly desc?: number;
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
   * The default styles.
   */
  readonly styles?: HelpStyles;
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
    names: [noStyle],
    type: [noStyle, fg.brightBlack],
    desc: [noStyle],
    default: [noStyle, fg.green],
    constraints: [noStyle, fg.cyan],
    requires: [noStyle, fg.brightMagenta],
    whitespace: [noStyle],
  },
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
  constructor(options: Options, config: HelpConfig = {}) {
    this.config = {
      indent: Object.assign({}, defaultConfig.indent, config.indent),
      breaks: Object.assign({}, defaultConfig.breaks, config.breaks),
      styles: Object.assign({}, defaultConfig.styles, config.styles),
    };
    const nameWidths = HelpFormatter.getNameWidths(options);
    for (const option of Object.values(options)) {
      const styles = Object.assign({}, this.config.styles, option.styles);
      const names = HelpFormatter.formatNames(option, nameWidths, styles);
      const type = HelpFormatter.formatType(option, styles);
      const desc = HelpFormatter.formatDescription(option, options, styles);
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
    const len1 = this.namesWidth + this.config.indent!.type!;
    const len2 = this.typeWidth + this.config.indent!.desc!;
    const blanks = {
      type: ' '.repeat(Math.max(0, len0 + len1)),
      desc: ' '.repeat(Math.max(0, len0 + len1 + len2)),
    };
    this.indent = {
      names: breaks.names + indent.names,
      type: breaks.type ? breaks.type + blanks.type : indent.type,
      desc: breaks.desc ? breaks.desc + blanks.desc : indent.desc,
      wrap: blanks.desc,
    };
  }

  /**
   * @param options The option definitions
   * @returns The maximum width of each name
   */
  private static getNameWidths(options: Options): Array<number> {
    const result = new Array<number>();
    for (const option of Object.values(options)) {
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
  private static formatNames(
    option: Option,
    widths: Array<number>,
    styles: HelpStyles,
  ): StyledString {
    const result = new StyledString();
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
  private static formatType(option: Option, styles: HelpStyles): StyledString {
    const text =
      'example' in option ? `'${option.example}'` : isNiladic(option) ? '' : `<${option.type}>`;
    return new StyledString().style(text ? styles.type : []).append(text);
  }

  /**
   * @param option The option definition
   * @param options The option definitions
   * @param styles The styles to apply
   * @returns The formatted option description
   */
  private static formatDescription(
    option: Option,
    options: Options,
    styles: HelpStyles,
  ): StyledString {
    function getRequiredName(key: string) {
      return options[key].names.find((name) => name)!;
    }
    const result = new StyledString().style(styles.desc);
    if (option.desc.length > 0) {
      const desc = option.desc + (option.desc.endsWith('.') ? '' : '.');
      result.append(...desc.split(' '));
    }
    if (isArray(option)) {
      result.append('Values', 'are', 'comma-separated.');
    }
    if ('default' in option && option.type !== 'function') {
      result.append('Defaults', 'to').style(styles.default).append(`'${option.default}'.`);
    }
    if ('enums' in option && option.enums) {
      result
        .style(styles.desc)
        .append('Accepts', 'values', 'of')
        .style(styles.constraints)
        .append(`{${option.enums}}.`);
    }
    if ('regex' in option && option.regex) {
      result
        .style(styles.desc)
        .append('Accepts', 'values', 'matching')
        .style(styles.constraints)
        .append(`${String(option.regex)}.`);
    }
    if ('range' in option && option.range) {
      result
        .style(styles.desc)
        .append('Accepts', 'values', 'in', 'the', 'range')
        .style(styles.constraints)
        .append(`[${option.range}].`);
    }
    if ('requiresAll' in option && option.requiresAll) {
      result
        .style(styles.desc)
        .append('Requires', 'all', 'of')
        .style(styles.requires)
        .append(`${option.requiresAll.map((key) => getRequiredName(key))}.`);
    }
    if ('requiresOne' in option && option.requiresOne) {
      result
        .style(styles.desc)
        .append('Requires', 'one', 'of')
        .style(styles.requires)
        .append(`${option.requiresOne.map((key) => getRequiredName(key))}.`);
    }
    if (option.deprecated) {
      const reason = option.deprecated + (option.deprecated.endsWith('.') ? '' : '.');
      result.style(styles.desc).append('Deprecated', 'for', ...reason.split(' '));
    }
    return result;
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
    return lines.join('\n') + noStyle;
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
    let line = '';
    let style = '';
    let space = '';
    let length = 0;
    for (const word of desc.strings) {
      if (isStyle(word)) {
        line += space + word;
        length += space.length;
        style = word;
        space = '';
      } else if (length + word.length < width) {
        // important: use strict less
        line += space + word;
        length += space.length + word.length;
        space = ' ';
      } else {
        lines.push(prefix + line);
        prefix = indent + style;
        line = word;
        length = word.length;
        space = ' ';
      }
    }
    lines.push(prefix + line);
  }
}
