import React from 'react';
import Modal from './Modal';
import Button from './Button';

const ConfirmModal = ({ isOpen, onClose, title, message, onConfirm, confirmText = 'Confirm', cancelText = 'Cancel', isDangerous = false }) => {
  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    onClose();
  };

  const footer = (
    <>
      <Button variant="secondary" onClick={onClose}>
        {cancelText}
      </Button>
      <Button 
        variant={isDangerous ? 'primary' : 'primary'} // Button component doesn't have danger variant yet, assuming primary or style override
        style={isDangerous ? { backgroundColor: 'var(--danger-color)', borderColor: 'var(--danger-color)' } : {}}
        onClick={handleConfirm}
      >
        {confirmText}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || 'Confirmation'}
      footer={footer}
    >
      <p>{message}</p>
    </Modal>
  );
};

export default ConfirmModal;
