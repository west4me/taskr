import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachWeekOfInterval,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  startOfDay
} from 'date-fns';
import { ChevronLeft, ChevronRight, MoreVertical, Calendar, CalendarDays, CalendarRange } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TaskDetailsSidebar from './TaskDetailsSidebar';
import TaskModal from './TaskModal';
import MenuDropdown from '../shared/MenuDropdown';

const ViewModeButton = ({ mode, icon: Icon, label, currentMode, onClick }) => (
  <button
    onClick={() => onClick(mode)}
    className={`
      p-2 rounded-lg transition-colors flex items-center gap-2
      ${currentMode === mode
        ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
        : 'hover:bg-[var(--color-secondary)]/10 text-[var(--color-text)]'
      }
    `}
  >
    <Icon className="w-4 h-4" />
    <span className="hidden sm:inline">{label}</span>
  </button>
);

ViewModeButton.propTypes = {
  mode: PropTypes.oneOf(['day', 'week', 'month']).isRequired,
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  currentMode: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired
};

const CalendarView = ({ tasks, onTaskUpdate, onDelete, onTaskComplete, onArchive, columns }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [showTaskMenu, setShowTaskMenu] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  // Initialize screen size and view mode based on window width
  const [screenSize, setScreenSize] = useState(() => {
    const width = window.innerWidth;
    return {
      isMobile: width < 768,
      isTablet: width >= 768 && width < 1024,
      isDesktop: width >= 1024
    };
  });

  const [viewMode, setViewMode] = useState(() => {
    const width = window.innerWidth;
    if (width < 768) return 'day';
    if (width < 1024) return 'week';
    return 'month';
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const newScreenSize = {
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024
      };

      setScreenSize(newScreenSize);

      // Force day view on mobile, otherwise maintain current view if appropriate
      if (newScreenSize.isMobile) {
        setViewMode('day');
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const moveNext = () => {
    switch (viewMode) {
      case 'day':
        setCurrentDate(addDays(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(addWeeks(currentDate, 1));
        break;
      case 'month':
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
        break;
      default:
        break;
    }
  };

  const movePrev = () => {
    switch (viewMode) {
      case 'day':
        setCurrentDate(subDays(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(subWeeks(currentDate, 1));
        break;
      case 'month':
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
        break;
      default:
        break;
    }
  };

  const getDateRangeText = () => {
    switch (viewMode) {
      case 'day':
        return format(currentDate, 'MMMM d, yyyy');
      case 'week': {
        const weekStart = startOfWeek(currentDate);
        const weekEnd = endOfWeek(currentDate);
        return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
      }
      case 'month':
        return format(currentDate, 'MMMM yyyy');
      default:
        return '';
    }
  };

  const getDaysToShow = () => {
    switch (viewMode) {
      case 'day':
        return [startOfDay(currentDate)];
      case 'week':
        return eachDayOfInterval({
          start: startOfWeek(currentDate),
          end: endOfWeek(currentDate)
        });
      case 'month': {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        const weeks = eachWeekOfInterval(
          { start: monthStart, end: monthEnd },
          { weekStartsOn: 0 }
        );
        return weeks.flatMap(week =>
          eachDayOfInterval({
            start: startOfWeek(week),
            end: endOfWeek(week)
          })
        );
      }
      default:
        return [];
    }
  };

  const handleTaskClick = (task, e) => {
    if (e) e.stopPropagation();
    setSelectedTask(task);
    setShowTaskMenu(null);
  };

  const handleEditTask = (task, e) => {
    if (e) e.stopPropagation();
    setEditingTask(task);
    setShowTaskMenu(null);
  };

  const handleTaskUpdate = (taskId, updates) => {
    setSelectedTask(prev => prev?.id === taskId ? { ...prev, ...updates } : prev);
    setEditingTask(null);
    setShowTaskMenu(null);
    onTaskUpdate(taskId, updates);
  };

  return (
    <div className="w-full bg-[var(--color-surface)]/50 rounded-xl p-6 flex flex-col flex-grow">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h2 className="text-xl font-semibold text-[var(--color-text)]">
          Calendar View
        </h2>

        {!screenSize.isMobile && (
          <div className="flex items-center gap-2">
            <ViewModeButton
              mode="day"
              icon={Calendar}
              label="Day"
              currentMode={viewMode}
              onClick={setViewMode}
            />
            <ViewModeButton
              mode="week"
              icon={CalendarDays}
              label="Week"
              currentMode={viewMode}
              onClick={setViewMode}
            />
            <ViewModeButton
              mode="month"
              icon={CalendarRange}
              label="Month"
              currentMode={viewMode}
              onClick={setViewMode}
            />
          </div>
        )}

        <div className="flex items-center gap-4">
          <button
            onClick={movePrev}
            className="p-2 rounded-lg transition-colors hover:bg-[var(--color-secondary)]/10"
          >
            <ChevronLeft className="w-5 h-5 text-[var(--color-text)]" />
          </button>
          <span className="text-lg font-medium min-w-[140px] text-center text-[var(--color-text)]">
            {getDateRangeText()}
          </span>
          <button
            onClick={moveNext}
            className="p-2 rounded-lg transition-colors hover:bg-[var(--color-secondary)]/10"
          >
            <ChevronRight className="w-5 h-5 text-[var(--color-text)]" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="grid grid-cols-7 gap-2 mb-2">
          {viewMode !== 'day' && ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="text-center text-sm font-medium py-2 text-[var(--color-text)]/80"
            >
              {day}
            </div>
          ))}
        </div>

        <div className={`grid ${viewMode === 'day' ? 'grid-cols-1' : 'grid-cols-7'} gap-2 flex-1`}>
          <AnimatePresence>
            {getDaysToShow().map((day) => {
              const dayTasks = tasks.filter((task) => {
                if (!task.deadline) return false;
                const taskDate = new Date(task.deadline + 'T00:00:00');
                return isSameDay(taskDate, day);
              });

              const inCurrentMonth = isSameMonth(day, currentDate);
              const isCurrentDay = isToday(day);

              return (
                <motion.div
                  key={day.toISOString()}
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`
                    relative p-3 rounded-lg border
                    ${inCurrentMonth || viewMode !== 'month'
                      ? 'border-[var(--color-day-border)] bg-[var(--color-surface)]'
                      : 'border-[var(--color-muted)] bg-[var(--color-muted)]/40 text-[var(--color-muted-text)]'
                    }
                    ${isCurrentDay
                      ? 'ring-2 ring-[var(--color-primary)] ring-offset-2 ring-offset-[var(--color-background)]'
                      : ''
                    }
                    ${viewMode === 'day' ? 'min-h-[400px]' : 'min-h-[120px]'}
                    hover:shadow-md transition-shadow
                  `}
                >
                  <div
                    className={`text-sm font-medium mb-2 ${inCurrentMonth || viewMode !== 'month'
                      ? 'text-[var(--color-text)]'
                      : 'text-[var(--color-muted-text)]'
                      } ${isCurrentDay ? 'text-[var(--color-primary)]' : ''}`}
                  >
                    {format(day, viewMode === 'day' ? 'MMMM d, yyyy' : 'd')}
                  </div>

                  <motion.div
                    layout
                    className="space-y-1 overflow-y-auto max-h-[calc(100%-28px)]"
                  >
                    {dayTasks.map((task) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`
                          relative group text-xs p-2 rounded 
                          ${task.completed
                            ? 'bg-[var(--color-task-completed)] text-[var(--color-text)]/80 line-through'
                            : 'bg-[var(--color-task-incomplete)] text-[var(--color-text)]'
                          }
                          border-l-4 border-[var(--color-primary)] cursor-pointer transition-colors
                          hover:shadow-md
                        `}
                        onClick={(e) => handleTaskClick(task, e)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col gap-1">
                            <span className={`font-medium ${task.completed ? 'line-through' : ''}`}>
                              {task.name}
                            </span>
                            <div className="text-xs">
                              <span className="opacity-80">XP:</span> {task.xp}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const rect = e.currentTarget.getBoundingClientRect();
                              setMenuPosition({ x: rect.right, y: rect.top });
                              setShowTaskMenu(task.id);
                            }}
                            className="
                              p-1 rounded 
                              text-[var(--color-secondary)]
                              hover:bg-[var(--color-secondary)]/20
                              opacity-0 group-hover:opacity-100
                              transition-opacity
                            "
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      <TaskDetailsSidebar
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onTaskUpdate={handleTaskUpdate}
      />

      {editingTask && (
        <TaskModal
          isOpen={!!editingTask}
          onClose={() => {
            setEditingTask(null);
            setShowTaskMenu(null);
          }}
          onSubmit={(updates) => handleTaskUpdate(editingTask.id, updates)}
          initialData={editingTask}
          mode="edit"
          columns={columns}
        />
      )}

      {showTaskMenu && (
        <div
          className="fixed z-[9999]"
          style={{
            position: 'fixed',
            top: menuPosition.y,
            left: menuPosition.x,
          }}
        >
          <MenuDropdown
            task={tasks.find(t => t.id === showTaskMenu)}
            onClose={() => setShowTaskMenu(null)}
            onEdit={handleEditTask}
            onComplete={onTaskComplete}
            onViewDetails={handleTaskClick}
            onDelete={onDelete}
            onArchive={onArchive}
          />
        </div>
      )}
    </div>
  );
};

CalendarView.propTypes = {
  tasks: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      deadline: PropTypes.string,
      completed: PropTypes.bool.isRequired,
      xp: PropTypes.number.isRequired
    })
  ).isRequired,
  onTaskUpdate: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onArchive: PropTypes.func.isRequired,
  onTaskComplete: PropTypes.func.isRequired,
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired
    })
  ).isRequired
};

export default CalendarView;