import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getExpenses } from '../services/expense.service';
import { PlusCircle, MinusCircle, ArrowRight } from 'lucide-react';

export default function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const data = await getExpenses({ page: 1 });
      const recent = data.results || [];
      setExpenses(recent.slice(0, 5));
      
      let totalInc = 0;
      let totalExp = 0;
      recent.forEach(item => {
        if (item.type === 'Income') totalInc += parseFloat(item.amount);
        else totalExp += parseFloat(item.amount);
      });
      setSummary({ income: totalInc, expense: totalExp, balance: totalInc - totalExp });
      
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center mt-4">Loading Dashboard...</div>;

  return (
    <div>
      <div className="dashboard-grid">
        <div className="glass-panel">
          <h3 className="text-secondary flex items-center gap-2"><PlusCircle size={20} className="text-success" /> Income (Recent)</h3>
          <h2>${summary.income.toFixed(2)}</h2>
        </div>
        <div className="glass-panel">
          <h3 className="text-secondary flex items-center gap-2"><MinusCircle size={20} className="text-danger" /> Expenses (Recent)</h3>
          <h2>${summary.expense.toFixed(2)}</h2>
        </div>
        <div className="glass-panel" style={{ background: summary.balance >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}}>
          <h3 className="text-secondary">Balance (Recent)</h3>
          <h2>${summary.balance.toFixed(2)}</h2>
        </div>
      </div>

      <div className="glass-panel">
        <div className="flex justify-between items-center mb-4">
          <h3>Recent Transactions</h3>
          <Link to="/expenses" className="glass-button secondary">View All <ArrowRight size={16}/></Link>
        </div>
        
        {expenses.length === 0 ? (
          <p className="text-center text-secondary">No transactions found.</p>
        ) : (
          <div className="transaction-list">
            {expenses.map(expense => (
              <div key={expense.id} className="flex justify-between items-center glass-panel" style={{marginBottom: '0.5rem', padding: '1rem'}}>
                <div>
                  <h4 style={{marginBottom: '0.2rem'}}>{expense.description || expense.category}</h4>
                  <small className="text-secondary">{expense.date ? new Date(expense.date).toLocaleDateString() : 'N/A'}</small>
                </div>
                <h3 className={expense.type === 'Income' ? 'text-success' : 'text-danger'}>
                  {expense.type === 'Income' ? '+' : '-'}${parseFloat(expense.amount).toFixed(2)}
                </h3>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
