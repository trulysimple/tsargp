//--------------------------------------------------------------------------------------------------
// Imports and Exports
//--------------------------------------------------------------------------------------------------
import type { Option, Options, Styles } from './options.js';
import type { Style } from './styles.js';

import { isArray, isNiladic } from './options.js';
import { applyAndReset, fg, resetStyle } from './styles.js';

export { HelpFormatter };

//--------------------------------------------------------------------------------------------------
// Types
//--------------------------------------------------------------------------------------------------
/**
 * Help-related information about an option.
 */
type HelpEntry = {
  name: string;
  type: string;
  desc: string;
  styles: Styles;
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
  private readonly nameWidth: number = 0;
  private readonly typeWidth: number = 0;

  /**
   * Creates a help message formatter.
   * @param options The option definitions
   * @param styles The default option styles
   */
  constructor(
    options: Options,
    private readonly styles = { type: [fg.brightBlack] },
  ) {
    for (const option of Object.values(options)) {
      option.names.forEach((name, i) => {
        if (i == this.nameWidths.length) {
          this.nameWidths.push(name.length);
        } else if (name.length > this.nameWidths[i]) {
          this.nameWidths[i] = name.length;
        }
      });
    }
    for (const option of Object.values(options)) {
      const name = this.formatName(option);
      const type = HelpFormatter.formatType(option);
      const desc = HelpFormatter.formatDescription(option);
      const styles = Object.assign({}, this.styles, option.styles);
      this.entries.push({ name, type, desc, styles });
      this.nameWidth = Math.max(this.nameWidth, name.length);
      this.typeWidth = Math.max(this.typeWidth, type.length);
    }
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
   * @returns The formatted option name (or set of names)
   */
  private formatName(option: Option): string {
    function formatColumn(name: string, width: number, i: number) {
      const sep = name.length == 0 ? ' ' : i < option.names.length - 1 ? ',' : '';
      return name + sep + ' '.repeat(width - name.length);
    }
    return option.names.map((name, i) => formatColumn(name, this.nameWidths[i], i)).join(' ');
  }

  /**
   * @param option The option definition
   * @returns The formatted option description
   */
  private static formatDescription(option: Option): string {
    return [
      option.desc + (option.desc.endsWith('.') ? '' : '.'),
      isArray(option) ? ' Values are comma-separated.' : '',
      'default' in option && option.type !== 'function' ? ` Defaults to '${option.default}'.` : '',
      'enums' in option && option.enums ? ` Accepts values of [${option.enums}].` : '',
      'regex' in option && option.regex ? ` Accepts values matching ${String(option.regex)}.` : '',
      'range' in option && option.range ? ` Accepts values in the range [${option.range}].` : '',
      option.deprecated ? ` Deprecated for ${option.deprecated}.` : '',
    ].join('');
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
    return resetStyle + lines.join('\n');
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
    function formatColumn(text: string, width: number, style?: Style) {
      return indent + applyAndReset(text, style) + ' '.repeat(width - text.length);
    }
    const nameColumn = formatColumn(entry.name, this.nameWidth, entry.styles.name);
    const typeColumn = formatColumn(entry.type, this.typeWidth, entry.styles.type);
    const prefix = nameColumn + typeColumn + indent;
    if (width <= this.nameWidth + this.typeWidth) {
      // no space left: use native wrapping
      lines.push(prefix + applyAndReset(entry.desc, entry.styles.desc));
    } else {
      const prefixLen = indent.length * 3 + this.nameWidth + this.typeWidth;
      HelpFormatter.wrapDesc(lines, entry, width - prefixLen, prefix, ' '.repeat(prefixLen));
    }
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
