import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Loading from '../components/Loading';
import { analyticsService } from '../services/analytics.service';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { TrendingUp, PieChart as PieIcon, BarChart3, Activity } from 'lucide-react';

const COLORS = ['#2D959E', '#9AD0C2', '#5DAFB8', '#F1F8F8', '#1F6B72', '#E76161'];

const AnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const analyticsData = await analyticsService.getAnalytics();
      setData(analyticsData);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) return <Layout><div className="flex-center" style={{ height: '80vh' }}><Loading /></div></Layout>;

  if (!data || (data.category_distribution.length === 0 && data.monthly_trends.length === 0)) {
    return (
      <Layout>
        <div className="section-title"><h2>Financial Insights</h2></div>
        <div className="chart-empty">
          <Activity size={64} color="var(--text-light)" />
          <h3>No data for analysis yet</h3>
          <p>Add some expenses and income to see your financial patterns here.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="section-title">
        <h2>Financial Analytics</h2>
        <div className="toolbar-actions">
          <button className="btn btn-secondary" onClick={fetchAnalytics}><Activity size={18} /> Refresh</button>
        </div>
      </div>

      <div className="chart-page">
        <div className="chart-stat-grid">
          <div className="card chart-stat-card income">
            <p>Avg. Monthly Income</p>
            <div className="chart-stat-value">NPR {(data.monthly_trends.reduce((a, b) => a + b.income, 0) / data.monthly_trends.length).toLocaleString()}</div>
            <div className="chart-stat-icon"><TrendingUp size={20} /></div>
          </div>
          <div className="card chart-stat-card expense">
            <p>Avg. Monthly Spending</p>
            <div className="chart-stat-value">NPR {(data.monthly_trends.reduce((a, b) => a + b.expense, 0) / data.monthly_trends.length).toLocaleString()}</div>
            <div className="chart-stat-icon"><BarChart3 size={20} /></div>
          </div>
          <div className="card chart-stat-card savings">
            <p>Total Savings Rate</p>
            <div className="chart-stat-value">
              {((1 - (data.monthly_trends.reduce((a, b) => a + b.expense, 0) / Math.max(1, data.monthly_trends.reduce((a, b) => a + b.income, 0)))) * 100).toFixed(1)}%
            </div>
            <div className="chart-stat-icon"><Activity size={20} /></div>
          </div>
        </div>

        <div className="chart-grid-two">
          <div className="card chart-card">
            <div className="chart-head">
              <h4>Income vs Expenses</h4>
              <TrendingUp size={18} color="var(--primary)" />
            </div>
            <div className="chart-box">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.monthly_trends}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--error)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--error)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-md)' }}
                  />
                  <Area type="monotone" dataKey="income" stroke="var(--primary)" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={3} />
                  <Area type="monotone" dataKey="expense" stroke="var(--error)" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card chart-card">
            <div className="chart-head">
              <h4>Spending by Category</h4>
              <PieIcon size={18} color="var(--primary)" />
            </div>
            <div className="chart-box">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.category_distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="total"
                    nameKey="category"
                  >
                    {data.category_distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-md)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="card chart-card" style={{ marginBottom: '0' }}>
          <div className="chart-head">
            <h4>Budget vs Actual Performance</h4>
            <BarChart3 size={18} color="var(--primary)" />
          </div>
          <div className="chart-box-lg">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.budget_vs_actual} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="category" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{fill: 'rgba(45, 149, 158, 0.05)'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-md)' }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="budget" fill="var(--secondary)" radius={[6, 6, 0, 0]} name="Planned Budget" />
                <Bar dataKey="actual" fill="var(--primary)" radius={[6, 6, 0, 0]} name="Actual Spent" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AnalyticsPage;
