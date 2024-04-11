import { describe, expect, it, vi } from 'vitest';
import { TerminalString, tf, style } from '../../lib';
import '../utils.spec'; // initialize globals

describe('TerminalString', () => {
  describe('split', () => {
    it('should split text with emojis', () => {
      const str = new TerminalString().split(`⚠️ type script`);
      expect(str.count).toEqual(3);
      expect(str.lengths).toEqual([2, 4, 6]);
      expect(str.strings).toEqual(['⚠️', 'type', 'script']);
    });

    it('should split text with style sequences', () => {
      const str = new TerminalString().split(`${style(tf.clear)}type script${style(tf.clear)}`);
      expect(str.count).toEqual(2);
      expect(str.lengths).toEqual([4, 6]);
      expect(str.strings).toEqual(['\x1b[0m' + 'type', 'script' + '\x1b[0m']);
    });

    it('should split text with paragraphs', () => {
      const str = new TerminalString().split('type\nscript\n\nis\nfun');
      expect(str.count).toEqual(5);
      expect(str.lengths).toEqual([4, 6, 0, 2, 3]);
      expect(str.strings).toEqual(['type', 'script', '\n\n', 'is', 'fun']);
    });

    it('should split text with list items', () => {
      const str = new TerminalString().split('type:\n- script\n1. is fun');
      expect(str.count).toEqual(8);
      expect(str.lengths).toEqual([5, 0, 1, 6, 0, 2, 2, 3]);
      expect(str.strings).toEqual(['type:', '\n', '-', 'script', '\n', '1.', 'is', 'fun']);
    });

    it('should split text with format specifiers', () => {
      const format = vi.fn().mockImplementation(function (this: TerminalString) {
        this.word('abc');
      });
      const str = new TerminalString().split('type' + '%s script is %n' + 'fun', format);
      expect(str.count).toEqual(4);
      expect(str.lengths).toEqual([7, 6, 2, 6]);
      expect(str.strings).toEqual(['type' + 'abc', 'script', 'is', 'abc' + 'fun']);
      expect(format).toHaveBeenCalledTimes(2);
      expect(format).toHaveBeenCalledWith('%s');
      expect(format).toHaveBeenCalledWith('%n');
    });

    it('should not add a line break to the first list item', () => {
      const format = vi.fn().mockImplementation(function (this: TerminalString) {
        this.split('- item\n* item\n1. item');
      });
      const str = new TerminalString().split('%s', format);
      expect(str.count).toEqual(8);
      expect(str.lengths).toEqual([1, 4, 0, 1, 4, 0, 2, 4]);
      expect(str.strings).toEqual(['-', 'item', '\n', '*', 'item', '\n', '1.', 'item']);
      expect(format).toHaveBeenCalledTimes(1);
      expect(format).toHaveBeenCalledWith('%s');
    });

    it('should not merge previous words with next words', () => {
      const format = vi.fn();
      const str = new TerminalString().word('type').split('%s%s', format).word('script');
      expect(str.count).toEqual(2);
      expect(str.lengths).toEqual([4, 6]);
      expect(str.strings).toEqual(['type', 'script']);
      expect(format).toHaveBeenCalledTimes(2);
      expect(format).toHaveBeenCalledWith('%s');
    });
  });
});
