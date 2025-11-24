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
  const isUpdatingRef = useRef(false);
  const lastSelectionRef = useRef<{ start: number; end: number } | null>(null);

  // Сохранение позиции курсора
  const saveSelection = useCallback(() => {
    if (!editorRef.current) return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(editorRef.current);
    preCaretRange.setEnd(range.startContainer, range.startOffset);
    const start = preCaretRange.toString().length;

    lastSelectionRef.current = {
      start,
      end: start + range.toString().length,
    };
  }, []);

  // Восстановление позиции курсора
  const restoreSelection = useCallback(() => {
    if (!editorRef.current || !lastSelectionRef.current) return;

    const { start, end } = lastSelectionRef.current;
    const selection = window.getSelection();
    if (!selection) return;

    try {
      let charCount = 0;
      const nodeStack: Node[] = [editorRef.current];
      let node: Node | undefined;
      let startNode: Node | null = null;
      let startOffset = 0;
      let endNode: Node | null = null;
      let endOffset = 0;

      while ((node = nodeStack.pop())) {
        if (node.nodeType === Node.TEXT_NODE) {
          const nodeLength = node.textContent?.length || 0;
          if (!startNode && charCount + nodeLength >= start) {
            startNode = node;
            startOffset = start - charCount;
          }
          if (!endNode && charCount + nodeLength >= end) {
            endNode = node;
            endOffset = end - charCount;
            break;
          }
          charCount += nodeLength;
        } else {
          let i = node.childNodes.length;
          while (i--) {
            nodeStack.push(node.childNodes[i] as Node);
          }
        }
      }

      if (startNode) {
        const range = document.createRange();
        range.setStart(startNode, Math.min(startOffset, startNode.textContent?.length || 0));
        if (endNode) {
          range.setEnd(endNode, Math.min(endOffset, endNode.textContent?.length || 0));
        } else {
          range.setEnd(startNode, Math.min(startOffset, startNode.textContent?.length || 0));
        }
        selection.removeAllRanges();
        selection.addRange(range);
      }
    } catch (error) {
      console.error("Error restoring selection:", error);
    }
  }, []);

  // Инициализация значения только при первом монтировании или изменении value извне
  useEffect(() => {
    if (!editorRef.current) return;
    
    // Проверяем, что это внешнее изменение, а не внутреннее
    if (isUpdatingRef.current) return;
    
    const currentHtml = editorRef.current.innerHTML;
    const normalizedValue = value || "";
    const normalizedCurrent = currentHtml || "";
    
    // Обновляем только если значение действительно изменилось извне
    if (normalizedValue !== normalizedCurrent) {
      saveSelection();
      editorRef.current.innerHTML = normalizedValue;
      const text = editorRef.current.innerText || "";
      setWordCount(text.length);
      
      // Восстанавливаем позицию курсора после небольшой задержки
      setTimeout(() => {
        restoreSelection();
      }, 0);
    }
  }, [value, saveSelection, restoreSelection]);

  const handleInput = useCallback(() => {
    if (!editorRef.current || isUpdatingRef.current) return;
    
    isUpdatingRef.current = true;
    const html = editorRef.current.innerHTML;
    const text = editorRef.current.innerText || "";
    
    // Подсчитываем символы без HTML тегов
    const textLength = text.length;
    setWordCount(textLength);
    
    // Сохраняем позицию курсора перед обновлением
    saveSelection();
    
    // Вызываем onChange
    onChange(html);
    
    // Восстанавливаем позицию курсора
    setTimeout(() => {
      restoreSelection();
      isUpdatingRef.current = false;
    }, 0);
  }, [onChange, saveSelection, restoreSelection]);

  const applyFormat = useCallback((command: string, value?: string) => {
    if (!editorRef.current) return;
    
    saveSelection();
    document.execCommand(command, false, value);
    editorRef.current.focus();
    
    // Обновляем после форматирования
    setTimeout(() => {
      handleInput();
      restoreSelection();
    }, 0);
  }, [handleInput, saveSelection, restoreSelection]);

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
    >
      {icon}
    </button>
  );

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-color-lightest rounded-t-lg border border-color-light border-b-0">
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
          onBlur={saveSelection}
          onKeyDown={(e) => {
            // Сохраняем позицию при нажатии клавиш
            if (e.key === "Enter" || e.key === "Backspace" || e.key === "Delete") {
              setTimeout(saveSelection, 0);
            }
          }}
          onPaste={(e) => {
            e.preventDefault();
            saveSelection();
            const text = e.clipboardData.getData("text/plain");
            document.execCommand("insertText", false, text);
            setTimeout(() => {
              handleInput();
              restoreSelection();
            }, 0);
          }}
          className={`w-full min-h-[200px] px-4 py-3 rounded-b-lg border border-color-light focus:border-color-medium focus:ring-2 focus:ring-color-medium/20 outline-none transition-all text-color-dark placeholder:text-color-medium ${
            error ? "border-red-500" : ""
          }`}
          style={{
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
          data-placeholder={placeholder}
        />
        
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-4">
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
        }
        [contenteditable] ul, [contenteditable] ol {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
        }
        [contenteditable] li {
          margin: 0.25rem 0;
        }
      `}</style>
    </div>
  );
}
