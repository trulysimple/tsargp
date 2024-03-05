//--------------------------------------------------------------------------------------------------
// Imports and Exports
//--------------------------------------------------------------------------------------------------
import React, { createRef } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  compressToEncodedURIComponent as compress,
  decompressFromEncodedURIComponent as decompress,
} from 'lz-string';
import { Editor, Props } from './classes/editor';

//--------------------------------------------------------------------------------------------------
// Classes
//--------------------------------------------------------------------------------------------------
class CodeEditor extends Editor {}

//--------------------------------------------------------------------------------------------------
// Functions
//--------------------------------------------------------------------------------------------------
export default function Code(props: Props): JSX.Element {
  const docParam = useSearchParams().get('doc');
  const initialDoc = docParam ? decompress(docParam) : props.initialDoc;
  const spanRef = createRef<HTMLSpanElement>();
  const onClick = () => {
    const param = compress(props.callbacks.getSource());
    window.history.replaceState(null, '', `?doc=${param}`);
    navigator.clipboard.writeText(window.location.href).then(() => {
      if (spanRef.current) {
        spanRef.current.style.display = 'inline-block';
      }
    });
  };
  return (
    <div>
      <button type="button" onClick={onClick} title="Click to update the URL">
        Share URL
      </button>
      <span ref={spanRef} className="tooltip">
        URL copied to clipboard!
      </span>
      <CodeEditor {...{ ...props, initialDoc }} />
      <style jsx>{`
        .tooltip {
          display: none;
          padding: 0px 10px;
        }
        button {
          background-color: rgba(40, 40, 40);
          border-radius: 8px;
          border-width: 0;
          color: #aaa;
          cursor: pointer;
          display: inline-block;
          font-weight: 500;
          line-height: 20px;
          list-style: none;
          margin: 0 0 10px;
          padding: 10px 12px;
          text-align: center;
          transition: all 200ms;
          vertical-align: baseline;
          white-space: nowrap;
          user-select: none;
          -webkit-user-select: none;
          touch-action: manipulation;
        }
      `}</style>
    </div>
  );
}
Code.displayName = 'Code Editor';
