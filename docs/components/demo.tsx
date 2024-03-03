//--------------------------------------------------------------------------------------------------
// Imports and Exports
//--------------------------------------------------------------------------------------------------
import { type CastToOptionValues } from 'tsargp';
import { type Props, Command } from './command';

// @ts-expect-error since tsargp demo does not export types
import { demo as options } from 'tsargp/examples';
// override version because there's no package.json file in the browser
options.version.version = '0.1.94';

//--------------------------------------------------------------------------------------------------
// Classes
//--------------------------------------------------------------------------------------------------
export default class extends Command {
  constructor(props: Props) {
    super(props, 'tsargp', options);
  }

  protected handleValues(values: CastToOptionValues) {
    if (!values['command']) {
      this.readline.println(JSON.stringify(values, null, 2));
    }
  }
}
