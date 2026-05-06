import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Loading from '../components/Loading';
import { paymentPlanService } from '../services/paymentplan.service';
import { Plus, Calendar, CheckCircle2, Ban, Trash2, Edit3 } from 'lucide-react';

const emptyPlan = {
  title: '',
  amount: '',
  description: '',
  due_date: new Date().toISOString().slice(0, 10)
};

const PaymentPlansPage = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState(emptyPlan);
  const [error, setError] = useState('');

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const data = await paymentPlanService.getPaymentPlans();
      setPlans(Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : []);
      setError('');
    } catch {
      setPlans([]);
      setError('Could not load payment plans.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const resetModal = () => {
    setShowModal(false);
    setEditingPlan(null);
    setFormData(emptyPlan);
  };

  const openCreateModal = () => {
    setEditingPlan(null);
    setFormData(emptyPlan);
    setShowModal(true);
  };

  const openEditModal = (plan) => {
    setEditingPlan(plan);
    setFormData({
      title: plan.title || '',
      amount: plan.amount || '',
      description: plan.description || '',
      due_date: plan.due_date || new Date().toISOString().slice(0, 10)
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      title: formData.title,
      amount: Number(formData.amount || 0).toFixed(2),
      description: formData.description,
      ...(formData.due_date ? { due_date: formData.due_date } : {})
    };

    try {
      if (editingPlan) {
        await paymentPlanService.updatePaymentPlan(editingPlan.id, payload);
      } else {
        await paymentPlanService.createPaymentPlan(payload);
      }
      resetModal();
      fetchPlans();
    } catch {
      setError('Failed to save payment plan.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this payment plan?')) return;
    await paymentPlanService.deletePaymentPlan(id);
    fetchPlans();
  };

  const handleMarkCompleted = async (id) => {
    await paymentPlanService.markCompleted(id);
    fetchPlans();
  };

  const handleMarkCanceled = async (id) => {
    await paymentPlanService.markCanceled(id);
    fetchPlans();
  };

  const formatMoney = (amount) =>
    new Intl.NumberFormat('en-NP', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(amount || 0));

  const getStatusBadgeClass = (status) => {
    if (status === 'COMPLETED') return 'badge badge-success';
    if (status === 'CANCELED') return 'badge badge-error';
    return 'badge badge-warning';
  };

  return (
    <Layout>
      <div className="section-title">
        <h2>Payment Plans</h2>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <Plus size={18} /> New Plan
        </button>
      </div>

      {error && <div className="error-message card-flat-top">{error}</div>}

      {loading ? (
        <div className="flex-center" style={{ height: '50vh' }}>
          <Loading />
        </div>
      ) : (
        <div className="planner-grid">
          {plans.length === 0 ? (
            <div className="card planner-empty">
              <Calendar size={36} />
              <h3>No payment plans yet</h3>
              <p>Create a plan to track upcoming payments and commitments.</p>
            </div>
          ) : (
            plans.map((plan) => (
              <div key={plan.id} className="card planner-card">
                <div className="planner-card-top">
                  <div>
                    <span className={getStatusBadgeClass(plan.status)}>{plan.status}</span>
                    <h3>{plan.title}</h3>
                  </div>
                  <button className="planner-icon-btn" onClick={() => openEditModal(plan)} disabled={plan.status !== 'PENDING'} title={plan.status !== 'PENDING' ? 'Only pending plans can be edited' : 'Edit plan'}>
                    <Edit3 size={16} />
                  </button>
                </div>

                <div className="planner-metric-row">
                  <span>Amount</span>
                  <strong>NPR {formatMoney(plan.amount)}</strong>
                </div>
                <div className="planner-metric-row">
                  <span>Due Date</span>
                  <strong>{plan.due_date || 'No date'}</strong>
                </div>

                <p className="planner-muted">{plan.description || 'No description added.'}</p>

                <div className="planner-card-actions">
                  {plan.status === 'PENDING' ? (
                    <>
                      <button className="btn btn-secondary" onClick={() => handleMarkCompleted(plan.id)}>
                        <CheckCircle2 size={16} /> Complete
                      </button>
                      <button className="btn btn-secondary" onClick={() => handleMarkCanceled(plan.id)}>
                        <Ban size={16} /> Cancel
                      </button>
                    </>
                  ) : (
                    <div className="planner-muted">This plan is already {plan.status.toLowerCase()}.</div>
                  )}
                  <button className="planner-icon-btn" onClick={() => handleDelete(plan.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={resetModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: '20px' }}>{editingPlan ? 'Edit Payment Plan' : 'Create Payment Plan'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title</label>
                <input className="input-field" value={formData.title} onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))} required />
              </div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Amount</label>
                  <input type="number" step="0.01" className="input-field" value={formData.amount} onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label>Due Date</label>
                  <input type="date" className="input-field" value={formData.due_date} onChange={(e) => setFormData((prev) => ({ ...prev, due_date: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows="3" className="input-field" value={formData.description} onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))} />
              </div>
              <div className="form-grid-2">
                <button type="button" className="btn btn-secondary" onClick={resetModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingPlan ? 'Save Changes' : 'Create Plan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default PaymentPlansPage;
