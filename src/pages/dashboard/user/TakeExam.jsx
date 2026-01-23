import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchExamById, clearCurrentExam } from '../../../store/slices/examSlice';
import { supabase } from '../../../services/supabaseClient';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import ConfirmModal from '../../../components/ui/ConfirmModal';
import { FadeLoader } from 'react-spinners';
import { toast } from 'react-toastify';
import { FiClock, FiCheck, FiArrowRight, FiArrowLeft, FiEye, FiEyeOff, FiX, FiSettings } from 'react-icons/fi';

const TakeExam = () => {
  const { examId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentExam, loading, error } = useSelector((state) => state.exams);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { questionId: selectedOption }
  const [timeLeft, setTimeLeft] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [examStarted, setExamStarted] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [hintedQuestions, setHintedQuestions] = useState(new Set());
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  
  // Customization State
  const [activeQuestions, setActiveQuestions] = useState([]);
  const [questionTimes, setQuestionTimes] = useState({}); // { questionId: seconds }
  const startTimeRef = useRef(Date.now());
  
  const [config, setConfig] = useState({
    enabled: false,
    rangeStart: 1,
    rangeEnd: 0,
    count: 0
  });

  // Reset showAnswer when question changes
  useEffect(() => {
    setShowAnswer(false);
  }, [currentQuestionIndex]);

  // Fetch Exam Data
  useEffect(() => {
    dispatch(fetchExamById(examId));
    return () => dispatch(clearCurrentExam());
  }, [dispatch, examId]);

  // Track time per question
  useEffect(() => {
    startTimeRef.current = Date.now();

    return () => {
      if (activeQuestions.length > 0) {
        const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
        const qId = activeQuestions[currentQuestionIndex]?.id;
        if (qId) {
          setQuestionTimes(prev => ({
            ...prev,
            [qId]: (prev[qId] || 0) + duration
          }));
        }
      }
    };
  }, [currentQuestionIndex, activeQuestions]);

  // Initialize Config when exam loads
  useEffect(() => {
    if (currentExam && currentExam.questions) {
      setConfig(prev => ({
        ...prev,
        rangeEnd: currentExam.questions.length,
        count: currentExam.questions.length
      }));
    }
  }, [currentExam]);

  // Start Exam Logic
  const startExam = async () => {
    try {
      if (!currentExam) return;

      let questionsToUse = [...currentExam.questions];

      // Apply Customization
      if (config.enabled) {
         // Validation
         const totalAvailable = currentExam.questions.length;
         const start = parseInt(config.rangeStart);
         const end = parseInt(config.rangeEnd);
         const count = parseInt(config.count);

         if (start < 1 || start > totalAvailable) {
             toast.error(`Start range must be between 1 and ${totalAvailable}`);
             return;
         }
         if (end < start || end > totalAvailable) {
             toast.error(`End range must be between ${start} and ${totalAvailable}`);
             return;
         }
         const rangeSize = end - start + 1;
         if (count < 1 || count > rangeSize) {
             toast.error(`Question count must be between 1 and ${rangeSize} (available in range)`);
             return;
         }

         // Filter and Randomize
         // Convert 1-based start/end to 0-based indices
         const rangeQuestions = questionsToUse.slice(start - 1, end);
         
         // Shuffle
         const shuffled = rangeQuestions.sort(() => 0.5 - Math.random());
         
         // Slice
         questionsToUse = shuffled.slice(0, count);
      }

      if (questionsToUse.length === 0) {
          toast.error("No questions selected. Please check your configuration.");
          return;
      }

      setActiveQuestions(questionsToUse);

      // Create Attempt Record
      const { data, error } = await supabase
        .from('exam_attempts')
        .insert([{
          user_id: user.id,
          exam_id: examId,
          total_questions: questionsToUse.length,
          status: 'in_progress'
        }])
        .select()
        .single();

      if (error) throw error;

      setAttemptId(data.id);
      setTimeLeft(currentExam.duration_minutes * 60);
      setExamStarted(true);
    } catch (err) {
      toast.error('Failed to start exam: ' + err.message);
    }
  };

  // Submit Exam Logic
  const handleSubmitExam = useCallback(async () => {
    if (submitting || !attemptId) return;
    setSubmitting(true);

    try {
      let score = 0;
      const answerRecords = [];

      // Calculate time for the current question (since the effect cleanup won't run for it yet)
      const endTime = Date.now();
      const currentQ = activeQuestions[currentQuestionIndex];
      const currentSessionDuration = Math.round((endTime - startTimeRef.current) / 1000);
      
      const finalQuestionTimes = { ...questionTimes };
      if (currentQ) {
        finalQuestionTimes[currentQ.id] = (finalQuestionTimes[currentQ.id] || 0) + currentSessionDuration;
      }

      // Calculate Score Client-Side
      activeQuestions.forEach(q => {
        const selected = answers[q.id];
        const isCorrect = selected === q.correct_answer;
        if (isCorrect) score++;

        if (selected) {
          answerRecords.push({
            attempt_id: attemptId,
            question_id: q.id,
            selected_answer: selected,
            is_correct: isCorrect,
            time_spent_seconds: finalQuestionTimes[q.id] || 0
          });
        }
      });

      // Save Answers
      if (answerRecords.length > 0) {
        const { error: ansError } = await supabase
          .from('exam_answers')
          .insert(answerRecords);
        
        if (ansError) throw ansError;
      }

      // Update Attempt
      const { error: attError } = await supabase
        .from('exam_attempts')
        .update({
          finished_at: new Date().toISOString(),
          score: score,
          status: 'completed'
        })
        .eq('id', attemptId);

      if (attError) throw attError;

      toast.success('Exam submitted successfully!');
      navigate(`/dashboard/result/${attemptId}`);

    } catch (err) {
      toast.error('Failed to submit exam: ' + err.message);
      setSubmitting(false);
    }
  }, [answers, attemptId, activeQuestions, navigate, submitting, questionTimes, currentQuestionIndex]);

  // Timer Logic
  useEffect(() => {
    if (!examStarted || timeLeft === null) return;

    if (timeLeft <= 0) {
      handleSubmitExam();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [examStarted, timeLeft, handleSubmitExam]);

  // Format Time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Handle Answer Selection
  const handleAnswerSelect = (option) => {
    const question = activeQuestions[currentQuestionIndex];
    setAnswers({
      ...answers,
      [question.id]: option
    });
  };

  // Handle Answer Toggle with Limits
  const handleToggleAnswer = () => {
    if (showAnswer) {
      setShowAnswer(false);
      return;
    }

    const currentQ = activeQuestions[currentQuestionIndex];
    if (!currentQ) return;

    // Calculate max hints (30% of total questions)
    const maxHints = Math.ceil(activeQuestions.length * 0.3);

    // If already used hint on this question, just show it without consuming a chance
    if (hintedQuestions.has(currentQ.id)) {
      setShowAnswer(true);
      return;
    }

    // Check limit
    if (hintedQuestions.size >= maxHints) {
      toast.warning(`You have used all ${maxHints} hint chances for this exam.`);
      return;
    }

    // Consume hint chance
    const newHinted = new Set(hintedQuestions);
    newHinted.add(currentQ.id);
    setHintedQuestions(newHinted);
    setShowAnswer(true);
    
    const remaining = maxHints - newHinted.size;
    toast.info(`Hint used. You have ${remaining} chance${remaining !== 1 ? 's' : ''} remaining.`);
  };

  if (error) {
    return (
      <div className="take-exam-error">
        <h3>Error loading exam</h3>
        <p>{error}</p>
        <Button onClick={() => navigate('/dashboard/available-exams')}>Go Back</Button>
      </div>
    );
  }

  if (submitting || loading || !currentExam) {
    return (
      <div className="take-exam-loading">
        <FadeLoader color="var(--primary-color)" />
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

        {/* Customization Options */}
        <div className="customization-section">
            <div className="custom-checkbox" onClick={() => setConfig({...config, enabled: !config.enabled})}>
                <div className={`checkbox-box ${config.enabled ? 'checked' : ''}`}>
                    {config.enabled && <FiCheck color="white" size={14} />}
                </div>
                <span>Customize Exam (Range & Count)</span>
            </div>

            {config.enabled && (
                <div className="custom-inputs">
                    <Input 
                        label="From Question" 
                        type="number" 
                        value={config.rangeStart} 
                        onChange={(e) => setConfig({...config, rangeStart: e.target.value})}
                        min="1"
                    />
                    <Input 
                        label="To Question" 
                        type="number" 
                        value={config.rangeEnd} 
                        onChange={(e) => setConfig({...config, rangeEnd: e.target.value})}
                        min="1"
                    />
                    <Input 
                        label="Count" 
                        type="number" 
                        value={config.count} 
                        onChange={(e) => setConfig({...config, count: e.target.value})}
                        min="1"
                    />
                </div>
            )}
        </div>

        <Button onClick={startExam}>Start Exam Now</Button>
      </div>
    );
  }

  // Exam Interface
  const currentQuestion = activeQuestions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === activeQuestions.length - 1;

  return (
    <div className="take-exam-page">
      {/* Top Bar */}
      <div className="exam-header">
        <div className="exam-info">
          <span className="question-number">Question {currentQuestionIndex + 1}</span>
          <span className="question-total"> / {activeQuestions.length}</span>
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
          <Button 
            variant="secondary" 
            onClick={handleToggleAnswer}
            className="toggle-answer-btn"
          >
            {showAnswer ? <FiEyeOff /> : <FiEye />}
          </Button>
        </div>

        <div className="options-list">
          {currentQuestion.options.map((option, index) => {
            const isSelected = answers[currentQuestion.id] === option;
            const isCorrect = option === currentQuestion.correct_answer;
            
            let itemClass = 'option-item';
            if (isSelected) itemClass += ' selected';
            if (showAnswer && isCorrect) itemClass += ' correct';
            
            return (
              <div 
                key={index}
                onClick={() => handleAnswerSelect(option)}
                className={itemClass}
              >
                <div className="option-circle">
                  {isSelected && <div className="inner-circle"></div>}
                </div>
                <span className="option-text">{option}</span>
                {showAnswer && isCorrect && <span className="correct-label">Correct Answer</span>}
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
          {isLastQuestion && (
             <Button
               variant="secondary"
               onClick={() => setCancelModalOpen(true)}
               className="cancel-btn"
             >
               <FiX /> Cancel
             </Button>
          )}

          {isLastQuestion ? (
            <Button 
              onClick={handleSubmitExam} 
              loading={submitting}
              className="submit-btn"
            >
              <FiCheck /> Submit Exam
            </Button>
          ) : (
            <Button 
              onClick={() => setCurrentQuestionIndex(prev => Math.min(activeQuestions.length - 1, prev + 1))}
              className="nav-btn"
            >
              Next <FiArrowRight />
            </Button>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Exam"
        message="Are you sure you want to cancel this exam? Your progress will be lost."
        onConfirm={() => navigate('/dashboard/available-exams')}
        confirmText="Yes, Cancel"
        isDangerous={true}
      />
    </div>
  );
};

export default TakeExam;
