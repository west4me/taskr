import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  Flag,
  BarChart2,
  MessageSquare,
  FileText,
} from 'lucide-react';
import PropTypes from 'prop-types';
import { useEffect, useRef, useState } from 'react';
import DOMPurify from 'dompurify';
import {
  addTaskComment,
  getTaskComments,
  updateTaskComment,
  updateTask,
  deleteTaskComment,
} from '../../services/taskService';
import useAuth from '../../contexts/AuthContext/useAuth';
import RichTextEditor from '../tasks/RichTextEditor';
import TaskComment from './TaskComment';

const TaskDetailsSidebar = ({ task, isOpen, onClose, onTaskUpdate }) => {
  const sidebarRef = useRef();
  const { user } = useAuth();

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [editorKey, setEditorKey] = useState(0);
  const [editableTask, setEditableTask] = useState(null);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [tempDescription, setTempDescription] = useState('');
  const [displayedXP, setDisplayedXP] = useState(0);

  useEffect(() => {
    if (task) {
      setEditableTask({ ...task });
      setIsEditingDescription(false);
      setTempDescription(task.description || '');
    }
  }, [task]);

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        onClose();
      }
    };
    const handleEscapeKey = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    const loadComments = async () => {
      if (task?.id) {
        try {
          const fetched = await getTaskComments(task.id);
          setComments(fetched);
        } catch (error) {
          console.error('Error loading comments:', error);
        }
      }
    };
    loadComments();
  }, [task?.id]);

  useEffect(() => {
    if (editableTask) {
      const initialXP = calculateXP(editableTask.difficulty, editableTask.priority);
      setDisplayedXP(initialXP);
    }
  }, [editableTask]);

  const saveField = async (updates) => {
    if (!editableTask || !editableTask.id) return;
    try {
      const updatedDoc = await updateTask(editableTask.id, updates);
      setEditableTask((prev) => ({
        ...prev,
        ...updatedDoc,
      }));
      if (typeof onTaskUpdate === 'function') {
        onTaskUpdate(updatedDoc.id, updates);
      }
    } catch (err) {
      console.error('Error saving fields:', err);
    }
  };

  const handleTitleBlur = () => {
    if (!editableTask) return;
    saveField({ name: editableTask.name });
  };

  const handleDifficultyChange = async (newValue) => {
    const newXP = calculateXP(newValue, editableTask.priority);
    const updates = {
      difficulty: newValue,
      xp: newXP,
    };
    setEditableTask((prev) => ({
      ...prev,
      ...updates,
    }));
    setDisplayedXP(newXP);
    await saveField(updates);
  };

  const handlePriorityChange = async (newValue) => {
    const newXP = calculateXP(editableTask.difficulty, newValue);
    const updates = {
      priority: newValue,
      xp: newXP,
    };
    setEditableTask((prev) => ({
      ...prev,
      ...updates,
    }));
    setDisplayedXP(newXP);
    await saveField(updates);
  };

  const handleDeadlineChange = (newValue) => {
    setEditableTask((prev) => ({
      ...prev,
      deadline: newValue,
    }));
    saveField({ deadline: newValue });
  };

  const startEditingDescription = () => {
    setIsEditingDescription(true);
    setTempDescription(editableTask.description || '');
  };

  const handleSaveDescription = async () => {
    if (!editableTask) return;
    if (tempDescription !== task.description) {
      try {
        const updates = { description: tempDescription };
        const updatedDoc = await updateTask(editableTask.id, updates);
        setEditableTask(updatedDoc);
        if (typeof onTaskUpdate === 'function') {
          onTaskUpdate(updatedDoc.id, { ...updatedDoc });  // Pass full updated task
        }
      } catch (error) {
        console.error('Error saving description:', error);
      }
    }
    setIsEditingDescription(false);
  };

  const handleCancelDescription = () => {
    setTempDescription(editableTask.description || '');
    setIsEditingDescription(false);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const comment = await addTaskComment(task.id, user.uid, newComment);
      setComments((prev) => [comment, ...prev]);
      setNewComment('');
      setEditorKey((prev) => prev + 1);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleUpdateComment = async (commentId, content) => {
    try {
      await updateTaskComment(task.id, commentId, content);
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, content } : c))
      );
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteTaskComment(task.id, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  if (!task || !editableTask) return null;

  const calculateXP = (difficulty, priority) => {
    const baseXP = {
      easy: 50,
      medium: 100,
      hard: 150,
    }[difficulty];

    const priorityMultiplier = {
      low: 1,
      medium: 1.2,
      high: 1.5,
    }[priority];

    return Math.round(baseXP * priorityMultiplier);
  };

  const sanitizedDescription = DOMPurify.sanitize(editableTask.description || '');

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onClose}
          />
          <motion.div
            ref={sidebarRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-[var(--color-surface)] 
                       border-l border-[var(--color-secondary)]/40 shadow-xl z-50"
          >
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-start p-6 border-b border-[var(--color-secondary)]/40">
                <div>
                  <input
                    type="text"
                    className="text-xl font-semibold text-[var(--color-text)] 
                               bg-transparent border-b border-transparent 
                               focus:border-[var(--color-accent)] focus:outline-none 
                               transition-colors"
                    value={editableTask.name}
                    onChange={(e) =>
                      setEditableTask((p) => ({ ...p, name: e.target.value }))
                    }
                    onBlur={handleTitleBlur}
                  />
                  {task.projects?.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {task.projects.map((project) => (
                        <span
                          key={project.id}
                          className="px-2 py-1 text-xs rounded-full bg-[var(--color-primary)]/20 
                                     text-[var(--color-primary)]"
                        >
                          {project.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg transition-colors hover:bg-[var(--color-secondary)]/10"
                >
                  <X className="w-5 h-5 text-[var(--color-text)]/70" />
                </button>
              </div>
              <div className="sidebar-container flex-1 overflow-y-auto p-6 space-y-6">
                <div
                  className="p-6 mb-2 rounded-lg text-[var(--color-xp-text)] shadow-lg"
                  style={{
                    background: `linear-gradient(to right, 
                      var(--color-xp-gradient-start), 
                      var(--color-xp-gradient-end)
                    )`,
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-sm uppercase font-semibold tracking-wide opacity-90">
                        Total XP
                      </h3>
                      <p className="text-3xl font-bold mt-1">{displayedXP} XP</p>
                    </div>
                    <div className="flex flex-col items-end space-y-3">
                      <div className="flex items-center gap-2">
                        <BarChart2 className="w-5 h-5 text-[var(--color-xp-icon)]" />
                        <select
                          className="bg-[var(--color-xp-select-bg)] text-[var(--color-xp-select-text)] 
                   font-medium rounded px-2 py-1 appearance-none cursor-pointer min-w-[90px]
                   hover:bg-[var(--color-xp-select-bg)]/80 transition-colors focus:outline-none
                   [&>option]:text-[var(--color-select-option-text)] 
                   [&>option]:bg-[var(--color-select-option-bg)]"
                          value={editableTask.difficulty}
                          onChange={(e) => handleDifficultyChange(e.target.value)}
                        >
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <Flag className="w-5 h-5 text-[var(--color-xp-icon)]" />
                        <select
                          className="bg-[var(--color-xp-select-bg)] text-[var(--color-xp-select-text)]
                   font-medium rounded px-2 py-1 appearance-none cursor-pointer capitalize min-w-[90px]
                   hover:bg-[var(--color-xp-select-bg)]/80 transition-colors focus:outline-none
                   [&>option]:text-[var(--color-select-option-text)] 
                   [&>option]:bg-[var(--color-select-option-bg)]"
                          value={editableTask.priority}
                          onChange={(e) => handlePriorityChange(e.target.value)}
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-[var(--color-xp-icon)]" />
                        <input
                          type="date"
                          className="bg-[var(--color-xp-select-bg)] text-[var(--color-xp-select-text)]
                   font-medium rounded px-2 py-1 appearance-none cursor-pointer
                   hover:bg-[var(--color-xp-select-bg)]/80 transition-colors"
                          value={editableTask.deadline || ''}
                          onChange={(e) => handleDeadlineChange(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-[var(--color-primary)] mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Description
                  </h3>
                  {isEditingDescription ? (
                    <div className="space-y-2">
                      <RichTextEditor
                        value={tempDescription}
                        onChange={setTempDescription}
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={handleCancelDescription}
                          className="btn btn-secondary"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveDescription}
                          className="btn btn-primary"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="prose prose-sm max-w-none text-[var(--color-text)] 
                                 cursor-pointer border border-transparent p-2 rounded 
                                 hover:border-[var(--color-accent)]/40"
                      onClick={startEditingDescription}
                      dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
                    />
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-[var(--color-primary)] mb-4 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Comments
                  </h3>
                  <form onSubmit={handleAddComment} className="mb-4">
                    <div className="space-y-2">
                      <RichTextEditor
                        key={editorKey}
                        value={newComment}
                        onChange={setNewComment}
                      />
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={!newComment.trim()}
                          className="btn btn-primary"
                        >
                          Add Comment
                        </button>
                      </div>
                    </div>
                  </form>
                  <div className="comments-container space-y-2">
                    {comments.map((comment) => (
                      <TaskComment
                        key={comment.id}
                        comment={comment}
                        onUpdate={handleUpdateComment}
                        onDelete={handleDeleteComment}
                      />
                    ))}
                    {comments.length === 0 && (
                      <p className="text-sm text-[var(--color-secondary)] text-center py-4">
                        No comments yet
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

TaskDetailsSidebar.propTypes = {
  task: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    deadline: PropTypes.string,
    difficulty: PropTypes.string.isRequired,
    priority: PropTypes.string.isRequired,
    completed: PropTypes.bool.isRequired,
    xp: PropTypes.number.isRequired,
    createdAt: PropTypes.string.isRequired,
    projects: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
      })
    ),
  }),
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onTaskUpdate: PropTypes.func,
};

export default TaskDetailsSidebar;
