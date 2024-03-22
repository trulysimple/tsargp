import { describe, expect, it } from 'vitest';
import { TerminalString, cs, tf, seq, style } from '../../lib';
import '../utils.spec'; // initialize globals

describe('TerminalString', () => {
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
        new TerminalString(2).addBreak().wrapToWidth(result, 0, 0, false);
        expect(result).toEqual(['\n']);
      });

      it('should shorten the current line (1)', () => {
        const result = ['  '];
        new TerminalString().splitText('abc def').wrapToWidth(result, 2, 0, false);
        expect(result).toEqual(['abc', ' def']);
      });

      it('should shorten the current line (2)', () => {
        const result = ['   '];
        new TerminalString().splitText('abc def').wrapToWidth(result, 2, 0, false);
        expect(result).toEqual([' ', 'abc', ' def']);
      });

      it('should not shorten the current line if the string is empty', () => {
        const result = ['  '];
        new TerminalString().wrapToWidth(result, 2, 0, false);
        expect(result).toEqual(['  ']);
      });

      it('should not shorten the current line if the string starts with a line break', () => {
        const result = ['  '];
        new TerminalString().addBreak().wrapToWidth(result, 2, 0, false);
        expect(result).toEqual(['  ', '\n']);
      });

      it('should preserve line breaks', () => {
        const result = new Array<string>();
        new TerminalString().splitText('abc\n\ndef').wrapToWidth(result, 0, 0, false);
        expect(result).toEqual(['abc', '\n\n', 'def']);
      });

      it('should omit styles', () => {
        const result = new Array<string>();
        new TerminalString()
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
        new TerminalString(1).addBreak().splitText('abc largest').wrapToWidth(result, 1, 5, false);
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
        new TerminalString().addBreak().splitText('abc largest').wrapToWidth(result, 1, 15, false);
        expect(result).toEqual(['\n', 'abc', ' largest']);
      });

      it('should wrap with a move sequence when the largest word fits the width (8)', () => {
        const result = new Array<string>();
        new TerminalString(1).addBreak().splitText('abc largest').wrapToWidth(result, 2, 15, false);
        expect(result).toEqual(['\n', seq(cs.cha, 2), 'abc', ' largest']);
      });

      it('should wrap with a move sequence when the largest word fits the width (9)', () => {
        const result = new Array<string>();
        new TerminalString(2).addBreak().splitText('abc largest').wrapToWidth(result, 1, 15, false);
        expect(result).toEqual(['\n', seq(cs.cha, 3), 'abc', ' largest']);
      });

      it('should omit styles', () => {
        const result = new Array<string>();
        new TerminalString()
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
