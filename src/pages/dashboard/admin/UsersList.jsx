import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers, updateUserRole } from '../../../store/slices/userSlice';
import { FadeLoader } from 'react-spinners';
import { FiUser, FiShield, FiMail } from 'react-icons/fi';
import Button from '../../../components/ui/Button';
import ConfirmModal from '../../../components/ui/ConfirmModal';
import { toast } from 'react-toastify';

const UsersList = () => {
  const dispatch = useDispatch();
  const { users, loading, error } = useSelector((state) => state.users);
  const { user: currentUser } = useSelector((state) => state.auth);
  const [roleModal, setRoleModal] = useState({ isOpen: false, userId: null, newRole: '' });

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const handleRoleChangeClick = (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    setRoleModal({ isOpen: true, userId, newRole });
  };

  const handleConfirmRoleChange = async () => {
    const { userId, newRole } = roleModal;
    if (userId && newRole) {
      try {
        await dispatch(updateUserRole({ userId, newRole })).unwrap();
        toast.success(`User role updated to ${newRole}`);
      } catch (err) { // eslint-disable-line no-unused-vars
        toast.error('Failed to update user role');
      }
      setRoleModal({ isOpen: false, userId: null, newRole: '' });
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="loading-container">
        <FadeLoader color="var(--primary-color)" />
      </div>
    );
  }

  return (
    <div className="users-list-page">
      <div className="page-header">
        <FiShield size={24} color="var(--primary-color)" />
        <h2>Manage Users</h2>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th className="text-center">Role</th>
              <th>Joined Date</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="user-cell">
                    <div className="user-avatar">
                      <FiUser />
                    </div>
                    <span className="user-name">{user.full_name || 'N/A'}</span>
                  </div>
                </td>
                <td>
                  <div className="email-cell">
                    <FiMail size={14} color="var(--secondary-color)" />
                    {user.email}
                  </div>
                </td>
                <td className="role-cell">
                  <span className={`role-badge ${user.role === 'admin' ? 'admin' : ''}`}>
                    {user.role}
                  </span>
                </td>
                <td className="date-cell">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="actions-cell">
                  {currentUser?.id !== user.id && (
                    <Button 
                      variant="secondary" 
                      onClick={() => handleRoleChangeClick(user.id, user.role)}
                      className="role-btn"
                    >
                      {user.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                    </Button>
                  )}
                  {currentUser?.id === user.id && (
                    <span className="current-user-label">Current User</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        isOpen={roleModal.isOpen}
        onClose={() => setRoleModal({ ...roleModal, isOpen: false })}
        title="Change User Role"
        message={`Are you sure you want to change this user's role to ${roleModal.newRole}?`}
        onConfirm={handleConfirmRoleChange}
        confirmText="Change Role"
      />
    </div>
  );
};

export default UsersList;
