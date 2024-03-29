//--------------------------------------------------------------------------------------------------
// Imports and Exports
//--------------------------------------------------------------------------------------------------
import type { Alias, Enumerate } from './utils';
import { cs, tf, fg, bg, ul } from './enums';
import { overrides } from './utils';

export { sequence as seq, sgr as style, foreground as fg8, background as bg8, underline as ul8 };

//--------------------------------------------------------------------------------------------------
// Constants
//--------------------------------------------------------------------------------------------------
/**
 * A set of regular expressions for terminal strings.
 */
const regex = {
  para: /(?:[ \t]*\r?\n){2,}/,
  item: /^[ \t]*(-|\*|\d+\.) /m,
  punct: /[.,:;!?]$/,
  word: /\s+/,
  spec: /(%[a-z][0-9]?)/,
  // eslint-disable-next-line no-control-regex
  styles: /(?:\x9b[\d;]+m)+/g,
};

//--------------------------------------------------------------------------------------------------
// Types
//--------------------------------------------------------------------------------------------------
/**
 * A control sequence introducer.
 * @template P The type of the sequence parameter
 * @template C The type of the sequence command
 */
export type CSI<P extends string, C extends cs> = `\x9b${P}${C}`;

/**
 * A control sequence.
 */
export type Sequence = CSI<string, cs> | '';

/**
 * A select graphics rendition sequence.
 */
export type Style = CSI<string, cs.sgr> | '';

/**
 * An 8-bit decimal number.
 */
export type Decimal = Alias<Enumerate<256>>;

/**
 * An 8-bit foreground color.
 */
export type FgColor = [38, 5, Decimal];

/**
 * An 8-bit background color.
 */
export type BgColor = [48, 5, Decimal];

/**
 * An 8-bit underline color.
 */
export type UlColor = [58, 5, Decimal];

/**
 * A text styling attribute.
 */
export type StyleAttr = tf | fg | bg | ul | FgColor | BgColor | UlColor;

/**
 * A callback that processes a format specifier when splitting text.
 * @param this The terminal string to append to
 * @param spec The format specifier (e.g., '%s')
 */
export type FormatCallback = (this: TerminalString, spec: string) => void;

/**
 * A message that can be printed on a terminal.
 */
export type Message = ErrorMessage | HelpMessage | WarnMessage | VersionMessage | CompletionMessage;

//--------------------------------------------------------------------------------------------------
// Classes
//--------------------------------------------------------------------------------------------------
/**
 * Implements concatenation of strings that can be printed on a terminal.
 */
export class TerminalString {
  private merge = false;

  /**
   * The list of internal strings that have been appended.
   */
  readonly strings = new Array<string>();

  /**
   * The lengths of the internal strings, ignoring control characters and sequences.
   */
  readonly lengths = new Array<number>();

  /**
   * @returns The combined length of all internal strings, ignoring control characters and sequences
   */
  get length(): number {
    return this.lengths.reduce((acc, len) => acc + len, 0);
  }

  /**
   * @returns The number of internal strings
   */
  get count(): number {
    return this.strings.length;
  }

  /**
   * Creates a terminal string.
   * @param indent The starting column for this string (negative values are replaced by zero)
   * @param breaks The initial number of line feeds (non-positive values are ignored)
   * @param rightAlign True if the string should be right-aligned to the terminal width
   */
  constructor(
    public indent: number = 0,
    breaks = 0,
    public rightAlign = false,
  ) {
    this.addBreak(breaks);
  }

  /**
   * Removes strings from the end of the list.
   * @param count The number of strings
   * @returns The terminal string instance
   */
  pop(count = 1): this {
    if (count > 0) {
      const len = Math.max(0, this.count - count);
      this.strings.length = len;
      this.lengths.length = len;
    }
    return this;
  }

  /**
   * Appends another terminal string to the list.
   * @param other The other terminal string
   * @returns The terminal string instance
   */
  addOther(other: TerminalString): this {
    this.strings.push(...other.strings);
    this.lengths.push(...other.lengths);
    this.merge = other.merge;
    return this;
  }

  /**
   * Sets a flag to merge the next word to the last word.
   * @param value The flag value
   * @returns The terminal string instance
   */
  setMerge(value = true): this {
    this.merge = value;
    return this;
  }

  /**
   * Appends a word that will be merged with the next word.
   * @param word The opening word
   * @returns The terminal string instance
   */
  addOpening(word: string): this {
    return this.addWord(word).setMerge();
  }

  /**
   * Appends a word that is merged with the last word.
   * @param word The closing word
   * @returns The terminal string instance
   */
  addClosing(word: string): this {
    return this.setMerge().addWord(word);
  }

  /**
   * Appends a word with surrounding sequences.
   * @param seq The starting sequence
   * @param word The word to be appended
   * @param rev The ending sequence
   * @returns The terminal string instance
   */
  addAndRevert(seq: Sequence, word: string, rev: Sequence): this {
    return this.addText(seq + word + rev, word.length);
  }

  /**
   * Appends a word to the list.
   * @param word The word to be appended. Should not contain control characters or sequences.
   * @returns The terminal string instance
   */
  addWord(word: string): this {
    return this.addText(word, word.length);
  }

  /**
   * Appends line breaks to the list.
   * @param count The number of line breaks to insert (non-positive values are ignored)
   * @returns The terminal string instance
   */
  addBreak(count = 1): this {
    return count > 0 ? this.addText('\n'.repeat(count), 0) : this;
  }

  /**
   * Appends a sequence to the list.
   * @param seq The sequence to insert
   * @returns The terminal string instance
   */
  addSequence(seq: Sequence): this {
    return this.addText(seq, 0);
  }

  /**
   * Appends a text that may contain control characters or sequences to the list.
   * @param text The text to be appended
   * @param length The length of the text without control characters or sequences
   * @returns The terminal string instance
   */
  private addText(text: string, length: number): this {
    if (text) {
      const count = this.count;
      if (count && this.merge) {
        this.strings[count - 1] += text;
        this.lengths[count - 1] += length;
      } else {
        this.strings.push(text);
        this.lengths.push(length);
      }
    }
    this.merge = false;
    return this;
  }

  /**
   * Splits a text into words and style sequences, and appends them to the list.
   * @param text The text to be split
   * @param format An optional callback to process format specifiers
   * @returns The terminal string instance
   */
  splitText(text: string, format?: FormatCallback): this {
    const paragraphs = text.split(regex.para);
    paragraphs.forEach((para, i) => {
      this.splitParagraph(para, format);
      if (i < paragraphs.length - 1) {
        this.addBreak(2);
      }
    });
    return this;
  }

  /**
   * Splits a paragraph into words and style sequences, and appends them to the list.
   * @param para The paragraph to be split
   * @param format An optional callback to process format specifiers
   */
  private splitParagraph(para: string, format?: FormatCallback) {
    const count = this.count;
    para.split(regex.item).forEach((item, i) => {
      if (i % 2 == 0) {
        this.splitItem(item, format);
      } else {
        if (this.count > count) {
          this.addBreak();
        }
        this.addWord(item);
      }
    });
  }

  /**
   * Splits a list item into words and style sequences, and appends them to the list.
   * @param item The list item to be split
   * @param format An optional callback to process format specifiers
   */
  private splitItem(item: string, format?: FormatCallback) {
    const boundFormat = format?.bind(this);
    const words = item.split(regex.word);
    for (const word of words) {
      if (!word) {
        continue;
      }
      if (boundFormat) {
        const parts = word.split(regex.spec);
        if (parts.length > 1) {
          this.addWord(parts[0]);
          for (let i = 1, merge = parts[0] !== ''; i < parts.length; i += 2, merge = true) {
            this.setMerge(merge);
            boundFormat(parts[i]);
            this.addClosing(parts[i + 1]);
          }
          continue;
        }
      }
      const styles = word.match(regex.styles) ?? [];
      const length = styles.reduce((acc, str) => acc + str.length, 0);
      this.addText(word, word.length - length);
    }
  }

  /**
   * Wraps the internal strings to fit in a terminal width.
   * @param result The resulting strings to append to
   * @param column The current terminal column
   * @param width The desired terminal width (or zero to avoid wrapping)
   * @param emitStyles True if styles should be emitted
   * @returns The updated terminal column
   */
  wrapToWidth(result: Array<string>, column: number, width: number, emitStyles: boolean): number {
    /** @ignore */
    function shorten() {
      while (result.length && column > start) {
        const last = result[result.length - 1];
        if (last.length > column - start) {
          result[result.length - 1] = last.slice(0, start - column); // cut the last string
          break;
        }
        column -= last.length;
        result.length--; // pop the last string
      }
    }
    /** @ignore */
    function align() {
      if (needToAlign && j < result.length && column < width) {
        const rem = width - column; // remaining columns until right boundary
        const pad = emitStyles ? sequence(cs.cuf, rem) : ' '.repeat(rem);
        result.splice(j, 0, pad); // insert padding at the indentation boundary
        column = width;
      }
    }
    /** @ignore */
    function adjust() {
      const pad = !largestFits
        ? '\n'
        : emitStyles
          ? sequence(cs.cha, start + 1)
          : column < start
            ? ' '.repeat(start - column)
            : '';
      if (pad) {
        result.push(pad);
      } else {
        shorten(); // adjust backwards: shorten the current line
      }
    }
    if (!this.count) {
      return column;
    }
    column = Math.max(0, column);
    width = Math.max(0, width);
    let start = Math.max(0, this.indent);

    const needToAlign = width && this.rightAlign;
    const largestFits = !width || width >= start + Math.max(...this.lengths);
    if (!largestFits) {
      start = 0; // wrap to the first column instead
    }
    const indent = start ? (emitStyles ? sequence(cs.cha, start + 1) : ' '.repeat(start)) : '';
    if (column != start && !this.strings[0].startsWith('\n')) {
      adjust();
      column = start;
    }

    let j = result.length; // save index for right-alignment
    for (let i = 0; i < this.count; ++i) {
      let str = this.strings[i];
      if (str.startsWith('\n')) {
        align();
        j = result.push(str); // save index for right-alignment
        column = 0;
        continue;
      }
      if (!column && indent) {
        j = result.push(indent); // save index for right-alignment
        column = start;
      }
      const len = this.lengths[i];
      if (!len) {
        if (emitStyles) {
          result.push(str);
        }
        continue;
      }
      if (!emitStyles) {
        str = str.replace(regex.styles, '');
      }
      if (column === start) {
        result.push(str);
        column += len;
      } else if (!width || column + 1 + len <= width) {
        result.push(' ' + str);
        column += 1 + len;
      } else {
        align();
        j = result.push('\n' + indent, str) - 1; // save index for right-alignment
        column = start + len;
      }
    }
    align();
    return column;
  }
}

/**
 * A terminal message. Used as base for other message classes.
 */
export class TerminalMessage extends Array<TerminalString> {
  /**
   * Wraps the help message to a specified width.
   * @param width The terminal width (or zero to avoid wrapping)
   * @param emitStyles True if styles should be emitted
   * @returns The message to be printed on a terminal
   */
  wrap(width = 0, emitStyles = !omitStyles(width)): string {
    const result = new Array<string>();
    let column = 0;
    for (const str of this) {
      column = str.wrapToWidth(result, column, width, emitStyles);
    }
    if (emitStyles) {
      result.push(sgr(tf.clear));
    }
    return result.join('');
  }

  /**
   * @returns The wrapped message
   */
  override toString(): string {
    return this.wrap(overrides.stdoutCols ?? process?.stdout?.columns);
  }

  /**
   * @returns The wrapped message
   */
  get message(): string {
    return this.toString();
  }
}

/**
 * A help message.
 */
export class HelpMessage extends TerminalMessage {}

/**
 * A warning message.
 */
export class WarnMessage extends TerminalMessage {
  /**
   * @returns The wrapped message
   */
  override toString(): string {
    return this.wrap(overrides.stderrCols ?? process?.stderr?.columns);
  }
}

/**
 * An error message.
 */
export class ErrorMessage extends Error {
  /**
   * The terminal message.
   */
  readonly msg: TerminalMessage;

  /**
   * Creates an error message
   * @param str The terminal string
   */
  constructor(str: TerminalString) {
    super(); // do not wrap the message now. wait until it is actually needed
    this.msg = new WarnMessage(str);
  }

  /**
   * We have to override this, since the message cannot be transformed after being wrapped.
   * @returns The wrapped message
   */
  override toString(): string {
    return this.msg.toString();
  }

  /**
   * @returns The wrapped message
   */
  get message(): string {
    return this.toString();
  }
}

/**
 * A completion message.
 */
export class CompletionMessage extends Array<string> {
  /**
   * @returns The wrapped message
   */
  override toString(): string {
    return this.join('\n');
  }

  /**
   * @returns The wrapped message
   */
  get message(): string {
    return this.toString();
  }
}

/**
 * A version message.
 */
export class VersionMessage extends String {
  /**
   * @returns The wrapped message
   */
  get message(): string {
    return this.toString();
  }
}

//--------------------------------------------------------------------------------------------------
// Functions
//--------------------------------------------------------------------------------------------------
/**
 * @param width The terminal width (in number of columns)
 * @returns True if styles should be omitted from terminal strings
 * @see https://clig.dev/#output
 */
function omitStyles(width: number): boolean {
  return (
    !process?.env['FORCE_COLOR'] &&
    (!width || !!process?.env['NO_COLOR'] || process?.env['TERM'] === 'dumb')
  );
}

/**
 * Creates a control sequence.
 * @template T The type of the sequence command
 * @param cmd The sequence command
 * @param params The sequence parameters
 * @returns The control sequence
 */
function sequence<T extends cs>(cmd: T, ...params: Array<number>): CSI<string, T> {
  return `\x9b${params.join(';')}${cmd}`;
}

/**
 * Creates an SGR sequence.
 * @param attrs The text styling attributes
 * @returns The SGR sequence
 */
function sgr(...attrs: Array<StyleAttr>): Style {
  return sequence(cs.sgr, ...attrs.flat());
}

/**
 * Creates a foreground color.
 * @param color The color decimal value
 * @returns The foreground color
 */
function foreground(color: Decimal): FgColor {
  return [38, 5, color];
}

/**
 * Creates a background color.
 * @param color The color decimal value
 * @returns The background color
 */
function background(color: Decimal): BgColor {
  return [48, 5, color];
}

/**
 * Creates an underline color.
 * @param color The color decimal value
 * @returns The underline color
 */
function underline(color: Decimal): UlColor {
  return [58, 5, color];
}
