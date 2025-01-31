import { useState, useEffect, useCallback, useRef } from 'react';
import Modal from '../ui/Modal';
import PropTypes from 'prop-types';
import ProjectSelect from '../projects/ProjectSelect';
import RichTextEditor from '../tasks/RichTextEditor';
import { Pencil, Settings } from "lucide-react";

const defaultData = {
  name: '',
  description: '',
  deadline: '',
  difficulty: 'medium',
  priority: 'medium',
  status: '',
  projects: []
};

const inputClasses = `
  w-full rounded-lg px-3 py-2
  bg-[var(--color-surface)] 
  border border-[var(--color-secondary)]/40
  text-[var(--color-text)]
  focus:outline-none focus:border-[var(--color-primary)]
  focus:ring-1 focus:ring-[var(--color-primary)]
  transition-colors
`;

const XPDisplay = ({ xp }) => (
  <div className="flex items-center gap-2">
    <p className="text-sm text-[var(--color-text)]/60">Total XP:</p>
    <p className="text-lg font-bold text-[var(--color-primary)]">
      {xp} XP
    </p>
  </div>
);

XPDisplay.propTypes = {
  xp: PropTypes.number.isRequired
};

const TaskModal = ({ isOpen, onClose, onSubmit, initialData, mode = 'create', columns }) => {
  const [taskData, setTaskData] = useState(defaultData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const titleInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      const newData = initialData
        ? { ...defaultData, ...initialData }
        : defaultData;
      setTaskData(newData);

      // Focus the title input field
      if (titleInputRef.current) {
        titleInputRef.current.focus();
      }
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    if (isOpen && mode === 'create' && !taskData.status && columns.length > 0) {
      setTaskData((prev) => ({
        ...prev,
        status: columns[0].id
      }));
    }
  }, [isOpen, columns, taskData.status, mode]);

  const [calculatedXP, setCalculatedXP] = useState(0);

  const calculateXP = useCallback(() => {
    const baseXP = {
      easy: 50,
      medium: 100,
      hard: 150
    }[taskData.difficulty];

    const priorityMultiplier = {
      low: 1,
      medium: 1.2,
      high: 1.5
    }[taskData.priority];

    return Math.round(baseXP * priorityMultiplier);
  }, [taskData.difficulty, taskData.priority]);

  useEffect(() => {
    const newXP = calculateXP();
    setCalculatedXP(newXP);
    setTaskData(prev => ({
      ...prev,
      xp: newXP
    }));
  }, [calculateXP, taskData.difficulty, taskData.priority]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (!taskData.status) {
        alert('Please select a valid column for the task.');
        return;
      }

      const finalTaskData = {
        ...taskData,
        xp: calculatedXP,
        completed: mode === 'edit' ? taskData.completed : false
      };

      await onSubmit(finalTaskData);
      onClose();
    } catch (error) {
      console.error('Error creating/updating task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTaskData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const setQuickDeadline = (days) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + days);
    setTaskData((prev) => ({
      ...prev,
      deadline: date.toISOString().split('T')[0]
    }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Create New Task' : 'Edit Task'}
      rightContent={<XPDisplay xp={calculatedXP} />}
    >
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        {/* Main Content */}
        <div className="px-6 py-4 space-y-6">
          {/* Task Details Section */}
          <div>
            <h3 className="flex items-center gap-2 text-lg font-medium text-[var(--color-text)] mb-3">
              <Pencil className="w-5 h-5 text-[var(--color-primary)]" />
              Task Details
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                  Task Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={taskData.name}
                  onChange={handleChange}
                  className={inputClasses}
                  placeholder="Enter task name"
                  required
                  ref={titleInputRef}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                  Description
                </label>
                <RichTextEditor
                  value={taskData.description || ''}
                  onChange={(html) =>
                    setTaskData((prev) => ({
                      ...prev,
                      description: html
                    }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                  Deadline
                </label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setQuickDeadline(1)}
                      className="btn btn-secondary"
                    >
                      Tomorrow
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickDeadline(2)}
                      className="btn btn-secondary"
                    >
                      Day After
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickDeadline(7)}
                      className="btn btn-secondary"
                    >
                      Next Week
                    </button>
                  </div>
                  <input
                    type="date"
                    name="deadline"
                    value={taskData.deadline}
                    onChange={handleChange}
                    className={inputClasses}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Task Settings Section */}
          <div>
            <h3 className="flex items-center gap-2 text-lg font-medium text-[var(--color-text)] mb-3">
              <Settings className="w-5 h-5 text-[var(--color-primary)]" />
              Task Settings
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                  Difficulty
                </label>
                <select
                  name="difficulty"
                  value={taskData.difficulty}
                  onChange={handleChange}
                  className={inputClasses}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                  Priority
                </label>
                <select
                  name="priority"
                  value={taskData.priority}
                  onChange={handleChange}
                  className={inputClasses}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={taskData.status}
                  onChange={handleChange}
                  className={inputClasses}
                  required
                >
                  <option value="">Select a Status</option>
                  {columns.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                  Projects
                </label>
                <ProjectSelect
                  value={taskData.projects}
                  onChange={(projects) =>
                    setTaskData((prev) => ({
                      ...prev,
                      projects
                    }))
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto px-6 py-4 border-t border-[var(--color-secondary)]/40">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Submitting...'
                : mode === 'create'
                  ? 'Create Task'
                  : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

TaskModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  initialData: PropTypes.shape({
    name: PropTypes.string,
    description: PropTypes.string,
    deadline: PropTypes.string,
    difficulty: PropTypes.string,
    priority: PropTypes.string,
    status: PropTypes.string,
    completed: PropTypes.bool,
    projects: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired
      })
    )
  }),
  mode: PropTypes.oneOf(['create', 'edit']),
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired
    })
  ).isRequired
};

export default TaskModal;