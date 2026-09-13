import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/** Resolve `/public` paths against Vite's base (e.g. `/NoobCode/` on GitHub Pages). */
function resolvePublicSrc(src: string | undefined): string | undefined {
  if (!src || /^(https?:|data:|blob:)/i.test(src)) return src
  if (!src.startsWith('/')) return src
  const base = import.meta.env.BASE_URL
  return `${base}${src.slice(1)}`
}

export function MarkdownView({ children }: { children: string }) {
  return (
    <div className="nc-prose prose prose-sm max-w-none prose-code:rounded prose-code:bg-surface-sunken prose-code:px-1 prose-code:py-0.5 prose-code:text-fg prose-code:before:content-none prose-code:after:content-none prose-pre:bg-surface-sunken">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          img: ({ src, alt, ...props }) => (
            <img src={resolvePublicSrc(src)} alt={alt ?? ''} {...props} />
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
