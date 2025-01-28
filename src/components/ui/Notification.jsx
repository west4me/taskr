import { useEffect } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { X } from 'lucide-react';

const Notification = ({
  message,
  type = 'success',
  onClose,
  icon,
  subtitle,
  duration = 5000 // Default duration is 5000ms (5 seconds)
}) => {
  // Automatically close the notification after the specified duration
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    // Cleanup the timer when the component unmounts
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  // Define background styles based on type
  const getBackgroundStyle = () => {
    switch (type) {
      case 'achievement':
        return 'bg-gradient-to-r from-[var(--color-xp-gradient-start)] to-[var(--color-xp-gradient-end)]';
      case 'success':
        return 'bg-[var(--color-success)]';
      case 'info':
        return 'bg-[var(--color-info)]';
      default:
        return 'bg-[var(--color-info)]';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className={`
        fixed top-20 right-4 z-50 
        rounded-lg shadow-lg
        flex items-center gap-3
        border border-white/10
        ${getBackgroundStyle()}
        ${type === 'achievement' ? 'px-4 py-3' : 'p-4'}
      `}
    >
      {/* Icon Circle (for achievements) */}
      {icon && (
        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white 
                    ring-2 ring-white/30 shadow-lg">
          {icon}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="text-[var(--color-text-inverse)] font-medium">
          {message}
        </div>
        {subtitle && (
          <div className="text-sm text-[var(--color-text-inverse)]">
            {subtitle}
          </div>
        )}
      </div>

      {/* Close Button */}
      <button
        onClick={onClose}
        className="
          text-[var(--color-text-inverse)]
          hover:text-[var(--color-text-inverse)]/70
          transition-colors
          flex-shrink-0
        "
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

Notification.propTypes = {
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['success', 'info', 'achievement', 'error']),
  onClose: PropTypes.func.isRequired,
  icon: PropTypes.node,
  subtitle: PropTypes.string,
  duration: PropTypes.number // New prop for auto-dismiss duration
};

export default Notification;
