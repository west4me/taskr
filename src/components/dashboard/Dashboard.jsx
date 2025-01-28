// React and Framer Motion
import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';

// Icons needed for Dashboard (removed duplicates used in DashboardHeader)
import {
    Medal, Flame, Trophy, Target,
    Award, Zap, CheckCircle, Rocket, Sunrise, Moon,
    Swords, Crown, CalendarCheck, Activity, Check,
    Star, Clock, Dumbbell, FolderPlus, Briefcase,
    Infinity as InfinityIcon
} from 'lucide-react';

// Components
import UserBadges from './UserBadges';
import TaskModal from '../tasks/TaskModal';
import KanbanBoard from '../kanban/KanbanBoard';
import CalendarView from '../tasks/CalendarView';
import TaskListView from '../tasks/TaskListView';
import ErrorBoundary from '../ErrorBoundary';
import Notification from '../ui/Notification';
import DashboardHeader from '../ui/DashboardHeader';
import FloatingActionButton from '../ui/fabButton';

// Hooks and Context
import useAuth from '../../contexts/AuthContext/useAuth';

// Services
import { getUserBadges, checkAndAwardBadges } from '../../services/badgeService';
import { deleteAllUserData, getUserProfile } from '../../services/userService';
import {
    createTask,
    getUserTasks,
    updateTask,
    deleteTask,
    getColumns,
    createColumn,
    updateColumn,
    handleTaskCompletion,
    archiveTask,
    getArchivedTasks
} from '../../services/taskService';

const iconMap = {
    Medal, Trophy, Award, Flame, Zap, Target,
    CheckCircle, Rocket, Sunrise, Moon, Swords,
    Crown, CalendarCheck, Activity, Check,
    Infinity: InfinityIcon, Star,
    Clock, Dumbbell, FolderPlus, Briefcase
};

const Dashboard = () => {
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState('kanban');
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [columns, setColumns] = useState([]);
    const [notification, setNotification] = useState(null);
    const [badges, setBadges] = useState([]);
    const [archivedTasks, setArchivedTasks] = useState([]);
    const [showArchived, setShowArchived] = useState(false);
    const isLocal = window.location.hostname === 'localhost';
    const [userData, setUserData] = useState({
        level: 1,
        currentXP: 0,
        totalXP: 0,
        currentStreak: 0,
        nextLevelXP: 1000
    });
    const { user, logout } = useAuth();

    useEffect(() => {
        const loadData = async () => {
            try {
                const [userTasks, profile, userColumns, archivedTasksData] = await Promise.all([
                    getUserTasks(user.uid),
                    getUserProfile(user.uid),
                    getColumns(user.uid),
                    getArchivedTasks(user.uid),
                ]);


                if (!userTasks || !Array.isArray(userTasks) || !userColumns || !Array.isArray(userColumns)) {
                    console.warn('Invalid or empty tasks/columns data.');
                    setTasks([]);
                    setColumns([]);
                    return;
                }

                let columnsToUse = userColumns;

                if (!userColumns.length) {
                    const defaultColumns = [
                        { title: 'To Do', order: 0 },
                        { title: 'In Progress', order: 1 },
                        { title: 'Done', order: 2 }
                    ];

                    const createdColumns = await Promise.all(
                        defaultColumns.map((column) => createColumn(user.uid, column))
                    );
                    columnsToUse = createdColumns;
                }

                const tasksWithStatus = userTasks.map((task) => ({
                    ...task,
                    status: task.status && columnsToUse.some((col) => col.id === task.status)
                        ? task.status
                        : columnsToUse[0]?.id || null
                }));

                setTasks(tasksWithStatus);
                setArchivedTasks(archivedTasksData);
                setUserData(profile);
                setColumns(columnsToUse.sort((a, b) => a.order - b.order));
            } catch (error) {
                console.error('Error loading data:', error);
                setNotification({
                    message: 'Error loading data. Please refresh the page.',
                    type: 'error'
                });
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [user.uid]);

    useEffect(() => {
        const loadBadges = async () => {
            try {
                const userBadges = await getUserBadges(user.uid);
                setBadges(userBadges);
            } catch (error) {
                console.error('Failed to load badges:', error);
            }
        };
        loadBadges();
    }, [user.uid]);

    const handleCreateTask = async (taskData) => {
        try {
            const newTask = await createTask(user.uid, {
                ...taskData,
                status: taskData.status || columns[0]?.id || null, // Assign to the first column if no status
            });

            // Update the local tasks state
            setTasks((prev) => [...prev, newTask]);

            // Safely update the columns with the new task
            setColumns((prevColumns) =>
                prevColumns.map((col) =>
                    col.id === newTask.status
                        ? {
                            ...col,
                            tasks: [...(col.tasks || []), newTask], // Ensure tasks array exists
                        }
                        : col
                )
            );

            setIsTaskModalOpen(false); // Close the modal

            setNotification({
                message: 'Task created successfully!',
                type: 'success',
            });
        } catch (error) {
            console.error('Error creating task:', error);
            setNotification({
                message: 'Error creating task. Please try again.',
                type: 'error',
            });
        }
    };



    const handleTaskComplete = async (taskId) => {
        const taskToUpdate = tasks.find((t) => t.id === taskId);

        if (!taskToUpdate) {
            console.error("Task not found.");
            return;
        }

        const isCompleting = !taskToUpdate.completed;

        const updatedTask = {
            ...taskToUpdate,
            completed: isCompleting,
        };

        try {
            // Update task completion status in the backend
            await handleTaskCompletion(user.uid, taskId, isCompleting);

            // Update the local tasks state
            setTasks((prevTasks) =>
                prevTasks.map((task) =>
                    task.id === taskId ? updatedTask : task
                )
            );

            // Update XP, level, and progress bar on the front-end
            const xpChange = isCompleting ? updatedTask.xp || 100 : -(updatedTask.xp || 100); // Use task XP or fallback
            setUserData((prevUserData) => {
                const newCurrentXP = Math.max(0, prevUserData.currentXP + xpChange);
                const levelUp = newCurrentXP >= prevUserData.nextLevelXP;

                return {
                    ...prevUserData,
                    currentXP: levelUp ? newCurrentXP - prevUserData.nextLevelXP : newCurrentXP,
                    totalXP: prevUserData.totalXP + xpChange,
                    level: levelUp ? prevUserData.level + 1 : prevUserData.level,
                    nextLevelXP: levelUp ? prevUserData.nextLevelXP + 1000 : prevUserData.nextLevelXP,
                };
            });

            // Award badges
            const earnedBadges = await checkAndAwardBadges(
                user.uid,
                {
                    ...userData,
                    currentXP: userData.currentXP + xpChange,
                    level: userData.level,
                },
                tasks.filter((t) => t.completed).length + (isCompleting ? 1 : -1),
                tasks
            );

            if (earnedBadges?.length) {
                const BadgeIcon = iconMap[earnedBadges[0].icon];
                setNotification({
                    message: `New Badge Earned: ${earnedBadges[0].name}!`,
                    type: "achievement",
                    icon: <BadgeIcon className="w-6 h-6" />,
                    subtitle: earnedBadges[0].description,
                });
            }

            // Notify about completion or incompletion
            setNotification({
                message: isCompleting
                    ? "Task completed successfully! XP has been added."
                    : "Task marked as incomplete. XP has been adjusted.",
                type: isCompleting ? "success" : "info",
            });
        } catch (error) {
            console.error("Error updating task status:", error);
            setNotification({
                message: "Error updating task status. Please try again.",
                type: "error",
            });
        }
    };

    const handleColumnUpdate = async (columnId, updates) => {
        try {
            // First check if it's a new column
            const existingColumn = columns.find((col) => col.id === columnId);

            if (!existingColumn) {
                // This is a new column, add it to our columns state
                setColumns(prev => [...prev, { id: columnId, ...updates }].sort((a, b) => a.order - b.order));
            } else {
                // This is an existing column being updated
                await updateColumn(user.uid, columnId, {
                    ...updates,
                    order: existingColumn.order
                });

                const updatedColumns = await getColumns(user.uid);
                setColumns(updatedColumns.sort((a, b) => a.order - b.order));
            }
        } catch (error) {
            console.error('Error updating column:', error);
            setNotification({
                message: 'Error updating column. Please try again.',
                type: 'error'
            });
        }
    };

    const handleDeleteAllData = async () => {
        if (window.confirm('Are you sure you want to delete all data for the current user? This action cannot be undone.')) {
            try {
                await deleteAllUserData(user.uid, async () => {
                    // Reset tasks and badges
                    setTasks([]);
                    setBadges([]);

                    // Create default columns (maintaining existing functionality)
                    const defaultColumns = [
                        { title: 'To Do', order: 0 },
                        { title: 'In Progress', order: 1 },
                        { title: 'Done', order: 2 }
                    ];

                    const createdColumns = await Promise.all(
                        defaultColumns.map((column) => createColumn(user.uid, column))
                    );
                    setColumns(createdColumns);

                    // Reset user data
                    setUserData({
                        level: 1,
                        currentXP: 0,
                        totalXP: 0,
                        currentStreak: 0,
                        longestStreak: 0,
                        nextLevelXP: 1000,
                    });

                    setNotification({
                        message: 'All user data has been deleted successfully. Starting fresh!',
                        type: 'success'
                    });
                });
            } catch (error) {
                console.error('Error deleting all user data:', error);
                setNotification({
                    message: 'An error occurred while deleting user data. Please try again.',
                    type: 'error',
                });
            }
        }
    };
    const handleTaskDelete = async (taskId) => {
        try {
            await deleteTask(taskId);
            setTasks((prev) => prev.filter((task) => task.id !== taskId));
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    };

    const handleArchiveTask = async (taskId) => {
        try {
            await archiveTask(taskId);
            const archivedTask = tasks.find(t => t.id === taskId);
            setTasks(prev => prev.filter(t => t.id !== taskId));
            setArchivedTasks(prev => [...prev, { ...archivedTask, archived: true }]);

            setNotification({
                message: 'Task archived successfully',
                type: 'success'
            });
        } catch (error) {
            console.error('Error archiving task:', error);
            setNotification({
                message: 'Error archiving task',
                type: 'error'
            });
        }
    };

    const handleTaskUpdate = async (taskId, updates) => {
        try {
            const updatedTask = await updateTask(taskId, updates);

            // Update tasks state with the complete updated task
            setTasks((prev) =>
                prev.map((task) =>
                    task.id === taskId ? { ...task, ...updatedTask } : task
                )
            );

            // Show success notification
            setNotification({
                message: 'Task updated successfully',
                type: 'success'
            });
        } catch (error) {
            console.error('Error updating task:', error);
            setNotification({
                message: 'Error updating task. Please try again.',
                type: 'error'
            });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center">
                <p className="text-[var(--color-text)]">Loading your quests...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--color-background)] flex flex-col">
            <DashboardHeader
                onCreateTask={() => setIsTaskModalOpen(true)}
                onViewChange={setViewMode}
                viewMode={viewMode}
                showArchived={showArchived}
                onToggleArchive={() => setShowArchived(!showArchived)}
                onLogout={logout}
                isLocal={isLocal}
                onDeleteAllData={handleDeleteAllData}
            />

            <div className="flex-1 flex flex-col p-4 md:p-6 max-w-[2000px] mx-auto w-full">
                <UserBadges userData={userData} badges={badges} setBadges={setBadges} />
                <div className="flex-1">
                    {viewMode === 'kanban' ? (
                        <ErrorBoundary>
                            <KanbanBoard
                                tasks={showArchived ? archivedTasks : tasks}
                                columns={columns}
                                onTaskComplete={handleTaskComplete}
                                onTaskDelete={handleTaskDelete}
                                onTaskUpdate={handleTaskUpdate}
                                onColumnUpdate={handleColumnUpdate}
                                onArchive={handleArchiveTask}
                            />
                        </ErrorBoundary>
                    ) : viewMode === 'calendar' ? (
                        <CalendarView
                            tasks={showArchived ? archivedTasks : tasks}
                            onTaskUpdate={handleTaskUpdate}
                            onDelete={handleTaskDelete}
                            onTaskComplete={handleTaskComplete}
                            onArchive={handleArchiveTask}
                            columns={columns}
                        />
                    ) : (
                        <TaskListView
                            tasks={showArchived ? archivedTasks : tasks}
                            onTaskComplete={handleTaskComplete}
                            onTaskDelete={handleTaskDelete}
                            onTaskUpdate={handleTaskUpdate}
                            onArchive={handleArchiveTask}
                            columns={columns}
                        />
                    )}
                </div>
            </div>

            <FloatingActionButton onClick={() => setIsTaskModalOpen(true)} />

            <TaskModal
                isOpen={isTaskModalOpen}
                onClose={() => setIsTaskModalOpen(false)}
                onSubmit={handleCreateTask}
                columns={columns}
            />

            <AnimatePresence>
                {notification && (
                    <Notification
                        message={notification.message}
                        type={notification.type}
                        icon={notification.icon}
                        subtitle={notification.subtitle}
                        onClose={() => setNotification(null)}
                        duration={3000}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default Dashboard;
