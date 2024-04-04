//--------------------------------------------------------------------------------------------------
// Imports
//--------------------------------------------------------------------------------------------------
import type { OpaqueOption, OpaqueOptions, Requires, RequiresVal } from './options';
import type { Style, FormatStyles } from './styles';
import { max, type Concrete } from './utils';
import type { ConcreteConfig, OptionValidator } from './validator';

import { tf, HelpItem, ConnectiveWords } from './enums';
import {
  RequiresAll,
  RequiresNot,
  RequiresOne,
  isOpt,
  getParamCount,
  getOptionNames,
} from './options';
import { HelpMessage, TerminalString, style, format } from './styles';

//--------------------------------------------------------------------------------------------------
// Public types
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
 * The formatter configuration.
 */
export type FormatterConfig = {
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
  /**
   * A list of regular expressions to filter options.
   */
  filters?: ReadonlyArray<RegExp>;
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
 * Defines attributes for a help section with wrapping.
 */
export type WithTitle = {
  /**
   * The section heading or default group heading. May contain inline styles.
   */
  readonly title?: string;
  /**
   * The style of the section heading or option group headings. (Defaults to tf.bold)
   */
  readonly style?: Style;
  /**
   * The number of line breaks to insert before the section.
   * (Defaults to 0 for the first section, else 2)
   */
  readonly breaks?: number;
  /**
   * True to disable text wrapping of the provided text or headings.
   */
  readonly noWrap?: true;
};

/**
 * Defines attributes for a help section with text content.
 */
export type WithText = {
  /**
   * The section content. May contain inline styles.
   */
  readonly text?: string;
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
  readonly filter?: ReadonlyArray<string>;
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
 * Defines additional attributes for the usage section.
 */
export type WithRequired = {
  /**
   * A list of options that should be considered required in the usage.
   */
  readonly required?: ReadonlyArray<string>;
  /**
   * A commentary to append to the usage.
   */
  readonly comment?: string;
};

/**
 * A help text section.
 */
export type HelpText = WithKind<'text'> & WithTitle & WithText & WithIndent;

/**
 * A help usage section.
 */
export type HelpUsage = WithKind<'usage'> & WithTitle & WithIndent & WithFilter & WithRequired;

/**
 * A help groups section.
 */
export type HelpGroups = WithKind<'groups'> & WithTitle & WithPhrase & WithFilter;

/**
 * A help section.
 */
export type HelpSection = HelpText | HelpUsage | HelpGroups;

/**
 * A list of help sections.
 */
export type HelpSections = Array<HelpSection>;

//--------------------------------------------------------------------------------------------------
// Internal types
//--------------------------------------------------------------------------------------------------
/**
 * A concrete version of the help column settings.
 */
type ConcreteColumn = Concrete<WithColumn>;

/**
 * A concrete version of the format configuration.
 */
type ConcreteFormat = Concrete<FormatterConfig>;

/**
 * Precomputed texts used by the formatter.
 */
type HelpEntry = {
  readonly names: Array<TerminalString>;
  readonly param: TerminalString;
  readonly descr: TerminalString;
};

/**
 * A function that formats a help item to be included in an option's description.
 */
type HelpItemFunction = (
  option: OpaqueOption,
  phrase: string,
  styles: FormatStyles,
  result: TerminalString,
  options: OpaqueOptions,
  connectives: ConcreteConfig['connectives'],
) => void;

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
    HelpItem.paramCount,
    HelpItem.positional,
    HelpItem.append,
    HelpItem.trim,
    HelpItem.case,
    HelpItem.conv,
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
    HelpItem.fallback,
  ],
  phrases: {
    [HelpItem.synopsis]: '%t',
    [HelpItem.negation]: 'Can be negated with %o.',
    [HelpItem.separator]: 'Values are delimited by (%s|%r).',
    [HelpItem.paramCount]: 'Accepts (multiple|%n|at most %n|at least %n|between %n) parameters.',
    [HelpItem.positional]: 'Accepts positional parameters(| that may be preceded by %o).',
    [HelpItem.append]: 'May be specified multiple times.',
    [HelpItem.trim]: 'Values will be trimmed.',
    [HelpItem.case]: 'Values will be converted to (lowercase|uppercase).',
    [HelpItem.conv]: 'Values will be converted with Math.%t.',
    [HelpItem.enums]: 'Values must be one of {(%s|%n)}.',
    [HelpItem.regex]: 'Values must match the regex %r.',
    [HelpItem.range]: 'Values must be in the range [%n].',
    [HelpItem.unique]: 'Duplicate values will be removed.',
    [HelpItem.limit]: 'Value count is limited to %n.',
    [HelpItem.requires]: 'Requires %p.',
    [HelpItem.required]: 'Always required.',
    [HelpItem.default]: 'Defaults to (%b|%s|%n|[%s]|[%n]|%v).',
    [HelpItem.deprecated]: 'Deprecated for %t.',
    [HelpItem.link]: 'Refer to %u for details.',
    [HelpItem.envVar]: 'Can be specified through the %o environment variable.',
    [HelpItem.requiredIf]: 'Required if %p.',
    [HelpItem.clusterLetters]: 'Can be clustered with %s.',
    [HelpItem.fallback]: 'Falls back to (%b|%s|%n|[%s]|[%n]|%v) if specified without parameter.',
  },
  filters: [],
};

/**
 * Keep this in-sync with {@link HelpItem}.
 */
const helpItemFunctions: ReadonlyArray<HelpItemFunction> = [
  formatSynopsis,
  formatNegation,
  formatSeparator,
  formatParamCount,
  formatPositional,
  formatAppend,
  formatTrim,
  formatCase,
  formatConv,
  formatEnums,
  formatRegex,
  formatRange,
  formatUnique,
  formatLimit,
  formatRequires,
  formatRequired,
  formatDefault,
  formatDeprecated,
  formatLink,
  formatEnvVar,
  formatRequiredIf,
  formatClusterLetters,
  formatFallback,
];

//--------------------------------------------------------------------------------------------------
// Classes
//--------------------------------------------------------------------------------------------------
/**
 * Implements formatting of help messages for a set of option definitions.
 */
export class HelpFormatter {
  private readonly options: OpaqueOptions;
  private readonly styles: FormatStyles;
  private readonly connectives: ConcreteConfig['connectives'];
  private readonly groups = new Map<string, Array<HelpEntry>>();
  private readonly nameWidths: Array<number> | number;
  private paramWidth = 0;

  /**
   * Creates a help message formatter.
   * @param validator The validator instance
   * @param config The formatter configuration
   */
  constructor(validator: OptionValidator, config?: FormatterConfig) {
    const cfg = mergeConfig(config);
    this.options = validator.options;
    this.styles = validator.config.styles;
    this.connectives = validator.config.connectives;
    this.nameWidths = cfg.names.hidden
      ? 0
      : cfg.names.align === 'slot'
        ? getNameWidths(this.options)
        : getMaxNamesWidth(this.options);
    for (const key in this.options) {
      const option = this.options[key];
      if (!option.hide && !excludeOption(option, cfg.filters)) {
        const paramLen = formatOption(
          this.groups,
          cfg,
          this.styles,
          this.options,
          this.nameWidths,
          this.connectives,
          option,
        );
        this.paramWidth = max(this.paramWidth, paramLen);
      }
    }
    adjustEntries(this.groups, cfg, this.nameWidths, this.paramWidth);
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
    return entries && formatEntries(entries);
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
 * Checks if an option should be excluded from the help message.
 * @param option The option definition
 * @param filters The option filters
 * @returns True if the option should be excluded
 */
function excludeOption(option: OpaqueOption, filters: ReadonlyArray<RegExp>): boolean {
  return (
    !!filters.length &&
    !filters.find(
      (filter): boolean =>
        !!option.names?.find((name) => name?.match(filter)) ||
        !!option.desc?.match(filter) ||
        !!option.envVar?.match(filter),
    )
  );
}

/**
 * Formats an option to be printed on the terminal.
 * @param groups The option groups
 * @param config The format configuration
 * @param styles The set of styles
 * @param options The option definitions
 * @param nameWidths The name slot widths
 * @param connectives The connective words
 * @param option The option definition
 * @returns The length of the option parameter
 */
function formatOption(
  groups: Map<string, Array<HelpEntry>>,
  config: ConcreteFormat,
  styles: FormatStyles,
  options: OpaqueOptions,
  nameWidths: Array<number> | number,
  connectives: ConcreteConfig['connectives'],
  option: OpaqueOption,
): number {
  const names = formatNames(config, styles, option, nameWidths);
  const param = new TerminalString();
  const paramLen = formatParams(config, styles, option, param);
  const descr = new TerminalString();
  formatDescription(config, styles, option, descr, options, connectives);
  const entry: HelpEntry = { names, param, descr };
  const group = groups.get(option.group ?? '');
  if (!group) {
    groups.set(option.group ?? '', [entry]);
  } else {
    group.push(entry);
  }
  return paramLen;
}

/**
 * Formats an option's names to be printed on the terminal.
 * @param config The format configuration
 * @param styles The set of styles
 * @param option The option definition
 * @param nameWidths The name slot widths
 * @returns The list of terminal strings, one for each name
 */
function formatNames(
  config: ConcreteFormat,
  styles: FormatStyles,
  option: OpaqueOption,
  nameWidths: Array<number> | number,
): Array<TerminalString> {
  if (config.names.hidden || !option.names) {
    return [];
  }
  const namesStyle = option.styles?.names ?? styles.option;
  return formatNameSlots(config, option.names, nameWidths, namesStyle, styles.text);
}

/**
 * Formats an option's parameter to be printed on the terminal.
 * @param config The format configuration
 * @param styles The set of styles
 * @param option The option definition
 * @param result The resulting string
 * @returns The string length
 */
function formatParams(
  config: ConcreteFormat,
  styles: FormatStyles,
  option: OpaqueOption,
  result: TerminalString,
): number {
  if (config.param.hidden) {
    return 0;
  }
  const len = formatParam(option, styles, result, config.param.breaks);
  return (result.indent = len); // hack: save the length, since we will need it in `adjustEntries`
}

/**
 * Formats an option's description to be printed on the terminal.
 * The description always ends with a single line break.
 * @param config The format configuration
 * @param styles The set of styles
 * @param option The option definition
 * @param result The resulting string
 * @param options The option definitions
 * @param connectives The connective words
 * @returns A terminal string with the formatted option description
 */
function formatDescription(
  config: ConcreteFormat,
  styles: FormatStyles,
  option: OpaqueOption,
  result: TerminalString,
  options: OpaqueOptions,
  connectives: ConcreteConfig['connectives'],
) {
  if (config.descr.hidden || !config.items.length) {
    return result.break(1);
  }
  const descrStyle = option.styles?.descr ?? styles.text;
  result.rightAlign = config.descr.align === 'right';
  result.break(config.descr.breaks).seq(descrStyle);
  styles.current = descrStyle;
  const count = result.count;
  try {
    for (const item of config.items) {
      const phrase = config.phrases[item];
      helpItemFunctions[item](option, phrase, styles, result, options, connectives);
    }
  } finally {
    delete styles.current;
  }
  if (result.count == count) {
    result.pop(count).break(1); // this string does not contain any word
  } else {
    result.clear().break(); // add ending breaks after styles
  }
}

/**
 * Merges a help configuration with the default configuration.
 * @param config The provided configuration
 * @returns The merged configuration
 */
function mergeConfig(config: FormatterConfig = {}): ConcreteFormat {
  return {
    names: { ...defaultConfig.names, ...config.names },
    param: { ...defaultConfig.param, ...config.param },
    descr: { ...defaultConfig.descr, ...config.descr },
    items: config.items ?? defaultConfig.items,
    phrases: { ...defaultConfig.phrases, ...config.phrases },
    filters: config.filters ?? defaultConfig.filters,
  };
}

/**
 * Gets the required width of each name slot in a set of option definitions.
 * @param options The option definitions
 * @returns The name slot widths
 */
function getNameWidths(options: OpaqueOptions): Array<number> {
  const result = new Array<number>();
  for (const key in options) {
    const option = options[key];
    if (!option.hide && option.names) {
      option.names.forEach((name, i) => {
        result[i] = max(result[i] ?? 0, name?.length ?? 0);
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
function getMaxNamesWidth(options: OpaqueOptions): number {
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
      result = max(result, len);
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
  const { names, param, descr } = config;
  const alignLeft = param.align === 'left';
  const namesIndent = max(0, names.indent);
  const paramIndent = param.absolute
    ? max(0, param.indent)
    : namesIndent + namesWidth + param.indent;
  const descrIndent = descr.absolute
    ? max(0, descr.indent)
    : paramIndent + paramWidth + descr.indent;
  for (const entries of groups.values()) {
    for (const { param, descr } of entries) {
      param.indent = paramIndent + (alignLeft ? 0 : paramWidth - param.indent);
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
  const slotted = typeof nameWidths !== 'number';
  const result = new Array<TerminalString>();
  let str: TerminalString | undefined;
  let indent = max(0, config.names.indent);
  let breaks = config.names.breaks;
  let len = 0;
  names.forEach((name, i) => {
    if (name) {
      if (str) {
        str.close(',');
        len += 2;
      }
      if (!str || slotted) {
        str = new TerminalString(indent, breaks);
        result.push(str);
        breaks = 0; // break only on the first name
      }
      str.style(namesStyle, name, defStyle);
      len += name.length;
    } else if (slotted) {
      str = undefined;
    }
    if (slotted) {
      indent += nameWidths[i] + 2;
    }
  });
  if (str && !slotted && config.names.align === 'right') {
    str.indent += nameWidths - len;
  }
  return result;
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
  options: OpaqueOptions,
  groups: Map<string, Array<HelpEntry>>,
  styles: FormatStyles,
  section: HelpSection,
  progName: string,
  result: HelpMessage,
) {
  let breaks = section.breaks ?? (result.length ? 2 : 0);
  if (section.type === 'groups') {
    formatGroupsSection(groups, breaks, section, result);
  } else {
    const { title, noWrap, style: sty } = section;
    if (title) {
      result.push(formatText(title, sty ?? style(tf.bold), 0, breaks, noWrap));
      breaks = 2;
    }
    if (section.type === 'usage') {
      let { indent } = section;
      if (progName) {
        result.push(formatText(progName, styles.text, indent, breaks, true));
        indent = max(0, indent ?? 0) + progName.length + 1;
        breaks = 0;
      }
      result.push(formatUsage(options, styles, section, indent, breaks));
    } else {
      const { text, indent } = section;
      if (text) {
        result.push(formatText(text, styles.text, indent, breaks, noWrap));
      }
    }
  }
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
  const filterGroups = filter && new Set(filter);
  for (const [group, entries] of groups.entries()) {
    if ((filterGroups?.has(group) ?? !exclude) != !!exclude) {
      const title2 = group || title;
      const heading = title2
        ? formatText(title2, sty ?? style(tf.bold), 0, breaks, noWrap, phrase).break(2)
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
      result.word(text); // warning: may be larger than the terminal width
    } else {
      result.split(text);
    }
  }
  const result = new TerminalString(indent, breaks).seq(defStyle);
  if (phrase) {
    result.split(phrase, format);
  } else {
    format();
  }
  return result.clear(); // to simplify client code
}

/**
 * Formats a usage text to be included in a help section.
 * Options are rendered in the same order as was declared in the option definitions.
 * @param options The option definitions
 * @param styles The set of styles
 * @param section The help section
 * @param indent The indentation level (negative values are replaced by zero)
 * @param breaks The number of line breaks (non-positive values are ignored)
 * @returns The terminal string
 */
function formatUsage(
  options: OpaqueOptions,
  styles: FormatStyles,
  section: HelpUsage,
  indent?: number,
  breaks?: number,
): TerminalString {
  const { filter, exclude, required, comment } = section;
  const filterKeys = filter && new Set(filter);
  const requiredKeys = required && new Set(required);
  const result = new TerminalString(indent, breaks).seq(styles.text);
  const count = result.count;
  if (filterKeys && !exclude) {
    // list options in the same order specified in the filter
    for (const key of filterKeys) {
      if (key in options) {
        formatUsageOption(options[key], styles, result, requiredKeys?.has(key));
      }
    }
  } else {
    for (const key in options) {
      const option = options[key];
      if (!option.hide && !(exclude && filterKeys?.has(key))) {
        formatUsageOption(option, styles, result);
      }
    }
  }
  if (comment) {
    result.split(comment);
  }
  if (result.count == count) {
    return new TerminalString(); // this string does not contain any word
  }
  return result.clear(); // to simplify client code
}

/**
 * Formats an option to be included in the the usage text.
 * @param option The option definition
 * @param styles The set of styles
 * @param result The resulting string
 * @param required True if the option should be considered required
 */
function formatUsageOption(
  option: OpaqueOption,
  styles: FormatStyles,
  result: TerminalString,
  required = option.required ?? false,
) {
  if (!required) {
    result.open('[');
  }
  formatUsageNames(option, styles, result);
  formatParam(option, styles, result);
  if (!required) {
    result.close(']');
  }
}

/**
 * Formats an option's names to be included in the usage text.
 * @param option The option definition
 * @param styles The set of styles
 * @param result The resulting string
 */
function formatUsageNames(option: OpaqueOption, styles: FormatStyles, result: TerminalString) {
  const names = getOptionNames(option);
  if (names.length) {
    const positional = option.positional;
    if (positional) {
      result.open('[');
    }
    if (names.length > 1) {
      result.format(styles, '(%o)', { o: names }, { sep: '|', mergeNext: true });
    } else {
      format.o(names[0], styles, result);
    }
    if (positional) {
      result.close(']');
    }
  }
}

/**
 * Formats an option's parameter to be included in the description or the usage text.
 * Assumes that the option is not niladic.
 * @param option The option definition
 * @param styles The set of styles
 * @param result The resulting string
 * @param breaks The number of line breaks (non-positive values are ignored)
 * @returns The string length
 */
function formatParam(
  option: OpaqueOption,
  styles: FormatStyles,
  result: TerminalString,
  breaks = 0,
): number {
  if (option.example !== undefined) {
    return formatExample(option, styles, result.break(breaks));
  }
  const paramStyle = option.styles?.param ?? styles.value;
  const ellipsis = '...';
  if (option.type === 'command') {
    result.break(breaks).style(paramStyle, ellipsis, styles.text);
    return ellipsis.length;
  }
  const [min, max] = getParamCount(option);
  if (!max) {
    return 0;
  }
  const paramName = option.paramName;
  const param0 = paramName
    ? paramName.includes('<')
      ? paramName
      : `<${paramName}>`
    : option.type === 'function'
      ? '<param>'
      : `<${option.type}>`;
  const param1 = param0 + (max > 1 ? ellipsis : '');
  const param2 = min <= 0 ? `[${param1}]` : param1;
  result.break(breaks).style(paramStyle, param2, styles.text);
  return param2.length;
}

/**
 * Formats an option's example value to be included in the description or the usage text.
 * Assumes that the option was validated.
 * @param option The option definition
 * @param styles The set of styles
 * @param result The resulting string
 * @returns The string length, counting spaces in non-delimited array values
 */
function formatExample(option: OpaqueOption, styles: FormatStyles, result: TerminalString): number {
  const example = option.example;
  const separator = option.separator;
  if (separator) {
    const sep = typeof separator === 'string' ? separator : separator.source;
    const value = (example as Array<unknown>).join(sep);
    result.format(styles, '%s', { s: value });
    return result.length;
  }
  const spec = isOpt.b(option) ? 'b' : isOpt.s(option) ? 's' : isOpt.n(option) ? 'n' : 'v';
  result.format(styles, `%${spec}`, { [spec]: example }, {});
  const nonDelimited = spec !== 'v' && Array.isArray(example);
  return result.length + (nonDelimited ? example.length - 1 : 0);
}

/**
 * Formats an option's synopsis to be included in the description.
 * @param option The option definition
 * @param phrase The description item phrase
 * @param styles The set of styles
 * @param result The resulting string
 */
function formatSynopsis(
  option: OpaqueOption,
  phrase: string,
  styles: FormatStyles,
  result: TerminalString,
) {
  const desc = option.desc;
  if (desc) {
    result.format(styles, phrase, { t: desc });
  }
}

/**
 * Formats an option's negation names to be included in the description.
 * @param option The option definition
 * @param phrase The description item phrase
 * @param styles The set of styles
 * @param result The resulting string
 */
function formatNegation(
  option: OpaqueOption,
  phrase: string,
  styles: FormatStyles,
  result: TerminalString,
) {
  const names = option.negationNames?.filter((name) => name);
  if (names?.length) {
    result.format(styles, phrase, { o: names });
  }
}

/**
 * Formats an option's separator string to be included in the description.
 * @param option The option definition
 * @param phrase The description item phrase
 * @param styles The set of styles
 * @param result The resulting string
 */
function formatSeparator(
  option: OpaqueOption,
  phrase: string,
  styles: FormatStyles,
  result: TerminalString,
) {
  const separator = option.separator;
  if (separator) {
    const [spec, alt] = typeof separator === 'string' ? ['s', 0] : ['r', 1];
    result.format(styles, phrase, { [spec]: separator }, { alt });
  }
}

/**
 * Formats an option's parameter count to be included in the description.
 * @param option The option definition
 * @param phrase The description item phrase
 * @param styles The set of styles
 * @param result The resulting string
 */
function formatParamCount(
  option: OpaqueOption,
  phrase: string,
  styles: FormatStyles,
  result: TerminalString,
) {
  const [min, max] = getParamCount(option);
  if (max > 1) {
    const [alt, val] =
      min === max
        ? [1, min] // exactly %n
        : min <= 0
          ? isFinite(max)
            ? [2, max] // at most %n
            : [0, undefined] // multiple
          : isFinite(max)
            ? [4, [min, max]] // between %n
            : min > 1
              ? [3, min] // at least %n
              : [0, undefined]; // multiple
    result.format(styles, phrase, { n: val }, { alt, sep: 'and', mergePrev: false });
  }
}

/**
 * Formats an option's positional attribute to be included in the description.
 * @param option The option definition
 * @param phrase The description item phrase
 * @param styles The set of styles
 * @param result The resulting string
 */
function formatPositional(
  option: OpaqueOption,
  phrase: string,
  styles: FormatStyles,
  result: TerminalString,
) {
  const positional = option.positional;
  if (positional) {
    const [spec, alt] = positional === true ? ['', 0] : ['o', 1];
    result.format(styles, phrase, { [spec]: positional }, { alt });
  }
}

/**
 * Formats an option's append attribute to be included in the description.
 * @param option The option definition
 * @param phrase The description item phrase
 * @param _styles The set of styles
 * @param result The resulting string
 */
function formatAppend(
  option: OpaqueOption,
  phrase: string,
  _styles: FormatStyles,
  result: TerminalString,
) {
  if (option.append) {
    result.split(phrase);
  }
}

/**
 * Formats an option's trim normalization to be included in the description.
 * @param option The option definition
 * @param phrase The description item phrase
 * @param _styles The set of styles
 * @param result The resulting string
 */
function formatTrim(
  option: OpaqueOption,
  phrase: string,
  _styles: FormatStyles,
  result: TerminalString,
) {
  if (option.trim) {
    result.split(phrase);
  }
}

/**
 * Formats an option's case conversion to be included in the description.
 * @param option The option definition
 * @param phrase The description item phrase
 * @param styles The set of styles
 * @param result The resulting string
 */
function formatCase(
  option: OpaqueOption,
  phrase: string,
  styles: FormatStyles,
  result: TerminalString,
) {
  const conv = option.case;
  if (conv) {
    const alt = conv === 'lower' ? 0 : 1;
    result.format(styles, phrase, {}, { alt });
  }
}

/**
 * Formats an option's math conversion to be included in the description.
 * @param option The option definition
 * @param phrase The description item phrase
 * @param styles The set of styles
 * @param result The resulting string
 */
function formatConv(
  option: OpaqueOption,
  phrase: string,
  styles: FormatStyles,
  result: TerminalString,
) {
  const conv = option.conv;
  if (conv) {
    result.format(styles, phrase, { t: conv });
  }
}

/**
 * Formats an option's enumerated values to be included in the description.
 * @param option The option definition
 * @param phrase The description item phrase
 * @param styles The set of styles
 * @param result The resulting string
 */
function formatEnums(
  option: OpaqueOption,
  phrase: string,
  styles: FormatStyles,
  result: TerminalString,
) {
  const enums = option.enums;
  if (enums) {
    const [spec, alt] = isOpt.s(option) ? ['s', 0] : ['n', 1];
    result.format(styles, phrase, { [spec]: enums }, { alt, sep: ',' });
  }
}

/**
 * Formats an option's regex constraint to be included in the description.
 * @param option The option definition
 * @param phrase The description item phrase
 * @param styles The set of styles
 * @param result The resulting string
 */
function formatRegex(
  option: OpaqueOption,
  phrase: string,
  styles: FormatStyles,
  result: TerminalString,
) {
  const regex = option.regex;
  if (regex) {
    result.format(styles, phrase, { r: regex });
  }
}

/**
 * Formats an option's range constraint to be included in the description.
 * @param option The option definition
 * @param phrase The description item phrase
 * @param styles The set of styles
 * @param result The resulting string
 */
function formatRange(
  option: OpaqueOption,
  phrase: string,
  styles: FormatStyles,
  result: TerminalString,
) {
  const range = option.range;
  if (range) {
    result.format(styles, phrase, { n: range });
  }
}

/**
 * Formats an option's unique constraint to be included in the description.
 * @param option The option definition
 * @param phrase The description item phrase
 * @param _styles The set of styles
 * @param result The resulting string
 */
function formatUnique(
  option: OpaqueOption,
  phrase: string,
  _styles: FormatStyles,
  result: TerminalString,
) {
  if (option.unique) {
    result.split(phrase);
  }
}

/**
 * Formats an option's limit constraint to be included in the description.
 * @param option The option definition
 * @param phrase The description item phrase
 * @param styles The set of styles
 * @param result The resulting string
 */
function formatLimit(
  option: OpaqueOption,
  phrase: string,
  styles: FormatStyles,
  result: TerminalString,
) {
  const limit = option.limit;
  if (limit !== undefined) {
    result.format(styles, phrase, { n: limit });
  }
}

/**
 * Formats an option's required attribute to be included in the description.
 * @param option The option definition
 * @param phrase The description item phrase
 * @param _styles The set of styles
 * @param result The resulting string
 */
function formatRequired(
  option: OpaqueOption,
  phrase: string,
  _styles: FormatStyles,
  result: TerminalString,
) {
  if (option.required) {
    result.split(phrase);
  }
}

/**
 * Formats an option's default value to be included in the description.
 * @param option The option definition
 * @param phrase The description item phrase
 * @param styles The set of styles
 * @param result The resulting string
 */
function formatDefault(
  option: OpaqueOption,
  phrase: string,
  styles: FormatStyles,
  result: TerminalString,
) {
  const value = option.default;
  if (value !== undefined) {
    formatValue(option, phrase, styles, result, value);
  }
}

/**
 * Formats an option's default or fallback value to be included in the description.
 * @param option The option definition
 * @param phrase The description item phrase
 * @param styles The set of styles
 * @param result The resulting string
 * @param value The default or fallback value
 */
function formatValue(
  option: OpaqueOption,
  phrase: string,
  styles: FormatStyles,
  result: TerminalString,
  value: unknown,
) {
  const [spec, alt] =
    typeof value === 'function'
      ? ['v', 5]
      : typeof value === 'boolean'
        ? ['b', 0]
        : typeof value === 'string'
          ? ['s', 1]
          : typeof value === 'number'
            ? ['n', 2]
            : option.type === 'strings'
              ? ['s', 3]
              : option.type === 'numbers'
                ? ['n', 4]
                : ['v', 5];
  result.format(styles, phrase, { [spec]: value }, { alt, sep: ',' });
}

/**
 * Formats an option's deprecation reason to be included in the description.
 * @param option The option definition
 * @param phrase The description item phrase
 * @param styles The set of styles
 * @param result The resulting string
 */
function formatDeprecated(
  option: OpaqueOption,
  phrase: string,
  styles: FormatStyles,
  result: TerminalString,
) {
  const deprecated = option.deprecated;
  if (deprecated) {
    result.format(styles, phrase, { t: deprecated });
  }
}

/**
 * Formats an option's external resource reference to be included in the description.
 * @param option The option definition
 * @param phrase The description item phrase
 * @param styles The set of styles
 * @param result The resulting string
 */
function formatLink(
  option: OpaqueOption,
  phrase: string,
  styles: FormatStyles,
  result: TerminalString,
) {
  const link = option.link;
  if (link) {
    result.format(styles, phrase, { u: link });
  }
}

/**
 * Formats an option's environment variable to be included in the description.
 * @param option The option definition
 * @param phrase The description item phrase
 * @param styles The set of styles
 * @param result The resulting string
 */
function formatEnvVar(
  option: OpaqueOption,
  phrase: string,
  styles: FormatStyles,
  result: TerminalString,
) {
  const envVar = option.envVar;
  if (envVar) {
    result.format(styles, phrase, { o: envVar });
  }
}

/**
 * Formats an option's cluster letters to be included in the description.
 * @param option The option definition
 * @param phrase The description item phrase
 * @param styles The set of styles
 * @param result The resulting string
 */
function formatClusterLetters(
  option: OpaqueOption,
  phrase: string,
  styles: FormatStyles,
  result: TerminalString,
) {
  const letters = option.clusterLetters;
  if (letters) {
    result.format(styles, phrase, { s: letters });
  }
}

/**
 * Recursively formats an option's requirements to be included in the description.
 * Assumes that the options were validated.
 * @param options The option definitions
 * @param requires The option requirements
 * @param styles The set of styles
 * @param result The resulting string
 * @param connectives The connective words
 * @param negate True if the requirement should be negated
 */
function formatRequirements(
  options: OpaqueOptions,
  requires: Requires,
  styles: FormatStyles,
  result: TerminalString,
  connectives: ConcreteConfig['connectives'],
  negate: boolean = false,
) {
  if (typeof requires === 'string') {
    if (negate) {
      result.word(connectives[ConnectiveWords.no]);
    }
    const name = options[requires].preferredName ?? '';
    format.o(name, styles, result);
  } else if (requires instanceof RequiresNot) {
    formatRequirements(options, requires.item, styles, result, connectives, !negate);
  } else if (requires instanceof RequiresAll || requires instanceof RequiresOne) {
    formatRequiresExp(options, requires, styles, result, connectives, negate);
  } else if (typeof requires === 'object') {
    formatRequiresVal(options, requires, styles, result, connectives, negate);
  } else {
    if (negate) {
      result.word(connectives[ConnectiveWords.not]);
    }
    format.v(requires, styles, result);
  }
}

/**
 * Formats a requirement expression to be included in the description.
 * Assumes that the options were validated.
 * @param options The option definitions
 * @param requires The requirement expression
 * @param styles The set of styles
 * @param result The resulting string
 * @param connectives The connective words
 * @param negate True if the requirement should be negated
 */
function formatRequiresExp(
  options: OpaqueOptions,
  requires: RequiresAll | RequiresOne,
  styles: FormatStyles,
  result: TerminalString,
  connectives: ConcreteConfig['connectives'],
  negate: boolean,
) {
  const op =
    requires instanceof RequiresAll === negate
      ? connectives[ConnectiveWords.or]
      : connectives[ConnectiveWords.and];
  const items = requires.items;
  const length = items.length;
  if (length > 1) {
    result.open('(');
  }
  items.forEach((item, i) => {
    formatRequirements(options, item, styles, result, connectives, negate);
    if (i < length - 1) {
      result.word(op);
    }
  });
  if (length > 1) {
    result.close(')');
  }
}

/**
 * Formats a requirement object to be included in the description.
 * Assumes that the options were validated.
 * @param options The option definitions
 * @param requires The requirement object
 * @param styles The set of styles
 * @param result The resulting string
 * @param connectives The connective words
 * @param negate True if the requirement should be negated
 */
function formatRequiresVal(
  options: OpaqueOptions,
  requires: RequiresVal,
  styles: FormatStyles,
  result: TerminalString,
  connectives: ConcreteConfig['connectives'],
  negate: boolean,
) {
  const entries = Object.entries(requires);
  const length = entries.length;
  if (length > 1) {
    result.open('(');
  }
  entries.forEach(([key, value], i) => {
    formatRequiredValue(options[key], value, styles, result, connectives, negate);
    if (i < length - 1) {
      result.word(connectives[ConnectiveWords.and]);
    }
  });
  if (length > 1) {
    result.close(')');
  }
}

/**
 * Formats an option's required value to be included in the description.
 * Assumes that the options were validated.
 * @param option The option definition
 * @param value The option value
 * @param styles The set of styles
 * @param result The resulting string
 * @param connectives The connective words
 * @param negate True if the requirement should be negated
 */
function formatRequiredValue(
  option: OpaqueOption,
  value: RequiresVal[string],
  styles: FormatStyles,
  result: TerminalString,
  connectives: ConcreteConfig['connectives'],
  negate: boolean,
) {
  if ((value === null && !negate) || (value === undefined && negate)) {
    result.word(connectives[ConnectiveWords.no]);
  }
  format.o(option.preferredName ?? '', styles, result);
  if (value !== null && value !== undefined) {
    const connective = negate
      ? connectives[ConnectiveWords.notEquals]
      : connectives[ConnectiveWords.equals];
    const spec = isOpt.b(option) ? 'b' : isOpt.s(option) ? 's' : isOpt.n(option) ? 'n' : 'v';
    const phrase = isOpt.a(option) ? `[%${spec}]` : `%${spec}`;
    result.word(connective).format(styles, phrase, { [spec]: value });
  }
}

/**
 * Formats an option's requirements to be included in the description.
 * @param option The option definition
 * @param phrase The description item phrase
 * @param styles The set of styles
 * @param result The resulting string
 * @param options The option definitions
 * @param connectives The connective words
 */
function formatRequires(
  option: OpaqueOption,
  phrase: string,
  styles: FormatStyles,
  result: TerminalString,
  options: OpaqueOptions,
  connectives: ConcreteConfig['connectives'],
) {
  const requires = option.requires;
  if (requires) {
    result.split(phrase, () => formatRequirements(options, requires, styles, result, connectives));
  }
}

/**
 * Formats an option's conditional requirements to be included in the description.
 * @param option The option definition
 * @param phrase The description item phrase
 * @param styles The set of styles
 * @param result The resulting string
 * @param options The option definitions
 * @param connectives The connective words
 */
function formatRequiredIf(
  option: OpaqueOption,
  phrase: string,
  styles: FormatStyles,
  result: TerminalString,
  options: OpaqueOptions,
  connectives: ConcreteConfig['connectives'],
) {
  const requiredIf = option.requiredIf;
  if (requiredIf) {
    result.split(phrase, () =>
      formatRequirements(options, requiredIf, styles, result, connectives),
    );
  }
}

/**
 * Formats an option's fallback value to be included in the description.
 * @param option The option definition
 * @param phrase The description item phrase
 * @param styles The set of styles
 * @param result The resulting string
 */
function formatFallback(
  option: OpaqueOption,
  phrase: string,
  styles: FormatStyles,
  result: TerminalString,
) {
  const value = option.fallback;
  if (value !== undefined) {
    formatValue(option, phrase, styles, result, value);
  }
}
