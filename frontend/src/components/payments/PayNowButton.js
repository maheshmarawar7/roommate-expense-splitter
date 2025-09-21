import React, { useState } from 'react';
import PaymentModal from './PaymentModal';
import Button from '../common/Button';
import { CreditCard } from 'lucide-react';

const PayNowButton = ({ expense, groupId, amount, onPaymentSuccess }) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handlePaymentSuccess = (paymentData) => {
    setShowPaymentModal(false);
    if (onPaymentSuccess) {
      onPaymentSuccess(paymentData);
    }
  };

  return (
    <>
      <Button
        onClick={() => setShowPaymentModal(true)}
        size="sm"
        className="flex items-center"
      >
        <CreditCard className="h-4 w-4 mr-2" />
        Pay Now
      </Button>

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        amount={amount}
        description={expense.description}
        groupId={groupId}
        expenseId={expense._id}
        onSuccess={handlePaymentSuccess}
      />
    </>
  );
};

export default PayNowButton; 