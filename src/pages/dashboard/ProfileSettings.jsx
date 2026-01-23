import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfile } from '../../store/slices/authSlice';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { toast } from 'react-toastify';
import { FiUserCheck, FiLock, FiUser } from 'react-icons/fi';

const ProfileSettings = () => {
  const dispatch = useDispatch();
  const { user, profile, authLoading } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    fullName: profile?.full_name || '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      const resultAction = await dispatch(updateProfile({
        userId: user.id,
        fullName: formData.fullName,
        password: formData.password || undefined,
      }));

      if (updateProfile.fulfilled.match(resultAction)) {
        toast.success('Profile updated successfully');
        setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
      } else {
        toast.error(resultAction.payload || 'Failed to update profile');
      }
    } catch (err) { // eslint-disable-line no-unused-vars
      toast.error('An unexpected error occurred');
    }
  };

  return (
    <div className="profile-settings-page">
      <div className="page-header">
        <FiUserCheck size={24} color="var(--primary-color)" />
        <h2>Profile Settings</h2>
      </div>

      <div className="settings-card">
        <form onSubmit={handleSubmit}>
          <div className="section">
            <h3 className="section-title">
              <FiUser size={16} /> Personal Information
            </h3>
            <Input
              label="Full Name"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Your full name"
              required
            />
            <div className="form-group">
              <label>
                Email Address
              </label>
              <input
                type="email"
                value={user?.email}
                disabled
                className="disabled-input"
              />
              <p className="helper-text">
                Email cannot be changed
              </p>
            </div>
          </div>

          <div className="section bordered">
            <h3 className="section-title">
              <FiLock size={16} /> Security
            </h3>
            <Input
              label="New Password (leave blank to keep current)"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter new password"
            />
            {formData.password && (
              <Input
                label="Confirm New Password"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm new password"
                required
              />
            )}
          </div>

          <div className="form-actions">
            <Button type="submit" loading={authLoading}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettings;
