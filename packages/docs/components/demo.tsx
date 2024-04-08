//--------------------------------------------------------------------------------------------------
// Imports and Exports
//--------------------------------------------------------------------------------------------------
import React from 'react';
import { ArgumentParser, ErrorMessage, HelpMessage } from 'tsargp';
import { type Props, Command } from './classes/command';

// @ts-expect-error since tsargp examples do not export types
import { demo as options } from 'tsargp/examples';

delete options.version; // remove version option since there's no package.json in the browser

//--------------------------------------------------------------------------------------------------
// Classes
//--------------------------------------------------------------------------------------------------
class DemoCommand extends Command {
  private readonly parser = new ArgumentParser(options);

  constructor(props: Props) {
    super(props, 'tsargp');
  }

  override async run(line: string, compIndex?: number) {
    try {
      const values: { hello?: number } = {};
      const flags = { progName: 'tsargp', compIndex, clusterPrefix: '-' };
      const { warning } = await this.parser.parseInto(values, line, flags);
      if (warning) {
        this.println(warning.wrap(this.state.width));
      }
      if (!values.hello) {
        this.println(JSON.stringify(values, null, 2));
      }
    } catch (err) {
      if (err instanceof ErrorMessage) {
        throw err.msg.wrap(this.state.width);
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
