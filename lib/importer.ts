//--------------------------------------------------------------------------------------------------
// Imports and Exports
//--------------------------------------------------------------------------------------------------
import type { V1 as JsonConfig, HelpStyle } from './config.js';
import type { BgColor, Color, FgColor, Style } from './styles.js';
import type { HelpConfig } from './formatter.js';

import { NamedColor, FontFamily, TypeFace } from './config.js';
import { bg, ff, fg, tf, fgColor, bgColor } from './styles.js';

export type { JsonConfig };
export { ConfigImporter };

//--------------------------------------------------------------------------------------------------
// Constants
//--------------------------------------------------------------------------------------------------
const namedColorToFg = new Map<NamedColor, fg>([
  [NamedColor.black, fg.black],
  [NamedColor.red, fg.red],
  [NamedColor.green, fg.green],
  [NamedColor.yellow, fg.yellow],
  [NamedColor.blue, fg.blue],
  [NamedColor.magenta, fg.magenta],
  [NamedColor.cyan, fg.cyan],
  [NamedColor.white, fg.white],
  [NamedColor.default, fg.default],
  [NamedColor.brightBlack, fg.brightBlack],
  [NamedColor.brightRed, fg.brightRed],
  [NamedColor.brightGreen, fg.brightGreen],
  [NamedColor.brightYellow, fg.brightYellow],
  [NamedColor.brightBlue, fg.brightBlue],
  [NamedColor.brightMagenta, fg.brightMagenta],
  [NamedColor.brightCyan, fg.brightCyan],
  [NamedColor.brightWhite, fg.brightWhite],
]);

const namedColorToBg = new Map<NamedColor, bg>([
  [NamedColor.black, bg.black],
  [NamedColor.red, bg.red],
  [NamedColor.green, bg.green],
  [NamedColor.yellow, bg.yellow],
  [NamedColor.blue, bg.blue],
  [NamedColor.magenta, bg.magenta],
  [NamedColor.cyan, bg.cyan],
  [NamedColor.white, bg.white],
  [NamedColor.default, bg.default],
  [NamedColor.brightBlack, bg.brightBlack],
  [NamedColor.brightRed, bg.brightRed],
  [NamedColor.brightGreen, bg.brightGreen],
  [NamedColor.brightYellow, bg.brightYellow],
  [NamedColor.brightBlue, bg.brightBlue],
  [NamedColor.brightMagenta, bg.brightMagenta],
  [NamedColor.brightCyan, bg.brightCyan],
  [NamedColor.brightWhite, bg.brightWhite],
]);

const fontFamilyToFf = new Map<FontFamily, ff>([
  [FontFamily.primary, ff.primary],
  [FontFamily.alternative1, ff.alternative1],
  [FontFamily.alternative2, ff.alternative2],
  [FontFamily.alternative3, ff.alternative3],
  [FontFamily.alternative4, ff.alternative4],
  [FontFamily.alternative5, ff.alternative5],
  [FontFamily.alternative6, ff.alternative6],
  [FontFamily.alternative7, ff.alternative7],
  [FontFamily.alternative8, ff.alternative8],
  [FontFamily.alternative9, ff.alternative9],
  [FontFamily.gothic, ff.gothic],
]);

const typeFaceToTf = new Map<TypeFace, tf>([
  [TypeFace.bold, tf.bold],
  [TypeFace.faint, tf.faint],
  [TypeFace.italic, tf.italic],
  [TypeFace.underline, tf.underline],
  [TypeFace.slowBlink, tf.slowBlink],
  [TypeFace.rapidBlink, tf.rapidBlink],
  [TypeFace.invert, tf.invert],
  [TypeFace.conceal, tf.conceal],
  [TypeFace.strike, tf.strike],
  [TypeFace.noBold, tf.noBold],
  [TypeFace.noFaint, tf.noFaint],
  [TypeFace.noItalic, tf.noItalic],
  [TypeFace.noUnderline, tf.noUnderline],
  [TypeFace.noBlink, tf.noBlink],
  [TypeFace.space, tf.space],
  [TypeFace.noInvert, tf.noInvert],
  [TypeFace.noConceal, tf.noConceal],
  [TypeFace.noStrike, tf.noStrike],
  [TypeFace.noSpace, tf.noSpace],
  [TypeFace.frame, tf.frame],
  [TypeFace.encircle, tf.encircle],
  [TypeFace.overline, tf.overline],
  [TypeFace.noFrame, tf.noFrame],
  [TypeFace.noEncircle, tf.noEncircle],
  [TypeFace.noOverline, tf.noOverline],
  [TypeFace.superscript, tf.superscript],
  [TypeFace.subscript, tf.subscript],
  [TypeFace.noSuperscript, tf.noSuperscript],
  [TypeFace.noSubscript, tf.noSubscript],
]);

//--------------------------------------------------------------------------------------------------
// Classes
//--------------------------------------------------------------------------------------------------
class ConfigImporter {
  /**
   * Import a help format configuration from a JSON configuration.
   * @param config The JSON configuration
   * @returns The help format configuration
   */
  static import(config: JsonConfig): HelpConfig {
    const { indent, breaks, hidden, items, styles } = config;
    return {
      indent,
      breaks,
      hidden,
      styles: this.importStyles(styles),
      items,
    };
  }

  private static importStyles(styles: JsonConfig['styles']): HelpConfig['styles'] {
    const result: { [key: string]: Style } = {};
    for (const key in styles) {
      result[key] = this.importStyle((styles as { [key: string]: HelpStyle })[key]);
    }
    return result;
  }

  private static importStyle(style: HelpStyle): Style {
    const { clear, fg, bg, tf, ff } = style;
    return {
      clear: clear ? true : undefined,
      fg: fg ? this.importFgColor(fg) : undefined,
      bg: bg ? this.importBgColor(bg) : undefined,
      tf: tf ? tf.map((name) => typeFaceToTf.get(name)!) : undefined,
      ff: ff ? fontFamilyToFf.get(ff)! : undefined,
    };
  }

  private static importFgColor(fg: NamedColor | number): fg | FgColor {
    return typeof fg === 'string' ? namedColorToFg.get(fg)! : fgColor(this.import8BitColor(fg));
  }

  private static importBgColor(bg: NamedColor | number): bg | BgColor {
    return typeof bg === 'string' ? namedColorToBg.get(bg)! : bgColor(this.import8BitColor(bg));
  }

  private static import8BitColor(value: number): Color {
    return Math.max(0, Math.min(255, value)).toString() as Color;
  }
}
