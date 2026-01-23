import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCategories, createCategory, deleteCategory } from '../../../store/slices/examSlice';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import ConfirmModal from '../../../components/ui/ConfirmModal';
import { FiPlus, FiTrash2, FiTag, FiTrash } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { FadeLoader } from 'react-spinners';

const ManageCategories = () => {
  const dispatch = useDispatch();
  const { categories, loading, error } = useSelector((state) => state.exams);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const handleInputChange = (e) => {
    setNewCategory({
      ...newCategory,
      [e.target.name]: e.target.value
    });
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    const resultAction = await dispatch(createCategory(newCategory));
    if (createCategory.fulfilled.match(resultAction)) {
      toast.success('Category added successfully');
      setNewCategory({ name: '', description: '' });
    } else {
      toast.error(resultAction.payload || 'Failed to add category');
    }
  };

  const handleDeleteClick = (id) => {
    setCategoryToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (categoryToDelete) {
      const resultAction = await dispatch(deleteCategory(categoryToDelete));
      if (deleteCategory.fulfilled.match(resultAction)) {
        toast.success('Category deleted successfully');
        setIsDeleteModalOpen(false);
        setCategoryToDelete(null);
      } else {
        toast.error(resultAction.payload || 'Failed to delete category');
      }
    }
  };

  return (
    <div className="manage-categories-page">
      <div className="dashboard-header">
        <h2>Manage Categories</h2>
        <p>Add and manage exam categories.</p>
      </div>

      <div className="add-category-section">
        <h3>Add New Category</h3>
        <form onSubmit={handleAddCategory}>
          <div className="input-group">
            <label>Name</label>
            <Input 
              name="name" 
              value={newCategory.name} 
              onChange={handleInputChange} 
              placeholder="e.g., Mathematics" 
              required
            />
          </div>
          <div className="input-group description">
            <label>Description</label>
            <Input 
              name="description" 
              value={newCategory.description} 
              onChange={handleInputChange} 
              placeholder="Category description..." 
            />
          </div>
          <Button type="submit">
            <FiPlus /> Add Category
          </Button>
        </form>
      </div>

      {loading && categories.length === 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <FadeLoader color="var(--primary-color)" />
        </div>
      ) : (
        <div className="categories-grid">
          {categories.map((category) => (
            <div key={category.id} className="category-card">
              <div>
                <h3>
                  <FiTag /> {category.name}
                </h3>
                <p>
                  {category.description || 'No description provided.'}
                </p>
              </div>
              <div className="actions">
                <button 
                  onClick={() => handleDeleteClick(category.id)}
                  className="delete-btn"
                  title="Delete Category"
                >
                  <FiTrash />
                </button>
              </div>
            </div>
          ))}
          {categories.length === 0 && (
            <div className="no-categories">
              No categories found. Add one above.
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Category"
        message="Are you sure you want to delete this category? This might affect exams linked to it."
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default ManageCategories;
