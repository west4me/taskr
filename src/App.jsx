import { AuthProvider } from './contexts/AuthContext';
import { TaskProvider } from './contexts/TaskContext';
import useAuth from './contexts/AuthContext/useAuth';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/dashboard/Dashboard';
import ProjectView from './components/projects/ProjectView';
import LoginForm from './components/auth/LoginForm';

const PrivateRoute = ({ children }) => {
    const auth = useAuth();
    return auth?.user ? children : <Navigate to="/login" />;
};

const AppContent = () => {
    const auth = useAuth();

    if (!auth?.user) {
        return <LoginForm />;
    }

    return (
        <TaskProvider>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/login" element={<LoginForm />} />
                <Route
                    path="/project/:projectId"
                    element={
                        <PrivateRoute>
                            <ProjectView />
                        </PrivateRoute>
                    }
                />
                {/* Catch-all redirect to home */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </TaskProvider>
    );
};

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </BrowserRouter>
    );
}