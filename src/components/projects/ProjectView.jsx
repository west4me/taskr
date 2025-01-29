import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Clock, AlertCircle, Search, Archive, Folder } from 'lucide-react';
import { useTask } from '../../contexts/TaskContext';
import TaskCard from '../kanban/TaskCard';
import TaskModal from '../tasks/TaskModal';
import TaskDetailsSidebar from '../tasks/TaskDetailsSidebar';
import ErrorBoundary from '../ErrorBoundary';
import { getUserProjects } from '../../services/projectService';

const ProjectView = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [selectedTask, setSelectedTask] = useState(null);
    const [editingTask, setEditingTask] = useState(null);
    const [projectTasks, setProjectTasks] = useState([]);
    const [projectName, setProjectName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showArchived, setShowArchived] = useState(false);
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(projectId);

    const {
        tasks,
        archivedTasks,
        columns,
        completeTask,
        updateTask,
        deleteTask,
        archiveTask
    } = useTask();

    useEffect(() => {
        const fetchProjects = async () => {
            const userProjects = await getUserProjects();
            setProjects(userProjects);
        };
        fetchProjects();
    }, []);

    useEffect(() => {
        const filteredTasks = tasks.filter(task =>
            task.projects?.some(project => project.id === selectedProject)
        );
        setProjectTasks(filteredTasks);

        const projectTitle = filteredTasks[0]?.projects?.find(p => p.id === selectedProject)?.name || 'Project';
        setProjectName(projectTitle);
    }, [tasks, selectedProject]);

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Strip time to only compare dates

    // Task Metrics
    const totalTasks = projectTasks.length;
    const completedTasks = projectTasks.filter(task => task.completed).length;
    const upcomingTasks = projectTasks.filter(task =>
        !task.completed && task.deadline && new Date(task.deadline) >= today
    ).length;
    const overdueTasks = projectTasks.filter(task =>
        !task.completed && task.deadline && new Date(task.deadline) < today
    ).length;

    // Task Filtering
    const filteredTasks = projectTasks.filter(task =>
        task.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const displayTasks = showArchived ? archivedTasks : filteredTasks;

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
                        {/* Project Selector */}
                        <div className="relative">
                            <Folder className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <select
                                value={selectedProject}
                                onChange={(e) => setSelectedProject(e.target.value)}
                                className="pl-10 pr-4 py-2 border rounded-lg bg-white text-black"
                            >
                                {projects.map(project => (
                                    <option key={project.id} value={project.id}>
                                        {project.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Search Input */}
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search tasks..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 border rounded-lg bg-white text-black"
                            />
                        </div>

                        {/* Show Archived Toggle */}
                        <button
                            onClick={() => setShowArchived(!showArchived)}
                            className={`flex items-center gap-2 px-4 py-2 border rounded-lg ${showArchived ? 'bg-[var(--color-error)] text-white' : 'bg-white text-black'
                                }`}
                        >
                            <Archive className="w-4 h-4" />
                            {showArchived ? "Hide Archived" : "Show Archived"}
                        </button>
                    </div>
                </div>

                <div className="bg-[var(--color-surface)] rounded-xl p-6 mb-6">
                    <h1 className="text-2xl font-bold text-[var(--color-text)] mb-6">
                        {projectName}
                    </h1>

                    {/* Project Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-[var(--color-surface)]/50 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-[var(--color-text)]">
                                <CheckCircle className="w-5 h-5" />
                                <span className="text-sm">Total Tasks</span>
                            </div>
                            <p className="text-2xl font-bold text-[var(--color-text)] mt-2">
                                {totalTasks}
                            </p>
                        </div>

                        <div className="bg-[var(--color-success)]/10 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-[var(--color-success)]">
                                <CheckCircle className="w-5 h-5" />
                                <span className="text-sm">Completed</span>
                            </div>
                            <p className="text-2xl font-bold text-[var(--color-success)] mt-2">
                                {completedTasks}
                            </p>
                        </div>

                        <div className="bg-[var(--color-primary)]/10 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-[var(--color-primary)]">
                                <Clock className="w-5 h-5" />
                                <span className="text-sm">Upcoming</span>
                            </div>
                            <p className="text-2xl font-bold text-[var(--color-primary)] mt-2">
                                {upcomingTasks}
                            </p>
                        </div>

                        <div className="bg-[var(--color-error)]/10 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-[var(--color-error)]">
                                <AlertCircle className="w-5 h-5" />
                                <span className="text-sm">Overdue</span>
                            </div>
                            <p className="text-2xl font-bold text-[var(--color-error)] mt-2">
                                {overdueTasks}
                            </p>
                        </div>
                    </div>
                </div>

                <ErrorBoundary>
                    {/* Tasks Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {displayTasks.map(task => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                onComplete={completeTask}
                                onDelete={deleteTask}
                                onEdit={setEditingTask}
                                onSelect={setSelectedTask}
                                onArchive={archiveTask}
                            />
                        ))}
                        {displayTasks.length === 0 && (
                            <div className="col-span-full text-center py-12 text-[var(--color-secondary)]">
                                No tasks found.
                            </div>
                        )}
                    </div>
                </ErrorBoundary>
            </div>
        </div>
    );
};

export default ProjectView;
