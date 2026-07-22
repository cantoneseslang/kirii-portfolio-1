-- AR collection cases + comment threads (sales-dashboard → portfolio)
-- Apply with Service Role in Supabase dashboard or via migration tooling.

CREATE TABLE IF NOT EXISTS ar_collection_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_token TEXT NOT NULL UNIQUE,
  customer_code TEXT NOT NULL,
  customer_en_name TEXT,
  customer_cn_name TEXT,
  month_key TEXT NOT NULL,
  month_label TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  expected_collection_date DATE NOT NULL,
  collection_method TEXT NOT NULL,
  cheque_date DATE,
  other_method_note TEXT,
  salesperson_name TEXT,
  recorded_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ar_collection_cases_customer
  ON ar_collection_cases (customer_code);

CREATE INDEX IF NOT EXISTS idx_ar_collection_cases_created_at
  ON ar_collection_cases (created_at DESC);

CREATE TABLE IF NOT EXISTS ar_collection_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES ar_collection_cases(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ar_collection_comments_case_id
  ON ar_collection_comments (case_id, created_at ASC);

ALTER TABLE ar_collection_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE ar_collection_comments ENABLE ROW LEVEL SECURITY;
