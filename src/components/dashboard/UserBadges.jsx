import { useState, useEffect } from "react";
import {
    Medal, Flame, Trophy, Target, Lock,
    Award, Zap, CheckCircle, Rocket, Sunrise, Moon,
    Swords, Crown, CalendarCheck, Activity, Check,
    Star, Clock, Dumbbell, FolderPlus, Briefcase,
    Infinity as InfinityIcon
} from "lucide-react";
import { motion } from 'framer-motion';
import { AnimatePresence } from 'framer-motion';
import PropTypes from "prop-types";
import { ChevronDown, ChevronUp } from "lucide-react";
import useAuth from '../../contexts/AuthContext/useAuth';
import { getUserBadges } from "../../services/badgeService";
import Modal from "../ui/Modal";

const iconMap = {
    Medal, Trophy, Award, Flame, Zap, Target,
    CheckCircle, Rocket, Sunrise, Moon, Swords,
    Crown, CalendarCheck, Activity, Check,
    Infinity: InfinityIcon, Star,
    Clock, Dumbbell, FolderPlus, Briefcase
};

const UserBadges = ({ userData = {}, badges, setBadges }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("unlocked");
    const { user } = useAuth();
    const [isExpanded, setIsExpanded] = useState(() => {
        const saved = localStorage.getItem('achievements-expanded');
        return saved !== null ? JSON.parse(saved) : true;
    });

    useEffect(() => {
        localStorage.setItem('achievements-expanded', JSON.stringify(isExpanded));
    }, [isExpanded]);

    useEffect(() => {
        const loadBadges = async () => {
            try {
                const userBadges = await getUserBadges(user.uid);
                setBadges(userBadges);
            } catch (error) {
                console.error("Failed to load badges:", error);
            }
        };
        if (badges.length === 0) {
            loadBadges();
        }
    }, [user.uid, setBadges, badges.length]);

    const unlockedBadges = badges.filter((badge) => badge.earned);
    const lockedBadges = badges.filter((badge) => !badge.earned);
    const recentAchievements = unlockedBadges
        .slice(0, 10)
        .map(badge => ({
            id: badge.id,
            name: badge.name,
            description: badge.description || "No description available",
            icon: iconMap[badge.icon] || Trophy,
            color: badge.color || "text-gray-400"
        })) || [];

    const xpProgress = Math.max(0, Math.min(Math.round((userData.currentXP / userData.nextLevelXP) * 100), 100));
    const xpToNextLevel = Math.max(userData.nextLevelXP - userData.currentXP, 0);

    const BadgeCollection = () => {
        const categorizeBadge = (badge) => {
            const streaksKeywords = ["streak", "night_owl", "early_bird"];
            const tasksKeywords = ["task", "quick", "perfectionist", "deadline"];
            const challengesKeywords = ["challenge", "project", "priority"];

            if (streaksKeywords.some(keyword => badge.id.includes(keyword))) {
                return "Streaks";
            } else if (tasksKeywords.some(keyword => badge.id.includes(keyword))) {
                return "Tasks";
            } else if (challengesKeywords.some(keyword => badge.id.includes(keyword))) {
                return "Challenges";
            }
            return "Other";
        };

        const badgesToShow = activeTab === "unlocked" ? unlockedBadges : lockedBadges;
        const groupedBadges = badgesToShow.reduce((acc, badge) => {
            const category = categorizeBadge(badge);
            if (!acc[category]) acc[category] = [];
            acc[category].push(badge);
            return acc;
        }, {});

        return (
            <div className="flex flex-col h-full">
                <div className="flex gap-2 px-4 py-3 border-b border-[var(--color-secondary)]/20">
                    <button
                        onClick={() => setActiveTab("unlocked")}
                        className={`btn flex items-center gap-2 ${activeTab === "unlocked" ? "active" : ""}`}
                    >
                        <Trophy className="w-4 h-4" />
                        Unlocked ({unlockedBadges.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("locked")}
                        className={`btn flex items-center gap-2 ${activeTab === "locked" ? "active" : ""}`}
                    >
                        <Lock className="w-4 h-4" />
                        Locked ({lockedBadges.length})
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <div className="px-6 py-4 space-y-8">
                        {Object.entries(groupedBadges).map(([category, badges]) => (
                            <div key={category}>
                                <h3 className="text-[var(--color-primary)] font-medium mb-4">
                                    {category}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {badges.map((badge) => {
                                        const Icon = iconMap[badge.icon];
                                        return (
                                            <div
                                                key={badge.id}
                                                className={`
                                                   flex items-center gap-3 p-3 shadow-md
                                                   ${badge.earned
                                                        ? 'bg-[var(--color-surface)]'
                                                        : 'border border-dashed border-[var(--color-secondary)]/30'
                                                    }
                                                   rounded-lg
                                               `}
                                            >
                                                <div className={`
                                                   w-10 h-10 rounded-lg
                                                   flex items-center justify-center
                                                   ${badge.earned ? badge.color : 'text-[var(--color-secondary)]'}
                                                   ${badge.earned
                                                        ? 'bg-[var(--color-surface)]'
                                                        : 'bg-[var(--color-secondary)]/10'
                                                    }
                                               `}>
                                                    {Icon && <Icon className="w-5 h-5" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-medium text-[var(--color-text)]">
                                                        {badge.name}
                                                    </h4>
                                                    <p className="text-xs text-[var(--color-secondary)] mt-0.5">
                                                        {badge.description}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="mb-4">
            <div className="bg-gradient-to-br from-[var(--color-xp-gradient-start)] to-[var(--color-xp-gradient-end)] rounded-xl">
                {/* Compact Header - Always Visible */}
                <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                        {/* Level */}
                        <div className="relative">
                            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                                <span className="text-2xl font-bold text-white">{userData.level}</span>
                            </div>
                            <div className="absolute -top-2 right-0 bg-[var(--color-accent)] px-2 py-0.5 
                           rounded-full text-xs font-bold text-white border border-white/20">
                                LEVEL
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="flex-1">
                            <div className="flex justify-between text-sm text-white/90 mb-1">
                                <span>{userData.currentXP.toLocaleString()} XP</span>
                                <div className="text-white/60 text-xs">
                                    {xpToNextLevel.toLocaleString()} XP to Level {userData.level + 1}
                                </div>
                                <span>{userData.nextLevelXP.toLocaleString()} XP</span>
                            </div>
                            <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${xpProgress}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className="h-full bg-white"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors ml-4"
                    >
                        {isExpanded ?
                            <ChevronUp className="w-5 h-5 text-white" /> :
                            <ChevronDown className="w-5 h-5 text-white" />
                        }
                    </button>
                </div>

                {/* Expandable Details */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden border-t border-white/10"
                        >
                            <div className="p-4">
                                <div className="flex flex-col md:flex-row items-start justify-between gap-8">
                                    {/* Stats */}
                                    <div className="flex items-center gap-8">
                                        <div className="group relative">
                                            <div className="flex items-center gap-3">
                                                <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center 
                                               border-2 border-white/30 shadow-lg backdrop-blur-sm
                                               group-hover:bg-white/30 transition-colors">
                                                    <Flame className="w-8 h-8 text-white" />
                                                </div>
                                                <div className="flex flex-col text-white">
                                                    <span className="text-3xl font-bold">{userData.currentStreak}</span>
                                                    <span className="text-sm text-white/90">Day Streak</span>
                                                </div>
                                            </div>
                                            <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full 
                                           bg-black/90 text-white text-xs rounded-lg p-2 w-48
                                           opacity-0 invisible group-hover:opacity-100 group-hover:visible 
                                           transition-all duration-200 text-center">
                                                Maintain your streak by completing tasks daily!
                                            </div>
                                        </div>

                                        <div className="group relative">
                                            <div className="flex items-center gap-3">
                                                <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center 
                                               border-2 border-white/30 shadow-lg backdrop-blur-sm
                                               group-hover:bg-white/30 transition-colors">
                                                    <Trophy className="w-8 h-8 text-white" />
                                                </div>
                                                <div className="flex flex-col text-white">
                                                    <span className="text-3xl font-bold">{unlockedBadges.length}</span>
                                                    <span className="text-sm text-white/90">Achievements</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Recent Achievements */}
                                    <div className="flex-shrink-0">
                                        <div className="bg-white/10 p-4 rounded-lg shadow-md flex flex-col items-start">
                                            <div className="flex items-center justify-between w-full mb-4">
                                                <span className="text-sm font-medium text-white">Recent Achievements</span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setIsModalOpen(true);
                                                    }}
                                                    className="text-sm text-white/80 hover:text-white transition-colors
                                                   hover:underline underline-offset-2 ml-4"
                                                >
                                                    View All
                                                </button>
                                            </div>
                                            {recentAchievements.length === 0 ? (
                                                <div className="text-white/80 text-xs">
                                                    No achievements earned yet.
                                                </div>
                                            ) : (
                                                <div className="flex flex-wrap gap-3 justify-center">
                                                    {recentAchievements.slice(0, 3).map((badge) => {
                                                        const Icon = badge.icon;
                                                        return (
                                                            <div key={badge.id} className="group relative">
                                                                <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center
                                                               border-2 border-white/20 hover:bg-black/30 
                                                               transition-all duration-300 backdrop-blur-sm">
                                                                    <Icon className={`w-9 h-9 ${badge.color}`} />
                                                                </div>
                                                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 
                                                               bg-black/60 text-xs font-medium px-2.5 py-0.5 rounded-full
                                                               backdrop-blur-sm text-white/90 whitespace-nowrap
                                                               border border-white/10 shadow-lg">
                                                                    {badge.name}
                                                                </div>
                                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48
                                                               bg-black/90 backdrop-blur-sm text-white text-xs rounded-lg p-3
                                                               shadow-xl opacity-0 invisible group-hover:opacity-100
                                                               group-hover:visible transition-all duration-200 z-10
                                                               border border-white/10 text-center">
                                                                    <div className="font-medium mb-1">{badge.name}</div>
                                                                    <div className="opacity-80">{badge.description}</div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Achievement Collection"
            >
                <BadgeCollection />
            </Modal>
        </div>
    );
};

UserBadges.propTypes = {
    userData: PropTypes.shape({
        level: PropTypes.number,
        currentXP: PropTypes.number,
        nextLevelXP: PropTypes.number,
        currentStreak: PropTypes.number,
        longestStreak: PropTypes.number
    }).isRequired,
    badges: PropTypes.array.isRequired,
    setBadges: PropTypes.func.isRequired
};

export default UserBadges;
