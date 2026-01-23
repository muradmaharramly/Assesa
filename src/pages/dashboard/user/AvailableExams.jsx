import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchExams, fetchPublicExams } from '../../../store/slices/examSlice';
import { Link } from 'react-router-dom';
import { FiPlay, FiClock, FiHelpCircle, FiEye, FiSearch, FiFilter } from 'react-icons/fi';
import Button from '../../../components/ui/Button';
import CustomSelect from '../../../components/ui/CustomSelect';
import { FadeLoader } from 'react-spinners';
import { supabase } from '../../../services/supabaseClient';

const AvailableExams = () => {
  const dispatch = useDispatch();
  const { exams, loading, error } = useSelector((state) => state.exams);
  const { user } = useSelector((state) => state.auth);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [categories, setCategories] = useState([]);
  const [visibleCount, setVisibleCount] = useState(3);

  useEffect(() => {
    if (user) {
        dispatch(fetchExams());
    } else {
        dispatch(fetchPublicExams());
    }
    
    const fetchCategories = async () => {
        const { data } = await supabase.from('categories').select('*');
        if (data) setCategories(data);
    };
    fetchCategories();
  }, [dispatch, user]);

  // Filter only active exams for users
  const activeExams = exams.filter(exam => exam.is_active);
  
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
  
  const filteredExams = activeExams.filter(exam => {
    const matchesSearch = 
        exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (exam.description && exam.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (exam.categories?.name && exam.categories.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory ? exam.category_id === selectedCategory : true;
    const matchesDifficulty = selectedDifficulty ? exam.difficulty === selectedDifficulty : true;

    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  if (loading && exams.length === 0) {
    return (
      <div className="loading-container">
        <FadeLoader color="var(--primary-color)" />
      </div>
    );
  }

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 6);
  };

  return (
    <div>
      <h2 className="page-title">Available Exams</h2>
      
      <div className="filters-container">
        <div className="search-box">
            <FiSearch />
            <input 
                type="text" 
                placeholder="Search exams by name, description or category..." 
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
      </div>

      {error && <div className="error-message">{error}</div>}

      {filteredExams.length === 0 ? (
        <div className="no-exams">
          <p>No exams found matching your criteria.</p>
        </div>
      ) : (
        <>
        <div className="exams-grid">
          {filteredExams.slice(0, visibleCount).map((exam) => (
            <div key={exam.id} className="exam-card">
              <div>
                <div className="exam-header">
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
              </div>
              
              <Link to={user ? `/dashboard/take-exam/${exam.id}` : `/dashboard/public/take-exam/${exam.id}`}>
                <Button>
                  <FiPlay /> {user ? 'Start Exam' : 'Start Mock Exam'}
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
  );
};

export default AvailableExams;
