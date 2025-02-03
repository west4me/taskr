/**
 * XPHeadsUp.jsx
 *
 * A "mini heads-up display" that appears briefly when the user levels up (or gains XP).
 * It shows a smaller XP bar + the new level. You can style it further as desired.
 */

import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import { X } from 'lucide-react'; // If you want a close button, optional.

export default function XPHeadsUp({
    isOpen,
    onClose,
    level,
    currentXP,
    nextLevelXP,
    message,        // e.g. "You leveled up to 7!"
    // duration = 5000 // how long to stay on screen (ms) if you want auto-hide
}) {
    // If you want an auto-close timer, do it here:
    // ---------------------------------------------
    //  useEffect(() => {
    //    if (isOpen) {
    //      const timer = setTimeout(() => onClose(), duration);
    //      return () => clearTimeout(timer);
    //    }
    //  }, [isOpen, onClose, duration]);

    // We'll do a basic XP percent:
    const xpPercent = nextLevelXP > 0 ? Math.min(100, Math.round((currentXP / nextLevelXP) * 100)) : 0;


    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -30, x: "-50%" }}
                    animate={{ opacity: 1, y: 0, x: "-50%" }}
                    exit={{ opacity: 0, y: -30, x: "-50%" }}
                    transition={{ duration: 0.3 }}
                    className="fixed top-16 bg-white shadow-xl rounded-lg p-4 z-50 w-64 left-1/2 transform -translate-x-1/2"
                    style={{ maxWidth: '500px', width: '90%' }}
                >
                    {/* (Optional) Close button: */}
                    <button
                        onClick={onClose}
                        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    {/* Title / Message */}
                    <h2 className="text-lg font-bold text-pink-600 mb-2">
                        {message || `LEVEL ${level}!`}
                    </h2>

                    {/* XP Bar (mini) */}
                    <div className="text-xs text-gray-600 mb-1">
                        {currentXP} / {nextLevelXP} XP
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                        <motion.div
                            className="h-full bg-pink-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${xpPercent}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                        />
                    </div>

                    {/* Extra text if needed */}
                    <p className="text-sm text-gray-700">
                        Keep going!
                    </p>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

XPHeadsUp.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    level: PropTypes.number,
    currentXP: PropTypes.number,
    nextLevelXP: PropTypes.number,
    message: PropTypes.string,
    duration: PropTypes.number
};
