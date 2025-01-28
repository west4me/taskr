import { AuthProvider } from './contexts/AuthContext';
import useAuth from './contexts/AuthContext/useAuth';
import Dashboard from './components/dashboard/Dashboard';
import LoginForm from './components/auth/LoginForm';

const AppContent = () => {
    const auth = useAuth();
    return auth?.user ? <Dashboard /> : <LoginForm />;
};

export default function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}