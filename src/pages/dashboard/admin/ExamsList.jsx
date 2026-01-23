import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchExams, deleteExam } from '../../../store/slices/examSlice';
import { Link } from 'react-router-dom';
import { FiPlus, FiTrash2, FiEdit2, FiEye, FiTrash, FiSearch, FiFilter } from 'react-icons/fi';
import Button from '../../../components/ui/Button';
import CustomSelect from '../../../components/ui/CustomSelect';
import ConfirmModal from '../../../components/ui/ConfirmModal';
import { FadeLoader } from 'react-spinners';
import { toast } from 'react-toastify';
import { supabase } from '../../../services/supabaseClient';

const ExamsList = () => {
  const dispatch = useDispatch();
  const { exams, loading, error } = useSelector((state) => state.exams);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    dispatch(fetchExams());
    const fetchCategories = async () => {
        const { data } = await supabase.from('categories').select('*');
        if (data) setCategories(data);
    };
    fetchCategories();
  }, [dispatch]);

  const handleDeleteClick = (examId) => {
    setExamToDelete(examId);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (examToDelete) {
      await dispatch(deleteExam(examToDelete));
      toast.success('Exam deleted successfully');
      setIsDeleteModalOpen(false);
      setExamToDelete(null);
    }
  };

  const filteredExams = exams.filter(exam => {
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

  if (loading && exams.length === 0) {
    return (
      <div className="exams-list-page">
        <div className="loading-container">
          <FadeLoader color="var(--primary-color)" />
        </div>
      </div>
    );
  }

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

  return (
    <div className="exams-list-page">
      <div className="exams-header">
        <h2>Manage Exams</h2>
        <Link to="/dashboard/create-exam">
          <Button className="create-btn">
            <FiPlus /> Create New Exam
          </Button>
        </Link>
      </div>

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

      {error && <div className="error-message">{error}</div>}

      {filteredExams.length === 0 ? (
        <div className="empty-state">
          <p>No exams found matching your criteria.</p>
        </div>
      ) : (
        <div className="exams-grid">
          {filteredExams.map((exam) => (
            <div key={exam.id} className="exam-card">
              <div className="exam-info">
                <h3>
                  {exam.title}
                  <span className={`difficulty-badge ${exam.difficulty || 'medium'}`}>
                    {exam.difficulty || 'medium'}
                  </span>
                </h3>
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
                <p>
                  Duration: {exam.duration_minutes} mins | Status: {exam.is_active ? 'Active' : 'Inactive'}
                </p>
              </div>
              <div className="exam-actions">
                <Link to={`/dashboard/exams/${exam.id}`}>
                  <Button variant="secondary" className="edit-btn">
                    <FiEdit2 />
                  </Button>
                </Link>
                <Button 
                  variant="secondary" 
                  className="delete-btn"
                  onClick={() => handleDeleteClick(exam.id)}
                >
                  <FiTrash />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Exam"
        message="Are you sure you want to delete this exam? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        confirmText="Delete"
        isDangerous={true}
      />
    </div>
  );
};

export default ExamsList;
