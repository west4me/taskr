import { Plus } from 'lucide-react';
import PropTypes from 'prop-types';

const FloatingActionButton = ({ onClick }) => {
    return (
        <button
            onClick={onClick}
            className="
        md:hidden
        fixed bottom-6 right-6 
        w-14 h-14
        rounded-full
        bg-[var(--color-primary)]
        hover:bg-[var(--color-primary-hover)]
        text-white
        shadow-lg
        flex items-center justify-center
        transition-colors
        z-50
      "
            aria-label="Create new task"
        >
            <Plus className="w-6 h-6" />
        </button>
    );
};

FloatingActionButton.propTypes = {
    onClick: PropTypes.func.isRequired
};

export default FloatingActionButton;