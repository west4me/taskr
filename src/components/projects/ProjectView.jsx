import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Clock, AlertCircle, Filter, Search } from 'lucide-react';
import { useTask } from '../../contexts/TaskContext';
import TaskCard from '../kanban/TaskCard';
import TaskModal from '../tasks/TaskModal';
import TaskDetailsSidebar from '../tasks/TaskDetailsSidebar';
import ErrorBoundary from '../ErrorBoundary';

const ProjectView = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();

    // State variables
    const [selectedTask, setSelectedTask] = useState(null);
    const [editingTask, setEditingTask] = useState(null);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [isTaskSidebarOpen, setIsTaskSidebarOpen] = useState(false);
    const [projectTasks, setProjectTasks] = useState([]);
    const [projectName, setProjectName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showArchived, setShowArchived] = useState(false);
    const [selectedProject, setSelectedProject] = useState('All Projects');
    const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);

    const {
        tasks,
        archivedTasks,
        columns,
        completeTask,
        updateTask,
        deleteTask,
        archiveTask,
        createTask,
        projects
    } = useTask();

    console.log("useTask() returned:", {
        tasks,
        archivedTasks,
        columns,
        completeTask,
        updateTask,
        deleteTask,
        archiveTask,
        createTask,
        projects
    });

    useEffect(() => {
        if (!tasks || !Array.isArray(tasks)) {
            console.warn("Tasks is not an array or is undefined:", tasks);
            setProjectTasks([]);
            return;
        }

        const filteredTasks = (showArchived ? archivedTasks : tasks).filter(task =>
            task.projects && Array.isArray(task.projects) &&
            task.projects.some(project => String(project.id) === String(projectId))
        );

        console.log("Filtered tasks for project:", filteredTasks);
        setProjectTasks(filteredTasks);

        const projectMatch = projects?.find(p => String(p.id) === String(projectId));
        setProjectName(projectMatch?.name || 'Project');
    }, [tasks, archivedTasks, projectId, projects, showArchived]);

    const handleSubmitTask = async (taskData) => {
        try {
            if (editingTask) {
                await updateTask(editingTask.id, taskData);
            } else {
                await createTask(taskData);
            }
            setIsTaskModalOpen(false);
            setEditingTask(null);
        } catch (error) {
            console.error("Error submitting task:", error);
        }
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalTasks = projectTasks.length;
    const completedTasks = projectTasks.filter(task => task.completed).length;
    const upcomingTasks = projectTasks.filter(task =>
        !task.completed && task.deadline && new Date(task.deadline) >= today
    ).length;
    const overdueTasks = projectTasks.filter(task =>
        !task.completed && task.deadline && new Date(task.deadline) < today
    ).length;

    const projectList = projects ? ['All Projects', ...projects.map(p => p.name)] : ['All Projects'];

    return (
        <div className="min-h-screen bg-[var(--color-background)] p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-[var(--color-secondary)] 
                                hover:text-[var(--color-text)] transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back to Dashboard
                    </button>

                    <div className="flex gap-4">
                        {/* Project Selection Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
                                className="flex items-center gap-2 border rounded-lg py-2 px-4 bg-white text-black"
                            >
                                <Filter className="w-4 h-4" />
                                {selectedProject}
                            </button>

                            {isProjectDropdownOpen && (
                                <div className="absolute top-full mt-2 bg-white border rounded-lg shadow-lg w-64 z-50">
                                    <input
                                        type="text"
                                        placeholder="Search projects..."
                                        className="w-full p-2 border-b"
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    <ul className="max-h-48 overflow-y-auto">
                                        {projectList
                                            .filter(p => p.toLowerCase().includes(searchQuery.toLowerCase()))
                                            .map((project, index) => (
                                                <li
                                                    key={index}
                                                    onClick={() => {
                                                        setSelectedProject(project);
                                                        setIsProjectDropdownOpen(false);
                                                    }}
                                                    className="cursor-pointer px-4 py-2 hover:bg-gray-200"
                                                >
                                                    {project}
                                                </li>
                                            ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Project Metrics */}
                <div className="bg-[var(--color-surface)] rounded-xl p-6 mb-6">
                    <h1 className="text-2xl font-bold text-[var(--color-text)] mb-6">{projectName}</h1>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>Total: {totalTasks}</div>
                        <div>Completed: {completedTasks}</div>
                        <div>Upcoming: {upcomingTasks}</div>
                        <div>Overdue: {overdueTasks}</div>
                    </div>
                </div>

                {/* Task Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <ErrorBoundary>
                        {projectTasks.map(task => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                onComplete={() => completeTask(task.id)}
                                onEdit={() => {
                                    setEditingTask(task);
                                    setIsTaskModalOpen(true);
                                }}
                                onDelete={() => deleteTask(task.id)}
                                onArchive={() => archiveTask(task.id)}
                                onSelect={() => {
                                    setSelectedTask(task);
                                    setIsTaskSidebarOpen(true);
                                }}
                            />
                        ))}
                    </ErrorBoundary>
                </div>

                <TaskModal task={editingTask} isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} onSubmit={handleSubmitTask} columns={columns || []} />
                <TaskDetailsSidebar task={selectedTask} isOpen={isTaskSidebarOpen} onClose={() => setIsTaskSidebarOpen(false)} />
            </div>
        </div>
    );
};

export default ProjectView;
