"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  error?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Введите описание...",
  minLength = 50,
  maxLength = 2000,
  error,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [wordCount, setWordCount] = useState(0);
  const isInternalUpdateRef = useRef(false);

  // Обновление счетчика символов
  const updateWordCount = useCallback((html: string) => {
    if (!editorRef.current) return 0;
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    const text = tempDiv.textContent || tempDiv.innerText || "";
    return text.length;
  }, []);

  // Инициализация и синхронизация значения
  useEffect(() => {
    if (!editorRef.current || isInternalUpdateRef.current) return;
    
    const currentHtml = editorRef.current.innerHTML;
    const normalizedValue = value || "";
    
    // Обновляем только если значение действительно изменилось извне
    if (normalizedValue !== currentHtml) {
      isInternalUpdateRef.current = true;
      editorRef.current.innerHTML = normalizedValue;
      const count = updateWordCount(normalizedValue);
      setWordCount(count);
      isInternalUpdateRef.current = false;
    }
  }, [value, updateWordCount]);

  const handleInput = useCallback(() => {
    if (!editorRef.current || isInternalUpdateRef.current) return;
    
    const html = editorRef.current.innerHTML;
    const count = updateWordCount(html);
    setWordCount(count);
    
    // Вызываем onChange только если значение изменилось
    if (html !== value) {
      onChange(html);
    }
  }, [onChange, value, updateWordCount]);

  const applyFormat = useCallback((command: string, value?: string) => {
    if (!editorRef.current) return;
    
    editorRef.current.focus();
    
    // Сохраняем текущую позицию курсора
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    // Сохраняем range для восстановления позиции курсора после форматирования
    selection.getRangeAt(0);
    
    try {
      // Применяем форматирование
      if (command === "formatBlock" && value) {
        document.execCommand("formatBlock", false, value);
      } else {
        document.execCommand(command, false, value);
      }
      
      // Обновляем после форматирования
      setTimeout(() => {
        handleInput();
      }, 0);
    } catch (err) {
      console.error("Error applying format:", err);
    }
  }, [handleInput]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    
    if (!editorRef.current) return;
    
    const text = e.clipboardData.getData("text/plain");
    
    // Вставляем только текст, без форматирования
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      const textNode = document.createTextNode(text);
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    
    setTimeout(() => {
      handleInput();
    }, 0);
  }, [handleInput]);

  const ToolbarButton = ({
    onClick,
    icon,
    title,
    isActive = false,
  }: {
    onClick: () => void;
    icon: React.ReactNode;
    title: string;
    isActive?: boolean;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-2 rounded-lg hover:bg-color-lightest transition-colors ${
        isActive ? "bg-color-lightest" : ""
      }`}
      onMouseDown={(e) => e.preventDefault()} // Предотвращаем потерю фокуса
    >
      {icon}
    </button>
  );

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-color-lightest rounded-t-lg border border-color-light border-b-0 overflow-x-auto">
        <ToolbarButton
          onClick={() => applyFormat("bold")}
          title="Жирный (Ctrl+B)"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
              <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
            </svg>
          }
        />
        <ToolbarButton
          onClick={() => applyFormat("italic")}
          title="Курсив (Ctrl+I)"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="4" x2="10" y2="4"></line>
              <line x1="14" y1="20" x2="5" y2="20"></line>
              <line x1="15" y1="4" x2="9" y2="20"></line>
            </svg>
          }
        />
        <ToolbarButton
          onClick={() => applyFormat("underline")}
          title="Подчеркнутый (Ctrl+U)"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"></path>
              <line x1="4" y1="21" x2="20" y2="21"></line>
            </svg>
          }
        />
        <div className="w-px h-6 bg-color-light mx-1"></div>
        <ToolbarButton
          onClick={() => applyFormat("formatBlock", "<h2>")}
          title="Заголовок"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 4v16M18 4v16M6 4h6a2 2 0 0 1 2 2v12M6 12h12"></path>
            </svg>
          }
        />
        <ToolbarButton
          onClick={() => applyFormat("insertUnorderedList")}
          title="Маркированный список"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <line x1="3" y1="6" x2="3.01" y2="6"></line>
              <line x1="3" y1="12" x2="3.01" y2="12"></line>
              <line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
          }
        />
        <ToolbarButton
          onClick={() => applyFormat("insertOrderedList")}
          title="Нумерованный список"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="10" y1="6" x2="21" y2="6"></line>
              <line x1="10" y1="12" x2="21" y2="12"></line>
              <line x1="10" y1="18" x2="21" y2="18"></line>
              <path d="M4 6h1v1H4V6zm0 6h1v1H4v-1zm0 6h1v1H4v-1z"></path>
            </svg>
          }
        />
        <div className="w-px h-6 bg-color-light mx-1"></div>
        <ToolbarButton
          onClick={() => applyFormat("removeFormat")}
          title="Очистить форматирование"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 4l-4 16h-2L16 4h2zM4 8h10M4 12h10M4 16h6"></path>
            </svg>
          }
        />
      </div>

      {/* Editor */}
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onPaste={handlePaste}
          className={`w-full min-h-[220px] max-h-[520px] overflow-y-auto px-4 py-3 rounded-b-lg border border-color-light focus:border-color-medium focus:ring-2 focus:ring-color-medium/20 outline-none transition-all text-color-dark placeholder:text-color-medium bg-white ${
            error ? "border-red-500" : ""
          }`}
          style={{
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontFamily: "inherit",
            lineHeight: "1.7",
            fontSize: "0.95rem",
          }}
          data-placeholder={placeholder}
        />
      </div>

      {/* Footer */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mt-2">
        <div className="flex items-center gap-4 flex-wrap">
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          {!error && wordCount < minLength && (
            <p className="text-xs text-color-medium">
              Минимум {minLength} символов. Осталось: {minLength - wordCount}
            </p>
          )}
        </div>
        <p className="text-xs text-color-medium">
          {wordCount} / {maxLength} символов
        </p>
      </div>

      {/* Styles */}
      <style jsx global>{`
        [contenteditable] {
          outline: none;
        }
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9CA3AF;
          pointer-events: none;
        }
        [contenteditable] h2 {
          font-size: 1.5rem;
          font-weight: bold;
          margin: 1rem 0 0.5rem 0;
          line-height: 1.3;
        }
        [contenteditable] ul, [contenteditable] ol {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
        }
        [contenteditable] li {
          margin: 0.25rem 0;
        }
        [contenteditable] p {
          margin: 0.5rem 0;
        }
        [contenteditable] strong {
          font-weight: 600;
        }
        [contenteditable] em {
          font-style: italic;
        }
        [contenteditable] u {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
