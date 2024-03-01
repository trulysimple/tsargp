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
    it('should add an opening word to a word', () => {
      const str = new TerminalString();
      str.addOpening('[').addWord('type');
      expect(str).toHaveLength(5);
      expect(str.strings).toHaveLength(1);
      expect(str.strings[0]).toEqual('[type');
    });
  });

  describe('addClosing', () => {
    it('should not add a closing word when there are no strings', () => {
      const str = new TerminalString();
      str.addClosing(']');
      expect(str).toHaveLength(0);
      expect(str.strings).toHaveLength(0);
    });

    it('should add a closing word to the last word', () => {
      const str = new TerminalString();
      str.addWord('type').addSequence(moveTo(1, 2)).addClosing(']');
      expect(str).toHaveLength(5);
      expect(str.strings).toHaveLength(2);
      expect(str.strings[0]).toEqual('type]');
      expect(str.strings[1]).toEqual('\x9b1;2H');
    });
  });

  describe('splitText', () => {
    it('should split text with style sequences', () => {
      const str = new TerminalString();
      str.splitText(`${style(tf.clear)}type script${style(tf.clear)}`);
      expect(str).toHaveLength(11);
      expect(str.strings).toHaveLength(2);
      expect(str.strings[0]).toEqual('\x9b0mtype');
      expect(str.strings[1]).toEqual('script\x9b0m.');
    });

    it('should split text with paragraphs', () => {
      const str = new TerminalString();
      str.splitText('type\nscript\n\nis\nfun');
      expect(str).toHaveLength(17);
      expect(str.strings).toHaveLength(5);
      expect(str.strings[0]).toEqual('type');
      expect(str.strings[1]).toEqual('script.');
      expect(str.strings[2]).toEqual('\n\n');
      expect(str.strings[3]).toEqual('is');
      expect(str.strings[4]).toEqual('fun.');
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
      str.splitText('type' + '%s script is %s' + 'fun', format);
      expect(str).toHaveLength(15);
      expect(str.strings).toHaveLength(4);
      expect(str.strings[0]).toEqual('abc');
      expect(str.strings[1]).toEqual('script');
      expect(str.strings[2]).toEqual('is');
      expect(str.strings[3]).toEqual('abc.');
      expect(format).toHaveBeenCalledTimes(2);
      expect(format).toHaveBeenCalledWith('type' + '%s', '%s');
      expect(format).toHaveBeenCalledWith('%s' + 'fun', '%s');
    });

    it('should not add two periods in a row', () => {
      const str = new TerminalString();
      const format = vi.fn().mockImplementation(() => {
        str.splitText('script');
      });
      str.splitText('type %s', format);
      expect(str).toHaveLength(11);
      expect(str.strings).toHaveLength(2);
      expect(str.strings[0]).toEqual('type');
      expect(str.strings[1]).toEqual('script.');
      expect(format).toHaveBeenCalledTimes(1);
    });

    it('should not add a period to an empty paragraph', () => {
      const str = new TerminalString();
      str.splitText('- type\n\n');
      expect(str).toHaveLength(5);
      expect(str.strings).toHaveLength(3);
      expect(str.strings[0]).toEqual('-');
      expect(str.strings[1]).toEqual('type');
      expect(str.strings[2]).toEqual('\n\n');
    });

    it('should not add a period to a list', () => {
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
        str.splitText('abc def').wrapToWidth(result, 0);
        expect(result).toEqual(['abc', ' def.']);
      });

      it('should preserve indentation', () => {
        const str = new TerminalString(2);
        const result = new Array<string>();
        str.addWord('abc').wrapToWidth(result, 0);
        expect(result).toEqual(['  ', 'abc']);
      });

      it('should not preserve indentation if the string is empty', () => {
        const str = new TerminalString(2);
        const result = new Array<string>();
        str.wrapToWidth(result, 0);
        expect(result).toEqual([]);
      });

      it('should not preserve indentation if the string starts with a line break', () => {
        const str = new TerminalString(2);
        const result = new Array<string>();
        str.addBreaks(1).wrapToWidth(result, 0);
        expect(result).toEqual(['\n']);
      });

      it('should shorten the current line (1)', () => {
        const str = new TerminalString(0);
        const result = ['  '];
        str.splitText('abc def').wrapToWidth(result, 2);
        expect(result).toEqual(['abc', ' def.']);
      });

      it('should shorten the current line (2)', () => {
        const str = new TerminalString(0);
        const result = ['   '];
        str.splitText('abc def').wrapToWidth(result, 2);
        expect(result).toEqual([' ', 'abc', ' def.']);
      });

      it('should not shorten the current line if the string is empty', () => {
        const str = new TerminalString(0);
        const result = ['  '];
        str.wrapToWidth(result, 2);
        expect(result).toEqual(['  ']);
      });

      it('should not shorten the current line if the string starts with a line break', () => {
        const str = new TerminalString(0);
        const result = ['  '];
        str.addBreaks(1).wrapToWidth(result, 2);
        expect(result).toEqual(['  ', '\n']);
      });

      it('should preserve line breaks', () => {
        const str = new TerminalString(0);
        const result = new Array<string>();
        str.splitText('abc\n\ndef').wrapToWidth(result, 0);
        expect(result).toEqual(['abc.', '\n\n', 'def.']);
      });

      it('should remove styles', () => {
        const str = new TerminalString(0);
        const result = new Array<string>();
        str.splitText(`abc${style(tf.clear)} ${style(tf.clear)} def`).wrapToWidth(result, 0);
        expect(result).toEqual(['abc', ' def.']);
      });
    });

    describe('when a width is provided', () => {
      it('should wrap relative to the beginning when the largest word does not fit the width (1)', () => {
        const str = new TerminalString(1);
        const result = new Array<string>();
        str.splitText('abc largest').wrapToWidth(result, 0, 5);
        expect(result).toEqual(['abc', '\nlargest.']);
      });

      it('should wrap relative to the beginning when the largest word does not fit the width (2)', () => {
        const str = new TerminalString(1);
        const result = new Array<string>();
        str.splitText('abc largest').wrapToWidth(result, 1, 5);
        expect(result).toEqual(['\n', 'abc', '\nlargest.']);
      });

      it('should wrap relative to the beginning when the largest word does not fit the width (3)', () => {
        const str = new TerminalString(1);
        const result = new Array<string>();
        str.addBreaks(1).splitText('abc largest').wrapToWidth(result, 1, 5);
        expect(result).toEqual(['\n', 'abc', '\nlargest.']);
      });

      it('should wrap with a move sequence when the largest word fits the width (1)', () => {
        const str = new TerminalString(1);
        const result = new Array<string>();
        str.splitText('abc largest').wrapToWidth(result, 1, 15);
        expect(result).toEqual(['abc', ' largest.']);
      });

      it('should wrap with a move sequence when the largest word fits the width (2)', () => {
        const str = new TerminalString(1);
        const result = new Array<string>();
        str.splitText('abc largest').wrapToWidth(result, 2, 15);
        expect(result).toEqual([move(2, mv.cha), 'abc', ' largest.']);
      });

      it('should wrap with a move sequence when the largest word fits the width (3)', () => {
        const str = new TerminalString(2);
        const result = new Array<string>();
        str.splitText('abc largest').wrapToWidth(result, 1, 15);
        expect(result).toEqual([move(3, mv.cha), 'abc', ' largest.']);
      });

      it('should wrap with a move sequence when the largest word fits the width (4)', () => {
        const str = new TerminalString(1);
        const result = new Array<string>();
        str.splitText('abc largest').wrapToWidth(result, 1, 10);
        expect(result).toEqual(['abc', `\n${move(2, mv.cha)}largest.`]);
      });

      it('should wrap with a move sequence when the largest word fits the width (5)', () => {
        const str = new TerminalString();
        const result = new Array<string>();
        str.splitText('abc largest').wrapToWidth(result, 0, 15);
        expect(result).toEqual(['abc', ' largest.']);
      });

      it('should wrap with a move sequence when the largest word fits the width (6)', () => {
        const str = new TerminalString();
        const result = new Array<string>();
        str.splitText('abc largest').wrapToWidth(result, 1, 15);
        expect(result).toEqual([move(1, mv.cha), 'abc', ' largest.']);
      });

      it('should wrap with a move sequence when the largest word fits the width (7)', () => {
        const str = new TerminalString();
        const result = new Array<string>();
        str.addBreaks(1).splitText('abc largest').wrapToWidth(result, 1, 15);
        expect(result).toEqual(['\n', 'abc', ' largest.']);
      });

      it('should wrap with a move sequence when the largest word fits the width (8)', () => {
        const str = new TerminalString(1);
        const result = new Array<string>();
        str.addBreaks(1).splitText('abc largest').wrapToWidth(result, 2, 15);
        expect(result).toEqual(['\n', `${move(2, mv.cha)}abc`, ' largest.']);
      });

      it('should wrap with a move sequence when the largest word fits the width (9)', () => {
        const str = new TerminalString(2);
        const result = new Array<string>();
        str.addBreaks(1).splitText('abc largest').wrapToWidth(result, 1, 15);
        expect(result).toEqual(['\n', `${move(3, mv.cha)}abc`, ' largest.']);
      });
    });
  });
});

describe('ErrorMessage', () => {
  it('should wrap the error message', () => {
    const str = new TerminalString(0);
    str.splitText('type script');
    const err = new ErrorMessage(str);
    expect(err.message).toEqual('type script.');
  });

  it('should be thrown and caught', () => {
    const str = new TerminalString(0);
    str.splitText('type script');
    const err = new ErrorMessage(str);
    expect(() => {
      throw err;
    }).toThrow('type script.');
  });
});

describe('HelpMessage', () => {
  it('should wrap the help message', () => {
    const str = new TerminalString(0);
    str.splitText('type script');
    const help = new HelpMessage();
    help.push(str);
    expect(help.toString()).toEqual('type script.');
  });
});
