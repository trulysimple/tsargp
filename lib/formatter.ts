//--------------------------------------------------------------------------------------------------
// Imports and Exports
//--------------------------------------------------------------------------------------------------
import type { Option, Options, Styles } from './options.js';
import type { Style } from './styles.js';

import { isArray, isNiladic } from './options.js';
import { applyAndReset, fg, resetStyle } from './styles.js';

export { type HelpConfig, HelpFormatter };

//--------------------------------------------------------------------------------------------------
// Types
//--------------------------------------------------------------------------------------------------
/**
 * Pre-computed information about an option.
 */
type HelpEntry = {
  readonly names: string;
  readonly type: string;
  readonly desc: string;
  readonly styles: Styles;
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
   * The default option styles.
   */
  readonly styles?: Styles;
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
    type: [fg.brightBlack],
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
  constructor(
    private readonly options: Options,
    config: HelpConfig = {},
  ) {
    this.config = {
      indent: Object.assign({}, defaultConfig.indent, config.indent),
      breaks: Object.assign({}, defaultConfig.breaks, config.breaks),
      styles: Object.assign({}, defaultConfig.styles, config.styles),
    };
    const nameWidths = this.getNameWidths();
    for (const option of Object.values(options)) {
      const names = HelpFormatter.formatNames(option, nameWidths);
      const type = HelpFormatter.formatType(option);
      const desc = this.formatDescription(option);
      const styles = Object.assign({}, this.config.styles, option.styles);
      this.entries.push({ names, type, desc, styles });
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
   * @returns The formatted option type (or examples)
   */
  private static formatType(option: Option): string {
    return 'example' in option
      ? `'${option.example}'`
      : isNiladic(option)
        ? ''
        : `[${option.type}]`;
  }

  /**
   * @param option The option definition
   * @param nameWidths The maximum width of each name
   * @returns The formatted option names
   */
  private static formatNames(option: Option, nameWidths: Array<number>): string {
    function formatName(name: string, width: number, i: number) {
      const sep = name.length == 0 ? ' ' : i < option.names.length - 1 ? ',' : '';
      return name + sep + ' '.repeat(width - name.length);
    }
    return option.names.map((name, i) => formatName(name, nameWidths[i], i)).join(' ');
  }

  /**
   * @param option The option definition
   * @returns The formatted option description
   */
  private formatDescription(option: Option): string {
    return [
      option.desc + (option.desc.endsWith('.') ? '' : '.'),
      isArray(option) ? ' Values are comma-separated.' : '',
      'default' in option && option.type !== 'function' ? ` Defaults to '${option.default}'.` : '',
      'enums' in option && option.enums ? ` Accepts values of [${option.enums}].` : '',
      'regex' in option && option.regex ? ` Accepts values matching ${String(option.regex)}.` : '',
      'range' in option && option.range ? ` Accepts values in the range [${option.range}].` : '',
      'requiresAll' in option && option.requiresAll
        ? ` Requires all of [${option.requiresAll.map((key) => this.getRequiredName(key))}].`
        : '',
      'requiresOne' in option && option.requiresOne
        ? ` Requires one of [${option.requiresOne.map((key) => this.getRequiredName(key))}].`
        : '',
      option.deprecated ? ` Deprecated for ${option.deprecated}.` : '',
    ].join('');
  }

  /**
   * @param key The required option key
   * @returns The first valid name of the option
   */
  private getRequiredName(key: string) {
    return this.options[key].names.find((name) => name)!;
  }

  /**
   * Formats a help message to be printed on the console.
   * @param consoleWidth The desired console width
   * @returns The formatted help message
   */
  formatHelp(consoleWidth = process.stdout.columns): string {
    function formatCol(indent: string, text: string, width: number, style?: Style) {
      return indent + applyAndReset(text, style) + ' '.repeat(width - text.length);
    }
    const lines = new Array<string>();
    for (const entry of this.entries) {
      const names = formatCol(this.indent.names, entry.names, this.namesWidth, entry.styles.names);
      const type = formatCol(this.indent.type, entry.type, this.typeWidth, entry.styles.type);
      const prefix = names + type + this.indent.desc;
      if (this.indent.wrap.length >= consoleWidth) {
        // no space left: use native wrapping
        lines.push(prefix + applyAndReset(entry.desc, entry.styles.desc));
      } else {
        const width = consoleWidth - this.indent.wrap.length;
        HelpFormatter.wrapDesc(lines, entry, width, prefix, this.indent.wrap);
      }
    }
    return resetStyle + lines.join('\n');
  }

  /**
   * Wraps the option description to fit in the console.
   * @param lines The console lines
   * @param entry The help entry
   * @param width The desired console width
   * @param prefix The prefix at the start of the first line
   * @param indent The indentation at the start of each wrapped line
   * @returns The wrapped text
   */
  private static wrapDesc(
    lines: Array<string>,
    entry: HelpEntry,
    width: number,
    prefix: string,
    indent: string,
  ) {
    let line = '';
    for (const word of entry.desc.split(' ')) {
      if (line.length + word.length < width) {
        // important: use strict less
        line += (line ? ' ' : '') + word;
      } else {
        lines.push(prefix + applyAndReset(line, entry.styles.desc));
        prefix = indent;
        line = word;
      }
    }
    lines.push(prefix + applyAndReset(line, entry.styles.desc));
  }
}
