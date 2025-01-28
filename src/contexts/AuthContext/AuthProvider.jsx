import { useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { auth } from '../../services/firebase';
import PropTypes from 'prop-types';
import { initializeUserProfile } from '../../services/userService';
import AuthContext from './AuthContext';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await initializeUserProfile(user.uid);
      }
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Enhanced login with persistence
  const login = async (email, password, isPersistent = false) => {
    await setPersistence(auth,
      isPersistent ? browserLocalPersistence : browserSessionPersistence
    );
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result;
  };

  const signup = async (email, password) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await initializeUserProfile(result.user.uid);
    return result;
  };

  const logout = () => signOut(auth);

  // Google Sign-in method
  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    await initializeUserProfile(result.user.uid);
    return result;
  };

  // Password Reset method
  const sendPasswordReset = (email) => sendPasswordResetEmail(auth, email);

  const value = {
    user,
    login,
    signup,
    logout,
    loginWithGoogle,
    sendPasswordReset
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthProvider;