import { describe, expect, it } from 'vitest';
import { TerminalString, tf, ed, sc, mv } from '../lib';
import { move, moveTo, edit, style, margin, scroll, fg8, bg8, ul8 } from '../lib';

describe('TerminalString', () => {
  describe('addText', () => {
    it('should add text with sequences', () => {
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
    });
  });

  describe('addWords', () => {
    it('should add words without sequences', () => {
      const str = new TerminalString();
      str.addWords('type', 'script');
      expect(str).toHaveLength(10);
      expect(str.strings).toHaveLength(2);
      expect(str.strings[0]).toEqual('type');
      expect(str.strings[1]).toEqual('script');
    });
  });

  describe('splitText', () => {
    it('should split text with style sequences', () => {
      const str = new TerminalString();
      str.splitText(`${style(tf.clear)}type script${style(tf.clear)}`);
      expect(str).toHaveLength(10);
      expect(str.strings).toHaveLength(4);
      expect(str.strings[0]).toEqual('\x9b0m');
      expect(str.strings[1]).toEqual('type');
      expect(str.strings[2]).toEqual('script');
      expect(str.strings[3]).toEqual('\x9b0m');
    });

    it('should split text with paragraphs', () => {
      const str = new TerminalString();
      str.splitText(`type\nscript\n\nis\nfun`, '.');
      expect(str).toHaveLength(17);
      expect(str.strings).toHaveLength(7);
      expect(str.strings[0]).toEqual('type');
      expect(str.strings[1]).toEqual('script');
      expect(str.strings[2]).toEqual('.');
      expect(str.strings[3]).toEqual('\n\n');
      expect(str.strings[4]).toEqual('is');
      expect(str.strings[5]).toEqual('fun');
      expect(str.strings[6]).toEqual('.');
    });

    it('should split text with list items', () => {
      const str = new TerminalString();
      str.splitText(`type:\n- script\n1. is fun`, '.');
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
  });
});
