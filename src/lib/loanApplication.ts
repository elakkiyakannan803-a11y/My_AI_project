import { supabase } from '@/lib/supabase';
import type { LoanScheme, Lender, LoanApplication, ApplicationDocument, ApplicationStatusHistory, ApplicationStatus } from '@/types';

export async function fetchSchemes(): Promise<LoanScheme[]> {
  const { data, error } = await supabase
    .from('loan_schemes')
    .select('*')
    .order('name');

  if (error || !data) return [];

  return data.map((s) => ({
    id: s.id,
    name: s.name,
    category: s.category,
    purpose: s.purpose,
    eligibleUsers: s.eligible_users,
    loanRangeMin: s.loan_range_min,
    loanRangeMax: s.loan_range_max,
    interestRate: s.interest_rate,
    requiredDocuments: s.required_documents || [],
    eligibilityCriteria: s.eligibility_criteria || [],
    subOptions: s.sub_options || [],
  }));
}

export async function fetchLenders(): Promise<Lender[]> {
  const { data, error } = await supabase
    .from('lenders')
    .select('*')
    .order('name');

  if (error || !data) return [];

  return data.map((l) => ({
    id: l.id,
    name: l.name,
    branchName: l.branch_name,
    category: l.category,
    address: l.address,
    city: l.city,
    loanTypes: l.loan_types || [],
    interestRateMin: Number(l.interest_rate_min),
    interestRateMax: Number(l.interest_rate_max),
    eligibilitySummary: l.eligibility_summary,
    openingHours: l.opening_hours,
    phone: l.phone,
    apiEndpoint: l.api_endpoint,
    website: l.website,
  }));
}

export async function fetchLendersByLoanType(loanType: string): Promise<Lender[]> {
  const lenders = await fetchLenders();
  const categoryMap: Record<string, string> = {
    'Education': 'Education',
    'Business': 'Business',
    'Personal': 'Personal',
    'Housing': 'Home',
    'Home': 'Home',
    'Vehicle': 'Vehicle',
    'Agriculture': 'Agriculture',
    'Health': 'Health',
  };
  const mapped = categoryMap[loanType] || loanType;
  return lenders.filter((l) => l.loanTypes.includes(mapped));
}

export interface CreateApplicationInput {
  schemeId: string;
  lenderId: string | null;
  loanType: string;
  subType?: string;
  requestedAmount: number;
  tenureMonths: number;
  purpose: string;
  employmentType: string;
  monthlyIncome: number;
  existingEmi: number;
  creditScore: number;
  eligibilityAmount: number;
  eligibilityStatus: string;
  interestRate?: number;
}

export async function createApplication(input: CreateApplicationInput): Promise<string | null> {
  const { data, error } = await supabase
    .from('loan_applications')
    .insert({
      scheme_id: input.schemeId,
      lender_id: input.lenderId,
      loan_type: input.loanType,
      sub_type: input.subType || null,
      requested_amount: input.requestedAmount,
      tenure_months: input.tenureMonths,
      purpose: input.purpose,
      employment_type: input.employmentType,
      monthly_income: input.monthlyIncome,
      existing_emi: input.existingEmi,
      credit_score: input.creditScore,
      eligibility_amount: input.eligibilityAmount,
      eligibility_status: input.eligibilityStatus,
      interest_rate: input.interestRate || null,
      status: 'Draft',
    })
    .select('id')
    .single();

  if (error || !data) return null;

  await supabase
    .from('application_status_history')
    .insert({
      application_id: data.id,
      status: 'Draft',
      note: 'Application created.',
    });

  return data.id;
}

export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus,
  note?: string
): Promise<boolean> {
  const { error } = await supabase
    .from('loan_applications')
    .update({ status })
    .eq('id', applicationId);

  if (error) return false;

  await supabase
    .from('application_status_history')
    .insert({
      application_id: applicationId,
      status,
      note: note || `Status changed to ${status}.`,
    });

  return true;
}

export async function fetchUserApplications(): Promise<LoanApplication[]> {
  const { data, error } = await supabase
    .from('loan_applications')
    .select(`
      id,
      loan_type,
      sub_type,
      requested_amount,
      tenure_months,
      purpose,
      status,
      interest_rate,
      lender_reference,
      created_at,
      lenders!inner(name)
    `)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map((app) => ({
    id: app.id,
    loanType: app.loan_type,
    subType: app.sub_type || undefined,
    lender: app.lenders?.name || 'Not selected',
    requestedAmount: app.requested_amount,
    applicationDate: app.created_at,
    status: app.status as ApplicationStatus,
    tenure: app.tenure_months,
    interestRate: app.interest_rate ? Number(app.interest_rate) : 0,
    purpose: app.purpose || undefined,
    lenderReference: app.lender_reference || undefined,
  }));
}

export async function fetchApplicationById(id: string) {
  const { data, error } = await supabase
    .from('loan_applications')
    .select(`
      *,
      loan_schemes!inner(name, category, required_documents, sub_options),
      lenders(name, website, phone)
    `)
    .eq('id', id)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    schemeId: data.scheme_id,
    schemeName: data.loan_schemes?.name || '',
    schemeCategory: data.loan_schemes?.category || '',
    requiredDocuments: data.loan_schemes?.required_documents || [],
    subOptions: data.loan_schemes?.sub_options || [],
    lenderId: data.lender_id,
    lenderName: data.lenders?.name || '',
    lenderWebsite: data.lenders?.website || '',
    lenderPhone: data.lenders?.phone || '',
    loanType: data.loan_type,
    subType: data.sub_type || '',
    requestedAmount: data.requested_amount,
    tenureMonths: data.tenure_months,
    purpose: data.purpose,
    employmentType: data.employment_type,
    monthlyIncome: data.monthly_income,
    existingEmi: data.existing_emi,
    creditScore: data.credit_score,
    eligibilityAmount: data.eligibility_amount,
    eligibilityStatus: data.eligibility_status,
    interestRate: data.interest_rate ? Number(data.interest_rate) : null,
    lenderReference: data.lender_reference || '',
    status: data.status as ApplicationStatus,
    consentGiven: data.consent_given,
    createdAt: data.created_at,
  };
}

export async function fetchApplicationDocuments(applicationId: string): Promise<ApplicationDocument[]> {
  const { data, error } = await supabase
    .from('application_documents')
    .select('*')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: true });

  if (error || !data) return [];

  return data.map((d) => ({
    id: d.id,
    applicationId: d.application_id,
    documentType: d.document_type,
    fileName: d.file_name,
    fileSize: d.file_size,
    mimeType: d.mime_type,
    status: d.status as ApplicationDocument['status'],
    reviewNotes: d.review_notes || undefined,
    createdAt: d.created_at,
  }));
}

export async function fetchApplicationStatusHistory(applicationId: string): Promise<ApplicationStatusHistory[]> {
  const { data, error } = await supabase
    .from('application_status_history')
    .select('*')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: true });

  if (error || !data) return [];

  return data.map((h) => ({
    id: h.id,
    status: h.status as ApplicationStatus,
    note: h.note || undefined,
    createdAt: h.created_at,
  }));
}

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const FILE_SIGNATURES: Record<string, number[]> = {
  'application/pdf': [0x25, 0x50, 0x44, 0x46],
  'image/jpeg': [0xff, 0xd8, 0xff],
  'image/png': [0x89, 0x50, 0x4e, 0x47],
};

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size must not exceed 10 MB.' };
  }

  if (file.size === 0) {
    return { valid: false, error: 'File is empty.' };
  }

  const lowerName = file.name.toLowerCase();
  const hasValidExtension = ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
  if (!hasValidExtension) {
    return { valid: false, error: 'Only PDF, JPG, JPEG, and PNG files are allowed.' };
  }

  const mimeType = file.type.toLowerCase();
  if (mimeType && !ALLOWED_MIME_TYPES.includes(mimeType)) {
    return { valid: false, error: 'File type is not supported. Only PDF, JPG, JPEG, and PNG are allowed.' };
  }

  return { valid: true };
}

export async function verifyFileSignature(file: File): Promise<{ valid: boolean; detectedType?: string; error?: string }> {
  const header = await file.slice(0, 8).arrayBuffer();
  const bytes = new Uint8Array(header);

  for (const [mimeType, signature] of Object.entries(FILE_SIGNATURES)) {
    const matches = signature.every((byte, i) => bytes[i] === byte);
    if (matches) {
      return { valid: true, detectedType: mimeType };
    }
  }

  return { valid: false, error: 'File content does not match a valid PDF, JPEG, or PNG file.' };
}

export async function uploadDocument(
  applicationId: string,
  documentType: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ success: boolean; error?: string }> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { success: false, error: 'Not authenticated.' };

  const fileName = `${userData.user.id}/${applicationId}/${documentType.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}_${file.name}`;

  const extensionCheck = validateFile(file);
  if (!extensionCheck.valid) return { success: false, error: extensionCheck.error };

  const signatureCheck = await verifyFileSignature(file);
  if (!signatureCheck.valid) return { success: false, error: signatureCheck.error };

  const detectedMime = signatureCheck.detectedType || file.type;

  return new Promise((resolve) => {
    supabase.storage
      .from('loan-documents')
      .upload(fileName, file, {
        contentType: detectedMime,
        upsert: false,
      })
      .then(async ({ error: uploadError }) => {
        if (uploadError) {
          resolve({ success: false, error: 'Upload failed. Please try again.' });
          return;
        }

        onProgress?.(90);

        const { error: dbError } = await supabase
          .from('application_documents')
          .insert({
            application_id: applicationId,
            document_type: documentType,
            file_name: file.name,
            file_path: fileName,
            file_size: file.size,
            mime_type: detectedMime,
            status: 'Uploaded',
          });

        if (dbError) {
          await supabase.storage.from('loan-documents').remove([fileName]);
          resolve({ success: false, error: 'Failed to save document record.' });
          return;
        }

        onProgress?.(100);
        resolve({ success: true });
      });
  });
}

export async function deleteDocument(documentId: string, filePath: string): Promise<boolean> {
  const { error: storageError } = await supabase.storage
    .from('loan-documents')
    .remove([filePath]);

  if (storageError) return false;

  const { error: dbError } = await supabase
    .from('application_documents')
    .delete()
    .eq('id', documentId);

  return !dbError;
}

export async function replaceDocument(
  documentId: string,
  oldFilePath: string,
  applicationId: string,
  documentType: string,
  newFile: File,
  onProgress?: (progress: number) => void
): Promise<{ success: boolean; error?: string }> {
  const deleted = await deleteDocument(documentId, oldFilePath);
  if (!deleted) return { success: false, error: 'Failed to remove old document.' };

  return uploadDocument(applicationId, documentType, newFile, onProgress);
}

export async function getDocumentSignedUrl(filePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('loan-documents')
    .createSignedUrl(filePath, 300);

  if (error || !data) return null;
  return data.signedUrl;
}

export async function submitApplication(
  applicationId: string,
  consentText: string
): Promise<{ success: boolean; error?: string; lenderApiConnected?: boolean; lenderReference?: string; message?: string }> {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.access_token) {
      return { success: false, error: 'Not authenticated.' };
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const response = await fetch(`${supabaseUrl}/functions/v1/submit-application`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.session.access_token}`,
      },
      body: JSON.stringify({
        applicationId,
        consentGiven: true,
        consentText,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Submission failed.' };
    }

    return {
      success: true,
      lenderApiConnected: data.lenderApiConnected,
      lenderReference: data.lenderReference,
      message: data.message,
    };
  } catch {
    return { success: false, error: 'Network error. Please try again.' };
  }
}
