/*
# Create loan application tables (retry with new filename)

Creates loan_schemes, lenders, loan_applications, application_documents, application_status_history.
All user tables are owner-scoped with RLS. Reference tables are publicly readable.
*/

-- Loan schemes (reference data)
CREATE TABLE IF NOT EXISTS loan_schemes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  purpose text NOT NULL DEFAULT '',
  eligible_users text NOT NULL DEFAULT '',
  loan_range_min integer NOT NULL DEFAULT 0,
  loan_range_max integer NOT NULL DEFAULT 0,
  interest_rate text NOT NULL DEFAULT '',
  required_documents text[] NOT NULL DEFAULT '{}',
  eligibility_criteria text[] NOT NULL DEFAULT '{}',
  sub_options text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE loan_schemes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read loan schemes" ON loan_schemes;
CREATE POLICY "Public can read loan schemes"
ON loan_schemes FOR SELECT
TO anon, authenticated
USING (true);

-- Lenders (reference data)
CREATE TABLE IF NOT EXISTS lenders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  branch_name text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Banks',
  address text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  loan_types text[] NOT NULL DEFAULT '{}',
  interest_rate_min numeric NOT NULL DEFAULT 0,
  interest_rate_max numeric NOT NULL DEFAULT 0,
  eligibility_summary text NOT NULL DEFAULT '',
  opening_hours text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  api_endpoint text,
  website text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE lenders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read lenders" ON lenders;
CREATE POLICY "Public can read lenders"
ON lenders FOR SELECT
TO anon, authenticated
USING (true);

-- Loan applications (user-scoped)
CREATE TABLE IF NOT EXISTS loan_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  scheme_id uuid REFERENCES loan_schemes(id) ON DELETE SET NULL,
  lender_id uuid REFERENCES lenders(id) ON DELETE SET NULL,
  loan_type text NOT NULL DEFAULT '',
  sub_type text,
  requested_amount integer NOT NULL DEFAULT 0,
  tenure_months integer NOT NULL DEFAULT 0,
  purpose text NOT NULL DEFAULT '',
  employment_type text NOT NULL DEFAULT '',
  monthly_income integer NOT NULL DEFAULT 0,
  existing_emi integer NOT NULL DEFAULT 0,
  credit_score integer NOT NULL DEFAULT 0,
  eligibility_amount integer NOT NULL DEFAULT 0,
  eligibility_status text NOT NULL DEFAULT '',
  interest_rate numeric,
  lender_reference text,
  status text NOT NULL DEFAULT 'Draft',
  consent_given boolean NOT NULL DEFAULT false,
  consent_text text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE loan_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own applications" ON loan_applications;
CREATE POLICY "Users can read own applications"
ON loan_applications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own applications" ON loan_applications;
CREATE POLICY "Users can insert own applications"
ON loan_applications FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own applications" ON loan_applications;
CREATE POLICY "Users can update own applications"
ON loan_applications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own applications" ON loan_applications;
CREATE POLICY "Users can delete own applications"
ON loan_applications FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Application documents (user-scoped)
CREATE TABLE IF NOT EXISTS application_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id uuid REFERENCES loan_applications(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size integer NOT NULL,
  mime_type text NOT NULL,
  status text NOT NULL DEFAULT 'Uploaded',
  review_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE application_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own documents" ON application_documents;
CREATE POLICY "Users can read own documents"
ON application_documents FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own documents" ON application_documents;
CREATE POLICY "Users can insert own documents"
ON application_documents FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own documents" ON application_documents;
CREATE POLICY "Users can update own documents"
ON application_documents FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own documents" ON application_documents;
CREATE POLICY "Users can delete own documents"
ON application_documents FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Application status history (audit trail)
CREATE TABLE IF NOT EXISTS application_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES loan_applications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE application_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own status history" ON application_status_history;
CREATE POLICY "Users can read own status history"
ON application_status_history FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own status history" ON application_status_history;
CREATE POLICY "Users can insert own status history"
ON application_status_history FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_loan_applications_user_id ON loan_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_loan_applications_status ON loan_applications(status);
CREATE INDEX IF NOT EXISTS idx_application_documents_user_id ON application_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_application_documents_application_id ON application_documents(application_id);
CREATE INDEX IF NOT EXISTS idx_application_status_history_application_id ON application_status_history(application_id);

-- Updated_at trigger for loan_applications
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS loan_applications_updated_at ON loan_applications;
CREATE TRIGGER loan_applications_updated_at
  BEFORE UPDATE ON loan_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Seed loan scheme data
INSERT INTO loan_schemes (name, category, purpose, eligible_users, loan_range_min, loan_range_max, interest_rate, required_documents, eligibility_criteria, sub_options) VALUES
('Vidya Jyoti Education Loan', 'Education', 'Financial support for higher education in India and abroad', 'Students aged 18-35 with confirmed admission', 100000, 5000000, '8.5% - 12%', ARRAY['Identity Proof', 'Address Proof', 'Income/Financial Proof', 'Admission/College Document', 'Fee Structure'], ARRAY['Confirmed admission at recognized institution', 'Co-applicant with stable income', 'Age 18-35', 'Indian citizen'], '{}'),
('Udyog Business Loan', 'Business', 'Working capital and business expansion financing', 'Business owners with 2+ years of operations', 500000, 20000000, '11% - 18%', ARRAY['Identity Proof', 'Address Proof', 'Income/Business Proof', 'Bank Statement', 'Business Registration Document'], ARRAY['Business vintage of 2+ years', 'Minimum annual turnover of 10 lakhs', 'Profitable operations', 'GST registration'], '{}'),
('Suvidha Personal Loan', 'Personal', 'Multi-purpose personal loan for any legitimate need', 'Salaried and self-employed individuals', 50000, 1500000, '12% - 24%', ARRAY['Identity Proof', 'Address Proof', 'Income Proof', 'Bank Statement'], ARRAY['Age 21-60', 'Monthly income of 15000+', 'Minimum credit score 650', 'Employment stability of 1+ year'], '{}'),
('Awas Home Loan', 'Home', 'Purchase, construction, or renovation of residential property', 'Individuals with stable income aged 21-65', 1000000, 50000000, '7.5% - 10.5%', ARRAY['Identity Proof', 'Address Proof', 'Income Proof', 'Property Document', 'Bank Statement'], ARRAY['Age 21-65', 'Monthly income of 30000+', 'Credit score 700+', 'Property with clear title'], '{}'),
('Vahan Vehicle Loan', 'Vehicle', 'Finance for new and used vehicle purchases', 'Individuals with regular income aged 21-65', 100000, 10000000, '9% - 15%', ARRAY['Identity Proof', 'Address Proof', 'Income Proof', 'Bank Statement', 'Vehicle Quotation'], ARRAY['Age 21-65', 'Monthly income of 15000+', 'Credit score 650+', 'Vehicle within 5 years old for used'], '{}'),
('Krishi Agriculture Loan', 'Agriculture', 'Credit for agricultural operations, equipment, and development', 'Farmers and agricultural enterprises', 50000, 10000000, '7% - 12%', ARRAY['Identity Proof', 'Address Proof', 'Land Document', 'Income Proof', 'Bank Statement'], ARRAY['Active land ownership or lease', 'Agricultural activity proof', 'Age 18-70', 'Resident in rural area'], '{}'),
('Arogya Health Loan', 'Health', 'Financial assistance for medical treatment and healthcare expenses', 'Individuals facing medical expenses', 50000, 5000000, '11% - 20%', ARRAY['Identity Proof', 'Address Proof', 'Hospital Estimate/Bill', 'Income Proof', 'Bank Statement'], ARRAY['Medical treatment requirement', 'Age 18-75', 'Hospital estimate from recognized facility', 'Co-applicant for amounts above 10 lakhs'], ARRAY['Medical treatment', 'Surgery', 'Hospital expenses', 'Emergency medical expenses', 'Other healthcare expenses'])
ON CONFLICT DO NOTHING;

-- Seed lender data (real banks/NBFCs with official websites)
INSERT INTO lenders (name, branch_name, category, address, city, loan_types, interest_rate_min, interest_rate_max, eligibility_summary, opening_hours, phone, website) VALUES
('State Bank of India', 'Main Branch', 'Banks', 'No. 1, Marina Beach Road', 'Chennai', ARRAY['Personal', 'Home', 'Vehicle', 'Education', 'Business', 'Agriculture'], 8.0, 14.0, 'Largest public sector bank with wide loan portfolio', 'Mon-Fri 10:00-16:00, Sat 10:00-14:00', '1800 1234', 'https://www.onlinesbi.sbi'),
('HDFC Bank', 'Anna Salai Branch', 'Banks', 'No. 145, Anna Salai', 'Chennai', ARRAY['Personal', 'Home', 'Vehicle', 'Business', 'Education'], 10.0, 18.0, 'Leading private bank with competitive rates', 'Mon-Sat 10:00-16:00', '1860 267 6161', 'https://www.hdfcbank.com'),
('ICICI Bank', 'T Nagar Branch', 'Banks', 'No. 78, Usman Road, T Nagar', 'Chennai', ARRAY['Personal', 'Home', 'Vehicle', 'Business', 'Education'], 10.5, 19.0, 'Diverse loan products with digital application', 'Mon-Sat 10:00-16:00', '1800 1080', 'https://www.icicibank.com'),
('Axis Bank', 'Adyar Branch', 'Banks', 'No. 2, Lattice Bridge Road, Adyar', 'Chennai', ARRAY['Personal', 'Home', 'Vehicle', 'Business'], 10.5, 18.0, 'Personalized loan solutions', 'Mon-Sat 10:00-16:00', '1860 419 5555', 'https://www.axisbank.com'),
('Canara Bank', 'Mylapore Branch', 'Banks', 'No. 23, Kutchery Road, Mylapore', 'Chennai', ARRAY['Personal', 'Home', 'Vehicle', 'Education', 'Agriculture'], 8.5, 14.0, 'Public sector bank with priority sector lending', 'Mon-Fri 10:00-16:00, Sat 10:00-14:00', '1800 1030', 'https://www.canarabank.com'),
('Indian Bank', 'Head Office', 'Banks', '254, Avvai Shanmugam Salai', 'Chennai', ARRAY['Personal', 'Home', 'Vehicle', 'Education', 'Agriculture', 'Business'], 8.0, 13.0, 'Headquartered in Chennai, strong regional presence', 'Mon-Fri 10:00-16:00, Sat 10:00-14:00', '1800 4250', 'https://www.indianbank.in'),
('Bajaj Finserv', 'Chennai Office', 'NBFCs', 'No. 56, Greams Road', 'Chennai', ARRAY['Personal', 'Business', 'Health', 'Vehicle'], 12.0, 24.0, 'Leading NBFC with quick digital approval', 'Mon-Sat 09:00-18:00', '1800 209 7272', 'https://www.bajajfinserv.in'),
('L&T Finance', 'Chennai Branch', 'NBFCs', 'No. 12, Cenotaph Road', 'Chennai', ARRAY['Personal', 'Vehicle', 'Business'], 11.0, 20.0, 'Diversified NBFC with flexible lending', 'Mon-Sat 09:30-17:30', '1800 266 5836', 'https://www.ltfs.com'),
('Muthoot Finance', 'T Nagar Branch', 'NBFCs', 'No. 45, Thyagaraya Nagar', 'Chennai', ARRAY['Personal', 'Business'], 14.0, 24.0, 'Gold loan and personal loan specialist', 'Mon-Sat 09:00-18:00', '1800 102 1616', 'https://www.muthootfinance.com'),
('Federal Bank', 'Anna Nagar Branch', 'Banks', 'No. 15, 2nd Avenue, Anna Nagar', 'Chennai', ARRAY['Personal', 'Home', 'Vehicle', 'Education', 'Business'], 10.0, 17.0, 'Private bank with strong retail lending', 'Mon-Sat 10:00-16:00', '1800 425 1199', 'https://www.federalbank.co.in'),
('Cholamandalam Investment', 'Chennai Office', 'NBFCs', 'No. 8, Khader Nawaz Khan Road', 'Chennai', ARRAY['Vehicle', 'Personal', 'Business', 'Health'], 11.0, 22.0, 'Murugappa Group NBFC with vehicle loan focus', 'Mon-Sat 09:00-17:30', '1800 200 4567', 'https://www.cholamandalam.com'),
('Tamilnad Mercantile Bank', 'Head Office', 'Banks', 'No. 57, Kodambakkam High Road', 'Chennai', ARRAY['Personal', 'Home', 'Vehicle', 'Education', 'Business'], 9.5, 15.0, 'Tamil Nadu based private bank', 'Mon-Fri 10:00-16:00, Sat 10:00-14:00', '1800 425 1444', 'https://www.tmb.in')
ON CONFLICT DO NOTHING;
