import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { useDispatch } from 'react-redux';
import { supabase } from './services/supabaseClient';
import { setSession, clearSession, fetchProfile, setAuthLoading } from './store/slices/authSlice';
import 'react-toastify/dist/ReactToastify.css';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';

// Auth Pages
import AuthLayout from './pages/auth/AuthLayout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Dashboard Pages
import DashboardHome from './pages/dashboard/DashboardHome';
import ProfileSettings from './pages/dashboard/ProfileSettings';
import ExamsList from './pages/dashboard/admin/ExamsList';
import CreateExam from './pages/dashboard/admin/CreateExam';
import ManageCategories from './pages/dashboard/admin/ManageCategories';
import ExamDetails from './pages/dashboard/admin/ExamDetails';
import UsersList from './pages/dashboard/admin/UsersList';

// User Pages
import AvailableExams from './pages/dashboard/user/AvailableExams';
import TakeExam from './pages/dashboard/user/TakeExam';
import ExamResult from './pages/dashboard/user/ExamResult';
import UserHistory from './pages/dashboard/user/UserHistory';

// Public Pages
import TakePublicExam from './pages/public/TakePublicExam';
import LandingPage from './pages/LandingPage';

// Placeholder Pages for Routes
const PlaceholderPage = ({ title }) => (
  <div>
    <h2>{title}</h2>
    <p>This feature is coming soon.</p>
  </div>
);

const NotFound = () => <div className="not-found-container"><h1>404 Not Found</h1></div>;

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        dispatch(fetchProfile(session.user.id));
        dispatch(setSession({ user: session.user, profile: null })); 
      } else {
        dispatch(setAuthLoading(false));
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        dispatch(clearSession());
      }
    });

    return () => subscription.unsubscribe();
  }, [dispatch]);

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        {/* <Route path="/public/exams" element={<PublicExams />} /> */}
        {/* <Route path="/public/take-exam/:examId" element={<TakePublicExam />} /> */}
        
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Dashboard Routes (Publicly Accessible Layout) */}
        <Route 
          path="/dashboard" 
          element={<DashboardLayout />} 
        >
          <Route index element={<DashboardHome />} />
          
          {/* Publicly Accessible Sub-routes */}
          <Route path="available-exams" element={<AvailableExams />} />
          <Route path="take-exam/:examId" element={<TakeExam />} /> {/* TakeExam checks user inside? No, TakeExam saves to DB. */}
          {/* We need a route for public taking. */}
          <Route path="public/take-exam/:examId" element={<TakePublicExam />} />

          {/* Protected Sub-routes */}
          <Route path="profile" element={<ProtectedRoute><ProfileSettings /></ProtectedRoute>} />
          
          {/* Admin Routes */}
          <Route path="exams" element={<ProtectedRoute><ExamsList /></ProtectedRoute>} />
          <Route path="create-exam" element={<ProtectedRoute><CreateExam /></ProtectedRoute>} />
          <Route path="exams/:examId" element={<ProtectedRoute><ExamDetails /></ProtectedRoute>} />
          <Route path="categories" element={<ProtectedRoute><ManageCategories /></ProtectedRoute>} />
          <Route path="users" element={<ProtectedRoute><UsersList /></ProtectedRoute>} />
          
          {/* User Routes (Protected) */}
          {/* TakeExam is protected normally. But we want guests to take public exams. */}
          {/* If user is logged in -> TakeExam. If guest -> TakePublicExam. */}
          {/* We can handle this via navigation links. */}
          
          <Route path="result/:attemptId" element={<ProtectedRoute><ExamResult /></ProtectedRoute>} />
          <Route path="history" element={<ProtectedRoute><UserHistory /></ProtectedRoute>} />
        </Route>

        {/* Redirects */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <ToastContainer position="top-right" autoClose={3000} />
    </Router>
  );
}

export default App;
