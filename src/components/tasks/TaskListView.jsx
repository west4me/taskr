import { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { ListFilter, Check, Search } from 'lucide-react';
import TaskCard from '../kanban/TaskCard';
import TaskDetailsSidebar from '../tasks/TaskDetailsSidebar';
import TaskModal from '../tasks/TaskModal';
import useClickOutside from '../../hooks/useClickOutside';

const TaskListView = ({ tasks, onTaskComplete, onTaskDelete, onTaskUpdate, onArchive, columns }) => {
    const [showCompleted, setShowCompleted] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
    const [projectSearch, setProjectSearch] = useState('');
    const [selectedTask, setSelectedTask] = useState(null);
    const [editingTask, setEditingTask] = useState(null);
    const [taskSearch, setTaskSearch] = useState('');
    const [expandedTaskId, setExpandedTaskId] = useState(null);

    const projectMenuRef = useRef(null);

    useClickOutside(projectMenuRef, () => {
        setIsProjectMenuOpen(false);
    });

    // Get unique projects from tasks
    const projects = Array.from(
        new Map(
            tasks
                .flatMap(task => task.projects || [])
                .map(project => [project.id, project])
        ).values()
    );

    // Filter projects based on search
    const filteredProjects = projects.filter(project =>
        project.name.toLowerCase().includes(projectSearch.toLowerCase())
    );

    // Filter tasks based on completion status and selected project
    const filteredTasks = tasks.filter(task => {
        const completionMatch = showCompleted || !task.completed;
        const projectMatch = !selectedProject ||
            task.projects?.some(project => project.id === selectedProject.id);
        const searchMatch = !taskSearch ||
            task.name.toLowerCase().includes(taskSearch.toLowerCase());
        return completionMatch && projectMatch && searchMatch;
    });

    const handleTaskEdit = (task) => {
        setEditingTask(task);
    };

    const handleTaskSelect = (task) => {
        setSelectedTask(task);
    };

    return (
        <div className="w-full bg-[var(--color-surface)]/50 rounded-xl p-6 flex flex-col flex-grow">
            {/* Header */}
            <div className="flex flex-col gap-4 mb-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-semibold text-[var(--color-text)]">
                            Task List
                        </h2>
                        <span className="px-2 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm">
                            {filteredTasks.length} tasks
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            className={`btn btn-secondary flex items-center gap-2 ${showCompleted ? 'bg-[var(--color-primary)] text-[var(--color-text-inverse)]' : ''}`}
                            onClick={() => setShowCompleted(!showCompleted)}
                        >
                            <Check className="w-4 h-4" />
                            {showCompleted ? 'Hide Completed' : 'Show Completed'}
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-[var(--color-surface)] p-2 rounded-lg">
                    {/* Project Filter */}
                    <div className="relative flex-1" ref={projectMenuRef}>
                        <button
                            className="w-full flex items-center justify-between px-3 py-2 rounded-lg 
                               bg-[var(--color-background)] text-[var(--color-text)]
                               hover:bg-[var(--color-secondary)]/10 transition-colors"
                            onClick={() => setIsProjectMenuOpen(!isProjectMenuOpen)}
                        >
                            <div className="flex items-center gap-2">
                                <ListFilter className="w-4 h-4 text-[var(--color-secondary)]" />
                                <span className="text-sm">
                                    {selectedProject ? selectedProject.name : 'All Projects'}
                                </span>
                            </div>
                            <span className="text-xs text-[var(--color-secondary)]">
                                {projects.length} projects
                            </span>
                        </button>

                        {isProjectMenuOpen && (
                            <div className="absolute left-0 right-0 mt-2 bg-[var(--color-surface)] 
                                border border-[var(--color-secondary)]/30 rounded-lg shadow-lg z-20">
                                <div className="p-2 border-b border-[var(--color-secondary)]/30">
                                    <div className="relative">
                                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--color-secondary)]" />
                                        <input
                                            type="text"
                                            placeholder="Search projects..."
                                            value={projectSearch}
                                            onChange={(e) => setProjectSearch(e.target.value)}
                                            className="w-full pl-9 pr-3 py-2 bg-[var(--color-background)] rounded-md 
                                         text-sm text-[var(--color-text)] placeholder-[var(--color-secondary)]
                                         border border-[var(--color-secondary)]/30 
                                         focus:outline-none focus:border-[var(--color-primary)]"
                                        />
                                    </div>
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                    <button
                                        className="w-full px-4 py-2 text-left text-sm text-[var(--color-text)] 
                                     hover:bg-[var(--color-secondary)]/10"
                                        onClick={() => {
                                            setSelectedProject(null);
                                            setIsProjectMenuOpen(false);
                                            setProjectSearch('');
                                        }}
                                    >
                                        All Projects
                                    </button>
                                    {filteredProjects.map(project => (
                                        <button
                                            key={project.id}
                                            className="w-full px-4 py-2 text-left text-sm text-[var(--color-text)] 
                                         hover:bg-[var(--color-secondary)]/10"
                                            onClick={() => {
                                                setSelectedProject(project);
                                                setIsProjectMenuOpen(false);
                                                setProjectSearch('');
                                            }}
                                        >
                                            {project.name}
                                        </button>
                                    ))}
                                    {filteredProjects.length === 0 && projectSearch && (
                                        <div className="px-4 py-2 text-sm text-[var(--color-secondary)]">
                                            No projects found
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Search Tasks */}
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--color-secondary)]" />
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            onChange={(e) => setTaskSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-[var(--color-background)] rounded-lg
                 text-sm text-[var(--color-text)] placeholder-[var(--color-secondary)]
                 border border-[var(--color-secondary)]/30
                 focus:outline-none focus:border-[var(--color-primary)]"
                        />
                    </div>
                </div>
            </div>

            {/* Task Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-x-4 gap-y-10">
                {filteredTasks.map(task => (
                    <div
                        key={task.id}
                        className="relative h-52"
                    >
                        <div
                            className={`${expandedTaskId === task.id ? 'absolute w-full z-10' : ''}`}
                        >
                            <TaskCard
                                task={task}
                                onComplete={onTaskComplete}
                                onDelete={onTaskDelete}
                                onEdit={handleTaskEdit}
                                onSelect={handleTaskSelect}
                                onArchive={onArchive}
                                onExpand={(isExpanded) => {
                                    setExpandedTaskId(isExpanded ? task.id : null);
                                }}
                            />
                        </div>
                    </div>
                ))}
                {filteredTasks.length === 0 && (
                    <div className="text-center py-8 text-[var(--color-secondary)]">
                        {showCompleted
                            ? 'No completed tasks found'
                            : selectedProject
                                ? 'No active tasks in this project'
                                : 'No active tasks'}
                    </div>
                )}
            </div>

            {/* Task Details Sidebar */}
            <TaskDetailsSidebar
                task={selectedTask}
                isOpen={!!selectedTask}
                onClose={() => setSelectedTask(null)}
                onTaskUpdate={onTaskUpdate}
            />

            {/* Edit Task Modal */}
            {editingTask && (
                <TaskModal
                    isOpen={!!editingTask}
                    onClose={() => setEditingTask(null)}
                    onSubmit={(updates) => onTaskUpdate(editingTask.id, updates)}
                    initialData={editingTask}
                    mode="edit"
                    columns={columns}
                />
            )}
        </div>
    );
};

TaskListView.propTypes = {
    tasks: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            name: PropTypes.string.isRequired,
            description: PropTypes.string,
            deadline: PropTypes.string,
            completed: PropTypes.bool.isRequired,
            xp: PropTypes.number.isRequired,
            projects: PropTypes.arrayOf(
                PropTypes.shape({
                    id: PropTypes.string.isRequired,
                    name: PropTypes.string.isRequired,
                })
            ),
        })
    ).isRequired,
    onTaskComplete: PropTypes.func.isRequired,
    onTaskDelete: PropTypes.func.isRequired,
    onArchive: PropTypes.func.isRequired,
    onTaskUpdate: PropTypes.func.isRequired,
    columns: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            title: PropTypes.string.isRequired
        })
    ).isRequired
};

export default TaskListView;