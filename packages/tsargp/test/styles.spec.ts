import {
  afterAll,
  describe,
  describe as on,
  describe as when,
  expect,
  it as should,
  vi,
} from 'vitest';
import { cs, fg, bg, tf } from '../lib/enums';
import {
  TerminalString,
  AnsiMessage,
  JsonMessage,
  WarnMessage,
  ErrorMessage,
  TextMessage,
  ul,
  fg8,
  bg8,
  ul8,
  seq,
  style,
  cfg,
} from '../lib/styles';

process.env['FORCE_WIDTH'] = '0'; // omit styles

describe('TerminalString', () => {
  on('seq', () => {
    should('add text with control sequences', () => {
      const str = new TerminalString()
        .seq(seq(cs.rcp))
        .seq(seq(cs.cbt, 1))
        .seq(seq(cs.tbm, 1, 2))
        .seq(seq(cs.rm, 1, 2, 3));
      expect(str.count).toEqual(4);
      expect(str.lengths).toEqual([0, 0, 0, 0]);
      expect(str.strings).toEqual(['\x1b[u', '\x1b[1Z', '\x1b[1;2r', '\x1b[1;2;3l']);
    });
  });

  on('word', () => {
    should('add words without control sequences', () => {
      const str = new TerminalString().word('type').word('script');
      expect(str.count).toEqual(2);
      expect(str.lengths).toEqual([4, 6]);
      expect(str.strings).toEqual(['type', 'script']);
    });
  });

  on('pop', () => {
    should('remove the last internal string', () => {
      const str = new TerminalString().split('type script').pop();
      expect(str.count).toEqual(1);
      expect(str.lengths).toEqual([4]);
      expect(str.strings).toEqual(['type']);
    });

    should('remove all strings when the provided count is greater than the internal count', () => {
      const str = new TerminalString().split('type script').pop(3);
      expect(str.count).toEqual(0);
    });
  });

  on('setStyle', () => {
    should('add a style to the next word and reset to the default style afterwards', () => {
      const str = new TerminalString();
      str.style = style(fg8(0), bg8(0), ul8(0));
      str.word('type');
      expect(str.count).toEqual(1);
      expect(str.lengths).toEqual([4]);
      expect(str.strings).toEqual(['\x1b[38;5;0;48;5;0;58;5;0m' + 'type' + '\x1b[0m']);
    });
  });

  on('open', () => {
    should('add an opening delimiter to the next word', () => {
      const str = new TerminalString().open('[').open('"').word('type');
      expect(str.count).toEqual(1);
      expect(str.lengths).toEqual([6]);
      expect(str.strings).toEqual(['["type']);
    });

    should('avoid merging the previous word with the next word if the delimiter is empty', () => {
      const str = new TerminalString().word('type').open('').word('script');
      expect(str.count).toEqual(2);
      expect(str.lengths).toEqual([4, 6]);
      expect(str.strings).toEqual(['type', 'script']);
    });

    should('add an opening delimiter at a specific position', () => {
      const str = new TerminalString().open('"', 0).word('type').open('[', 0);
      expect(str.count).toEqual(1);
      expect(str.lengths).toEqual([6]);
      expect(str.strings).toEqual(['["type']);
    });
  });

  on('other', () => {
    should('avoid changing internal state if the other string is empty', () => {
      const str1 = new TerminalString();
      str1.merge = true;
      const str2 = new TerminalString().word('[').other(str1).word('type');
      expect(str2.count).toEqual(2);
      expect(str2.lengths).toEqual([1, 4]);
      expect(str2.strings).toEqual(['[', 'type']);
    });

    should('add the internal strings from the other string and preserve its merge flag', () => {
      const str1 = new TerminalString().split('type script');
      str1.merge = true;
      const str2 = new TerminalString().other(str1).split(': is fun');
      expect(str2.count).toEqual(4);
      expect(str2.lengths).toEqual([4, 7, 2, 3]);
      expect(str2.strings).toEqual(['type', 'script:', 'is', 'fun']);
    });

    should('merge the endpoint strings if the merge flag is set in the first string', () => {
      const str1 = new TerminalString().split('type script');
      const str2 = new TerminalString().open('[').other(str1).close(']');
      expect(str2.count).toEqual(2);
      expect(str2.lengths).toEqual([5, 7]);
      expect(str2.strings).toEqual(['[type', 'script]']);
    });
  });

  on('close', () => {
    should('add a closing delimiter when there are no internal strings', () => {
      const str = new TerminalString().close(']');
      expect(str.count).toEqual(1);
      expect(str.lengths).toEqual([1]);
      expect(str.strings).toEqual([']']);
    });

    should('add a closing delimiter to the last internal string', () => {
      const str = new TerminalString()
        .word('type')
        .seq(style(fg.default, bg.default, ul.curly))
        .close(']')
        .close('.');
      expect(str.count).toEqual(2);
      expect(str.lengths).toEqual([4, 2]);
      expect(str.strings).toEqual(['type', '\x1b[39;49;4;3m].']);
    });

    should('avoid merging with the next word if the delimiter is empty', () => {
      const str = new TerminalString().word('type').close('').word('script');
      expect(str.count).toEqual(2);
      expect(str.lengths).toEqual([4, 6]);
      expect(str.strings).toEqual(['type', 'script']);
    });
  });
  on('split', () => {
    should('split text with emojis', () => {
      const str = new TerminalString().split(`⚠️ type script`);
      expect(str.count).toEqual(3);
      expect(str.lengths).toEqual([2, 4, 6]);
      expect(str.strings).toEqual(['⚠️', 'type', 'script']);
    });

    should('split text with style sequences', () => {
      const str = new TerminalString().split(`${style(tf.clear)}type script${style(tf.clear)}`);
      expect(str.count).toEqual(2);
      expect(str.lengths).toEqual([4, 6]);
      expect(str.strings).toEqual(['\x1b[0m' + 'type', 'script' + '\x1b[0m']);
    });

    should('split text with paragraphs', () => {
      const str = new TerminalString().split('type\nscript\n\nis\nfun');
      expect(str.count).toEqual(5);
      expect(str.lengths).toEqual([4, 6, 0, 2, 3]);
      expect(str.strings).toEqual(['type', 'script', '\n\n', 'is', 'fun']);
    });

    should('split text with list items', () => {
      const str = new TerminalString().split('type:\n- script\n1. is fun');
      expect(str.count).toEqual(8);
      expect(str.lengths).toEqual([5, 0, 1, 6, 0, 2, 2, 3]);
      expect(str.strings).toEqual(['type:', '\n', '-', 'script', '\n', '1.', 'is', 'fun']);
    });

    when('using format specifiers', () => {
      should('insert text at the specifier location', () => {
        const format = vi.fn(function (this: TerminalString) {
          this.word('abc');
        });
        const str = new TerminalString().split('type' + '#0 script is #1' + 'fun', format);
        expect(str.count).toEqual(4);
        expect(str.lengths).toEqual([7, 6, 2, 6]);
        expect(str.strings).toEqual(['type' + 'abc', 'script', 'is', 'abc' + 'fun']);
        expect(format).toHaveBeenCalledTimes(2);
        expect(format).toHaveBeenCalledWith('#0');
        expect(format).toHaveBeenCalledWith('#1');
      });

      should('avoid adding a line break to the first list item', () => {
        const format = vi.fn(function (this: TerminalString) {
          this.split('- item\n* item\n1. item');
        });
        const str = new TerminalString().split('#0', format);
        expect(str.count).toEqual(8);
        expect(str.lengths).toEqual([1, 4, 0, 1, 4, 0, 2, 4]);
        expect(str.strings).toEqual(['-', 'item', '\n', '*', 'item', '\n', '1.', 'item']);
        expect(format).toHaveBeenCalledTimes(1);
        expect(format).toHaveBeenCalledWith('#0');
      });

      should('avoid merging the last word with the next word when not inserting text', () => {
        const format = vi.fn();
        const str = new TerminalString().word('type').split('#0#0', format).word('script');
        expect(str.count).toEqual(2);
        expect(str.lengths).toEqual([4, 6]);
        expect(str.strings).toEqual(['type', 'script']);
        expect(format).toHaveBeenCalledTimes(2);
        expect(format).toHaveBeenCalledWith('#0');
      });
    });
  });

  on('wrap', () => {
    when('no width is provided', () => {
      should('avoid wrapping', () => {
        const result: Array<string> = [];
        new TerminalString().split('abc def').wrap(result, 0, 0, false);
        expect(result).toEqual(['abc', ' def']);
      });

      should('preserve line breaks', () => {
        const result: Array<string> = [];
        new TerminalString().split('abc\n\ndef').wrap(result, 0, 0, false);
        expect(result).toEqual(['abc', '\n\n', 'def']);
      });

      should('preserve emojis', () => {
        const result: Array<string> = [];
        new TerminalString().split('⚠️ abc').wrap(result, 0, 0, false);
        expect(result).toEqual(['⚠️', ' abc']);
      });

      should('omit styles', () => {
        const result: Array<string> = [];
        new TerminalString()
          .seq(style(tf.clear))
          .split(`abc${style(tf.clear)} def`)
          .wrap(result, 0, 0, false);
        expect(result).toEqual(['abc', ' def']);
      });

      when('the current column is not zero', () => {
        should('shorten the current line by removing previous strings', () => {
          const result = ['  '];
          new TerminalString().split('abc def').wrap(result, 2, 0, false);
          expect(result).toEqual(['abc', ' def']);
        });

        should('shorten the current line by resizing previous strings', () => {
          const result = ['   '];
          new TerminalString().split('abc def').wrap(result, 2, 0, false);
          expect(result).toEqual([' ', 'abc', ' def']);
        });

        should('avoid adjusting the current line if the string is empty', () => {
          const result = ['  '];
          new TerminalString().wrap(result, 2, 0, false);
          expect(result).toEqual(['  ']);
        });

        should('avoid adjusting the current line if the string starts with a line break', () => {
          const result = ['  '];
          new TerminalString().break().wrap(result, 2, 0, false);
          expect(result).toEqual(['  ', '\n']);
        });

        when('emitting styles', () => {
          should('adjust the current line with a move sequence', () => {
            const result: Array<string> = [];
            new TerminalString().split('abc def').wrap(result, 2, 0, true);
            expect(result).toEqual([seq(cs.cha, 1), 'abc', ' def']);
          });
        });
      });

      when('the starting column is not zero', () => {
        should('adjust the current line with indentation', () => {
          const result: Array<string> = [];
          new TerminalString(2).word('abc').wrap(result, 0, 0, false);
          expect(result).toEqual(['  ', 'abc']);
        });

        should('keep indentation in new lines', () => {
          const result: Array<string> = [];
          new TerminalString(2).split('abc\n\ndef').wrap(result, 0, 0, false);
          expect(result).toEqual(['  ', 'abc', '\n\n', '  ', 'def']);
        });

        should('avoid adjusting the current line if the string is empty', () => {
          const result: Array<string> = [];
          new TerminalString(2).wrap(result, 0, 0, false);
          expect(result).toEqual([]);
        });

        should('avoid adjusting the current line if the string starts with a line break', () => {
          const result: Array<string> = [];
          new TerminalString(2).break().wrap(result, 0, 0, false);
          expect(result).toEqual(['\n']);
        });

        should(
          'avoid adjusting the current line if the current column is the starting column',
          () => {
            const result = ['  '];
            new TerminalString(2).split('abc def').wrap(result, 2, 0, false);
            expect(result).toEqual(['  ', 'abc', ' def']);
          },
        );

        when('emitting styles', () => {
          should('adjust the current line with a move sequence', () => {
            const result: Array<string> = [];
            new TerminalString(2).split('abc def').wrap(result, 0, 0, true);
            expect(result).toEqual([seq(cs.cha, 3), 'abc', ' def']);
          });

          should('keep indentation in new lines with a move sequence', () => {
            const result: Array<string> = [];
            new TerminalString(2).split('abc\n\ndef').wrap(result, 0, 0, true);
            expect(result).toEqual([seq(cs.cha, 3), 'abc', '\n\n', seq(cs.cha, 3), 'def']);
          });
        });
      });

      when('emitting styles', () => {
        should('emit styles', () => {
          const result: Array<string> = [];
          new TerminalString()
            .seq(style(tf.clear))
            .split(`abc${style(tf.clear)} def`)
            .wrap(result, 0, 0, true);
          expect(result).toEqual([style(tf.clear), 'abc' + style(tf.clear), ' def']);
        });
      });
    });

    when('a width is provided', () => {
      should('wrap', () => {
        const result: Array<string> = [];
        new TerminalString().split('abc largest').wrap(result, 0, 8, false);
        expect(result).toEqual(['abc', '\n', 'largest']);
      });

      should('preserve line breaks', () => {
        const result: Array<string> = [];
        new TerminalString().split('abc\n\nlargest').wrap(result, 0, 8, false);
        expect(result).toEqual(['abc', '\n\n', 'largest']);
      });

      should('preserve emojis', () => {
        const result: Array<string> = [];
        new TerminalString().split('⚠️ largest').wrap(result, 0, 8, false);
        expect(result).toEqual(['⚠️', '\n', 'largest']);
      });

      should('omit styles', () => {
        const result: Array<string> = [];
        new TerminalString()
          .seq(style(tf.clear))
          .split(`abc${style(tf.clear)} largest`)
          .wrap(result, 0, 8, false);
        expect(result).toEqual(['abc', '\n', 'largest']);
      });

      when('the current column is not zero', () => {
        should('add a line break when the largest word does not fit', () => {
          const result: Array<string> = [];
          new TerminalString().split('abc largest').wrap(result, 2, 5, false);
          expect(result).toEqual(['\n', 'abc', '\n', 'largest']);
        });

        should(
          'avoid adding a line break when the largest word does not fit, if the string starts with a line break',
          () => {
            const result: Array<string> = [];
            new TerminalString().break().split('abc largest').wrap(result, 2, 5, false);
            expect(result).toEqual(['\n', 'abc', '\n', 'largest']);
          },
        );
      });

      when('the starting column is not zero', () => {
        should('adjust the current line with indentation if the largest word fits', () => {
          const result: Array<string> = [];
          new TerminalString(1).split('abc largest').wrap(result, 0, 8, false);
          expect(result).toEqual([' ', 'abc', '\n ', 'largest']);
        });

        should('keep indentation in new lines if the largest word fits', () => {
          const result: Array<string> = [];
          new TerminalString(1).split('abc\n\nlargest').wrap(result, 0, 8, false);
          expect(result).toEqual([' ', 'abc', '\n\n', ' ', 'largest']);
        });

        should('keep indentation in wrapped lines if the largest word fits', () => {
          const result: Array<string> = [];
          new TerminalString(1).split('abc largest').wrap(result, 0, 8, false);
          expect(result).toEqual([' ', 'abc', '\n ', 'largest']);
        });

        should('avoid keeping indentation when the largest word does not fit', () => {
          const result: Array<string> = [];
          new TerminalString(1).split('abc largest').wrap(result, 0, 5, false);
          expect(result).toEqual(['abc', '\n', 'largest']);
        });

        when('emitting styles', () => {
          should('keep indentation in wrapped lines with a move sequence', () => {
            const result: Array<string> = [];
            new TerminalString(1).split('abc largest').wrap(result, 0, 8, true);
            expect(result).toEqual([seq(cs.cha, 2), 'abc', `\n${seq(cs.cha, 2)}`, 'largest']);
          });
        });
      });

      when('right-aligned', () => {
        should('align with spaces when breaking the line', () => {
          const result: Array<string> = [];
          new TerminalString(0, 0, true).word('abc').break().wrap(result, 0, 8, false);
          expect(result).toEqual(['     ', 'abc', '\n']);
        });

        should('align with spaces when wrapping the line', () => {
          const result: Array<string> = [];
          new TerminalString(0, 0, true).split('type script').wrap(result, 0, 8, false);
          expect(result).toEqual(['    ', 'type', '\n', '  ', 'script']);
        });

        when('emitting styles', () => {
          should('align with a move sequence when breaking the line', () => {
            const result: Array<string> = [];
            new TerminalString(0, 0, true).word('abc').break().wrap(result, 0, 8, true);
            expect(result).toEqual([seq(cs.cuf, 5), 'abc', '\n']);
          });

          should('align with a move sequence when wrapping the line', () => {
            const result: Array<string> = [];
            new TerminalString(0, 0, true).split('type script').wrap(result, 0, 8, true);
            expect(result).toEqual([seq(cs.cuf, 4), 'type', '\n', seq(cs.cuf, 2), 'script']);
          });
        });
      });
    });
  });

  on('format', () => {
    should('preserve a merge flag set before formatting', () => {
      const str1 = new TerminalString().split('type script');
      const str2 = new TerminalString().open('[').format(cfg, '#0', {}, str1);
      expect(str2.count).toEqual(2);
      expect(str2.strings).toEqual(['[type', 'script']);
    });

    should('preserve add closing word to a formatted generic value', () => {
      const str = new TerminalString().format(cfg, '#0', {}, () => 1).close('.');
      expect(str.count).toEqual(3);
      expect(str.strings).toEqual(['\x1b[90m' + '<()', '=>', '1>' + '\x1b[0m.']);
    });

    should('format single-valued arguments out of order', () => {
      const str = new TerminalString().format(
        cfg,
        '#9 #8 #7 #6 #5 #4 #3 #2 #1 #0',
        {},
        true,
        'some text',
        123,
        /def/,
        Symbol.for('some name'),
        new URL('https://abc'),
        new TerminalString().split('type script'),
        [1, 'a', false],
        { a: 1, 0: 'c', 'd-': /ghi/i },
        () => 1,
      );
      expect(str.count).toEqual(20);
      expect(str.strings).toEqual([
        '\x1b[90m' + '<()',
        '=>',
        '1>' + '\x1b[0m',
        '{' + '\x1b[32m' + `'0'` + '\x1b[0m' + ':',
        '\x1b[32m' + `'c'` + '\x1b[0m' + ',',
        'a:',
        '\x1b[33m' + '1' + '\x1b[0m' + ',',
        '\x1b[32m' + `'d-'` + '\x1b[0m' + ':',
        '\x1b[31m' + '/ghi/i' + '\x1b[0m' + '}',
        '[' + '\x1b[33m' + '1' + '\x1b[0m' + ',',
        '\x1b[32m' + `'a'` + '\x1b[0m' + ',',
        '\x1b[34m' + 'false' + '\x1b[0m' + ']',
        'type',
        'script',
        '\x1b[36m' + 'https://abc/' + '\x1b[0m',
        '\x1b[35m' + 'some name' + '\x1b[0m',
        '\x1b[31m' + '/def/' + '\x1b[0m',
        '\x1b[33m' + '123' + '\x1b[0m',
        '\x1b[32m' + `'some text'` + '\x1b[0m',
        '\x1b[34m' + 'true' + '\x1b[0m',
      ]);
    });

    should('format array-valued arguments with custom separator', () => {
      const str1 = new TerminalString().split('type script');
      const str2 = new TerminalString().format(cfg, '#0', { sep: ';' }, [
        true,
        'some text',
        123,
        /def/g,
        Symbol.for('some name'),
        () => 1,
        {},
        null,
        undefined,
        new URL('https://abc'),
        str1,
        str1,
      ]);
      expect(str2.count).toEqual(16);
      expect(str2.strings).toEqual([
        '[' + '\x1b[34m' + 'true' + '\x1b[0m' + ';',
        '\x1b[32m' + `'some text'` + '\x1b[0m' + ';',
        '\x1b[33m' + '123' + '\x1b[0m' + ';',
        '\x1b[31m' + '/def/g' + '\x1b[0m' + ';',
        '\x1b[35m' + 'some name' + '\x1b[0m' + ';',
        '\x1b[90m' + '<()',
        '=>',
        '1>' + '\x1b[0m' + ';',
        '{};',
        '\x1b[90m' + '<null>' + '\x1b[0m' + ';',
        '\x1b[90m' + '<undefined>' + '\x1b[0m' + ';',
        '\x1b[36m' + 'https://abc/' + '\x1b[0m' + ';',
        'type',
        'script;',
        'type',
        'script]',
      ]);
    });

    should('format object-valued arguments without merging the separator', () => {
      const str = new TerminalString().format(
        cfg,
        '#0',
        { mergePrev: false },
        {
          b: true,
          s: 'some text',
          n: 123,
          r: /def/,
          m: Symbol.for('some name'),
          u: new URL('https://abc'),
          t: new TerminalString().split('type script'),
          a: [1, 'a', false],
          o: { a: 1, 0: 'c', 'd-': /ghi/i },
          v: () => 1,
        },
      );
      expect(str.count).toEqual(43);
      expect(str.strings).toEqual([
        '{b:',
        '\x1b[34m' + 'true' + '\x1b[0m',
        ',',
        's:',
        '\x1b[32m' + `'some text'` + '\x1b[0m',
        ',',
        'n:',
        '\x1b[33m' + '123' + '\x1b[0m',
        ',',
        'r:',
        '\x1b[31m' + '/def/' + '\x1b[0m',
        ',',
        'm:',
        '\x1b[35m' + 'some name' + '\x1b[0m',
        ',',
        'u:',
        '\x1b[36m' + 'https://abc/' + '\x1b[0m',
        ',',
        't:',
        'type',
        'script',
        ',',
        'a:',
        '[' + '\x1b[33m' + '1' + '\x1b[0m',
        ',',
        '\x1b[32m' + `'a'` + '\x1b[0m',
        ',',
        '\x1b[34m' + 'false' + '\x1b[0m' + ']',
        ',',
        'o:',
        '{' + '\x1b[32m' + `'0'` + '\x1b[0m' + ':',
        '\x1b[32m' + `'c'` + '\x1b[0m',
        ',',
        'a:',
        '\x1b[33m' + '1' + '\x1b[0m',
        ',',
        '\x1b[32m' + `'d-'` + '\x1b[0m' + ':',
        '\x1b[31m' + '/ghi/i' + '\x1b[0m' + '}',
        ',',
        'v:',
        '\x1b[90m' + '<()',
        '=>',
        '1>' + '\x1b[0m' + '}',
      ]);
    });
  });
});

describe('AnsiMessage', () => {
  afterAll(() => {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    ['NO_COLOR', 'FORCE_COLOR'].forEach((key) => delete process.env[key]);
  });

  should(
    'wrap the message to the specified width, while respecting the environment configuration',
    () => {
      const str = new TerminalString().split('type script');
      const msg = new AnsiMessage(str);
      expect(msg.wrap(0)).toEqual('type script');
      expect(msg.wrap(11)).toEqual('type script' + style(tf.clear));
      process.env['NO_COLOR'] = '1';
      expect(msg.wrap(0)).toEqual('type script');
      expect(msg.wrap(11)).toEqual('type script');
      process.env['FORCE_COLOR'] = '1';
      expect(msg.wrap(0)).toEqual('type script' + style(tf.clear));
      expect(msg.wrap(11)).toEqual('type script' + style(tf.clear));
    },
  );

  should('be able to be thrown and caught, while producing a string message', () => {
    const str = new TerminalString().split('type script');
    expect(() => {
      throw new AnsiMessage(str);
    }).toThrow('type script');
  });
});

describe('WarnMessage', () => {
  should('be able to be thrown and caught, while producing a string message', () => {
    const str = new TerminalString().split('type script');
    expect(() => {
      throw new WarnMessage(str);
    }).toThrow('type script');
  });
});

describe('ErrorMessage', () => {
  should('avoid prefixing the message with "Error:" when converting to string', () => {
    const str = new TerminalString().split('type script');
    const msg = new ErrorMessage(str);
    expect(`${msg}`).toEqual('type script');
  });

  should('be able to be thrown and caught, while producing a string message', () => {
    const str = new TerminalString().split('type script');
    expect(() => {
      throw new ErrorMessage(str);
    }).toThrow('type script');
  });
});

describe('TextMessage', () => {
  should('be able to be thrown and caught, while producing a string message', () => {
    expect(() => {
      throw new TextMessage('type', 'script');
    }).toThrow('type\nscript');
  });
});

describe('JsonMessage', () => {
  should('be able to be thrown and caught, while producing a string message', () => {
    expect(() => {
      throw new JsonMessage({ type: 'script' });
    }).toThrow('[{"type":"script"}]');
  });
});