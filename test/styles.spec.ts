import { describe, expect, it } from 'vitest';
import { TerminalString, tf, ed, sc, mv } from '../lib';
import { isStyle, move, moveTo, edit, style, margin, scroll, fg8, bg8, ul8 } from '../lib';

describe('TerminalString', () => {
  it('should not add the same sequence twice in a row', () => {
    const str = new TerminalString();
    str.addSequence(move(1, mv.cbt), move(1, mv.cbt), scroll(1, sc.sd), margin(1, 2));
    expect(str).toHaveLength(0);
    expect(str.strings).toHaveLength(3);
    expect(str.strings[0]).toEqual('\x9b1Z');
    expect(str.strings[1]).toEqual('\x9b1T');
    expect(str.strings[2]).toEqual('\x9b1;2r');
    expect(str.maxTextLen).toEqual(0);
  });

  it('should add two different sequences', () => {
    const str = new TerminalString();
    str.addSequence(moveTo(1, 2)).addSequence(style(tf.clear, fg8(0), bg8(0), ul8(0)));
    expect(str).toHaveLength(0);
    expect(str.strings).toHaveLength(2);
    expect(str.strings[0]).toEqual('\x9b1;2H');
    expect(str.strings[1]).toEqual('\x9b0;38;5;0;48;5;0;58;5;0m');
    expect(str.maxTextLen).toEqual(0);
    expect(isStyle(str.strings[1])).toBeTruthy();
  });

  it('should add texts', () => {
    const str = new TerminalString();
    str.addText('type', 'script');
    expect(str).toHaveLength(10);
    expect(str.strings).toHaveLength(2);
    expect(str.strings[0]).toEqual('type');
    expect(str.strings[1]).toEqual('script');
    expect(str.maxTextLen).toEqual(6);
  });

  it('should not add the same sequence twice when intermingled with text', () => {
    const str = new TerminalString();
    str.addSequence(edit(1, ed.dch)).addText('type', 'script').addSequence(edit(1, ed.dch));
    expect(str).toHaveLength(10);
    expect(str.strings).toHaveLength(3);
    expect(str.strings[0]).toEqual('\x9b1P');
    expect(str.strings[1]).toEqual('type');
    expect(str.strings[2]).toEqual('script');
    expect(str.maxTextLen).toEqual(6);
  });
});
