import { useState, useEffect } from 'react';
import { getExpenses, deleteExpense } from '../services/expense.service';
import ExpenseForm from '../components/ExpenseForm';
import { Plus, Trash2, Edit } from 'lucide-react';

export default function ExpensesView() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [params, setParams] = useState({ page: 1, type: '' });
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchExpenses();
  }, [params.page, params.type]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const data = await getExpenses(params);
      setExpenses(data.results || []);
      setTotalPages(Math.ceil((data.count || 0) / 10) || 1);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this specific record?')) return;
    try {
      await deleteExpense(id);
      fetchExpenses(); // Refetch page logic
    } catch (err) {
      alert('Delete failed');
    }
  };

  const handleEdit = (id) => {
    setEditingId(id);
    setShowModal(true);
  };

  const handleFormSuccess = () => {
    setShowModal(false);
    setEditingId(null);
    fetchExpenses();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2>Expenses</h2>
        <button 
          className="glass-button"
          onClick={() => { setEditingId(null); setShowModal(true); }}
        >
          <Plus size={18} /> Add New
        </button>
      </div>

      <div className="glass-panel mb-4 flex gap-4 items-center">
        <label className="text-secondary">Filter by Type:</label>
        <select 
          className="glass-input" 
          style={{width: 'auto'}} 
          value={params.type} 
          onChange={(e) => setParams({...params, type: e.target.value, page: 1})}
        >
          <option value="">All</option>
          <option value="Income">Income</option>
          <option value="Expense">Expense</option>
        </select>
      </div>

      <div className="glass-panel">
        {loading ? (
          <div className="text-center">Loading...</div>
        ) : expenses.length === 0 ? (
          <div className="text-center text-secondary">No records found.</div>
        ) : (
          <div style={{overflowX: 'auto'}}>
            <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left'}}>
              <thead>
                <tr style={{borderBottom: '1px solid var(--glass-border)'}}>
                  <th style={{padding: '1rem'}}>Date</th>
                  <th style={{padding: '1rem'}}>Category</th>
                  <th style={{padding: '1rem'}}>Type</th>
                  <th style={{padding: '1rem'}}>Amount</th>
                  <th style={{padding: '1rem'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(exp => (
                  <tr key={exp.id} style={{borderBottom: '1px solid rgba(255,255,255,0.05)'}}>
                    <td style={{padding: '1rem'}}>{exp.date ? new Date(exp.date).toLocaleDateString() : 'N/A'}</td>
                    <td style={{padding: '1rem'}}>{exp.category}</td>
                    <td style={{padding: '1rem'}}>
                      <span className={exp.type === 'Income' ? 'text-success' : 'text-danger'}>
                        {exp.type}
                      </span>
                    </td>
                    <td style={{padding: '1rem'}} className="text-accent">NPR {parseFloat(exp.amount).toFixed(2)}</td>
                    <td style={{padding: '1rem'}}>
                      <div className="flex gap-2">
                        <button className="glass-button secondary icon-only" onClick={() => handleEdit(exp.id)}><Edit size={16}/></button>
                        <button className="glass-button secondary icon-only text-danger" onClick={() => handleDelete(exp.id)}><Trash2 size={16}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        <div className="flex justify-between mt-4">
          <button 
            className="glass-button secondary" 
            disabled={params.page === 1}
            onClick={() => setParams({...params, page: params.page - 1})}
          >
            Previous
          </button>
          <span>Page {params.page} of {totalPages}</span>
          <button 
            className="glass-button secondary" 
            disabled={params.page >= totalPages}
            onClick={() => setParams({...params, page: params.page + 1})}
          >
            Next
          </button>
        </div>
      </div>

      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div className="glass-panel" style={{width: '90%', maxWidth: '500px'}}>
            <ExpenseForm 
              expenseId={editingId} 
              onSuccess={handleFormSuccess} 
              onCancel={() => setShowModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
