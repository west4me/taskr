import PropTypes from 'prop-types';
import { MoreVertical, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import MenuDropdown from '../shared/MenuDropdown';
import { useNavigate } from 'react-router-dom';

function getTagColor(type, value) {
    if (type === 'difficulty') {
        switch (value) {
            case 'easy':
                return 'text-[var(--color-success)] bg-[var(--color-success)]/10';
            case 'medium':
                return 'text-[var(--color-accent)] bg-[var(--color-accent)]/10';
            case 'hard':
                return 'text-[var(--color-error)] bg-[var(--color-error)]/10';
            default:
                return 'text-[var(--color-text)]/60';
        }
    }
    if (type === 'priority') {
        switch (value) {
            case 'high':
                return 'text-[var(--color-error)] bg-[var(--color-error)]/10';
            case 'medium':
                return 'text-[var(--color-accent)] bg-[var(--color-accent)]/10';
            case 'low':
                return 'text-[var(--color-success)] bg-[var(--color-success)]/10';
            default:
                return 'text-[var(--color-text)]/60';
        }
    }
    return '';
}

const TaskCard = ({ task, onComplete, onDelete, onEdit, onSelect, onExpand, onArchive }) => {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
    const [menuVisible, setMenuVisible] = useState(false);
    const buttonRef = useRef(null);

    useEffect(() => {
        if (isMenuOpen && buttonRef.current) {
            const buttonRect = buttonRef.current.getBoundingClientRect();

            const x = buttonRect.left + buttonRect.width / 2 - 100; // Approximate dropdown width
            const y = buttonRect.bottom + 5; // Slightly below the button

            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            const dropdownWidth = 200; // Approximate dropdown width
            const dropdownHeight = 200; // Approximate dropdown height

            let adjustedX = x;
            let adjustedY = y;

            // Adjust X for right overflow
            if (adjustedX + dropdownWidth > viewportWidth) {
                adjustedX = viewportWidth - dropdownWidth - 10;
            }

            // Adjust Y for bottom overflow
            if (adjustedY + dropdownHeight > viewportHeight) {
                adjustedY = buttonRect.top - dropdownHeight - 5; // Place above the button
            }

            setMenuPosition({ x: adjustedX, y: adjustedY });

            // Delay visibility until position is set
            setTimeout(() => {
                setMenuVisible(true);
            }, 0);
        } else {
            setMenuVisible(false); // Hide menu when closed
        }
    }, [isMenuOpen]);





    // UPDATED: New handleMenuToggle function with proper event handling and positioning
    const handleMenuToggle = () => {
        if (!buttonRef.current) {
            console.error("buttonRef is null!");
            return; // Ensure the button ref exists
        }

        setIsMenuOpen((prev) => !prev); // Toggle the menu state
    };

    const handleProjectClick = (e, projectId) => {
        e.stopPropagation();
        navigate(`/project/${projectId}`);
    };

    return (
        <div
            className={`
                task-card bg-[var(--color-surface)] 
                rounded-lg shadow-md p-4 
                border border-[var(--color-secondary)]/20
                ${task.completed ? 'opacity-75' : ''}
                ${isExpanded ? 'z-10 relative mb-10' : 'min-h-52'}
            `}
        >
            {/* Header: Title and Menu */}
            <div className="flex justify-between items-start mb-3">
                <button
                    onClick={() => onSelect(task)}
                    className={`
                        text-lg font-medium text-left transition-colors
                        ${task.completed
                            ? 'text-[var(--color-text)]/50 line-through hover:line-through'
                            : 'text-[var(--color-text)] hover:text-[var(--color-primary)]'
                        }
                    `}
                >
                    {task.name}
                </button>

                {/* UPDATED: Menu Button with simplified onClick handler */}
                <div className="relative">
                    <button
                        ref={buttonRef}
                        onClick={handleMenuToggle}
                        className="p-1 rounded text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/20"
                    >
                        <MoreVertical className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Description (if any) */}
            {task.description && (
                <div className="mb-3">
                    <div
                        className={`
                            text-[var(--color-text)]/60 text-sm 
                            prose prose-invert max-w-none
                            ${!isExpanded && 'line-clamp-2'}
                        `}
                        dangerouslySetInnerHTML={{ __html: task.description }}
                    />
                    {task.description.length > 100 && (
                        <button
                            onClick={() => {
                                setIsExpanded(!isExpanded);
                                if (onExpand) {
                                    onExpand(!isExpanded);
                                }
                            }}
                            className="text-sm mt-1 flex items-center gap-1 text-[var(--color-secondary)] hover:text-[var(--color-text)]"
                        >
                            {isExpanded ? (
                                <>
                                    <ChevronUp className="w-4 h-4" />
                                    Show Less
                                </>
                            ) : (
                                <>
                                    <ChevronDown className="w-4 h-4" />
                                    Show More
                                </>
                            )}
                        </button>
                    )}
                </div>
            )}

            {/* Task Metadata: Difficulty, Priority, XP */}
            <div className="grid grid-cols-3 mb-4">
                <div className="flex flex-col">
                    <span className="text-xs text-[var(--color-secondary)] mb-1">Difficulty</span>
                    <span className={`text-sm font-medium ${getTagColor('difficulty', task.difficulty)}`}>
                        {task.difficulty.charAt(0).toUpperCase() + task.difficulty.slice(1)}
                    </span>
                </div>
                <div className="flex flex-col">
                    <span className="text-xs text-[var(--color-secondary)] mb-1">Priority</span>
                    <span className={`text-sm font-medium ${getTagColor('priority', task.priority)}`}>
                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </span>
                </div>
                <div className="flex flex-col">
                    <span className="text-xs text-[var(--color-secondary)] mb-1">Experience</span>
                    <span className="text-sm font-bold text-[var(--color-primary)]">
                        {task.xp} XP
                    </span>
                </div>
            </div>

            {/* Deadline */}
            <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[var(--color-text)]" />
                <span className="text-xs text-[var(--color-secondary)]">Due Date</span>
                <span className="text-sm text-[var(--color-text)]">
                    {task.deadline ? new Date(task.deadline + 'T00:00:00').toLocaleDateString() : 'No due date'}
                </span>
            </div>

            {/* Project Tags */}
            {task.projects?.length > 0 && (
                <div className="flex gap-2 mt-4">
                    {task.projects.map((project) => (
                        <button
                            key={project.id}
                            onClick={(e) => handleProjectClick(e, project.id)}
                            className="px-2 py-1 text-xs rounded-full 
                         bg-[var(--color-primary)]/20 
                         text-[var(--color-primary)]
                         hover:bg-[var(--color-primary)]/30 
                         transition-colors"
                        >
                            {project.name}
                        </button>
                    ))}
                </div>
            )}

            {/* ADDED: Menu Dropdown Portal */}
            {isMenuOpen && menuVisible && ReactDOM.createPortal(
                <div
                    className="fixed z-[9999]"
                    style={{
                        position: 'fixed',
                        top: menuPosition.y,
                        left: menuPosition.x,
                    }}
                >
                    <MenuDropdown
                        task={task}
                        menuPosition={menuPosition}
                        onClose={() => setIsMenuOpen(false)}
                        onEdit={onEdit}
                        onComplete={onComplete}
                        onViewDetails={onSelect}
                        onDelete={onDelete}
                        onArchive={onArchive}
                    />
                </div>,
                document.body
            )}


        </div>
    );
};

TaskCard.propTypes = {
    task: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        description: PropTypes.string,
        deadline: PropTypes.string,
        difficulty: PropTypes.string.isRequired,
        priority: PropTypes.string.isRequired,
        completed: PropTypes.bool.isRequired,
        xp: PropTypes.number.isRequired,
        projects: PropTypes.arrayOf(PropTypes.shape({
            id: PropTypes.string.isRequired,
            name: PropTypes.string.isRequired,
        }))
    }).isRequired,
    onComplete: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    onEdit: PropTypes.func.isRequired,
    onSelect: PropTypes.func.isRequired,
    onExpand: PropTypes.func,
    onArchive: PropTypes.func.isRequired,
};

export default TaskCard;