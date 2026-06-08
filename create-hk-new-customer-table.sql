-- Hong Kong New Customer Registration tables (optional Supabase migration)
-- Apply in Supabase SQL Editor when migrating from Vercel Blob storage.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS hk_new_customer_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID,
  created_by_name TEXT,
  status TEXT NOT NULL DEFAULT 'submitted',
  company_name_en TEXT NOT NULL,
  company_name_zh TEXT,
  br_number TEXT NOT NULL,
  incorporation_date DATE,
  registered_address TEXT,
  delivery_address TEXT,
  contacts JSONB NOT NULL DEFAULT '[]'::jsonb,
  ap_contact_name TEXT,
  ap_email TEXT,
  invoice_delivery TEXT[] DEFAULT ARRAY[]::TEXT[],
  bank_name TEXT,
  account_name TEXT,
  account_number TEXT,
  bank_code TEXT,
  estimated_monthly_purchase NUMERIC,
  payment_terms TEXT,
  payment_terms_other TEXT,
  documents_checklist JSONB NOT NULL DEFAULT '{}'::jsonb,
  authorized_signature TEXT,
  declaration_date DATE,
  signer_name_title TEXT,
  sales_department TEXT,
  sales_rep_name TEXT,
  verification_checked_date DATE,
  company_status TEXT,
  bank_proof_check TEXT,
  verification_remarks TEXT
);

CREATE TABLE IF NOT EXISTS hk_new_customer_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES hk_new_customer_registrations(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  content_type TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hk_new_customer_br_number ON hk_new_customer_registrations (br_number);
CREATE INDEX IF NOT EXISTS idx_hk_new_customer_company_en ON hk_new_customer_registrations (company_name_en);
CREATE INDEX IF NOT EXISTS idx_hk_new_customer_created_at ON hk_new_customer_registrations (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hk_new_customer_attachments_registration ON hk_new_customer_attachments (registration_id);

ALTER TABLE hk_new_customer_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE hk_new_customer_attachments ENABLE ROW LEVEL SECURITY;
