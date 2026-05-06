import { useState, useEffect } from 'react';
import { expenseService } from '../services/expense.service';

export default function ExpenseForm({ expenseId, initialType = 'Expense', onSuccess, onCancel }) {
  const today = new Date().toISOString().slice(0, 10);
  const [formData, setFormData] = useState({
    amount: '',
    type: initialType,
    category: '',
    description: '',
    date: today
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (expenseId) {
      fetchExpenseData(expenseId);
    }
  }, [expenseId]);

  const fetchExpenseData = async (id) => {
    try {
      const data = await expenseService.getExpense(id);
      setFormData({
        amount: data.amount,
        type: data.type,
        category: data.category || '',
        description: data.description || '',
        date: data.date ? new Date(data.date).toISOString().slice(0, 10) : today
      });
    } catch {
      setError('Could not fetch existing record.');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const selectedDate = formData.date || today;
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount).toFixed(2),
        date: new Date(`${selectedDate}T00:00:00`).toISOString()
      };

      if (expenseId) {
        await expenseService.updateExpense(expenseId, payload);
      } else {
        await expenseService.createExpense(payload);
      }
      onSuccess();
    } catch (err) {
      const errors = err.response?.data;
      if (errors && typeof errors === 'object' && !Array.isArray(errors)) {
        const msgs = Object.keys(errors).map((k) => `${k}: ${errors[k]}`).join(' | ');
        setError(msgs);
      } else {
        setError(err.message || 'Operation failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 style={{ marginBottom: '20px' }}>{expenseId ? 'Edit Record' : initialType === 'Income' ? 'Load Money' : 'Add Expense'}</h3>
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group">
            <label>Type</label>
            <select name="type" className="input-field" value={formData.type} onChange={handleChange}>
              <option value="Expense">Expense</option>
              <option value="Income">Income</option>
            </select>
          </div>
          <div className="form-group">
            <label>Amount (NPR)</label>
            <input type="number" step="0.01" name="amount" className="input-field" placeholder="0.00" value={formData.amount} onChange={handleChange} required />
          </div>
        </div>

        <div className="form-group">
          <label>Category</label>
          <input name="category" className="input-field" placeholder="Category" maxLength={50} value={formData.category} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Date</label>
          <input name="date" type="date" className="input-field" value={formData.date} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Description (Optional)</label>
          <textarea name="description" className="input-field" placeholder="Add a note..." value={formData.description} onChange={handleChange} rows={3} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '28px' }}>
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Processing...' : 'Confirm'}
          </button>
        </div>
      </form>
    </div>
  );
}
