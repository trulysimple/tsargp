//--------------------------------------------------------------------------------------------------
// Imports and Exports
//--------------------------------------------------------------------------------------------------
import * as React from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';

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
  /**
   * The CSS styles.
   */
  readonly style?: React.CSSProperties;
  /**
   * The initial editor document.
   */
  readonly initialDoc?: string;
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
export default class extends React.Component<Props> {
  readonly displayName = 'JavaScript Editor';
  private readonly ref = React.createRef<HTMLDivElement>();
  private editorView: EditorView | undefined;

  constructor(props: Props) {
    super(props);
    props.callbacks.getSource = this.getSource.bind(this);
  }

  override componentDidMount() {
    if (this.ref.current) {
      this.editorView = new EditorView({
        extensions: [basicSetup, javascript()],
        parent: this.ref.current,
        doc: this.props.initialDoc,
      });
    }
  }

  override render(): React.JSX.Element {
    return <div ref={this.ref} className={this.props.className} style={this.props.style} />;
  }

  private getSource(): string {
    return this.editorView ? this.editorView.state.doc.toString() : '';
  }
}
