//--------------------------------------------------------------------------------------------------
// Imports and Exports
//--------------------------------------------------------------------------------------------------
import * as React from 'react';
import { Terminal } from 'xterm';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { FitAddon } from '@xterm/addon-fit';
import { Readline } from 'xterm-readline';
import { OpaqueArgumentParser, CastToOptionValues, type Options } from 'tsargp';
import 'xterm/css/xterm.css';

export { type Props, type State, Command };

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
abstract class Command extends React.Component<Props, State> {
  /**
   * The ref for the containing element.
   */
  private readonly ref = React.createRef<HTMLDivElement>();

  /**
   * The Xterm.js terminal object.
   */
  private readonly term = new Terminal({ cursorBlink: true, convertEol: true });

  /**
   * The fit terminal addon.
   */
  private readonly fit = new FitAddon();

  /**
   * The resize observer.
   */
  private readonly resize = new ResizeObserver(this.fit.fit.bind(this.fit));

  /**
   * The readline controller.
   */
  protected readonly readline = new Readline();

  /**
   * The argument parser object.
   */
  private readonly parser: OpaqueArgumentParser;

  /**
   * The list of command names.
   */
  private readonly commands: ReadonlyArray<string>;

  /**
   * Creates a demo component.
   * @param props The component properties
   * @param name The command name
   * @param options The command options
   */
  constructor(props: Props, name: string, options: Options) {
    super(props);
    this.commands = [name, 'clear'];
    this.parser = new OpaqueArgumentParser(options);
    this.term.loadAddon(new WebLinksAddon());
    this.term.loadAddon(this.fit);
    this.term.loadAddon(this.readline);
    this.term.onData(this.onData.bind(this));
    this.term.onResize(this.onResize.bind(this));
    this.term.onSelectionChange(this.onSelectionChange.bind(this));
  }

  override componentDidMount() {
    this.setState({ selection: '', width: 90 });
    if (this.ref.current) {
      this.resize.observe(this.ref.current);
      this.term.open(this.ref.current);
      this.readInput();
    }
  }

  override componentWillUnmount() {
    this.term.dispose();
    this.resize.disconnect();
  }

  render(): React.JSX.Element {
    return <div className={this.props.className} ref={this.ref} />;
  }

  /**
   * Starts reading a line from the terminal.
   */
  private readInput() {
    this.readline.read('$ ').then(this.onInput.bind(this)).catch(this.onError.bind(this));
  }

  /**
   * Fires when the user presses a key.
   */
  private onData(data: string) {
    switch (data.charCodeAt(0)) {
      case 9:
        this.onTab();
        break;
      case 22:
        this.term.paste(this.state.selection);
        break;
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
   * Fires when the user enters a horizontal tab.
   */
  private onTab() {
    // @ts-expect-error since we need to use the private line buffer
    const line: { buf: string; pos: number } = this.readline.state.line;
    let { buf, pos } = line;
    buf = buf.trimStart();
    pos -= line.buf.length - buf.length;
    if (pos <= 0) {
      return;
    }
    let cmds = this.commands;
    for (let i = 0; i < pos && buf[i] != ' '; ++i) {
      cmds = cmds.filter((cmd) => i < cmd.length && cmd[i] == buf[i]);
    }
    if (cmds.length > 1) {
      this.readline.print(`\n> ${cmds.join(' ')}\n> `);
    } else if (cmds.length) {
      const command = cmds[0];
      if (pos <= command.length) {
        this.term.paste(`${command} `.slice(pos));
      } else if (command == this.commands[0]) {
        this.complete(buf, pos);
      }
    }
  }

  /**
   * Fires when the user enters a line.
   */
  private onInput(line: string) {
    line = line.trimStart();
    const [command] = line.split(' ', 1);
    if (this.commands.includes(command)) {
      switch (command) {
        case 'clear':
          this.term.clear();
          break;
        case this.commands[0]:
          this.run(line);
          break;
      }
    } else {
      this.readline.println(`${command}: command not found`);
    }
    this.readInput();
  }

  /**
   * Fires when a command throws.
   */
  private onError(err: string | Error) {
    this.readline.println(`${err}`);
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
   * @param line The command line
   */
  private run(line: string) {
    try {
      const values = {};
      this.parser.parseInto(values, line, { termWidth: this.state.width });
      this.handleValues(values);
    } catch (err) {
      this.readline.println(`${err}`);
    }
  }

  /**
   * Handles the result of parsing the command options.
   * @param values The option values
   */
  protected abstract handleValues(values: CastToOptionValues): void;

  /**
   * Completes the demo command.
   * @param line The command line
   * @param compIndex The completion index
   */
  private complete(line: string, compIndex: number) {
    try {
      this.parser.parseInto({}, line, { compIndex });
    } catch (comp) {
      if (comp) {
        const words = (comp as string).split('\n');
        if (words.length > 1) {
          this.readline.print(`\n> ${words.join(' ')}\n> `);
        } else {
          const word = words[0];
          for (let i = compIndex - word.length; i < compIndex; ++i) {
            if (line.slice(i, compIndex) == word.slice(0, compIndex - i)) {
              this.term.paste(word.slice(compIndex - i) + ' ');
              break;
            }
          }
        }
      }
    }
  }
}