import { X } from 'lucide-react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';

const Modal = ({ isOpen, onClose, title, children, rightContent }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="
            fixed inset-0 
            bg-[var(--color-overlay)] 
            flex items-center justify-center 
            p-4 z-50
          "
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="
              bg-[var(--color-surface)] 
              rounded-xl 
              w-full max-w-2xl
              max-h-[90vh]
              flex flex-col
              overflow-hidden
            "
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            {/* Header */}
            <div className="flex justify-between items-center px-4 py-3 border-b border-[var(--color-secondary)]/30">
              <h2
                id="modal-title"
                className="w-full text-xl font-semibold text-[var(--color-text)]"
              >
                {title}
              </h2>
              <div className="flex items-center gap-4 flex-shrink-0">
                {rightContent}
                <button
                  onClick={onClose}
                  className="text-[var(--color-text)]/60 hover:text-[var(--color-text)] transition-colors rounded-lg p-1 hover:bg-[var(--color-secondary)]/10"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content - single scrollable area */}
            <div className="flex-1 overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  rightContent: PropTypes.node,
};

export default Modal;