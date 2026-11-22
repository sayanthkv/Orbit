const Transaction = require('../models/Transaction');
const Category = require('../models/Category');

/**
 * Generate deterministic, rule-based smart financial insights
 */
const generateSmartInsights = async (userId, month, year) => {
  const m = parseInt(month, 10);
  const y = parseInt(year, 10);

  const startDate = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
  const endDate = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));

  // Prior month
  let priorM = m - 1;
  let priorY = y;
  if (priorM === 0) {
    priorM = 12;
    priorY -= 1;
  }
  const priorStart = new Date(Date.UTC(priorY, priorM - 1, 1, 0, 0, 0));
  const priorEnd = new Date(Date.UTC(priorY, priorM, 0, 23, 59, 59, 999));

  try {
    const [currentTxs, priorTxs] = await Promise.all([
      Transaction.find({
        user: userId,
        date: { $gte: startDate, $lte: endDate },
      }).populate('category', 'name color icon'),
      Transaction.find({
        user: userId,
        date: { $gte: priorStart, $lte: priorEnd },
      }).populate('category', 'name color icon'),
    ]);

    const insights = [];

    let totalExpense = 0;
    let totalIncome = 0;
    let weekendExpense = 0;
    let weekdayExpense = 0;
    const catCurrentMap = {};
    const catPriorMap = {};

    currentTxs.forEach((tx) => {
      if (tx.type === 'expense') {
        totalExpense += tx.amount;
        const catName = tx.category?.name || 'Uncategorized';
        catCurrentMap[catName] = (catCurrentMap[catName] || 0) + tx.amount;

        const dayOfWeek = new Date(tx.date).getDay(); // 0 is Sunday, 6 is Saturday
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          weekendExpense += tx.amount;
        } else {
          weekdayExpense += tx.amount;
        }
      } else if (tx.type === 'income') {
        totalIncome += tx.amount;
      }
    });

    priorTxs.forEach((tx) => {
      if (tx.type === 'expense') {
        const catName = tx.category?.name || 'Uncategorized';
        catPriorMap[catName] = (catPriorMap[catName] || 0) + tx.amount;
      }
    });

    if (totalExpense === 0 && totalIncome === 0) {
      return [
        {
          id: 'welcome_insight',
          type: 'info',
          title: 'Start Logging Expenses',
          description: 'Log your daily spending and income to unlock automated smart insights.',
          icon: 'Sparkles',
        },
      ];
    }

    // 1. Category Spike Insight (> 20% increase)
    for (const [catName, curAmt] of Object.entries(catCurrentMap)) {
      const priorAmt = catPriorMap[catName] || 0;
      if (priorAmt > 0 && curAmt > priorAmt && curAmt >= 500) {
        const pctJump = Math.round(((curAmt - priorAmt) / priorAmt) * 100);
        if (pctJump >= 25) {
          insights.push({
            id: `spike_${catName}`,
            type: 'warning',
            title: `${catName} spending up ${pctJump}%`,
            description: `You've spent ₹${curAmt.toLocaleString()} vs ₹${priorAmt.toLocaleString()} last month.`,
            icon: 'TrendingUp',
          });
          break; // Show most significant spike
        }
      }
    }

    // 2. Weekend vs Weekday spending insight
    if (totalExpense > 0) {
      const weekendPct = Math.round((weekendExpense / totalExpense) * 100);
      if (weekendPct >= 40) {
        insights.push({
          id: 'weekend_velocity',
          type: 'info',
          title: 'High Weekend Spending',
          description: `Weekend spending accounts for ${weekendPct}% of your total outflow this month.`,
          icon: 'Calendar',
        });
      }
    }

    // 3. Top Category Insight
    const sortedCats = Object.entries(catCurrentMap).sort((a, b) => b[1] - a[1]);
    if (sortedCats.length > 0 && totalExpense > 0) {
      const [topCatName, topCatAmt] = sortedCats[0];
      const topCatPct = Math.round((topCatAmt / totalExpense) * 100);
      insights.push({
        id: 'top_category',
        type: 'tip',
        title: `${topCatName} is your #1 outflow`,
        description: `It makes up ${topCatPct}% (₹${topCatAmt.toLocaleString()}) of your total monthly spend.`,
        icon: 'PieChart',
      });
    }

    // 4. Savings rate or Deficit Insight
    if (totalIncome > 0) {
      const savingsRate = Math.round(((totalIncome - totalExpense) / totalIncome) * 100);
      if (savingsRate >= 30) {
        insights.push({
          id: 'high_savings_rate',
          type: 'success',
          title: `Great Savings Rate (${savingsRate}%)`,
          description: `You are saving ${savingsRate}% of your income this month. Keep it up!`,
          icon: 'ShieldCheck',
        });
      } else if (totalExpense > totalIncome) {
        insights.push({
          id: 'deficit_alert',
          type: 'danger',
          title: 'Monthly Spending Deficit',
          description: `Expenses exceed your income by ₹${(totalExpense - totalIncome).toLocaleString()}.`,
          icon: 'AlertTriangle',
        });
      }
    }

    return insights;
  } catch (error) {
    console.error('Error generating smart insights:', error.message);
    return [];
  }
};

module.exports = {
  generateSmartInsights,
};
