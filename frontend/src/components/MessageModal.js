import React from "react";

const MessageModal = ({ isOpen, onClose, message, type }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className={`modal-content ${type}`}>
                <p>{message}</p>
                <button onClick={onClose} className="modal-close-btn">OK</button>
            </div>
        </div>
    );
};

export default MessageModal;