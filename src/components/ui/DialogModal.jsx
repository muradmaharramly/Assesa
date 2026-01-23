import React from 'react';
import Modal from './Modal';
import Button from './Button';

const DialogModal = ({ isOpen, onClose, title, message, onOk }) => {
  const handleOk = () => {
    if (onOk) onOk();
    onClose();
  };

  const footer = (
    <Button onClick={handleOk}>
      OK
    </Button>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || 'Information'}
      footer={footer}
    >
      <p>{message}</p>
    </Modal>
  );
};

export default DialogModal;
