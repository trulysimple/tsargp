//--------------------------------------------------------------------------------------------------
// Imports and Exports
//--------------------------------------------------------------------------------------------------
import { ArgumentParser, ErrorMessage, HelpMessage } from 'tsargp';
import { type Props, Command } from './command';

// @ts-expect-error since tsargp demo does not export types
import { demo as options } from 'tsargp/examples';
// override version because there's no package.json file in the browser
options.version.version = '0.1.96';

//--------------------------------------------------------------------------------------------------
// Classes
//--------------------------------------------------------------------------------------------------
export default class extends Command {
  readonly displayName = 'Demo Command';
  private readonly parser = new ArgumentParser(options);

  constructor(props: Props) {
    super(props, 'tsargp');
  }

  override run(line: string, compIndex?: number) {
    try {
      const values = this.parser.parse(line, { compIndex });
      if (!values['command']) {
        this.println(JSON.stringify(values, null, 2));
      }
    } catch (err) {
      throw err instanceof ErrorMessage || err instanceof HelpMessage
        ? err.wrap(this.state.width)
        : err;
    }
  }
}
