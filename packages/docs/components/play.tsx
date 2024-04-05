//--------------------------------------------------------------------------------------------------
// Imports and Exports
//--------------------------------------------------------------------------------------------------
import React from 'react';
import { ArgumentParser, ErrorMessage, HelpMessage } from 'tsargp';
import { style, req, fg8, bg8, ul8, ul } from 'tsargp';
import { HelpItem, ErrorItem, tf, fg, bg } from 'tsargp/enums';
import { type Props, Command } from './classes/command';

const tsargp = { ArgumentParser, req, tf, fg, bg, ul, HelpItem, ErrorItem, style, fg8, bg8, ul8 };

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
class PlayCommand extends Command<PlayProps> {
  private parser: ArgumentParser | undefined;

  constructor(props: PlayProps) {
    super(props, 'init', 'play');
  }

  private init() {
    const source = this.props.callbacks.getSource();
    const options = Function('tsargp', `'use strict';${source}`)(tsargp);
    const parser = new ArgumentParser(options);
    const { warning } = parser.validate();
    if (warning) {
      this.println(warning.wrap(this.state.width));
    }
    this.parser = parser;
  }

  override async run(line: string, compIndex?: number) {
    try {
      if (line.startsWith('init')) {
        if (!compIndex) {
          this.init();
        }
      } else if (this.parser) {
        const values = {};
        await this.parser.parseInto(values, line, { compIndex });
        this.println(JSON.stringify(values, null, 2));
      } else {
        this.println(`Please call ${style(1)}init${style(0)} first.`);
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
export default function Play(props: PlayProps): JSX.Element {
  return <PlayCommand {...props} />;
}
Play.displayName = 'Play Command';
