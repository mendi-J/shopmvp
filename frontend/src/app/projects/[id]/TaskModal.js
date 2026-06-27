'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Paperclip, MessageSquare, Tag, Calendar, User, Trash2, Edit3, Check, AlertCircle } from 'lucide-react';
import { tasksAPI } from '../../../lib/api';
import { useAuth } from '../../../contexts/AuthContext';
import { useTrackLens } from '../../../hooks/useTrackLens';

// Attachment URLs are full Cloudinary https:// URLs — no prefix needed

const PRIORITY_COLORS = {
  LOW: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
  MEDIUM: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  HIGH: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
  URGENT: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
};

const STATUS_OPTIONS = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function TaskModal({ projectId, taskId, members, labels, onClose, onUpdate, onDelete }) {
  const { user } = useAuth();
  const { track } = useTrackLens();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editTitle, setEditTitle] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [editDesc, setEditDesc] = useState(false);
  const [commentBody, setCommentBody] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [attachmentLoading, setAttachmentLoading] = useState(false);
  const fileInputRef = useRef();

  const fetchTask = async () => {
    try {
      const res = await tasksAPI.getById(projectId, taskId);
      const t = res.data.data;
      setTask(t);
      setTitle(t.title);
      setDescription(t.description || '');
    } catch { onClose(); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTask(); }, [taskId]);

  const patch = async (data) => {
    const res = await tasksAPI.update(projectId, taskId, data);
    const updated = res.data.data;
    setTask((prev) => ({ ...prev, ...updated }));
    onUpdate(updated);
  };

  const handleTitleSave = async () => {
    if (!title.trim() || title.trim() === task.title) { setEditTitle(false); return; }
    await patch({ title });
    setEditTitle(false);
  };

  const handleDescSave = async () => {
    if (description === (task.description || '')) { setEditDesc(false); return; }
    await patch({ description });
    setEditDesc(false);
  };

  const handleStatusChange = (e) => {
    patch({ status: e.target.value });
    track('Task Moved', { taskId, from: task.status, to: e.target.value });
  };

  const handlePriorityChange = (e) => patch({ priority: e.target.value });

  const handleAssigneeChange = (e) => patch({ assigneeId: e.target.value || null });

  const handleDueDateChange = (e) => patch({ dueDate: e.target.value || null });

  const toggleLabel = async (labelId) => {
    const current = (task.labels || []).map((l) => l.label.id);
    const updated = current.includes(labelId) ? current.filter((id) => id !== labelId) : [...current, labelId];
    await patch({ labelIds: updated });
    track('Label Applied', { taskId, labelId });
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentBody.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await tasksAPI.addComment(projectId, taskId, commentBody);
      setTask((prev) => ({ ...prev, comments: [...(prev.comments || []), res.data.data] }));
      setCommentBody('');
      track('Task Commented', { taskId });
    } finally { setSubmittingComment(false); }
  };

  const handleDeleteComment = async (commentId) => {
    await tasksAPI.deleteComment(projectId, taskId, commentId);
    setTask((prev) => ({ ...prev, comments: prev.comments.filter((c) => c.id !== commentId) }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachmentLoading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await tasksAPI.addAttachment(projectId, taskId, fd);
      setTask((prev) => ({ ...prev, attachments: [res.data.data, ...(prev.attachments || [])] }));
      track('Attachment Uploaded', { taskId, filename: file.name });
    } finally { setAttachmentLoading(false); e.target.value = ''; }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    await tasksAPI.deleteAttachment(projectId, taskId, attachmentId);
    setTask((prev) => ({ ...prev, attachments: prev.attachments.filter((a) => a.id !== attachmentId) }));
  };

  const handleDelete = async () => {
    if (!confirm('Delete this task? This cannot be undone.')) return;
    await tasksAPI.delete(projectId, taskId);
    track('Task Deleted', { taskId });
    onDelete(taskId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          {loading ? (
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
          ) : editTitle ? (
            <div className="flex items-center gap-2 flex-1 mr-4">
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
                className="flex-1 px-2 py-1 border border-indigo-400 rounded text-lg font-semibold bg-transparent dark:text-white focus:outline-none"
              />
              <button onClick={handleTitleSave} className="p-1 text-green-600"><Check className="w-4 h-4" /></button>
            </div>
          ) : (
            <h2
              className="text-lg font-semibold text-gray-900 dark:text-white flex-1 mr-4 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              onClick={() => setEditTitle(true)}
            >
              {task?.title}
              <Edit3 className="w-3.5 h-3.5 inline ml-1.5 opacity-40" />
            </h2>
          )}
          <div className="flex items-center gap-1">
            <button onClick={handleDelete} className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 p-6 animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="flex flex-col md:flex-row gap-0 md:gap-6 p-6">
              {/* Main content */}
              <div className="flex-1 min-w-0 space-y-6">
                {/* Description */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Description</h3>
                  {editDesc ? (
                    <div>
                      <textarea
                        autoFocus
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                      />
                      <div className="flex gap-2 mt-2">
                        <button onClick={handleDescSave} className="px-3 py-1 bg-indigo-600 text-white text-xs rounded-lg">Save</button>
                        <button onClick={() => { setDescription(task.description || ''); setEditDesc(false); }} className="px-3 py-1 text-gray-500 text-xs">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <p
                      onClick={() => setEditDesc(true)}
                      className="text-sm text-gray-600 dark:text-gray-300 cursor-pointer min-h-[40px] p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      {task.description || <span className="text-gray-400 dark:text-gray-500 italic">Click to add description...</span>}
                    </p>
                  )}
                </div>

                {/* Labels */}
                {labels?.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Labels</h3>
                    <div className="flex flex-wrap gap-2">
                      {labels.map((label) => {
                        const active = (task.labels || []).some((l) => l.label.id === label.id);
                        return (
                          <button
                            key={label.id}
                            onClick={() => toggleLabel(label.id)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border-2 transition-all ${active ? 'opacity-100' : 'opacity-40'}`}
                            style={{ borderColor: label.color, color: label.color, backgroundColor: active ? `${label.color}20` : 'transparent' }}
                          >
                            <Tag className="w-3 h-3" />
                            {label.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Comments */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    Comments ({task.comments?.length ?? 0})
                  </h3>
                  <div className="space-y-3 mb-3">
                    {(task.comments || []).map((c) => (
                      <div key={c.id} className="flex gap-3">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                          {c.author?.firstName?.[0]}{c.author?.lastName?.[0]}
                        </div>
                        <div className="flex-1 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{c.author?.firstName} {c.author?.lastName}</span>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-400">{formatDate(c.createdAt)}</span>
                              {c.author?.id === user?.id && (
                                <button onClick={() => handleDeleteComment(c.id)} className="p-1 text-gray-300 hover:text-red-500 transition-colors">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{c.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handleAddComment} className="flex gap-2">
                    <input
                      value={commentBody}
                      onChange={(e) => setCommentBody(e.target.value)}
                      placeholder="Write a comment..."
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button type="submit" disabled={submittingComment || !commentBody.trim()} className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-indigo-700 transition-colors">
                      Send
                    </button>
                  </form>
                </div>

                {/* Attachments */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5" />
                    Attachments ({task.attachments?.length ?? 0})
                  </h3>
                  <div className="space-y-2 mb-3">
                    {(task.attachments || []).map((a) => (
                      <div key={a.id} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <Paperclip className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline truncate block">
                            {a.filename}
                          </a>
                          <span className="text-xs text-gray-400">{formatBytes(a.size)}</span>
                        </div>
                        {a.uploader?.id === user?.id && (
                          <button onClick={() => handleDeleteAttachment(a.id)} className="p-1 text-gray-300 hover:text-red-500 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={attachmentLoading}
                    className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors disabled:opacity-50"
                  >
                    <Paperclip className="w-4 h-4" />
                    {attachmentLoading ? 'Uploading...' : 'Attach file'}
                  </button>
                </div>
              </div>

              {/* Sidebar */}
              <div className="md:w-48 flex-shrink-0 space-y-4 mt-6 md:mt-0">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Status</label>
                  <select
                    value={task.status}
                    onChange={handleStatusChange}
                    className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Priority</label>
                  <select
                    value={task.priority}
                    onChange={handlePriorityChange}
                    className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Assignee</label>
                  <select
                    value={task.assignee?.id || ''}
                    onChange={handleAssigneeChange}
                    className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Unassigned</option>
                    {members.map((m) => (
                      <option key={m.user.id} value={m.user.id}>
                        {m.user.firstName} {m.user.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Due Date</label>
                  <input
                    type="date"
                    value={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}
                    onChange={handleDueDateChange}
                    className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Reporter</label>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{task.reporter?.firstName} {task.reporter?.lastName}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
