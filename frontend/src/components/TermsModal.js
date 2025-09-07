import React, { useState } from "react";
import "./TermsModal.css";

const TermsModal = ({ onAgreeChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  const toggleModal = () => setIsOpen(!isOpen);

  const handleCheckboxChange = (e) => {
    setIsChecked(e.target.checked);
    onAgreeChange(e.target.checked);
  };

  return (
    <>
      
        <div className="terms-modal">
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Terms and Conditions</h2>
            <div className="modal-body">
              <p><strong>Effective Date:</strong> [25/04/2025]</p>

              <p>
                By signing up on this platform, you agree to the following terms and conditions. Please review carefully before proceeding.
              </p>

              <h4>1. Eligibility</h4>
              <p>You must be at least 18 years old or the legal age in your jurisdiction to use this service.</p>

              <h4>2. Personal Information & Address</h4>
              <p>
                You consent to the collection and processing of your personal data, including your shipping address, as per our Privacy Policy and applicable data protection laws (e.g., GDPR, CCPA).
              </p>

              <h4>3. Digital Transactions</h4>
              <p>
                All transactions are processed securely through third-party payment gateways. You authorize us to charge the chosen method for any purchases made.
              </p>

              <h4>4. No Refund Policy</h4>
              <p>
                All sales are final. Refunds are not provided except where required by law or explicitly stated in product terms.
              </p>

              <h4>5. Account Responsibility</h4>
              <p>
                You are responsible for your account’s security and all actions under it.
              </p>

              <h4>6. Prohibited Use</h4>
              <p>
                You must not engage in unlawful activity, upload false data, or attempt to compromise platform integrity.
              </p>

              <h4>7. Limitation of Liability</h4>
              <p>
                We are not liable for damages or losses resulting from your use of our platform to the maximum extent permitted by law.
              </p>

              <h4>8. Updates to Terms</h4>
              <p>
                We may update these terms at any time. Continued use indicates your acceptance of updated terms.
              </p>

              <h4>9. Jurisdiction</h4>
              <p>
                These terms are governed by the laws of [Your Country/State], and any disputes will be resolved in its courts.
              </p>

              <h4>10. Contact</h4>
              <p>
                For questions, contact us at <a href="mailto:edgicustoms100@gmail.com">edgicustoms100@gmail.com</a>.
              </p>
            </div>

            <div className="modal-footer">
              
              <button className="modal-close" onClick={toggleModal}>
                Close
              </button>
              </div>
            
          </div>
        </div>
        </div>
      
    </>
  );
};

export default TermsModal;
