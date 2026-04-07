import { useState, useEffect } from 'react';
import { createExpense, updateExpense, getExpenseById } from '../services/expense.service';

export default function ExpenseForm({ expenseId, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    amount: '',
    type: 'Expense',
    category: '',
    description: ''
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
      const data = await getExpenseById(id);
      setFormData({
        amount: data.amount,
        type: data.type,
        category: data.category || '',
        description: data.description || ''
      });
    } catch (err) {
      setError('Could not fetch existing record.');
    }
  };

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount).toFixed(2),
        date: new Date().toISOString()
      };
      
      if (expenseId) {
        await updateExpense(expenseId, payload);
      } else {
        await createExpense(payload);
      }
      onSuccess();
    } catch (err) {
      console.error(err);
      const errors = err.response?.data;
      if (errors && typeof errors === 'object' && !Array.isArray(errors)) {
        const msgs = Object.keys(errors).map(k => `${k}: ${errors[k]}`).join(' | ');
        setError(msgs);
      } else if (typeof errors === 'string') {
        setError(`Server Error (${err.response?.status}): Check console for details`);
      } else if (Array.isArray(errors)) {
        setError(errors.join(' | '));
      } else {
        setError(err.message || 'Operation failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="mb-4">{expenseId ? 'Edit Expense' : 'New Expense'}</h2>
      {error && <div className="md-card mb-4 text-danger text-center shadow-none">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="flex gap-4 mb-4">
          <div className="form-group w-full">
            <label>Type</label>
            <select name="type" className="md-input" value={formData.type} onChange={handleChange}>
              <option value="Expense">Expense</option>
              <option value="Income">Income</option>
            </select>
          </div>
          <div className="form-group w-full">
            <label>Amount</label>
            <input 
              type="number" 
              step="0.01"
              name="amount" 
              className="md-input" 
              value={formData.amount}
              onChange={handleChange}
              required 
            />
          </div>
        </div>

        <div className="form-group">
          <label>Category</label>
          <input 
            name="category" 
            list="default-categories"
            className="md-input" 
            maxLength={50}
            value={formData.category}
            onChange={handleChange}
            required 
          />
          <datalist id="default-categories">
            <option value="Food & Dining" />
            <option value="Transportation" />
            <option value="Utilities" />
            <option value="Entertainment" />
            <option value="Healthcare" />
          </datalist>
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea 
            name="description" 
            className="md-input" 
            value={formData.description}
            onChange={handleChange}
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button type="button" className="md-button secondary" onClick={onCancel} disabled={loading}>Cancel</button>
          <button type="submit" className="md-button" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}
