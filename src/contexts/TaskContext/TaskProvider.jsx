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
    createColumn
} from '../../services/taskService';
import { doc, updateDoc } from 'firebase/firestore';
import { getUserProfile } from '../../services/userService';
import { getUserProjects } from '../../services/projectService';
import { checkAndAwardBadges } from '../../services/badgeService';

import { AnimatePresence } from 'framer-motion';
import Notification from '../../components/ui/Notification';
import XPHeadsUp from '../../components/ui/XPHeadsUp';
import { getCompletedTasks } from '../../services/taskService';
import { db } from '../../services/firebase';

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

    // Normal ephemeral "toast" notifications
    const [notification, setNotification] = useState(null);

    // The mini XP HUD overlay
    const [xpHud, setXpHud] = useState({
        isOpen: false,
        level: 1,
        currentXP: 0,
        nextLevelXP: 1000,
    });

    // Show a global toast message
    const showNotification = (msg, type = 'info', icon, subtitle, duration = 4000) => {
        setNotification({ message: msg, type, icon, subtitle, duration });
    };
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
                    userProjects
                ] = await Promise.all([
                    getUserTasks(user.uid),
                    getColumns(user.uid),
                    getArchivedTasks(user.uid),
                    getUserBadges(user.uid),
                    getUserProfile(user.uid),
                    getUserProjects(user.uid),
                ]);

                if (!userTasks || !Array.isArray(userTasks) || !userColumns || !Array.isArray(userColumns)) {
                    console.warn('Invalid tasks/columns data.');
                    setTasks([]);
                    setColumns([]);
                    return;
                }

                let columnsToUse = userColumns;

                // If no columns exist, create defaults
                if (!userColumns.length) {
                    const defaultColumns = [
                        { title: 'To Do', order: 0 },
                        { title: 'In Progress', order: 1 },
                        { title: 'Done', order: 2 },
                    ];
                    const createdColumns = await Promise.all(
                        defaultColumns.map((col) => createColumn(user.uid, col))
                    );
                    columnsToUse = createdColumns;
                }

                // For each task, fetch comment count
                const tasksWithComments = await Promise.all(
                    userTasks.map(async (task) => {
                        const comments = await getTaskComments(task.id);
                        return {
                            ...task,
                            commentCount: comments.length,
                            status: task.status && columnsToUse.some((c) => c.id === task.status)
                                ? task.status
                                : columnsToUse[0]?.id || null
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
            recalculateXP();
        }
    }, [user?.uid]);

    const recalculateXP = async () => {
        try {
            if (!user?.uid) return;

            // ✅ Fetch completed tasks from Firestore
            const completedTasks = await getCompletedTasks(user.uid);

            // ✅ Calculate total XP from completed tasks
            let totalXP = completedTasks.reduce((sum, task) => sum + (task.xpValue || 0), 0);

            // ✅ Determine correct level based on XP
            let level = 1;
            let nextLevelXP = 1000;
            while (totalXP >= nextLevelXP) {
                level++;
                nextLevelXP = Math.floor(nextLevelXP * 1.2);  // Scaling XP requirement
            }

            // ✅ Update state with recalculated XP & level
            setUserData(prev => ({
                ...prev,
                totalXP,
                currentXP: totalXP,
                level,
                nextLevelXP
            }));

            // ✅ Sync corrected XP & level to Firestore
            await updateDoc(doc(db, 'users', user.uid), {
                totalXP,
                currentXP: totalXP,
                level,
                nextLevelXP
            });

            showNotification("XP and level recalibrated based on completed tasks!", "info");

        } catch (error) {
            console.error("Error recalculating XP:", error);
            showNotification("Failed to recalculate XP.", "error");
        }
    };



    // Create a new task
    const handleCreateTask = async (taskData) => {
        try {
            const newTask = await createTask(user.uid, {
                ...taskData,
                status: taskData.status || columns[0]?.id || null,
            });
            setTasks((prev) => [...prev, newTask]);
            showNotification(`Task "${newTask.name}" created!`, 'success');
            return newTask;
        } catch (error) {
            console.error('Error creating task:', error);
            showNotification('Error creating task. Please try again.', 'error');
            throw error;
        }
    };

    // Called when user toggles "completed" for a task
    const handleTaskComplete = async (taskId) => {
        try {
            const task = tasks.find((t) => t.id === taskId);
            if (!task) throw new Error('Task not found in state.');

            const wasLevel = userData.level;
            const isCompleting = !task.completed;

            // Fetch updated XP and task completion status
            const { xpData, completed } = await handleTaskCompletion(user.uid, taskId, isCompleting);

            // Ensure XP is properly updated
            setUserData((prev) => {
                let newXP = Math.max(0, xpData.currentXP || 0);
                let newTotalXP = Math.max(0, xpData.totalXP || 0);
                let newLevel = xpData.level || prev.level;
                let nextLevelXP = xpData.nextLevelXP || prev.nextLevelXP;

                // Ensure nextLevelXP is never zero to prevent NaN%
                if (nextLevelXP <= 0) {
                    nextLevelXP = prev.nextLevelXP;
                }

                return {
                    ...prev,
                    totalXP: newTotalXP,
                    currentXP: newXP,
                    level: newLevel,
                    nextLevelXP: nextLevelXP
                };
            });


            // Only show the XP HUD if the level changed
            if (xpData.level > wasLevel) {
                // User gained a level -> show the HUD (No other notifications)
                setXpHud({
                    isOpen: true,
                    level: xpData.level,
                    currentXP: xpData.currentXP,
                    nextLevelXP: xpData.nextLevelXP
                });

                setNotification(null);
                return;
            } else if (xpData.level < wasLevel) {
                // User lost a level -> Show the blue notification
                showNotification(
                    `You dropped back to Level ${xpData.level}. Keep going!`,
                    'info',  // Use blue style
                    null,
                    `You now have ${xpData.currentXP} XP`
                );
            }


            // If the task was completed, show achievement notifications
            if (completed) {
                const updatedStreak = await updateStreak(user.uid);
                setUserData((prev) => ({
                    ...prev,
                    currentStreak: updatedStreak.currentStreak,
                    longestStreak: updatedStreak.longestStreak
                }));
                showNotification(`Task "${task.name}" completed! 🏆`, 'achievement', null, 'Great job!');
            } else {
                showNotification(`Task "${task.name}" marked incomplete.`, 'info', null, '', 3000); // Blue notification
            }

            // Update task state locally
            setTasks((prevTasks) =>
                prevTasks.map((t) => (t.id === taskId ? { ...t, completed } : t))
            );

            // Check and award new badges
            const updatedTasks = tasks.map((t) =>
                t.id === task.id ? { ...t, completed } : t
            );
            const completedCount = updatedTasks.filter((t) => t.completed).length;
            const newlyAwardedBadges = await checkAndAwardBadges(user.uid, xpData, completedCount, updatedTasks);

            if (newlyAwardedBadges.length > 0) {
                setBadges((prev) => [
                    ...prev,
                    ...newlyAwardedBadges.map((b) => ({ ...b, earned: true }))
                ]);
                newlyAwardedBadges.forEach((badge) => {
                    showNotification(
                        `New Badge Unlocked: ${badge.name}`,
                        'achievement',
                        null,
                        badge.description || '',
                        7000
                    );
                });
            }
        } catch (error) {
            console.error('Error completing task:', error);
            showNotification('Error completing task', 'error');
        }
    };



    // General task update
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

    // Delete a task
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

    // Archive a task
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

    // Update a column
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

    // Provide the context
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
        showNotification,
    };

    return (
        <TaskContext.Provider value={value}>
            {children}

            {/* Normal toast notifications */}
            <AnimatePresence>
                {notification && (
                    <Notification
                        message={notification.message}
                        type={notification.type}
                        onClose={handleCloseNotification}
                        icon={notification.icon}
                        subtitle={notification.subtitle}
                        duration={notification.duration}
                        // pinned top-center
                        position="top-center"
                    />
                )}
            </AnimatePresence>

            {/* The centered mini XP heads-up overlay */}
            <XPHeadsUp
                isOpen={xpHud.isOpen}
                onClose={() => setXpHud((p) => ({ ...p, isOpen: false }))}
                level={xpHud.level}
                currentXP={xpHud.currentXP}
                nextLevelXP={xpHud.nextLevelXP}
                message={`LEVEL ${xpHud.level} Unlocked!`}
                // style so that it's pinned center on the screen:
                customPosition="center"  // We'll handle CSS in XPHeadsUp
            />
        </TaskContext.Provider>
    );
};

TaskProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

export default TaskProvider;
