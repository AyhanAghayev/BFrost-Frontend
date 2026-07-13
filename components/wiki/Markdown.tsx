"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function Markdown({ children }: { children: string }) {
  return (
    <div className="text-on-surface leading-relaxed [&>*:first-child]:mt-0 flex flex-col gap-4">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (p) => <h1 className="font-headline-lg text-headline-lg text-primary mt-6" {...p} />,
          h2: (p) => <h2 className="font-headline-md text-headline-md text-primary mt-6" {...p} />,
          h3: (p) => <h3 className="font-label-md text-lg font-bold text-on-surface mt-4" {...p} />,
          p: (p) => <p className="text-body-md" {...p} />,
          ul: (p) => <ul className="list-disc pl-6 flex flex-col gap-1" {...p} />,
          ol: (p) => <ol className="list-decimal pl-6 flex flex-col gap-1" {...p} />,
          a: (p) => (
            <a className="text-action-blue hover:underline" target="_blank" rel="noopener noreferrer" {...p} />
          ),
          code: (p) => (
            <code className="bg-surface-container-high rounded px-1.5 py-0.5 text-sm font-mono" {...p} />
          ),
          pre: (p) => (
            <pre className="bg-surface-container-high rounded-lg p-4 overflow-x-auto text-sm" {...p} />
          ),
          blockquote: (p) => (
            <blockquote className="border-l-4 border-border-subtle pl-4 text-on-surface-variant italic" {...p} />
          ),
          table: (p) => (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm" {...p} />
            </div>
          ),
          th: (p) => <th className="border border-border-subtle px-3 py-1.5 bg-surface-faint text-left" {...p} />,
          td: (p) => <td className="border border-border-subtle px-3 py-1.5" {...p} />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
