import React from 'react';
import './TerminationModal.css';

const TerminationModal = ({ show, onConfirm }) => {
    if (!show) {
        return null;
    }

    return (
        <div className="termination-modal-overlay">
            <div className="termination-modal-content">
                <h2>Account Terminated</h2>
                <p>Your employee account has been terminated. Please contact administration for further details.</p>
                <button onClick={onConfirm}>OK</button>
            </div>
        </div>
    );
};

export default TerminationModal;