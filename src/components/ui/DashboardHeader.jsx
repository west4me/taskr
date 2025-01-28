import { useState } from 'react';
import {
    Plus,
    LogOut,
    TrendingUp,
    Archive,
    Menu,
    X,
    Kanban,    // Added for Kanban view
    List,      // Added for List view
    Calendar   // Added for Calendar view
} from 'lucide-react';
import PropTypes from 'prop-types';

const DashboardHeader = ({
    onCreateTask,
    onViewChange,
    viewMode,
    showArchived,
    onToggleArchive,
    onLogout,
    isLocal,
    onDeleteAllData
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const viewOptions = [
        { name: 'kanban', icon: Kanban },
        { name: 'list', icon: List },
        { name: 'calendar', icon: Calendar }
    ];

    return (
        <header className="p-4 md:p-6 bg-[var(--color-surface)] shadow-lg">
            <div className="max-w-[2000px] mx-auto">
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <TrendingUp />
                        <h1 className="text-2xl font-bold text-[var(--color-text)]">taskr</h1>
                    </div>

                    <button
                        className="md:hidden p-2 text-[var(--color-text)]"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X /> : <Menu />}
                    </button>

                    <div className="hidden md:flex gap-4">
                        {isLocal && (
                            <button onClick={onDeleteAllData} className="btn btn-secondary flex items-center gap-2">
                                <X className="w-5 h-5" />
                                Delete All User Data
                            </button>
                        )}
                        <button
                            className="btn btn-primary flex items-center gap-2"
                            onClick={onCreateTask}
                        >
                            <Plus className="w-5 h-5" />
                            Create Task
                        </button>

                        {viewOptions.map(({ name, icon: Icon }) => (
                            <button
                                key={name}
                                className={`btn btn-secondary flex items-center gap-2 ${viewMode === name ? 'active' : ''}`}
                                onClick={() => onViewChange(name)}
                            >
                                <Icon className="w-5 h-5" />
                                {name.charAt(0).toUpperCase() + name.slice(1)} View
                            </button>
                        ))}

                        <button
                            className={`btn btn-secondary flex items-center gap-2 ${showArchived ? 'active' : ''}`}
                            onClick={onToggleArchive}
                        >
                            <Archive className="w-5 h-5" />
                            {showArchived ? 'Hide Archived' : 'Show Archived'}
                        </button>

                        <button onClick={onLogout} className="btn btn-secondary flex items-center gap-2">
                            <LogOut className="w-5 h-5" />
                            Logout
                        </button>
                    </div>
                </div>

                {isMenuOpen && (
                    <div className="md:hidden mt-4 space-y-2 border-t border-[var(--color-secondary)]/20 pt-4">
                        {isLocal && (
                            <button onClick={onDeleteAllData} className="btn btn-secondary w-full flex items-center gap-2 justify-center">
                                <X className="w-5 h-5" />
                                Delete All User Data
                            </button>
                        )}
                        <button
                            className="btn btn-primary w-full flex items-center gap-2 justify-center"
                            onClick={onCreateTask}
                        >
                            <Plus className="w-5 h-5" />
                            Create Task
                        </button>

                        <div className="grid grid-cols-2 gap-2">
                            {viewOptions.map(({ name, icon: Icon }) => (
                                <button
                                    key={name}
                                    className={`btn btn-secondary flex items-center gap-2 justify-center ${viewMode === name ? 'active' : ''}`}
                                    onClick={() => {
                                        onViewChange(name);
                                        setIsMenuOpen(false);
                                    }}
                                >
                                    <Icon className="w-5 h-5" />
                                    {name.charAt(0).toUpperCase() + name.slice(1)}
                                </button>
                            ))}
                        </div>

                        <button
                            className={`btn btn-secondary w-full flex items-center gap-2 justify-center ${showArchived ? 'active' : ''}`}
                            onClick={() => {
                                onToggleArchive();
                                setIsMenuOpen(false);
                            }}
                        >
                            <Archive className="w-5 h-5" />
                            {showArchived ? 'Hide' : 'Show'} Archived
                        </button>

                        <button
                            onClick={() => {
                                onLogout();
                                setIsMenuOpen(false);
                            }}
                            className="btn btn-secondary w-full flex items-center gap-2 justify-center"
                        >
                            <LogOut className="w-5 h-5" />
                            Logout
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
};

DashboardHeader.propTypes = {
    onCreateTask: PropTypes.func.isRequired,
    onViewChange: PropTypes.func.isRequired,
    viewMode: PropTypes.string.isRequired,
    showArchived: PropTypes.bool.isRequired,
    onToggleArchive: PropTypes.func.isRequired,
    onLogout: PropTypes.func.isRequired,
    isLocal: PropTypes.bool.isRequired,
    onDeleteAllData: PropTypes.func.isRequired
};

export default DashboardHeader;