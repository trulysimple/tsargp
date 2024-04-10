import { describe, expect, it } from 'vitest';
import { type FormatStyles, TerminalString } from '../../lib';
import { cs, tf, fg, bg, ul, seq, style, fg8, bg8, ul8 } from '../../lib';
import '../utils.spec'; // initialize globals

describe('TerminalString', () => {
  describe('seq', () => {
    it('should add text with sequences', () => {
      const str = new TerminalString()
        .seq(seq(cs.rcp))
        .seq(seq(cs.cbt, 1))
        .seq(seq(cs.tbm, 1, 2))
        .seq(seq(cs.rm, 1, 2, 3));
      expect(str).toHaveLength(0);
      expect(str.count).toEqual(4);
      expect(str.strings).toEqual(['\x1b[u', '\x1b[1Z', '\x1b[1;2r', '\x1b[1;2;3l']);
    });
  });

  describe('word', () => {
    it('should add words without sequences', () => {
      const str = new TerminalString().word('type').word('script');
      expect(str).toHaveLength(10);
      expect(str.count).toEqual(2);
      expect(str.strings).toEqual(['type', 'script']);
    });
  });

  describe('pop', () => {
    it('should remove the last word', () => {
      const str = new TerminalString().split('type script').pop();
      expect(str).toHaveLength(4);
      expect(str.count).toEqual(1);
      expect(str.strings).toEqual(['type']);
    });

    it('should remove all words', () => {
      const str = new TerminalString().split('type script').pop(3);
      expect(str).toHaveLength(0);
      expect(str.count).toEqual(0);
    });
  });

  describe('style', () => {
    it('should add a word with surrounding sequences', () => {
      const str = new TerminalString().style(
        style(fg8(0), bg8(0), ul8(0)),
        'type',
        style(tf.clear),
      );
      expect(str).toHaveLength(4);
      expect(str.count).toEqual(1);
      expect(str.strings).toEqual(['\x1b[38;5;0;48;5;0;58;5;0m' + 'type' + '\x1b[0m']);
    });
  });

  describe('open', () => {
    it('should add opening words to a word', () => {
      const str = new TerminalString().open('[').open('"').word('type');
      expect(str).toHaveLength(6);
      expect(str.count).toEqual(1);
      expect(str.strings).toEqual(['["type']);
    });

    it('should not merge previous words if the opening is empty', () => {
      const str = new TerminalString().word('type').open('').word('script');
      expect(str).toHaveLength(10);
      expect(str.count).toEqual(2);
      expect(str.strings).toEqual(['type', 'script']);
    });
  });

  describe('other', () => {
    it('should add the strings from the other string', () => {
      const str1 = new TerminalString().split('type script').setMerge();
      const str2 = new TerminalString().other(str1).split(': is fun');
      expect(str2).toHaveLength(16);
      expect(str2.count).toEqual(4);
      expect(str2.strings).toEqual(['type', 'script:', 'is', 'fun']);
    });

    it('should merge the endpoint strings if merge is true in the first string', () => {
      const str1 = new TerminalString().split('type script');
      const str2 = new TerminalString().open('[').other(str1).close(']');
      expect(str2).toHaveLength(12);
      expect(str2.count).toEqual(2);
      expect(str2.strings).toEqual(['[type', 'script]']);
    });
  });

  describe('close', () => {
    it('should add a closing word when there are no strings', () => {
      const str = new TerminalString().close(']');
      expect(str).toHaveLength(1);
      expect(str.count).toEqual(1);
      expect(str.strings).toEqual([']']);
    });

    it('should add closing words to the last word', () => {
      const str = new TerminalString()
        .word('type')
        .seq(style(fg.default, bg.default, ul.curly))
        .close(']')
        .close('.');
      expect(str).toHaveLength(6);
      expect(str.count).toEqual(2);
      expect(str.strings).toEqual(['type', '\x1b[39;49;4;3m].']);
    });

    it('should not merge next words if the closing is empty', () => {
      const str = new TerminalString().word('type').close('').word('script');
      expect(str).toHaveLength(10);
      expect(str.count).toEqual(2);
      expect(str.strings).toEqual(['type', 'script']);
    });
  });

  describe('format', () => {
    const styles: FormatStyles = {
      boolean: '',
      string: '',
      number: '',
      regex: '',
      option: '',
      value: '',
      url: '',
      text: '',
    };

    it('should preserve merges outside', () => {
      const str = new TerminalString().open('[').format(styles, '%t', { t: 'some text' });
      expect(str.count).toEqual(2);
      expect(str.strings).toEqual(['[some', 'text']);
    });

    it('should format single-valued arguments', () => {
      const str = new TerminalString().format(styles, '%b %s %n %r %o %v %u %t %p', {
        b: true,
        s: 'abc',
        n: 123,
        r: /def/,
        o: 'some name',
        v: () => 1,
        u: new URL('https://abc'),
        t: 'some text',
        p: new TerminalString().split('type script'),
      });
      expect(str.count).toEqual(11);
      expect(str.strings).toEqual([
        'true',
        `'abc'`,
        '123',
        '/def/',
        'some name',
        '<() => 1>',
        'https://abc/',
        'some',
        'text',
        'type',
        'script',
      ]);
    });

    it('should format array-valued arguments with separator', () => {
      const str1 = new TerminalString().split('type script');
      const str2 = new TerminalString().format(
        styles,
        '%b %s %n %r %o %v %u %t %p',
        {
          b: [true, false],
          s: ['abc', 'def'],
          n: [123, 456],
          r: [/def/g, /123/i],
          o: ['some name', 'other name'],
          v: [() => 1, {}],
          u: [new URL('https://abc'), new URL('ftp://def')],
          t: ['some text', 'other text'],
          p: [str1, str1],
        },
        { sep: ',' },
      );
      expect(str2.count).toEqual(22);
      expect(str2.strings).toEqual([
        'true,',
        'false',
        `'abc',`,
        `'def'`,
        '123,',
        '456',
        '/def/g,',
        '/123/i',
        'some name,',
        'other name',
        '<() => 1>,',
        '<[object Object]>',
        'https://abc/,',
        'ftp://def/',
        'some',
        'text,',
        'other',
        'text',
        'type',
        'script,',
        'type',
        'script',
      ]);
    });

    it('should format array-valued arguments without merging the separator', () => {
      const str1 = new TerminalString().split('type script');
      const str2 = new TerminalString().format(
        styles,
        '%b %s %n %r %o %v %u %t %p',
        {
          b: [true, false],
          s: ['abc', 'def'],
          n: [123, 456],
          r: [/def/g, /123/i],
          o: ['some name', 'other name'],
          v: [() => 1, {}],
          u: [new URL('https://abc'), new URL('ftp://def')],
          t: ['some text', 'other text'],
          p: [str1, str1],
        },
        { sep: '-', mergePrev: false },
      );
      expect(str2.count).toEqual(31);
      expect(str2.strings).toEqual([
        'true',
        '-',
        'false',
        `'abc'`,
        '-',
        `'def'`,
        '123',
        '-',
        '456',
        '/def/g',
        '-',
        '/123/i',
        'some name',
        '-',
        'other name',
        '<() => 1>',
        '-',
        '<[object Object]>',
        'https://abc/',
        '-',
        'ftp://def/',
        'some',
        'text',
        '-',
        'other',
        'text',
        'type',
        'script',
        '-',
        'type',
        'script',
      ]);
    });
  });
});
