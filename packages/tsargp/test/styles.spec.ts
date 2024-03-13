import { describe, expect, it, vi } from 'vitest';
import { TerminalString, ErrorMessage, HelpMessage, tf, ed, sc, mv } from '../lib';
import { move, moveTo, edit, style, margin, scroll, fg8, bg8, ul8 } from '../lib';

describe('TerminalString', () => {
  describe('addStyle', () => {
    it('should add text with sequences', () => {
      const str = new TerminalString();
      str.addSequence(move(1, mv.cbt));
      str.addSequence(scroll(1, sc.sd));
      str.addSequence(margin(1, 2));
      expect(str).toHaveLength(0);
      expect(str.strings).toHaveLength(3);
      expect(str.strings[0]).toEqual('\x9b1Z');
      expect(str.strings[1]).toEqual('\x9b1T');
      expect(str.strings[2]).toEqual('\x9b1;2r');
    });
  });

  describe('addWord', () => {
    it('should add words without sequences', () => {
      const str = new TerminalString();
      str.addWord('type').addWord('script');
      expect(str).toHaveLength(10);
      expect(str.strings).toHaveLength(2);
      expect(str.strings[0]).toEqual('type');
      expect(str.strings[1]).toEqual('script');
    });
  });

  describe('addAndRevert', () => {
    it('should add a word with surrounding sequences', () => {
      const str = new TerminalString();
      str.addAndRevert(style(fg8(0), bg8(0), ul8(0)), 'type', edit(1, ed.dch));
      expect(str).toHaveLength(4);
      expect(str.strings).toHaveLength(1);
      expect(str.strings[0]).toEqual('\x9b38;5;0;48;5;0;58;5;0m' + 'type' + '\x9b1P');
    });
  });

  describe('addOpening', () => {
    it('should add opening words to a word', () => {
      const str = new TerminalString();
      str.addOpening('[').addOpening('"').addWord('type');
      expect(str).toHaveLength(6);
      expect(str.strings).toHaveLength(1);
      expect(str.strings[0]).toEqual('["type');
    });
  });

  describe('addOther', () => {
    it('should add the strings from the other string', () => {
      const str1 = new TerminalString();
      const str2 = new TerminalString();
      str1.splitText('type script').setMerge();
      str2.addOther(str1).splitText(': is fun');
      expect(str2).toHaveLength(16);
      expect(str2.strings).toHaveLength(4);
      expect(str2.strings[0]).toEqual('type');
      expect(str2.strings[1]).toEqual('script:');
      expect(str2.strings[2]).toEqual('is');
      expect(str2.strings[3]).toEqual('fun');
    });
  });

  describe('addClosing', () => {
    it('should add a closing word when there are no strings', () => {
      const str = new TerminalString();
      str.addClosing(']');
      expect(str).toHaveLength(1);
      expect(str.strings).toHaveLength(1);
      expect(str.strings[0]).toEqual(']');
    });

    it('should add closing words to the last word', () => {
      const str = new TerminalString();
      str.addWord('type').addSequence(moveTo(1, 2)).addClosing(']').addClosing('.');
      expect(str).toHaveLength(6);
      expect(str.strings).toHaveLength(2);
      expect(str.strings[0]).toEqual('type');
      expect(str.strings[1]).toEqual('\x9b1;2H].');
    });
  });

  describe('splitText', () => {
    it('should split text with style sequences', () => {
      const str = new TerminalString();
      str.splitText(`${style(tf.clear)}type script${style(tf.clear)}`);
      expect(str).toHaveLength(10);
      expect(str.strings).toHaveLength(2);
      expect(str.strings[0]).toEqual('\x9b0mtype');
      expect(str.strings[1]).toEqual('script\x9b0m');
    });

    it('should split text with paragraphs', () => {
      const str = new TerminalString();
      str.splitText('type\nscript\n\nis\nfun');
      expect(str).toHaveLength(15);
      expect(str.strings).toHaveLength(5);
      expect(str.strings[0]).toEqual('type');
      expect(str.strings[1]).toEqual('script');
      expect(str.strings[2]).toEqual('\n\n');
      expect(str.strings[3]).toEqual('is');
      expect(str.strings[4]).toEqual('fun');
    });

    it('should split text with list items', () => {
      const str = new TerminalString();
      str.splitText('type:\n- script\n1. is fun');
      expect(str).toHaveLength(19);
      expect(str.strings).toHaveLength(8);
      expect(str.strings[0]).toEqual('type:');
      expect(str.strings[1]).toEqual('\n');
      expect(str.strings[2]).toEqual('-');
      expect(str.strings[3]).toEqual('script');
      expect(str.strings[4]).toEqual('\n');
      expect(str.strings[5]).toEqual('1.');
      expect(str.strings[6]).toEqual('is');
      expect(str.strings[7]).toEqual('fun');
    });

    it('should split text with format specifiers', () => {
      const str = new TerminalString();
      const format = vi.fn().mockImplementation(() => {
        str.addWord('abc');
      });
      str.splitText('type' + '%s script is %n' + 'fun', format);
      expect(str).toHaveLength(21);
      expect(str.strings).toHaveLength(4);
      expect(str.strings[0]).toEqual('type' + 'abc');
      expect(str.strings[1]).toEqual('script');
      expect(str.strings[2]).toEqual('is');
      expect(str.strings[3]).toEqual('abc' + 'fun');
      expect(format).toHaveBeenCalledTimes(2);
      expect(format).toHaveBeenCalledWith('%s');
      expect(format).toHaveBeenCalledWith('%n');
    });

    it('should not add a line break to the first list item', () => {
      const str = new TerminalString();
      const format = vi.fn().mockImplementation(() => {
        str.splitText('- item\n* item\n1. item');
      });
      str.splitText('%s', format);
      expect(str).toHaveLength(16);
      expect(str.strings).toHaveLength(8);
      expect(str.strings[0]).toEqual('-');
      expect(str.strings[1]).toEqual('item');
      expect(str.strings[2]).toEqual('\n');
      expect(str.strings[3]).toEqual('*');
      expect(str.strings[4]).toEqual('item');
      expect(str.strings[5]).toEqual('\n');
      expect(str.strings[6]).toEqual('1.');
      expect(str.strings[7]).toEqual('item');
    });
  });

  describe('wrapToWidth', () => {
    describe('when no width is provided', () => {
      it('should not wrap', () => {
        const str = new TerminalString();
        const result = new Array<string>();
        str.splitText('abc def').wrapToWidth(result, 0, 0, false);
        expect(result).toEqual(['abc', ' def']);
      });

      it('should preserve indentation', () => {
        const str = new TerminalString(2);
        const result = new Array<string>();
        str.addWord('abc').wrapToWidth(result, 0, 0, false);
        expect(result).toEqual(['  ', 'abc']);
      });

      it('should not preserve indentation if the string is empty', () => {
        const str = new TerminalString(2);
        const result = new Array<string>();
        str.wrapToWidth(result, 0, 0, false);
        expect(result).toEqual([]);
      });

      it('should not preserve indentation if the string starts with a line break', () => {
        const str = new TerminalString(2);
        const result = new Array<string>();
        str.addBreaks(1).wrapToWidth(result, 0, 0, false);
        expect(result).toEqual(['\n']);
      });

      it('should shorten the current line (1)', () => {
        const str = new TerminalString(0);
        const result = ['  '];
        str.splitText('abc def').wrapToWidth(result, 2, 0, false);
        expect(result).toEqual(['abc', ' def']);
      });

      it('should shorten the current line (2)', () => {
        const str = new TerminalString(0);
        const result = ['   '];
        str.splitText('abc def').wrapToWidth(result, 2, 0, false);
        expect(result).toEqual([' ', 'abc', ' def']);
      });

      it('should not shorten the current line if the string is empty', () => {
        const str = new TerminalString(0);
        const result = ['  '];
        str.wrapToWidth(result, 2, 0, false);
        expect(result).toEqual(['  ']);
      });

      it('should not shorten the current line if the string starts with a line break', () => {
        const str = new TerminalString(0);
        const result = ['  '];
        str.addBreaks(1).wrapToWidth(result, 2, 0, false);
        expect(result).toEqual(['  ', '\n']);
      });

      it('should preserve line breaks', () => {
        const str = new TerminalString(0);
        const result = new Array<string>();
        str.splitText('abc\n\ndef').wrapToWidth(result, 0, 0, false);
        expect(result).toEqual(['abc', '\n\n', 'def']);
      });

      it('should omit styles', () => {
        const str = new TerminalString(0);
        const result = new Array<string>();
        str
          .splitText(`abc${style(tf.clear)} ${style(tf.clear)} def`)
          .wrapToWidth(result, 0, 0, false);
        expect(result).toEqual(['abc', ' def']);
      });

      it('should emit styles', () => {
        const str = new TerminalString();
        const result = new Array<string>();
        str
          .splitText(`abc${style(tf.clear)} ${style(tf.clear)} def`)
          .wrapToWidth(result, 0, 0, true);
        expect(result).toEqual(['abc' + style(tf.clear), style(tf.clear), ' def']);
      });
    });

    describe('when a width is provided', () => {
      it('should wrap relative to the beginning when the largest word does not fit the width (1)', () => {
        const str = new TerminalString(1);
        const result = new Array<string>();
        str.splitText('abc largest').wrapToWidth(result, 0, 5, false);
        expect(result).toEqual(['abc', '\nlargest']);
      });

      it('should wrap relative to the beginning when the largest word does not fit the width (2)', () => {
        const str = new TerminalString(1);
        const result = new Array<string>();
        str.splitText('abc largest').wrapToWidth(result, 1, 5, false);
        expect(result).toEqual(['\n', 'abc', '\nlargest']);
      });

      it('should wrap relative to the beginning when the largest word does not fit the width (3)', () => {
        const str = new TerminalString(1);
        const result = new Array<string>();
        str.addBreaks(1).splitText('abc largest').wrapToWidth(result, 1, 5, false);
        expect(result).toEqual(['\n', 'abc', '\nlargest']);
      });

      it('should wrap with a move sequence when the largest word fits the width (1)', () => {
        const str = new TerminalString(1);
        const result = new Array<string>();
        str.splitText('abc largest').wrapToWidth(result, 1, 15, false);
        expect(result).toEqual(['abc', ' largest']);
      });

      it('should wrap with a move sequence when the largest word fits the width (2)', () => {
        const str = new TerminalString(1);
        const result = new Array<string>();
        str.splitText('abc largest').wrapToWidth(result, 2, 15, false);
        expect(result).toEqual([move(2, mv.cha), 'abc', ' largest']);
      });

      it('should wrap with a move sequence when the largest word fits the width (3)', () => {
        const str = new TerminalString(2);
        const result = new Array<string>();
        str.splitText('abc largest').wrapToWidth(result, 1, 15, false);
        expect(result).toEqual([move(3, mv.cha), 'abc', ' largest']);
      });

      it('should wrap with a move sequence when the largest word fits the width (4)', () => {
        const str = new TerminalString(1);
        const result = new Array<string>();
        str.splitText('abc largest').wrapToWidth(result, 1, 10, false);
        expect(result).toEqual(['abc', `\n${move(2, mv.cha)}largest`]);
      });

      it('should wrap with a move sequence when the largest word fits the width (5)', () => {
        const str = new TerminalString();
        const result = new Array<string>();
        str.splitText('abc largest').wrapToWidth(result, 0, 15, false);
        expect(result).toEqual(['abc', ' largest']);
      });

      it('should wrap with a move sequence when the largest word fits the width (6)', () => {
        const str = new TerminalString();
        const result = new Array<string>();
        str.splitText('abc largest').wrapToWidth(result, 1, 15, false);
        expect(result).toEqual([move(1, mv.cha), 'abc', ' largest']);
      });

      it('should wrap with a move sequence when the largest word fits the width (7)', () => {
        const str = new TerminalString();
        const result = new Array<string>();
        str.addBreaks(1).splitText('abc largest').wrapToWidth(result, 1, 15, false);
        expect(result).toEqual(['\n', 'abc', ' largest']);
      });

      it('should wrap with a move sequence when the largest word fits the width (8)', () => {
        const str = new TerminalString(1);
        const result = new Array<string>();
        str.addBreaks(1).splitText('abc largest').wrapToWidth(result, 2, 15, false);
        expect(result).toEqual(['\n', `${move(2, mv.cha)}abc`, ' largest']);
      });

      it('should wrap with a move sequence when the largest word fits the width (9)', () => {
        const str = new TerminalString(2);
        const result = new Array<string>();
        str.addBreaks(1).splitText('abc largest').wrapToWidth(result, 1, 15, false);
        expect(result).toEqual(['\n', `${move(3, mv.cha)}abc`, ' largest']);
      });

      it('should omit styles', () => {
        const str = new TerminalString(0);
        const result = new Array<string>();
        str
          .splitText(`abc${style(tf.clear)} ${style(tf.clear)} def`)
          .wrapToWidth(result, 0, 10, false);
        expect(result).toEqual(['abc', ' def']);
      });

      it('should emit styles', () => {
        const str = new TerminalString();
        const result = new Array<string>();
        str
          .splitText(`abc${style(tf.clear)} ${style(tf.clear)} def`)
          .wrapToWidth(result, 0, 10, true);
        expect(result).toEqual(['abc' + style(tf.clear), style(tf.clear), ' def']);
      });
    });
  });
});

describe('ErrorMessage', () => {
  it('should wrap the error message', () => {
    const str = new TerminalString(0);
    str.splitText('type script');
    const err = new ErrorMessage(str);
    expect(err.message).toMatch(/type script/);
    expect(err.wrap(0, false)).toEqual('type script');
    expect(err.wrap(0, true)).toEqual('type script' + style(tf.clear));
    expect(err.wrap(11, false)).toEqual('type script');
    expect(err.wrap(11, true)).toEqual('type script' + style(tf.clear));
  });

  it('should be thrown and caught', () => {
    const str = new TerminalString(0);
    str.splitText('type script');
    const err = new ErrorMessage(str);
    expect(() => {
      throw err;
    }).toThrow('type script');
  });
});

describe('HelpMessage', () => {
  it('should wrap the help message', () => {
    const str = new TerminalString(0);
    str.splitText('type script');
    const help = new HelpMessage();
    help.push(str);
    expect(help.toString()).toMatch(/type script/);
    expect(help.wrap(0, false)).toEqual('type script');
    expect(help.wrap(0, true)).toEqual('type script' + style(tf.clear));
    expect(help.wrap(11, false)).toEqual('type script');
    expect(help.wrap(11, true)).toEqual('type script' + style(tf.clear));
  });
});
