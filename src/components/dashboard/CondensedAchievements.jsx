import { useState, useEffect } from "react";
import { subscribeToXP, getUserXP } from "../../services/userService";
import useAuth from "../../contexts/AuthContext/useAuth";
import PropTypes from 'prop-types';
import { Trophy } from 'lucide-react';

const CondensedAchievements = ({ recentAchievements, totalAchievements, onViewAll }) => {
    const { user } = useAuth();
    const [xp, setXP] = useState(null);

    useEffect(() => {
        if (!user) {
            console.warn("⚠️ No user detected in CondensedAchievements.");
            return;
        }

        console.log("📡 CondensedAchievements MOUNTED - Subscribing to XP for:", user.uid);

        // Fetch initial XP
        getUserXP(user.uid).then(initialXP => {
            console.log("ℹ️ Initial XP Loaded:", initialXP);
            setXP(initialXP);
        });

        // Subscribe to Firestore XP updates
        const unsubscribe = subscribeToXP(user.uid, (newXP) => {
            console.log("🔥 UI Reacting to Firestore XP Update:", newXP);
            setXP(newXP);
        });

        return () => {
            console.log("🔄 Unsubscribing from XP updates in CondensedAchievements");
            unsubscribe();
        };
    }, [user]);  // ✅ Correctly placed dependency array

    return (
        <div className="bg-[var(--color-surface)] rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <p className="text-xs text-[var(--color-secondary)] font-bold">
                        Total XP: {xp !== null ? xp : "Loading..."}
                    </p>

                    {recentAchievements.length > 0 ? (
                        <div className="flex items-center gap-6 overflow-hidden">
                            {recentAchievements.map((achievement) => {
                                const Icon = achievement.icon;
                                return (
                                    <div key={achievement.id} className="flex-none flex flex-col items-center group relative">
                                        <div className={`w-10 h-10 rounded-full ${achievement.color} bg-[var(--color-surface)] border-2 border-[var(--color-surface)] flex items-center justify-center shadow-md relative mb-2`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <span className="text-xs text-[var(--color-text)] text-center hidden sm:block">
                                            {achievement.name}
                                        </span>
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

                <button onClick={onViewAll} className="text-[var(--color-primary)] text-sm font-medium hover:text-[var(--color-primary)]/80 transition-colors whitespace-nowrap">
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
