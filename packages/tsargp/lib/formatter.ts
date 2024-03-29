//--------------------------------------------------------------------------------------------------
// Imports
//--------------------------------------------------------------------------------------------------
import type { Option, Options, Requires, ValuedOption, RequiresVal, ParamOption } from './options';
import type { Style } from './styles';
import type { Concrete } from './utils';
import type { ConcreteStyles, FormatFunction, OptionValidator } from './validator';

import { tf, HelpItem } from './enums';
import { RequiresAll, RequiresNot, RequiresOne, isArray, isVariadic, isNiladic } from './options';
import { HelpMessage, TerminalString, style } from './styles';
import { formatFunctions } from './validator';
import { assert, splitPhrase } from './utils';

//--------------------------------------------------------------------------------------------------
// Types
//--------------------------------------------------------------------------------------------------
/**
 * A text alignment setting.
 */
export type Alignment = 'left' | 'right';

/**
 * Defines attributes common to all help columns.
 * @template A The type of text alignment
 */
export type WithColumn<A = Alignment> = {
  /**
   * The text alignment for this column. (Defaults to 'left')
   */
  readonly align?: A;
  /**
   * The indentation level for this column. (Defaults to 2)
   */
  readonly indent?: number;
  /**
   * The number of line breaks to insert before each entry in this column. (Defaults to 0)
   */
  readonly breaks?: number;
  /**
   * Whether the column should be hidden. (Defaults to false)
   */
  readonly hidden?: boolean;
};

/**
 * Defines attributes for columns that may be preceded by other columns.
 */
export type WithAbsolute = {
  /**
   * Whether the indentation level should be relative to the beginning of the line instead of the
   * end of the previous column. (Defaults to false)
   */
  readonly absolute?: boolean;
};

/**
 * The help format configuration.
 */
export type HelpConfig = {
  /**
   * The settings for the names column.
   */
  readonly names?: WithColumn<Alignment | 'slot'>;
  /**
   * The settings for the parameter column.
   */
  readonly param?: WithColumn & WithAbsolute;
  /**
   * The settings for the description column.
   */
  readonly descr?: WithColumn & WithAbsolute;
  /**
   * The order of items to be shown in the option description.
   * @see HelpItem
   */
  readonly items?: ReadonlyArray<HelpItem>;
  /**
   * The phrases to be used for each kind of description item.
   *
   * If an item has a value, the `%s` specifier can be used to indicate where in the phrase to place
   * the value. If an item has multiple alternatives, such as {@link HelpItem.case}, different texts
   * can separated with `|` and grouped in parentheses, like this:
   * `'Values will be converted to (lowercase|uppercase)'`.
   */
  readonly phrases?: Readonly<Partial<Record<HelpItem, string>>>;
};

/**
 * A concrete version of the help column settings.
 */
type ConcreteColumn = Concrete<WithColumn>;

/**
 * A concrete version of the format configuration.
 */
type ConcreteFormat = Concrete<HelpConfig>;

/**
 * Precomputed texts used by the formatter.
 */
type HelpEntry = {
  readonly names: Array<TerminalString>;
  readonly param: TerminalString;
  readonly descr: TerminalString;
};

/**
 * Defines attributes common to all help sections.
 */
export type WithKind<T extends string> = {
  /**
   * The kind of section.
   */
  readonly type: T;
};

/**
 * Defines attributes for a help section with text.
 */
export type WithText = {
  /**
   * The section text. May contain inline styles.
   */
  readonly text: string;
};

/**
 * Defines attributes for a help section with wrapping.
 */
export type WithWrap = {
  /**
   * True to disable text wrapping of the provided text or headings.
   */
  readonly noWrap?: true;
};

/**
 * Defines attributes for a help section with a title.
 */
export type WithTitle = {
  /**
   * The heading text. May contain inline styles.
   */
  readonly title?: string;
  /**
   * The style of headings. (Defaults to tf.bold)
   */
  readonly style?: Style;
};

/**
 * Defines attributes for a help section with indentation.
 */
export type WithIndent = {
  /**
   * The indentation level of the section content. (Defaults to 0)
   */
  readonly indent?: number;
};

/**
 * Defines attributes for a help section with filter.
 */
export type WithFilter = {
  /**
   * A list of options keys or group names to include or exclude.
   */
  readonly filter?: Array<string>;
  /**
   * True if the filter should exclude.
   */
  readonly exclude?: true;
};

/**
 * Defines attributes for a help section with phrase.
 */
export type WithPhrase = {
  /**
   * A custom phrase for group headings.
   */
  readonly phrase?: string;
};

/**
 * A help text section.
 */
export type HelpText = WithKind<'text'> & WithText & WithWrap & WithIndent;

/**
 * A help usage section.
 */
export type HelpUsage = WithKind<'usage'> & WithTitle & WithWrap & WithIndent & WithFilter;

/**
 * A help groups section.
 */
export type HelpGroups = WithKind<'groups'> & WithTitle & WithWrap & WithPhrase & WithFilter;

/**
 * A help section.
 */
export type HelpSection = HelpText | HelpUsage | HelpGroups;

/**
 * A list of help sections.
 */
export type HelpSections = Array<HelpSection>;

//--------------------------------------------------------------------------------------------------
// Constants
//--------------------------------------------------------------------------------------------------
/**
 * The default column configuration.
 */
const defaultColumn: ConcreteColumn = {
  align: 'left',
  indent: 2,
  breaks: 0,
  hidden: false,
};

/**
 * The default configuration used by the formatter.
 */
const defaultConfig: ConcreteFormat = {
  names: defaultColumn,
  param: { ...defaultColumn, absolute: false },
  descr: { ...defaultColumn, absolute: false },
  items: [
    HelpItem.synopsis,
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
    HelpItem.link,
    HelpItem.envVar,
    HelpItem.requiredIf,
    HelpItem.clusterLetters,
  ],
  phrases: {
    [HelpItem.synopsis]: '%s',
    [HelpItem.negation]: 'Can be negated with %s.',
    [HelpItem.separator]: 'Values are delimited by %s.',
    [HelpItem.variadic]: 'Accepts multiple parameters.',
    [HelpItem.positional]: 'Accepts positional parameters(| that may be preceded by %s).',
    [HelpItem.append]: 'May be specified multiple times.',
    [HelpItem.trim]: 'Values will be trimmed.',
    [HelpItem.case]: 'Values will be converted to (lowercase|uppercase).',
    [HelpItem.round]: 'Values will be rounded (towards zero|down|up|to the nearest integer).',
    [HelpItem.enums]: 'Values must be one of %s.',
    [HelpItem.regex]: 'Values must match the regex %s.',
    [HelpItem.range]: 'Values must be in the range %s.',
    [HelpItem.unique]: 'Duplicate values will be removed.',
    [HelpItem.limit]: 'Value count is limited to %s.',
    [HelpItem.requires]: 'Requires %s.',
    [HelpItem.required]: 'Always required.',
    [HelpItem.default]: 'Defaults to %s.',
    [HelpItem.deprecated]: 'Deprecated for %s.',
    [HelpItem.link]: 'Refer to %s for details.',
    [HelpItem.envVar]: 'Can be specified through the %s environment variable.',
    [HelpItem.requiredIf]: 'Required if %s.',
    [HelpItem.clusterLetters]: 'Can be clustered with %s.',
  },
};

//--------------------------------------------------------------------------------------------------
// Classes
//--------------------------------------------------------------------------------------------------
/**
 * Implements formatting of help messages for a set of option definitions.
 */
export class HelpFormatter {
  private readonly options: Options;
  private readonly styles: ConcreteStyles;
  private readonly groups = new Map<string, Array<HelpEntry>>();
  private readonly config: ConcreteFormat;
  private readonly nameWidths: Array<number> | number;
  private paramWidth = 0;

  /**
   * Keep this in-sync with {@link HelpItem}.
   */
  private readonly format: Array<typeof formatSynopsis> = [
    formatSynopsis,
    formatNegation,
    formatSeparator,
    formatVariadic,
    formatPositional,
    formatAppend,
    formatTrim,
    formatCase,
    formatRound,
    formatEnums,
    formatRegex,
    formatRange,
    formatUnique,
    formatLimit,
    this.formatRequires.bind(this),
    formatRequired,
    formatDefault,
    formatDeprecated,
    formatLink,
    formatEnvVar,
    this.formatRequiredIf.bind(this),
    formatClusterLetters,
  ];

  /**
   * Creates a help message formatter.
   * @param validator The validator instance
   * @param config The format configuration
   */
  constructor(validator: OptionValidator, config: HelpConfig = {}) {
    this.options = validator.options;
    this.styles = validator.config.styles;
    this.config = mergeConfig(config);
    this.nameWidths = this.config.names.hidden
      ? 0
      : this.config.names.align === 'slot'
        ? getNameWidths(this.options)
        : getMaxNamesWidth(this.options);
    for (const key in this.options) {
      const option = this.options[key];
      if (!option.hide) {
        this.formatOption(option);
      }
    }
    adjustEntries(this.groups, this.config, this.nameWidths, this.paramWidth);
  }

  /**
   * Formats an option to be printed on the terminal.
   * @param option The option definition
   */
  private formatOption(option: Option) {
    const names = this.formatNames(option);
    const param = this.formatParam(option);
    const descr = this.formatDescription(option);
    const entry: HelpEntry = { names, param, descr };
    const group = this.groups.get(option.group ?? '');
    if (!group) {
      this.groups.set(option.group ?? '', [entry]);
    } else {
      group.push(entry);
    }
  }

  /**
   * Formats an option's names to be printed on the terminal.
   * @param option The option definition
   * @returns A terminal string with the formatted names
   */
  private formatNames(option: Option): Array<TerminalString> {
    if (this.config.names.hidden || !option.names) {
      return [];
    }
    const style = option.styles?.names ?? this.styles.option;
    return formatNameSlots(this.config, option.names, this.nameWidths, style, this.styles.text);
  }

  /**
   * Formats an option's parameter to be printed on the terminal.
   * @param option The option definition
   * @returns A terminal string with the formatted option parameter
   */
  private formatParam(option: Option): TerminalString {
    if (this.config.param.hidden || isNiladic(option)) {
      return new TerminalString();
    }
    const result = new TerminalString(0, this.config.param.breaks);
    const len = formatParam(option, this.styles, this.styles.text, result);
    this.paramWidth = Math.max(this.paramWidth, len);
    result.indent = len; // hack: save the length, since we will need it in `adjustEntries`
    return result;
  }

  /**
   * Formats an option's description to be printed on the terminal.
   * The description always ends with a single line break.
   * @param option The option definition
   * @returns A terminal string with the formatted option description
   */
  private formatDescription(option: Option): TerminalString {
    if (this.config.descr.hidden || !this.config.items.length) {
      return new TerminalString(0, 1);
    }
    const descrStyle = option.styles?.descr ?? this.styles.text;
    const result = new TerminalString(
      0,
      this.config.descr.breaks,
      this.config.descr.align === 'right',
    ).addSequence(descrStyle);
    const count = result.count;
    for (const item of this.config.items) {
      const phrase = this.config.phrases[item];
      this.format[item](option, phrase, this.styles, descrStyle, result);
    }
    if (result.count == count) {
      return new TerminalString(0, 1); // this string does not contain any word
    }
    return result.addSequence(style(tf.clear)).addBreak(); // add ending breaks after styles
  }

  /**
   * Formats an option's requirements to be included in the description.
   * @param option The option definition
   * @param phrase The description item phrase
   * @param styles The set of styles
   * @param style The default style
   * @param result The resulting string
   */
  private formatRequires(
    option: Option,
    phrase: string,
    styles: ConcreteStyles,
    style: Style,
    result: TerminalString,
  ) {
    if ('requires' in option && option.requires) {
      const requires = option.requires;
      result.splitText(phrase, () => {
        formatRequirements(this.options, requires, styles, style, result);
      });
    }
  }

  /**
   * Formats an option's conditional requirements to be included in the description.
   * @param option The option definition
   * @param phrase The description item phrase
   * @param styles The set of styles
   * @param style The default style
   * @param result The resulting string
   */
  private formatRequiredIf(
    option: Option,
    phrase: string,
    styles: ConcreteStyles,
    style: Style,
    result: TerminalString,
  ) {
    if ('requiredIf' in option && option.requiredIf) {
      const requiredIf = option.requiredIf;
      result.splitText(phrase, () => {
        formatRequirements(this.options, requiredIf, styles, style, result);
      });
    }
  }

  /**
   * Formats a help message for the default option group.
   * Options are rendered in the same order as was declared in the option definitions.
   * @returns The formatted help message
   */
  formatHelp(): HelpMessage {
    return this.formatGroup() ?? new HelpMessage();
  }

  /**
   * Formats a help message for an option group.
   * Options are rendered in the same order as was declared in the option definitions.
   * @param name The group name (defaults to the default group)
   * @returns The formatted help message, if the group exists
   */
  formatGroup(name = ''): HelpMessage | undefined {
    const entries = this.groups.get(name);
    return entries ? formatEntries(entries) : undefined;
  }

  /**
   * Formats help messages for all option groups.
   * Options are rendered in the same order as was declared in the option definitions.
   * @returns The formatted help messages
   */
  formatGroups(): Map<string, HelpMessage> {
    const groups = new Map<string, HelpMessage>();
    for (const [group, entries] of this.groups.entries()) {
      groups.set(group, formatEntries(entries));
    }
    return groups;
  }

  /**
   * Formats a complete help message with sections.
   * Options are rendered in the same order as was declared in the option definitions.
   * @param sections The help sections
   * @param progName The program name, if any
   * @returns The formatted help message
   */
  formatSections(sections: HelpSections, progName = ''): HelpMessage {
    const help = new HelpMessage();
    for (const section of sections) {
      formatSection(this.options, this.groups, this.styles, section, progName, help);
    }
    return help;
  }
}

//--------------------------------------------------------------------------------------------------
// Functions
//--------------------------------------------------------------------------------------------------
/**
 * Merges a help configuration with the default configuration.
 * @param config The provided configuration
 * @returns The merged configuration
 */
function mergeConfig(config: HelpConfig): ConcreteFormat {
  return {
    names: { ...defaultConfig.names, ...config.names },
    param: { ...defaultConfig.param, ...config.param },
    descr: { ...defaultConfig.descr, ...config.descr },
    items: config.items ?? defaultConfig.items,
    phrases: { ...defaultConfig.phrases, ...config.phrases },
  };
}

/**
 * Gets the required width of each name slot in a set of option definitions.
 * @param options The option definitions
 * @returns The name slot widths
 */
function getNameWidths(options: Options): Array<number> {
  const result = new Array<number>();
  for (const key in options) {
    const option = options[key];
    if (!option.hide && option.names) {
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
 * Gets the maximum combined width of option names in a set of option definitions.
 * @param options The option definitions
 * @returns The maximum width
 */
function getMaxNamesWidth(options: Options): number {
  let result = 0;
  for (const key in options) {
    const option = options[key];
    if (!option.hide && option.names) {
      let len = 0;
      for (const name of option.names) {
        if (name) {
          len += (len ? 2 : 0) + name.length;
        }
      }
      result = Math.max(result, len);
    }
  }
  return result;
}

/**
 * Updates help entries to start at the appropriate terminal column.
 * @param groups The option groups
 * @param config The format configuration
 * @param namesWidth The width (or widths) of the names column
 * @param paramWidth The width of the param column
 */
function adjustEntries(
  groups: Map<string, Array<HelpEntry>>,
  config: ConcreteFormat,
  namesWidth: Array<number> | number,
  paramWidth: number,
) {
  if (typeof namesWidth !== 'number') {
    namesWidth = namesWidth.length ? namesWidth.reduce((acc, len) => acc + len + 2, -2) : 0;
  }
  const namesIndent = Math.max(0, config.names.indent);
  const paramIndent = config.param.absolute
    ? Math.max(0, config.param.indent)
    : namesIndent + namesWidth + config.param.indent;
  const descrIndent = config.descr.absolute
    ? Math.max(0, config.descr.indent)
    : paramIndent + paramWidth + config.descr.indent;
  for (const entries of groups.values()) {
    for (const { param, descr } of entries) {
      param.indent = paramIndent + (config.param.align === 'left' ? 0 : paramWidth - param.indent);
      descr.indent = descrIndent;
    }
  }
}

/**
 * Formats a list of names to be printed on the terminal.
 * @param config The format configuration
 * @param names The list of option names
 * @param nameWidths The name slot widths
 * @param namesStyle The style to apply
 * @param defStyle The default style
 * @returns The resulting strings
 */
function formatNameSlots(
  config: ConcreteFormat,
  names: ReadonlyArray<string | null>,
  nameWidths: Array<number> | number,
  namesStyle: Style,
  defStyle: Style,
): Array<TerminalString> {
  if (typeof nameWidths === 'number') {
    const result = new TerminalString(config.names.indent, config.names.breaks);
    let len = 0;
    for (const name of names) {
      if (name) {
        if (len) {
          result.addClosing(',');
          len += 2;
        }
        len += name.length;
        result.addAndRevert(namesStyle, name, defStyle);
      }
    }
    if (config.names.align === 'right') {
      result.indent += nameWidths - len;
    }
    return [result];
  }
  const result = new Array<TerminalString>();
  let str: TerminalString | undefined;
  let indent = Math.max(0, config.names.indent);
  let breaks = config.names.breaks;
  names.forEach((name, i) => {
    if (name) {
      if (str) {
        str.addClosing(',');
      }
      str = new TerminalString(indent, breaks).addAndRevert(namesStyle, name, defStyle);
      result.push(str);
      breaks = 0; // break only on the first name
    } else {
      str = undefined;
    }
    indent += nameWidths[i] + 2;
  });
  return result;
}

/**
 * Formats a value from an option's property.
 * @param option The option definition
 * @param value The option value
 * @param result The resulting string
 * @param styles The set of styles
 * @param style The default style
 * @param inDesc True if in the description
 */
function formatValue(
  option: ValuedOption,
  value: unknown,
  result: TerminalString,
  styles: ConcreteStyles,
  style: Style,
  inDesc: boolean,
) {
  switch (typeof value) {
    case 'boolean':
      formatFunctions.b(value, styles, style, result);
      break;
    case 'string':
      formatFunctions.s(value, styles, style, result);
      break;
    case 'number':
      formatFunctions.n(value, styles, style, result);
      break;
    default:
      if (isArray(option) && Array.isArray(value)) {
        const formatFn = option.type === 'strings' ? formatFunctions.s : formatFunctions.n;
        if (inDesc) {
          formatArray(value, style, result, styles, formatFn, ['[', ']'], ',');
        } else if ('separator' in option && option.separator) {
          const sep = option.separator;
          const text = value.join(typeof sep === 'string' ? sep : sep.source);
          formatFunctions.s(text, styles, style, result);
        } else {
          formatArray(value, style, result, styles, formatFn);
        }
      } else if (value !== undefined) {
        formatFunctions.p(value, styles, style, result);
      }
  }
}

/**
 * Formats a list of values to be printed on the terminal.
 * @param values The array values
 * @param style The style to be applied
 * @param result The resulting string
 * @param styles The set of styles
 * @param formatFn The function to convert a value to string
 * @param brackets An optional pair of brackets to surround the values
 * @param separator An optional separator to delimit the values
 */
function formatArray(
  values: ReadonlyArray<string> | ReadonlyArray<number>,
  style: Style,
  result: TerminalString,
  styles: ConcreteStyles,
  formatFn: FormatFunction,
  brackets?: [string, string],
  separator?: string,
) {
  if (brackets) {
    result.addOpening(brackets[0]);
  }
  values.forEach((value, i) => {
    formatFn(value, styles, style, result);
    if (separator && i < values.length - 1) {
      result.addClosing(separator);
    }
  });
  if (brackets) {
    result.addClosing(brackets[1]);
  }
}

/**
 * Formats a help message from a list of help entries.
 * @param entries The help entries
 * @returns The formatted help message
 */
function formatEntries(entries: Array<HelpEntry>): HelpMessage {
  const result = new HelpMessage();
  for (const { names, param, descr } of entries) {
    result.push(...names, param, descr);
  }
  return result;
}

/**
 * Formats a help section to be included in the full help message.
 * Options are rendered in the same order as was declared in the option definitions.
 * @param options The option definitions
 * @param groups The option groups
 * @param styles The set of styles
 * @param section The help section
 * @param progName The program name
 * @param result The resulting message
 */
function formatSection(
  options: Options,
  groups: Map<string, Array<HelpEntry>>,
  styles: ConcreteStyles,
  section: HelpSection,
  progName: string,
  result: HelpMessage,
) {
  let breaks = result.length ? 2 : 0;
  switch (section.type) {
    case 'text': {
      const { text, indent, noWrap } = section;
      if (text) {
        result.push(formatText(text, styles.text, indent, breaks, noWrap));
      }
      break;
    }
    case 'usage':
      formatUsageSection(options, styles, breaks, section, progName, result);
      break;
    case 'groups':
      formatGroupsSection(groups, breaks, section, result);
      break;
  }
}

/**
 * Formats a usage section text to be included in the full help message.
 * @param options The option definitions
 * @param styles The set of styles
 * @param breaks The number of line breaks
 * @param section The help section
 * @param progName The program name
 * @param result The resulting message
 */
function formatUsageSection(
  options: Options,
  styles: ConcreteStyles,
  breaks: number,
  section: HelpUsage,
  progName: string,
  result: HelpMessage,
) {
  const { title, indent, noWrap, filter, exclude, style: sty } = section;
  if (title) {
    result.push(formatText(title, sty ?? style(tf.bold), 0, breaks, noWrap));
    breaks = 2;
  }
  let indent2 = indent;
  if (progName) {
    result.push(formatText(progName, styles.text, indent, breaks, true));
    indent2 = Math.max(0, indent ?? 0) + progName.length + 1;
    breaks = 0;
  }
  const filterKeys = filter ? new Set(filter) : undefined;
  result.push(formatUsage(options, styles, styles.text, indent2, breaks, filterKeys, exclude));
}

/**
 * Formats a groups section to be included in the full help message.
 * Options are rendered in the same order as was declared in the option definitions.
 * @param groups The option groups
 * @param breaks The number of line breaks
 * @param section The help section
 * @param result The resulting message
 */
function formatGroupsSection(
  groups: Map<string, Array<HelpEntry>>,
  breaks: number,
  section: HelpGroups,
  result: HelpMessage,
) {
  const { phrase, title, noWrap, filter, exclude, style: sty } = section;
  const filterGroups = filter ? new Set(filter) : undefined;
  for (const [group, entries] of groups.entries()) {
    if ((filterGroups?.has(group) ?? !exclude) != !!exclude) {
      const title2 = group || title;
      const heading = title2
        ? formatText(title2, sty ?? style(tf.bold), 0, breaks, noWrap, phrase).addBreak(2)
        : new TerminalString(0, breaks);
      result.push(heading, ...formatEntries(entries));
      result[result.length - 1].pop(); // remove trailing break
      breaks = 2;
    }
  }
}

/**
 * Formats a custom text to be included in a help section.
 * @param text The heading title or section text
 * @param defStyle The default style
 * @param indent The indentation level (negative values are replaced by zero)
 * @param breaks The number of line breaks (non-positive values are ignored)
 * @param noWrap True if the provided text should not be split
 * @param phrase The custom phrase, if any
 * @returns The terminal string
 */
function formatText(
  text: string,
  defStyle: Style,
  indent?: number,
  breaks?: number,
  noWrap = false,
  phrase?: string,
): TerminalString {
  /** @ignore */
  function format() {
    if (noWrap) {
      result.addWord(text); // warning: may be larger than the terminal width
    } else {
      result.splitText(text);
    }
  }
  const result = new TerminalString(indent, breaks).addSequence(defStyle);
  if (phrase) {
    result.splitText(phrase, format);
  } else {
    format();
  }
  return result.addSequence(style(tf.clear)); // to simplify client code
}

/**
 * Formats a usage text to be included in a help section.
 * Options are rendered in the same order as was declared in the option definitions.
 * @param options The option definitions
 * @param styles The set of styles
 * @param defStyle The default style
 * @param indent The indentation level (negative values are replaced by zero)
 * @param breaks The number of line breaks (non-positive values are ignored)
 * @param filterKeys An optional set of options keys to filter
 * @param exclude Whether the filter should exclude
 * @returns The terminal string
 */
function formatUsage(
  options: Options,
  styles: ConcreteStyles,
  defStyle: Style,
  indent?: number,
  breaks?: number,
  filterKeys?: Set<string>,
  exclude = false,
): TerminalString {
  const result = new TerminalString(indent, breaks).addSequence(defStyle);
  const count = result.count;
  for (const key in options) {
    const option = options[key];
    if (!option.hide && (filterKeys?.has(key) ?? !exclude) != exclude) {
      formatUsageOption(option, styles, defStyle, result);
    }
  }
  if (result.count == count) {
    return new TerminalString(); // this string does not contain any word
  }
  return result.addSequence(style(tf.clear)); // to simplify client code
}

/**
 * Formats an option to be included in the the usage text.
 * @param option The option definition
 * @param styles The set of styles
 * @param style The default style
 * @param result The resulting string
 */
function formatUsageOption(
  option: Option,
  styles: ConcreteStyles,
  style: Style,
  result: TerminalString,
) {
  const required = 'required' in option && option.required;
  if (!required) {
    result.addOpening('[');
  }
  formatUsageNames(option, styles, style, result);
  if (!isNiladic(option)) {
    formatParam(option, styles, style, result);
  }
  if (!required) {
    result.addClosing(']');
  }
}

/**
 * Formats an option's names to be included in the usage text.
 * @param option The option definition
 * @param styles The set of styles
 * @param style The default style
 * @param result The resulting string
 */
function formatUsageNames(
  option: Option,
  styles: ConcreteStyles,
  style: Style,
  result: TerminalString,
) {
  const names = option.names?.filter((name): name is string => !!name);
  if (names?.length) {
    if ('negationNames' in option && option.negationNames) {
      names.push(...option.negationNames.filter((name) => name));
    }
    const positional = 'positional' in option && option.positional;
    if (typeof positional === 'string') {
      names.push(positional);
    }
    if (positional) {
      result.addOpening('[');
    }
    if (names.length > 1) {
      result.addOpening('(');
      names.forEach((name, i) => {
        formatFunctions.o(name, styles, style, result);
        if (i < names.length - 1) {
          result.addClosing('|').setMerge();
        }
      });
      result.addClosing(')');
    } else {
      formatFunctions.o(names[0], styles, style, result);
    }
    if (positional) {
      result.addClosing(']');
    }
  }
}

/**
 * Formats an option's parameter to be included in the description or the usage text.
 * @param option The option definition
 * @param styles The set of styles
 * @param style The default style
 * @param result The resulting string
 * @returns The string length, counting spaces in example values
 */
function formatParam(
  option: ParamOption,
  styles: ConcreteStyles,
  style: Style,
  result: TerminalString,
): number {
  const variadic = isArray(option) && isVariadic(option);
  if ('example' in option && option.example !== undefined) {
    formatValue(option, option.example, result, styles, style, false);
    return result.length + (variadic ? option.example.length - 1 : 0);
  }
  const ellipsis = variadic ? '...' : '';
  const paramStyle = option.styles?.param ?? styles.param;
  const param =
    'paramName' in option && option.paramName
      ? option.paramName.includes('<')
        ? option.paramName
        : `<${option.paramName}>${ellipsis}`
      : `<${option.type}>${ellipsis}`;
  result.addAndRevert(paramStyle, param, style);
  return param.length;
}

/**
 * Formats an option's synopsis to be included in the description.
 * @param option The option definition
 * @param phrase The description item phrase
 * @param _styles unused
 * @param _style unused
 * @param result The resulting string
 */
function formatSynopsis(
  option: Option,
  phrase: string,
  _styles: ConcreteStyles,
  _style: Style,
  result: TerminalString,
) {
  if (option.desc) {
    const text = option.desc;
    result.splitText(phrase, () => result.splitText(text));
  }
}

/**
 * Formats an option's negation names to be included in the description.
 * @param option The option definition
 * @param phrase The description item phrase
 * @param styles The set of styles
 * @param style The default style
 * @param result The resulting string
 */
function formatNegation(
  option: Option,
  phrase: string,
  styles: ConcreteStyles,
  style: Style,
  result: TerminalString,
) {
  if ('negationNames' in option && option.negationNames) {
    const names = option.negationNames.filter((name) => name);
    result.splitText(phrase, () => {
      names.forEach((name, i) => {
        formatFunctions.o(name, styles, style, result);
        if (i < names.length - 1) {
          result.addWord('or');
        }
      });
    });
  }
}

/**
 * Formats an option's separator string to be included in the description.
 * @param option The option definition
 * @param phrase The description item phrase
 * @param styles The set of styles
 * @param style The default style
 * @param result The resulting string
 */
function formatSeparator(
  option: Option,
  phrase: string,
  styles: ConcreteStyles,
  style: Style,
  result: TerminalString,
) {
  if ('separator' in option && option.separator) {
    const sep = option.separator;
    const formatFn = typeof sep === 'string' ? formatFunctions.s : formatFunctions.r;
    type FormatFn = (
      value: string | RegExp,
      styles: ConcreteStyles,
      style: Style,
      result: TerminalString,
    ) => void;
    result.splitText(phrase, () => {
      (formatFn as FormatFn)(sep, styles, style, result);
    });
  }
}

/**
 * Formats an option's variadic nature to be included in the description.
 * @param option The option definition
 * @param phrase The description item phrase
 * @param _styles unused
 * @param _style unused
 * @param result The resulting string
 */
function formatVariadic(
  option: Option,
  phrase: string,
  _styles: ConcreteStyles,
  _style: Style,
  result: TerminalString,
) {
  if (isArray(option) && isVariadic(option)) {
    result.splitText(phrase);
  }
}

/**
 * Formats an option's positional attribute to be included in the description.
 * @param option The option definition
 * @param phrase The description item phrase
 * @param styles The set of styles
 * @param style The default style
 * @param result The resulting string
 */
function formatPositional(
  option: Option,
  phrase: string,
  styles: ConcreteStyles,
  style: Style,
  result: TerminalString,
) {
  if ('positional' in option && option.positional) {
    const pos = option.positional;
    const [p, m] = splitPhrase(phrase);
    if (pos === true || !m) {
      result.splitText(p);
    } else {
      result.splitText(m, () => {
        formatFunctions.o(pos, styles, style, result);
      });
    }
  }
}

/**
 * Formats an option's append attribute to be included in the description.
 * @param option The option definition
 * @param phrase The description item phrase
 * @param _styles unused
 * @param _style unused
 * @param result The resulting string
 */
function formatAppend(
  option: Option,
  phrase: string,
  _styles: ConcreteStyles,
  _style: Style,
  result: TerminalString,
) {
  if ('append' in option && option.append) {
    result.splitText(phrase);
  }
}

/**
 * Formats an option's trim normalization to be included in the description.
 * @param option The option definition
 * @param phrase The description item phrase
 * @param _styles unused
 * @param _style unused
 * @param result The resulting string
 */
function formatTrim(
  option: Option,
  phrase: string,
  _styles: ConcreteStyles,
  _style: Style,
  result: TerminalString,
) {
  if ('trim' in option && option.trim) {
    result.splitText(phrase);
  }
}

/**
 * Formats an option's case normalization to be included in the description.
 * @param option The option definition
 * @param phrase The description item phrase
 * @param _styles unused
 * @param _style unused
 * @param result The resulting string
 */
function formatCase(
  option: Option,
  phrase: string,
  _styles: ConcreteStyles,
  _style: Style,
  result: TerminalString,
) {
  if ('case' in option && option.case) {
    const [l, u] = splitPhrase(phrase);
    result.splitText(option.case === 'lower' || !u ? l : u);
  }
}

/**
 * Formats an option's rounding normalization to be included in the description.
 * @param option The option definition
 * @param phrase The description item phrase
 * @param _styles unused
 * @param _style unused
 * @param result The resulting string
 */
function formatRound(
  option: Option,
  phrase: string,
  _styles: ConcreteStyles,
  _style: Style,
  result: TerminalString,
) {
  if ('round' in option && option.round) {
    const round = option.round;
    const [t, f, c, r] = splitPhrase(phrase);
    const text =
      round === 'trunc' || !f ? t : round === 'floor' || !c ? f : round === 'ceil' || !r ? c : r;
    result.splitText(text);
  }
}

/**
 * Formats an option's enumerated values to be included in the description.
 * @param option The option definition
 * @param phrase The description item phrase
 * @param styles The set of styles
 * @param style The default style
 * @param result The resulting string
 */
function formatEnums(
  option: Option,
  phrase: string,
  styles: ConcreteStyles,
  style: Style,
  result: TerminalString,
) {
  if ('enums' in option && option.enums) {
    const enums = option.enums;
    const formatFn =
      option.type === 'string' || option.type === 'strings' ? formatFunctions.s : formatFunctions.n;
    result.splitText(phrase, () => {
      formatArray(enums, style, result, styles, formatFn, ['{', '}'], ',');
    });
  }
}

/**
 * Formats an option's regex constraint to be included in the description.
 * @param option The option definition
 * @param phrase The description item phrase
 * @param styles The set of styles
 * @param style The default style
 * @param result The resulting string
 */
function formatRegex(
  option: Option,
  phrase: string,
  styles: ConcreteStyles,
  style: Style,
  result: TerminalString,
) {
  if ('regex' in option && option.regex) {
    const regex = option.regex;
    result.splitText(phrase, () => {
      formatFunctions.r(regex, styles, style, result);
    });
  }
}

/**
 * Formats an option's range constraint to be included in the description.
 * @param option The option definition
 * @param phrase The description item phrase
 * @param styles The set of styles
 * @param style The default style
 * @param result The resulting string
 */
function formatRange(
  option: Option,
  phrase: string,
  styles: ConcreteStyles,
  style: Style,
  result: TerminalString,
) {
  if ('range' in option && option.range) {
    const range = option.range;
    result.splitText(phrase, () => {
      formatArray(range, style, result, styles, formatFunctions.n, ['[', ']'], ',');
    });
  }
}

/**
 * Formats an option's unique constraint to be included in the description.
 * @param option The option definition
 * @param phrase The description item phrase
 * @param _styles unused
 * @param _style unused
 * @param result The resulting string
 */
function formatUnique(
  option: Option,
  phrase: string,
  _styles: ConcreteStyles,
  _style: Style,
  result: TerminalString,
) {
  if ('unique' in option && option.unique) {
    result.splitText(phrase);
  }
}

/**
 * Formats an option's limit constraint to be included in the description.
 * @param option The option definition
 * @param phrase The description item phrase
 * @param styles The set of styles
 * @param style The default style
 * @param result The resulting string
 */
function formatLimit(
  option: Option,
  phrase: string,
  styles: ConcreteStyles,
  style: Style,
  result: TerminalString,
) {
  if ('limit' in option && option.limit !== undefined) {
    const limit = option.limit;
    result.splitText(phrase, () => {
      formatFunctions.n(limit, styles, style, result);
    });
  }
}

/**
 * Formats an option's required attribute to be included in the description.
 * @param option The option definition
 * @param phrase The description item phrase
 * @param _styles unused
 * @param _style unused
 * @param result The resulting string
 */
function formatRequired(
  option: Option,
  phrase: string,
  _styles: ConcreteStyles,
  _style: Style,
  result: TerminalString,
) {
  if ('required' in option && option.required) {
    result.splitText(phrase);
  }
}

/**
 * Formats an option's default value to be included in the description.
 * @param option The option definition
 * @param phrase The description item phrase
 * @param styles The set of styles
 * @param style The default style
 * @param result The resulting string
 */
function formatDefault(
  option: Option,
  phrase: string,
  styles: ConcreteStyles,
  style: Style,
  result: TerminalString,
) {
  if ('default' in option && option.default !== undefined) {
    const def = option.default;
    result.splitText(phrase, () => {
      formatValue(option, def, result, styles, style, true);
    });
  }
}

/**
 * Formats an option's deprecation reason to be included in the description.
 * @param option The option definition
 * @param phrase The description item phrase
 * @param _styles unused
 * @param _style unused
 * @param result The resulting string
 */
function formatDeprecated(
  option: Option,
  phrase: string,
  _styles: ConcreteStyles,
  _style: Style,
  result: TerminalString,
) {
  if (option.deprecated) {
    const text = option.deprecated;
    result.splitText(phrase, () => result.splitText(text));
  }
}

/**
 * Formats an option's external resource reference to be included in the description.
 * @param option The option definition
 * @param phrase The description item phrase
 * @param styles The set of styles
 * @param style The default style
 * @param result The resulting string
 */
function formatLink(
  option: Option,
  phrase: string,
  styles: ConcreteStyles,
  style: Style,
  result: TerminalString,
) {
  if (option.link) {
    const link = option.link;
    result.splitText(phrase, () => {
      formatFunctions.u(link, styles, style, result);
    });
  }
}

/**
 * Formats an option's environment variable to be included in the description.
 * @param option The option definition
 * @param phrase The description item phrase
 * @param styles The set of styles
 * @param style The default style
 * @param result The resulting string
 */
function formatEnvVar(
  option: Option,
  phrase: string,
  styles: ConcreteStyles,
  style: Style,
  result: TerminalString,
) {
  if ('envVar' in option && option.envVar) {
    const envVar = option.envVar;
    result.splitText(phrase, () => {
      formatFunctions.o(envVar, styles, style, result);
    });
  }
}

/**
 * Formats an option's cluster letters to be included in the description.
 * @param option The option definition
 * @param phrase The description item phrase
 * @param styles The set of styles
 * @param style The default style
 * @param result The resulting string
 */
function formatClusterLetters(
  option: Option,
  phrase: string,
  styles: ConcreteStyles,
  style: Style,
  result: TerminalString,
) {
  if ('clusterLetters' in option && option.clusterLetters) {
    const letters = option.clusterLetters;
    result.splitText(phrase, () => {
      formatFunctions.s(letters, styles, style, result);
    });
  }
}

/**
 * Recursively formats an option's requirements to be included in the description.
 * @param options The option definitions
 * @param requires The option requirements
 * @param styles The set of styles
 * @param style The default style
 * @param result The resulting string
 * @param negate True if the requirement should be negated
 */
function formatRequirements(
  options: Options,
  requires: Requires,
  styles: ConcreteStyles,
  style: Style,
  result: TerminalString,
  negate: boolean = false,
) {
  if (typeof requires === 'string') {
    if (negate) {
      result.addWord('no');
    }
    const name = options[requires].preferredName ?? '';
    formatFunctions.o(name, styles, style, result);
  } else if (requires instanceof RequiresNot) {
    formatRequirements(options, requires.item, styles, style, result, !negate);
  } else if (requires instanceof RequiresAll || requires instanceof RequiresOne) {
    formatRequiresExp(options, requires, styles, style, result, negate);
  } else if (typeof requires === 'object') {
    formatRequiresVal(options, requires, styles, style, result, negate);
  } else {
    if (negate) {
      result.addWord('not');
    }
    formatFunctions.p(requires, styles, style, result);
  }
}

/**
 * Formats a requirement expression to be included in the description.
 * @param options The option definitions
 * @param requires The requirement expression
 * @param styles The set of styles
 * @param style The default style
 * @param result The resulting string
 * @param negate True if the requirement should be negated
 */
function formatRequiresExp(
  options: Options,
  requires: RequiresAll | RequiresOne,
  styles: ConcreteStyles,
  style: Style,
  result: TerminalString,
  negate: boolean,
) {
  const op = requires instanceof RequiresAll === negate ? 'or' : 'and';
  if (requires.items.length > 1) {
    result.addOpening('(');
  }
  requires.items.forEach((item, i) => {
    formatRequirements(options, item, styles, style, result, negate);
    if (i < requires.items.length - 1) {
      result.addWord(op);
    }
  });
  if (requires.items.length > 1) {
    result.addClosing(')');
  }
}

/**
 * Formats a requirement object to be included in the description.
 * @param options The option definitions
 * @param requires The requirement object
 * @param styles The set of styles
 * @param style The default style
 * @param result The resulting string
 * @param negate True if the requirement should be negated
 */
function formatRequiresVal(
  options: Options,
  requires: RequiresVal,
  styles: ConcreteStyles,
  style: Style,
  result: TerminalString,
  negate: boolean,
) {
  const entries = Object.entries(requires);
  if (entries.length > 1) {
    result.addOpening('(');
  }
  entries.forEach(([key, value], i) => {
    formatRequiredValue(options[key], value, styles, style, result, negate);
    if (i < entries.length - 1) {
      result.addWord('and');
    }
  });
  if (entries.length > 1) {
    result.addClosing(')');
  }
}

/**
 * Formats an option's required value to be included in the description.
 * @param option The option definition
 * @param value The option value
 * @param styles The set of styles
 * @param style The default style
 * @param result The resulting string
 * @param negate True if the requirement should be negated
 */
function formatRequiredValue(
  option: Option,
  value: RequiresVal[string],
  styles: ConcreteStyles,
  style: Style,
  result: TerminalString,
  negate: boolean,
) {
  if ((value === null && !negate) || (value === undefined && negate)) {
    result.addWord('no');
  }
  const name = option.preferredName ?? '';
  formatFunctions.o(name, styles, style, result);
  if (value !== null && value !== undefined) {
    assert(!isNiladic(option));
    result.addWord(negate ? '!=' : '=');
    formatValue(option, value, result, styles, style, true);
  }
}
