//--------------------------------------------------------------------------------------------------
// Imports and Exports
//--------------------------------------------------------------------------------------------------
import { type CastToOptionValues } from 'tsargp';
import { type Props, Command } from './command';

// @ts-expect-error since tsargp demo does not export types
import { calc as options } from 'tsargp/examples';

//--------------------------------------------------------------------------------------------------
// Classes
//--------------------------------------------------------------------------------------------------
export default class extends Command {
  constructor(props: Props) {
    super(props, 'calc', options);
  }

  protected handleValues(values: CastToOptionValues) {
    const result = values['add'] ?? values['sub'] ?? values['mult'] ?? values['div'] ?? NaN;
    this.readline.println(`${result}`);
  }
}
