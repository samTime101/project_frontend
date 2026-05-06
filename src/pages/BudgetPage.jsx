import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Loading from '../components/Loading';
import { budgetService } from '../services/budget.service';
import { expenseService } from '../services/expense.service';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { PieChart, Plus, Trash2, Edit2, AlertTriangle, CheckCircle, FileText } from 'lucide-react';
import { exportBudgetsToPDF } from '../utils/pdfExport';

const BudgetPage = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [budgets, setBudgets] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ category: '', amount_limit: '', period: 'MONTHLY' });
  const [editingId, setEditingId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [budgetData, expenseData] = await Promise.all([
        budgetService.getBudgets(),
        expenseService.getExpenses()
      ]);
      const budgetList = Array.isArray(budgetData?.results) ? budgetData.results : Array.isArray(budgetData) ? budgetData : [];
      setBudgets(budgetList);
      setExpenses(expenseData.results || expenseData);
    } catch (error) {
      console.error('Failed to fetch budget data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const calculateActual = (category) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return expenses
      .filter(ex => 
        ex.category.toLowerCase() === category.toLowerCase() && 
        ex.type === 'Expense' &&
        new Date(ex.date) >= startOfMonth
      )
      .reduce((acc, ex) => acc + parseFloat(ex.amount), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await budgetService.updateBudget(editingId, formData);
      } else {
        await budgetService.createBudget(formData);
      }
      setShowModal(false);
      setFormData({ category: '', amount_limit: '', period: 'MONTHLY' });
      setEditingId(null);
      fetchData();
    } catch (error) {
      showNotification('Failed to save budget', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      try {
        await budgetService.deleteBudget(id);
        fetchData();
      } catch (error) {
        showNotification('Failed to delete budget', 'error');
      }
    }
  };

  const openEdit = (budget) => {
    setFormData({
      category: budget.category,
      amount_limit: budget.amount_limit,
      period: budget.period
    });
    setEditingId(budget.id);
    setShowModal(true);
  };

  return (
    <Layout>
      <div className="section-title">
        <h2>Monthly Budgets</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={() => exportBudgetsToPDF(budgets, expenses, user)} disabled={budgets.length === 0}>
            <FileText size={20} /> Export PDF
          </button>
          <button className="btn btn-primary" onClick={() => { setEditingId(null); setFormData({ category: '', amount_limit: '', period: 'MONTHLY' }); setShowModal(true); }}>
            <Plus size={20} /> Add Budget
          </button>
        </div>
      </div>

      <div className="planner-grid">
        {loading ? (
          <div className="planner-empty"><Loading /></div>
        ) : budgets.length === 0 ? (
          <div className="planner-empty">
            <PieChart size={48} color="var(--text-light)" />
            <h3>No budgets set</h3>
            <p>Set spending limits for different categories to stay on top of your finances.</p>
          </div>
        ) : budgets.map((budget) => {
          const actual = calculateActual(budget.category);
          const limit = parseFloat(budget.amount_limit);
          const percent = limit > 0 ? (actual / limit) * 100 : 0;
          const isOver = actual > limit;

          return (
            <div key={budget.id} className="card planner-card">
              <div className="planner-strip-head">
                <div>
                  <h4 style={{ fontSize: '1.2rem' }}>{budget.category}</h4>
                  <span className="planner-muted">{budget.period}</span>
                </div>
                <div className="toolbar-actions">
                  <button className="planner-icon-btn" onClick={() => openEdit(budget)}><Edit2 size={16} /></button>
                  <button className="planner-icon-btn" style={{ color: 'var(--error)' }} onClick={() => handleDelete(budget.id)}><Trash2 size={16} /></button>
                </div>
              </div>

              <div style={{ marginTop: '20px' }}>
                <div className="planner-metric-row">
                  <span>Usage</span>
                  <strong style={{ color: isOver ? 'var(--error)' : 'var(--text-main)' }}>{percent.toFixed(1)}%</strong>
                </div>
                <div className="planner-progress">
                  <div 
                    className={`planner-progress-bar ${isOver ? 'danger' : ''}`} 
                    style={{ width: `${Math.min(100, percent)}%` }}
                  ></div>
                </div>
                <div className="planner-metric-row" style={{ marginTop: '12px' }}>
                  <span className="planner-muted">Spent: NPR {actual.toLocaleString()}</span>
                  <span className="planner-muted">Limit: NPR {limit.toLocaleString()}</span>
                </div>
              </div>

              <div className="planner-badge-row" style={{ marginTop: '24px' }}>
                {isOver ? (
                  <div className="badge badge-error">
                    <AlertTriangle size={14} /> Over Budget
                  </div>
                ) : (
                  <div className="badge badge-success">
                    <CheckCircle size={14} /> Within Limit
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ marginBottom: '20px' }}>{editingId ? 'Edit Budget' : 'New Budget'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Category</label>
                <input type="text" className="input-field" placeholder="e.g. Food, Travel" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Monthly Limit (NPR)</label>
                <input type="number" className="input-field" placeholder="0.00" value={formData.amount_limit} onChange={(e) => setFormData({ ...formData, amount_limit: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Period</label>
                <select className="input-field" value={formData.period} onChange={(e) => setFormData({ ...formData, period: e.target.value })}>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="YEARLY">Yearly</option>
                </select>
              </div>
              <div className="form-grid-2" style={{ marginTop: '28px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingId ? 'Update Budget' : 'Set Budget'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default BudgetPage;
