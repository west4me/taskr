import { doc, getDoc, setDoc, updateDoc, collection, getDocs, writeBatch, query, where } from 'firebase/firestore';
import { db } from './firebase';

export const initializeUserProfile = async (userId) => {
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            const userData = {
                level: 1,
                currentXP: 0,
                totalXP: 0,
                currentStreak: 0,
                longestStreak: 0,
                lastActiveDate: new Date().toISOString().split('T')[0],
                nextLevelXP: 1000, // XP needed for level 2
            };
            await setDoc(userRef, userData);
            return userData;
        }

        return userSnap.data();
    } catch (error) {
        console.error('Error initializing user profile:', error);
        throw error;
    }
};

export const getUserProfile = async (userId) => {
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            return await initializeUserProfile(userId);
        }

        return userSnap.data();
    } catch (error) {
        console.error('Error getting user profile:', error);
        throw error;
    }
};

export const updateUserXP = async (userId, xpChange) => {
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();

        const newTotalXP = Math.max(0, userData.totalXP + xpChange);
        const newCurrentXP = Math.max(0, userData.currentXP + xpChange);

        let { level, nextLevelXP } = userData;

        if (xpChange > 0) {
            while (newCurrentXP >= nextLevelXP) {
                level += 1;
                nextLevelXP = calculateNextLevelXP(level);
            }
        } else if (xpChange < 0) {
            while (newCurrentXP < calculateNextLevelXP(level - 1) && level > 1) {
                level -= 1;
                nextLevelXP = calculateNextLevelXP(level);
            }
        }

        const updates = {
            totalXP: newTotalXP,
            currentXP: newCurrentXP,
            level,
            nextLevelXP
        };

        await updateDoc(userRef, updates);
        return updates;
    } catch (error) {
        console.error('Error updating user XP:', error);
        throw error;
    }
};

export const updateStreak = async (userId) => {
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();

        const today = new Date().toISOString().split('T')[0];
        const lastActive = userData.lastActiveDate;

        let { currentStreak, longestStreak } = userData;

        // If last active was yesterday, increment streak
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastActive === yesterdayStr) {
            currentStreak += 1;
            longestStreak = Math.max(currentStreak, longestStreak);
        } else if (lastActive !== today) {
            // Reset streak if not active yesterday (and not already logged in today)
            currentStreak = 1;
        }

        await updateDoc(userRef, {
            lastActiveDate: today,
            currentStreak,
            longestStreak
        });

        return { currentStreak, longestStreak };
    } catch (error) {
        console.error('Error updating streak:', error);
        throw error;
    }
};

const calculateNextLevelXP = (level) => {
    // Basic XP curve: each level requires 20% more XP than the previous
    return Math.round(1000 * Math.pow(1.2, level - 1));
};

export const deleteAllUserData = async (userId, onSuccess) => {
    try {
        // Create a new batch
        const batch = writeBatch(db);

        // 1. Delete tasks and their comments
        const tasksRef = collection(db, 'tasks');
        const tasksQuery = query(tasksRef, where('userId', '==', userId));
        const tasksDocs = await getDocs(tasksQuery);

        // We might need multiple batches if there are many documents
        let operationCount = 0;
        let currentBatch = batch;

        for (const taskDoc of tasksDocs.docs) {
            // Get comments for this task
            const commentsRef = collection(taskDoc.ref, 'comments');
            const comments = await getDocs(commentsRef);

            // Delete comments
            for (const comment of comments.docs) {
                currentBatch.delete(comment.ref);
                operationCount++;

                if (operationCount >= 499) {
                    await currentBatch.commit();
                    currentBatch = writeBatch(db);
                    operationCount = 0;
                }
            }

            // Delete the task
            currentBatch.delete(taskDoc.ref);
            operationCount++;

            if (operationCount >= 499) {
                await currentBatch.commit();
                currentBatch = writeBatch(db);
                operationCount = 0;
            }
        }

        // 2. Delete user's sub-collections
        const userDocRef = doc(db, 'users', userId);
        const subCollections = ['columns', 'projects', 'badges'];

        for (const collectionName of subCollections) {
            const collectionRef = collection(userDocRef, collectionName);
            const docs = await getDocs(collectionRef);

            for (const doc of docs.docs) {
                currentBatch.delete(doc.ref);
                operationCount++;

                if (operationCount >= 499) {
                    await currentBatch.commit();
                    currentBatch = writeBatch(db);
                    operationCount = 0;
                }
            }
        }

        // 3. Reset the user document
        currentBatch.update(userDocRef, {
            level: 1,
            currentXP: 0,
            totalXP: 0,
            currentStreak: 0,
            longestStreak: 0,
            lastActiveDate: null,
            nextLevelXP: 1000,
            badges: []
        });

        // Commit any remaining operations
        if (operationCount > 0) {
            await currentBatch.commit();
        }

        console.log('All user data deleted successfully');
        // Call the success callback if provided
        if (typeof onSuccess === 'function') {
            onSuccess();
        }
        return true;

    } catch (error) {
        console.error('Error deleting user data:', error);
        throw error;
    }
};