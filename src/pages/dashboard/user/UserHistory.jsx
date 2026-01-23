import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserAttempts } from '../../../store/slices/examSlice';
import { Link } from 'react-router-dom';
import Button from '../../../components/ui/Button';
import ConfirmModal from '../../../components/ui/ConfirmModal';
import { FadeLoader } from 'react-spinners';
import { FiEye, FiClock, FiCheckCircle, FiXCircle, FiTrash2, FiTrash } from 'react-icons/fi';
import { supabase } from '../../../services/supabaseClient';
import { toast } from 'react-toastify';

const UserHistory = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { history, loading, error } = useSelector((state) => state.exams);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [attemptToDelete, setAttemptToDelete] = useState(null);

  useEffect(() => {
    if (user) {
      dispatch(fetchUserAttempts(user.id));
    }
  }, [dispatch, user]);

  if (loading && history.length === 0) {
    return (
      <div className="loading-container">
        <FadeLoader color="var(--primary-color)" />
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDeleteClick = (attemptId) => {
    setAttemptToDelete(attemptId);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!attemptToDelete) return;
    
    try {
      const { data, error } = await supabase
        .from('exam_attempts')
        .delete()
        .eq('id', attemptToDelete)
        .select();

      if (error) throw error;

      // Check if any row was actually deleted
      if (!data || data.length === 0) {
        throw new Error('Permission denied: Unable to delete exam history.');
      }

      toast.success('Exam history deleted successfully');
      dispatch(fetchUserAttempts(user.id));
    } catch (err) {
      toast.error('Failed to delete history: ' + err.message);
    } finally {
      setDeleteModalOpen(false);
      setAttemptToDelete(null);
    }
  };

  return (
    <div className="user-history-page">
      <div className="page-header">
        <FiClock size={24} color="var(--primary-color)" />
        <h2>My Exam History</h2>
      </div>

      {error && <div className="error-message">{error}</div>}

      {history.length === 0 ? (
        <div className="empty-state">
          <h3>No exams taken yet</h3>
          <p>Go to the Available Exams page to take your first exam!</p>
          <Link to="/dashboard/available-exams">
            <Button>Browse Exams</Button>
          </Link>
        </div>
      ) : (
        <div className="table-container">
          <table className="history-table">
            <thead>
              <tr>
                <th>Exam Title</th>
                <th>Date Taken</th>
                <th className="text-center">Score</th>
                <th className="text-center">Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {history.map((attempt) => {
                const percentage = Math.round((attempt.score / attempt.total_questions) * 100);
                const passed = percentage >= 50;
                
                return (
                  <tr key={attempt.id}>
                    <td>
                      <div className="exam-title-cell">
                        <div className="title">{attempt.exams?.title || 'Unknown Exam'}</div>
                        <div className="meta">
                          {attempt.exams?.duration_minutes} mins
                        </div>
                      </div>
                    </td>
                    <td className="date-cell">
                      {formatDate(attempt.created_at)}
                    </td>
                    <td className="score-cell">
                      <div className={`score ${passed ? 'passed' : 'failed'}`}>
                        {attempt.score}/{attempt.total_questions}
                      </div>
                      <div className="percentage">{percentage}%</div>
                    </td>
                    <td className="status-cell">
                      <span className={`status-badge ${passed ? 'passed' : 'failed'}`}>
                        {passed ? <FiCheckCircle size={12} /> : <FiXCircle size={12} />}
                        {passed ? 'Passed' : 'Failed'}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <div className="action-buttons">
                        <Link to={`/dashboard/result/${attempt.id}`}>
                          <Button variant="secondary" className="view-btn">
                            <FiEye />
                          </Button>
                        </Link>
                        <Button 
                          variant="secondary" 
                          onClick={() => handleDeleteClick(attempt.id)}
                          className="delete-btn"
                        >
                          <FiTrash />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete History"
        message="Are you sure you want to delete this exam history? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        confirmText="Delete"
        isDangerous={true}
      />
    </div>
  );
};

export default UserHistory;
