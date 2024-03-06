//--------------------------------------------------------------------------------------------------
// Imports and Exports
//--------------------------------------------------------------------------------------------------
import React, { Component, createRef } from 'react';
import { Terminal } from 'xterm';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { FitAddon } from '@xterm/addon-fit';
import { Readline } from 'xterm-readline';
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
 * A React component for running Terminal commands.
 */
abstract class Command<P extends Props = Props, S extends State = State> extends Component<P, S> {
  /**
   * The ref for the containing element.
   */
  private readonly ref = createRef<HTMLDivElement>();

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
  private readonly readline = new Readline();

  /**
   * The list of command names.
   */
  private readonly commands: ReadonlyArray<string>;

  /**
   * Creates the command component.
   * @param props The component properties
   * @param names The command names
   */
  constructor(props: P, ...names: Array<string>) {
    super(props);
    this.commands = ['clear', ...names];
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

  override render(): React.JSX.Element {
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
   * Fires when a command throws.
   * @param err The captured error
   */
  private onError(err: unknown) {
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
      const cmd = cmds[0];
      if (pos <= cmd.length) {
        this.term.paste(`${cmd} `.slice(pos));
      } else if (cmd !== this.commands[0]) {
        try {
          this.run(buf, pos);
        } catch (comp) {
          if (typeof comp === 'string' && comp) {
            this.onComplete(comp.split('\n'), buf, pos);
          }
        }
      }
    }
  }

  /**
   * Performs the final completion step.
   * @param words The completion words
   * @param line The command line
   * @param compIndex The completion index
   */
  private onComplete(words: Array<string>, line: string, compIndex: number) {
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

  /**
   * Fires when the user enters a line.
   * @param line The command-line
   */
  private onInput(line: string) {
    line = line.trimStart();
    const [command] = line.split(' ', 1);
    if (this.commands.includes(command)) {
      switch (command) {
        case 'clear':
          this.term.clear();
          break;
        default: {
          this.run(line);
          break;
        }
      }
    } else {
      this.readline.println(`${command}: command not found`);
    }
    this.readInput();
  }

  /**
   * Runs or completes a command.
   * @param line The command-line
   * @param compIndex The completion index, if any
   */
  protected abstract run(line: string, compIndex?: number): void;

  /**
   * Prints a line on the terminal.
   * @param text The text line
   */
  protected println(text: string) {
    this.readline.println(text);
  }
}