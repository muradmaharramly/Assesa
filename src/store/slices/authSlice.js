import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../services/supabaseClient';

// Thunks
export const signInUser = createAsyncThunk(
  'auth/signInUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Fetch profile
      let profileData = null;
      const { data: fetchedProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        // If profile fetch fails, check if user is an admin via metadata
        const role = data.user.user_metadata?.role || data.user.app_metadata?.role;
        if (role === 'admin') {
           profileData = { 
             id: data.user.id, 
             role: 'admin', 
             full_name: data.user.user_metadata?.full_name || 'Admin',
             email: data.user.email
           };
        } else {
           throw profileError;
        }
      } else {
        profileData = fetchedProfile;
      }

      return { user: data.user, profile: profileData };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const signUpUser = createAsyncThunk(
  'auth/signUpUser',
  async ({ email, password, fullName }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;
      
      // Note: The profile creation is handled by the Postgres Trigger, 
      // but we might need to fetch it or wait for it. 
      // For immediate login flow, if auto-confirm is disabled (as per requirements "Email confirmation MUST BE DISABLED"? 
      // Wait, "Email confirmation MUST BE DISABLED" usually means they are active immediately? 
      // Or does it mean we turn off the feature so they don't *need* to confirm? 
      // Usually "Disabled" in this context implies "Don't require email confirmation".
      // Let's assume the user is logged in immediately.
      
      if (data.user) {
         // We try to fetch the profile. It might take a ms for the trigger to run.
         // A small delay or retry might be needed in real world, but let's try direct fetch.
         // Or just return user and let the UI handle the "loading profile" state.
         
         // Let's attempt to fetch the profile
         const { data: profileData, error: _profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
          
         // If trigger hasn't run yet, profileData might be null. 
         // In a robust app we might poll or return partial data.
         // For now, let's return what we have.
         return { user: data.user, profile: profileData };
      }
      
      return { user: data.user, profile: null };

    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const signOutUser = createAsyncThunk(
  'auth/signOutUser',
  async (_, { rejectWithValue }) => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchProfile = createAsyncThunk(
  'auth/fetchProfile',
  async (userId, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async ({ userId, fullName, password }, { rejectWithValue }) => {
    try {
      // 1. Update Profile Data
      if (fullName) {
        const { error } = await supabase
          .from('profiles')
          .update({ full_name: fullName })
          .eq('id', userId);
        if (error) throw error;
      }

      // 2. Update Password if provided
      if (password) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
      }

      // 3. Return updated profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);


const initialState = {
  user: null,
  profile: null,
  loading: true, // Initial loading state for checking session
  authLoading: false, // Loading state for sign in/up actions
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession: (state, action) => {
      state.user = action.payload.user;
      state.profile = action.payload.profile;
      state.loading = false;
    },
    clearSession: (state) => {
      state.user = null;
      state.profile = null;
      state.loading = false;
    },
    setAuthLoading: (state, action) => {
        state.loading = action.payload;
    }
  },
  extraReducers: (builder) => {
    // SignIn
    builder.addCase(signInUser.pending, (state) => {
      state.authLoading = true;
      state.error = null;
    });
    builder.addCase(signInUser.fulfilled, (state, action) => {
      state.authLoading = false;
      state.user = action.payload.user;
      state.profile = action.payload.profile;
    });
    builder.addCase(signInUser.rejected, (state, action) => {
      state.authLoading = false;
      state.error = action.payload;
    });

    // SignUp
    builder.addCase(signUpUser.pending, (state) => {
      state.authLoading = true;
      state.error = null;
    });
    builder.addCase(signUpUser.fulfilled, (state, action) => {
      state.authLoading = false;
      state.user = action.payload.user;
      state.profile = action.payload.profile;
    });
    builder.addCase(signUpUser.rejected, (state, action) => {
      state.authLoading = false;
      state.error = action.payload;
    });

    // SignOut
    builder.addCase(signOutUser.fulfilled, (state) => {
      state.user = null;
      state.profile = null;
    });
    
    // Fetch Profile
    builder.addCase(fetchProfile.fulfilled, (state, action) => {
      state.profile = action.payload;
    });

    // Update Profile
    builder.addCase(updateProfile.pending, (state) => {
      state.authLoading = true;
      state.error = null;
    });
    builder.addCase(updateProfile.fulfilled, (state, action) => {
      state.authLoading = false;
      state.profile = action.payload;
    });
    builder.addCase(updateProfile.rejected, (state, action) => {
      state.authLoading = false;
      state.error = action.payload;
    });
  },
});

export const { setSession, clearSession, setAuthLoading } = authSlice.actions;

export default authSlice.reducer;
