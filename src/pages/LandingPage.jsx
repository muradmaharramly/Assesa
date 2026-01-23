import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { fetchPublicExams } from '../store/slices/examSlice';
import { FiPlay, FiClock, FiHelpCircle, FiCheckCircle, FiTrendingUp, FiShield, FiEye, FiSun, FiMoon, FiSearch, FiFilter } from 'react-icons/fi';
import Button from '../components/ui/Button';
import CustomSelect from '../components/ui/CustomSelect';
import { FadeLoader } from 'react-spinners';
import { useTheme } from '../context/ThemeContext';
import { BsLightningCharge } from 'react-icons/bs';
import { supabase } from '../services/supabaseClient';

const CountUp = ({ end, duration = 2000, suffix = '' }) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
        }
      },
      { threshold: 0.1 }
    );
    
    if (countRef.current) {
      observer.observe(countRef.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated]);

  useEffect(() => {
    if (!hasAnimated) return;
    
    let startTime = null;
    let animationFrame;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      
      // Easing function: easeOutExpo
      const ease = percentage === 1 ? 1 : 1 - Math.pow(2, -10 * percentage);
      
      setCount(Math.floor(end * ease));

      if (progress < duration) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [hasAnimated, end, duration]);

  return <span ref={countRef}>{count}{suffix}</span>;
};

const LandingPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { exams, loading } = useSelector((state) => state.exams);
  const { user } = useSelector((state) => state.auth);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [statusFilter, setStatusFilter] = useState('active'); // Default to active for public landing page
  const [categories, setCategories] = useState([]);
  const [visibleCount, setVisibleCount] = useState(6);

  useEffect(() => {
    dispatch(fetchPublicExams());
    const fetchCategories = async () => {
        const { data } = await supabase.from('categories').select('*');
        if (data) setCategories(data);
    };
    fetchCategories();
  }, [dispatch]);

  // Filter only public exams (fetchPublicExams already filters by is_public, but just in case)
  const publicExams = exams.filter(exam => exam.is_public);
  
  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...categories.map(cat => ({ value: cat.id, label: cat.name }))
  ];

  const difficultyOptions = [
    { value: '', label: 'All Difficulties' },
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' }
  ];

  const filteredExams = publicExams.filter(exam => {
    const matchesSearch = 
        exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (exam.description && exam.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (exam.categories?.name && exam.categories.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory ? exam.category_id === selectedCategory : true;
    const matchesDifficulty = selectedDifficulty ? exam.difficulty === selectedDifficulty : true;

    let matchesStatus = true;
    if (statusFilter === 'active') matchesStatus = exam.is_active;
    if (statusFilter === 'inactive') matchesStatus = !exam.is_active;

    return matchesSearch && matchesCategory && matchesDifficulty && matchesStatus;
  });

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 6);
  };

  return (
    <div className="landing-page">
      {/* Navbar */}
      <nav className="landing-nav">
        <div className="container">
          <div className="logo">
            <h2>Assesa</h2>
          </div>
          <div className="nav-links">
            <button 
              onClick={toggleTheme} 
              className="theme-toggle-btn"
              title={theme === 'light' ? "Switch to Dark Mode" : "Switch to Light Mode"}
            >
              {theme === 'light' ? <FiMoon size={20} /> : <FiSun size={20} />}
            </button>
            
            {user ? (
              <Link to="/dashboard">
                <Button>Go to Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link to="/login" className="nav-link">Login</Link>
                <Link to="/register">
                  <Button>Register</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero-section">
        {/* Decorative Circuit Lines */}
        <div className="tech-circuit-left"></div>
        <div className="tech-circuit-right"></div>
        
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="icon"><BsLightningCharge /></span> Assesa Platform
            </div>
            <h1>Personalized assessments <br /> for modern learning.</h1>
            <p>
              Deliver dynamic content to your visitors with our comprehensive tools.
              Take mock exams, track your progress, and achieve your goals.
            </p>
            <div className="hero-actions">
              {!user ? (
                <Link to="/register">
                  <Button size="large" className="btn-pill">Get Started</Button>
                </Link>
              ) : (
                <a href="#mock-exams">
                  <Button size="large" className="btn-pill">Try Mock Exams</Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Why Assesa Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2>Why Choose Assesa?</h2>
            <p>We provide the best environment for your self-assessment journey.</p>
          </div>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="icon-box"><FiTrendingUp /></div>
              <h3>Track Progress</h3>
              <p>Detailed analytics and history to help you see how you improve over time.</p>
            </div>
            <div className="feature-card">
              <div className="icon-box"><FiShield /></div>
              <h3>Secure & Reliable</h3>
              <p>Your data is safe with us. Focus on your exams while we handle the rest.</p>
            </div>
            <div className="feature-card">
              <div className="icon-box"><FiClock /></div>
              <h3>Real Exam Feel</h3>
              <p>Timed exams and realistic question formats to prepare you for the real deal.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stat-item">
            <h3><CountUp end={1000} suffix="+" /></h3>
            <p>Active Users</p>
          </div>
          <div className="stat-item">
            <h3><CountUp end={500} suffix="+" /></h3>
            <p>Exams Created</p>
          </div>
          <div className="stat-item">
            <h3><CountUp end={50} suffix="k+" /></h3>
            <p>Questions Answered</p>
          </div>
        </div>
      </section>

      {/* Mock Exams Section */}
      <section id="mock-exams" className="mock-exams-section">
        <div className="container">
          <div className="section-header">
            <h2>Try Our Mock Exams</h2>
            <p>Get a taste of the Assesa experience. No login required for these select exams.</p>
          </div>

          <div className="filters-container">
            <div className="search-box">
                <FiSearch />
                <input 
                    type="text" 
                    placeholder="Search exams..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            <div className="filter-box">
                <CustomSelect
                    value={selectedCategory}
                    onChange={setSelectedCategory}
                    options={categoryOptions}
                    placeholder="All Categories"
                />
            </div>

            <div className="filter-box">
                <CustomSelect
                    value={selectedDifficulty}
                    onChange={setSelectedDifficulty}
                    options={difficultyOptions}
                    placeholder="All Difficulties"
                />
            </div>

            <div className="status-toggle">
                <button 
                    className={statusFilter === 'all' ? 'active' : ''} 
                    onClick={() => setStatusFilter('all')}
                >All</button>
                <button 
                    className={statusFilter === 'active' ? 'active' : ''} 
                    onClick={() => setStatusFilter('active')}
                >Active</button>
                <button 
                    className={statusFilter === 'inactive' ? 'active' : ''} 
                    onClick={() => setStatusFilter('inactive')}
                >Inactive</button>
            </div>
          </div>

          {loading ? (
            <div className="loading-container">
              <FadeLoader color="var(--primary-color)" />
            </div>
          ) : filteredExams.length === 0 ? (
             <div className="no-exams">
                <p>No public mock exams available matching your criteria.</p>
             </div>
          ) : (
            <>
            <div className="exams-grid">
              {filteredExams.slice(0, visibleCount).map((exam) => (
                <div key={exam.id} className="exam-card">
                  <div className="card-header">
                    <h3>{exam.title}</h3>
                    <span className={`difficulty-badge ${exam.difficulty || 'medium'}`}>
                      {exam.difficulty || 'medium'}
                    </span>
                  </div>
                  {exam.categories?.name && (
                    <span style={{ 
                        fontSize: '0.8rem', 
                        color: 'var(--primary-color)', 
                        backgroundColor: 'rgba(var(--primary-rgb), 0.1)',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '1rem',
                        display: 'inline-block',
                        marginBottom: '0.5rem'
                    }}>
                        {exam.categories.name}
                    </span>
                  )}
                  <p className="description">
                    {exam.description || 'No description provided.'}
                  </p>
                  
                  <div className="meta">
                    <div>
                      <FiClock /> {exam.duration_minutes} mins
                    </div>
                    <div>
                      <FiHelpCircle /> {exam.questions?.[0]?.count || 0} Questions
                    </div>
                    <div>
                      <FiEye /> {Math.ceil((exam.questions?.[0]?.count || 0) * 0.3)} Hints
                    </div>
                  </div>
                  
                  <Link to={`/dashboard/public/take-exam/${exam.id}`}>
                    <Button>
                      <FiPlay /> Start Mock Exam
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
            {visibleCount < filteredExams.length && (
                <div className='load-more-area'>
                    <Button onClick={handleLoadMore} variant="outline" className='btn load-more'>
                        Load More
                    </Button>
                </div>
            )}
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <h2>Ready to Take the Next Step?</h2>
          <p>
            Join Assesa today to access our full library of exams, create your own, 
            and track your performance history.
          </p>
          <div className="cta-actions">
            <Link to="/register">
              <Button size="large">
                Create Free Account
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="large" >
                Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} Assesa. All rights reserved.</p>
          <div className="footer-links">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Contact Us</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
