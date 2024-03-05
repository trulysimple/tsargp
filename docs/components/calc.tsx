//--------------------------------------------------------------------------------------------------
// Imports and Exports
//--------------------------------------------------------------------------------------------------
import { ArgumentParser, ErrorMessage, HelpMessage } from 'tsargp';
import { type Props, Command } from './command';

// @ts-expect-error since tsargp demo does not export types
import { calc as options } from 'tsargp/examples';

//--------------------------------------------------------------------------------------------------
// Classes
//--------------------------------------------------------------------------------------------------
export default class extends Command {
  readonly displayName = 'Calc Command';
  private readonly parser = new ArgumentParser(options);

  constructor(props: Props) {
    super(props, 'calc');
  }

  override run(line: string, compIndex?: number) {
    try {
      const values = this.parser.parse(line, { compIndex });
      const result = values['add'] ?? values['sub'] ?? values['mult'] ?? values['div'] ?? NaN;
      this.println(`${result}`);
    } catch (err) {
      throw err instanceof ErrorMessage || err instanceof HelpMessage
        ? err.wrap(this.state.width)
        : err;
    }
  }
}
