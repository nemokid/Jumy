'use client';

import { useState, useEffect, useCallback } from 'react';
import { getInbox, deleteMessage } from '@/src/lib/api';
import { decryptFile, arrayBufferToBlob } from '@/src/lib/crypto';

function formatTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function formatExpiresIn(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date - now;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 0) return 'Expired';
  if (diffMins < 60) return `${diffMins}m left`;
  return `${diffHours}h left`;
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function Inbox({ session, onCompose, onReply }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getInbox(session.usernameHash, session.fakeMode);
      setMessages(result.messages || []);
    } catch (err) {
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const handleDelete = async (messageId) => {
    try {
      await deleteMessage(session.usernameHash, messageId, session.fakeMode);
      setMessages(messages.filter(m => m.id !== messageId));
    } catch (err) {
      setError('Failed to delete message');
    }
  };

  const handleDownload = async (message) => {
    if (!message.attachmentUrl || session.fakeMode) return;
    
    setDownloadingId(message.id);
    try {
      const response = await fetch(message.attachmentUrl);
      const encryptedBuffer = await response.arrayBuffer();
      const decryptedBuffer = await decryptFile(encryptedBuffer, session.usernameHash);
      
      if (!decryptedBuffer) {
        throw new Error('Decryption failed');
      }
      
      const blob = arrayBufferToBlob(decryptedBuffer, 'application/octet-stream');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = message.attachmentName || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      setError('Failed to download file');
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Inbox</h1>
        <div className="flex gap-2">
          <button
            onClick={loadMessages}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10"/>
              <polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
          </button>
          <button
            onClick={onCompose}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      {messages.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">📭</div>
          <h2 className="text-lg font-medium text-gray-900 mb-1">No messages</h2>
          <p className="text-gray-500">Messages you receive will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((message) => (
            <div key={message.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium text-gray-900">
                  {message.sender === 'Jumy' ? '🔒 Jumy' : message.sender}
                </span>
                <span className="text-xs text-gray-400">{formatTimeAgo(message.createdAt)}</span>
              </div>
              
              <p className="text-gray-600 whitespace-pre-wrap break-words mb-3">{message.content}</p>
              
              {message.hasAttachment && message.attachmentName && (
                <div className="attachment-preview mb-3">
                  <div className="attachment-icon">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{message.attachmentName}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(message.attachmentSize)}</p>
                  </div>
                  <button
                    onClick={() => handleDownload(message)}
                    disabled={downloadingId === message.id}
                    className="p-2 text-violet-600 hover:bg-violet-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {downloadingId === message.id ? (
                      <div className="w-5 h-5 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              )}
              
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex gap-2">
                  {message.sender !== 'Jumy' && message.sender !== 'Unknown' && (
                    <button
                      onClick={() => onReply(message.sender)}
                      className="flex items-center gap-1 text-sm text-violet-600 hover:text-violet-700"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 17 4 12 9 7"/>
                        <path d="M20 18v-2a4 4 0 0 0-4-4H4"/>
                      </svg>
                      Reply
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(message.id)}
                    className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                    Delete
                  </button>
                </div>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {formatExpiresIn(message.expiresAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
