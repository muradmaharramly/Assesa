import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchExamById, createQuestion, deleteQuestion, clearCurrentExam, updateExam } from '../../../store/slices/examSlice';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import CustomSelect from '../../../components/ui/CustomSelect';
import ConfirmModal from '../../../components/ui/ConfirmModal';
import { FiPlus, FiArrowLeft, FiCheck, FiTrash2, FiEdit2, FiSave, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { FadeLoader } from 'react-spinners';
import { supabase } from '../../../services/supabaseClient';

const ExamDetails = () => {
  const { examId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentExam, loading, error } = useSelector((state) => state.exams);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [categories, setCategories] = useState([]);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    difficulty: '',
    category_id: '',
    duration_minutes: '',
    is_active: true
  });

  useEffect(() => {
    dispatch(fetchExamById(examId));

    const fetchCategories = async () => {
      const { data } = await supabase.from('categories').select('*');
      if (data) setCategories(data);
    };
    fetchCategories();

    return () => dispatch(clearCurrentExam());
  }, [dispatch, examId]);

  useEffect(() => {
    if (currentExam) {
      setEditFormData({
        title: currentExam.title || '',
        description: currentExam.description || '',
        difficulty: currentExam.difficulty || 'medium',
        category_id: currentExam.category_id || '',
        duration_minutes: currentExam.duration_minutes || 60,
        is_active: currentExam.is_active
      });
    }
  }, [currentExam]);

  const [questionData, setQuestionData] = useState({
    question_text: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correct_answer: '',
  });

  const handleChange = (e) => {
    setQuestionData({
      ...questionData,
      [e.target.name]: e.target.value,
    });
  };

  const handleEditChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setEditFormData({
      ...editFormData,
      [e.target.name]: value,
    });
  };

  const handleEditSelectChange = (name, value) => {
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name, value) => {
    setQuestionData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!currentExam) return;

    // Format options as JSON array
    const options = [
      questionData.optionA,
      questionData.optionB,
      questionData.optionC,
      questionData.optionD
    ].filter(opt => opt.trim() !== '');

    if (options.length < 2) {
      toast.error('Please provide at least 2 options');
      return;
    }

    // Check if correct answer is one of the options (simple validation)
    // For simplicity, we assume correct_answer is the text of the option
    if (!options.includes(questionData.correct_answer)) {
      // toast.warning('Correct answer should match one of the options exactly');
      // Actually, for better UX, we might use a dropdown for correct answer or radio button.
      // But let's proceed with text for now.
    }

    const payload = {
      exam_id: examId,
      question_text: questionData.question_text,
      options: options, // JSONB in Supabase
      correct_answer: questionData.correct_answer
    };

    const resultAction = await dispatch(createQuestion(payload));
    if (createQuestion.fulfilled.match(resultAction)) {
      toast.success('Question added successfully');
      setQuestionData({
        question_text: '',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        correct_answer: '',
      });
    } else {
      toast.error(resultAction.payload || 'Failed to add question');
    }
  };

  const handleDeleteQuestionClick = (questionId) => {
    setQuestionToDelete(questionId);
    setDeleteModalOpen(true);
  };

  const handleConfirmDeleteQuestion = async () => {
    if (questionToDelete) {
      const resultAction = await dispatch(deleteQuestion(questionToDelete));
      if (deleteQuestion.fulfilled.match(resultAction)) {
        toast.success('Question deleted successfully');
        dispatch(fetchExamById(examId));
        setDeleteModalOpen(false);
        setQuestionToDelete(null);
      } else {
        toast.error(resultAction.payload || 'Failed to delete question');
      }
    }
  };

  const handleUpdateExam = async (e) => {
    e.preventDefault();

    // Ensure category_id is null if empty string to avoid UUID errors
    const updates = {
      ...editFormData,
      category_id: editFormData.category_id || null
    };

    const resultAction = await dispatch(updateExam({ id: examId, updates }));
    if (updateExam.fulfilled.match(resultAction)) {
      toast.success('Exam updated successfully');
      setIsEditing(false);
    } else {
      toast.error(resultAction.payload || 'Failed to update exam');
    }
  };

  const difficultyOptions = [
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' }
  ];

  const categoryOptions = [
    { value: '', label: 'Select Category' },
    ...categories.map(cat => ({ value: cat.id, label: cat.name }))
  ];

  const correctAnswerOptions = [
    { value: '', label: 'Select correct option' },
    ...(questionData.optionA ? [{ value: questionData.optionA, label: `Option A: ${questionData.optionA}` }] : []),
    ...(questionData.optionB ? [{ value: questionData.optionB, label: `Option B: ${questionData.optionB}` }] : []),
    ...(questionData.optionC ? [{ value: questionData.optionC, label: `Option C: ${questionData.optionC}` }] : []),
    ...(questionData.optionD ? [{ value: questionData.optionD, label: `Option D: ${questionData.optionD}` }] : []),
  ];

  if (loading && !currentExam) {
    return (
      <div className="loading-container">
        <FadeLoader color="var(--primary-color)" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="exam-details-page">
        <div className="error-container">Error: {error}</div>
      </div>
    );
  }

  if (!currentExam) return null;

  return (
    <div className="exam-details-page">
      <Button
        variant="secondary"
        className="back-btn"
        onClick={() => navigate('/dashboard/exams')}
      >
        <FiArrowLeft /> Back to Exams
      </Button>

      <div className="exam-header-card">
        {isEditing ? (
          <form onSubmit={handleUpdateExam} className="edit-exam-form">
            <div className="input-group">
              <label className="input-label">Title</label>
              <Input
                name="title"
                value={editFormData.title}
                onChange={handleEditChange}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Description</label>
              <textarea
                name="description"
                value={editFormData.description}
                onChange={handleEditChange}
                className="question-textarea"
                rows="3"
              />
            </div>

            <div className="meta-info-edit">
              <div className="input-group">
                <label className="input-label">Duration (mins)</label>
                <Input
                  type="number"
                  name="duration_minutes"
                  value={editFormData.duration_minutes}
                  onChange={handleEditChange}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Difficulty</label>
                <CustomSelect
                  value={editFormData.difficulty}
                  onChange={(value) => handleEditSelectChange('difficulty', value)}
                  options={difficultyOptions}
                  placeholder="Select Difficulty"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Category</label>
                <CustomSelect
                  value={editFormData.category_id}
                  onChange={(value) => handleEditSelectChange('category_id', value)}
                  options={categoryOptions}
                  placeholder="Select Category"
                />
              </div>

              <div className="input-group checkbox-group">
                <label className="input-label">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={editFormData.is_active}
                    onChange={handleEditChange}
                    style={{ marginRight: '0.5rem' }}
                  />
                  Active
                </label>
              </div>
            </div>

            <div className="edit-actions">
              <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>
                <FiX /> Cancel
              </Button>
              <Button type="submit" loading={loading}>
                <FiSave /> Save Changes
              </Button>
            </div>
          </form>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1>{currentExam.title}</h1>
                <p className="description">{currentExam.description}</p>
              </div>
              <Button onClick={() => setIsEditing(true)} variant="secondary" style={{ width: 'auto' }}>
                <FiEdit2 /> Edit Exam
              </Button>
            </div>
            <div className="meta-info">
              <span>Duration: {currentExam.duration_minutes} mins</span>
              <span style={{ textTransform: 'capitalize' }}>Difficulty: {currentExam.difficulty || 'medium'}</span>
              <span>Category: {categories.find(c => c.id === currentExam.category_id)?.name || 'Uncategorized'}</span>
              <span>Questions: {currentExam.questions?.length || 0}</span>
              <span>Status: {currentExam.is_active ? 'Active' : 'Draft'}</span>
            </div>
          </>
        )}
      </div>

      <div className="content-grid">
        {/* Add Question Form */}
        <div className="add-question-section">
          <h3>Add New Question</h3>
          <div className="form-card">
            <form onSubmit={handleAddQuestion}>
              <div className="input-group">
                <label className="input-label">Question Text</label>
                <textarea
                  name="question_text"
                  value={questionData.question_text}
                  onChange={handleChange}
                  required
                  className="question-textarea"
                />
              </div>

              <div className="options-grid">
                <Input label="Option A" name="optionA" value={questionData.optionA} onChange={handleChange} required />
                <Input label="Option B" name="optionB" value={questionData.optionB} onChange={handleChange} required />
                <Input label="Option C" name="optionC" value={questionData.optionC} onChange={handleChange} />
                <Input label="Option D" name="optionD" value={questionData.optionD} onChange={handleChange} />
              </div>

              <div className="correct-answer-select-group">
                <label className="input-label">Correct Answer (Select)</label>
                <CustomSelect
                  value={questionData.correct_answer}
                  onChange={(value) => handleSelectChange('correct_answer', value)}
                  options={correctAnswerOptions}
                  placeholder="Select correct option"
                />
              </div>

              <Button type="submit" loading={loading}>
                <FiPlus /> Add Question
              </Button>
            </form>
          </div>
        </div>

        {/* Question List */}
        <div className="questions-list-section">
          <h3>Questions ({currentExam.questions?.length || 0})</h3>
          <div className="questions-container">
            {currentExam.questions && currentExam.questions.length > 0 ? (
              currentExam.questions.map((q, index) => (
                <div key={q.id} className="question-card">
                  <button
                    onClick={() => handleDeleteQuestionClick(q.id)}
                    className="delete-question-btn"
                    title="Delete Question"
                  >
                    <FiTrash2 />
                  </button>
                  <p className="question-text">{index + 1}. {q.question_text}</p>
                  <ul className="options-list">
                    {q.options.map((opt, i) => (
                      <li key={i} className={opt === q.correct_answer ? 'correct' : ''}>
                        {opt} {opt === q.correct_answer && <FiCheck size={10} />}
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <p className="no-questions">No questions added yet.</p>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Question"
        message="Are you sure you want to delete this question? This action cannot be undone."
        onConfirm={handleConfirmDeleteQuestion}
        confirmText="Delete"
        isDangerous={true}
      />
    </div>
  );
};

export default ExamDetails;
