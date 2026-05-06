import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const generatePDF = (title, columns, rows, user) => {
  const doc = new jsPDF();
  
  doc.text(title, 14, 15);
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);
  doc.text(`User: ${user?.first_name} ${user?.last_name} (${user?.email})`, 14, 28);

  autoTable(doc, {
    head: [columns],
    body: rows,
    startY: 35,
    theme: 'striped',
    headStyles: { fillColor: [45, 149, 150] },
  });

  doc.save(`${title.toLowerCase().replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
};


export const exportTransactionsToPDF = (transactions, user) => {
  const columns = ["Date", "Status", "From/To", "Type", "Description", "Amount (NPR)"];
  
  const userNameCandidates = [
    `${user?.first_name || ''} ${user?.last_name || ''}`.trim().toLowerCase(),
    String(user?.first_name || '').trim().toLowerCase(),
    String(user?.last_name || '').trim().toLowerCase()
  ].filter(Boolean);

  const matchesCurrentUser = (name) => userNameCandidates.includes(String(name || '').trim().toLowerCase());

  const rows = transactions.map(tx => [
    new Date(tx.created_at).toLocaleString(),
    tx.status,
    matchesCurrentUser(tx.initiator_name) ? tx.target_name : tx.initiator_name,
    tx.transaction_type,
    tx.description || '-',
    tx.amount
  ]);

  generatePDF("Transaction Statement", columns, rows, user);
};

export const exportExpensesToPDF = (expenses, user) => {
  const columns = ["Date", "Category", "Description", "Type", "Amount (NPR)"];
  
  const rows = expenses.map(item => [
    new Date(item.date).toLocaleDateString(),
    item.category,
    item.description || '-',
    item.type,
    item.amount
  ]);

  generatePDF("Expense Statement", columns, rows, user);
};

export const exportSavingsToPDF = (goals, user) => {
  const columns = ["Title", "Target Amount", "Current Amount", "Progress (%)", "Due Date"];
  
  const rows = goals.map(goal => [
    goal.title,
    goal.target_amount,
    goal.current_amount,
    goal.progress_percentage,
    goal.due_date ? new Date(goal.due_date).toLocaleDateString() : 'No deadline'
  ]);

  generatePDF("Savings Statement", columns, rows, user);
};

export const exportBudgetsToPDF = (budgets, expenses, user) => {
  const columns = ["Category", "Limit", "Actual Spent", "Usage (%)", "Period"];
  
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

  const rows = budgets.map(budget => {
    const actual = calculateActual(budget.category);
    const limit = parseFloat(budget.amount_limit);
    const percent = limit > 0 ? (actual / limit) * 100 : 0;
    
    return [
      budget.category,
      limit,
      actual,
      percent.toFixed(1),
      budget.period
    ];
  });

  generatePDF("Budget Statement", columns, rows, user);
};



