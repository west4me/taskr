import { db } from './firebase';
import {
  collection,
  getDocs,
  addDoc,
} from 'firebase/firestore';

export const getUserProjects = async (userId) => {
  try {
    const projectsRef = collection(db, 'users', userId, 'projects');
    const snapshot = await getDocs(projectsRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name
    }));
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
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