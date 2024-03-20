//--------------------------------------------------------------------------------------------------
// Imports
//--------------------------------------------------------------------------------------------------
import type {
  Option,
  Options,
  Requires,
  ValuedOption,
  RequiresVal,
  ArrayOption,
  ParamOption,
} from './options';
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
 * The help format configuration.
 */
export type HelpConfig = {
  /**
   * The texts for each help section.
   */
  readonly sections?: {
    /**
     * The text of the introduction section. This section has no heading.
     */
    readonly intro?: string;
    /**
     * The text of the usage section, or `true` to use the default text.
     */
    readonly usage?: string | true;
    /**
     * The text of the footer section. This section has no heading.
     */
    readonly footer?: string;
    /**
     * The text of the usage section heading. (Defaults to 'Usage')
     */
    readonly usageHeading?: string;
    /**
     * The text of the default option group heading. (Defaults to 'Options')
     */
    readonly groupHeading?: string;
  };

  /**
   * The indentation level for each help section or entry column.
   */
  readonly indent?: {
    /**
     * The indentation level for the introduction section. (Defaults to 0)
     */
    readonly intro?: number;
    /**
     * The indentation level for the usage section text. (Defaults to 2)
     */
    readonly usage?: number;
    /**
     * The indentation level for the footer section. (Defaults to 0)
     */
    readonly footer?: number;
    /**
     * The indentation level for the names column. (Defaults to 2)
     */
    readonly names?: number;
    /**
     * The indentation level for the parameter column. (Defaults to 2)
     */
    readonly param?: number;
    /**
     * The indentation level for the description column. (Defaults to 2)
     */
    readonly descr?: number;
    /**
     * The indentation level for the options in the default usage. (Defaults to 1)
     */
    readonly usageOptions?: number;
    /**
     * The indentation level for the usage section heading. (Defaults to 0)
     */
    readonly usageHeading?: number;
    /**
     * The indentation level for every option group heading. (Defaults to 0)
     */
    readonly groupHeading?: number;
    /**
     * True if the indentation level for the parameter column should be relative to the beginning
     * of the line instead of the end of the names column. (Defaults to false)
     */
    readonly paramAbsolute?: boolean;
    /**
     * True if the indentation level for the description column should be relative to the beginning
     * of the line instead of the end of the parameter column. (Defaults to false)
     */
    readonly descrAbsolute?: boolean;
    /**
     * True if the indentation level for the usage options should be relative to the beginning
     * of the line instead of the end of the program name. (Defaults to false)
     */
    readonly usageOptionsAbsolute?: boolean;
  };

  /**
   * The number of line breaks to insert before each help section or entry column.
   */
  readonly breaks?: {
    /**
     * The number of line breaks to insert before the introduction section. (Defaults to 0)
     */
    readonly intro?: number;
    /**
     * The number of line breaks to insert before the usage section text. (Defaults to 2)
     */
    readonly usage?: number;
    /**
     * The number of line breaks to insert before each option group content. (Defaults to 2)
     */
    readonly groups?: number;
    /**
     * The number of line breaks to insert before the footer section. (Defaults to 2)
     */
    readonly footer?: number;
    /**
     * The number of line breaks to insert before the names column. (Defaults to 0)
     */
    readonly names?: number;
    /**
     * The number of line breaks to insert before the parameter column. (Defaults to 0)
     */
    readonly param?: number;
    /**
     * The number of line breaks to insert before the description column. (Defaults to 0)
     */
    readonly descr?: number;
    /**
     * The number of line breaks to insert before the options in the default usage. (Defaults to 0)
     */
    readonly usageOptions?: number;
    /**
     * The number of line breaks to insert before the usage section heading. (Defaults to 2)
     */
    readonly usageHeading?: number;
    /**
     * The number of line breaks to insert before every option group heading. (Defaults to 2)
     */
    readonly groupHeading?: number;
  };

  /**
   * Select individual entry columns that should not be displayed.
   * This does not apply to the default usage text.
   */
  readonly hidden?: {
    /**
     * True if the names column should be hidden. (Defaults to false)
     */
    readonly names?: boolean;
    /**
     * True if the parameter column should be hidden. (Defaults to false)
     */
    readonly param?: boolean;
    /**
     * True if the description column should be hidden. (Defaults to false)
     */
    readonly descr?: boolean;
  };

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
   * The styles of the help sections.
   */
  readonly styles?: {
    /**
     * The style of the introduction section. (Defaults to tf.clear)
     */
    readonly intro?: Style;
    /**
     * The style of the usage section. (Defaults to tf.clear)
     */
    readonly usage?: Style;
    /**
     * The style of the footer section. (Defaults to tf.clear)
     */
    readonly footer?: Style;
    /**
     * The style of the usage section heading. (Defaults to tf.bold)
     */
    readonly usageHeading?: Style;
    /**
     * The style of every option group heading. (Defaults to tf.bold)
     */
    readonly groupHeading?: Style;
  };

  /**
   * Miscellaneous settings.
   */
  readonly misc?: {
    /**
     * A custom phrase to use for all headings. (Defaults to '%s:')
     */
    readonly headingPhrase?: string;
    /**
     * True to disable wrapping of provided texts. (Defaults to false)
     */
    readonly noWrap?: boolean;
  };
};

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
 * A set of flags to configure sections that should be omitted from the full help.
 */
export type HideSections = {
  /**
   * True to omit the introduction section from the full help.
   */
  readonly intro?: true;
  /**
   * True to omit the usage section from the full help.
   */
  readonly usage?: true;
  /**
   * True if no option group should be displayed in the full help.
   */
  readonly groups?: true;
  /**
   * True to omit the footer section from the full help.
   */
  readonly footer?: true;
};

//--------------------------------------------------------------------------------------------------
// Constants
//--------------------------------------------------------------------------------------------------
/**
 * The default configuration used by the formatter.
 */
const defaultConfig: ConcreteFormat = {
  sections: {
    intro: '',
    usage: '',
    footer: '',
    usageHeading: 'Usage',
    groupHeading: 'Options',
  },
  indent: {
    intro: 0,
    usage: 2,
    footer: 0,
    names: 2,
    param: 2,
    descr: 2,
    usageOptions: 1,
    usageHeading: 0,
    groupHeading: 0,
    paramAbsolute: false,
    descrAbsolute: false,
    usageOptionsAbsolute: false,
  },
  breaks: {
    intro: 0,
    usage: 2,
    groups: 2,
    footer: 2,
    names: 0,
    param: 0,
    descr: 0,
    usageOptions: 0,
    usageHeading: 2,
    groupHeading: 2,
  },
  hidden: {
    names: false,
    param: false,
    descr: false,
  },
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
  },
  styles: {
    intro: style(tf.clear),
    usage: style(tf.clear),
    footer: style(tf.clear),
    usageHeading: style(tf.clear, tf.bold),
    groupHeading: style(tf.clear, tf.bold),
  },
  misc: {
    headingPhrase: '%s:',
    noWrap: false,
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
  private readonly nameWidths: Array<number>;

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
    this.nameWidths = this.config.hidden.names ? [] : getNameWidths(this.options);
    let paramWidth = 0;
    for (const key in this.options) {
      const option = this.options[key];
      if (option.hide !== true) {
        const entry = this.formatOption(option);
        paramWidth = Math.max(paramWidth, entry.param.length);
      }
    }
    const namesWidth = this.nameWidths.reduce((acc, len) => acc + len + 2, 0);
    this.adjustEntries(namesWidth ? namesWidth - 2 : 0, paramWidth);
  }

  /**
   * Updates the help entries to start at the appropriate terminal column.
   * @param namesWidth The width of the names column
   * @param paramWidth The width of the param column
   */
  private adjustEntries(namesWidth: number, paramWidth: number) {
    const namesStart = Math.max(0, this.config.indent.names);
    const paramStart = this.config.indent.paramAbsolute
      ? Math.max(0, this.config.indent.param)
      : namesStart + namesWidth + this.config.indent.param;
    const descrStart = this.config.indent.descrAbsolute
      ? Math.max(0, this.config.indent.descr)
      : paramStart + paramWidth + this.config.indent.descr;
    for (const entries of this.groups.values()) {
      for (const { param, descr } of entries) {
        param.start = paramStart;
        descr.start = descrStart;
      }
    }
  }

  /**
   * Formats an option to be printed on the terminal.
   * @param option The option definition
   * @returns The computed help entry
   */
  private formatOption(option: Option): HelpEntry {
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
    return entry;
  }

  /**
   * Formats an option's names to be printed on the terminal.
   * @param option The option definition
   * @returns A terminal string with the formatted names
   */
  private formatNames(option: Option): Array<TerminalString> {
    const result = new Array<TerminalString>();
    if (this.config.hidden.names || !option.names) {
      return result;
    }
    const style = option.styles?.names ?? this.styles.option;
    this.formatNameSlots(option.names, style, result);
    return result;
  }

  /**
   * Formats a list of names to be printed on the terminal.
   * @param names The list of option names
   * @param style The names style
   * @param result The resulting strings
   */
  private formatNameSlots(
    names: ReadonlyArray<string | null>,
    style: Style,
    result: Array<TerminalString>,
  ) {
    const textStyle = this.styles.text;
    let breaks = this.config.breaks.names;
    let start = Math.max(0, this.config.indent.names);
    let str: TerminalString | undefined;
    /** @ignore */
    function formatOption(name: string | null, width: number) {
      if (name) {
        if (str) {
          str.addClosing(',');
        }
        str = new TerminalString(start, breaks);
        breaks = 0; // break only on the first name
        str.addAndRevert(style, name, textStyle);
        result.push(str);
      } else {
        str = undefined;
      }
      start += width + 2;
    }
    names.forEach((name, i) => formatOption(name, this.nameWidths[i]));
  }

  /**
   * Formats an option's parameter to be printed on the terminal.
   * @param option The option definition
   * @returns A terminal string with the formatted option parameter
   */
  private formatParam(option: Option): TerminalString {
    if (this.config.hidden.param || isNiladic(option)) {
      return new TerminalString();
    }
    const result = new TerminalString(0, this.config.breaks.param);
    formatParam(option, this.styles, this.styles.text, result);
    return result;
  }

  /**
   * Formats an option's description to be printed on the terminal.
   * The description always ends with a single line break.
   * @param option The option definition
   * @returns A terminal string with the formatted option description
   */
  private formatDescription(option: Option): TerminalString {
    if (this.config.hidden.descr || !this.config.items.length) {
      return new TerminalString(0, 1);
    }
    const descrStyle = option.styles?.descr ?? this.styles.text;
    const result = new TerminalString(0, this.config.breaks.descr).addSequence(descrStyle);
    const len = result.strings.length;
    for (const item of this.config.items) {
      const phrase = this.config.phrases[item];
      this.format[item](option, phrase, this.styles, descrStyle, result);
    }
    if (result.strings.length > len) {
      return result.addSequence(style(tf.clear)).addBreaks(1); // add ending breaks after styles
    }
    return new TerminalString(0, 1);
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
   * Options are rendered in the same order as declared in the option definitions.
   * @returns The formatted help message
   */
  formatHelp(): HelpMessage {
    return this.formatGroup() ?? new HelpMessage();
  }

  /**
   * Formats a help message for an option group.
   * Options are rendered in the same order as declared in the option definitions.
   * @param name The group name (defaults to the default group)
   * @returns The formatted help message, if found
   */
  formatGroup(name = ''): HelpMessage | undefined {
    const entries = this.groups.get(name);
    return entries ? formatEntries(entries) : undefined;
  }

  /**
   * Formats help messages for all option groups.
   * Options are rendered in the same order as declared in the option definitions.
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
   * Options are rendered in the same order as declared in the option definitions.
   * @param hide Sections that should not be displayed
   * @param progName The program name, if any
   * @returns The formatted help message
   */
  formatFull(hide: HideSections = {}, progName = ''): HelpMessage {
    const { sections, indent, breaks, styles, misc } = this.config;
    const help = new HelpMessage();
    if (!hide.intro && sections.intro) {
      help.push(
        formatSection(sections.intro, indent.intro, breaks.intro, styles.intro, misc.noWrap),
      );
    }
    if (!hide.usage && sections.usage) {
      const heading = formatSection(
        sections.usageHeading,
        indent.usageHeading,
        help.length ? breaks.usageHeading : 0,
        styles.usageHeading,
        misc.noWrap,
        misc.headingPhrase,
      );
      const defaultUsage = sections.usage === true;
      const addProgName = defaultUsage && progName;
      const usageOptionsBreaks = addProgName ? breaks.usageOptions : breaks.usage;
      const usageOptionsIndent = addProgName ? progName.length + indent.usageOptions : 0;
      const optionsIndent = indent.usageOptionsAbsolute
        ? Math.max(0, indent.usageOptions)
        : Math.max(0, indent.usage) + usageOptionsIndent;
      help.push(
        heading,
        ...(addProgName
          ? [formatSection(progName, indent.usage, breaks.usage, styles.usage, true)]
          : []),
        defaultUsage
          ? formatUsage(this.options, this.styles, optionsIndent, usageOptionsBreaks)
          : formatSection(sections.usage, indent.usage, breaks.usage, styles.usage, misc.noWrap),
      );
    }
    if (!hide.groups) {
      for (const [group, message] of this.formatGroups().entries()) {
        const heading = formatSection(
          group || sections.groupHeading,
          indent.groupHeading,
          help.length ? breaks.groupHeading : 0,
          styles.groupHeading,
          misc.noWrap,
          misc.headingPhrase,
        );
        help.push(heading.addBreaks(breaks.groups), ...message);
        help[help.length - 1].pop(); // remove trailing break
      }
    }
    if (!hide.footer && sections.footer) {
      help.push(
        formatSection(
          sections.footer,
          indent.footer,
          help.length ? breaks.footer : 0,
          styles.footer,
          misc.noWrap,
        ),
      );
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
    sections: { ...defaultConfig.sections, ...config.sections },
    indent: { ...defaultConfig.indent, ...config.indent },
    breaks: { ...defaultConfig.breaks, ...config.breaks },
    hidden: { ...defaultConfig.hidden, ...config.hidden },
    items: config.items ?? defaultConfig.items,
    phrases: { ...defaultConfig.phrases, ...config.phrases },
    styles: { ...defaultConfig.styles, ...config.styles },
    misc: { ...defaultConfig.misc, ...config.misc },
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
    if (option.hide !== true && option.names) {
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
        formatArray(option, value, result, styles, formatFn, style, inDesc);
      } else if (value !== undefined) {
        formatFunctions.p(value, styles, style, result);
      }
  }
}

/**
 * Formats a list of values to be printed on the terminal.
 * @param option The option definition
 * @param value The array values
 * @param result The resulting string
 * @param styles The set of styles
 * @param formatFn The function to convert a value to string
 * @param style The default style
 * @param inDesc True if in the description
 */
function formatArray(
  option: ArrayOption,
  value: ReadonlyArray<string> | ReadonlyArray<number>,
  result: TerminalString,
  styles: ConcreteStyles,
  formatFn: FormatFunction,
  style: Style,
  inDesc: boolean,
) {
  if (inDesc) {
    formatArray2(value, style, result, styles, formatFn, ['[', ']'], ',');
  } else if ('separator' in option && option.separator) {
    const sep = option.separator;
    const text = value.join(typeof sep === 'string' ? sep : sep.source);
    formatFunctions.s(text, styles, style, result);
  } else {
    formatArray2(value, style, result, styles, formatFn);
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
function formatArray2(
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
 * Formats a heading title or section text, to be included in the full help message.
 * @param text The heading title or section text
 * @param indent The indentation level (negative values are replaced by zero)
 * @param breaks The number of line breaks (non-positive values are ignored)
 * @param style The style to apply to the text
 * @param noWrap True if the provided text should not be split
 * @param phrase The custom phrase, if any
 * @returns The terminal string
 */
function formatSection(
  text: string,
  indent: number,
  breaks: number,
  style: Style,
  noWrap: boolean,
  phrase?: string,
): TerminalString {
  /** @ignore */
  function formatText() {
    if (noWrap) {
      result.addWord(text); // warning: may be larger than the terminal width
    } else {
      result.splitText(text);
    }
  }
  const result = new TerminalString(indent, breaks).addSequence(style);
  if (phrase) {
    result.splitText(phrase, formatText);
  } else {
    formatText();
  }
  return result;
}

/**
 * Formats a default usage to be included in the full help message.
 * Options are rendered in the same order as declared in the option definitions.
 * @param options The option definitions
 * @param styles The set of styles
 * @param indent The indentation level (negative values are replaced by zero)
 * @param breaks The number of line breaks (non-positive values are ignored)
 * @returns The terminal string
 */
function formatUsage(
  options: Options,
  styles: ConcreteStyles,
  indent: number,
  breaks: number,
): TerminalString {
  const result = new TerminalString(indent, breaks);
  for (const key in options) {
    const option = options[key];
    if (!option.hide) {
      formatUsageOption(option, styles, styles.text, result);
    }
  }
  return result;
}

/**
 * Formats an option to be included in the the default usage.
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
 * Formats an option's names to be included in the default usage.
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
 * Formats an option's parameter to be included in the description or the default usage.
 * @param option The option definition
 * @param styles The set of styles
 * @param style The default style
 * @param result The resulting string
 */
function formatParam(
  option: ParamOption,
  styles: ConcreteStyles,
  style: Style,
  result: TerminalString,
) {
  if ('example' in option && option.example !== undefined) {
    formatValue(option, option.example, result, styles, style, false);
  } else {
    const paramStyle = option.styles?.param ?? styles.param;
    const param =
      'paramName' in option && option.paramName
        ? option.paramName.includes('<')
          ? option.paramName
          : `<${option.paramName}>`
        : `<${option.type}>`;
    result.addAndRevert(paramStyle, param, style);
  }
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
      formatArray2(enums, style, result, styles, formatFn, ['{', '}'], ',');
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
      formatArray2(range, style, result, styles, formatFunctions.n, ['[', ']'], ',');
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
