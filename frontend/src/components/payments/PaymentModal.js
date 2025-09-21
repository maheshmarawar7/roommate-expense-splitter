import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Button from '../common/Button';
import { CreditCard, CheckCircle, XCircle, QrCode, Smartphone } from 'lucide-react';

const PaymentModal = ({ isOpen, onClose, amount, description, groupId, expenseId, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadRazorpayScript();
    }
  }, [isOpen]);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve();
      document.body.appendChild(script);
    });
  };

  const createOrder = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Creating payment order with token:', token ? 'Token exists' : 'No token');
      console.log('Payment details:', { amount, currency: 'INR', groupId, expenseId, description });
      
      const response = await axios.post('/api/payments/create-order', {
        amount: amount,
        currency: 'INR',
        receipt: `exp_${expenseId.slice(-8)}_${Date.now().toString().slice(-8)}`,
        notes: {
          groupId: groupId,
          expenseId: expenseId,
          description: description
        }
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Order created successfully:', response.data);
      return response.data.order;
    } catch (error) {
      console.error('Error creating order:', error);
      if (error.response?.data?.message) {
        console.error('Order creation error details:', error.response.data.message);
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to create payment order');
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    setPaymentStatus(null);

    try {
      console.log('Starting payment process...');
      await loadRazorpayScript();
      console.log('Razorpay script loaded');
      
      // Get Razorpay key id from server (avoids relying on frontend env in test)
      let keyId = process.env.REACT_APP_RAZORPAY_KEY_ID;
      try {
        const cfg = await axios.get('/api/payments/config');
        if (cfg.data && cfg.data.keyId) {
          keyId = cfg.data.keyId;
        }
        console.log('Using Razorpay key:', (keyId || '').slice(0, 8) + '...');
      } catch (e) {
        console.warn('Could not fetch Razorpay config; falling back to env.');
      }

      const order = await createOrder();
      console.log('Order created, opening Razorpay modal...');

      const options = {
        key: keyId || 'rzp_test_placeholder',
        amount: order.amount,
        currency: order.currency,
        name: 'Roommate Expense Splitter',
        description: description,
        order_id: order.id,
        handler: async (response) => {
          console.log('Payment response received:', response);
          await verifyPayment(response);
        },
        prefill: {
          name: 'User Name',
          email: 'user@example.com',
          contact: '9999999999'
        },
        notes: {
          groupId: groupId,
          expenseId: expenseId
        },
        theme: {
          color: '#3B82F6'
        },
        modal: {
          ondismiss: () => {
            console.log('Payment modal dismissed');
            setLoading(false);
            setPaymentStatus('cancelled');
          }
        }
      };

      console.log('Razorpay options:', options);
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Payment error:', error);
      if (error.response?.data?.message) {
        console.error('Payment error details:', error.response.data.message);
      }
      setPaymentStatus('failed');
      setLoading(false);
    }
  };

  const verifyPayment = async (response) => {
    try {
      const token = localStorage.getItem('token');
      const verifyResponse = await axios.post('/api/payments/verify', {
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (verifyResponse.data.success) {
        setPaymentStatus('success');
        onSuccess && onSuccess(verifyResponse.data);
      } else {
        setPaymentStatus('failed');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      if (error.response?.data?.message) {
        console.error('Payment verification error details:', error.response.data.message);
      }
      setPaymentStatus('failed');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount) => {
    return `₹${parseFloat(amount).toFixed(2)}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Payment</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {paymentStatus === 'success' ? (
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Payment Successful!
              </h3>
              <p className="text-gray-600 mb-4">
                Your payment of {formatAmount(amount)} has been processed successfully.
              </p>
              <Button onClick={onClose} className="w-full">
                Close
              </Button>
            </div>
          ) : paymentStatus === 'failed' ? (
            <div className="text-center">
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Payment Failed
              </h3>
              <p className="text-gray-600 mb-4">
                There was an issue processing your payment. Please try again.
              </p>
              <div className="space-y-2">
                <Button onClick={handlePayment} className="w-full">
                  Try Again
                </Button>
                <Button variant="outline" onClick={onClose} className="w-full">
                  Cancel
                </Button>
              </div>
            </div>
          ) : paymentStatus === 'cancelled' ? (
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Payment Cancelled
              </h3>
              <p className="text-gray-600 mb-4">
                You cancelled the payment process.
              </p>
              <div className="space-y-2">
                <Button onClick={handlePayment} className="w-full">
                  Try Again
                </Button>
                <Button variant="outline" onClick={onClose} className="w-full">
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Payment Details */}
              <div className="mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">Amount:</span>
                    <span className="text-2xl font-bold text-gray-900">
                      {formatAmount(amount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Description:</span>
                    <span className="text-gray-900 font-medium">{description}</span>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Choose Payment Method
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer">
                    <QrCode className="h-6 w-6 text-blue-500 mr-3" />
                    <div>
                      <div className="font-medium text-gray-900">UPI / QR Code</div>
                      <div className="text-sm text-gray-600">Pay using UPI apps</div>
                    </div>
                  </div>
                  <div className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer">
                    <CreditCard className="h-6 w-6 text-green-500 mr-3" />
                    <div>
                      <div className="font-medium text-gray-900">Credit/Debit Card</div>
                      <div className="text-sm text-gray-600">Visa, Mastercard, RuPay</div>
                    </div>
                  </div>
                  <div className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer">
                    <Smartphone className="h-6 w-6 text-purple-500 mr-3" />
                    <div>
                      <div className="font-medium text-gray-900">Net Banking</div>
                      <div className="text-sm text-gray-600">All major banks</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={handlePayment}
                  loading={loading}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Processing...' : 'Pay Now'}
                </Button>
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={loading}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal; 