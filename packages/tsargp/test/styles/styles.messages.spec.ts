import { afterAll, describe, expect, it } from 'vitest';
import { tf, style } from '../../lib';
import {
  TerminalString,
  TerminalMessage,
  WarnMessage,
  ErrorMessage,
  HelpMessage,
  CompletionMessage,
} from '../../lib';
import { resetEnv } from '../utils.spec'; // initialize globals

describe('TerminalMessage', () => {
  afterAll(resetEnv);

  it('should wrap the error message', () => {
    const str = new TerminalString().splitText('type script');
    const msg = new TerminalMessage(str);
    expect(msg.wrap(0)).toEqual('type script');
    expect(msg.wrap(11)).toEqual('type script' + style(tf.clear));
    process.env['NO_COLOR'] = '1';
    expect(msg.wrap(0)).toEqual('type script');
    expect(msg.wrap(11)).toEqual('type script');
    process.env['FORCE_COLOR'] = '1';
    expect(msg.wrap(0)).toEqual('type script' + style(tf.clear));
    expect(msg.wrap(11)).toEqual('type script' + style(tf.clear));
  });

  it('can be thrown and caught', () => {
    const str = new TerminalString().splitText('type script');
    expect(() => {
      throw new TerminalMessage(str);
    }).toThrow('type script');
  });
});

describe('WarnMessage', () => {
  it('can be thrown and caught', () => {
    const str = new TerminalString().splitText('type script');
    expect(() => {
      throw new WarnMessage(str);
    }).toThrow('type script');
  });
});

describe('ErrorMessage', () => {
  it('should not prefix the message when converting to string', () => {
    const str = new TerminalString().splitText('type script');
    const msg = new ErrorMessage(str);
    expect(`${msg}`).toEqual('type script');
  });

  it('can be thrown and caught', () => {
    const str = new TerminalString().splitText('type script');
    expect(() => {
      throw new ErrorMessage(str);
    }).toThrow('type script');
  });
});

describe('HelpMessage', () => {
  it('can be thrown and caught', () => {
    const str = new TerminalString().splitText('type script');
    expect(() => {
      throw new HelpMessage(str);
    }).toThrow('type script');
  });
});

describe('CompletionMessage', () => {
  it('can be thrown and caught', () => {
    expect(() => {
      throw new CompletionMessage('type', 'script');
    }).toThrow('type\nscript');
  });
});
