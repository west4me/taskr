import { db } from './firebase';
import { updateUserXP, updateStreak } from './userService';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  doc,
  query,
  where,
  arrayUnion,
  getDocs,
  orderBy,
  writeBatch,
  limit,
  increment,
} from 'firebase/firestore';

// ------------------
//     TASKS
// ------------------
export const createTask = async (userId, taskData) => {
  try {
    const tasksRef = collection(db, 'tasks');
    const q = query(
      tasksRef,
      where('userId', '==', userId),
      where('status', '==', taskData.status),
      orderBy('order', 'desc'),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    const highestOrder = querySnapshot.empty ? 0 : querySnapshot.docs[0].data().order || 0;

    const task = {
      ...taskData,
      userId,
      archived: false,
      completed: false,
      createdAt: new Date().toISOString(),
      projects: taskData.projects || [],
      order: highestOrder + 1000,
      commentCount: 0
    };

    const docRef = await addDoc(tasksRef, task);
    return { id: docRef.id, ...task };
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};

export const getUserTasks = async (userId) => {
  try {
    const tasksRef = collection(db, 'tasks');
    const q = query(
      tasksRef,
      where('userId', '==', userId),
      where('archived', '==', false)
    );
    const querySnapshot = await getDocs(q);

    const tasks = querySnapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
      order: docSnap.data().order || 0 // Ensure order exists
    }));

    return tasks.sort((a, b) => (a.order || 0) - (b.order || 0));
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
};

export const updateTask = async (taskId, updates) => {
  try {
    if (!taskId || typeof taskId !== 'string') {
      throw new Error(`updateTask: invalid "taskId" (must be a string). Got: ${taskId}`);
    }

    const taskRef = doc(db, 'tasks', taskId);
    const finalUpdates = {
      ...updates,
      ...(typeof updates.completed !== 'undefined'
        ? { completedAt: updates.completed ? new Date().toISOString() : null }
        : {}),
    };

    await updateDoc(taskRef, finalUpdates);
    const updatedSnapshot = await getDoc(taskRef);
    if (!updatedSnapshot.exists()) {
      throw new Error(`Task ${taskId} not found after update.`);
    }
    return { id: updatedSnapshot.id, ...updatedSnapshot.data() };
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
};

export const deleteTask = async (taskId) => {
  try {
    const taskRef = doc(db, 'tasks', taskId);
    await deleteDoc(taskRef);
    return taskId;
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

export const handleTaskCompletion = async (userId, taskId, isCompleting) => {
  try {
    console.log('Starting task completion:', { userId, taskId, isCompleting });

    const taskRef = doc(db, 'tasks', taskId);
    const snapshot = await getDoc(taskRef);
    if (!snapshot.exists()) throw new Error(`Task ${taskId} not found`);

    const taskData = snapshot.data();
    console.log('Task data:', taskData);

    const { xp = 0, order, status } = taskData;
    const updates = {
      completed: isCompleting,
      completedAt: isCompleting ? new Date().toISOString() : null,
      order: order || 0,
      status
    };

    await updateDoc(taskRef, updates);
    console.log('Task updated:', updates);

    let updatedXP = null;
    if (xp) {
      const xpChange = isCompleting ? xp : -xp;
      console.log('Updating XP:', { xpChange });
      updatedXP = await updateUserXP(userId, xpChange);
      console.log('XP updated:', updatedXP);
    }

    if (isCompleting) {
      await updateStreak(userId);
    }

    const result = {
      id: taskId,
      xp,
      ...updates,
      userData: updatedXP
    };
    console.log('Returning result:', result);
    return result;

  } catch (error) {
    console.error('Error in handleTaskCompletion:', error);
    throw error;
  }
};



export const updateTaskPositions = async (tasks) => {
  try {
    const MAX_ORDER = Number.MAX_SAFE_INTEGER - 1000;

    const batch = writeBatch(db);
    const maxBatchSize = 500;
    let currentBatch = batch;
    let operationCount = 0;

    const sortedTasks = [...tasks].sort((a, b) => a.order - b.order);

    const normalizedTasks = sortedTasks.map((task, index) => {
      const newOrder = (index + 1) * 1000;
      if (newOrder > MAX_ORDER) {
        return {
          ...task,
          order: (index + 1) * 100
        };
      }
      return {
        ...task,
        order: newOrder
      };
    });

    for (const task of normalizedTasks) {
      const taskRef = doc(db, 'tasks', task.id);
      currentBatch.update(taskRef, {
        order: task.order,
        status: task.status
      });
      operationCount++;

      if (operationCount >= maxBatchSize) {
        await currentBatch.commit();
        currentBatch = writeBatch(db);
        operationCount = 0;
      }
    }

    if (operationCount > 0) {
      await currentBatch.commit();
    }

    return normalizedTasks;
  } catch (error) {
    console.error('Error updating task positions:', error);
    throw error;
  }
};

// ------------------
// Update Task Order Functions
// ------------------
export const updateTaskOrder = async (taskId, newOrder) => {
  try {
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, { order: newOrder });
    console.log(`Task ${taskId} order updated to ${newOrder}`);
  } catch (error) {
    console.error('Error updating task order:', error);
    throw error;
  }
};

export const batchUpdateTaskOrders = async (updates) => {
  try {
    const batch = writeBatch(db);
    updates.forEach(({ taskId, newOrder }) => {
      const taskRef = doc(db, 'tasks', taskId);
      batch.update(taskRef, { order: newOrder });
    });
    await batch.commit();
    console.log('Batch task orders updated successfully.');
  } catch (error) {
    console.error('Error performing batch update for task orders:', error);
    throw error;
  }
};

// ------------------
//     COLUMNS
// ------------------
export const getColumns = async (userId) => {
  try {
    const columnsRef = collection(db, 'users', userId, 'columns');
    const snapshot = await getDocs(columnsRef);

    const columns = snapshot.docs.map((colSnap) => ({
      id: colSnap.id,
      ...colSnap.data(),
      taskIds: colSnap.data().taskIds || [],
      title: colSnap.data().title || 'Untitled Column',
      order: typeof colSnap.data().order === 'number' ? colSnap.data().order : 0,
    }));

    return columns.sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error('Error fetching columns:', error);
    throw error;
  }
};

export const addTaskToColumn = async (userId, columnId, taskId) => {
  try {
    const columnRef = doc(db, 'users', userId, 'columns', columnId);
    const columnSnapshot = await getDoc(columnRef);

    if (!columnSnapshot.exists()) {
      throw new Error('Column does not exist');
    }

    const currentTaskIds = columnSnapshot.data().taskIds || [];
    if (!currentTaskIds.includes(taskId)) {
      await updateDoc(columnRef, {
        taskIds: arrayUnion(taskId),
      });
    }
  } catch (error) {
    console.error('Error adding task to column:', error);
    throw error;
  }
};

export const createColumn = async (userId, columnData) => {
  try {
    const columnsRef = collection(db, 'users', userId, 'columns');
    const order = columnData.order || 0;

    const docRef = await addDoc(columnsRef, {
      ...columnData,
      order,
      createdAt: new Date().toISOString(),
    });

    return {
      id: docRef.id,
      ...columnData,
      order,
    };
  } catch (error) {
    console.error('Error creating column:', error);
    throw error;
  }
};

export const updateColumn = async (userId, columnId, updates) => {
  try {
    const columnRef = doc(db, 'users', userId, 'columns', columnId);
    await updateDoc(columnRef, updates);
    return { id: columnId, ...updates };
  } catch (error) {
    console.error('Error updating column:', error);
    throw error;
  }
};

export const deleteColumn = async (userId, columnId) => {
  try {
    const columnRef = doc(db, 'users', userId, 'columns', columnId);
    await deleteDoc(columnRef);
    return columnId;
  } catch (error) {
    console.error('Error deleting column:', error);
    throw error;
  }
};

// ------------------
//     COMMENTS
// ------------------
export const addTaskComment = async (taskId, userId, comment) => {
  try {
    const commentsRef = collection(db, 'tasks', taskId, 'comments');
    const commentData = {
      userId,
      content: comment,
      createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(commentsRef, commentData);

    // Update the task's comment count
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, {
      commentCount: increment(1)
    });

    return { id: docRef.id, ...commentData };
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

export const getTaskComments = async (taskId) => {
  try {
    const commentsRef = collection(db, 'tasks', taskId, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
};

export const updateTaskComment = async (taskId, commentId, content) => {
  try {
    const commentRef = doc(db, 'tasks', taskId, 'comments', commentId);
    await updateDoc(commentRef, {
      content,
      updatedAt: new Date().toISOString(),
    });
    return { id: commentId, content };
  } catch (error) {
    console.error('Error updating comment:', error);
    throw error;
  }
};

export const deleteTaskComment = async (taskId, commentId) => {
  try {
    const commentRef = doc(db, 'tasks', taskId, 'comments', commentId);
    await deleteDoc(commentRef);

    // Update the task's comment count
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, {
      commentCount: increment(-1)
    });

    return commentId;
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
};

/**
 * Updates the order of tasks in a specific column.
 * @param {string} columnId - The column ID.
 * @param {Array} tasks - List of tasks to reorder within the column.
 */
export const updateColumnTaskOrders = async (columnId, tasks) => {
  try {
    console.log('UpdateColumnTaskOrders:', { columnId, tasks });
    const batch = writeBatch(db);
    tasks.forEach((task, index) => {
      console.log('Updating task order:', {
        taskId: task.id,
        order: index * 1000,
        status: columnId,
        completed: task.completed
      });
      const taskRef = doc(db, 'tasks', task.id);
      batch.update(taskRef, {
        order: index * 1000,
        status: columnId,
      });
    });
    await batch.commit();
    console.log(`Tasks in column ${columnId} updated successfully`);
  } catch (error) {
    console.error(`Error updating tasks in column ${columnId}:`, error);
    throw error;
  }
};
// Add to existing services
export const archiveTask = async (taskId) => {
  try {
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, {
      archived: true,
      archivedAt: new Date().toISOString()
    });
    return taskId;
  } catch (error) {
    console.error('Error archiving task:', error);
    throw error;
  }
};

export const getArchivedTasks = async (userId) => {
  try {
    const tasksRef = collection(db, 'tasks');
    const q = query(
      tasksRef,
      where('userId', '==', userId),
      where('archived', '==', true)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching archived tasks:', error);
    throw error;
  }
};
