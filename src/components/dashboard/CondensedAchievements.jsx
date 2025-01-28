import PropTypes from 'prop-types';
import { Trophy } from 'lucide-react';

const CondensedAchievements = ({
    recentAchievements,
    totalAchievements,
    onViewAll
}) => {
    return (
        <div className="bg-[var(--color-surface)] rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                    {recentAchievements.length > 0 ? (
                        <div className="flex items-center gap-6 overflow-hidden">
                            {recentAchievements.map((achievement) => {
                                const Icon = achievement.icon;
                                return (
                                    <div
                                        key={achievement.id}
                                        className="flex-none flex flex-col items-center group relative"
                                    >
                                        <div
                                            className={`
                                                w-10 h-10 rounded-full 
                                                ${achievement.color}
                                                bg-[var(--color-surface)]
                                                border-2 border-[var(--color-surface)]
                                                flex items-center justify-center
                                                shadow-md
                                                relative
                                                mb-2
                                            `}
                                        >
                                            <Icon className="w-5 h-5" />
                                        </div>

                                        <span className="text-xs text-[var(--color-text)] text-center hidden sm:block">
                                            {achievement.name}
                                        </span>

                                        <div className="
                                            absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                                            bg-[var(--color-surface-alt)] text-white
                                            px-3 py-2 rounded-lg shadow-lg
                                            opacity-0 invisible group-hover:opacity-100 group-hover:visible
                                            transition-all duration-200
                                            text-sm whitespace-nowrap
                                            z-10
                                        ">
                                            <div className="font-medium">{achievement.name}</div>
                                            <div className="text-xs opacity-80">{achievement.description}</div>
                                            <div className="
                                                absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2
                                                border-4 border-transparent border-t-[var(--color-surface-alt)]
                                            " />
                                        </div>
                                    </div>
                                );
                            })}
                            {totalAchievements > recentAchievements.length && (
                                <span className="text-sm text-[var(--color-secondary)] flex-none">
                                    +{totalAchievements - recentAchievements.length} more
                                </span>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-[var(--color-secondary)]">
                            <Trophy className="w-5 h-5" />
                            <span>Complete tasks to earn achievements!</span>
                        </div>
                    )}
                </div>

                <button
                    onClick={onViewAll}
                    className="
                        flex-none
                        text-[var(--color-primary)] 
                        text-sm font-medium
                        hover:text-[var(--color-primary)]/80
                        transition-colors
                        whitespace-nowrap
                    "
                >
                    View All Achievements
                </button>
            </div>
        </div>
    );
};

CondensedAchievements.propTypes = {
    recentAchievements: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            name: PropTypes.string.isRequired,
            description: PropTypes.string.isRequired,
            icon: PropTypes.elementType.isRequired,
            color: PropTypes.string
        })
    ).isRequired,
    totalAchievements: PropTypes.number.isRequired,
    onViewAll: PropTypes.func.isRequired
};

export default CondensedAchievements;