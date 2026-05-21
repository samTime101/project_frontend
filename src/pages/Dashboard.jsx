import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import ExpenseForm from '../components/ExpenseForm';
import TransactionForm from '../components/TransactionForm';
import { paymentPlanService } from '../services/paymentplan.service';
import { PlusCircle, Send, ArrowDownLeft, Calendar, FileText, CreditCard, X, TrendingUp, PiggyBank, PieChart, Target, Smartphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [activeModal, setActiveModal] = useState(null);
  const [plans, setPlans] = useState([]);
  const [planForm, setPlanForm] = useState({
    title: '',
    amount: '',
    description: '',
    due_date: new Date().toISOString().slice(0, 10)
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NP', {
      minimumFractionDigits: 2
    }).format(amount);
  };

  const fetchPlans = async () => {
    try {
      const data = await paymentPlanService.getPaymentPlans();
      const list = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
      setPlans(list.slice(0, 3));
    } catch {
      setPlans([]);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleSuccess = () => {
    setActiveModal(null);
    refreshUser();
    fetchPlans();
  };

  const handlePlanSubmit = async (e) => {
    e.preventDefault();
    await paymentPlanService.createPaymentPlan({
      title: planForm.title,
      amount: Number(planForm.amount || 0).toFixed(2),
      description: planForm.description,
      ...(planForm.due_date ? { due_date: planForm.due_date } : {})
    });
    setPlanForm({
      title: '',
      amount: '',
      description: '',
      due_date: new Date().toISOString().slice(0, 10)
    });
    handleSuccess();
  };

  const renderModalContent = () => {
    switch (activeModal) {
      case 'LOAD':
        return <ExpenseForm initialType="Income" onSuccess={handleSuccess} onCancel={() => setActiveModal(null)} />;
      case 'SEND':
        return <TransactionForm type="SEND" onSuccess={handleSuccess} onCancel={() => setActiveModal(null)} />;
      case 'REQUEST':
        return <TransactionForm type="REQUEST" onSuccess={handleSuccess} onCancel={() => setActiveModal(null)} />;
      case 'PLAN':
        return (
          <div>
            <h3 style={{ marginBottom: '20px' }}>Create Payment Plan</h3>
            <form onSubmit={handlePlanSubmit}>
              <div className="form-group">
                <label>Title</label>
                <input className="input-field" value={planForm.title} onChange={(e) => setPlanForm({ ...planForm, title: e.target.value })} required />
              </div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Amount</label>
                  <input type="number" className="input-field" value={planForm.amount} onChange={(e) => setPlanForm({ ...planForm, amount: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Due Date</label>
                  <input type="date" className="input-field" value={planForm.due_date} onChange={(e) => setPlanForm({ ...planForm, due_date: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows="3" className="input-field" value={planForm.description} onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })} />
              </div>
              <div className="form-grid-2" style={{ marginTop: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Plan</button>
              </div>
            </form>
          </div>
        );
      case 'EXPENSE':
        return <ExpenseForm initialType="Expense" onSuccess={handleSuccess} onCancel={() => setActiveModal(null)} />;
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="dash-header">
        <div className="user-profile-row">
          <div className="dash-user-block">
            <div className="avatar-circle">
              {user?.first_name?.[0] || 'U'}
            </div>
            <div className="dash-user-copy">
              <h3 className="dash-user-name">{user?.first_name} {user?.last_name}</h3>
              <div className="dash-user-balance">NPR {formatCurrency(user?.balance || 0)}</div>
              <div className="dash-user-label">Total Balance</div>
            </div>
          </div>
          <div className="dash-brand-pill">
            <CreditCard size={14} />
            EXPENSER
          </div>
        </div>
      </div>

      <div className="balance-box">
        <div className="service-item" style={{ padding: '12px', flex: 1 }} onClick={() => setActiveModal('LOAD')}>
          <div className="icon-box"><PlusCircle size={24} /></div>
          <span>Load</span>
        </div>
        <div className="service-item" style={{ padding: '12px', flex: 1 }} onClick={() => setActiveModal('SEND')}>
          <div className="icon-box"><Send size={24} /></div>
          <span>Send</span>
        </div>
        <div className="service-item" style={{ padding: '12px', flex: 1 }} onClick={() => setActiveModal('REQUEST')}>
          <div className="icon-box"><ArrowDownLeft size={24} /></div>
          <span>Request</span>
        </div>
        <div className="service-item" style={{ padding: '12px', flex: 1 }} onClick={() => setActiveModal('PLAN')}>
          <div className="icon-box"><Calendar size={24} /></div>
          <span>Plan</span>
        </div>
      </div>

      <div className="service-card">
        <h4>Financial Tools</h4>
        <div className="service-grid">
          <div className="service-item" onClick={() => navigate('/savings')}>
            <div className="icon-box"><PiggyBank size={24} /></div>
            <span>Savings</span>
          </div>
          <div className="service-item" onClick={() => navigate('/budget')}>
            <div className="icon-box"><PieChart size={24} /></div>
            <span>Budgets</span>
          </div>
          <div className="service-item" onClick={() => navigate('/expenses')}>
            <div className="icon-box"><FileText size={24} /></div>
            <span>Expenses</span>
          </div>
          <div className="service-item" onClick={() => navigate('/payment-plans')}>
            <div className="icon-box"><Target size={24} /></div>
            <span>All Plans</span>
          </div>
          <div className="service-item" onClick={() => navigate('/ncell')}>
            <div className="icon-box"><Smartphone size={24} /></div>
            <span>Ncell Packs</span>
          </div>
          <div className="service-item" onClick={() => navigate('/ntc')}>
            <div className="icon-box"><Smartphone size={24} /></div>
            <span>NTC Packs</span>
          </div>
        </div>
      </div>

      <div className="service-card">
        <div className="planner-strip-head">
          <h4>Recent Payment Plans</h4>
          <span className="planner-muted">Latest</span>
        </div>
        {plans.length === 0 ? (
          <p className="planner-muted">No payment plans yet. Create one from the quick actions.</p>
        ) : (
          <div className="budget-strip-list">
            {plans.map((plan) => (
              <div key={plan.id} className="budget-strip-item">
                <div className="budget-strip-row">
                  <strong>{plan.title}</strong>
                  <span>NPR {formatCurrency(plan.amount)}</span>
                </div>
                <div className="budget-strip-row planner-muted">
                  <span>{plan.due_date || 'No due date'}</span>
                  <span>{plan.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="service-card">
        <div className="planner-strip-head">
          <h4>Account Overview</h4>
          <TrendingUp size={18} color="var(--primary)" />
        </div>
        <div className="dash-overview-grid">
          <div className="dash-overview-card">
            <span className="planner-muted">Income</span>
            <strong>NPR {formatCurrency(user?.total_income || 0)}</strong>
          </div>
          <div className="dash-overview-card">
            <span className="planner-muted">Expense</span>
            <strong>NPR {formatCurrency(user?.total_expense || 0)}</strong>
          </div>
          <div className="dash-overview-card">
            <span className="planner-muted">Balance</span>
            <strong>NPR {formatCurrency(user?.balance || 0)}</strong>
          </div>
        </div>
      </div>

      {activeModal && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
            <button onClick={() => setActiveModal(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', color: 'var(--text-light)' }}>
              <X size={24} />
            </button>
            {renderModalContent()}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Dashboard;
