import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../services/supabaseClient';

// Thunks
export const fetchExams = createAsyncThunk(
  'exams/fetchExams',
  async (_, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*, categories(name), questions(count)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchPublicExams = createAsyncThunk(
  'exams/fetchPublicExams',
  async (_, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*, categories(name), questions(count)')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createExam = createAsyncThunk(
  'exams/createExam',
  async (examData, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('exams')
        .insert([examData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateExam = createAsyncThunk(
  'exams/updateExam',
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('exams')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteExam = createAsyncThunk(
  'exams/deleteExam',
  async (examId, { rejectWithValue }) => {
    try {
      const { error } = await supabase
        .from('exams')
        .delete()
        .eq('id', examId);

      if (error) throw error;
      return examId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchExamById = createAsyncThunk(
  'exams/fetchExamById',
  async (examId, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select(`
          *,
          categories(name),
          questions (*)
        `)
        .eq('id', examId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createQuestion = createAsyncThunk(
  'exams/createQuestion',
  async (questionData, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .insert([questionData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteQuestion = createAsyncThunk(
  'exams/deleteQuestion',
  async (questionId, { rejectWithValue }) => {
    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;
      return questionId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const generateQuestionsFromJSON = createAsyncThunk(
  'exams/generateQuestionsFromJSON',
  async ({ examId, jsonData }, { rejectWithValue }) => {
    try {
      // 1. Validate JSON
      if (!Array.isArray(jsonData)) {
        throw new Error("JSON data must be an array of questions.");
      }

      const formattedQuestions = jsonData.map((q, index) => {
        if (!q.question_text || !q.options || !q.correct_answer) {
          throw new Error(`Question at index ${index} is missing required fields (question_text, options, correct_answer).`);
        }
        if (!Array.isArray(q.options) || q.options.length < 2) {
          throw new Error(`Question at index ${index} must have at least 2 options.`);
        }
        return {
          exam_id: examId,
          question_text: q.question_text,
          options: q.options,
          correct_answer: q.correct_answer
        };
      });

      // 2. Insert into DB
      const { data, error } = await supabase
        .from('questions')
        .insert(formattedQuestions)
        .select();

      if (error) throw error;
      return data;

    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUserAttempts = createAsyncThunk(
  'exams/fetchUserAttempts',
  async (userId, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('exam_attempts')
        .select(`
          *,
          exams (
            title,
            duration_minutes
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchCategories = createAsyncThunk(
  'exams/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createCategory = createAsyncThunk(
  'exams/createCategory',
  async (categoryData, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([categoryData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteCategory = createAsyncThunk(
  'exams/deleteCategory',
  async (categoryId, { rejectWithValue }) => {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;
      return categoryId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  exams: [],
  categories: [],
  currentExam: null, // Includes questions
  history: [],
  loading: false,
  error: null,
};

const examSlice = createSlice({
  name: 'exams',
  initialState,
  reducers: {
    clearCurrentExam: (state) => {
      state.currentExam = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Exams
    builder.addCase(fetchExams.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchExams.fulfilled, (state, action) => {
      state.loading = false;
      state.exams = action.payload;
    });
    builder.addCase(fetchExams.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Fetch Public Exams
    builder.addCase(fetchPublicExams.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchPublicExams.fulfilled, (state, action) => {
      state.loading = false;
      state.exams = action.payload;
    });
    builder.addCase(fetchPublicExams.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Create Exam
    builder.addCase(createExam.fulfilled, (state, action) => {
      state.exams.unshift(action.payload);
    });

    // Update Exam
    builder.addCase(updateExam.fulfilled, (state, action) => {
      const index = state.exams.findIndex((exam) => exam.id === action.payload.id);
      if (index !== -1) {
        state.exams[index] = action.payload;
      }
      if (state.currentExam && state.currentExam.id === action.payload.id) {
        state.currentExam = { ...state.currentExam, ...action.payload };
      }
    });

    // Delete Exam
    builder.addCase(deleteExam.fulfilled, (state, action) => {
      state.exams = state.exams.filter((exam) => exam.id !== action.payload);
    });

    // Fetch Exam By Id
    builder.addCase(fetchExamById.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchExamById.fulfilled, (state, action) => {
      state.loading = false;
      state.currentExam = action.payload;
    });
    builder.addCase(fetchExamById.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
    
    // Create Question
    builder.addCase(createQuestion.fulfilled, (state, action) => {
      if (state.currentExam && state.currentExam.id === action.payload.exam_id) {
         if (!state.currentExam.questions) state.currentExam.questions = [];
         state.currentExam.questions.push(action.payload);
      }
    });

    // Delete Question
    builder.addCase(deleteQuestion.fulfilled, (state, action) => {
      if (state.currentExam && state.currentExam.questions) {
        state.currentExam.questions = state.currentExam.questions.filter(
          (q) => q.id !== action.payload
        );
      }
    });

    // Fetch User Attempts (History)
    builder.addCase(fetchUserAttempts.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchUserAttempts.fulfilled, (state, action) => {
      state.loading = false;
      state.history = action.payload;
    });
    builder.addCase(fetchUserAttempts.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Generate Questions from JSON
    builder.addCase(generateQuestionsFromJSON.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(generateQuestionsFromJSON.fulfilled, (state, action) => {
      state.loading = false;
      if (state.currentExam) {
        if (!state.currentExam.questions) state.currentExam.questions = [];
        state.currentExam.questions.push(...action.payload);
      }
    });
    builder.addCase(generateQuestionsFromJSON.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Categories
    builder.addCase(fetchCategories.fulfilled, (state, action) => {
      state.categories = action.payload;
    });
    
    builder.addCase(createCategory.fulfilled, (state, action) => {
      state.categories.push(action.payload);
    });

    builder.addCase(deleteCategory.fulfilled, (state, action) => {
      state.categories = state.categories.filter(c => c.id !== action.payload);
    });
  },
});

export const { clearCurrentExam } = examSlice.actions;
export default examSlice.reducer;
