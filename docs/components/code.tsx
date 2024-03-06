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
  function getSearchParam(): string {
    return `?body=${compress(props.callbacks.getSource())}`;
  }
  const docParam = useSearchParams().get('body');
  const initialDoc = docParam ? decompress(docParam) : props.initialDoc;
  const spanRef = createRef<HTMLSpanElement>();
  const onClickShare = () => {
    window.history.replaceState(null, '', getSearchParam());
    navigator.clipboard.writeText(window.location.href).then(() => {
      if (spanRef.current) {
        spanRef.current.style.display = 'inline-block';
      }
    });
  };
  const anchorRef = createRef<HTMLAnchorElement>();
  const onMouseEnter = () => {
    if (anchorRef.current) {
      const url = window.location.origin + window.location.pathname + getSearchParam();
      const issue = encodeURIComponent(`[Playground link](${url})`);
      const href = `https://github.com/trulysimple/tsargp/issues/new?labels=bug&body=${issue}`;
      anchorRef.current.setAttribute('href', href);
    }
  };
  return (
    <div>
      <a ref={anchorRef} target="_blank">
        <button type="button" onMouseEnter={onMouseEnter} title="Click to create a GitHub issue">
          Report Bug
        </button>
      </a>
      <button type="button" onClick={onClickShare} title="Click to update the URL">
        Share URL
      </button>
      <span ref={spanRef} className="tooltip">
        URL copied to clipboard!
      </span>
      <CodeEditor {...{ ...props, initialDoc }} />
      <style jsx>{`
        .tooltip {
          display: none;
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
          margin: 0 10px 10px 0;
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
