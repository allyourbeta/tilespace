import { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { X, Edit3, Eye, Trash2 } from 'lucide-react';
import { Link } from '@/types';

interface DocumentEditorProps {
  document: Link | null;
  onClose: () => void;
  onSave: (id: string, updates: { title: string; content: string; summary: string }) => void;
  onDelete: (id: string) => void;
}

export function DocumentEditor({ document, onClose, onSave, onDelete }: DocumentEditorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<number | null>(null);

  // Track which document ID we've initialized, so we only set
  // the initial preview state when opening a *different* document,
  // not when the same document's prop updates from autosave.
  const initializedDocIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (document) {
      const isNewDocument = document.id !== initializedDocIdRef.current;
      if (isNewDocument) {
        // Only initialize state when opening a different document,
        // not when the same document's prop updates from autosave
        setTitle(document.title);
        setContent(document.content || '');
        setSummary(document.summary || '');
        setHasChanges(false);
        setIsPreview(!!document.content);
        initializedDocIdRef.current = document.id;
      }
    } else {
      // Document closed — reset so next open gets fresh init
      initializedDocIdRef.current = null;
    }
  }, [document]);

  // For new/empty notes, focus the content area instead of title
  useEffect(() => {
    if (document && !document.content && !isPreview) {
      setTimeout(() => contentRef.current?.focus(), 100);
    }
  }, [document, isPreview]);

  const saveChanges = useCallback(() => {
    if (!document || !hasChanges) return;
    onSave(document.id, { title, content, summary });
    setHasChanges(false);
  }, [document, hasChanges, title, content, summary, onSave]);

  useEffect(() => {
    if (hasChanges) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = window.setTimeout(saveChanges, 1000);
    }
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [hasChanges, saveChanges]);

  const handleChange = (field: 'title' | 'content' | 'summary', value: string) => {
    if (field === 'title') setTitle(value);
    if (field === 'content') setContent(value);
    if (field === 'summary') setSummary(value);
    setHasChanges(true);
  };

  const handleClose = useCallback(() => {
    if (document) {
      const isEmpty = !title.trim() && !content.trim() && !summary.trim();
      if (isEmpty) {
        // Delete the empty document instead of saving it
        onDelete(document.id);
      } else if (hasChanges) {
        onSave(document.id, { title, content, summary });
      }
    }
    onClose();
  }, [document, title, content, summary, hasChanges, onSave, onDelete, onClose]);

  // Escape closes the note and returns to the tile panel (the level above).
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleClose]);

  const handleDelete = () => {
    if (!document) return;
    if (confirm('Delete this note?')) {
      onDelete(document.id);
      onClose();
    }
  };

  if (!document) return null;

  const isEmpty = !content.trim();

  return (
    <div className="fixed inset-0 bg-surface-card z-50 flex flex-col">
      <div className="border-b border-edge px-4 py-3 flex items-center justify-between bg-surface-page">
        <div className="flex items-center gap-3">
          <button
            onClick={handleClose}
            className="p-2 hover:bg-black/[0.05] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-ink-2" />
          </button>
          <div className="flex items-center gap-2 bg-edge-soft rounded-lg p-1">
            <button
              onClick={() => setIsPreview(false)}
              className={`px-3 py-1.5 text-ts-body font-medium rounded-md transition-colors ${
                !isPreview ? 'bg-surface-card shadow-card text-ink' : 'text-ink-2 hover:text-ink'
              }`}
            >
              <Edit3 className="w-4 h-4 inline-block mr-1.5" />
              Edit
            </button>
            <button
              onClick={() => setIsPreview(true)}
              className={`px-3 py-1.5 text-ts-body font-medium rounded-md transition-colors ${
                isPreview ? 'bg-surface-card shadow-card text-ink' : 'text-ink-2 hover:text-ink'
              }`}
            >
              <Eye className="w-4 h-4 inline-block mr-1.5" />
              Read
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <span className="text-ts-meta text-ink-faint">Saving...</span>
          )}
          <button
            onClick={handleDelete}
            className="p-2 hover:bg-red-100 rounded-lg transition-colors"
            title="Delete note"
          >
            <Trash2 className="w-5 h-5 text-red-500" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="max-w-3xl mx-auto h-full flex flex-col px-4 py-6">
          {isPreview ? (
            <div className="flex-1 overflow-y-auto">
              <h1 className="text-ts-panel font-bold text-ink mb-2">
                {title || 'Untitled'}
              </h1>
              {summary && (
                <p className="text-ink-muted mb-6 italic">{summary}</p>
              )}
              {isEmpty ? (
                <p className="text-ink-faint italic">No content yet. Switch to Edit mode to add some.</p>
              ) : (
                <div className="prose prose-gray max-w-none">
                  <ReactMarkdown>{content}</ReactMarkdown>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              <input
                ref={titleRef}
                type="text"
                value={title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Add a title..."
                className="text-ts-panel font-bold text-ink placeholder-ink-faint border-none outline-none bg-transparent mb-2"
              />
              <input
                type="text"
                value={summary}
                onChange={(e) => handleChange('summary', e.target.value)}
                placeholder="Brief description (optional)"
                className="text-ink-muted placeholder-ink-faint border-none outline-none bg-transparent mb-4 italic"
              />
              <textarea
                ref={contentRef}
                value={content}
                onChange={(e) => handleChange('content', e.target.value)}
                placeholder="Write your note here... (Markdown supported)"
                className="flex-1 text-ink placeholder-ink-faint border-none outline-none bg-transparent resize-none text-ts-body leading-relaxed"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
