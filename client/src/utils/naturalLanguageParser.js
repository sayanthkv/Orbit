/**
 * Deterministic Natural Language Parser for Quick Transaction Logging
 * Parses expressions like:
 * - "chai 40 yesterday"
 * - "zomato 450 food"
 * - "salary 50000 credited"
 * - "uber 350 to hdfc"
 * - "grocery 1200 cash"
 */

const CATEGORY_KEYWORDS = {
  food: ['food', 'lunch', 'dinner', 'breakfast', 'snack', 'chai', 'coffee', 'tea', 'zomato', 'swiggy', 'mcdonalds', 'kfc', 'burger', 'pizza', 'restaurant'],
  transport: ['transport', 'uber', 'ola', 'rapido', 'metro', 'bus', 'train', 'flight', 'petrol', 'diesel', 'fuel', 'cab', 'auto'],
  groceries: ['groceries', 'grocery', 'supermarket', 'blinkit', 'zepto', 'instamart', 'milk', 'vegetables', 'fruits', 'market'],
  shopping: ['shopping', 'amazon', 'flipkart', 'myntra', 'clothes', 'shoes', 'mall', 'electronics'],
  entertainment: ['entertainment', 'movie', 'cinema', 'netflix', 'spotify', 'games', 'concert', 'outing'],
  utilities: ['bills', 'electricity', 'water', 'gas', 'wifi', 'internet', 'broadband', 'recharge', 'mobile'],
  health: ['health', 'doctor', 'medicine', 'pharmacy', 'hospital', 'clinic', 'gym', 'workout'],
  salary: ['salary', 'stipend', 'dividend', 'bonus', 'freelance', 'paycheck'],
};

export const parseQuickAdd = (input = '', categories = [], accounts = []) => {
  if (!input || typeof input !== 'string') return null;

  const raw = input.trim();
  if (raw.length === 0) return null;

  const tokens = raw.split(/\s+/);
  let detectedAmount = null;
  let detectedDate = new Date().toISOString().split('T')[0];
  let detectedType = 'expense';
  let detectedCategory = null;
  let detectedAccount = null;
  let detectedToAccount = null;

  // 1. Amount Extraction (supports e.g. 450, 450.50, ₹450, $450, rs.450)
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i].replace(/[₹$rs,]/gi, '');
    if (/^\d+(\.\d{1,2})?$/.test(t)) {
      const val = parseFloat(t);
      if (val > 0) {
        detectedAmount = val;
        tokens.splice(i, 1);
        break;
      }
    }
  }

  const textRemainder = tokens.join(' ').toLowerCase();

  // 2. Type Detection
  if (/\b(salary|income|credited|received|deposit|bonus|dividend|refund)\b/i.test(textRemainder)) {
    detectedType = 'income';
  } else if (/\b(transfer|sent to|moved to)\b/i.test(textRemainder)) {
    detectedType = 'transfer';
  }

  // 3. Date Detection
  const today = new Date();
  if (/\byesterday\b/i.test(textRemainder)) {
    const yest = new Date(today);
    yest.setDate(yest.getDate() - 1);
    detectedDate = yest.toISOString().split('T')[0];
  } else if (/\btomorrow\b/i.test(textRemainder)) {
    const tom = new Date(today);
    tom.setDate(tom.getDate() + 1);
    detectedDate = tom.toISOString().split('T')[0];
  }

  // 4. Account Matching
  for (const acc of accounts) {
    const nameMatch = acc.name && textRemainder.includes(acc.name.toLowerCase());
    const bankMatch = acc.bankName && textRemainder.includes(acc.bankName.toLowerCase());
    if (nameMatch || bankMatch) {
      detectedAccount = acc._id;
      break;
    }
  }
  if (!detectedAccount && accounts.length > 0) {
    detectedAccount = accounts.find((a) => a.isDefault)?._id || accounts[0]._id;
  }

  // 5. Category Matching
  for (const cat of categories) {
    if (cat.type === detectedType && textRemainder.includes(cat.name.toLowerCase())) {
      detectedCategory = cat._id;
      break;
    }
  }

  // If no direct name match, check category keywords
  if (!detectedCategory && detectedType === 'expense') {
    for (const [key, wordList] of Object.entries(CATEGORY_KEYWORDS)) {
      if (wordList.some((w) => textRemainder.includes(w))) {
        const matched = categories.find((c) =>
          c.name.toLowerCase().includes(key) || key.includes(c.name.toLowerCase())
        );
        if (matched) {
          detectedCategory = matched._id;
          break;
        }
      }
    }
  }

  if (!detectedCategory) {
    const fallback = categories.find((c) => c.type === detectedType) || categories[0];
    if (fallback) detectedCategory = fallback._id;
  }

  // Clean remaining note
  const cleanedNote = raw
    .replace(/[₹$]\s*\d+(\.\d{1,2})?/gi, '')
    .replace(/\b(yesterday|today|tomorrow)\b/gi, '')
    .trim();

  return {
    amount: detectedAmount || 0,
    type: detectedType,
    category: detectedCategory,
    account: detectedAccount,
    toAccount: detectedToAccount,
    date: detectedDate,
    note: cleanedNote || raw,
    rawText: raw,
  };
};

export default parseQuickAdd;
