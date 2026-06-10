import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export function MarkdownView({ children }: { children: string }) {
  return (
    <div className="nc-prose prose prose-sm max-w-none prose-code:rounded prose-code:bg-surface-sunken prose-code:px-1 prose-code:py-0.5 prose-code:text-fg prose-code:before:content-none prose-code:after:content-none prose-pre:bg-surface-sunken">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  )
}
