import { describe, expect, it, vi } from 'vitest';
import { TerminalString, tf, style } from '../../lib';
import '../utils.spec'; // initialize globals

describe('TerminalString', () => {
  describe('splitText', () => {
    it('should split text with emojis', () => {
      const str = new TerminalString().split(`⚠️ type script`);
      expect(str).toHaveLength(12);
      expect(str.count).toEqual(3);
      expect(str.strings[0]).toEqual('⚠️');
      expect(str.strings[1]).toEqual('type');
      expect(str.strings[2]).toEqual('script');
    });

    it('should split text with style sequences', () => {
      const str = new TerminalString().split(`${style(tf.clear)}type script${style(tf.clear)}`);
      expect(str).toHaveLength(10);
      expect(str.count).toEqual(2);
      expect(str.strings[0]).toEqual('\x9b0mtype');
      expect(str.strings[1]).toEqual('script\x9b0m');
    });

    it('should split text with paragraphs', () => {
      const str = new TerminalString().split('type\nscript\n\nis\nfun');
      expect(str).toHaveLength(15);
      expect(str.count).toEqual(5);
      expect(str.strings[0]).toEqual('type');
      expect(str.strings[1]).toEqual('script');
      expect(str.strings[2]).toEqual('\n\n');
      expect(str.strings[3]).toEqual('is');
      expect(str.strings[4]).toEqual('fun');
    });

    it('should split text with list items', () => {
      const str = new TerminalString().split('type:\n- script\n1. is fun');
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
        this.word('abc');
      });
      const str = new TerminalString().split('type' + '%s script is %n' + 'fun', format);
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
        this.split('- item\n* item\n1. item');
      });
      const str = new TerminalString().split('%s', format);
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
      expect(format).toHaveBeenCalledTimes(1);
      expect(format).toHaveBeenCalledWith('%s');
    });

    it('should not merge previous words with next words', () => {
      const format = vi.fn();
      const str = new TerminalString().word('type').split('%s%s', format).word('script');
      expect(str).toHaveLength(10);
      expect(str.count).toEqual(2);
      expect(str.strings[0]).toEqual('type');
      expect(str.strings[1]).toEqual('script');
      expect(format).toHaveBeenCalledTimes(2);
      expect(format).toHaveBeenCalledWith('%s');
    });
  });
});
