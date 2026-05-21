import React, { useState, useEffect, useMemo } from 'react';
import Layout from '../components/Layout';
import { expenseService } from '../services/expense.service';
import ExpenseForm from '../components/ExpenseForm';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { Plus, Filter, Search, ChevronLeft, ChevronRight, Trash2, Edit3, FileText } from 'lucide-react';
import { exportExpensesToPDF } from '../utils/pdfExport';

const ExpensesView = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    category: '',
    start_date: '',
    end_date: '',
    min_amount: '',
    max_amount: ''
  });

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const params = { page };
      ['type', 'category', 'start_date', 'end_date', 'min_amount', 'max_amount'].forEach((key) => {
        if (filters[key]) {
          params[key] = filters[key];
        }
      });

      const data = await expenseService.getExpenses(params);
      const results = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
      setExpenses(results);
      setCount(typeof data?.count === 'number' ? data.count : results.length);
      setHasNext(Boolean(data?.next));
      setHasPrevious(Boolean(data?.previous) || page > 1);
    } catch (error) {
      console.error("Failed to fetch expenses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [page, filters.type, filters.category, filters.start_date, filters.end_date, filters.min_amount, filters.max_amount]);

  const visibleExpenses = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    if (!search) {
      return expenses;
    }

    return expenses.filter((item) => {
      const haystack = [
        item.category,
        item.description,
        item.type,
        item.amount
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(search);
    });
  }, [expenses, filters.search]);

  const handleSuccess = () => {
    setShowModal(false);
    setEditingId(null);
    fetchExpenses();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      try {
        await expenseService.deleteExpense(id);
        fetchExpenses();
      } catch (error) {
        showNotification("Failed to delete record", "error");
      }
    }
  };

  const handleEdit = (id) => {
    setEditingId(id);
    setShowModal(true);
  };

  const handleFilterChange = (key, value) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setPage(1);
    setFilters({
      search: '',
      type: '',
      category: '',
      start_date: '',
      end_date: '',
      min_amount: '',
      max_amount: ''
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
    }).format(amount);
  };

  const activeFilterCount = ['type', 'category', 'start_date', 'end_date', 'min_amount', 'max_amount']
    .filter((key) => Boolean(filters[key]))
    .length;

  return (
    <Layout>
      <div className="section-title">
        <h2>Expenses & Income</h2>
        <div className="toolbar-actions">
          <button className="btn btn-secondary" onClick={() => exportExpensesToPDF(visibleExpenses, user)} disabled={visibleExpenses.length === 0}>
            <FileText size={20} /> Export PDF
          </button>
          <button className="btn btn-primary" onClick={() => { setEditingId(null); setShowModal(true); }}>
            <Plus size={20} /> Add New
          </button>
        </div>
      </div>

      <div className="card card-flat-top" style={{ marginBottom: '24px' }}>
        <div className="toolbar-row">
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="input-field"
              placeholder="Search category, note, type..."
              style={{ paddingLeft: '40px' }}
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
          <button className="btn btn-secondary" onClick={() => setShowFilters((prev) => !prev)}>
            <Filter size={18} /> {activeFilterCount > 0 ? `Filters (${activeFilterCount})` : 'Filter'}
          </button>
        </div>

        {showFilters && (
          <div className="filter-panel">
            <div className="filter-grid">
              <select className="input-field" value={filters.type} onChange={(e) => handleFilterChange('type', e.target.value)}>
                <option value="">All Types</option>
                <option value="Income">Income</option>
                <option value="Expense">Expense</option>
              </select>
              <input
                type="text"
                className="input-field"
                placeholder="Category"
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
              />
              <input
                type="date"
                className="input-field"
                value={filters.start_date}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
              />
              <input
                type="date"
                className="input-field"
                value={filters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
              />
              <input
                type="number"
                min="0"
                className="input-field"
                placeholder="Min Amount"
                value={filters.min_amount}
                onChange={(e) => handleFilterChange('min_amount', e.target.value)}
              />
              <input
                type="number"
                min="0"
                className="input-field"
                placeholder="Max Amount"
                value={filters.max_amount}
                onChange={(e) => handleFilterChange('max_amount', e.target.value)}
              />
            </div>
            <div className="filter-actions">
              <button className="btn btn-secondary" onClick={clearFilters}>Clear Filters</button>
            </div>
          </div>
        )}
      </div>

      <div className="card card-flat-top" style={{ padding: '0' }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Type</th>
                <th>Amount</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>Loading...</td></tr>
              ) : visibleExpenses.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  {expenses.length === 0 ? 'No records yet. Add your first income or expense.' : 'No records match the current search or filters.'}
                </td></tr>
              ) : visibleExpenses.map(item => (
                <tr key={item.id}>
                  <td>{new Date(item.date).toLocaleDateString()}</td>
                  <td style={{ fontWeight: 600 }}>{item.category}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{item.description}</td>
                  <td>
                    <span className={`badge ${item.type === 'Income' ? 'badge-income' : 'badge-expense'}`}>
                      {item.type}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: item.type === 'Income' ? 'var(--success)' : 'var(--text-main)' }}>
                    {item.type === 'Income' ? '+' : '-'}{formatCurrency(item.amount)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                      <button className="btn" style={{ padding: '6px', background: 'none', color: 'var(--text-muted)' }} onClick={() => handleEdit(item.id)}><Edit3 size={18} /></button>
                      <button className="btn" style={{ padding: '6px', background: 'none', color: 'var(--error)' }} onClick={() => handleDelete(item.id)}><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Showing {visibleExpenses.length} of {count} results</p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" style={{ padding: '8px' }} disabled={!hasPrevious} onClick={() => setPage(p => Math.max(1, p - 1))}>
              <ChevronLeft size={20} />
            </button>
            <button className="btn btn-secondary" style={{ padding: '8px' }} disabled={!hasNext} onClick={() => setPage(p => p + 1)}>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <ExpenseForm 
              expenseId={editingId} 
              onSuccess={handleSuccess} 
              onCancel={() => { setShowModal(false); setEditingId(null); }} 
            />
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ExpensesView;
