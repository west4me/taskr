// src/components/ui/Notification.jsx

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
  duration = 5000,
  position = 'top-center', // "top-right" or "top-center"
}) => {

  // Auto-close after `duration`
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  // Decide style based on type
  const getBackgroundStyle = () => {
    switch (type) {
      case 'achievement':
        return 'bg-gradient-to-r from-[var(--color-xp-gradient-start)] to-[var(--color-xp-gradient-end)]';
      case 'error':
        return 'bg-[var(--color-error)]';
      case 'info':
        return 'bg-[var(--color-info)]';
      case 'success':
      default:
        return 'bg-[var(--color-success)]';
    }
  };

  // Positioning classes for center or right
  const positionClasses =
    position === 'top-center'
      ? 'top-6 left-[calc(50vw-160px)]'
      : 'top-6 ';

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -30 }}
        className={`
          fixed z-50 p-4 rounded-lg shadow-lg flex items-center gap-3 border border-white/10 
          ${positionClasses}
          ${getBackgroundStyle()}
        `}
        style={{ width: '320px', maxWidth: '90%' }}
      >
        {/* Icon (optional) */}
        {icon && (
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white ring-2 ring-white/30 shadow-lg">
            {icon}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="text-[var(--color-text-inverse)] font-semibold text-base">
            {message}
          </div>
          {subtitle && (
            <div className="text-sm text-[var(--color-text-inverse)] mt-1">
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
          <X className="w-5 h-5" />
        </button>
      </motion.div>
    </>
  );
};

Notification.propTypes = {
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['success', 'info', 'achievement', 'error']),
  onClose: PropTypes.func.isRequired,
  icon: PropTypes.node,
  subtitle: PropTypes.string,
  duration: PropTypes.number,
  position: PropTypes.oneOf(['top-right', 'top-center']),
};

export default Notification;
