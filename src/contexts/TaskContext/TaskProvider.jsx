// src/contexts/TaskContext/TaskProvider.jsx
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TaskContext from './TaskContext';
import useAuth from '../../contexts/AuthContext/useAuth';
import { getUserBadges } from '../../services/badgeService';
import { updateStreak } from '../../services/userService';
import {
    createTask,
    getUserTasks,
    updateTask,
    deleteTask,
    getColumns,
    handleTaskCompletion,
    archiveTask,
    getArchivedTasks,
    getTaskComments,
    updateColumn,
} from '../../services/taskService';
import { getUserProfile } from '../../services/userService';
import { createColumn } from '../../services/taskService';
import { getUserProjects } from '../../services/projectService';
import { checkAndAwardBadges } from '../../services/badgeService';
import Notification from '../../components/ui/Notification'; // NEW: We'll use a direct Notification approach.
import { AnimatePresence } from 'framer-motion';

export const TaskProvider = ({ children }) => {
    const [tasks, setTasks] = useState([]);
    const [archivedTasks, setArchivedTasks] = useState([]);
    const [columns, setColumns] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const [badges, setBadges] = useState([]);
    const [userData, setUserData] = useState({
        level: 1,
        currentXP: 0,
        totalXP: 0,
        currentStreak: 0,
        nextLevelXP: 1000,
    });
    const [projects, setProjects] = useState([]);

    // === NEW: In-app ephemeral notifications ===
    const [notification, setNotification] = useState(null);

    const showNotification = (msg, type = 'info', icon, subtitle, duration = 4000) => {
        setNotification({
            message: msg,
            type,
            icon,
            subtitle,
            duration,
        });
    };
    // Clear after close
    const handleCloseNotification = () => setNotification(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [
                    userTasks,
                    userColumns,
                    archivedTasksData,
                    userBadges,
                    profile,
                    userProjects,
                ] = await Promise.all([
                    getUserTasks(user.uid),
                    getColumns(user.uid),
                    getArchivedTasks(user.uid),
                    getUserBadges(user.uid),
                    getUserProfile(user.uid),
                    getUserProjects(user.uid),
                ]);

                if (!userTasks || !Array.isArray(userTasks) || !userColumns || !Array.isArray(userColumns)) {
                    console.warn('Invalid or empty tasks/columns data.');
                    setTasks([]);
                    setColumns([]);
                    return;
                }

                let columnsToUse = userColumns;

                // If no columns, create default
                if (!userColumns.length) {
                    const defaultColumns = [
                        { title: 'To Do', order: 0 },
                        { title: 'In Progress', order: 1 },
                        { title: 'Done', order: 2 },
                    ];
                    const createdColumns = await Promise.all(
                        defaultColumns.map((column) => createColumn(user.uid, column))
                    );
                    columnsToUse = createdColumns;
                }

                // Load comment counts for all tasks
                const tasksWithComments = await Promise.all(
                    userTasks.map(async (task) => {
                        const comments = await getTaskComments(task.id);
                        return {
                            ...task,
                            commentCount: comments.length,
                            status:
                                task.status && columnsToUse.some((col) => col.id === task.status)
                                    ? task.status
                                    : columnsToUse[0]?.id || null,
                        };
                    })
                );

                setTasks(tasksWithComments);
                setArchivedTasks(archivedTasksData);
                setColumns(columnsToUse.sort((a, b) => a.order - b.order));
                setBadges(userBadges);
                setUserData(profile);
                setProjects(userProjects);
            } catch (error) {
                console.error('Error loading tasks:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user?.uid) {
            loadData();
        }
    }, [user?.uid]);

    const handleCreateTask = async (taskData) => {
        try {
            const newTask = await createTask(user.uid, {
                ...taskData,
                status: taskData.status || columns[0]?.id || null,
            });
            setTasks((prev) => [...prev, newTask]);
            // FUN NEW NOTIFICATION
            showNotification(`Task "${newTask.name}" created!`, 'success');
            return newTask;
        } catch (error) {
            console.error('Error creating task:', error);
            showNotification('Error creating task. Please try again.', 'error');
            throw error;
        }
    };

    // Enhanced: Show a big celebration if user gains a level or a new badge
    const showLevelUpNotification = (newLevel) => {
        showNotification(
            `LEVEL UP! You reached level ${newLevel}!`,
            'achievement',
            null,
            "Keep it going! You're unstoppable!",
            6000
        );
    };

    // Called after awarding badges, show a separate notification for each newly earned badge
    const showBadgeNotifications = (newBadges) => {
        newBadges.forEach((badge) => {
            showNotification(
                `New Badge Unlocked: ${badge.name}`,
                'achievement',
                null,
                badge.description || '',
                7000
            );
        });
    };

    const handleTaskComplete = async (taskId) => {
        try {
            const task = tasks.find((t) => t.id === taskId);
            if (!task) throw new Error('Task not found in state.');

            const isCompleting = !task.completed;
            const { xpData, completed } = await handleTaskCompletion(user.uid, taskId, isCompleting);

            // Update React state with new XP
            setUserData((prev) => ({
                ...prev,
                totalXP: xpData.totalXP,
                currentXP: xpData.currentXP,
                level: xpData.level,
                nextLevelXP: xpData.nextLevelXP,
            }));

            // Check if user leveled up
            if (xpData.level > task?.level) {
                showLevelUpNotification(xpData.level);
            }

            // Update Streak if completing a task
            if (completed) {
                const updatedStreak = await updateStreak(user.uid);
                setUserData((prevUserData) => ({
                    ...prevUserData,
                    currentStreak: updatedStreak.currentStreak,
                    longestStreak: updatedStreak.longestStreak,
                }));

                // show a completion notification
                showNotification(`Task "${task.name}" completed! 🏆`, 'achievement', null, 'Great job!');
            } else {
                showNotification(`Task "${task.name}" marked incomplete.`, 'info');
            }

            // Update local state for tasks
            setTasks((prevTasks) =>
                prevTasks.map((t) => (t.id === taskId ? { ...t, completed } : t))
            );

            // *** BADGE CHECK ***
            // Re-check user’s badges after completing tasks
            const updatedTasks = tasks.map((t) =>
                t.id === task.id ? { ...t, completed } : t
            );
            const completedCount = updatedTasks.filter((t) => t.completed).length;

            const newlyAwardedBadges = await checkAndAwardBadges(user.uid, xpData, completedCount, updatedTasks);
            if (newlyAwardedBadges.length > 0) {
                // refresh user badges
                setBadges((prev) => [
                    ...prev,
                    ...newlyAwardedBadges.map((b) => ({
                        ...b,
                        earned: true,
                    })),
                ]);
                showBadgeNotifications(newlyAwardedBadges);
            }
        } catch (error) {
            console.error('Error completing task:', error);
            showNotification('Error completing task', 'error');
        }
    };

    const handleTaskUpdate = async (taskId, updates) => {
        try {
            const updatedTask = await updateTask(taskId, updates);
            setTasks((prev) =>
                prev.map((task) => (task.id === taskId ? { ...task, ...updatedTask } : task))
            );
            return updatedTask;
        } catch (error) {
            console.error('Error updating task:', error);
            showNotification('Error updating task', 'error');
            throw error;
        }
    };

    const handleTaskDelete = async (taskId) => {
        try {
            await deleteTask(taskId);
            setTasks((prev) => prev.filter((task) => task.id !== taskId));
            showNotification('Task deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting task:', error);
            showNotification('Error deleting task', 'error');
            throw error;
        }
    };

    const handleArchiveTask = async (taskId) => {
        try {
            await archiveTask(taskId);
            const archivedTask = tasks.find((t) => t.id === taskId);
            setTasks((prev) => prev.filter((t) => t.id !== taskId));
            setArchivedTasks((prev) => [...prev, { ...archivedTask, archived: true }]);
            showNotification(`Task "${archivedTask.name}" archived!`, 'info');
        } catch (error) {
            console.error('Error archiving task:', error);
            showNotification('Error archiving task', 'error');
            throw error;
        }
    };

    const handleColumnUpdate = async (columnId, updates) => {
        try {
            const updatedColumn = await updateColumn(user.uid, columnId, updates);
            setColumns((prev) =>
                prev.map((col) => (col.id === columnId ? { ...col, ...updatedColumn } : col))
            );
            return updatedColumn;
        } catch (error) {
            console.error('Error updating column:', error);
            showNotification('Error updating column', 'error');
            throw error;
        }
    };

    const value = {
        tasks,
        archivedTasks,
        columns,
        loading,
        badges,
        setBadges,
        userData,
        projects,
        setProjects,
        setUserData,
        createTask: handleCreateTask,
        completeTask: handleTaskComplete,
        updateTask: handleTaskUpdate,
        deleteTask: handleTaskDelete,
        archiveTask: handleArchiveTask,
        updateColumn: handleColumnUpdate,
        showNotification, // Expose if other components need to trigger
    };

    return (
        <TaskContext.Provider value={value}>
            {children}
            {/* Global Notification, displayed in the top-right or center */}
            <AnimatePresence>
                {notification && (
                    <Notification
                        message={notification.message}
                        type={notification.type}
                        onClose={handleCloseNotification}
                        icon={notification.icon}
                        subtitle={notification.subtitle}
                        duration={notification.duration}
                        // Possibly center or top-right
                        position="top-center" // We'll add a new prop in Notification
                    />
                )}
            </AnimatePresence>
        </TaskContext.Provider>
    );
};

TaskProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

export default TaskProvider;
