import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Edit2, Plus, X } from 'lucide-react';
import TaskCard from './TaskCard';
import TaskModal from '../tasks/TaskModal';
import TaskDetailsSidebar from '../tasks/TaskDetailsSidebar';
import Modal from '../ui/Modal';
import Notification from '../ui/Notification';

import {
  createColumn,
  updateColumn,
  deleteColumn,
  updateColumnTaskOrders,
} from '../../services/taskService';
import useAuth from '../../contexts/AuthContext/useAuth';

const KanbanBoard = ({
  tasks = [],
  columns = [],
  onTaskComplete,
  onTaskDelete,
  onTaskUpdate,
  onColumnUpdate,
  onArchive
}) => {
  const [localColumns, setLocalColumns] = useState([]);
  const [editingTask, setEditingTask] = useState(null);
  const [editingColumn, setEditingColumn] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, column: null });
  const [notification, setNotification] = useState(null);
  const [showAddColumnModal, setShowAddColumnModal] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const { user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized) {
      console.log('Initializing columns with backend data...');
      try {
        if (!Array.isArray(tasks) || !Array.isArray(columns)) {
          console.warn('Tasks or columns not properly initialized');
          setLocalColumns([]);
          return;
        }

        const initializedColumns = columns.map((column) => ({
          ...column,
          tasks: tasks
            .filter((task) => task && task.status === column.id)
            .sort((a, b) => (a.order || 0) - (b.order || 0)) || [],
        }));

        setLocalColumns(initializedColumns);
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing columns:', error);
      }
    } else {
      console.log('Dynamically updating columns for new tasks...');
      setLocalColumns((prevColumns) =>
        prevColumns.map((col) => ({
          ...col,
          tasks: [
            ...col.tasks.filter((task) => task && tasks.some((t) => t.id === task.id)),
            ...tasks
              .filter((task) => task && task.status === col.id && !col.tasks.some((t) => t.id === task.id)),
          ].sort((a, b) => (a.order || 0) - (b.order || 0)),
        }))
      );
    }
  }, [tasks, columns, isInitialized]);

  const handleDragEnd = async (result) => {
    const { source, destination } = result;
    if (!destination) return;

    const sourceCol = localColumns.find(c => c.id === source.droppableId);
    const destCol = localColumns.find(c => c.id === destination.droppableId);
    if (!sourceCol || !destCol) return;

    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const movedTask = sourceCol.tasks[source.index];
    const newSourceTasks = Array.from(sourceCol.tasks);
    newSourceTasks.splice(source.index, 1);

    let newDestTasks;
    if (sourceCol.id === destCol.id) {
      newDestTasks = newSourceTasks;
    } else {
      newDestTasks = Array.from(destCol.tasks);
    }
    newDestTasks.splice(destination.index, 0, movedTask);

    const updatedSourceTasks = newSourceTasks.map((t, i) => ({ ...t, order: i * 1000 }));
    const updatedDestTasks = newDestTasks.map((t, i) => ({
      ...t,
      order: i * 1000,
      status: destCol.id
    }));

    const finalSourceTasks = sourceCol.id === destCol.id ? updatedDestTasks : updatedSourceTasks;
    const finalDestTasks = updatedDestTasks;

    setLocalColumns(localColumns.map((col) => {
      if (col.id === sourceCol.id) return { ...col, tasks: finalSourceTasks };
      if (col.id === destCol.id) return { ...col, tasks: finalDestTasks };
      return col;
    }));

    try {
      await Promise.all([
        updateColumnTaskOrders(sourceCol.id, finalSourceTasks),
        sourceCol.id !== destCol.id
          ? updateColumnTaskOrders(destCol.id, finalDestTasks)
          : Promise.resolve()
      ]);

      await onTaskUpdate(movedTask.id, {
        status: destCol.id,
        order: destination.index * 1000
      });
    } catch (error) {
      console.error("Drag-and-drop error:", error);
    }
  };

  const updateLocalTaskCompletion = (taskId, isComplete) => {
    setLocalColumns((prevColumns) =>
      prevColumns.map((col) => ({
        ...col,
        tasks: col.tasks.map((task) =>
          task.id === taskId ? { ...task, completed: isComplete } : task
        ),
      }))
    );
  };

  const handleColumnTitleEdit = async (columnId, newTitle) => {
    try {
      if (!newTitle?.trim()) {
        console.error('Title cannot be empty');
        return;
      }

      await updateColumn(user.uid, columnId, { title: newTitle });
      const updatedColumns = localColumns.map((col) =>
        col.id === columnId ? { ...col, title: newTitle } : col
      );
      setLocalColumns(updatedColumns);

      if (onColumnUpdate) {
        onColumnUpdate(columnId, { title: newTitle });
      }
      setEditingColumn(null);
    } catch (error) {
      console.error('Error updating column title:', error);
      setNotification({
        message: 'Error updating column title. Please try again.',
        type: 'error'
      });
    }
  };

  const handleAddColumn = async () => {
    try {
      if (!newColumnTitle.trim()) {
        return;
      }

      const newColumn = {
        title: newColumnTitle,
        tasks: [],
        order: localColumns.length,
      };
      const createdColumn = await createColumn(user.uid, newColumn);

      setLocalColumns((prev) => [...prev, { ...createdColumn, tasks: [] }]);

      if (onColumnUpdate) {
        onColumnUpdate(createdColumn.id, createdColumn);
      }

      setShowAddColumnModal(false);
      setNewColumnTitle('');
      setNotification({
        message: 'Column added successfully!',
        type: 'success'
      });
    } catch (error) {
      console.error('Error adding column:', error);
      setNotification({
        message: 'Error adding column. Please try again.',
        type: 'error'
      });
    }
  };

  const confirmDeleteColumn = (columnId) => {
    const column = localColumns.find((col) => col.id === columnId);
    setDeleteConfirm({ isOpen: true, column });
  };

  const handleDeleteColumn = async () => {
    if (!deleteConfirm.column) return;

    try {
      const columnToDelete = deleteConfirm.column;

      if (columnToDelete.tasks?.length > 0) {
        const firstColumn = localColumns[0];
        if (firstColumn && firstColumn.id !== columnToDelete.id) {
          await Promise.all(
            columnToDelete.tasks.map((task) =>
              onTaskUpdate(task.id, { status: firstColumn.id })
            )
          );
        }
      }

      await deleteColumn(user.uid, columnToDelete.id);
      setLocalColumns((prev) => prev.filter((col) => col.id !== columnToDelete.id));

      setNotification({
        message: 'Column deleted successfully',
        type: 'success'
      });
    } catch (error) {
      console.error('Error deleting column:', error);
      setNotification({
        message: 'Error deleting column. Please try again.',
        type: 'error'
      });
    } finally {
      setDeleteConfirm({ isOpen: false, column: null });
    }
  };

  const handleTaskEdit = (task) => {
    setEditingTask(task);
  };

  return (
    <div className="w-full bg-[var(--color-surface)]/50 rounded-xl p-6 flex flex-col flex-grow overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-[var(--color-text)]">Your Tasks</h2>
        <button
          onClick={() => setShowAddColumnModal(true)}
          className="btn btn-secondary flex items-center gap-2"
          disabled={localColumns.length >= 6}
        >
          <Plus className="w-4 h-4" />
          Add Column
        </button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-6 flex-grow overflow-auto">
          {localColumns.map((column, index) => (
            <div key={column.id} className="bg-[var(--color-surface)] rounded-lg p-4 flex flex-col min-h-[500px]">
              <div className="flex items-center justify-between mb-4">
                {editingColumn === column.id ? (
                  <input
                    type="text"
                    className="bg-[var(--color-background)] border border-[var(--color-secondary)] rounded px-2 py-1"
                    value={column.title || ''}
                    onChange={(e) =>
                      setLocalColumns((cols) =>
                        cols.map((col) =>
                          col.id === column.id ? { ...col, title: e.target.value } : col
                        )
                      )
                    }
                    onBlur={() =>
                      handleColumnTitleEdit(column.id, column.title || 'Untitled Column')
                    }
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleColumnTitleEdit(column.id, column.title || 'Untitled Column');
                      }
                    }}
                    autoFocus
                  />
                ) : (
                  <h3 className="font-medium text-lg text-[var(--color-text)]">{column.title}</h3>
                )}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingColumn(column.id)}
                    className="p-1 hover:bg-[var(--color-secondary)]/10 rounded"
                  >
                    <Edit2 className="w-4 h-4 text-[var(--color-secondary)]" />
                  </button>
                  {index > 0 && (
                    <button
                      onClick={() => confirmDeleteColumn(column.id)}
                      className="p-1 hover:bg-[var(--color-secondary)]/10 rounded"
                    >
                      <X className="w-4 h-4 text-[var(--color-error)]" />
                    </button>
                  )}
                </div>
              </div>
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 rounded-lg p-2 space-y-2 ${snapshot.isDraggingOver
                      ? 'bg-[var(--color-primary)]/10'
                      : 'bg-[var(--color-background)]'
                      }`}
                  >
                    {(column.tasks || []).map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`${snapshot.isDragging ? 'opacity-50' : ''}`}
                          >
                            <TaskCard
                              task={task}
                              onComplete={(taskId, isComplete) => {
                                onTaskComplete(taskId, isComplete);
                                updateLocalTaskCompletion(taskId, isComplete);
                              }}
                              onDelete={onTaskDelete}
                              onEdit={handleTaskEdit}
                              onSelect={setSelectedTask}
                              onArchive={onArchive}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* Add Column Modal */}
      <Modal
        isOpen={showAddColumnModal}
        onClose={() => {
          setShowAddColumnModal(false);
          setNewColumnTitle('');
        }}
        title="Add New Column"
      >
        <div className="p-6">
          <input
            type="text"
            value={newColumnTitle}
            onChange={(e) => setNewColumnTitle(e.target.value)}
            placeholder="Enter column title"
            className="w-full px-4 py-2 rounded-lg bg-[var(--color-surface)] 
                     border border-[var(--color-secondary)]/30 
                     text-[var(--color-text)] mb-4"
            autoFocus
          />
          <div className="flex justify-end gap-4">
            <button
              onClick={() => {
                setShowAddColumnModal(false);
                setNewColumnTitle('');
              }}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleAddColumn}
              disabled={!newColumnTitle.trim()}
              className="btn btn-primary"
            >
              Add Column
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, column: null })}
        title="Confirm Column Deletion"
      >
        <div className="p-6">
          <p className="text-[var(--color-text)] mb-4">
            Are you sure you want to delete the column &ldquo;{deleteConfirm.column?.title}&rdquo;?
            {deleteConfirm.column?.tasks?.length > 0 && (
              <span className="block mt-2 text-[var(--color-warning)]">
                Note: All tasks in this column will be moved to the first column.
              </span>
            )}
          </p>
          <div className="flex justify-end gap-4">
            <button
              onClick={() => setDeleteConfirm({ isOpen: false, column: null })}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button onClick={handleDeleteColumn} className="btn btn-primary">
              Delete Column
            </button>
          </div>
        </div>
      </Modal>

      {/* Task Edit Modal */}
      {editingTask && (
        <TaskModal
          isOpen={!!editingTask}
          onClose={() => setEditingTask(null)}
          onSubmit={(taskData) => {
            onTaskUpdate(editingTask.id, taskData);
            // Update local columns state
            setLocalColumns((prevCols) =>
              prevCols.map((col) => ({
                ...col,
                tasks: col.tasks.map((t) =>
                  t.id === editingTask.id ? { ...t, ...taskData } : t
                ),
              }))
            );
            setEditingTask(null);
          }}
          initialData={editingTask}
          mode="edit"
          columns={localColumns}
        />
      )}

      {/* Task Details Sidebar */}
      <TaskDetailsSidebar
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onTaskUpdate={(taskId, updates) => {
          onTaskUpdate(taskId, updates);
          setLocalColumns((prevCols) =>
            prevCols.map((col) => ({
              ...col,
              tasks: col.tasks.map((t) =>
                t.id === taskId ? { ...t, ...updates } : t
              ),
            }))
          );
        }}
      />

      {/* Notifications */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
          duration={3000}
        />
      )}
    </div>
  );
};

KanbanBoard.propTypes = {
  tasks: PropTypes.array.isRequired,
  columns: PropTypes.array.isRequired,
  onTaskComplete: PropTypes.func.isRequired,
  onTaskDelete: PropTypes.func.isRequired,
  onTaskUpdate: PropTypes.func.isRequired,
  onColumnUpdate: PropTypes.func.isRequired,
  onArchive: PropTypes.func.isRequired
};

export default KanbanBoard;