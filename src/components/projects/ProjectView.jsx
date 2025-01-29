import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Clock, AlertCircle, Search, Archive } from 'lucide-react';
import { useTask } from '../../contexts/TaskContext';
import useAuth from '../../contexts/AuthContext/useAuth'; // ✅ Correct usage
import TaskCard from '../kanban/TaskCard';
import TaskModal from '../tasks/TaskModal';
import TaskDetailsSidebar from '../tasks/TaskDetailsSidebar';
import ErrorBoundary from '../ErrorBoundary';
import { getUserProjects } from '../../services/projectService';

const ProjectView = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();  // ✅ useAuth is only used here, in a React component
    const [selectedTask, setSelectedTask] = useState(null);
    const [editingTask, setEditingTask] = useState(null);
    const [projectTasks, setProjectTasks] = useState([]);
    const [projectName, setProjectName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showArchived, setShowArchived] = useState(false);
    const [projectSearchQuery, setProjectSearchQuery] = useState('');
    const [projects, setProjects] = useState([]);

    const {
        tasks,
        archivedTasks,
        columns,
        completeTask,
        updateTask,
        deleteTask,
        archiveTask
    } = useTask();

    // Load project tasks
    useEffect(() => {
        const filteredTasks = tasks.filter(task =>
            task.projects?.some(project => project.id === projectId)
        );
        setProjectTasks(filteredTasks);

        const projectName = filteredTasks[0]?.projects?.find(p => p.id === projectId)?.name || 'Project';
        setProjectName(projectName);
    }, [tasks, projectId]);

    // ✅ Load projects using userId (only if user is logged in)
    useEffect(() => {
        if (!user?.uid) return; // Ensure user is loaded

        const fetchProjects = async () => {
            try {
                const userProjects = await getUserProjects(user.uid);
                setProjects(userProjects);
            } catch (error) {
                console.error('Error fetching projects:', error);
            }
        };

        fetchProjects();
    }, [user?.uid]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Task Metrics
    const totalTasks = projectTasks.length;
    const completedTasks = projectTasks.filter(task => task.completed).length;
    const upcomingTasks = projectTasks.filter(task =>
        !task.completed && task.deadline && new Date(task.deadline) >= today
    ).length;
    const overdueTasks = projectTasks.filter(task =>
        !task.completed && task.deadline && new Date(task.deadline) < today
    ).length;

    // Search & Archive Filtering
    const filteredTasks = projectTasks.filter(task =>
        task.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const displayTasks = showArchived ? archivedTasks : filteredTasks;

    // Filter projects based on user input
    const filteredProjects = projects.filter(project =>
        project.name.toLowerCase().includes(projectSearchQuery.toLowerCase())
    );

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
                        {/* Project Search Dropdown */}
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search projects..."
                                value={projectSearchQuery}
                                onChange={(e) => setProjectSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 border rounded-lg bg-white text-black"
                            />
                            {projectSearchQuery && (
                                <div className="absolute bg-white border mt-1 rounded-lg w-full shadow-md z-10">
                                    {filteredProjects.length > 0 ? (
                                        filteredProjects.map((project) => (
                                            <div
                                                key={project.id}
                                                onClick={() => navigate(`/project/${project.id}`)}
                                                className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                                            >
                                                {project.name}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="px-4 py-2 text-gray-500">No results found</div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Task Search */}
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
                            className={`btn ${showArchived ? 'btn-secondary' : 'btn-outline'}`}
                        >
                            <Archive className="w-4 h-4" />
                            {showArchived ? "Hide Archived" : "Show Archived"}
                        </button>
                    </div>
                </div>

                <ErrorBoundary>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {displayTasks.map(task => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                onComplete={() => completeTask(task.id)}
                                onDelete={() => deleteTask(task.id)}
                                onEdit={() => setEditingTask(task)}
                                onSelect={() => setSelectedTask(task)}
                                onArchive={() => archiveTask(task.id)}
                            />
                        ))}
                    </div>
                </ErrorBoundary>
            </div>
        </div>
    );
};

export default ProjectView;
