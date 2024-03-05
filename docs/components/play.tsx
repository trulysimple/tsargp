//--------------------------------------------------------------------------------------------------
// Imports and Exports
//--------------------------------------------------------------------------------------------------
import { OpaqueArgumentParser, ErrorMessage, HelpMessage, style } from 'tsargp';
import { type Props, Command } from './command';

//--------------------------------------------------------------------------------------------------
// Types
//--------------------------------------------------------------------------------------------------
/**
 * The component properties.
 */
type PlayProps = Props & {
  /**
   * A set of callbacks to interact with other components.
   */
  readonly callbacks: {
    /**
     * A callback that returns JavaScript source code.
     */
    getSource: () => string;
  };
};

//--------------------------------------------------------------------------------------------------
// Classes
//--------------------------------------------------------------------------------------------------
export default class extends Command<PlayProps> {
  readonly displayName = 'Play Command';
  private parser: OpaqueArgumentParser | undefined;

  constructor(props: PlayProps) {
    super(props, 'init', 'play');
  }

  private init() {
    const source = this.props.callbacks.getSource();
    const options = eval(source);
    this.parser = new OpaqueArgumentParser(options).validate();
  }

  override run(line: string, compIndex?: number) {
    try {
      if (line.startsWith('init')) {
        if (!compIndex) {
          this.init();
        }
      } else if (this.parser) {
        const values = {};
        this.parser.parseInto(values, line, { compIndex });
        this.println(JSON.stringify(values, null, 2));
      } else {
        this.println(`Please call ${style(1)}init${style(0)} first.`);
      }
    } catch (err) {
      throw err instanceof ErrorMessage || err instanceof HelpMessage
        ? err.wrap(this.state.width)
        : err;
    }
  }
}
