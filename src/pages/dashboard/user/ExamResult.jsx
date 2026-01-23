import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../../services/supabaseClient';
import Button from '../../../components/ui/Button';
import { FadeLoader } from 'react-spinners';
import { FiCheckCircle, FiXCircle, FiAward, FiArrowLeft, FiEye, FiEyeOff, FiClock } from 'react-icons/fi';

const ExamResult = () => {
  const { attemptId } = useParams();
  const [attempt, setAttempt] = useState(null);
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(false);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        // Fetch Attempt
        const { data: attemptData, error: attemptError } = await supabase
          .from('exam_attempts')
          .select('*')
          .eq('id', attemptId)
          .single();
        
        if (attemptError) throw attemptError;
        setAttempt(attemptData);

        // Fetch Exam
        const { data: examData, error: examError } = await supabase
          .from('exams')
          .select('*')
          .eq('id', attemptData.exam_id)
          .single();

        if (examError) throw examError;
        setExam(examData);

        // Fetch Questions
        const { data: questionsData, error: questionsError } = await supabase
          .from('questions')
          .select('*')
          .eq('exam_id', attemptData.exam_id);

        if (questionsError) throw questionsError;
        setQuestions(questionsData);

        // Fetch Answers
        const { data: answersData, error: answersError } = await supabase
          .from('exam_answers')
          .select('*')
          .eq('attempt_id', attemptId);

        if (answersError) throw answersError;
        setAnswers(answersData);

      } catch (err) {
        console.error('Error fetching results:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [attemptId]);

  if (loading) {
    return (
      <div className="exam-result-page">
        <div className="loading-container">
          <FadeLoader color="var(--primary-color)" />
        </div>
      </div>
    );
  }

  if (!attempt || !exam) {
    return (
      <div className="exam-result-page">
        <div className="error-container">Result not found.</div>
      </div>
    );
  }

  const percentage = Math.round((attempt.score / attempt.total_questions) * 100);
  const isPass = percentage >= 50; // Assume 50% pass mark for now

  // Sort questions: Incorrect/Skipped first, then Correct
  const sortedQuestions = [...questions].sort((a, b) => {
    const ansA = answers.find(ans => ans.question_id === a.id);
    const ansB = answers.find(ans => ans.question_id === b.id);
    
    const isCorrectA = ansA?.is_correct || false;
    const isCorrectB = ansB?.is_correct || false;

    if (isCorrectA === isCorrectB) return 0;
    return isCorrectA ? 1 : -1; // Put false (incorrect) before true (correct)
  });

  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return '0s';
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="exam-result-page">
      <div className="result-header">
        <div className={`score-circle ${isPass ? 'pass' : 'fail'}`}>
          <FiAward />
        </div>
        <h1>{exam.title} Results</h1>
        <p>Submitted on {new Date(attempt.finished_at).toLocaleString()}</p>
        
        <div className="result-summary">
          <div className="summary-item">
            <h2 className={isPass ? 'pass' : 'fail'}>{percentage}%</h2>
            <span>Score</span>
          </div>
          <div className="summary-item">
            <h2 className="primary">{attempt.score}/{attempt.total_questions}</h2>
            <span>Correct Answers</span>
          </div>
        </div>
      </div>

      <div className="detailed-review-header">
        <h3>Detailed Review</h3>
        <Button 
          variant="secondary" 
          onClick={() => setShowCorrectAnswers(!showCorrectAnswers)}
          className="review-toggle-btn"
        >
          {showCorrectAnswers ? <><FiEyeOff /> Hide Correct Answers</> : <><FiEye /> Show Correct Answers</>}
        </Button>
      </div>

      <div className="questions-review-list">
        {sortedQuestions.map((q, index) => {
          const userAnswer = answers.find(a => a.question_id === q.id);
          const isCorrect = userAnswer?.is_correct;
          const userSelected = userAnswer?.selected_answer;
          const timeSpent = userAnswer?.time_spent_seconds || 0;

          let cardClass = 'skipped';
          if (isCorrect) cardClass = 'correct';
          else if (userSelected) cardClass = 'incorrect';

          return (
            <div key={q.id} className={`review-card ${cardClass}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <p className="question-text" style={{ flex: 1 }}>
                  <span className="index">{index + 1}.</span> 
                  {q.question_text}
                  {isCorrect ? <FiCheckCircle color="var(--success-color)" style={{ marginTop: '3px', flexShrink: 0 }} /> : userSelected ? <FiXCircle color="var(--danger-color)" style={{ marginTop: '3px', flexShrink: 0 }} /> : <span className="skipped-text">(Skipped)</span>}
                </p>
                <div style={{ 
                  fontSize: '0.875rem', 
                  color: 'var(--text-secondary)', 
                  backgroundColor: 'var(--background-color)', 
                  padding: '0.25rem 0.5rem', 
                  borderRadius: '4px',
                  marginLeft: '1rem',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <FiClock size={14} />
                  <span>{formatTime(timeSpent)}</span>
                </div>
              </div>

              <div className="options-list">
                {q.options.map((opt, i) => {
                  const isOptCorrect = opt === q.correct_answer;
                  const isOptSelected = opt === userSelected;
                  
                  let optionClass = 'option-item';
                  
                  if (isOptCorrect && (showCorrectAnswers || isOptSelected)) {
                    optionClass += ' correct';
                  } else if (isOptSelected && !isOptCorrect) {
                    optionClass += ' wrong';
                  }

                  return (
                    <div key={i} className={optionClass}>
                      <span>{opt}</span>
                      {isOptCorrect && (showCorrectAnswers || isOptSelected) && <span className="status-label">Correct Answer</span>}
                      {isOptSelected && !isOptCorrect && <span className="status-label">Your Answer</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="action-footer">
        <Link to="/dashboard/available-exams">
          <Button variant="secondary">
            <FiArrowLeft /> Back to Exams
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default ExamResult;
