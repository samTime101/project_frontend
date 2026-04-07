import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ExpensesView from './pages/ExpensesView';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';

const PrivateRoute = ({ children }) => {
  const isAuth = !!localStorage.getItem('auth_tokens');
  return isAuth ? children : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        
        <Route path="/" element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="expenses" element={<ExpensesView />} />
        </Route>
      </Routes>
    </Router>
  );
}
