import PropTypes from 'prop-types';
import { Edit2, Check, Eye, Trash, Archive } from 'lucide-react';
import { useRef, useState } from 'react';
import useClickOutside from '../../hooks/useClickOutside';
import Modal from '../ui/Modal';
import Notification from '../ui/Notification';

const MenuDropdown = ({ task, onClose, onEdit, onComplete, onViewDetails, onDelete, onArchive }) => {
    const menuRef = useRef();
    const [showConfirm, setShowConfirm] = useState(false);
    const [showNotification, setShowNotification] = useState(false);
    const [isCompleted, setIsCompleted] = useState(task.completed);

    useClickOutside(menuRef, onClose);

    const handleDelete = () => {
        onDelete(task.id);
        setShowNotification(true);
        setShowConfirm(false);
    };

    const handleComplete = () => {
        const updatedCompletionStatus = !isCompleted;
        setIsCompleted(updatedCompletionStatus);
        onComplete(task.id, updatedCompletionStatus); // Pass updated status
        onClose();
    };

    const handleEdit = (e) => {
        e.stopPropagation();
        onEdit(task);
        onClose();
    };

    const handleViewDetails = () => {
        onViewDetails(task);
        onClose();
    };

    return (
        <div
            ref={menuRef}
            className="absolute w-48 bg-[var(--color-surface)] border border-[var(--color-secondary)]/40 rounded-lg shadow-lg z-50 fixed-menu-dropdown"
        >
            <button
                className="w-full px-4 py-2 text-left text-sm text-[var(--color-text)] hover:bg-[var(--color-secondary)]/20 flex items-center gap-2"
                onClick={handleEdit}
            >
                <Edit2 className="w-4 h-4" />
                Edit
            </button>
            <button
                className="w-full px-4 py-2 text-left text-sm text-[var(--color-text)] hover:bg-[var(--color-secondary)]/20 flex items-center gap-2"
                onClick={handleComplete}
            >
                <Check className="w-4 h-4" />
                {isCompleted ? 'Mark Incomplete' : 'Mark Complete'}
            </button>
            <button
                className="w-full px-4 py-2 text-left text-sm text-[var(--color-text)] hover:bg-[var(--color-secondary)]/20 flex items-center gap-2"
                onClick={handleViewDetails}
            >
                <Eye className="w-4 h-4" />
                View Details
            </button>
            <button
                className="w-full px-4 py-2 text-left text-sm text-[var(--color-text)] hover:bg-[var(--color-secondary)]/20 flex items-center gap-2"
                onClick={() => {
                    onArchive(task.id);
                    onClose();
                }}
            >
                <Archive className="w-4 h-4" />
                Archive
            </button>
            <button
                className="w-full px-4 py-2 text-left text-sm text-[var(--color-error)] hover:bg-[var(--color-secondary)]/20 flex items-center gap-2"
                onClick={() => setShowConfirm(true)}
            >
                <Trash className="w-4 h-4" />
                Delete Task
            </button>

            {/* Confirmation Modal */}
            <Modal
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                title="Confirm Deletion"
            >
                <div className="text-center mt-6 mb-6">
                    <p className="text-[var(--color-text)] mb-4">
                        Are you sure you want to delete <strong>{task.name}</strong>?
                    </p>
                    <div className="flex justify-center gap-4 mt-6">
                        <button
                            onClick={() => setShowConfirm(false)}
                            className="btn btn-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDelete}
                            className="btn btn-primary"
                        >
                            Confirm
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Notification */}
            {showNotification && (
                <Notification
                    message={`Task "${task.name}" has been deleted.`}
                    type="success"
                    onClose={() => setShowNotification(false)}
                    duration={3000}
                />
            )}
        </div>
    );
};

MenuDropdown.propTypes = {
    task: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        completed: PropTypes.bool.isRequired
    }).isRequired,
    onClose: PropTypes.func.isRequired,
    onEdit: PropTypes.func.isRequired,
    onComplete: PropTypes.func.isRequired,
    onViewDetails: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    onArchive: PropTypes.func.isRequired
};

export default MenuDropdown;