import { useEffect, useMemo, useState } from 'react';
import { transactionService } from '../services/transaction.service';
import { paymentPlanService } from '../services/paymentplan.service';
import { Search } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import SuccessModal from './SuccessModal';

export default function TransactionForm({ type = 'SEND', onSuccess, onCancel, initialData = {} }) {
  const { showNotification } = useNotification();
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [formData, setFormData] = useState({
    target_email: initialData.target_email || '',
    amount: initialData.amount || '',
    transaction_type: type,
    description: initialData.description || '',
    payment_plan_id: initialData.payment_plan_id || ''
  });
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(type === 'SEND');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (type !== 'SEND') {
      setPlans([]);
      setLoadingPlans(false);
      return;
    }

    const fetchPlans = async () => {
      setLoadingPlans(true);
      try {
        const data = await paymentPlanService.getPaymentPlans();
        const list = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
        setPlans(list.filter((plan) => plan.status === 'PENDING'));
      } catch {
        setPlans([]);
      } finally {
        setLoadingPlans(false);
      }
    };

    fetchPlans();
  }, [type]);

  const selectedPlan = useMemo(
    () => plans.find((plan) => String(plan.id) === String(formData.payment_plan_id)),
    [plans, formData.payment_plan_id]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        target_email: formData.target_email,
        amount: formData.amount,
        transaction_type: formData.transaction_type,
        description: formData.description
      };

      if (type === 'SEND' && formData.payment_plan_id) {
        payload.payment_plan_id = Number(formData.payment_plan_id);
      }

      await transactionService.createTransaction(payload);

      if (type === 'SEND' && formData.payment_plan_id) {
        try {
          await paymentPlanService.markCompleted(Number(formData.payment_plan_id));
        } catch {
          showNotification('Money was sent, but the selected plan could not be marked completed automatically.', 'warning');
        }
      }

      setSuccessMsg(`${type === 'SEND' ? 'Sent' : 'Requested'} NPR ${formData.amount} to ${formData.target_email}`);
      setShowSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Transaction failed. Please check recipient email.');
    } finally {
      setLoading(false);
    }
  };

  if (showSuccess) {
    return (
      <SuccessModal 
        isOpen={showSuccess} 
        message={successMsg} 
        onClose={onSuccess} 
      />
    );
  }

  return (
    <div>
      <h3 style={{ marginBottom: '20px' }}>
        {type === 'SEND' ? 'Send Money' : 'Request Money'}
      </h3>
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Recipient Email</label>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
            <input
              type="email"
              className="input-field"
              placeholder="friend@example.com"
              style={{ paddingLeft: '44px' }}
              value={formData.target_email}
              onChange={(e) => setFormData({ ...formData, target_email: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>Amount (NPR)</label>
          <input
            type="number"
            className="input-field"
            placeholder="0.00"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            required
          />
        </div>

        {type === 'SEND' && (
          <div className="form-group">
            <label>Payment Plan (Optional)</label>
            <select
              className="input-field"
              value={formData.payment_plan_id}
              onChange={(e) => {
                const nextId = e.target.value;
                const nextPlan = plans.find((plan) => String(plan.id) === nextId);
                setFormData((prev) => ({
                  ...prev,
                  payment_plan_id: nextId,
                  amount: nextPlan && !prev.amount ? nextPlan.amount : prev.amount,
                  description: nextPlan && !prev.description ? nextPlan.title : prev.description
                }));
              }}
              disabled={loadingPlans}
            >
              <option value="">{loadingPlans ? 'Loading plans...' : 'No linked plan'}</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.title} - NPR {plan.amount}
                </option>
              ))}
            </select>
            {selectedPlan && (
              <p style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Selected plan will be marked completed after sending.
              </p>
            )}
          </div>
        )}

        <div className="form-group">
          <label>Note (Optional)</label>
          <input
            type="text"
            className="input-field"
            placeholder="What is this for?"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '28px' }}>
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Processing...' : type === 'SEND' ? 'Send Now' : 'Send Request'}
          </button>
        </div>
      </form>
    </div>
  );
}
