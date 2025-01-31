// src/contexts/TaskContext/TaskProvider.jsx
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TaskContext from './TaskContext';
import useAuth from '../../contexts/AuthContext/useAuth';
import { getUserBadges } from '../../services/badgeService';
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


    useEffect(() => {
        const loadData = async () => {
            try {
                const [userTasks, userColumns, archivedTasksData, userBadges, profile, userProjects] = await Promise.all([
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

                // Load comment counts for all tasks
                const tasksWithComments = await Promise.all(userTasks.map(async task => {
                    const comments = await getTaskComments(task.id);
                    return {
                        ...task,
                        commentCount: comments.length,
                        status: task.status && columnsToUse.some((col) => col.id === task.status)
                            ? task.status
                            : columnsToUse[0]?.id || null
                    };
                }));




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

    // Task-related handlers
    const handleCreateTask = async (taskData) => {
        try {
            const newTask = await createTask(user.uid, {
                ...taskData,
                status: taskData.status || columns[0]?.id || null,
            });
            setTasks(prev => [...prev, newTask]);
            return newTask;
        } catch (error) {
            console.error('Error creating task:', error);
            throw error;
        }
    };

    const handleTaskComplete = async (taskId) => {
        const taskToUpdate = tasks.find((t) => t.id === taskId);
        if (!taskToUpdate) return;

        const isCompleting = !taskToUpdate.completed;

        try {
            await handleTaskCompletion(user.uid, taskId, isCompleting);
            setTasks(prev => prev.map(task =>
                task.id === taskId ? { ...task, completed: isCompleting } : task
            ));
        } catch (error) {
            console.error('Error completing task:', error);
            throw error;
        }
    };

    const handleTaskUpdate = async (taskId, updates) => {
        try {
            const updatedTask = await updateTask(taskId, updates);
            setTasks(prev => prev.map(task =>
                task.id === taskId ? { ...task, ...updatedTask } : task
            ));
            return updatedTask;
        } catch (error) {
            console.error('Error updating task:', error);
            throw error;
        }
    };

    const handleTaskDelete = async (taskId) => {
        try {
            await deleteTask(taskId);
            setTasks(prev => prev.filter(task => task.id !== taskId));
        } catch (error) {
            console.error('Error deleting task:', error);
            throw error;
        }
    };

    const handleArchiveTask = async (taskId) => {
        try {
            await archiveTask(taskId);
            const archivedTask = tasks.find(t => t.id === taskId);
            setTasks(prev => prev.filter(t => t.id !== taskId));
            setArchivedTasks(prev => [...prev, { ...archivedTask, archived: true }]);
        } catch (error) {
            console.error('Error archiving task:', error);
            throw error;
        }
    };

    const handleColumnUpdate = async (columnId, updates) => {
        try {
            const updatedColumn = await updateColumn(user.uid, columnId, updates);
            setColumns(prev => prev.map(col =>
                col.id === columnId ? { ...col, ...updatedColumn } : col
            ));
            return updatedColumn;
        } catch (error) {
            console.error('Error updating column:', error);
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
    };

    return (
        <TaskContext.Provider value={value}>
            {children}
        </TaskContext.Provider>
    );
};

TaskProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

export default TaskProvider;
