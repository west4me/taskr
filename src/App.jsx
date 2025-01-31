import { AuthProvider } from './contexts/AuthContext';
import { TaskProvider } from './contexts/TaskContext';
import useAuth from './contexts/AuthContext/useAuth';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/dashboard/Dashboard';
import ProjectView from './components/projects/ProjectView';
import LoginForm from './components/auth/LoginForm';

const PrivateRoute = ({ children }) => {
    const auth = useAuth();
    return auth?.user ? children : <Navigate to="/taskr/login" />;
};

const AppContent = () => {
    const auth = useAuth();

    if (!auth?.user) {
        return <LoginForm />;
    }

    return (
        <TaskProvider>
            <Routes>
                {/* Specific routes first */}
                <Route path="/taskr/project/:projectId" element={
                    <PrivateRoute>
                        <ProjectView />
                    </PrivateRoute>
                } />
                <Route path="/taskr" element={
                    <PrivateRoute>
                        <Dashboard />
                    </PrivateRoute>
                } />

                <Route path="/taskr/login" element={<LoginForm />} />

                {/* Redirects last */}
                <Route path="/" element={<Navigate to="/taskr" replace />} />
                <Route path="*" element={<Navigate to="/taskr" replace />} />
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