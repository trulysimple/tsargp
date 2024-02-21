import { describe, expect, it } from 'vitest';
import { StyledString, sgr, fg, bg } from '../lib';

describe('StyledString', () => {
  it('should not append the same style twice', () => {
    const str = new StyledString();
    str.style(sgr('0')).style(sgr('0'));
    expect(str).toHaveLength(0);
    expect(str.string).toEqual('\x1b[0m');
  });

  it('should append two different styles', () => {
    const str = new StyledString();
    str.style(sgr('0')).style(sgr(fg('0'), bg('0')));
    expect(str).toHaveLength(0);
    expect(str.string).toEqual('\x1b[0m\x1b[38;5;0;48;5;0m');
  });

  it('should append texts', () => {
    const str = new StyledString();
    str.push('foo', 'bar');
    expect(str).toHaveLength(6);
    expect(str.string).toEqual('foobar');
  });

  it('should not append the same style twice when intermingled with text', () => {
    const str = new StyledString();
    str.style(sgr('0')).push('foo', 'bar').style(sgr('0'));
    expect(str).toHaveLength(6);
    expect(str.string).toEqual('\x1b[0m' + 'foobar');
  });

  it('should append a styled string and keep the last applied style', () => {
    const str1 = new StyledString();
    const str2 = new StyledString();
    str1.style(sgr('0')).push('foo', 'bar');
    str2.appendStyled(str1).style(sgr('0'));
    expect(str2).toHaveLength(6);
    expect(str2.string).toEqual('\x1b[0m' + 'foobar');
  });

  it('should append a styled string whose first style is the same as his last style', () => {
    const str1 = new StyledString();
    const str2 = new StyledString();
    str1.style(sgr('0')).push('foo', 'bar');
    str2.style(sgr('0')).appendStyled(str1);
    expect(str2).toHaveLength(6);
    expect(str2.string).toEqual('\x1b[0m' + 'foobar');
  });
});
