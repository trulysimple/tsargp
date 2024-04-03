import { describe, expect, it } from 'vitest';
import { TerminalString, cs, tf, seq, style } from '../../lib';
import '../utils.spec'; // initialize globals

describe('TerminalString', () => {
  describe('wrapToWidth', () => {
    describe('when no width is provided', () => {
      it('should not wrap', () => {
        const result = new Array<string>();
        new TerminalString().split('abc def').wrap(result, 0, 0, false);
        expect(result).toEqual(['abc', ' def']);
      });

      it('should preserve line breaks', () => {
        const result = new Array<string>();
        new TerminalString().split('abc\n\ndef').wrap(result, 0, 0, false);
        expect(result).toEqual(['abc', '\n\n', 'def']);
      });

      it('should preserve emojis', () => {
        const result = new Array<string>();
        new TerminalString().split('⚠️ abc').wrap(result, 0, 0, false);
        expect(result).toEqual(['⚠️', ' abc']);
      });

      it('should omit styles', () => {
        const result = new Array<string>();
        new TerminalString()
          .seq(style(tf.clear))
          .split(`abc${style(tf.clear)} def`)
          .wrap(result, 0, 0, false);
        expect(result).toEqual(['abc', ' def']);
      });

      describe('when the current column is not zero', () => {
        it('should shorten the current line by removing previous strings', () => {
          const result = ['  '];
          new TerminalString().split('abc def').wrap(result, 2, 0, false);
          expect(result).toEqual(['abc', ' def']);
        });

        it('should shorten the current line by resizing previous strings', () => {
          const result = ['   '];
          new TerminalString().split('abc def').wrap(result, 2, 0, false);
          expect(result).toEqual([' ', 'abc', ' def']);
        });

        it('should not adjust the current line if the string is empty', () => {
          const result = ['  '];
          new TerminalString().wrap(result, 2, 0, false);
          expect(result).toEqual(['  ']);
        });

        it('should not adjust the current line if the string starts with a line break', () => {
          const result = ['  '];
          new TerminalString().break().wrap(result, 2, 0, false);
          expect(result).toEqual(['  ', '\n']);
        });

        describe('when emitting styles', () => {
          it('should adjust the current line with a move sequence', () => {
            const result = new Array<string>();
            new TerminalString().split('abc def').wrap(result, 2, 0, true);
            expect(result).toEqual([seq(cs.cha, 1), 'abc', ' def']);
          });
        });
      });

      describe('when the starting column is not zero', () => {
        it('should adjust the current line with indentation', () => {
          const result = new Array<string>();
          new TerminalString(2).word('abc').wrap(result, 0, 0, false);
          expect(result).toEqual(['  ', 'abc']);
        });

        it('should keep indentation in new lines', () => {
          const result = new Array<string>();
          new TerminalString(2).split('abc\n\ndef').wrap(result, 0, 0, false);
          expect(result).toEqual(['  ', 'abc', '\n\n', '  ', 'def']);
        });

        it('should not adjust the current line if the string is empty', () => {
          const result = new Array<string>();
          new TerminalString(2).wrap(result, 0, 0, false);
          expect(result).toEqual([]);
        });

        it('should not adjust the current line if the string starts with a line break', () => {
          const result = new Array<string>();
          new TerminalString(2).break().wrap(result, 0, 0, false);
          expect(result).toEqual(['\n']);
        });

        it('should not adjust the current line if the current column is the starting column', () => {
          const result = ['  '];
          new TerminalString(2).split('abc def').wrap(result, 2, 0, false);
          expect(result).toEqual(['  ', 'abc', ' def']);
        });

        describe('when emitting styles', () => {
          it('should adjust the current line with a move sequence', () => {
            const result = new Array<string>();
            new TerminalString(2).split('abc def').wrap(result, 0, 0, true);
            expect(result).toEqual([seq(cs.cha, 3), 'abc', ' def']);
          });

          it('should keep indentation in new lines with a move sequence', () => {
            const result = new Array<string>();
            new TerminalString(2).split('abc\n\ndef').wrap(result, 0, 0, true);
            expect(result).toEqual([seq(cs.cha, 3), 'abc', '\n\n', seq(cs.cha, 3), 'def']);
          });
        });
      });

      describe('when emitting styles', () => {
        it('should emit styles', () => {
          const result = new Array<string>();
          new TerminalString()
            .seq(style(tf.clear))
            .split(`abc${style(tf.clear)} def`)
            .wrap(result, 0, 0, true);
          expect(result).toEqual([style(tf.clear), 'abc' + style(tf.clear), ' def']);
        });
      });
    });

    describe('when a width is provided', () => {
      it('should wrap', () => {
        const result = new Array<string>();
        new TerminalString().split('abc largest').wrap(result, 0, 8, false);
        expect(result).toEqual(['abc', '\n', 'largest']);
      });

      it('should preserve line breaks', () => {
        const result = new Array<string>();
        new TerminalString().split('abc\n\nlargest').wrap(result, 0, 8, false);
        expect(result).toEqual(['abc', '\n\n', 'largest']);
      });

      it('should preserve emojis', () => {
        const result = new Array<string>();
        new TerminalString().split('⚠️ largest').wrap(result, 0, 8, false);
        expect(result).toEqual(['⚠️', '\n', 'largest']);
      });

      it('should omit styles', () => {
        const result = new Array<string>();
        new TerminalString()
          .seq(style(tf.clear))
          .split(`abc${style(tf.clear)} largest`)
          .wrap(result, 0, 8, false);
        expect(result).toEqual(['abc', '\n', 'largest']);
      });

      describe('when the current column is not zero', () => {
        it('should add a line break when the largest word does not fit', () => {
          const result = new Array<string>();
          new TerminalString().split('abc largest').wrap(result, 2, 5, false);
          expect(result).toEqual(['\n', 'abc', '\n', 'largest']);
        });

        it('should not add a line break when the largest word does not fit if the string starts with a line break', () => {
          const result = new Array<string>();
          new TerminalString().break().split('abc largest').wrap(result, 2, 5, false);
          expect(result).toEqual(['\n', 'abc', '\n', 'largest']);
        });
      });

      describe('when the starting column is not zero', () => {
        it('should adjust the current line with indentation if the largest word fits', () => {
          const result = new Array<string>();
          new TerminalString(1).split('abc largest').wrap(result, 0, 8, false);
          expect(result).toEqual([' ', 'abc', '\n ', 'largest']);
        });

        it('should keep indentation in new lines if the largest word fits', () => {
          const result = new Array<string>();
          new TerminalString(1).split('abc\n\nlargest').wrap(result, 0, 8, false);
          expect(result).toEqual([' ', 'abc', '\n\n', ' ', 'largest']);
        });

        it('should keep indentation in wrapped lines if the largest word fits', () => {
          const result = new Array<string>();
          new TerminalString(1).split('abc largest').wrap(result, 0, 8, false);
          expect(result).toEqual([' ', 'abc', '\n ', 'largest']);
        });

        it('should not keep indentation when the largest word does not fit', () => {
          const result = new Array<string>();
          new TerminalString(1).split('abc largest').wrap(result, 0, 5, false);
          expect(result).toEqual(['abc', '\n', 'largest']);
        });

        describe('when emitting styles', () => {
          it('should keep indentation in wrapped lines with a move sequence', () => {
            const result = new Array<string>();
            new TerminalString(1).split('abc largest').wrap(result, 0, 8, true);
            expect(result).toEqual([seq(cs.cha, 2), 'abc', `\n${seq(cs.cha, 2)}`, 'largest']);
          });
        });
      });

      describe('when right-aligned', () => {
        it('should align with spaces when breaking the line', () => {
          const result = new Array<string>();
          new TerminalString(0, 0, true).word('abc').break().wrap(result, 0, 8, false);
          expect(result).toEqual(['     ', 'abc', '\n']);
        });

        it('should align with spaces when wrapping the line', () => {
          const result = new Array<string>();
          new TerminalString(0, 0, true).split('type script').wrap(result, 0, 8, false);
          expect(result).toEqual(['    ', 'type', '\n', '  ', 'script']);
        });

        describe('when emitting styles', () => {
          it('should align with a move sequence when breaking the line', () => {
            const result = new Array<string>();
            new TerminalString(0, 0, true).word('abc').break().wrap(result, 0, 8, true);
            expect(result).toEqual([seq(cs.cuf, 5), 'abc', '\n']);
          });

          it('should align with a move sequence when wrapping the line', () => {
            const result = new Array<string>();
            new TerminalString(0, 0, true).split('type script').wrap(result, 0, 8, true);
            expect(result).toEqual([seq(cs.cuf, 4), 'type', '\n', seq(cs.cuf, 2), 'script']);
          });
        });
      });
    });
  });
});
