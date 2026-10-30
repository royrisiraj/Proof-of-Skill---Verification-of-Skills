import React from 'react';
import { Copy, Check, RotateCcw } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface CodeEditorProps {
  filename: string;
  value: string;
  onChange?: (val: string) => void;
  readOnly?: boolean;
  minHeight?: string;
  onReset?: () => void;
  badgeText?: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  filename,
  value,
  onChange,
  readOnly = false,
  minHeight = '380px',
  onReset,
  badgeText = 'Python 3.12',
}) => {
  const { copyToClipboard } = useApp();
  const [copied, setCopied] = React.useState(false);

  const lines = value.split('\n');

  const handleCopy = async () => {
    await copyToClipboard(value, `Copied ${filename} to clipboard`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-[#CBD9EB] dark:border-[#34465F] bg-[#0D1520] flex flex-col overflow-hidden shadow-xs">
      {/* File Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#203046] bg-[#131C28] text-xs">
        <div className="flex items-center gap-2">
          <span className="font-mono font-medium text-[#F0F5FC]">
            {filename}
          </span>
          <span aria-hidden="true" className="text-[#4D607B]">·</span>
          <span className="text-[#80B9F5] font-mono text-[11px]">
            {badgeText}
          </span>
          {readOnly && (
            <>
              <span aria-hidden="true" className="text-[#4D607B]">·</span>
              <span className="text-[#9AACC3] text-[11px]">
                Read-only
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {onReset && (
            <button
              onClick={onReset}
              title="Reset file contents"
              className="px-2 py-1 text-[#9AACC3] hover:text-[#F0F5FC] hover:bg-[#203046] rounded text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
          <button
            onClick={handleCopy}
            title="Copy code"
            className="px-2 py-1 text-[#9AACC3] hover:text-[#F0F5FC] hover:bg-[#203046] rounded text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-[#78C9A4]" />
                <span className="text-[#78C9A4] font-medium">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="relative flex font-mono text-xs leading-relaxed overflow-x-auto bg-[#0D1520]" style={{ minHeight }}>
        {/* Line Numbers */}
        <div
          aria-hidden="true"
          className="select-none py-3.5 pl-3 pr-2.5 text-right bg-[#0A101A] text-[#4D607B] border-r border-[#203046] font-mono text-[11px] shrink-0"
          style={{ width: '44px' }}
        >
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Text Area or Code Display */}
        {readOnly ? (
          <pre className="p-3.5 text-[#E6EFFD] font-mono text-xs overflow-x-auto whitespace-pre flex-1 leading-relaxed">
            <code>{value}</code>
          </pre>
        ) : (
          <div className="relative flex-1">
            <textarea
              value={value}
              onChange={(e) => onChange && onChange(e.target.value)}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              aria-label={`Code editor for ${filename}`}
              className="w-full h-full p-3.5 font-mono text-xs bg-transparent text-[#E6EFFD] resize-none outline-none whitespace-pre overflow-x-auto focus-visible:ring-1 focus-visible:ring-[#80B9F5]/50 leading-relaxed caret-[#80B9F5]"
              style={{ minHeight, tabSize: 4 }}
            />
          </div>
        )}
      </div>

      {/* Footer metadata bar */}
      <div className="px-4 py-2 border-t border-[#203046] bg-[#131C28] text-[11px] text-[#9AACC3] flex items-center justify-between font-mono">
        <span>{lines.length} lines</span>
        <span>UTF-8 · Python Indent (4 spaces)</span>
      </div>
    </div>
  );
};
