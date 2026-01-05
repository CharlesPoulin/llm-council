import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import AgentMessage from './AgentMessage';
import Stage3 from './Stage3';
import ModelProgress from './ModelProgress';
import { downloadConversationReport, downloadConversationHTML } from '../utils/exportConversation';
import './ChatInterface.css';

export default function ChatInterface({
  conversation,
  onSendMessage,
  isLoading,
}) {
  const [input, setInput] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input, selectedFiles);
      setInput('');
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleKeyDown = (e) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleExport = (format) => {
    if (!conversation) return;

    if (format === 'html') {
      downloadConversationHTML(conversation);
    } else {
      downloadConversationReport(conversation, format);
    }
  };

  if (!conversation) {
    return (
      <div className="chat-interface">
        <div className="empty-state">
          <h2>Welcome to LLM Council</h2>
          <p>Create a new conversation to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-interface">
      {conversation.messages.length > 0 && (
        <div className="chat-header">
          <h2 className="conversation-title">{conversation.title}</h2>
          <div className="export-dropdown">
            <button className="export-button" title="Export conversation">
              📥 Export
            </button>
            <div className="export-menu">
              <button onClick={() => handleExport('md')}>Markdown (.md)</button>
              <button onClick={() => handleExport('html')}>HTML (.html)</button>
            </div>
          </div>
        </div>
      )}
      <div className="messages-container">
        {conversation.messages.length === 0 ? (
          <div className="empty-state">
            <h2>Start a conversation</h2>
            <p>Ask a question to consult the LLM Council</p>
          </div>
        ) : (
          conversation.messages.map((msg, index) => (
            <div key={index} className="message-group">
              {msg.role === 'user' ? (
                <div className="user-message">
                  <div className="message-label">You</div>
                  <div className="message-content">
                    <div className="markdown-content">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="assistant-message">
                  {/* Model Progress Tracker */}
                  {msg.modelProgress && <ModelProgress modelProgress={msg.modelProgress} />}

                  {/* Agent Messages - Group Chat Style */}
                  {msg.loading?.stage1 && (
                    <div className="stage-loading">
                      <div className="spinner"></div>
                      <span>Débat en cours: Les agents argumentent...</span>
                    </div>
                  )}

                  {msg.stage1 && msg.stage1.map((turn, idx) => (
                    <AgentMessage
                      key={idx}
                      roleName={turn.role_name}
                      model={turn.model}
                      message={turn.message}
                      roundNumber={turn.round}
                    />
                  ))}

                  {/* Juge Synthesis */}
                  {msg.loading?.stage3 && (
                    <div className="stage-loading">
                      <div className="spinner"></div>
                      <span>Le Juge synthétise le débat...</span>
                    </div>
                  )}
                  {msg.stage3 && <Stage3 finalResponse={msg.stage3} />}
                </div>
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <span>Consulting the council...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form className="input-form" onSubmit={handleSubmit}>
        {selectedFiles.length > 0 && (
          <div className="selected-files">
            {selectedFiles.map((file, index) => (
              <div key={index} className="file-chip">
                <span className="file-name">{file.name}</span>
                <button
                  type="button"
                  className="file-remove"
                  onClick={() => handleRemoveFile(index)}
                  aria-label="Remove file"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="input-row">
          <textarea
            className="message-input"
            placeholder="Ask your question... (Shift+Enter for new line, Enter to send)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            rows={3}
          />
          <div className="input-actions">
            <label className="file-upload-button" title="Attach documents">
              📎
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt,.csv,.json,.xlsx,.xls"
                onChange={handleFileSelect}
                disabled={isLoading}
                style={{ display: 'none' }}
              />
            </label>
            <button
              type="submit"
              className="send-button"
              disabled={!input.trim() || isLoading}
            >
              Send
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
