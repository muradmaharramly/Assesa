import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FiAward, FiClipboard, FiCheckCircle, FiUsers, FiTrendingUp, FiPlay, FiActivity, FiCalendar, FiBarChart2 } from 'react-icons/fi';
import { supabase } from '../../services/supabaseClient';
import { FadeLoader } from 'react-spinners';
import { fetchPublicExams } from '../../store/slices/examSlice';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';

const StatCard = ({ title, value, icon, variant, loading }) => {
  const colorMap = {
    primary: 'var(--primary-color)',
    success: 'var(--success-color)',
    warning: 'var(--warning-color)'
  };

  return (
    <div className="stat-card">
      <div className="stat-content">
        <p>{title}</p>
        {loading ? (
          <FadeLoader height={6} width={2} margin={-1} color={colorMap[variant] || colorMap.primary} />
        ) : (
          <h3>{value}</h3>
        )}
      </div>
      <div className={`stat-icon ${variant}`}>
        {icon}
      </div>
    </div>
  );
};

const RecentActivity = ({ attempts, loading, showUser = false }) => {
  if (loading) return <div className="dashboard-section"><FadeLoader color="var(--primary-color)" /></div>;

  return (
    <div className="dashboard-section">
      <div className="section-header">
        <h3><FiActivity style={{ marginRight: '0.5rem' }} /> Recent Activity</h3>
        <Link to="/dashboard/history" className="view-all">View All</Link>
      </div>
      
      <div className="activity-list">
        {attempts.length === 0 ? (
          <p className="no-data-text">No recent activity found.</p>
        ) : (
          attempts.map((attempt) => {
             const scorePercentage = attempt.total_questions > 0 ? Math.round((attempt.score / attempt.total_questions) * 100) : 0;
             let scoreClass = 'bad';
             if (scorePercentage >= 80) scoreClass = 'good';
             else if (scorePercentage >= 60) scoreClass = 'average';

             return (
              <div key={attempt.id} className="activity-item">
                <div className="activity-info">
                  <div className="activity-icon">
                    <FiCheckCircle />
                  </div>
                  <div className="activity-details">
                    <h4>
                      {showUser && attempt.profiles?.full_name && (
                        <>
                          <span style={{color: 'var(--primary-color)'}}>{attempt.profiles.full_name}</span>
                          <span style={{color: 'var(--text-secondary)', margin: '0 0.5rem'}}>/</span>
                        </>
                      )}
                      {attempt.exams?.title || 'Unknown Exam'}
                    </h4>
                    <span>{new Date(attempt.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className={`activity-score ${scoreClass}`}>
                  {scorePercentage}%
                </div>
              </div>
             );
          })
        )}
      </div>
    </div>
  );
};

const NewestUsers = ({ users, loading }) => {
  if (loading) return <div className="dashboard-section"><FadeLoader color="var(--primary-color)" /></div>;

  return (
    <div className="dashboard-section">
      <div className="section-header">
        <h3><FiUsers style={{ marginRight: '0.5rem' }} /> Newest Users</h3>
        <Link to="/dashboard/users" className="view-all">View All</Link>
      </div>
      <div className="activity-list">
        {users.length === 0 ? (
           <p className="no-data-text">No users found.</p>
        ) : (
          users.map(user => (
            <div key={user.id} className="activity-item">
              <div className="activity-info">
                <div className="activity-icon">
                  <FiUsers />
                </div>
                <div className="activity-details">
                  <h4>{user.full_name || 'No Name'}</h4>
                  <span>{user.email}</span>
                </div>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {new Date(user.created_at).toLocaleDateString()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const PerformanceChart = ({ data, loading }) => {
  if (loading) return <div className="dashboard-section"><FadeLoader color="var(--primary-color)" /></div>;

  return (
    <div className="dashboard-section">
      <div className="section-header">
        <h3><FiBarChart2 style={{ marginRight: '0.5rem' }} /> Performance Overview</h3>
      </div>
      
      {data.length === 0 ? (
        <p className="no-data-text">Not enough data to display chart.</p>
      ) : (
        <div className="performance-chart">
          {data.map((item, index) => (
            <div key={index} className="chart-bar-container">
              <div className="bar" style={{ height: `${item.score}%` }}>
                <div className="tooltip">{item.score}%</div>
              </div>
              <div className="label" title={item.label}>{item.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    usersCount: 0,
    activeExamsCount: 0,
    attemptsCount: 0,
    avgScore: 0
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentAttempts, setRecentAttempts] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [users, exams, attempts, recentUsersData, recentAttemptsData] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('exams').select('*', { count: 'exact', head: true }).eq('is_active', true),
          supabase.from('exam_attempts').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(5),
          supabase
            .from('exam_attempts')
            .select('id, score, total_questions, created_at, exams(title), profiles(full_name)')
            .order('created_at', { ascending: false })
            .limit(20)
        ]);

        // Calculate average score from recent attempts (sample)
        let avgScore = 0;
        const attemptsList = recentAttemptsData.data || [];
        if (attemptsList.length > 0) {
            const totalPercentage = attemptsList.reduce((acc, curr) => {
                const total = curr.total_questions || 1;
                return acc + (curr.score / total) * 100;
            }, 0);
            avgScore = Math.round(totalPercentage / attemptsList.length);
        }

        setStats({
          usersCount: users.count || 0,
          activeExamsCount: exams.count || 0,
          attemptsCount: attempts.count || 0,
          avgScore: `${avgScore}%`
        });
        setRecentUsers(recentUsersData.data || []);
        setRecentAttempts(attemptsList.slice(0, 5));

        // Prepare Chart Data (Last 10 attempts reversed)
        const chartData = attemptsList.slice(0, 10).reverse().map(attempt => ({
            label: attempt.exams?.title ? attempt.exams.title.substring(0, 10) + '...' : 'Exam',
            score: attempt.total_questions > 0 ? Math.round((attempt.score / attempt.total_questions) * 100) : 0
        }));
        setChartData(chartData);

      } catch (error) {
        console.error('Error fetching admin stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <>
      <div className="dashboard-grid">
        <StatCard title="Total Users" value={stats.usersCount} icon={<FiUsers />} variant="primary" loading={loading} />
        <StatCard title="Active Exams" value={stats.activeExamsCount} icon={<FiClipboard />} variant="success" loading={loading} />
        <StatCard title="Total Attempts" value={stats.attemptsCount} icon={<FiCheckCircle />} variant="warning" loading={loading} />
        <StatCard title="Avg Platform Score" value={stats.avgScore} icon={<FiBarChart2 />} variant="primary" loading={loading} />
      </div>

      <div className="dashboard-sections-grid">
         <NewestUsers users={recentUsers} loading={loading} />
         <RecentActivity attempts={recentAttempts} loading={loading} showUser={true} />
         <PerformanceChart data={chartData} loading={loading} />
      </div>
    </>
  );
};

const UserDashboard = ({ userId }) => {
  const [stats, setStats] = useState({
    examsTaken: 0,
    averageScore: 0,
    availableExams: 0,
  });
  const [recentAttempts, setRecentAttempts] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!userId) return;

      try {
        // Fetch user attempts
        const { data: attempts, error: attemptsError } = await supabase
          .from('exam_attempts')
          .select('id, score, total_questions, created_at, exams(title)')
          .eq('user_id', userId)
          .eq('status', 'completed')
          .order('created_at', { ascending: false });

        // Fetch active exams count
        const { count: examsCount, error: examsError } = await supabase
          .from('exams')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true);

        if (attemptsError || examsError) throw new Error('Failed to fetch stats');

        let avgScore = 0;
        if (attempts && attempts.length > 0) {
          const totalPercentage = attempts.reduce((acc, curr) => {
            const total = curr.total_questions || 1; 
            return acc + (curr.score / total) * 100;
          }, 0);
          avgScore = Math.round(totalPercentage / attempts.length);
        }

        setStats({
          examsTaken: attempts?.length || 0,
          averageScore: `${avgScore}%`,
          availableExams: examsCount || 0,
        });

        // Prepare Recent Activity (Last 5)
        setRecentAttempts(attempts.slice(0, 5));

        // Prepare Chart Data (Last 5 reversed for chronological order)
        const chartData = attempts.slice(0, 5).reverse().map(attempt => ({
            label: attempt.exams?.title || 'Exam',
            score: attempt.total_questions > 0 ? Math.round((attempt.score / attempt.total_questions) * 100) : 0
        }));
        setChartData(chartData);

      } catch (error) {
        console.error('Error fetching user stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId]);

  return (
    <>
      <div className="dashboard-grid">
        <StatCard title="Exams Taken" value={stats.examsTaken} icon={<FiAward />} variant="primary" loading={loading} />
        <StatCard title="Average Score" value={stats.averageScore} icon={<FiTrendingUp />} variant="success" loading={loading} />
        <StatCard title="Available Exams" value={stats.availableExams} icon={<FiClipboard />} variant="warning" loading={loading} />
      </div>

      <div className="dashboard-sections-grid">
        <RecentActivity attempts={recentAttempts} loading={loading} />
        <PerformanceChart data={chartData} loading={loading} />
      </div>
    </>
  );
};

const GuestDashboard = () => {
    const dispatch = useDispatch();
    const { exams, loading } = useSelector((state) => state.exams);
    
    useEffect(() => {
        dispatch(fetchPublicExams());
    }, [dispatch]);

    const activeExams = exams.filter(exam => exam.is_active && exam.is_public);

    return (
        <div>
            <div className="dashboard-grid">
              <StatCard title="Available Mock Exams" value={activeExams.length} icon={<FiClipboard />} variant="primary" loading={loading} />
              <div className="guest-promo-card">
                 <h3>Join Us!</h3>
                 <p>Register to save your progress and access more exams.</p>
                 <Link to="/register"><Button size="sm" fullWidth>Register Now</Button></Link>
              </div>
            </div>

            <h2 className="section-title">Public Mock Exams</h2>
            <div className="exams-list-grid">
              {activeExams.map((exam) => (
                <div key={exam.id} className="dashboard-exam-card">
                  <h3>{exam.title}</h3>
                  <div className="exam-meta">
                    <span>{exam.duration_minutes} mins</span>
                    <span>{exam.questions?.length || exam.questions?.[0]?.count || 0} questions</span>
                  </div>
                  <Link to={`/dashboard/public/take-exam/${exam.id}`}>
                    <Button size="sm"><FiPlay /> Start Mock Exam</Button>
                  </Link>
                </div>
              ))}
              {!loading && activeExams.length === 0 && <p className="no-data-text">No public exams available.</p>}
            </div>
        </div>
    );
};

const DashboardHome = () => {
  const { profile, user } = useSelector((state) => state.auth);

  if (!user) {
      return (
          <div>
            <div className="dashboard-header">
              <h2>Welcome to Assesa</h2>
              <p>Free public mock exams are available below.</p>
            </div>
            <GuestDashboard />
          </div>
      );
  }

  return (
    <div>
      <div className="dashboard-header">
        <h2>Welcome back, {profile?.full_name}</h2>
      </div>
      {profile?.role === 'admin' ? (
        <AdminDashboard />
      ) : (
        <UserDashboard userId={user?.id} />
      )}
    </div>
  );
};

export default DashboardHome;
