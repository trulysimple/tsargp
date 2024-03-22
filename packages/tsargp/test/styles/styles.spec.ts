import { describe, expect, it, vi } from 'vitest';
import { cs, tf, fg, bg, ul, seq, style, fg8, bg8, ul8 } from '../../lib';
import { TerminalString } from '../../lib';
import '../utils.spec'; // initialize globals

describe('TerminalString', () => {
  describe('addStyle', () => {
    it('should add text with sequences', () => {
      const str = new TerminalString()
        .addSequence(seq(cs.rcp))
        .addSequence(seq(cs.cbt, 1))
        .addSequence(seq(cs.tbm, 1, 2))
        .addSequence(seq(cs.rm, 1, 2, 3));
      expect(str).toHaveLength(0);
      expect(str.count).toEqual(4);
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
      expect(str.count).toEqual(2);
      expect(str.strings[0]).toEqual('type');
      expect(str.strings[1]).toEqual('script');
    });
  });

  describe('pop', () => {
    it('should remove the last word', () => {
      const str = new TerminalString().splitText('type script').pop();
      expect(str).toHaveLength(4);
      expect(str.count).toEqual(1);
      expect(str.strings[0]).toEqual('type');
    });

    it('should remove all words', () => {
      const str = new TerminalString().splitText('type script').pop(3);
      expect(str).toHaveLength(0);
      expect(str.count).toEqual(0);
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
      expect(str.count).toEqual(1);
      expect(str.strings[0]).toEqual('\x9b38;5;0;48;5;0;58;5;0m' + 'type' + '\x9b0m');
    });
  });

  describe('addOpening', () => {
    it('should add opening words to a word', () => {
      const str = new TerminalString().addOpening('[').addOpening('"').addWord('type');
      expect(str).toHaveLength(6);
      expect(str.count).toEqual(1);
      expect(str.strings[0]).toEqual('["type');
    });
  });

  describe('addOther', () => {
    it('should add the strings from the other string', () => {
      const str1 = new TerminalString().splitText('type script').setMerge();
      const str2 = new TerminalString().addOther(str1).splitText(': is fun');
      expect(str2).toHaveLength(16);
      expect(str2.count).toEqual(4);
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
      expect(str.count).toEqual(1);
      expect(str.strings[0]).toEqual(']');
    });

    it('should add closing words to the last word', () => {
      const str = new TerminalString()
        .addWord('type')
        .addSequence(style(fg.default, bg.default, ul.default))
        .addClosing(']')
        .addClosing('.');
      expect(str).toHaveLength(6);
      expect(str.count).toEqual(2);
      expect(str.strings[0]).toEqual('type');
      expect(str.strings[1]).toEqual('\x9b39;49;59m].');
    });
  });

  describe('splitText', () => {
    it('should split text with emojis', () => {
      const str = new TerminalString().splitText(`⚠️ type script`);
      expect(str).toHaveLength(12);
      expect(str.count).toEqual(3);
      expect(str.strings[0]).toEqual('⚠️');
      expect(str.strings[1]).toEqual('type');
      expect(str.strings[2]).toEqual('script');
    });

    it('should split text with style sequences', () => {
      const str = new TerminalString().splitText(`${style(tf.clear)}type script${style(tf.clear)}`);
      expect(str).toHaveLength(10);
      expect(str.count).toEqual(2);
      expect(str.strings[0]).toEqual('\x9b0mtype');
      expect(str.strings[1]).toEqual('script\x9b0m');
    });

    it('should split text with paragraphs', () => {
      const str = new TerminalString().splitText('type\nscript\n\nis\nfun');
      expect(str).toHaveLength(15);
      expect(str.count).toEqual(5);
      expect(str.strings[0]).toEqual('type');
      expect(str.strings[1]).toEqual('script');
      expect(str.strings[2]).toEqual('\n\n');
      expect(str.strings[3]).toEqual('is');
      expect(str.strings[4]).toEqual('fun');
    });

    it('should split text with list items', () => {
      const str = new TerminalString().splitText('type:\n- script\n1. is fun');
      expect(str).toHaveLength(19);
      expect(str.count).toEqual(8);
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
      expect(str.count).toEqual(4);
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
      expect(str.count).toEqual(8);
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
});
