import { describe, expect, it } from 'vitest';
import { cs, tf, fg, bg, ul, seq, style, fg8, bg8, ul8, FormatStyles } from '../../lib';
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
      expect(str.strings).toEqual(['\x9bu', '\x9b1Z', '\x9b1;2r', '\x9b1;2;3l']);
    });
  });

  describe('addWord', () => {
    it('should add words without sequences', () => {
      const str = new TerminalString().addWord('type').addWord('script');
      expect(str).toHaveLength(10);
      expect(str.count).toEqual(2);
      expect(str.strings).toEqual(['type', 'script']);
    });
  });

  describe('pop', () => {
    it('should remove the last word', () => {
      const str = new TerminalString().splitText('type script').pop();
      expect(str).toHaveLength(4);
      expect(str.count).toEqual(1);
      expect(str.strings).toEqual(['type']);
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
      expect(str.strings).toEqual(['\x9b38;5;0;48;5;0;58;5;0m' + 'type' + '\x9b0m']);
    });
  });

  describe('addOpening', () => {
    it('should add opening words to a word', () => {
      const str = new TerminalString().addOpening('[').addOpening('"').addWord('type');
      expect(str).toHaveLength(6);
      expect(str.count).toEqual(1);
      expect(str.strings).toEqual(['["type']);
    });

    it('should not merge previous words if the opening is empty', () => {
      const str = new TerminalString().addWord('type').addOpening('').addWord('script');
      expect(str).toHaveLength(10);
      expect(str.count).toEqual(2);
      expect(str.strings).toEqual(['type', 'script']);
    });
  });

  describe('addOther', () => {
    it('should add the strings from the other string', () => {
      const str1 = new TerminalString().splitText('type script').setMerge();
      const str2 = new TerminalString().addOther(str1).splitText(': is fun');
      expect(str2).toHaveLength(16);
      expect(str2.count).toEqual(4);
      expect(str2.strings).toEqual(['type', 'script:', 'is', 'fun']);
    });

    it('should merge the endpoint strings if merge is true in the first string', () => {
      const str1 = new TerminalString().splitText('type script');
      const str2 = new TerminalString().addOpening('[').addOther(str1).addClosing(']');
      expect(str2).toHaveLength(12);
      expect(str2.count).toEqual(2);
      expect(str2.strings).toEqual(['[type', 'script]']);
    });
  });

  describe('addClosing', () => {
    it('should add a closing word when there are no strings', () => {
      const str = new TerminalString().addClosing(']');
      expect(str).toHaveLength(1);
      expect(str.count).toEqual(1);
      expect(str.strings).toEqual([']']);
    });

    it('should add closing words to the last word', () => {
      const str = new TerminalString()
        .addWord('type')
        .addSequence(style(fg.default, bg.default, ul.curly))
        .addClosing(']')
        .addClosing('.');
      expect(str).toHaveLength(6);
      expect(str.count).toEqual(2);
      expect(str.strings).toEqual(['type', '\x9b39;49;4;3m].']);
    });

    it('should not merge next words if the closing is empty', () => {
      const str = new TerminalString().addWord('type').addClosing('').addWord('script');
      expect(str).toHaveLength(10);
      expect(str.count).toEqual(2);
      expect(str.strings).toEqual(['type', 'script']);
    });
  });

  describe('formatArgs', () => {
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
      const str = new TerminalString().addOpening('[').formatArgs(styles, '%t', { t: 'some text' });
      expect(str.count).toEqual(2);
      expect(str.strings).toEqual(['[some', 'text']);
    });

    it('should format single-valued arguments', () => {
      const str = new TerminalString().formatArgs(styles, '%b %s %n %r %o %v %u %t %p', {
        b: true,
        s: 'abc',
        n: 123,
        r: /def/,
        o: 'some name',
        v: () => 1,
        u: new URL('https://abc'),
        t: 'some text',
        p: new TerminalString().splitText('type script'),
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
      const str1 = new TerminalString().splitText('type script');
      const str2 = new TerminalString().formatArgs(styles, '%b %s %n %r %o %v %u %t %p', {
        b: [true, false],
        s: ['abc', 'def'],
        n: [123, 456],
        r: [/def/g, /123/i],
        o: ['some name', 'other name'],
        v: [() => 1, {}],
        u: [new URL('https://abc'), new URL('ftp://def')],
        t: ['some text', 'other text'],
        p: [str1, str1],
      });
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
      const str1 = new TerminalString().splitText('type script');
      const str2 = new TerminalString().formatArgs(
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
