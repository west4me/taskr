import { useState } from 'react';
import useAuth from '../../contexts/AuthContext/useAuth';
import { motion } from 'framer-motion';
import { Mail, AlertCircle } from 'lucide-react';
import { Chrome } from 'lucide-react';

const LoginForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isPersistent, setIsPersistent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, signup, loginWithGoogle, sendPasswordReset } = useAuth();

  // Helper function for user-friendly error messages
  const getErrorMessage = (code) => {
    const errorMessages = {
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/user-not-found': 'No account found with this email.',
      'auth/email-already-in-use': 'An account already exists with this email.',
      'auth/weak-password': 'Password should be at least 6 characters.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/popup-closed-by-user': 'Sign-in popup was closed. Please try again.',
    };
    return errorMessages[code] || 'An error occurred. Please try again.';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      if (isLogin) {
        await login(email, password, isPersistent);
      } else {
        await signup(email, password);
      }
    } catch (err) {
      setError(getErrorMessage(err.code));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      await loginWithGoogle();
    } catch (err) {
      setError(getErrorMessage(err.code));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }

    setIsLoading(true);
    try {
      await sendPasswordReset(email);
      setSuccessMessage('Password reset email sent! Please check your inbox.');
      setError('');
    } catch (err) {
      setError(getErrorMessage(err.code));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[var(--color-surface)] p-8 rounded-xl max-w-md w-full"
      >
        <h1 className="text-2xl font-bold text-[var(--color-text)] mb-6">
          {isLogin ? 'Welcome Back!' : 'Create Account'}
        </h1>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-[var(--color-error)]/10 border border-[var(--color-error)] 
                     text-[var(--color-error)] rounded-lg p-3 mb-4 flex items-center gap-2"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Success Message */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-[var(--color-success)]/10 border border-[var(--color-success)] 
                     text-[var(--color-success)] rounded-lg p-3 mb-4"
          >
            {successMessage}
          </motion.div>
        )}

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)]/70 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg px-4 py-2 bg-[var(--color-surface)]
                       border border-[var(--color-secondary)]/30 
                       text-[var(--color-text)] focus:outline-none 
                       focus:border-[var(--color-primary)]"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text)]/70 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg px-4 py-2 bg-[var(--color-surface)]
                       border border-[var(--color-secondary)]/30 
                       text-[var(--color-text)] focus:outline-none 
                       focus:border-[var(--color-primary)]"
              required
              disabled={isLoading}
            />
          </div>

          {/* Remember Me Checkbox */}
          {isLogin && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                checked={isPersistent}
                onChange={(e) => setIsPersistent(e.target.checked)}
                className="rounded border-[var(--color-secondary)]"
                disabled={isLoading}
              />
              <label htmlFor="remember" className="text-sm text-[var(--color-text)]/70">
                Remember me
              </label>
            </div>
          )}

          <button
            type="submit"
            className="w-full btn-primary py-2 flex items-center justify-center gap-2"
            disabled={isLoading}
          >
            <Mail className="w-5 h-5" />
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>

          {/* Password Reset */}
          {isLogin && (
            <button
              type="button"
              onClick={handlePasswordReset}
              className="w-full text-[var(--color-primary)] text-sm hover:underline"
              disabled={isLoading}
            >
              Forgot your password?
            </button>
          )}

          {/* Social Login */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--color-secondary)]/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[var(--color-surface)] text-[var(--color-text)]/60">
                Or continue with
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full btn btn-secondary flex items-center justify-center gap-2"
            disabled={isLoading}
          >
            <Chrome className="w-5 h-5" />
            Google
          </button>

          {/* Toggle Login/Register */}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setSuccessMessage('');
            }}
            className="w-full text-center text-[var(--color-text)]/60 
                     hover:text-[var(--color-text)] mt-4 transition-colors"
            disabled={isLoading}
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default LoginForm;