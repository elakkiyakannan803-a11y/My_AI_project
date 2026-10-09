import type { ChatMessage } from '@/types';

export const quickPrompts = [
  'Which loan is suitable for me?',
  'How much can I potentially borrow?',
  'Calculate my EMI',
  'What documents do I need?',
  'Find banks near me',
];

const knowledgeBase: Record<string, string> = {
  suitable: `To recommend the right loan, I consider your purpose:

• **Education Loan** — for higher studies in India or abroad. Rates: 8.5%–12% p.a.
• **Home Loan** — for buying or building a house. Rates: 8.4%–11.5% p.a.
• **Vehicle Loan** — for cars or two-wheelers. Rates: 9%–14% p.a.
• **Personal Loan** — for medical, wedding, or other needs. Rates: 10.5%–18% p.a.
• **Business Loan** — for working capital or expansion. Rates: 10%–16% p.a.

Visit the **Loan Eligibility** page and fill in your details — I can give you a more tailored estimate based on your income and credit score.`,

  borrow: `Your borrowing capacity depends on:

1. **Monthly Income** — lenders typically allow EMIs up to 40–50% of your net income
2. **Existing EMIs** — any current loan obligations reduce your capacity
3. **Credit Score** — 750+ gets better rates and higher limits
4. **Employment** — salaried applicants often get higher eligibility
5. **Age** — younger applicants can get longer tenures

Use the **Loan Eligibility** calculator for a personalized estimate. Remember, this is an estimate — actual eligibility is determined by the lender.`,

  emi: `EMI (Equated Monthly Installment) is calculated using:

**EMI = P × r × (1+r)^n / ((1+r)^n − 1)**

Where:
• P = Principal loan amount
• r = Monthly interest rate (annual rate ÷ 12 ÷ 100)
• n = Loan tenure in months

Example: A ₹5,00,000 loan at 10% p.a. for 5 years (60 months) gives an EMI of approximately ₹10,624.

Use the **Loan Calculator** page to compute your exact EMI with a visual breakdown.`,

  documents: `Common documents required for most loan applications:

**Identity Proof** (any one): Aadhaar, PAN, Passport, Voter ID, Driving License

**Address Proof**: Utility bill, Rental agreement, Aadhaar, Passport

**Income Proof**:
• Salaried: Last 3 months salary slips, Form 16, ITR
• Self-employed: ITR (2-3 years), P&L statement, GST returns

**Bank Statements**: Last 6 months

**Other**: Property documents (home loan), admission letter (education loan), business registration (business loan)

Visit the **Documents** page to track your document uploads.`,

  bank: `You can find nearby banks and financial institutions on the **Find Banks** page.

Available categories:
• Public & Private Banks (SBI, HDFC, ICICI, Axis, etc.)
• NBFCs (Bajaj Finserv, Muthoot Finance, etc.)
• Financial Institutions (Cholamandalam, L&T Finance, etc.)

You can search by city or use your browser's location feature. Each bank card shows loan types, interest rates, eligibility requirements, and contact details.

Note: The bank data shown is demo data for illustration. Always verify with the actual bank for current rates and requirements.`,

  credit: `Your credit score (CIBIL score) is a 3-digit number (300–900) that indicates your creditworthiness.

• **800+**: Excellent — best rates and highest eligibility
• **750–799**: Very good — favorable terms
• **700–749**: Good — standard rates
• **650–699**: Fair — may get loans at higher rates
• **Below 650**: Poor — may face rejection or very high rates

To improve your score: pay EMIs on time, keep credit utilization low, avoid multiple loan applications, and maintain a healthy credit mix.`,

  interest: `Interest rates vary by loan type and your credit profile:

• **Home Loan**: 8.4% – 11.5% p.a.
• **Education Loan**: 8.5% – 12% p.a.
• **Vehicle Loan**: 9% – 14% p.a.
• **Personal Loan**: 10.5% – 18% p.a.
• **Business Loan**: 10% – 16% p.a.
• **Agriculture Loan**: 7% – 10% p.a. (subsidized)

A higher credit score (750+) typically gets you rates at the lower end. Final rates are set by the lender based on their assessment.`,

  tenure: `Loan tenure affects your EMI and total interest:

• **Longer tenure** = lower EMI but higher total interest paid
• **Shorter tenure** = higher EMI but lower total interest

Typical tenures:
• Personal Loan: 1–5 years
• Vehicle Loan: 3–7 years
• Home Loan: up to 20–30 years
• Education Loan: up to 10–15 years

Choose a tenure that keeps your EMI within 40% of your monthly income.`,
};

export function generateAIResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase();

  if (lower.includes('suitable') || lower.includes('which loan') || lower.includes('recommend')) {
    return knowledgeBase.suitable;
  }
  if (lower.includes('borrow') || lower.includes('eligible') || lower.includes('eligibility') || lower.includes('how much')) {
    return knowledgeBase.borrow;
  }
  if (lower.includes('emi') || lower.includes('calculate') || lower.includes('installment')) {
    return knowledgeBase.emi;
  }
  if (lower.includes('document') || lower.includes('paper') || lower.includes('required')) {
    return knowledgeBase.documents;
  }
  if (lower.includes('bank') || lower.includes('near') || lower.includes('branch')) {
    return knowledgeBase.bank;
  }
  if (lower.includes('credit') || lower.includes('cibil') || lower.includes('score')) {
    return knowledgeBase.credit;
  }
  if (lower.includes('interest') || lower.includes('rate')) {
    return knowledgeBase.interest;
  }
  if (lower.includes('tenure') || lower.includes('years') || lower.includes('months')) {
    return knowledgeBase.tenure;
  }
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return `Hello! I'm your LoanSure AI Assistant. I can help you with:

• Choosing the right loan type
• Estimating your borrowing capacity
• Calculating EMI
• Understanding required documents
• Finding nearby banks

Just ask me a question or use one of the quick buttons below!`;
  }

  return `I can help you with loan-related questions. Try asking about:

• Which loan is suitable for you
• How much you can potentially borrow
• How to calculate your EMI
• What documents you need
• Finding banks near you
• Understanding credit scores and interest rates

Note: I provide informational guidance only. I'm not a bank or lender, and I cannot guarantee loan approval. Final decisions are made by individual lenders.`;
}

export function getWelcomeMessage(): string {
  return "Hi! I'm your LoanSure AI Assistant. I can help you understand loan options, eligibility factors, EMI calculations and required documents.";
}

export function createMessage(sender: 'user' | 'ai', text: string): ChatMessage {
  return {
    id: crypto.randomUUID(),
    sender,
    text,
    time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
  };
}
