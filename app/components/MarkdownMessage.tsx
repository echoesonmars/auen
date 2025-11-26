"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownMessageProps {
  content: string;
  className?: string;
  textColor?: string; // Для переопределения цвета текста
}

export default function MarkdownMessage({ content, className = "", textColor = "" }: MarkdownMessageProps) {
  return (
    <div className={`prose prose-sm max-w-none ${className} ${textColor}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Стилизация заголовков
          h1: ({ ...props }) => <h1 className={`text-lg font-bold mb-2 mt-3 first:mt-0 ${textColor}`} {...props} />,
          h2: ({ ...props }) => <h2 className={`text-base font-bold mb-2 mt-3 first:mt-0 ${textColor}`} {...props} />,
          h3: ({ ...props }) => <h3 className={`text-sm font-bold mb-1 mt-2 first:mt-0 ${textColor}`} {...props} />,
          // Стилизация параграфов
          p: ({ ...props }) => <p className={`mb-2 last:mb-0 ${textColor}`} {...props} />,
          // Стилизация списков
          ul: ({ ...props }) => <ul className={`list-disc list-inside mb-2 space-y-1 ${textColor}`} {...props} />,
          ol: ({ ...props }) => <ol className={`list-decimal list-inside mb-2 space-y-1 ${textColor}`} {...props} />,
          li: ({ ...props }) => <li className={`ml-2 ${textColor}`} {...props} />,
          // Стилизация ссылок
          a: ({ ...props }) => (
            <a
              className={textColor ? "text-blue-200 hover:text-blue-100 underline break-all" : "text-blue-500 hover:text-blue-600 underline break-all"}
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
          // Стилизация кода
          code: ({ className, ...props }) => {
            const isInline = !className;
            const codeBg = textColor ? "bg-white/20" : "bg-gray-100";
            const codeText = textColor || "";
            return isInline ? (
              <code className={`${codeBg} ${codeText} px-1 py-0.5 rounded text-xs font-mono`} {...props} />
            ) : (
              <code className={`block ${codeBg} ${codeText} p-2 rounded text-xs font-mono overflow-x-auto`} {...props} />
            );
          },
          // Стилизация блоков кода
          pre: ({ ...props }) => {
            const preBg = textColor ? "bg-white/20" : "bg-gray-100";
            const preText = textColor || "";
            return <pre className={`${preBg} ${preText} p-2 rounded text-xs font-mono overflow-x-auto mb-2`} {...props} />;
          },
          // Стилизация выделения текста
          strong: ({ ...props }) => <strong className={`font-bold ${textColor}`} {...props} />,
          em: ({ ...props }) => <em className={`italic ${textColor}`} {...props} />,
          // Стилизация горизонтальной линии
          hr: ({ ...props }) => <hr className={`my-2 ${textColor ? "border-white/30" : "border-gray-300"}`} {...props} />,
          // Стилизация блоков цитат
          blockquote: ({ ...props }) => (
            <blockquote className={`border-l-4 ${textColor ? "border-white/30" : "border-gray-300"} pl-3 italic my-2 ${textColor}`} {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

