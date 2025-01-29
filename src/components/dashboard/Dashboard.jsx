import { useState } from 'react';
import useAuth from '../../contexts/AuthContext/useAuth';
import { useTask } from '../../contexts/TaskContext';
import { AnimatePresence } from 'framer-motion';
import UserBadges from './UserBadges';
import TaskModal from '../tasks/TaskModal';
import KanbanBoard from '../kanban/KanbanBoard';
import CalendarView from '../tasks/CalendarView';
import TaskListView from '../tasks/TaskListView';
import ErrorBoundary from '../ErrorBoundary';
import Notification from '../ui/Notification';
import DashboardHeader from '../ui/DashboardHeader';
import FloatingActionButton from '../ui/fabButton';
import { deleteAllUserData } from '../../services/userService';

const Dashboard = () => {
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState('kanban');
    const [notification, setNotification] = useState(null);
    const [showArchived, setShowArchived] = useState(false);
    const isLocal = window.location.hostname === 'localhost';

    const { user, logout } = useAuth();
    const {
        tasks,
        archivedTasks,
        columns,
        badges,
        setBadges,
        userData,
        createTask,
        completeTask,
        updateTask,
        deleteTask,
        archiveTask,
        updateColumn,
        loading
    } = useTask();

    const handleCreateTask = async (taskData) => {
        try {
            await createTask(taskData);
            setIsTaskModalOpen(false);
            setNotification({
                message: 'Task created successfully!',
                type: 'success',
            });
        } catch (error) {
            setNotification({
                message: 'Error creating task. Please try again.',
                type: 'error',
            });
        }
    };

    const handleDeleteAllData = async () => {
        if (window.confirm('Are you sure you want to delete all data? This action cannot be undone.')) {
            try {
                await deleteAllUserData(user.uid);
                setNotification({
                    message: 'All data deleted successfully',
                    type: 'success'
                });
            } catch (error) {
                setNotification({
                    message: 'Error deleting data',
                    type: 'error'
                });
            }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center">
                <p className="text-[var(--color-text)]">Loading your tasks...</p>
            </div>
        );
    }

    const displayTasks = showArchived ? archivedTasks : tasks;

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
                <UserBadges
                    userData={userData}
                    badges={badges}
                    setBadges={setBadges}
                />
                <div className="flex-1">
                    {viewMode === 'kanban' ? (
                        <ErrorBoundary>
                            <KanbanBoard
                                tasks={displayTasks}
                                columns={columns}
                                onTaskComplete={completeTask}
                                onTaskDelete={deleteTask}
                                onTaskUpdate={updateTask}
                                onArchive={archiveTask}
                                onColumnUpdate={updateColumn}
                            />
                        </ErrorBoundary>
                    ) : viewMode === 'calendar' ? (
                        <CalendarView
                            tasks={displayTasks}
                            onTaskUpdate={updateTask}
                            onDelete={deleteTask}
                            onTaskComplete={completeTask}
                            onArchive={archiveTask}
                            columns={columns}
                        />
                    ) : (
                        <TaskListView
                            tasks={displayTasks}
                            onTaskComplete={completeTask}
                            onTaskDelete={deleteTask}
                            onTaskUpdate={updateTask}
                            onArchive={archiveTask}
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