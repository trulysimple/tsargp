import { describe, expect, it } from 'vitest';
import { TerminalString, tf, ed, sc, mv } from '../lib';
import { isStyle, move, moveTo, edit, style, margin, scroll, fg8, bg8, ul8 } from '../lib';

describe('TerminalString', () => {
  it('should not add the same sequence twice', () => {
    const str = new TerminalString();
    str.addSequence(move(1, mv.cbt)).addSequence(move(1, mv.cbt));
    expect(str).toHaveLength(0);
    expect(str.string).toEqual('\x9b1Z');
    expect(str.maxTextLen).toEqual(0);
  });

  it('should add two different sequences', () => {
    const str = new TerminalString();
    str.addSequence(style(tf.clear)).addSequence(style(fg8(0), bg8(0), ul8(0)));
    expect(str).toHaveLength(0);
    expect(str.string).toEqual('\x9b0m\x9b38;5;0;48;5;0;58;5;0m');
    expect(str.maxTextLen).toEqual(0);
    expect(isStyle(str.string)).toBeTruthy();
  });

  it('should add texts', () => {
    const str = new TerminalString();
    str.addText('type', 'script');
    expect(str).toHaveLength(10);
    expect(str.string).toEqual('typescript');
    expect(str.maxTextLen).toEqual(6);
  });

  it('should not add the same sequence twice when intermingled with text', () => {
    const str = new TerminalString();
    str.addSequence(moveTo(1, 2)).addText('type', 'script').addSequence(moveTo(1, 2));
    expect(str).toHaveLength(10);
    expect(str.string).toEqual('\x9b1;2H' + 'typescript');
    expect(str.maxTextLen).toEqual(6);
  });

  it('should add a terminal string and keep its last applied sequence', () => {
    const str1 = new TerminalString();
    const str2 = new TerminalString();
    str1.addSequence(edit(1, ed.dch)).addText('type', 'script');
    str2.addOther(str1).addSequence(edit(1, ed.dch));
    expect(str2).toHaveLength(10);
    expect(str2.string).toEqual('\x9b1P' + 'typescript');
    expect(str2.maxTextLen).toEqual(6);
  });

  it('should add a terminal string without sequences', () => {
    const str1 = new TerminalString();
    const str2 = new TerminalString();
    str1.addText('type', 'script');
    str2.addSequence(scroll(1, sc.sd)).addOther(str1);
    expect(str2).toHaveLength(10);
    expect(str2.string).toEqual('\x9b1T' + 'typescript');
    expect(str2.maxTextLen).toEqual(6);
  });

  it('should add a terminal string whose first sequence is the same as its last sequence', () => {
    const str1 = new TerminalString();
    const str2 = new TerminalString();
    str1.addSequence(margin(1, 2)).addText('type', 'script');
    str2.addSequence(margin(1, 2)).addOther(str1);
    expect(str2).toHaveLength(10);
    expect(str2.string).toEqual('\x9b1;2r' + 'typescript');
    expect(str2.maxTextLen).toEqual(6);
  });
});
