import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Loading from '../components/Loading';
import { useAuth } from '../context/AuthContext';
import { savingsService } from '../services/savings.service';
import { useNotification } from '../context/NotificationContext';
import { PiggyBank, Plus, Target, Calendar, Trash2, Edit2, TrendingUp, FileText } from 'lucide-react';
import { exportSavingsToPDF } from '../utils/pdfExport';

const SavingsPage = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', target_amount: '', current_amount: '', due_date: '' });
  const [editingId, setEditingId] = useState(null);

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const data = await savingsService.getSavingsGoals();
      const list = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
      setGoals(list);
    } catch (error) {
      console.error('Failed to fetch savings goals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await savingsService.updateSavingsGoal(editingId, formData);
      } else {
        await savingsService.createSavingsGoal(formData);
      }
      setShowModal(false);
      setFormData({ title: '', target_amount: '', current_amount: '', due_date: '' });
      setEditingId(null);
      fetchGoals();
    } catch (error) {
      showNotification('Failed to save goal', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      try {
        await savingsService.deleteSavingsGoal(id);
        fetchGoals();
      } catch (error) {
        showNotification('Failed to delete goal', 'error');
      }
    }
  };

  const openEdit = (goal) => {
    setFormData({
      title: goal.title,
      target_amount: goal.target_amount,
      current_amount: goal.current_amount,
      due_date: goal.due_date || ''
    });
    setEditingId(goal.id);
    setShowModal(true);
  };

  const totalSaved = goals.reduce((acc, goal) => acc + parseFloat(goal.current_amount), 0);
  const totalTarget = goals.reduce((acc, goal) => acc + parseFloat(goal.target_amount), 0);
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  return (
    <Layout>
      <div className="section-title">
        <h2>Savings Goals</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={() => exportSavingsToPDF(goals, user)} disabled={goals.length === 0}>
            <FileText size={20} /> Export PDF
          </button>
          <button className="btn btn-primary" onClick={() => { setEditingId(null); setFormData({ title: '', target_amount: '', current_amount: '', due_date: '' }); setShowModal(true); }}>
            <Plus size={20} /> Create Goal
          </button>
        </div>
      </div>

      <div className="planner-grid">
        <div className="card planner-card" style={{ gridColumn: '1 / -1', minHeight: 'auto', flexDirection: 'row', alignItems: 'center', gap: '32px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <p className="planner-muted">Overall Savings Progress</p>
            <h3 style={{ margin: '8px 0' }}>NPR {totalSaved.toLocaleString()} / {totalTarget.toLocaleString()}</h3>
            <div className="planner-progress" style={{ height: '12px' }}>
              <div className="planner-progress-bar" style={{ width: `${overallProgress}%` }}></div>
            </div>
          </div>
          <div className="profile-summary-card" style={{ background: 'var(--success-light)', color: 'var(--success)', minWidth: '140px' }}>
            <span>Total Saved</span>
            <strong>NPR {totalSaved.toLocaleString()}</strong>
          </div>
        </div>

        {loading ? (
          <div className="planner-empty"><Loading /></div>
        ) : goals.length === 0 ? (
          <div className="planner-empty">
            <PiggyBank size={48} color="var(--text-light)" />
            <h3>No savings goals yet</h3>
            <p>Start saving for your future by creating your first goal!</p>
          </div>
        ) : goals.map((goal) => (
          <div key={goal.id} className="card goal-card">
            <div className="goal-meta-row">
              <div>
                <h4 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{goal.title}</h4>
                <div className="planner-date">
                  <Calendar size={14} /> {goal.due_date ? new Date(goal.due_date).toLocaleDateString() : 'No deadline'}
                </div>
              </div>
              <div className="toolbar-actions">
                <button className="planner-icon-btn" onClick={() => openEdit(goal)}><Edit2 size={16} /></button>
                <button className="planner-icon-btn" style={{ color: 'var(--error)' }} onClick={() => handleDelete(goal.id)}><Trash2 size={16} /></button>
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <div className="planner-metric-row" style={{ marginBottom: '8px' }}>
                <span>Progress</span>
                <strong>{goal.progress_percentage}%</strong>
              </div>
              <div className="planner-progress">
                <div className="planner-progress-bar" style={{ width: `${goal.progress_percentage}%` }}></div>
              </div>
              <div className="planner-metric-row" style={{ marginTop: '12px' }}>
                <span className="planner-muted">Saved: NPR {parseFloat(goal.current_amount).toLocaleString()}</span>
                <span className="planner-muted">Target: NPR {parseFloat(goal.target_amount).toLocaleString()}</span>
              </div>
            </div>

            <div className="planner-card-actions" style={{ marginTop: '24px' }}>
              <div className="badge badge-success">
                <TrendingUp size={14} /> {goal.progress_percentage >= 100 ? 'Goal Reached!' : 'On Track'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ marginBottom: '20px' }}>{editingId ? 'Edit Goal' : 'New Savings Goal'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Goal Title</label>
                <div style={{ position: 'relative' }}>
                  <Target size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                  <input type="text" className="input-field" placeholder="e.g. New Laptop" style={{ paddingLeft: '44px' }} value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
                </div>
              </div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Target Amount</label>
                  <input type="number" className="input-field" placeholder="0.00" value={formData.target_amount} onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Current Saved</label>
                  <input type="number" className="input-field" placeholder="0.00" value={formData.current_amount} onChange={(e) => setFormData({ ...formData, current_amount: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>Target Date (Optional)</label>
                <input type="date" className="input-field" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} />
              </div>
              <div className="form-grid-2" style={{ marginTop: '28px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingId ? 'Update Goal' : 'Create Goal'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default SavingsPage;
