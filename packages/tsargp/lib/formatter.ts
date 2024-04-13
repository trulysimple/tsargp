//--------------------------------------------------------------------------------------------------
// Imports
//--------------------------------------------------------------------------------------------------
import type {
  OpaqueOption,
  OpaqueOptions,
  Requires,
  RequiresCallback,
  RequiresEntry,
  RequiresVal,
} from './options.js';
import type { Style, FormatStyles, ConnectiveWords, HelpMessage } from './styles.js';
import type { Concrete } from './utils.js';
import type { OptionValidator } from './validator.js';

import { tf, HelpItem, ConnectiveWord } from './enums.js';
import {
  RequiresAll,
  RequiresOne,
  isOpt,
  getParamCount,
  getOptionNames,
  visitRequirements,
} from './options.js';
import { AnsiMessage, JsonMessage, TextMessage, TerminalString, style, format } from './styles.js';
import {
  max,
  combineRegExp,
  regexps,
  getEntries,
  getValues,
  getKeys,
  mergeValues,
} from './utils.js';

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
export type WithColumn<A extends string = Alignment> = {
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
  readonly param?: WithColumn<Alignment | 'merge'> & WithAbsolute;
  /**
   * The settings for the description column.
   */
  readonly descr?: WithColumn<Alignment | 'merge'> & WithAbsolute;
  /**
   * The order of items to be shown in the option description.
   */
  readonly items?: ReadonlyArray<HelpItem>;
  /**
   * The phrases to be used for each kind of description item.
   */
  readonly phrases?: Readonly<Partial<Record<HelpItem, string>>>;
  /**
   * A list of patterns to filter options.
   */
  filter?: ReadonlyArray<string>;
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
   * True to disable wrapping of the provided text or headings.
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
 * Defines additional attributes for the usage section.
 */
export type WithRequired = {
  /**
   * A list of options that should be considered required in the usage.
   */
  readonly required?: ReadonlyArray<string>;
  /**
   * A map of option keys to required options.
   */
  readonly requires?: Readonly<Record<string, string>>;
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
export type HelpGroups = WithKind<'groups'> & WithTitle & WithFilter;

/**
 * A help section.
 */
export type HelpSection = HelpText | HelpUsage | HelpGroups;

/**
 * A list of help sections.
 */
export type HelpSections = Array<HelpSection>;

/**
 * A help format.
 */
export type HelpFormat = (typeof helpFormats)[number];

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
 * Precomputed texts used by the ANSI formatter.
 */
type AnsiHelpEntry = [
  names: ReadonlyArray<TerminalString>,
  param: TerminalString,
  descr: TerminalString,
];

/**
 * Precomputed texts used by the CSV formatter.
 */
type CsvHelpEntry = ReadonlyArray<string>;

/**
 * Information about the current help message.
 */
type HelpContext = [
  styles: FormatStyles,
  options: OpaqueOptions,
  connectives: ConnectiveWords,
  config: ConcreteFormat,
];

/**
 * A function to format a help item.
 * @param option The option definition
 * @param phrase The help item phrase
 * @param context The help context
 * @param result The resulting string
 */
type HelpFunction = (
  option: OpaqueOption,
  phrase: string,
  context: HelpContext,
  result: TerminalString,
) => void;

/**
 * A set of functions to format help items.
 */
type HelpFunctions = ReadonlyArray<HelpFunction>;

/**
 * A function to format a help groups section.
 * @template T The type of the help entry
 */
type GroupsFunction<T> = (group: string, entries: ReadonlyArray<T>, section: HelpGroups) => void;

/**
 * A map of option groups to help entries.
 * @template T The type of the help entry
 */
type EntriesByGroup<T> = Readonly<Record<string, ReadonlyArray<T>>>;

/**
 * The adjacency list for a usage section.
 */
type RequiredBy = Record<string, Array<string>>;

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
    HelpItem.desc,
    HelpItem.negationNames,
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
    HelpItem.useNested,
    HelpItem.useFormat,
    HelpItem.useFilter,
    HelpItem.inline,
  ],
  phrases: {
    [HelpItem.desc]: '%t',
    [HelpItem.negationNames]: 'Can be negated with %o.',
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
    [HelpItem.limit]: 'Element count is limited to %n.',
    [HelpItem.requires]: 'Requires %p.',
    [HelpItem.required]: 'Always required.',
    [HelpItem.default]: 'Defaults to (%b|%s|%n|[%s]|[%n]|%v).',
    [HelpItem.deprecated]: 'Deprecated for %t.',
    [HelpItem.link]: 'Refer to %u for details.',
    [HelpItem.envVar]: 'Can be specified through the %o environment variable.',
    [HelpItem.requiredIf]: 'Required if %p.',
    [HelpItem.clusterLetters]: 'Can be clustered with %s.',
    [HelpItem.fallback]: 'Falls back to (%b|%s|%n|[%s]|[%n]|%v) if specified without parameter.',
    [HelpItem.useNested]: 'Uses the next argument as the name of a nested command.',
    [HelpItem.useFormat]: 'Uses the next argument as the name of a help format.',
    [HelpItem.useFilter]: 'Uses the remaining arguments as option filter.',
    [HelpItem.inline]: '(Disallows|Requires) inline parameters.',
  },
  filter: [],
};

/**
 * Keep this in-sync with {@link HelpItem}.
 */
const helpFunctions = [
  /**
   * Formats an option's synopsis to be included in the description.
   * @ignore
   */
  (option, phrase, context, result) => {
    const desc = option.desc;
    if (desc) {
      result.format(context[0], phrase, { t: desc });
    }
  },
  /**
   * Formats an option's negation names to be included in the description.
   * @ignore
   */
  (option, phrase, context, result) => {
    const names = option.negationNames?.filter((name) => name);
    if (names?.length) {
      const sep = context[2][ConnectiveWord.optionSep];
      result.format(context[0], phrase, { o: names }, { sep });
    }
  },
  /**
   * Formats an option's separator string to be included in the description.
   * @ignore
   */
  (option, phrase, context, result) => {
    const separator = option.separator;
    if (separator) {
      const [spec, alt] = typeof separator === 'string' ? ['s', 0] : ['r', 1];
      result.format(context[0], phrase, { [spec]: separator }, { alt });
    }
  },
  /**
   * Formats an option's parameter count to be included in the description.
   * @ignore
   */
  (option, phrase, context, result) => {
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
      const sep = context[2][ConnectiveWord.and];
      result.format(context[0], phrase, { n: val }, { alt, sep, mergePrev: false });
    }
  },
  /**
   * Formats an option's positional attribute to be included in the description.
   * @ignore
   */
  (option, phrase, context, result) => {
    const positional = option.positional;
    if (positional) {
      const [spec, alt] = positional === true ? ['', 0] : ['o', 1];
      result.format(context[0], phrase, { [spec]: positional }, { alt });
    }
  },
  /**
   * Formats an option's append attribute to be included in the description.
   * @ignore
   */
  (option, phrase, _, result) => {
    if (option.append) {
      result.split(phrase);
    }
  },
  /**
   * Formats an option's trim normalization to be included in the description.
   * @ignore
   */
  (option, phrase, _, result) => {
    if (option.trim) {
      result.split(phrase);
    }
  },
  /**
   * Formats an option's case conversion to be included in the description.
   * @ignore
   */
  (option, phrase, context, result) => {
    const conv = option.case;
    if (conv) {
      const alt = conv === 'lower' ? 0 : 1;
      result.format(context[0], phrase, undefined, { alt });
    }
  },
  /**
   * Formats an option's math conversion to be included in the description.
   * @ignore
   */
  (option, phrase, context, result) => {
    const conv = option.conv;
    if (conv) {
      result.format(context[0], phrase, { t: conv });
    }
  },
  /**
   * Formats an option's enumerated values to be included in the description.
   * @ignore
   */
  (option, phrase, context, result) => {
    const values = [
      ...(option.enums ?? []),
      ...(option.truthNames ?? []),
      ...(option.falsityNames ?? []),
    ];
    if (values.length) {
      const connectives = context[2];
      const [spec, alt, sep] = isOpt.num(option)
        ? ['n', 1, connectives[ConnectiveWord.numberSep]]
        : ['s', 0, connectives[ConnectiveWord.stringSep]];
      result.format(context[0], phrase, { [spec]: values }, { alt, sep });
    }
  },
  /**
   * Formats an option's regex constraint to be included in the description.
   * @ignore
   */
  (option, phrase, context, result) => {
    const regex = option.regex;
    if (regex) {
      result.format(context[0], phrase, { r: regex });
    }
  },
  /**
   * Formats an option's range constraint to be included in the description.
   * @ignore
   */
  (option, phrase, context, result) => {
    const range = option.range;
    if (range) {
      const sep = context[2][ConnectiveWord.numberSep];
      result.format(context[0], phrase, { n: range }, { sep });
    }
  },
  /**
   * Formats an option's unique constraint to be included in the description.
   * @ignore
   */
  (option, phrase, _, result) => {
    if (option.unique) {
      result.split(phrase);
    }
  },
  /**
   * Formats an option's limit constraint to be included in the description.
   * @ignore
   */
  (option, phrase, context, result) => {
    const limit = option.limit;
    if (limit !== undefined) {
      result.format(context[0], phrase, { n: limit });
    }
  },
  /**
   * Formats an option's requirements to be included in the description.
   * @ignore
   */
  (option, phrase, context, result) => {
    const requires = option.requires;
    if (requires) {
      result.split(phrase, () => formatRequirements(context, requires, result));
    }
  },
  /**
   * Formats an option's required attribute to be included in the description.
   * @ignore
   */
  (option, phrase, _, result) => {
    if (option.required) {
      result.split(phrase);
    }
  },
  /**
   * Formats an option's default value to be included in the description.
   * @ignore
   */
  (option, phrase, context, result) => {
    formatValue(context, option, phrase, result, option.default);
  },
  /**
   * Formats an option's deprecation notice to be included in the description.
   * @ignore
   */
  (option, phrase, context, result) => {
    const deprecated = option.deprecated;
    if (deprecated) {
      result.format(context[0], phrase, { t: deprecated });
    }
  },
  /**
   * Formats an option's external resource reference to be included in the description
   * @ignore
   */
  (option, phrase, context, result) => {
    const link = option.link;
    if (link) {
      result.format(context[0], phrase, { u: link });
    }
  },
  /**
   * Formats an option's environment variable to be included in the description.
   * @ignore
   */
  (option: OpaqueOption, phrase: string, context: HelpContext, result: TerminalString) => {
    const envVar = option.envVar;
    if (envVar) {
      result.format(context[0], phrase, { o: envVar });
    }
  },
  /**
   * Formats an option's conditional requirements to be included in the description.
   * @ignore
   */
  (option, phrase, context, result) => {
    const requiredIf = option.requiredIf;
    if (requiredIf) {
      result.split(phrase, () => formatRequirements(context, requiredIf, result));
    }
  },
  /**
   * Formats an option's cluster letters to be included in the description.
   * @ignore
   */
  (option, phrase, context, result) => {
    const letters = option.clusterLetters;
    if (letters) {
      result.format(context[0], phrase, { s: letters });
    }
  },
  /**
   * Formats an option's fallback value to be included in the description.
   * @ignore
   */
  (option, phrase, context, result) => {
    formatValue(context, option, phrase, result, option.fallback);
  },
  /**
   * Formats a help option's useNested to be included in the description.
   * @ignore
   */
  (option, phrase, _, result) => {
    if (option.useNested) {
      result.split(phrase);
    }
  },
  /**
   * Formats a help option's useFormat to be included in the description.
   * @ignore
   */
  (option, phrase, _, result) => {
    if (option.useFormat) {
      result.split(phrase);
    }
  },
  /**
   * Formats a help option's useFilter to be included in the description.
   * @ignore
   */
  (option, phrase, _, result) => {
    if (option.useFilter) {
      result.split(phrase);
    }
  },
  /**
   * Formats an option's inline treatment to be included in the description.
   * @ignore
   */
  (option, phrase, context, result) => {
    const inline = option.inline;
    if (inline !== undefined) {
      const alt = inline === false ? 0 : 1;
      result.format(context[0], phrase, undefined, { alt });
    }
  },
] as const satisfies HelpFunctions;

/**
 * Keep this in-sync with {@link HelpItem}.
 */
const fieldNames = [
  'desc',
  'negationNames',
  'separator',
  'paramCount',
  'positional',
  'append',
  'trim',
  'case',
  'conv',
  'enums',
  'regex',
  'range',
  'unique',
  'limit',
  'requires',
  'required',
  'default',
  'deprecated',
  'link',
  'envVar',
  'requiredIf',
  'clusterLetters',
  'fallback',
  'useNested',
  'useFormat',
  'useFilter',
  'inline',
] as const satisfies ReadonlyArray<keyof OpaqueOption>;

/**
 * The available help formats.
 */
const helpFormats = ['ansi', 'json', 'csv', 'md'] as const;

/**
 * The Markdown text elements.
 */
const markdown: [sep: string, open: string, close: string] = [' | ', '| ', ' |'];

//--------------------------------------------------------------------------------------------------
// Classes
//--------------------------------------------------------------------------------------------------
/**
 * Implements formatting of help messages for a set of option definitions.
 */
export abstract class HelpFormatter {
  protected readonly context: HelpContext;

  /**
   * Creates a help message formatter.
   * @param validator The validator instance
   * @param config The formatter configuration
   */
  constructor(validator: OptionValidator, config: FormatterConfig = {}) {
    const { styles, connectives } = validator.config;
    const concreteConfig = mergeValues(defaultConfig, config);
    this.context = [styles, validator.options, connectives, concreteConfig];
  }

  /**
   * Formats the help message of an option group.
   * Options are rendered in the same order as was declared in the option definitions.
   * @param name The group name (defaults to the default group)
   * @returns The help message, if the group exists; otherwise an empty message
   */
  abstract format(name?: string): HelpMessage;

  /**
   * Formats a help message with sections.
   * Options are rendered in the same order as was declared in the option definitions.
   * @param sections The help sections
   * @param progName The program name, if any
   * @returns The formatted help message
   */
  abstract sections(sections: HelpSections, progName?: string): HelpMessage;
}

/**
 * Implements formatting of ANSI help messages for a set of option definitions.
 */
export class AnsiFormatter extends HelpFormatter {
  protected readonly groups: EntriesByGroup<AnsiHelpEntry>;

  constructor(validator: OptionValidator, config?: FormatterConfig) {
    super(validator, config);
    this.groups = buildAnsiEntries(this.context);
  }

  override format(name = ''): AnsiMessage {
    return formatAnsiEntries(this.groups[name] ?? []);
  }

  override sections(sections: HelpSections, progName = ''): AnsiMessage {
    const help = new AnsiMessage();
    for (const section of sections) {
      formatAnsiSection(this.groups, this.context, section, progName, help);
    }
    return help;
  }
}

/**
 * Implements formatting of JSON help messages for a set of option definitions.
 */
export class JsonFormatter extends HelpFormatter {
  protected readonly groups: EntriesByGroup<object>;

  constructor(validator: OptionValidator, config?: FormatterConfig) {
    super(validator, config);
    this.groups = buildEntries(this.context, (opt) => opt);
  }

  override format(name = ''): JsonMessage {
    return new JsonMessage(...(this.groups[name] ?? []));
  }

  override sections(sections: HelpSections): JsonMessage {
    const result = new JsonMessage();
    formatGroupsSections(this.groups, sections, (_, entries) => result.push(...entries));
    return result;
  }
}

/**
 * Implements formatting of CSV help messages for a set of option definitions.
 */
export class CsvFormatter extends HelpFormatter {
  protected readonly groups: EntriesByGroup<CsvHelpEntry>;
  protected readonly fields: ReadonlyArray<keyof OpaqueOption>;

  constructor(
    validator: OptionValidator,
    config?: FormatterConfig,
    additionalFields: ReadonlyArray<keyof OpaqueOption> = ['type', 'group', 'names'],
  ) {
    super(validator, config);
    this.fields = [...additionalFields, ...this.context[3].items.map((item) => fieldNames[item])];
    this.groups = buildEntries(this.context, (opt) =>
      this.fields.map((field) => `${opt[field] ?? ''}`),
    );
  }

  override format(name = ''): TextMessage {
    const entries = this.groups[name];
    return formatCsvEntries(entries ? [this.fields, ...entries] : []);
  }

  override sections(sections: HelpSections): TextMessage {
    const result = new TextMessage(this.fields.join('\t')); // single heading row for all groups
    formatGroupsSections(this.groups, sections, (_, entries) => formatCsvEntries(entries, result));
    return result;
  }
}

/**
 * Implements formatting of Markdown help messages for a set of option definitions.
 */
export class MdFormatter extends CsvFormatter {
  private readonly header: [CsvHelpEntry, CsvHelpEntry];

  constructor(validator: OptionValidator, config?: FormatterConfig) {
    super(validator, config, ['type', 'names']);
    this.header = [this.fields, this.fields.map((field) => '-'.repeat(field.length))];
  }

  override format(name = ''): TextMessage {
    const entries = this.groups[name];
    return formatCsvEntries(entries ? [...this.header, ...entries] : [], undefined, ...markdown);
  }

  override sections(sections: HelpSections): TextMessage {
    const result = new TextMessage();
    formatGroupsSections(this.groups, sections, (group, entries, section) => {
      if (result.length) {
        result.push(''); // line feed between tables
      }
      const title = group || section.title;
      if (title) {
        result.push('## ' + title, ''); // section before table
      }
      formatCsvEntries([...this.header, ...entries], result, ...markdown);
    });
    return result;
  }
}

//--------------------------------------------------------------------------------------------------
// Functions
//--------------------------------------------------------------------------------------------------
/**
 * Creates a help message formatter.
 * @param validator The validator instance
 * @param config The formatter configuration
 * @param format The help format (defaults to `ansi`)
 * @returns The formatter instance
 */
export function createFormatter(
  validator: OptionValidator,
  config?: FormatterConfig,
  format: HelpFormat = 'ansi',
): HelpFormatter {
  const classes = [AnsiFormatter, JsonFormatter, CsvFormatter, MdFormatter];
  return new classes[helpFormats.indexOf(format)](validator, config);
}

/**
 * Checks if a name is a help format.
 * @param name The candidate name
 * @returns True if the name is a help format
 */
export function isHelpFormat(name: string): name is HelpFormat {
  return helpFormats.includes(name as HelpFormat);
}

/**
 * Formats a list of help groups sections to be included in the help message.
 * @template T The type of the help entries
 * @param groups The option groups
 * @param sections The help sections
 * @param formatFn The formatting function
 */
function formatGroupsSections<T>(
  groups: EntriesByGroup<T>,
  sections: HelpSections,
  formatFn: GroupsFunction<T>,
) {
  for (const section of sections) {
    if (section.type === 'groups') {
      formatGroups(groups, section, formatFn);
    }
  }
}

/**
 * Formats a help groups section to be included in the help message.
 * @template T The type of the help entries
 * @param groups The option groups
 * @param section The help section
 * @param formatFn The formatting function
 */
function formatGroups<T>(
  groups: EntriesByGroup<T>,
  section: HelpGroups,
  formatFn: GroupsFunction<T>,
) {
  const { filter, exclude } = section;
  const allNames = getKeys(groups);
  const names = exclude ? allNames : filter ?? allNames;
  const excludeNames = new Set(exclude && filter);
  for (const name of names) {
    if (name in groups && !excludeNames.has(name)) {
      formatFn(name, groups[name], section);
    }
  }
}

/**
 * Build the help entries for a help message.
 * @template T The type of the help entries
 * @param context The help context
 * @param buildFn The building function
 * @returns The option groups
 */
function buildEntries<T>(
  context: HelpContext,
  buildFn: (option: OpaqueOption) => T,
): EntriesByGroup<T> {
  /** @ignore */
  function exclude(option: OpaqueOption): 0 | boolean {
    return (
      regexp &&
      !option.names?.find((name) => name?.match(regexp)) &&
      !option.desc?.match(regexp) &&
      !option.envVar?.match(regexp)
    );
  }
  const [, options, , config] = context;
  const regexp = config.filter.length && RegExp(combineRegExp(config.filter), 'i');
  const groups: Record<string, Array<T>> = {};
  for (const option of getValues(options)) {
    if (!option.hide && !exclude(option)) {
      const entry = buildFn(option);
      const name = option.group ?? '';
      if (name in groups) {
        groups[name].push(entry);
      } else {
        groups[name] = [entry];
      }
    }
  }
  return groups;
}

/**
 * Build the help entries for a help message using the ANSI format.
 * @param context The help context
 * @returns The option groups
 */
function buildAnsiEntries(context: HelpContext): EntriesByGroup<AnsiHelpEntry> {
  let nameWidths = getNameWidths(context);
  let paramWidth = 0;
  const groups = buildEntries(context, (option): AnsiHelpEntry => {
    const names = formatNames(context, option, nameWidths);
    const [param, paramLen] = formatParams(context, option);
    const descr = formatDescription(context, option);
    paramWidth = max(paramWidth, paramLen);
    return [names, param, descr];
  });
  if (typeof nameWidths !== 'number') {
    nameWidths = nameWidths.length ? nameWidths.reduce((acc, len) => acc + len + 2, -2) : 0;
  }
  const { names, param, descr } = context[3];
  const namesIndent = max(0, names.indent);
  const paramIndent = param.absolute
    ? max(0, param.indent)
    : namesIndent + nameWidths + param.indent;
  const descrIndent = descr.absolute
    ? max(0, descr.indent)
    : paramIndent + paramWidth + descr.indent;
  const paramRight = param.align === 'right';
  const paramMerge = param.align === 'merge';
  const descrMErge = descr.align === 'merge';
  for (const [names, param, descr] of getValues(groups).flat()) {
    if (descrMErge) {
      param.other(descr);
      descr.pop(descr.count);
    } else {
      descr.indent = descrIndent;
    }
    if (paramMerge) {
      if (names.length) {
        names[names.length - 1].other(param);
        param.pop(param.count);
      } else {
        param.indent = namesIndent;
      }
    } else {
      param.indent = paramIndent + (paramRight ? paramWidth - param.indent : 0);
    }
  }
  return groups;
}

/**
 * Formats an option's names to be printed on the terminal.
 * @param context The help context
 * @param option The option definition
 * @param nameWidths The name slot widths
 * @returns The list of formatted strings, one for each name
 */
function formatNames(
  context: HelpContext,
  option: OpaqueOption,
  nameWidths: Array<number> | number,
): Array<TerminalString> {
  const [styles, , connectives, config] = context;
  let { indent, breaks, align, hidden } = config.names;
  if (hidden || !option.names) {
    return [];
  }
  const style = option.styles?.names ?? styles.option;
  const sep = connectives[ConnectiveWord.optionSep];
  const slotted = typeof nameWidths !== 'number';
  const result: Array<TerminalString> = [];
  const sepLen = sep.length + 1;
  let str: TerminalString | undefined;
  indent = max(0, indent);
  let len = 0;
  option.names.forEach((name, i) => {
    if (name) {
      if (str) {
        str.close(sep);
        len += sepLen;
      }
      if (!str || slotted) {
        str = new TerminalString(indent, breaks);
        result.push(str);
        breaks = 0; // break only on the first name
      }
      str.style(style, name, styles.text);
      len += name.length;
    } else if (slotted) {
      str = undefined;
    }
    if (slotted) {
      indent += nameWidths[i] + sepLen;
    }
  });
  if (str && !slotted && align === 'right') {
    str.indent += nameWidths - len;
  }
  return result;
}

/**
 * Formats an option's parameter to be printed on the terminal.
 * @param context The help context
 * @param option The option definition
 * @returns [the formatted string, the string length]
 */
function formatParams(context: HelpContext, option: OpaqueOption): [TerminalString, number] {
  const result = new TerminalString();
  const { hidden, breaks } = context[3].param;
  if (hidden) {
    return [result, 0];
  }
  formatParam(option, context[0], result.break(breaks));
  const len = result.lengths.reduce((acc, len) => acc + (len ? len + 1 : 0), -1);
  if (len < 0) {
    return [result.pop(result.count), 0]; // this string does not contain any word
  }
  result.indent = len; // hack: save the length, since we will need it in `adjustEntries`
  return [result, len];
}

/**
 * Formats an option's description to be printed on the terminal.
 * The description always ends with a single line break.
 * @param context The help context
 * @param option The option definition
 * @returns The formatted string
 */
function formatDescription(context: HelpContext, option: OpaqueOption): TerminalString {
  const [styles, , , config] = context;
  const { descr, items, phrases } = config;
  const { hidden, breaks, align } = descr;
  const result = new TerminalString(0, 0, align === 'right');
  if (hidden || !items.length) {
    return result.break();
  }
  const style = option.styles?.descr ?? styles.text;
  result.break(breaks).seq(style);
  styles.current = style;
  const count = result.count;
  try {
    for (const item of items) {
      helpFunctions[item](option, phrases[item], context, result);
    }
  } finally {
    delete styles.current;
  }
  return (result.count === count ? result.pop(count) : result.clear()).break();
}

/**
 * Gets the required width of option names in a set of option definitions.
 * @param context The help context
 * @returns The name slot widths, or the maximum combined width
 */
function getNameWidths(context: HelpContext): Array<number> | number {
  const [, options, connectives, config] = context;
  const { hidden, align } = config.names;
  if (hidden) {
    return 0;
  }
  const sepLen = connectives[ConnectiveWord.optionSep].length + 1;
  const slotted = align === 'slot';
  const slotWidths: Array<number> = [];
  let maxWidth = 0;
  for (const option of getValues(options)) {
    const names = option.names;
    if (!option.hide && names) {
      if (slotted) {
        names.forEach((name, i) => {
          slotWidths[i] = max(slotWidths[i] ?? 0, name?.length ?? 0);
        });
      } else {
        const len = names.reduce((acc, name) => acc + sepLen + (name?.length ?? -sepLen), -sepLen);
        maxWidth = max(maxWidth, len);
      }
    }
  }
  return slotted ? slotWidths : maxWidth;
}

/**
 * Formats a help message from a list of ANSI help entries.
 * @param entries The help entries
 * @param result The resulting message
 * @returns The resulting message
 */
function formatAnsiEntries(
  entries: ReadonlyArray<AnsiHelpEntry>,
  result = new AnsiMessage(),
): AnsiMessage {
  for (const [names, param, descr] of entries) {
    result.push(...names, param, descr);
  }
  return result;
}

/**
 * Formats a help message from a list of CSV help entries.
 * Sequences of whitespace are collapsed to a single space, and styles are removed.
 * @param entries The help entries
 * @param result The resulting message
 * @param itemSep The help item delimiter
 * @param openChar The character to begin a help entry
 * @param closeChar The character to end a help entry
 * @returns The resulting message
 */
function formatCsvEntries(
  entries: ReadonlyArray<CsvHelpEntry>,
  result = new TextMessage(),
  itemSep = '\t',
  openChar = '',
  closeChar = '',
): TextMessage {
  result.push(
    ...entries.map(
      (entry) =>
        openChar +
        entry
          .map((item) => item.replace(regexps.space, ' ').replace(regexps.style, ''))
          .join(itemSep) +
        closeChar,
    ),
  );
  return result;
}

/**
 * Formats a help section to be included in the full help message.
 * Options are rendered in the same order as was declared in the option definitions.
 * @param groups The option groups
 * @param context The help context
 * @param section The help section
 * @param progName The program name
 * @param result The resulting message
 */
function formatAnsiSection(
  groups: EntriesByGroup<AnsiHelpEntry>,
  context: HelpContext,
  section: HelpSection,
  progName: string,
  result: AnsiMessage,
) {
  let breaks = section.breaks ?? (result.length ? 2 : 0);
  if (section.type === 'groups') {
    const { title, noWrap, style: sty } = section;
    const headingStyle = sty ?? style(tf.bold);
    formatGroups(groups, section, (group, entries) => {
      const title2 = group || title;
      const heading = title2
        ? formatText(title2, headingStyle, 0, breaks, noWrap).break(2)
        : new TerminalString(0, breaks);
      result.push(heading);
      formatAnsiEntries(entries, result);
      result[result.length - 1].pop(); // remove trailing break
      breaks = 2;
    });
  } else {
    const { title, noWrap, style: sty } = section;
    if (title) {
      result.push(formatText(title, sty ?? style(tf.bold), 0, breaks, noWrap));
      breaks = 2;
    }
    const textStyle = context[0].text;
    if (section.type === 'usage') {
      let { indent } = section;
      if (progName) {
        result.push(formatText(progName, textStyle, indent, breaks, true));
        indent = max(0, indent ?? 0) + progName.length + 1;
        breaks = 0;
      }
      result.push(formatUsage(context, section, indent, breaks));
    } else {
      const { text, indent } = section;
      if (text) {
        result.push(formatText(text, textStyle, indent, breaks, noWrap));
      }
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
 * @returns The terminal string
 */
function formatText(
  text: string,
  defStyle: Style,
  indent?: number,
  breaks?: number,
  noWrap = false,
): TerminalString {
  const result = new TerminalString(indent, breaks).seq(defStyle);
  if (noWrap) {
    result.word(text); // warning: may be larger than the terminal width
  } else {
    result.split(text);
  }
  return result.clear(); // to simplify client code
}

/**
 * Formats a usage text to be included in a help section.
 * Options are rendered in the same order as was declared in the option definitions.
 * @param context The help context
 * @param section The help section
 * @param indent The indentation level (negative values are replaced by zero)
 * @param breaks The number of line breaks (non-positive values are ignored)
 * @returns The terminal string
 */
function formatUsage(
  context: HelpContext,
  section: HelpUsage,
  indent?: number,
  breaks?: number,
): TerminalString {
  const [styles, options] = context;
  const result = new TerminalString(indent, breaks).seq(styles.text);
  const { filter, exclude, required, requires, comment } = section;
  const visited = new Set<string>(exclude && filter);
  const requiredKeys = new Set(required);
  const requiredBy = requires && getRequiredBy(requires);
  const allKeys = getKeys(options);
  const keys = exclude ? allKeys : filter?.filter((key) => key in options) ?? allKeys;
  const count = result.count;
  for (const key of keys) {
    formatUsageOption(context, key, result, visited, requiredKeys, requires, requiredBy);
  }
  if (comment) {
    result.split(comment);
  }
  return result.count === count ? result.pop(count) : result.clear();
}

/**
 * Gets an adjacency list from a set of requirements.
 * @param requires The map of option keys to required options
 * @returns The adjacency list
 */
function getRequiredBy(requires: Readonly<Record<string, string>>): RequiredBy {
  const result: RequiredBy = {};
  for (const [key, requiredKey] of getEntries(requires)) {
    if (requiredKey in result) {
      result[requiredKey].push(key);
    } else {
      result[requiredKey] = [key];
    }
  }
  return result;
}

/**
 * Formats an option to be included in the the usage text.
 * @param context The help context
 * @param key The option key
 * @param result The resulting string
 * @param visited The set of visited options
 * @param requiredKeys The list of options to consider always required
 * @param requires The map of option keys to required options
 * @param requiredBy The adjacency list
 * @param preOrderFn The formatting function to execute before rendering the option names
 * @returns True if the option is considered always required
 */
function formatUsageOption(
  context: HelpContext,
  key: string,
  result: TerminalString,
  visited: Set<string>,
  requiredKeys: Set<string>,
  requires?: Readonly<Record<string, string>>,
  requiredBy?: RequiredBy,
  preOrderFn?: (requiredKey?: string) => void,
): boolean {
  /** @ignore */
  function format(receivedKey?: string, isLast = false): boolean {
    const count = result.count;
    // if the received key is my own key, then I'm the junction point in a circular dependency:
    // reset it so that remaining options in the chain can be considered optional
    preOrderFn?.(key === receivedKey ? undefined : receivedKey);
    formatUsageNames(context, option, result);
    formatParam(option, styles, result);
    if (!required) {
      // process requiring options in my dependency group (if they have not already been visited)
      list?.forEach((key) => {
        if (formatUsageOption(context, key, result, visited, requiredKeys, requires, requiredBy)) {
          required = true; // update my status, since I'm required by an always required option
        }
      });
      // if I'm not always required and I'm the last option in a dependency chain, ignore the
      // received key, so I can be considered optional
      if (!required && (isLast || !receivedKey)) {
        result.open('[', count).close(']');
      }
    }
    return required;
  }
  let required = requiredKeys.has(key);
  if (visited.has(key)) {
    return required;
  }
  visited.add(key);
  const [styles, options] = context;
  const option = options[key];
  if (!required && option.required) {
    required = true;
    requiredKeys.add(key);
  }
  const list = requiredBy?.[key];
  const requiredKey = requires?.[key];
  if (requiredKey) {
    if (required) {
      requiredKeys.add(requiredKey); // transitivity of always required options
    }
    // this check is needed, so we can fallback to the normal format call in the negative case
    if (!visited.has(requiredKey)) {
      return formatUsageOption(
        context,
        requiredKey,
        result,
        visited,
        requiredKeys,
        requires,
        requiredBy,
        format,
      );
    }
  }
  return format(requiredKey, true);
}

/**
 * Formats an option's names to be included in the usage text.
 * @param context The help context
 * @param option The option definition
 * @param result The resulting string
 */
function formatUsageNames(context: HelpContext, option: OpaqueOption, result: TerminalString) {
  const [styles, , connectives] = context;
  const names = getOptionNames(option);
  if (names.length) {
    const count = result.count;
    if (names.length > 1) {
      const sep = connectives[ConnectiveWord.optionAlt];
      result.format(styles, '(%o)', { o: names }, { sep, mergeNext: true });
    } else {
      format.o(names[0], styles, result);
    }
    if (option.positional) {
      result.open('[', count).close(']');
    }
  }
}

/**
 * Formats an option's parameter to be included in the description or the usage text.
 * @param option The option definition
 * @param styles The set of styles
 * @param result The resulting string
 */
function formatParam(option: OpaqueOption, styles: FormatStyles, result: TerminalString) {
  const paramStyle = option.styles?.param ?? styles.value;
  const [min, max] = getParamCount(option);
  const ellipsis = max > 1 ? '...' : '';
  const equals = option.inline === 'always' ? '=' : '';
  if (equals) {
    result.setMerge();
  }
  let param,
    example = option.example;
  if (example !== undefined) {
    let spec;
    const separator = option.separator;
    if (separator) {
      const sep = typeof separator === 'string' ? separator : separator.source;
      example = (example as Array<unknown>).join(sep);
      spec = 's';
    } else {
      spec = isOpt.bool(option) ? 'b' : isOpt.str(option) ? 's' : isOpt.num(option) ? 'n' : 'v';
    }
    result.format(styles, equals + '%' + spec, { [spec]: example });
    if (ellipsis) {
      param = ellipsis;
      result.setMerge();
    }
  } else {
    const type = option.type;
    if (type === 'command') {
      param = '...';
    } else if (max) {
      const param0 = option.paramName ?? (type === 'function' ? 'param' : type);
      const param1 = param0.includes('<') ? param0 : `<${param0}>`;
      const param2 = equals + param1 + ellipsis;
      param = min <= 0 ? `[${param2}]` : param2;
    }
  }
  if (param) {
    result.style(paramStyle, param, styles.text);
  }
}

/**
 * Formats an option's default or fallback value to be included in the description.
 * @param context The help context
 * @param option The option definition
 * @param phrase The description item phrase
 * @param result The resulting string
 * @param value The default or fallback value
 */
function formatValue(
  context: HelpContext,
  option: OpaqueOption,
  phrase: string,
  result: TerminalString,
  value: unknown,
) {
  if (value === undefined) {
    return;
  }
  const connectives = context[2];
  const [spec, alt, sep] =
    typeof value === 'function'
      ? ['v', 5]
      : typeof value === 'boolean'
        ? ['b', 0]
        : typeof value === 'string'
          ? ['s', 1]
          : typeof value === 'number'
            ? ['n', 2]
            : option.type === 'strings'
              ? ['s', 3, connectives[ConnectiveWord.stringSep]]
              : option.type === 'numbers'
                ? ['n', 4, connectives[ConnectiveWord.numberSep]]
                : ['v', 5];
  result.format(context[0], phrase, { [spec]: value }, { alt, sep });
}

/**
 * Recursively formats an option's requirements to be included in the description.
 * Assumes that the options were validated.
 * @param context The help context
 * @param requires The option requirements
 * @param result The resulting string
 * @param negate True if the requirement should be negated
 */
function formatRequirements(
  context: HelpContext,
  requires: Requires,
  result: TerminalString,
  negate: boolean = false,
) {
  visitRequirements(
    requires,
    (req) => formatRequiredKey(context, req, result, negate),
    (req) => formatRequirements(context, req.item, result, !negate),
    (req) => formatRequiresExp(context, req, result, negate, true),
    (req) => formatRequiresExp(context, req, result, negate, false),
    (req) => formatRequiresVal(context, req, result, negate),
    (req) => formatRequiresCallback(context, req, result, negate),
  );
}

/**
 * Formats a required option key to be included in the description.
 * Assumes that the options were validated.
 * @param context The help context
 * @param requiredKey The required option key
 * @param result The resulting string
 * @param negate True if the requirement should be negated
 */
function formatRequiredKey(
  context: HelpContext,
  requiredKey: string,
  result: TerminalString,
  negate: boolean,
) {
  const [styles, options, connectives] = context;
  if (negate) {
    result.word(connectives[ConnectiveWord.no]);
  }
  const name = options[requiredKey].preferredName ?? '';
  format.o(name, styles, result);
}

/**
 * Formats a requirement expression to be included in the description.
 * Assumes that the options were validated.
 * @param context The help context
 * @param requires The requirement expression
 * @param result The resulting string
 * @param negate True if the requirement should be negated
 * @param isAll True if the requirement is an "all" expression
 */
function formatRequiresExp(
  context: HelpContext,
  requires: RequiresAll | RequiresOne,
  result: TerminalString,
  negate: boolean,
  isAll: boolean,
) {
  /** @ignore */
  function custom(item: Requires) {
    formatRequirements(context, item, result, negate);
  }
  const connectives = context[2];
  const items = requires.items;
  const phrase = items.length > 1 ? '(%c)' : '%c';
  const sep = isAll === negate ? connectives[ConnectiveWord.or] : connectives[ConnectiveWord.and];
  result.format(context[0], phrase, { c: items }, { sep, custom, mergePrev: false });
}

/**
 * Formats a requirement object to be included in the description.
 * Assumes that the options were validated.
 * @param context The help context
 * @param requires The requirement object
 * @param result The resulting string
 * @param negate True if the requirement should be negated
 */
function formatRequiresVal(
  context: HelpContext,
  requires: RequiresVal,
  result: TerminalString,
  negate: boolean,
) {
  /** @ignore */
  function custom([key, value]: RequiresEntry) {
    formatRequiredValue(context, options[key], value, result, negate);
  }
  const [, options, connectives] = context;
  const entries = getEntries(requires);
  const phrase = entries.length > 1 ? '(%c)' : '%c';
  const sep = connectives[ConnectiveWord.and];
  result.format(context[0], phrase, { c: entries }, { sep, custom, mergePrev: false });
}

/**
 * Formats an option's required value to be included in the description.
 * Assumes that the options were validated.
 * @param context The help context
 * @param option The option definition
 * @param value The option value
 * @param result The resulting string
 * @param negate True if the requirement should be negated
 */
function formatRequiredValue(
  context: HelpContext,
  option: OpaqueOption,
  value: RequiresVal[string],
  result: TerminalString,
  negate: boolean,
) {
  const [styles, , connectives] = context;
  const requireAbsent = value === null;
  const requirePresent = value === undefined;
  if ((requireAbsent && !negate) || (requirePresent && negate)) {
    result.word(connectives[ConnectiveWord.no]);
  }
  format.o(option.preferredName ?? '', styles, result);
  if (!requireAbsent && !requirePresent) {
    const connective = negate
      ? connectives[ConnectiveWord.notEquals]
      : connectives[ConnectiveWord.equals];
    const [spec, sep] = isOpt.bool(option)
      ? ['b']
      : isOpt.str(option)
        ? ['s', connectives[ConnectiveWord.stringSep]]
        : isOpt.num(option)
          ? ['n', connectives[ConnectiveWord.numberSep]]
          : 'v';
    const phrase = isOpt.arr(option) ? `[%${spec}]` : `%${spec}`;
    result.word(connective).format(styles, phrase, { [spec]: value }, { sep });
  }
}

/**
 * Formats a requirement callback to be included in the description.
 * Assumes that the options were validated.
 * @param context The help context
 * @param callback The requirement callback
 * @param result The resulting string
 * @param negate True if the requirement should be negated
 */
function formatRequiresCallback(
  context: HelpContext,
  callback: RequiresCallback,
  result: TerminalString,
  negate: boolean,
) {
  const [styles, , connectives] = context;
  if (negate) {
    result.word(connectives[ConnectiveWord.not]);
  }
  format.v(callback, styles, result);
}
