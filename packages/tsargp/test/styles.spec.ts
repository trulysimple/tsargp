import { describe, expect, it, vi } from 'vitest';
import { cs, tf, fg, bg, ul, seq, style, fg8, bg8, ul8 } from '../lib';
import { TerminalString, ErrorMessage, HelpMessage } from '../lib';

describe('TerminalString', () => {
  describe('addStyle', () => {
    it('should add text with sequences', () => {
      const str = new TerminalString()
        .addSequence(seq(cs.rcp))
        .addSequence(seq(cs.cbt, 1))
        .addSequence(seq(cs.tbm, 1, 2))
        .addSequence(seq(cs.rm, 1, 2, 3));
      expect(str).toHaveLength(0);
      expect(str.strings).toHaveLength(4);
      expect(str.strings[0]).toEqual('\x9bu');
      expect(str.strings[1]).toEqual('\x9b1Z');
      expect(str.strings[2]).toEqual('\x9b1;2r');
      expect(str.strings[3]).toEqual('\x9b1;2;3l');
    });
  });

  describe('addWord', () => {
    it('should add words without sequences', () => {
      const str = new TerminalString().addWord('type').addWord('script');
      expect(str).toHaveLength(10);
      expect(str.strings).toHaveLength(2);
      expect(str.strings[0]).toEqual('type');
      expect(str.strings[1]).toEqual('script');
    });
  });

  describe('addAndRevert', () => {
    it('should add a word with surrounding sequences', () => {
      const str = new TerminalString().addAndRevert(
        style(fg8(0), bg8(0), ul8(0)),
        'type',
        style(tf.clear),
      );
      expect(str).toHaveLength(4);
      expect(str.strings).toHaveLength(1);
      expect(str.strings[0]).toEqual('\x9b38;5;0;48;5;0;58;5;0m' + 'type' + '\x9b0m');
    });
  });

  describe('addOpening', () => {
    it('should add opening words to a word', () => {
      const str = new TerminalString().addOpening('[').addOpening('"').addWord('type');
      expect(str).toHaveLength(6);
      expect(str.strings).toHaveLength(1);
      expect(str.strings[0]).toEqual('["type');
    });
  });

  describe('addOther', () => {
    it('should add the strings from the other string', () => {
      const str1 = new TerminalString().splitText('type script').setMerge();
      const str2 = new TerminalString().addOther(str1).splitText(': is fun');
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
      const str = new TerminalString().addClosing(']');
      expect(str).toHaveLength(1);
      expect(str.strings).toHaveLength(1);
      expect(str.strings[0]).toEqual(']');
    });

    it('should add closing words to the last word', () => {
      const str = new TerminalString()
        .addWord('type')
        .addSequence(style(fg.default, bg.default, ul.default))
        .addClosing(']')
        .addClosing('.');
      expect(str).toHaveLength(6);
      expect(str.strings).toHaveLength(2);
      expect(str.strings[0]).toEqual('type');
      expect(str.strings[1]).toEqual('\x9b39;49;59m].');
    });
  });

  describe('splitText', () => {
    it('should split text with emojis', () => {
      const str = new TerminalString().splitText(`⚠️ type script`);
      expect(str).toHaveLength(12);
      expect(str.strings).toHaveLength(3);
      expect(str.strings[0]).toEqual('⚠️');
      expect(str.strings[1]).toEqual('type');
      expect(str.strings[2]).toEqual('script');
    });

    it('should split text with style sequences', () => {
      const str = new TerminalString().splitText(`${style(tf.clear)}type script${style(tf.clear)}`);
      expect(str).toHaveLength(10);
      expect(str.strings).toHaveLength(2);
      expect(str.strings[0]).toEqual('\x9b0mtype');
      expect(str.strings[1]).toEqual('script\x9b0m');
    });

    it('should split text with paragraphs', () => {
      const str = new TerminalString().splitText('type\nscript\n\nis\nfun');
      expect(str).toHaveLength(15);
      expect(str.strings).toHaveLength(5);
      expect(str.strings[0]).toEqual('type');
      expect(str.strings[1]).toEqual('script');
      expect(str.strings[2]).toEqual('\n\n');
      expect(str.strings[3]).toEqual('is');
      expect(str.strings[4]).toEqual('fun');
    });

    it('should split text with list items', () => {
      const str = new TerminalString().splitText('type:\n- script\n1. is fun');
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
      const format = vi.fn().mockImplementation(function (this: TerminalString) {
        this.addWord('abc');
      });
      const str = new TerminalString().splitText('type' + '%s script is %n' + 'fun', format);
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
      const format = vi.fn().mockImplementation(function (this: TerminalString) {
        this.splitText('- item\n* item\n1. item');
      });
      const str = new TerminalString().splitText('%s', format);
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
        const result = new Array<string>();
        new TerminalString().splitText('abc def').wrapToWidth(result, 0, 0, false);
        expect(result).toEqual(['abc', ' def']);
      });

      it('should preserve indentation', () => {
        const result = new Array<string>();
        new TerminalString(2).addWord('abc').wrapToWidth(result, 0, 0, false);
        expect(result).toEqual(['  ', 'abc']);
      });

      it('should not preserve indentation if the string is empty', () => {
        const result = new Array<string>();
        new TerminalString(2).wrapToWidth(result, 0, 0, false);
        expect(result).toEqual([]);
      });

      it('should not preserve indentation if the string starts with a line break', () => {
        const result = new Array<string>();
        new TerminalString(2).addBreaks(1).wrapToWidth(result, 0, 0, false);
        expect(result).toEqual(['\n']);
      });

      it('should shorten the current line (1)', () => {
        const result = ['  '];
        new TerminalString(0).splitText('abc def').wrapToWidth(result, 2, 0, false);
        expect(result).toEqual(['abc', ' def']);
      });

      it('should shorten the current line (2)', () => {
        const result = ['   '];
        new TerminalString(0).splitText('abc def').wrapToWidth(result, 2, 0, false);
        expect(result).toEqual([' ', 'abc', ' def']);
      });

      it('should not shorten the current line if the string is empty', () => {
        const result = ['  '];
        new TerminalString(0).wrapToWidth(result, 2, 0, false);
        expect(result).toEqual(['  ']);
      });

      it('should not shorten the current line if the string starts with a line break', () => {
        const result = ['  '];
        new TerminalString(0).addBreaks(1).wrapToWidth(result, 2, 0, false);
        expect(result).toEqual(['  ', '\n']);
      });

      it('should preserve line breaks', () => {
        const result = new Array<string>();
        new TerminalString(0).splitText('abc\n\ndef').wrapToWidth(result, 0, 0, false);
        expect(result).toEqual(['abc', '\n\n', 'def']);
      });

      it('should omit styles', () => {
        const result = new Array<string>();
        new TerminalString(0)
          .splitText(`abc${style(tf.clear)} ${style(tf.clear)} def`)
          .wrapToWidth(result, 0, 0, false);
        expect(result).toEqual(['abc', ' def']);
      });

      it('should emit styles', () => {
        const result = new Array<string>();
        new TerminalString()
          .splitText(`abc${style(tf.clear)} ${style(tf.clear)} def`)
          .wrapToWidth(result, 0, 0, true);
        expect(result).toEqual(['abc' + style(tf.clear), style(tf.clear), ' def']);
      });

      it('should preserve emojis', () => {
        const result = new Array<string>();
        new TerminalString().splitText('⚠️ abc').wrapToWidth(result, 0, 0, false);
        expect(result).toEqual(['⚠️', ' abc']);
      });
    });

    describe('when a width is provided', () => {
      it('should wrap relative to the beginning when the largest word does not fit the width (1)', () => {
        const result = new Array<string>();
        new TerminalString(1).splitText('abc largest').wrapToWidth(result, 0, 5, false);
        expect(result).toEqual(['abc', '\nlargest']);
      });

      it('should wrap relative to the beginning when the largest word does not fit the width (2)', () => {
        const result = new Array<string>();
        new TerminalString(1).splitText('abc largest').wrapToWidth(result, 1, 5, false);
        expect(result).toEqual(['\n', 'abc', '\nlargest']);
      });

      it('should wrap relative to the beginning when the largest word does not fit the width (3)', () => {
        const result = new Array<string>();
        new TerminalString(1)
          .addBreaks(1)
          .splitText('abc largest')
          .wrapToWidth(result, 1, 5, false);
        expect(result).toEqual(['\n', 'abc', '\nlargest']);
      });

      it('should wrap with a move sequence when the largest word fits the width (1)', () => {
        const result = new Array<string>();
        new TerminalString(1).splitText('abc largest').wrapToWidth(result, 1, 15, false);
        expect(result).toEqual(['abc', ' largest']);
      });

      it('should wrap with a move sequence when the largest word fits the width (2)', () => {
        const result = new Array<string>();
        new TerminalString(1).splitText('abc largest').wrapToWidth(result, 2, 15, false);
        expect(result).toEqual([seq(cs.cha, 2), 'abc', ' largest']);
      });

      it('should wrap with a move sequence when the largest word fits the width (3)', () => {
        const result = new Array<string>();
        new TerminalString(2).splitText('abc largest').wrapToWidth(result, 1, 15, false);
        expect(result).toEqual([seq(cs.cha, 3), 'abc', ' largest']);
      });

      it('should wrap with a move sequence when the largest word fits the width (4)', () => {
        const result = new Array<string>();
        new TerminalString(1).splitText('abc largest').wrapToWidth(result, 1, 10, false);
        expect(result).toEqual(['abc', `\n${seq(cs.cha, 2)}largest`]);
      });

      it('should wrap with a move sequence when the largest word fits the width (5)', () => {
        const result = new Array<string>();
        new TerminalString().splitText('abc largest').wrapToWidth(result, 0, 15, false);
        expect(result).toEqual(['abc', ' largest']);
      });

      it('should wrap with a move sequence when the largest word fits the width (6)', () => {
        const result = new Array<string>();
        new TerminalString().splitText('abc largest').wrapToWidth(result, 1, 15, false);
        expect(result).toEqual([seq(cs.cha, 1), 'abc', ' largest']);
      });

      it('should wrap with a move sequence when the largest word fits the width (7)', () => {
        const result = new Array<string>();
        new TerminalString()
          .addBreaks(1)
          .splitText('abc largest')
          .wrapToWidth(result, 1, 15, false);
        expect(result).toEqual(['\n', 'abc', ' largest']);
      });

      it('should wrap with a move sequence when the largest word fits the width (8)', () => {
        const result = new Array<string>();
        new TerminalString(1)
          .addBreaks(1)
          .splitText('abc largest')
          .wrapToWidth(result, 2, 15, false);
        expect(result).toEqual(['\n', seq(cs.cha, 2), 'abc', ' largest']);
      });

      it('should wrap with a move sequence when the largest word fits the width (9)', () => {
        const result = new Array<string>();
        new TerminalString(2)
          .addBreaks(1)
          .splitText('abc largest')
          .wrapToWidth(result, 1, 15, false);
        expect(result).toEqual(['\n', seq(cs.cha, 3), 'abc', ' largest']);
      });

      it('should omit styles', () => {
        const result = new Array<string>();
        new TerminalString(0)
          .splitText(`abc${style(tf.clear)} ${style(tf.clear)} def`)
          .wrapToWidth(result, 0, 10, false);
        expect(result).toEqual(['abc', ' def']);
      });

      it('should emit styles', () => {
        const result = new Array<string>();
        new TerminalString()
          .splitText(`abc${style(tf.clear)} ${style(tf.clear)} def`)
          .wrapToWidth(result, 0, 10, true);
        expect(result).toEqual(['abc' + style(tf.clear), style(tf.clear), ' def']);
      });

      it('should preserve emojis', () => {
        const result = new Array<string>();
        new TerminalString().splitText('⚠️ abc').wrapToWidth(result, 0, 10, false);
        expect(result).toEqual(['⚠️', ' abc']);
      });
    });
  });
});

describe('ErrorMessage', () => {
  it('should wrap the error message', () => {
    const str = new TerminalString(0).splitText('type script');
    const err = new ErrorMessage(str);
    expect(err.message).toMatch(/type script/);
    expect(err.wrap(0, false)).toEqual('type script');
    expect(err.wrap(0, true)).toEqual('type script' + style(tf.clear));
    expect(err.wrap(11, false)).toEqual('type script');
    expect(err.wrap(11, true)).toEqual('type script' + style(tf.clear));
  });

  it('should be thrown and caught', () => {
    const str = new TerminalString(0).splitText('type script');
    expect(() => {
      throw new ErrorMessage(str);
    }).toThrow('type script');
  });
});

describe('HelpMessage', () => {
  it('should wrap the help message', () => {
    const str = new TerminalString(0).splitText('type script');
    const help = new HelpMessage(str);
    expect(help.toString()).toMatch(/type script/);
    expect(help.wrap(0, false)).toEqual('type script');
    expect(help.wrap(0, true)).toEqual('type script' + style(tf.clear));
    expect(help.wrap(11, false)).toEqual('type script');
    expect(help.wrap(11, true)).toEqual('type script' + style(tf.clear));
  });
});
