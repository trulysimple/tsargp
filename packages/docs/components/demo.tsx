//--------------------------------------------------------------------------------------------------
// Imports and Exports
//--------------------------------------------------------------------------------------------------
import React from 'react';
import { ArgumentParser, ErrorMessage, HelpMessage } from 'tsargp';
import { type Props, Command } from './classes/command';

// @ts-expect-error since tsargp demo does not export types
import { demo as options } from 'tsargp/examples';

// remove version option since there's no package.json file in the browser
delete options.version;

//--------------------------------------------------------------------------------------------------
// Classes
//--------------------------------------------------------------------------------------------------
class DemoCommand extends Command {
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
      if (err instanceof ErrorMessage) {
        throw 'Error: ' + err.msg.wrap(this.state.width);
      } else if (err instanceof HelpMessage) {
        throw err.wrap(this.state.width);
      }
      throw err;
    }
  }
}

//--------------------------------------------------------------------------------------------------
// Functions
//--------------------------------------------------------------------------------------------------
/** @ignore */
export default function Demo(props: Props): JSX.Element {
  return <DemoCommand {...props} />;
}
Demo.displayName = 'Demo Command';
