import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import Loading from '../components/Loading';
import { useAuth } from '../context/AuthContext';
import { transactionService } from '../services/transaction.service';
import { paymentPlanService } from '../services/paymentplan.service';
import { useNotification } from '../context/NotificationContext';
import SuccessModal from '../components/SuccessModal';
import { Send, ArrowDownLeft, Search, Clock, CheckCircle2, XCircle, AlertCircle, Eye, Filter, FileText } from 'lucide-react';
import { exportTransactionsToPDF } from '../utils/pdfExport';

const TransactionsPage = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    type: ''
  });
  const [formData, setFormData] = useState({
    target_email: '',
    amount: '',
    transaction_type: 'SEND',
    description: '',
    payment_plan_id: ''
  });

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const data = await transactionService.getTransactions();
      setTransactions(Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

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

  const visibleTransactions = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return transactions.filter((tx) => {
      const matchesStatus = !filters.status || tx.status === filters.status;
      const matchesType = !filters.type || tx.transaction_type === filters.type;
      const haystack = [tx.initiator_name, tx.target_name, tx.description, tx.amount, tx.status, tx.transaction_type]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const matchesSearch = !search || haystack.includes(search);
      return matchesStatus && matchesType && matchesSearch;
    });
  }, [transactions, filters]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        target_email: formData.target_email,
        amount: formData.amount,
        transaction_type: formData.transaction_type,
        description: formData.description
      };

      if (formData.transaction_type === 'SEND' && formData.payment_plan_id) {
        payload.payment_plan_id = Number(formData.payment_plan_id);
      }

      await transactionService.createTransaction(payload);

      if (formData.transaction_type === 'SEND' && formData.payment_plan_id) {
        try {
          await paymentPlanService.markCompleted(Number(formData.payment_plan_id));
        } catch {
          showNotification('Money was sent, but the selected plan could not be marked completed automatically.', 'warning');
        }
      }

      setSuccessMsg(`${formData.transaction_type === 'SEND' ? 'Sent' : 'Requested'} NPR ${formData.amount} to ${formData.target_email}`);
      setShowSuccess(true);
      setShowModal(false);
      setFormData({ target_email: '', amount: '', transaction_type: 'SEND', description: '', payment_plan_id: '' });
      fetchTransactions();
      fetchPlans();
    } catch (error) {
      showNotification(error.response?.data?.detail || 'Failed to initiate transaction', 'error');
    }
  };

  const handleRespond = async (id, action) => {
    try {
      await transactionService.respondToTransaction(id, action);
      if (action === 'accept') {
        const tx = transactions.find(t => t.id === id);
        setSuccessMsg(`Paid NPR ${tx?.amount} to ${tx?.initiator_name}`);
        setShowSuccess(true);
      }
      setSelectedTransaction(null);
      fetchTransactions();
    } catch {
      showNotification('Failed to respond to transaction', 'error');
    }
  };

  const handleCancelRequest = async (id) => {
    try {
      await transactionService.cancelTransaction(id);
      setSelectedTransaction(null);
      fetchTransactions();
    } catch {
      showNotification('Failed to cancel transaction', 'error');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle2 size={18} color="var(--success)" />;
      case 'PENDING': return <Clock size={18} color="orange" />;
      case 'DECLINED': return <XCircle size={18} color="var(--error)" />;
      case 'CANCELED': return <AlertCircle size={18} color="var(--text-muted)" />;
      default: return null;
    }
  };

  const userNameCandidates = [
    `${user?.first_name || ''} ${user?.last_name || ''}`.trim().toLowerCase(),
    String(user?.first_name || '').trim().toLowerCase(),
    String(user?.last_name || '').trim().toLowerCase()
  ].filter(Boolean);

  const matchesCurrentUser = (name) => userNameCandidates.includes(String(name || '').trim().toLowerCase());
  const isIncomingPendingRequest = (tx) => tx.status === 'PENDING' && tx.transaction_type === 'REQUEST' && matchesCurrentUser(tx.target_name);
  const isOutgoingPendingRequest = (tx) => tx.status === 'PENDING' && tx.transaction_type === 'REQUEST' && matchesCurrentUser(tx.initiator_name);

  const activeTransactionFilterCount = ['status', 'type'].filter((key) => Boolean(filters[key])).length;

  return (
    <Layout>
      <SuccessModal isOpen={showSuccess} message={successMsg} onClose={() => setShowSuccess(false)} />
      <div className="section-title">
        <h2 style={{ fontSize: '1.8rem' }}>Money Transfers</h2>
        <div className="toolbar-actions">
          <button className="btn btn-secondary" onClick={() => exportTransactionsToPDF(visibleTransactions, user)} disabled={visibleTransactions.length === 0}>
            <FileText size={20} /> Export PDF
          </button>
          <button className="btn btn-secondary" onClick={() => { setFormData({ target_email: '', amount: '', transaction_type: 'REQUEST', description: '', payment_plan_id: '' }); setShowModal(true); }}>
            <ArrowDownLeft size={20} /> Request
          </button>
          <button className="btn btn-primary" onClick={() => { setFormData({ target_email: '', amount: '', transaction_type: 'SEND', description: '', payment_plan_id: '' }); setShowModal(true); fetchPlans(); }}>
            <Send size={20} /> Send Money
          </button>
        </div>
      </div>

      <div className="card card-flat-top" style={{ marginBottom: '24px' }}>
        <div className="toolbar-row">
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="text" className="input-field" placeholder="Search by person or note..." style={{ paddingLeft: '40px' }} value={filters.search} onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))} />
          </div>
          <button className="btn btn-secondary" onClick={() => setShowFilters((prev) => !prev)}>
            <Filter size={18} /> {activeTransactionFilterCount > 0 ? `Filters (${activeTransactionFilterCount})` : 'Filter'}
          </button>
        </div>

        {showFilters && (
          <div className="filter-panel">
            <div className="filter-grid filter-grid-compact">
              <select className="input-field" value={filters.status} onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}>
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="COMPLETED">Completed</option>
                <option value="DECLINED">Declined</option>
                <option value="CANCELED">Canceled</option>
              </select>
              <select className="input-field" value={filters.type} onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}>
                <option value="">All Types</option>
                <option value="SEND">Send</option>
                <option value="REQUEST">Request</option>
              </select>
            </div>
            <div className="filter-actions">
              <button className="btn btn-secondary" onClick={() => setFilters({ search: '', status: '', type: '' })}>Clear Filters</button>
            </div>
          </div>
        )}
      </div>

      <div className="card card-flat-top" style={{ padding: '0' }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Status</th>
                <th>From/To</th>
                <th>Type</th>
                <th>Description</th>
                <th>Amount</th>
                <th style={{ textAlign: 'right' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}><Loading /></td></tr>
              ) : visibleTransactions.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  {transactions.length === 0 ? 'No transfers found. Send or request money to get started.' : 'No transfers match the current search or filters.'}
                </td></tr>
              ) : visibleTransactions.map((tx) => (
                <tr key={tx.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {getStatusIcon(tx.status)}
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{tx.status}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{matchesCurrentUser(tx.initiator_name) ? tx.target_name : tx.initiator_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(tx.created_at).toLocaleString()}</div>
                  </td>
                  <td><span className="badge" style={{ background: tx.transaction_type === 'SEND' ? 'rgba(45, 149, 150, 0.1)' : 'rgba(154, 208, 194, 0.1)', color: 'var(--primary)' }}>{tx.transaction_type}</span></td>
                  <td style={{ color: 'var(--text-muted)' }}>{tx.description || '-'}</td>
                  <td style={{ fontWeight: 700 }}>NPR {tx.amount}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="transaction-action-row">
                      <button className="btn btn-secondary transaction-view-btn" onClick={() => setSelectedTransaction(tx)}>
                        <Eye size={16} />
                        <span>View</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ padding: '20px', borderTop: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Showing {visibleTransactions.length} of {transactions.length} transfers</p>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ marginBottom: '20px' }}>{formData.transaction_type === 'SEND' ? 'Send Money' : 'Request Money'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Recipient Email</label>
                <div style={{ position: 'relative' }}>
                  <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                  <input type="email" className="input-field" placeholder="friend@example.com" style={{ paddingLeft: '44px' }} value={formData.target_email} onChange={(e) => setFormData({ ...formData, target_email: e.target.value })} required />
                </div>
              </div>
              <div className="form-group">
                <label>Amount (NPR)</label>
                <input type="number" className="input-field" placeholder="0.00" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
              </div>
              {formData.transaction_type === 'SEND' && (
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
                  {formData.payment_plan_id && (
                    <p style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Selected plan will be marked completed after sending.
                    </p>
                  )}
                </div>
              )}
              <div className="form-group">
                <label>Note (Optional)</label>
                <input type="text" className="input-field" placeholder="What is this for?" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '28px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{formData.transaction_type === 'SEND' ? 'Send Money' : 'Send Request'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedTransaction && (
        <div className="modal-overlay" onClick={() => setSelectedTransaction(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: '20px' }}>Transaction Details</h3>
            <div className="transaction-detail-grid">
              <div className="transaction-detail-item"><span>Status</span><strong>{selectedTransaction.status}</strong></div>
              <div className="transaction-detail-item"><span>Type</span><strong>{selectedTransaction.transaction_type}</strong></div>
              <div className="transaction-detail-item"><span>From</span><strong>{selectedTransaction.initiator_name}</strong></div>
              <div className="transaction-detail-item"><span>To</span><strong>{selectedTransaction.target_name}</strong></div>
              <div className="transaction-detail-item"><span>Amount</span><strong>NPR {selectedTransaction.amount}</strong></div>
              <div className="transaction-detail-item full"><span>Description</span><strong>{selectedTransaction.description || 'No note added'}</strong></div>
              <div className="transaction-detail-item full"><span>Created</span><strong>{new Date(selectedTransaction.created_at).toLocaleString()}</strong></div>
            </div>

            {isIncomingPendingRequest(selectedTransaction) && (
              <div className="form-grid-2" style={{ marginTop: '20px' }}>
                <button className="btn btn-primary" onClick={() => handleRespond(selectedTransaction.id, 'accept')}>Accept</button>
                <button className="btn btn-secondary" style={{ color: 'var(--error)', borderColor: 'var(--error)' }} onClick={() => handleRespond(selectedTransaction.id, 'decline')}>Decline</button>
              </div>
            )}

            {isOutgoingPendingRequest(selectedTransaction) && (
              <button className="btn btn-secondary" style={{ width: '100%', marginTop: '20px', color: 'var(--error)', borderColor: 'var(--error)' }} onClick={() => handleCancelRequest(selectedTransaction.id)}>
                Cancel Request
              </button>
            )}

            <button className="btn btn-secondary" style={{ width: '100%', marginTop: '16px' }} onClick={() => setSelectedTransaction(null)}>Close</button>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default TransactionsPage;
