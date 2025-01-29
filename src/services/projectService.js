import { db } from './firebase';
import useAuth from '../contexts/AuthContext/useAuth';
import {
  collection,
  getDocs,
  addDoc,
} from 'firebase/firestore';

export const getUserProjects = async () => {
  try {
    const { user } = useAuth(); // Get current user
    if (!user || !user.uid) {
      console.error("getUserProjects: userId is undefined");
      return [];
    }

    const projectsRef = collection(db, 'users', user.uid, 'projects');
    const snapshot = await getDocs(projectsRef);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name || 'Untitled Project',
    }));
  } catch (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
};

export const addProject = async (userId, projectName) => {
  try {
    const projectsRef = collection(db, 'users', userId, 'projects');
    const docRef = await addDoc(projectsRef, {
      name: projectName,
      createdAt: new Date().toISOString(),
    });
    return {
      id: docRef.id,
      name: projectName
    };
  } catch (error) {
    console.error('Error adding project:', error);
    throw error;
  }
};