import { doc, getDoc, setDoc, updateDoc, collection, getDocs, writeBatch, query, where, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

// 🔄 Subscribe to real-time XP updates (used by UI components)
export const subscribeToXP = (userId, callback) => {
    if (!userId) {
        console.warn("⚠️ subscribeToXP called with no userId");
        return () => { }; // Return empty function to avoid errors
    }

    const userRef = doc(db, "users", userId);

    console.log("📡 subscribeToXP CALLED - Listening for XP changes for:", userId);

    return onSnapshot(userRef, (snapshot) => {
        if (snapshot.exists()) {
            const userData = snapshot.data();
            console.log("🔥 Firestore XP Update Received:", userData.totalXP);
            callback(userData.totalXP);
        } else {
            console.warn("⚠️ No XP data found in Firestore for user:", userId);
        }
    }, (error) => {
        console.error("❌ Error in subscribeToXP:", error);
    });
};

// 📌 Initialize user profile if it doesn't exist
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

// 📌 Get user profile from Firestore
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

// 📌 Fetch current XP for user
export const getUserXP = async (userId) => {
    try {
        const userRef = doc(db, 'users', userId);
        const docSnap = await getDoc(userRef);
        return docSnap.exists() ? docSnap.data().currentXP : 0;
    } catch (error) {
        console.error("Error fetching user XP:", error);
        throw error;
    }
};

// 📌 Update user XP when completing tasks
export const updateUserXP = async (userId, xpChange) => {
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();

        let { totalXP, currentXP, level, nextLevelXP } = userData;

        totalXP = Math.max(0, totalXP + xpChange);
        currentXP = Math.max(0, currentXP + xpChange);

        // Level-up logic
        if (xpChange > 0) {
            while (currentXP >= nextLevelXP) {
                level += 1;
                nextLevelXP = calculateNextLevelXP(level);
            }
        } else if (xpChange < 0) {
            while (currentXP < calculateNextLevelXP(level - 1) && level > 1) {
                level -= 1;
                nextLevelXP = calculateNextLevelXP(level);
            }
        }

        const updates = { totalXP, currentXP, level, nextLevelXP };

        await updateDoc(userRef, updates);
        console.log("✅ XP successfully updated:", updates);

        return updates;
    } catch (error) {
        console.error('Error updating user XP:', error);
        throw error;
    }
};

// 📌 Update user streaks based on login activity
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
            // Reset streak if not active yesterday
            currentStreak = 1;
        }

        await updateDoc(userRef, {
            lastActiveDate: today,
            currentStreak,
            longestStreak
        });

        console.log("🔥 Streak updated:", { currentStreak, longestStreak });
        return { currentStreak, longestStreak };
    } catch (error) {
        console.error('Error updating streak:', error);
        throw error;
    }
};

// 📌 XP curve formula for leveling up
const calculateNextLevelXP = (level) => {
    return Math.round(1000 * Math.pow(1.2, level - 1));
};

// 📌 Delete all user data
export const deleteAllUserData = async (userId, onSuccess) => {
    try {
        const batch = writeBatch(db);
        const userDocRef = doc(db, 'users', userId);
        const collectionsToDelete = ['tasks', 'columns', 'projects', 'badges'];

        let operationCount = 0;
        let currentBatch = batch;

        for (const collectionName of collectionsToDelete) {
            const collectionRef = collection(db, collectionName);
            const q = query(collectionRef, where('userId', '==', userId));
            const docs = await getDocs(q);

            for (const docSnap of docs.docs) {
                currentBatch.delete(docSnap.ref);
                operationCount++;

                if (operationCount >= 499) {
                    await currentBatch.commit();
                    currentBatch = writeBatch(db);
                    operationCount = 0;
                }
            }
        }

        // Reset user profile
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

        if (operationCount > 0) {
            await currentBatch.commit();
        }

        console.log("✅ All user data deleted successfully");
        if (typeof onSuccess === 'function') onSuccess();
        return true;
    } catch (error) {
        console.error('Error deleting user data:', error);
        throw error;
    }
};
