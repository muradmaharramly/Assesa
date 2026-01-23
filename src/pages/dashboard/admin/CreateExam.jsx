import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createExam, generateQuestionsFromJSON } from '../../../store/slices/examSlice';
import { useNavigate } from 'react-router-dom';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import CustomSelect from '../../../components/ui/CustomSelect';
import { toast } from 'react-toastify';
import { FiUpload, FiCode, FiEdit2 } from 'react-icons/fi';
import { supabase } from '../../../services/supabaseClient';

const CreateExam = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { loading } = useSelector((state) => state.exams);

  const [mode, setMode] = useState('manual'); // 'manual' or 'json'
  const [jsonFile, setJsonFile] = useState(null);
  const [jsonText, setJsonText] = useState('');
  const [categories, setCategories] = useState([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration_minutes: 60,
    is_active: true,
    difficulty: 'medium',
    category_id: ''
  });

  useEffect(() => {
    const fetchCategories = async () => {
        const { data, error } = await supabase.from('categories').select('*');
        if (data) setCategories(data);
    };
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/json') {
      setJsonFile(selectedFile);
    } else {
      toast.error('Please upload a valid JSON file');
      setJsonFile(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    let parsedJsonData = null;

    if (mode === 'json') {
        if (!jsonFile && !jsonText.trim()) {
            toast.error('Please upload a JSON file or paste JSON content');
            return;
        }

        try {
            if (jsonFile) {
                 const text = await jsonFile.text();
                 parsedJsonData = JSON.parse(text);
            } else {
                 parsedJsonData = JSON.parse(jsonText);
            }
            
            if (!Array.isArray(parsedJsonData)) {
                toast.error('JSON must be an array of questions');
                return;
            }
        } catch {
            toast.error('Invalid JSON format');
            return;
        }
    }

    try {
      // 1. Create the Exam Entry first
      const examData = {
        ...formData,
        category_id: formData.category_id || null,
        created_by: user.id,
      };

      const resultAction = await dispatch(createExam(examData));
      
      if (createExam.fulfilled.match(resultAction)) {
        const newExam = resultAction.payload;
        
        // 2. If JSON mode, trigger generation
        if (mode === 'json' && parsedJsonData) {
          toast.info('Generating questions from JSON...');
          
          const genResult = await dispatch(generateQuestionsFromJSON({ 
            examId: newExam.id, 
            jsonData: parsedJsonData 
          }));

          if (generateQuestionsFromJSON.fulfilled.match(genResult)) {
            toast.success('Exam created and questions generated!');
            navigate(`/dashboard/exams/${newExam.id}`);
          } else {
            // Show specific error from the slice
            const errorMessage = genResult.payload || 'JSON generation failed';
            toast.error(`Error: ${errorMessage}. Exam created but no questions added.`);
            navigate(`/dashboard/exams/${newExam.id}`);
          }
        } else {
          toast.success('Exam created successfully');
          navigate(`/dashboard/exams/${newExam.id}`);
        }
      } else {
        toast.error(resultAction.payload || 'Failed to create exam');
      }
    } catch {
      toast.error('An unexpected error occurred');
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

  return (
    <div className="create-exam-container">
      <h2>Create New Exam</h2>
      
      {/* Mode Selection Tabs */}
      <div className="mode-tabs">
        <button
          onClick={() => setMode('manual')}
          className={mode === 'manual' ? 'active' : ''}
          type="button"
        >
          <FiEdit2 /> Manual Creation
        </button>
        <button
          onClick={() => setMode('json')}
          className={mode === 'json' ? 'active' : ''}
          type="button"
        >
          <FiCode /> Generate from JSON
        </button>
      </div>

      <div className="exam-form-card">
        <form onSubmit={handleSubmit}>
          <Input
            label="Exam Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., Mathematics Final"
            required
          />

          <div className="input-group">
            <label className="input-label input-label-secondary">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter exam instructions..."
              className="description-textarea"
            />
          </div>

          <Input
            label="Duration (minutes)"
            type="number"
            name="duration_minutes"
            value={formData.duration_minutes}
            onChange={handleChange}
            min="1"
            required
          />

          <div className="input-group">
            <label className="input-label">Difficulty Level</label>
            <CustomSelect
                value={formData.difficulty}
                onChange={(value) => handleSelectChange('difficulty', value)}
                options={difficultyOptions}
                placeholder="Select Difficulty"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Category</label>
            <CustomSelect
                value={formData.category_id}
                onChange={(value) => handleSelectChange('category_id', value)}
                options={categoryOptions}
                placeholder="Select Category"
            />
          </div>

          {mode === 'json' && (
            <div className="json-upload-area">
              <div className="upload-content">
                <FiUpload size={32} color="var(--secondary-color)" className="upload-icon" />
                <h4>Upload Exam JSON or Paste JSON</h4>
                <p>
                  Expected format: Array of objects with question_text, options (array), correct_answer.
                </p>
                <input
                  type="file"
                  accept="application/json"
                  onChange={handleFileChange}
                />
              </div>

              <div className="paste-separator">
                <div className="separator-label">
                    OR PASTE JSON HERE
                </div>
                <textarea
                    placeholder='[{"question_text": "...", "options": ["A", "B"], "correct_answer": "A"}]'
                    value={jsonText}
                    onChange={(e) => setJsonText(e.target.value)}
                    className="json-textarea"
                />
              </div>
            </div>
          )}

          <div className="checkbox-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', marginTop: '1rem' }}>
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              id="is_active"
            />
            <label htmlFor="is_active">Active (Visible to users)</label>
          </div>

          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => navigate('/dashboard/exams')}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {mode === 'pdf' ? 'Create & Generate Questions' : 'Create & Add Questions'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateExam;
