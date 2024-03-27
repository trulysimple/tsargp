//--------------------------------------------------------------------------------------------------
// Imports and Exports
//--------------------------------------------------------------------------------------------------
import type { Alias, Concrete, Enumerate, URL } from './utils';
import { cs, tf, fg, bg, ul } from './enums';
import { overrides, splitPhrase } from './utils';

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

/**
 * The formatting functions.
 * @internal
 */
export const format = {
  /**
   * The formatting function for boolean values.
   */
  b: formatBool,
  /**
   * The formatting function for string values.
   */
  s: formatString,
  /**
   * The formatting function for number values.
   */
  n: formatNumber,
  /**
   * The formatting function for regex values.
   */
  r: formatRegExp,
  /**
   * The formatting function for option names.
   */
  o: formatOption,
  /**
   * The formatting function for generic values.
   */
  v: formatValue,
  /**
   * The formatting function for URLs.
   */
  u: formatURL,
  /**
   * The formatting function for general text.
   */
  t: formatText,
  /**
   * The formatting function for previously formatted terminal strings.
   */
  p: formatPrev,
} as const satisfies FormatFunctions;

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
 * A set of formatting arguments.
 */
export type FormatArgs = Record<string, unknown>;

/**
 * A formatting function.
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FormatFunction = (value: any, styles: FormatStyles, result: TerminalString) => void;

/**
 * A set of formatting functions.
 * @internal
 */
export type FormatFunctions = Record<string, FormatFunction>;

/**
 * A message that can be printed on a terminal.
 */
export type Message = ErrorMessage | HelpMessage | WarnMessage | VersionMessage | CompletionMessage;

/**
 * A set of styles for terminal messages.
 */
export type MessageStyles = {
  /**
   * The style of boolean values.
   */
  readonly boolean?: Style;
  /**
   * The style of string values.
   */
  readonly string?: Style;
  /**
   * The style of number values.
   */
  readonly number?: Style;
  /**
   * The style of regular expressions.
   */
  readonly regex?: Style;
  /**
   * The style of option names.
   */
  readonly option?: Style;
  /**
   * A style for generic (or unknown) values.
   */
  readonly value?: Style;
  /**
   * The style of URLs.
   */
  readonly url?: Style;
  /**
   * The style of general text.
   */
  readonly text?: Style;
};

/**
 * A concrete version of the format styles.
 * @internal
 */
export type FormatStyles = Concrete<MessageStyles> & {
  /**
   * The current style in use.
   */
  current?: Style;
};

/**
 * Configuration for the formatting of arguments.
 */
export type FormatConfig = {
  /**
   * The phrase alternative, if any.
   */
  readonly alt?: number;
  /**
   * A pair of brackets for array values.
   */
  readonly brackets?: [string, string];
  /**
   * An element separator for array values.
   */
  readonly sep?: string;
  /**
   * Whether the separator should be merged with the previous value. (Defaults to true)
   */
  readonly merge?: boolean;
  /**
   * Whether the separator should be merged with the next value. (Defaults to false)
   */
  readonly mergeAfter?: boolean;
};

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
    const count = this.count;
    let i = 0;
    if (count && this.merge && other.count) {
      this.strings[count - 1] += other.strings[0];
      this.lengths[count - 1] += other.lengths[0];
      i++;
    }
    for (; i < other.count; ++i) {
      this.strings.push(other.strings[i]);
      this.lengths.push(other.lengths[i]);
    }
    this.merge = other.merge;
    return this;
  }

  /**
   * Sets a flag to merge the next word to the last word.
   * @param value The flag value (defaults to true)
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
    return word ? this.addWord(word).setMerge() : this;
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
  addText(text: string, length: number): this {
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
      splitParagraph(this, para, format);
      if (i < paragraphs.length - 1) {
        this.addBreak(2);
      }
    });
    return this;
  }

  /**
   * Formats a set of arguments.
   * @param styles The format styles
   * @param phrase The format phrase
   * @param args The format arguments
   * @param config The format config
   * @returns The terminal string instance
   */
  formatArgs(styles: FormatStyles, phrase: string, args?: FormatArgs, config?: FormatConfig): this {
    const formatFn = args && formatArgs(styles, args, config);
    const alternative = config?.alt !== undefined ? splitPhrase(phrase)[config.alt] : phrase;
    return this.splitText(alternative, formatFn);
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
 * Splits a paragraph into words and style sequences, and appends them to the list.
 * @param result The resulting string
 * @param para The paragraph to be split
 * @param format An optional callback to process format specifiers
 */
function splitParagraph(result: TerminalString, para: string, format?: FormatCallback) {
  const count = result.count;
  para.split(regex.item).forEach((item, i) => {
    if (i % 2 == 0) {
      splitItem(result, item, format);
    } else {
      if (result.count > count) {
        result.addBreak();
      }
      result.addWord(item);
    }
  });
}

/**
 * Splits a list item into words and style sequences, and appends them to the list.
 * @param result The resulting string
 * @param item The list item to be split
 * @param format An optional callback to process format specifiers
 */
function splitItem(result: TerminalString, item: string, format?: FormatCallback) {
  const boundFormat = format?.bind(result);
  const words = item.split(regex.word);
  for (const word of words) {
    if (!word) {
      continue;
    }
    if (boundFormat) {
      const parts = word.split(regex.spec);
      if (parts.length > 1) {
        result.addOpening(parts[0]);
        for (let i = 1; i < parts.length; i += 2) {
          boundFormat(parts[i]);
          result.addClosing(parts[i + 1]).setMerge();
        }
        result.setMerge(false);
        continue;
      }
    }
    const styles = word.match(regex.styles) ?? [];
    const length = styles.reduce((acc, str) => acc + str.length, 0);
    result.addText(word, word.length - length);
  }
}

/**
 * Creates a formatting callback from a set of styles and arguments.
 * @param styles The format styles
 * @param args The format arguments
 * @param config The format config
 * @returns The formatting callback
 */
function formatArgs(
  styles: FormatStyles,
  args: FormatArgs,
  config: FormatConfig = { brackets: ['[', ']'], sep: ',' },
): FormatCallback {
  return function (this: TerminalString, spec: string) {
    const arg = spec.slice(1);
    const fmt = arg[0];
    if (fmt in format && arg in args) {
      const value = args[arg];
      const formatFn = (format as FormatFunctions)[fmt];
      if (Array.isArray(value)) {
        if (config?.brackets) {
          this.addOpening(config.brackets[0]);
        }
        value.forEach((val, i) => {
          formatFn(val, styles, this);
          if (config?.sep && i < value.length - 1) {
            this.setMerge(config.merge)
              .addWord(config.sep)
              .setMerge(config.mergeAfter ?? false);
          }
        });
        if (config?.brackets) {
          this.addClosing(config.brackets[1]);
        }
      } else {
        formatFn(value, styles, this);
      }
    }
  };
}

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

/**
 * Formats a boolean value to be printed on the terminal.
 * @param value The boolean value
 * @param styles The format styles
 * @param result The resulting string
 */
function formatBool(value: boolean, styles: FormatStyles, result: TerminalString) {
  result.addAndRevert(styles.boolean, `${value}`, styles.current ?? styles.text);
}

/**
 * Formats a string value to be printed on the terminal.
 * @param value The string value
 * @param styles The format styles
 * @param result The resulting string
 */
function formatString(value: string, styles: FormatStyles, result: TerminalString) {
  result.addAndRevert(styles.string, `'${value}'`, styles.current ?? styles.text);
}

/**
 * Formats a number value to be printed on the terminal.
 * @param value The number value
 * @param styles The format styles
 * @param result The resulting string
 */
function formatNumber(value: number, styles: FormatStyles, result: TerminalString) {
  result.addAndRevert(styles.number, `${value}`, styles.current ?? styles.text);
}

/**
 * Formats a regex value to be printed on the terminal.
 * @param value The regex value
 * @param styles The format styles
 * @param result The resulting string
 */
function formatRegExp(value: RegExp, styles: FormatStyles, result: TerminalString) {
  result.addAndRevert(styles.regex, `${value}`, styles.current ?? styles.text);
}

/**
 * Formats a URL value to be printed on the terminal.
 * @param value The URL value
 * @param styles The format styles
 * @param result The resulting string
 */
function formatURL(value: URL, styles: FormatStyles, result: TerminalString) {
  result.addAndRevert(styles.url, value.href, styles.current ?? styles.text);
}

/**
 * Formats an option name to be printed on the terminal.
 * @param name The option name
 * @param styles The format styles
 * @param result The resulting string
 */
function formatOption(name: string, styles: FormatStyles, result: TerminalString) {
  result.addAndRevert(styles.option, name, styles.current ?? styles.text);
}

/**
 * Formats a generic or unknown value to be printed on the terminal.
 * @param value The unknown value
 * @param styles The format styles
 * @param result The resulting string
 */
function formatValue(value: unknown, styles: FormatStyles, result: TerminalString) {
  result.addAndRevert(styles.value, `<${value}>`, styles.current ?? styles.text);
}

/**
 * Formats general text to be printed on the terminal.
 * @param text The text
 * @param _styles The format styles
 * @param result The resulting string
 */
function formatText(text: string, _styles: FormatStyles, result: TerminalString) {
  result.splitText(text);
}

/**
 * Formats a previously formatted terminal string.
 * @param str The terminal string
 * @param _styles The format styles
 * @param result The resulting string
 */
function formatPrev(str: TerminalString, _styles: FormatStyles, result: TerminalString) {
  result.addOther(str);
}
