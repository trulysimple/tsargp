import { afterAll, describe, expect, it } from 'vitest';
import { tf, style, TerminalString } from '../../lib';
import { AnsiMessage, JsonMessage, WarnMessage, ErrorMessage, CompMessage } from '../../lib';
import { resetEnv } from '../utils.spec'; // initialize globals

describe('AnsiMessage', () => {
  afterAll(resetEnv);

  it('should wrap the error message', () => {
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
  });

  it('can be thrown and caught', () => {
    const str = new TerminalString().split('type script');
    expect(() => {
      throw new AnsiMessage(str);
    }).toThrow('type script');
  });
});

describe('WarnMessage', () => {
  it('can be thrown and caught', () => {
    const str = new TerminalString().split('type script');
    expect(() => {
      throw new WarnMessage(str);
    }).toThrow('type script');
  });
});

describe('ErrorMessage', () => {
  it('should not prefix the message when converting to string', () => {
    const str = new TerminalString().split('type script');
    const msg = new ErrorMessage(str);
    expect(`${msg}`).toEqual('type script');
  });

  it('can be thrown and caught', () => {
    const str = new TerminalString().split('type script');
    expect(() => {
      throw new ErrorMessage(str);
    }).toThrow('type script');
  });
});

describe('CompletionMessage', () => {
  it('can be thrown and caught', () => {
    expect(() => {
      throw new CompMessage('type', 'script');
    }).toThrow('type\nscript');
  });
});

describe('JsonMessage', () => {
  it('can be thrown and caught', () => {
    expect(() => {
      throw new JsonMessage({ type: 'script' });
    }).toThrow('{"type":"script"}');
  });
});
