import { useEffect } from 'react';
import styles from './AlertModal.module.css';

export const AlertModal = ({ message, type = 'info', onClose }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '⚠';
      default: return 'ℹ';
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={`${styles.icon} ${styles[type]}`}>
          {getIcon()}
        </div>
        <div className={styles.message}>{message}</div>
        <button className={styles.btn} onClick={onClose}>OK</button>
      </div>
    </div>
  );
};
