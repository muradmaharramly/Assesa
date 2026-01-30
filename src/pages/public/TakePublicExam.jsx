import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import { fetchExamById, clearCurrentExam } from '../../store/slices/examSlice';
import Button from '../../components/ui/Button';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { FadeLoader } from 'react-spinners';
import { toast } from 'react-toastify';
import { FiClock, FiCheck, FiArrowRight, FiArrowLeft, FiEye, FiEyeOff, FiX, FiHome } from 'react-icons/fi';

const TakePublicExam = () => {
  const { examId } = useParams();
  const dispatch = useDispatch();
  // const navigate = useNavigate();
  const { currentExam, loading, error } = useSelector((state) => state.exams);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [examStarted, setExamStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);

  // Fetch Exam
  useEffect(() => {
    dispatch(fetchExamById(examId));
    return () => dispatch(clearCurrentExam());
  }, [dispatch, examId]);

  // Start Exam
  const startExam = () => {
    if (!currentExam) return;
    setTimeLeft(currentExam.duration_minutes * 60);
    setExamStarted(true);
  };

  // Submit Exam
  const handleSubmitExam = useCallback(() => {
    if (submitted) return;
    
    let calculatedScore = 0;
    if (currentExam && currentExam.questions) {
      currentExam.questions.forEach(q => {
        if (answers[q.id] === q.correct_answer) {
          calculatedScore++;
        }
      });
    }
    setScore(calculatedScore);
    setSubmitted(true);
    toast.success('Exam finished!');
  }, [answers, currentExam, submitted]);

  // Timer
  useEffect(() => {
    if (!examStarted || submitted || timeLeft === null) return;

    if (timeLeft <= 0) {
      handleSubmitExam();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [examStarted, timeLeft, handleSubmitExam, submitted]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleAnswerSelect = (option) => {
    if (submitted) return;
    const question = currentExam.questions[currentQuestionIndex];
    setAnswers({
      ...answers,
      [question.id]: option
    });
  };

  if (loading || !currentExam) {
    return (
      <div className="take-exam-loading">
        <FadeLoader color="var(--primary-color)" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="take-exam-error">
        <h3>Error loading exam</h3>
        <p>{error}</p>
        <Link to="/dashboard"><Button>Go Back</Button></Link>
      </div>
    );
  }

  // Result Screen
  if (submitted) {
    const percentage = Math.round((score / currentExam.questions.length) * 100);
    let message = '';
    let colorClass = '';

    if (percentage >= 80) {
      message = 'Excellent!';
      colorClass = 'success-color'; // handled via inline style or class
    } else if (percentage >= 60) {
      message = 'Good Job!';
      colorClass = 'primary-color';
    } else {
      message = 'Keep Practicing!';
      colorClass = 'danger-color';
    }
    
    // Helper for color variable
    const getColor = () => {
        if (percentage >= 80) return 'var(--success-color)';
        if (percentage >= 60) return 'var(--primary-color)';
        return 'var(--danger-color)';
    };
    const color = getColor();

    return (
      <div className="public-result-card">
        <h2>Exam Result</h2>
        
        <div className="score-card">
          <div className="percentage-display" style={{ color }}>
            {percentage}%
          </div>
          <h3 className="message-display" style={{ color }}>{message}</h3>
          
          <div className="stats-grid">
            <div className="stat-box">
              <div className="label">Score</div>
              <div className="value">{score} / {currentExam.questions.length}</div>
            </div>
            <div className="stat-box">
              <div className="label">Status</div>
              <div className={`value ${percentage >= 50 ? 'passed' : 'failed'}`}>
                {percentage >= 50 ? 'Passed' : 'Failed'}
              </div>
            </div>
          </div>
        </div>

        <div className="action-area">
            <p>To save your progress and access more exams, please register or login.</p>
            <div className="buttons">
                <Link to="/dashboard">
                    <Button variant="secondary"><FiArrowLeft /> Back to Dashboard</Button>
                </Link>
                <Link to="/register">
                    <Button>Register Now</Button>
                </Link>
            </div>
        </div>
      </div>
    );
  }

  // Instructions Screen
  if (!examStarted) {
    return (
      <div className="instructions-card">
        <h1>{currentExam.title}</h1>
        <p className="exam-description">{currentExam.description}</p>
        
        <div className="exam-stats">
          <div className="stat-item">
            <h3>{currentExam.duration_minutes}</h3>
            <span>Minutes</span>
          </div>
          <div className="stat-item">
            <h3>{currentExam.questions?.length || 0}</h3>
            <span>Questions</span>
          </div>
        </div>
        
        <div className="public-exam-warning">
            <strong>Note:</strong> This is a public mock exam. Your results will not be saved to history.
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/dashboard">
                <Button variant="secondary">Cancel</Button>
            </Link>
            <Button onClick={startExam}>Start Exam Now</Button>
        </div>
      </div>
    );
  }

  // Exam Interface
  const currentQuestion = currentExam.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === currentExam.questions.length - 1;

  return (
    <div className="take-exam-page">
      {/* Top Bar */}
      <div className="exam-header">
        <div className="exam-info">
          <span className="question-number">Question {currentQuestionIndex + 1}</span>
          <span className="question-total"> / {currentExam.questions.length}</span>
        </div>
        <div className={`exam-timer ${timeLeft < 300 ? 'warning' : ''}`}>
          <FiClock /> {formatTime(timeLeft)}
        </div>
      </div>

      {/* Question Card */}
      <div className="question-card">
        <div className="question-header">
          <h3>
            {currentQuestion.question_text}
          </h3>
        </div>

        <div className="options-list">
          {currentQuestion.options.map((option, index) => {
            const isSelected = answers[currentQuestion.id] === option;
            
            return (
              <div 
                key={index}
                onClick={() => handleAnswerSelect(option)}
                className={`option-item ${isSelected ? 'selected' : ''}`}
              >
                <div className="option-circle">
                  {isSelected && <div className="inner-circle"></div>}
                </div>
                <span className="option-text">{option}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="exam-navigation">
        <Button 
          variant="secondary" 
          onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
          disabled={currentQuestionIndex === 0}
          className={`nav-btn ${currentQuestionIndex === 0 ? 'hidden' : ''}`}
        >
          <FiArrowLeft /> Previous
        </Button>

        <div className="right-actions">
          {isLastQuestion ? (
            <Button 
              onClick={() => setSubmitModalOpen(true)}
              className="submit-btn"
            >
              <FiCheck /> Submit Exam
            </Button>
          ) : (
            <Button 
              onClick={() => setCurrentQuestionIndex(prev => Math.min(currentExam.questions.length - 1, prev + 1))}
              className="nav-btn"
            >
              Next <FiArrowRight />
            </Button>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={submitModalOpen}
        onClose={() => setSubmitModalOpen(false)}
        title="Submit Exam"
        message="Are you sure you want to submit your exam? You cannot change your answers after submission."
        onConfirm={handleSubmitExam}
        confirmText="Submit"
      />
    </div>
  );
};

export default TakePublicExam;
