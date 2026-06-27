'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Plus, Users, Settings, ChevronLeft, GripVertical, Calendar, AlertCircle } from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAuth } from '../../../contexts/AuthContext';
import { projectsAPI, tasksAPI } from '../../../lib/api';
import { useTrackLens } from '../../../hooks/useTrackLens';
import TaskModal from './TaskModal';
import MembersPanel from './MembersPanel';

const COLUMNS = [
  { id: 'TODO', label: 'To Do', color: 'bg-gray-400' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-500' },
  { id: 'IN_REVIEW', label: 'In Review', color: 'bg-yellow-500' },
  { id: 'DONE', label: 'Done', color: 'bg-green-500' },
];

const PRIORITY_BADGE = {
  LOW: 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
  MEDIUM: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  HIGH: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
  URGENT: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
};

function TaskCard({ task, onClick, isDragging }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const labelColors = (task.labels || []).map((l) => l.label);
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
      onClick={onClick}
    >
      {/* Label dots */}
      {labelColors.length > 0 && (
        <div className="flex gap-1 mb-2">
          {labelColors.map((l) => (
            <span key={l.id} className="h-1.5 w-6 rounded-full" style={{ backgroundColor: l.color }} title={l.name} />
          ))}
        </div>
      )}

      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 p-0.5 text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>
        <p className="flex-1 text-sm font-medium text-gray-900 dark:text-white leading-snug">{task.title}</p>
      </div>

      <div className="flex items-center justify-between mt-2.5 ml-6">
        <div className="flex items-center gap-1.5">
          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${PRIORITY_BADGE[task.priority]}`}>
            {task.priority}
          </span>
          {(task._count?.comments > 0 || task._count?.attachments > 0) && (
            <span className="text-xs text-gray-400">
              {task._count?.comments > 0 && `${task._count.comments} 💬`}
              {task._count?.attachments > 0 && ` ${task._count.attachments} 📎`}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {task.dueDate && (
            <span className={`flex items-center gap-0.5 text-xs ${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
              {isOverdue && <AlertCircle className="w-3 h-3" />}
              <Calendar className="w-3 h-3" />
              {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
          {task.assignee && (
            <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase" title={`${task.assignee.firstName} ${task.assignee.lastName}`}>
              {task.assignee.firstName?.[0]}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AddTaskInput({ columnId, projectId, onAdd }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      const res = await tasksAPI.create(projectId, { title: title.trim(), status: columnId });
      onAdd(res.data.data, columnId);
      setTitle('');
      setOpen(false);
    } finally { setLoading(false); }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add task
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 mt-1">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
        placeholder="Task title..."
        className="w-full px-3 py-2 border border-indigo-400 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none"
      />
      <div className="flex gap-2">
        <button type="submit" disabled={loading || !title.trim()} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium disabled:opacity-50">
          {loading ? '...' : 'Add'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="px-3 py-1.5 text-gray-500 text-xs">Cancel</button>
      </div>
    </form>
  );
}

function KanbanColumn({ column, tasks, projectId, onAddTask, onTaskClick, activeId }) {
  const { id, label, color } = column;

  return (
    <div className="flex flex-col bg-gray-50 dark:bg-gray-900/50 rounded-xl min-w-[280px] flex-1 max-w-xs">
      {/* Column header */}
      <div className="flex items-center gap-2 px-3 py-3">
        <div className={`w-2 h-2 rounded-full ${color}`} />
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</h3>
        <span className="ml-auto text-xs font-medium text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{tasks.length}</span>
      </div>

      {/* Tasks */}
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 overflow-y-auto px-3 pb-2 space-y-2 min-h-[120px]" data-column={id}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isDragging={activeId === task.id}
              onClick={() => onTaskClick(task.id)}
            />
          ))}
        </div>
      </SortableContext>

      {/* Add task */}
      <div className="px-3 pb-3">
        <AddTaskInput columnId={id} projectId={projectId} onAdd={onAddTask} />
      </div>
    </div>
  );
}

export default function ProjectBoard() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { track, page } = useTrackLens();
  const projectId = params.id;

  const [project, setProject] = useState(null);
  const [columns, setColumns] = useState({ TODO: [], IN_PROGRESS: [], IN_REVIEW: [], DONE: [] });
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [activeTask, setActiveTask] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [showMembers, setShowMembers] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/auth/login');
  }, [authLoading, isAuthenticated, router]);

  const currentMember = project?.members?.find((m) => m.user.id === user?.id);
  const currentRole = currentMember?.role;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [projectRes, tasksRes, labelsRes] = await Promise.all([
        projectsAPI.getById(projectId),
        tasksAPI.list(projectId),
        tasksAPI.listLabels(projectId),
      ]);
      setProject(projectRes.data.data);
      setColumns(tasksRes.data.data.columns);
      setLabels(labelsRes.data.data);
      page('Project Board', { projectId, name: projectRes.data.data.name });
    } catch {
      router.push('/projects');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { if (isAuthenticated) fetchData(); }, [isAuthenticated, fetchData]);

  const findTaskColumn = (taskId) => {
    for (const [col, tasks] of Object.entries(columns)) {
      if (tasks.some((t) => t.id === taskId)) return col;
    }
    return null;
  };

  const handleDragStart = ({ active }) => {
    setActiveId(active.id);
    const col = findTaskColumn(active.id);
    if (col) setActiveTask(columns[col].find((t) => t.id === active.id));
  };

  const handleDragEnd = async ({ active, over }) => {
    setActiveId(null);
    setActiveTask(null);
    if (!over) return;

    const fromCol = findTaskColumn(active.id);
    // Determine target column
    let toCol = findTaskColumn(over.id);
    if (!toCol) {
      // over is a column container
      const colMatch = COLUMNS.find((c) => c.id === over.id);
      if (colMatch) toCol = colMatch.id;
    }
    if (!fromCol || !toCol) return;

    const task = columns[fromCol].find((t) => t.id === active.id);
    if (!task) return;

    // Optimistic update
    const overIndex = columns[toCol].findIndex((t) => t.id === over.id);
    const newPosition = overIndex >= 0 ? overIndex : columns[toCol].length;

    setColumns((prev) => {
      const next = { ...prev };
      next[fromCol] = prev[fromCol].filter((t) => t.id !== active.id);
      const insertion = [...prev[toCol]];
      if (fromCol === toCol) {
        insertion.splice(insertion.findIndex((t) => t.id === active.id), 1);
      }
      insertion.splice(newPosition, 0, { ...task, status: toCol });
      next[toCol] = insertion;
      return next;
    });

    try {
      await tasksAPI.reorder(projectId, { taskId: active.id, newStatus: toCol, newPosition });
      track('Task Moved', { taskId: active.id, from: fromCol, to: toCol });
    } catch {
      // Revert on error
      fetchData();
    }
  };

  const handleAddTask = (task, colId) => {
    setColumns((prev) => ({ ...prev, [colId]: [...prev[colId], task] }));
    track('Task Created', { projectId, taskId: task.id, status: colId });
  };

  const handleTaskUpdate = (updated) => {
    setColumns((prev) => {
      const next = { ...prev };
      for (const col of Object.keys(next)) {
        next[col] = next[col].filter((t) => t.id !== updated.id);
      }
      next[updated.status] = [...(next[updated.status] || []), updated];
      return next;
    });
  };

  const handleTaskDelete = (taskId) => {
    setColumns((prev) => {
      const next = { ...prev };
      for (const col of Object.keys(next)) {
        next[col] = next[col].filter((t) => t.id !== taskId);
      }
      return next;
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400 animate-pulse">Loading board...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 lg:px-8 py-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/projects" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project?.color }} />
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">{project?.name}</h1>
            {project?.status === 'ARCHIVED' && (
              <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 px-2 py-0.5 rounded-full">Archived</span>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setShowMembers(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">{project?.members?.length} member{project?.members?.length !== 1 ? 's' : ''}</span>
            </button>
          </div>
        </div>
        {project?.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 ml-9">{project.description}</p>
        )}
      </div>

      {/* Kanban board */}
      <div className="flex-1 overflow-x-auto px-4 sm:px-6 lg:px-8 py-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 min-h-full items-start">
            {COLUMNS.map((col) => (
              <KanbanColumn
                key={col.id}
                column={col}
                tasks={columns[col.id] || []}
                projectId={projectId}
                onAddTask={handleAddTask}
                onTaskClick={(taskId) => setSelectedTaskId(taskId)}
                activeId={activeId}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-indigo-400 shadow-xl p-3 opacity-90 cursor-grabbing">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{activeTask.title}</p>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Task detail modal */}
      {selectedTaskId && (
        <TaskModal
          projectId={projectId}
          taskId={selectedTaskId}
          members={project?.members || []}
          labels={labels}
          onClose={() => setSelectedTaskId(null)}
          onUpdate={handleTaskUpdate}
          onDelete={handleTaskDelete}
        />
      )}

      {/* Members panel */}
      {showMembers && (
        <MembersPanel
          projectId={projectId}
          members={project?.members || []}
          currentUserId={user?.id}
          currentRole={currentRole}
          onClose={() => setShowMembers(false)}
          onChange={() => { setShowMembers(false); fetchData(); }}
        />
      )}
    </div>
  );
}
