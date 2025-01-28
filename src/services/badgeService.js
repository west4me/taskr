import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from './firebase';

const badges = {
    // Starter Achievements
    NOVICE: {
        id: "novice",
        name: "Novice",
        description: "Complete your first task",
        icon: "Award",
        color: "text-emerald-400"
    },
    STREAK_MASTER: {
        id: "streak_master",
        name: "Streak Master",
        description: "Maintain a 7-day streak",
        icon: "Flame",
        color: "text-orange-400"
    },
    POWER_USER: {
        id: "power_user",
        name: "Power User",
        description: "Complete 10 tasks",
        icon: "Zap",
        color: "text-yellow-400"
    },
    XP_HUNTER: {
        id: "xp_hunter",
        name: "XP Hunter",
        description: "Reach level 5",
        icon: "Target",
        color: "text-purple-400"
    },

    // Progress Achievements
    TASK_MASTER: {
        id: "task_master",
        name: "Task Master",
        description: "Complete 100 tasks",
        icon: "CheckCircle",
        color: "text-green-400"
    },
    QUICK_STARTER: {
        id: "quick_starter",
        name: "Quick Starter",
        description: "Complete 5 tasks in one day",
        icon: "Rocket",
        color: "text-amber-500"
    },
    EARLY_BIRD: {
        id: "early_bird",
        name: "Early Bird",
        description: "Complete a task before 8 AM",
        icon: "Sunrise",
        color: "text-rose-400"
    },
    NIGHT_OWL: {
        id: "night_owl",
        name: "Night Owl",
        description: "Complete a task after 10 PM",
        icon: "Moon",
        color: "text-indigo-400"
    },

    // Streak Achievements
    STREAK_WARRIOR: {
        id: "streak_warrior",
        name: "Streak Warrior",
        description: "Maintain a 30-day streak",
        icon: "Swords",
        color: "text-red-500"
    },
    STREAK_LEGEND: {
        id: "streak_legend",
        name: "Streak Legend",
        description: "Maintain a 100-day streak",
        icon: "Crown",
        color: "text-amber-500"
    },
    WEEKEND_WARRIOR: {
        id: "weekend_warrior",
        name: "Weekend Warrior",
        description: "Complete tasks on 5 weekends",
        icon: "CalendarCheck",
        color: "text-teal-400"
    },
    CONSISTENT: {
        id: "consistent",
        name: "Consistent",
        description: "Complete tasks 14 days in a row",
        icon: "Activity",
        color: "text-emerald-500"
    },

    // Special Achievements
    PERFECTIONIST: {
        id: "perfectionist",
        name: "Perfectionist",
        description: "Complete all tasks for a week",
        icon: "Check",
        color: "text-violet-400"
    },
    UNSTOPPABLE: {
        id: "unstoppable",
        name: "Unstoppable",
        description: "Complete 50 tasks without breaking streak",
        icon: "Infinity",
        color: "text-fuchsia-400"
    },
    COMPLETIONIST: {
        id: "completionist",
        name: "Completionist",
        description: "Earn 20 other badges",
        icon: "Award",
        color: "text-amber-600"
    },
    // Task Count Progress
    TASK_250: {
        id: "task_250",
        name: "Task Expert",
        description: "Complete 250 tasks",
        icon: "Trophy",
        color: "text-amber-400"
    },
    TASK_500: {
        id: "task_500",
        name: "Task Legend",
        description: "Complete 500 tasks",
        icon: "Star",
        color: "text-amber-500"
    },

    // Additional Streak Level
    STREAK_60: {
        id: "streak_60",
        name: "Streak Veteran",
        description: "Maintain a 60-day streak",
        icon: "Flame",
        color: "text-orange-500"
    },

    // XP Level Progress
    LEVEL_25: {
        id: "level_25",
        name: "Rising Champion",
        description: "Reach level 25",
        icon: "Award",
        color: "text-yellow-500"
    },
    LEVEL_50: {
        id: "level_50",
        name: "Quest Master",
        description: "Reach level 50",
        icon: "Crown",
        color: "text-amber-500"
    },
    LEVEL_100: {
        id: "level_100",
        name: "Legendary",
        description: "Reach level 100",
        icon: "Star",
        color: "text-fuchsia-500"
    },

    // Task Type Achievements
    PRIORITY_MASTER: {
        id: "priority_master",
        name: "Priority Master",
        description: "Complete 10 high-priority tasks",
        icon: "Target",
        color: "text-red-400"
    },
    CHALLENGE_SEEKER: {
        id: "challenge_seeker",
        name: "Challenge Seeker",
        description: "Complete 5 hard tasks",
        icon: "Dumbbell",
        color: "text-purple-500"
    },
    DEADLINE_CHAMPION: {
        id: "deadline_champion",
        name: "Deadline Champion",
        description: "Complete 10 tasks before deadline",
        icon: "Clock",
        color: "text-cyan-400"
    },

    // Project Achievements
    PROJECT_STARTER: {
        id: "project_starter",
        name: "Project Pioneer",
        description: "Create your first project",
        icon: "FolderPlus",
        color: "text-blue-400"
    },
    PROJECT_MASTER: {
        id: "project_master",
        name: "Project Master",
        description: "Complete 5 projects",
        icon: "Briefcase",
        color: "text-indigo-500"
    }
};

export const checkAndAwardBadges = async (userId, userData, completedTasksCount, taskData) => {
    const userRef = doc(db, 'users', userId);
    try {
        const userDoc = await getDoc(userRef);
        const earnedBadges = userDoc.data().badges || [];
        const newBadges = [];

        // Basic Badge Checks
        if (!earnedBadges.includes(badges.NOVICE.id) && completedTasksCount > 0) {
            newBadges.push(badges.NOVICE);
        }

        if (!earnedBadges.includes(badges.STREAK_MASTER.id) && userData.currentStreak >= 7) {
            newBadges.push(badges.STREAK_MASTER);
        }

        if (!earnedBadges.includes(badges.POWER_USER.id) && completedTasksCount >= 10) {
            newBadges.push(badges.POWER_USER);
        }

        if (!earnedBadges.includes(badges.XP_HUNTER.id) && userData.level >= 5) {
            newBadges.push(badges.XP_HUNTER);
        }

        // Task Count Achievements
        if (!earnedBadges.includes(badges.TASK_MASTER.id) && completedTasksCount >= 100) {
            newBadges.push(badges.TASK_MASTER);
        }

        if (!earnedBadges.includes(badges.TASK_250.id) && completedTasksCount >= 250) {
            newBadges.push(badges.TASK_250);
        }

        if (!earnedBadges.includes(badges.TASK_500.id) && completedTasksCount >= 500) {
            newBadges.push(badges.TASK_500);
        }

        // Streak Achievements
        if (!earnedBadges.includes(badges.STREAK_WARRIOR.id) && userData.currentStreak >= 30) {
            newBadges.push(badges.STREAK_WARRIOR);
        }

        if (!earnedBadges.includes(badges.STREAK_60.id) && userData.currentStreak >= 60) {
            newBadges.push(badges.STREAK_60);
        }

        if (!earnedBadges.includes(badges.STREAK_LEGEND.id) && userData.currentStreak >= 100) {
            newBadges.push(badges.STREAK_LEGEND);
        }

        // Level Achievements
        if (!earnedBadges.includes(badges.LEVEL_25.id) && userData.level >= 25) {
            newBadges.push(badges.LEVEL_25);
        }

        if (!earnedBadges.includes(badges.LEVEL_50.id) && userData.level >= 50) {
            newBadges.push(badges.LEVEL_50);
        }

        if (!earnedBadges.includes(badges.LEVEL_100.id) && userData.level >= 100) {
            newBadges.push(badges.LEVEL_100);
        }
        if (!earnedBadges.includes(badges.NIGHT_OWL.id)) {
            const nightOwlTask = taskData.find(task => {
                if (!task.completed || !task.completedAt) return false;
                const completedHour = new Date(task.completedAt).getHours();
                return completedHour >= 22 || completedHour < 4; // 10 PM to 4 AM
            });
            if (nightOwlTask) {
                newBadges.push(badges.NIGHT_OWL);
            }
        }

        // Task Type Achievement Checks
        if (taskData) {
            // Priority Master check
            if (!earnedBadges.includes(badges.PRIORITY_MASTER.id)) {
                const highPriorityCount = taskData.filter(task =>
                    task.completed && task.priority === 'high'
                ).length;
                if (highPriorityCount >= 10) {
                    newBadges.push(badges.PRIORITY_MASTER);
                }
            }

            // Challenge Seeker check
            if (!earnedBadges.includes(badges.CHALLENGE_SEEKER.id)) {
                const hardTaskCount = taskData.filter(task =>
                    task.completed && task.difficulty === 'hard'
                ).length;
                if (hardTaskCount >= 5) {
                    newBadges.push(badges.CHALLENGE_SEEKER);
                }
            }

            // Deadline Champion check
            if (!earnedBadges.includes(badges.DEADLINE_CHAMPION.id)) {
                const beforeDeadlineCount = taskData.filter(task => {
                    if (!task.completed || !task.deadline) return false;
                    const completedDate = new Date(task.completedAt);
                    const deadline = new Date(task.deadline);
                    return completedDate < deadline;
                }).length;
                if (beforeDeadlineCount >= 10) {
                    newBadges.push(badges.DEADLINE_CHAMPION);
                }
            }
        }

        // Project Achievement Checks
        if (userData.projectStats) {
            if (!earnedBadges.includes(badges.PROJECT_STARTER.id) &&
                userData.projectStats.totalProjects > 0) {
                newBadges.push(badges.PROJECT_STARTER);
            }

            if (!earnedBadges.includes(badges.PROJECT_MASTER.id) &&
                userData.projectStats.completedProjects >= 5) {
                newBadges.push(badges.PROJECT_MASTER);
            }
        }

        if (newBadges.length > 0) {
            await updateDoc(userRef, {
                badges: arrayUnion(...newBadges.map(badge => badge.id))
            });
        }

        return newBadges;
    } catch (error) {
        console.error('Error awarding badges:', error);
        throw new Error('Failed to check and award badges.');
    }
};

export const getAllBadges = () => Object.values(badges);

export const getUserBadges = async (userId) => {
    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        const earnedBadgeIds = userDoc.data().badges || [];
        return Object.values(badges).map((badge) => ({
            ...badge,
            earned: earnedBadgeIds.includes(badge.id),
        }));
    } catch (error) {
        console.error("Error fetching user badges:", error);
        throw new Error("Failed to fetch user badges.");
    }
};
