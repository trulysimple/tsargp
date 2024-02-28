import { describe, expect, it } from 'vitest';
import { TerminalString, tf, ed, sc, mv } from '../lib';
import { isStyle, move, moveTo, edit, style, margin, scroll, fg8, bg8, ul8 } from '../lib';

describe('TerminalString', () => {
  it('should text with sequences', () => {
    const str = new TerminalString();
    str.addText(move(1, mv.cbt));
    str.addText(scroll(1, sc.sd));
    str.addText(margin(1, 2));
    str.addText(moveTo(1, 2));
    str.addText(style(tf.clear, fg8(0), bg8(0), ul8(0)));
    str.addText(edit(1, ed.dch));
    expect(str).toHaveLength(0);
    expect(str.strings).toHaveLength(6);
    expect(str.strings[0]).toEqual('\x9b1Z');
    expect(str.strings[1]).toEqual('\x9b1T');
    expect(str.strings[2]).toEqual('\x9b1;2r');
    expect(str.strings[3]).toEqual('\x9b1;2H');
    expect(str.strings[4]).toEqual('\x9b0;38;5;0;48;5;0;58;5;0m');
    expect(str.strings[5]).toEqual('\x9b1P');
    expect(isStyle(str.strings[4])).toBeTruthy();
  });

  it('should add texts without sequences', () => {
    const str = new TerminalString();
    str.addTexts('type', 'script');
    expect(str).toHaveLength(10);
    expect(str.strings).toHaveLength(2);
    expect(str.strings[0]).toEqual('type');
    expect(str.strings[1]).toEqual('script');
  });
});
