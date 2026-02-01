import { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { X, Edit3, Eye, Trash2 } from 'lucide-react';
import { Link } from '../types';

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
  const saveTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (document) {
      setTitle(document.title);
      setContent(document.content || '');
      setSummary(document.summary || '');
      setHasChanges(false);
      setIsPreview(!!document.content);
    }
  }, [document]);

  useEffect(() => {
    if (!document) {
      setTimeout(() => titleRef.current?.focus(), 100);
    }
  }, [document]);

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

  const handleClose = () => {
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
  };

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
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <div className="border-b border-gray-200 px-4 py-3 flex items-center justify-between bg-gray-50">
        <div className="flex items-center gap-3">
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2 bg-gray-200 rounded-lg p-1">
            <button
              onClick={() => setIsPreview(false)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                !isPreview ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Edit3 className="w-4 h-4 inline-block mr-1.5" />
              Edit
            </button>
            <button
              onClick={() => setIsPreview(true)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                isPreview ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Eye className="w-4 h-4 inline-block mr-1.5" />
              Read
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <span className="text-xs text-gray-400">Saving...</span>
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {title || 'Untitled'}
              </h1>
              {summary && (
                <p className="text-gray-500 mb-6 italic">{summary}</p>
              )}
              {isEmpty ? (
                <p className="text-gray-400 italic">No content yet. Switch to Edit mode to add some.</p>
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
                placeholder="Title"
                className="text-3xl font-bold text-gray-900 placeholder-gray-300 border-none outline-none bg-transparent mb-2"
              />
              <input
                type="text"
                value={summary}
                onChange={(e) => handleChange('summary', e.target.value)}
                placeholder="Brief description (optional)"
                className="text-gray-500 placeholder-gray-300 border-none outline-none bg-transparent mb-4 italic"
              />
              <textarea
                value={content}
                onChange={(e) => handleChange('content', e.target.value)}
                placeholder="Write your note here... (Markdown supported)"
                className="flex-1 text-gray-800 placeholder-gray-300 border-none outline-none bg-transparent resize-none text-lg leading-relaxed"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
