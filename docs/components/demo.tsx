//--------------------------------------------------------------------------------------------------
// Imports and Exports
//--------------------------------------------------------------------------------------------------
import * as React from 'react';
import { Terminal } from 'xterm';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { FitAddon } from '@xterm/addon-fit';
import { ArgumentParser } from 'tsargp';
import 'xterm/css/xterm.css';

// @ts-expect-error does not export types
import LocalEcho from 'local-echo';
// @ts-expect-error does not export types
import options from 'tsargp/demo';
// override version because there's no package.json file in the browser
options.version.version = '0.1.42';

//--------------------------------------------------------------------------------------------------
// Types
//--------------------------------------------------------------------------------------------------
/**
 * The component properties.
 */
type Props = {
  /**
   * The HTML class name.
   */
  readonly className?: string;
};

/**
 * The component state.
 */
type State = {
  /**
   * The terminal selection.
   */
  readonly selection: string;
  /**
   * The terminal width.
   */
  readonly width: number;
};

//--------------------------------------------------------------------------------------------------
// Classes
//--------------------------------------------------------------------------------------------------
/**
 * A React component for the demo.
 */
class Demo extends React.Component<Props, State> {
  /**
   * The ref for the containing element.
   */
  private readonly ref = React.createRef<HTMLDivElement>();

  /**
   * The Xterm.js terminal object.
   */
  private readonly term = new Terminal({ cols: 90 });

  /**
   * The local echo controller.
   */
  private readonly echo = new LocalEcho();

  /**
   * The fit terminal addon.
   */
  private readonly fit = new FitAddon();

  /**
   * The resize observer.
   */
  private readonly resizeObserver = new ResizeObserver(this.fit.fit.bind(this.fit));

  /**
   * The argument parser object.
   */
  private readonly parser = new ArgumentParser(options);

  /**
   * Creates a demo component.
   * @param props The component properties
   */
  constructor(props: Props) {
    super(props);
    this.term.loadAddon(new WebLinksAddon());
    this.term.loadAddon(this.fit);
    this.term.loadAddon(this.echo);
    this.term.onData(this.onData.bind(this));
    this.term.onResize(this.onResize.bind(this));
    this.term.onSelectionChange(this.onSelectionChange.bind(this));
  }

  override componentDidMount() {
    this.setState({ selection: '', width: 90 });
    if (this.ref.current) {
      this.term.open(this.ref.current);
      this.resizeObserver.observe(this.ref.current);
      this.readInput();
    }
  }

  override componentWillUnmount() {
    this.term.dispose();
    this.resizeObserver.disconnect();
  }

  render(): React.JSX.Element {
    return <div className={this.props.className} ref={this.ref} />;
  }

  /**
   * Starts reading a line from the terminal.
   */
  private readInput() {
    this.echo.read('$ ').then(this.onInput.bind(this)).catch(this.onError.bind(this));
  }

  /**
   * Fires when the user presses a key.
   */
  private onData(data: string) {
    if (data.charCodeAt(0) == 22) {
      this.echo.handleTermData(this.state.selection);
    }
  }

  /**
   * Fires when the user presses a key.
   */
  private onSelectionChange() {
    const selection = this.term.getSelection();
    if (selection) {
      this.setState({ selection });
    }
  }

  /**
   * Fires when the user enters a line.
   */
  private onInput(text: string) {
    const args = getArgs(text);
    if (args.length) {
      switch (args[0]) {
        case '':
          break;
        case 'clear':
          this.term.clear();
          break;
        case 'tsargp':
          this.runCommand(args.slice(1));
          break;
        default:
          this.term.writeln(`${args[0]}: command not found`);
      }
    }
    this.readInput();
  }

  /**
   * Fires when a command throws.
   */
  private onError(err: string | Error) {
    this.term.writeln(`${err}`);
    this.readInput();
  }

  /**
   * Fires when the terminal size changes.
   */
  private onResize(size: { cols: number }) {
    this.setState({ width: size.cols });
  }

  /**
   * Runs the demo command.
   */
  private runCommand(args: Array<string>) {
    const values = this.parser.parse(args, this.state.width);
    this.term.writeln(JSON.stringify(values, null, 2).replace(/\n/g, '\r\n'));
  }
}

export default Demo;

//--------------------------------------------------------------------------------------------------
// Functions
//--------------------------------------------------------------------------------------------------
/**
 * Gets a list of command arguments from an input line.
 * @returns The list of arguments
 */
function getArgs(text: string): Array<string> {
  const result = new Array<string>();
  let arg: string | undefined;
  for (let i = 0, quote = ''; i < text.length; ++i) {
    switch (text[i]) {
      case '\n':
      case ' ':
        if (quote) {
          arg += text[i];
        } else if (arg !== undefined) {
          result.push(arg);
          arg = undefined;
        }
        break;
      case `'`:
      case '"':
        if (quote == text[i]) {
          quote = '';
        } else if (quote) {
          arg += text[i];
        } else {
          quote = text[i];
          if (arg === undefined) {
            arg = '';
          }
        }
        break;
      default:
        if (arg === undefined) {
          arg = text[i];
        } else {
          arg += text[i];
        }
    }
  }
  if (arg !== undefined) {
    result.push(arg);
  }
  return result;
}
