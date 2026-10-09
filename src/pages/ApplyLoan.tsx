import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  GraduationCap, Briefcase, Heart, Home, Car, Wheat, User as UserIcon,
  Check, ChevronRight, ChevronLeft, ArrowRight, Building2, Upload,
  FileText, AlertTriangle, Loader2, FileCheck, X, ShieldCheck,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Field, TextInput, SelectInput, TextArea } from '@/components/ui/Input';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { formatINR } from '@/lib/eligibility';
import { calculateEligibility } from '@/lib/eligibility';
import {
  fetchSchemes, fetchLendersByLoanType, createApplication,
  uploadDocument, deleteDocument, fetchApplicationDocuments,
  validateFile, verifyFileSignature, submitApplication,
  fetchApplicationById, getDocumentSignedUrl,
} from '@/lib/loanApplication';
import { employmentTypes, healthLoanSubOptions } from '@/data/demoData';
import type { LoanScheme, Lender, ApplicationDocument } from '@/types';

type Step = 'scheme' | 'details' | 'lender' | 'documents' | 'review';

const STEPS: { key: Step; label: string; icon: typeof UserIcon }[] = [
  { key: 'scheme', label: 'Choose Scheme', icon: FileText },
  { key: 'details', label: 'Your Details', icon: UserIcon },
  { key: 'lender', label: 'Select Lender', icon: Building2 },
  { key: 'documents', label: 'Documents', icon: Upload },
  { key: 'review', label: 'Review & Submit', icon: ShieldCheck },
];

const categoryIcons: Record<string, typeof UserIcon> = {
  Education: GraduationCap,
  Business: Briefcase,
  Health: Heart,
  Housing: Home,
  Home: Home,
  Vehicle: Car,
  Agriculture: Wheat,
  Personal: UserIcon,
};

interface DetailsForm {
  fullName: string;
  age: number;
  employmentType: string;
  monthlyIncome: number;
  existingEmi: number;
  creditScore: number;
  experience: number;
  requestedAmount: number;
  tenureMonths: number;
  purpose: string;
  subType: string;
}

export default function ApplyLoan() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<Step>('scheme');
  const [schemes, setSchemes] = useState<LoanScheme[]>([]);
  const [selectedScheme, setSelectedScheme] = useState<LoanScheme | null>(null);
  const [lenders, setLenders] = useState<Lender[]>([]);
  const [selectedLender, setSelectedLender] = useState<Lender | null>(null);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<ApplicationDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [consent, setConsent] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const [form, setForm] = useState<DetailsForm>({
    fullName: user?.name || '',
    age: 25,
    employmentType: user?.employmentType || 'Salaried',
    monthlyIncome: user?.monthlyIncome || 0,
    existingEmi: 0,
    creditScore: 750,
    experience: 3,
    requestedAmount: 500000,
    tenureMonths: 60,
    purpose: '',
    subType: '',
  });

  useEffect(() => {
    fetchSchemes().then(setSchemes);
  }, []);

  const preschemeId = searchParams.get('scheme');
  useEffect(() => {
    if (preschemeId && schemes.length > 0 && !selectedScheme) {
      const found = schemes.find((s) => s.id === preschemeId || s.category === preschemeId);
      if (found) {
        setSelectedScheme(found);
        setForm((f) => ({ ...f, requestedAmount: found.loanRangeMin, purpose: found.purpose }));
        setStep('details');
      }
    }
  }, [preschemeId, schemes, selectedScheme]);

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  const handleSelectScheme = (scheme: LoanScheme) => {
    setSelectedScheme(scheme);
    setForm((f) => ({
      ...f,
      requestedAmount: Math.min(f.requestedAmount, scheme.loanRangeMax),
      purpose: scheme.purpose,
      subType: '',
    }));
    setStep('details');
  };

  const validateDetails = (): boolean => {
    if (!form.fullName || form.fullName.trim().length < 2) {
      showToast('Please enter your full name.', 'error');
      return false;
    }
    if (form.age < 18 || form.age > 75) {
      showToast('Age must be between 18 and 75.', 'error');
      return false;
    }
    if (form.monthlyIncome <= 0) {
      showToast('Please enter your monthly income.', 'error');
      return false;
    }
    if (form.existingEmi < 0) {
      showToast('Existing EMI cannot be negative.', 'error');
      return false;
    }
    if (form.creditScore < 300 || form.creditScore > 900) {
      showToast('Credit score must be between 300 and 900.', 'error');
      return false;
    }
    if (form.requestedAmount <= 0) {
      showToast('Please enter a valid loan amount.', 'error');
      return false;
    }
    if (selectedScheme) {
      if (form.requestedAmount < selectedScheme.loanRangeMin) {
        showToast(`Minimum amount for this scheme is ${formatINR(selectedScheme.loanRangeMin)}.`, 'error');
        return false;
      }
      if (form.requestedAmount > selectedScheme.loanRangeMax) {
        showToast(`Maximum amount for this scheme is ${formatINR(selectedScheme.loanRangeMax)}.`, 'error');
        return false;
      }
    }
    if (!form.purpose || form.purpose.trim().length < 10) {
      showToast('Please describe the purpose of the loan (minimum 10 characters).', 'error');
      return false;
    }
    if (selectedScheme?.subOptions && selectedScheme.subOptions.length > 0 && !form.subType) {
      showToast('Please select a sub-category for this loan.', 'error');
      return false;
    }
    return true;
  };

  const handleDetailsNext = async () => {
    if (!validateDetails()) return;
    if (!selectedScheme) return;

    const result = calculateEligibility({
      age: form.age,
      employmentType: form.employmentType,
      monthlyIncome: form.monthlyIncome,
      existingEMI: form.existingEmi,
      creditScore: form.creditScore,
      experience: form.experience,
      loanCategory: selectedScheme.category,
      requestedAmount: form.requestedAmount,
      tenure: form.tenureMonths,
    });

    if (!applicationId) {
      setLoading(true);
      const id = await createApplication({
        schemeId: selectedScheme.id,
        lenderId: null,
        loanType: selectedScheme.category,
        subType: form.subType || undefined,
        requestedAmount: form.requestedAmount,
        tenureMonths: form.tenureMonths,
        purpose: form.purpose,
        employmentType: form.employmentType,
        monthlyIncome: form.monthlyIncome,
        existingEmi: form.existingEmi,
        creditScore: form.creditScore,
        eligibilityAmount: result.estimatedAmount,
        eligibilityStatus: result.status,
        interestRate: result.interestRateMin,
      });
      setLoading(false);

      if (!id) {
        showToast('Failed to create application. Please try again.', 'error');
        return;
      }
      setApplicationId(id);
    }

    const compatibleLenders = await fetchLendersByLoanType(selectedScheme.category);
    setLenders(compatibleLenders);
    setStep('lender');
  };

  const handleLenderNext = async () => {
    if (!selectedLender || !applicationId) {
      showToast('Please select a lender to continue.', 'error');
      return;
    }

    const { supabase } = await import('@/lib/supabase');
    await supabase
      .from('loan_applications')
      .update({ lender_id: selectedLender.id })
      .eq('id', applicationId);

    setStep('documents');
  };

  const refreshDocuments = useCallback(async () => {
    if (!applicationId) return;
    const docs = await fetchApplicationDocuments(applicationId);
    setDocuments(docs);
  }, [applicationId]);

  useEffect(() => {
    if (step === 'documents' && applicationId) {
      refreshDocuments();
    }
    if (step === 'review' && applicationId) {
      refreshDocuments();
    }
  }, [step, applicationId, refreshDocuments]);

  const handleUpload = async (documentType: string, file: File) => {
    if (!applicationId) return;

    const validation = validateFile(file);
    if (!validation.valid) {
      showToast(validation.error || 'Invalid file.', 'error');
      return;
    }

    const signature = await verifyFileSignature(file);
    if (!signature.valid) {
      showToast('File content does not match a valid PDF, JPG, or PNG file.', 'error');
      return;
    }

    setUploadProgress((p) => ({ ...p, [documentType]: 0 }));

    const result = await uploadDocument(applicationId, documentType, file, (progress) => {
      setUploadProgress((p) => ({ ...p, [documentType]: progress }));
    });

    setUploadProgress((p) => {
      const next = { ...p };
      delete next[documentType];
      return next;
    });

    if (result.success) {
      showToast(`${documentType} uploaded successfully.`, 'success');
      refreshDocuments();
    } else {
      showToast(result.error || 'Upload failed.', 'error');
    }
  };

  const handleDeleteDocument = async (doc: ApplicationDocument) => {
    const { supabase } = await import('@/lib/supabase');
    const { error } = await supabase.storage.from('loan-documents').remove([`${doc.id}`]);

    const { data: docRecord } = await supabase
      .from('application_documents')
      .select('file_path')
      .eq('id', doc.id)
      .maybeSingle();

    if (docRecord) {
      await deleteDocument(doc.id, docRecord.file_path);
    }

    refreshDocuments();
    showToast('Document removed.', 'info');
  };

  const handleSubmit = async () => {
    if (!consent) {
      showToast('Please confirm the consent statement to submit.', 'error');
      return;
    }
    if (!applicationId) return;

    setSubmitting(true);
    const consentText = 'I confirm that the information and documents provided by me are accurate and belong to me.';
    const result = await submitApplication(applicationId, consentText);
    setSubmitting(false);

    if (result.success) {
      showToast(result.message || 'Application submitted successfully.', 'success');
      navigate('/applications');
    } else {
      showToast(result.error || 'Submission failed.', 'error');
    }
  };

  const goBack = () => {
    if (stepIndex > 0) {
      setStep(STEPS[stepIndex - 1].key);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Apply for a Loan</h2>
        <p className="text-sm text-navy-300">Complete the steps below to submit your loan application</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === stepIndex;
          const isDone = i < stepIndex;
          return (
            <div key={s.key} className="flex items-center shrink-0">
              <div className={`flex items-center gap-2 rounded-lg px-3 py-2 transition-colors ${
                isActive ? 'bg-accent-500/15 text-accent-400' :
                isDone ? 'text-green-400' : 'text-navy-400'
              }`}>
                <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                  isActive ? 'bg-accent-500 text-white' :
                  isDone ? 'bg-green-500/20 text-green-400' : 'bg-navy-700 text-navy-400'
                }`}>
                  {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-3.5 w-3.5" />}
                </div>
                <span className="text-xs font-medium hidden sm:inline">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <ChevronRight className="h-4 w-4 text-navy-600 mx-0.5" />}
            </div>
          );
        })}
      </div>

      {/* Step: Scheme */}
      {step === 'scheme' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {schemes.map((scheme) => {
            const Icon = categoryIcons[scheme.category] || FileText;
            return (
              <button
                key={scheme.id}
                onClick={() => handleSelectScheme(scheme)}
                className="text-left rounded-xl bg-navy-700/60 border border-navy-500/30 p-5 hover:border-accent-400/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="p-2.5 rounded-lg bg-accent-500/15 text-accent-400 mb-3 w-fit">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">{scheme.name}</h3>
                <p className="text-xs text-navy-300 mb-3 line-clamp-2">{scheme.purpose}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-accent-400 font-medium">{scheme.interestRate}</span>
                  <span className="text-navy-400">{formatINR(scheme.loanRangeMin)} - {formatINR(scheme.loanRangeMax)}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Step: Details */}
      {step === 'details' && selectedScheme && (
        <Card>
          <CardHeader>
            <CardTitle>Applicant & Loan Details — {selectedScheme.name}</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            {selectedScheme.subOptions && selectedScheme.subOptions.length > 0 && (
              <Field label="Loan Sub-Category" required>
                <SelectInput
                  value={form.subType}
                  onChange={(e) => setForm({ ...form, subType: e.target.value })}
                >
                  <option value="">Select category</option>
                  {selectedScheme.subOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </SelectInput>
              </Field>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full Name" required>
                <TextInput type="text" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="John Doe" />
              </Field>
              <Field label="Age" required>
                <TextInput type="number" value={form.age} onChange={(e) => setForm({ ...form, age: parseInt(e.target.value) || 0 })} />
              </Field>
              <Field label="Employment Type" required>
                <SelectInput value={form.employmentType} onChange={(e) => setForm({ ...form, employmentType: e.target.value })}>
                  {employmentTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                </SelectInput>
              </Field>
              <Field label="Monthly Income (₹)" required>
                <TextInput type="number" value={form.monthlyIncome || ''} onChange={(e) => setForm({ ...form, monthlyIncome: parseInt(e.target.value) || 0 })} placeholder="50000" />
              </Field>
              <Field label="Existing EMI (₹)">
                <TextInput type="number" value={form.existingEmi || ''} onChange={(e) => setForm({ ...form, existingEmi: parseInt(e.target.value) || 0 })} placeholder="0" />
              </Field>
              <Field label="Credit Score (300-900)" required>
                <TextInput type="number" value={form.creditScore} onChange={(e) => setForm({ ...form, creditScore: parseInt(e.target.value) || 0 })} />
              </Field>
              <Field label="Experience (years)">
                <TextInput type="number" value={form.experience} onChange={(e) => setForm({ ...form, experience: parseInt(e.target.value) || 0 })} />
              </Field>
              <Field label={`Loan Amount (₹) — Range: ${formatINR(selectedScheme.loanRangeMin)} to ${formatINR(selectedScheme.loanRangeMax)}`} required>
                <TextInput type="number" value={form.requestedAmount || ''} onChange={(e) => setForm({ ...form, requestedAmount: parseInt(e.target.value) || 0 })} />
              </Field>
              <Field label="Tenure (months)" required>
                <SelectInput value={form.tenureMonths} onChange={(e) => setForm({ ...form, tenureMonths: parseInt(e.target.value) })}>
                  {[12, 24, 36, 48, 60, 84, 120, 180, 240, 300].map((t) => <option key={t} value={t}>{t} months</option>)}
                </SelectInput>
              </Field>
            </div>

            <Field label="Purpose of Loan" required>
              <TextArea
                value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                placeholder="Describe how you plan to use this loan..."
                rows={3}
              />
            </Field>

            <div className="rounded-xl bg-navy-700/40 border border-navy-500/20 px-4 py-3">
              <p className="text-xs text-navy-300">
                Based on the information provided, your eligibility will be calculated automatically. This is an estimate only — actual eligibility is determined by the lender.
              </p>
            </div>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep('scheme')}>
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
              <Button onClick={handleDetailsNext} disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Checking eligibility...
                  </span>
                ) : (
                  <>Continue <ChevronRight className="h-4 w-4" /></>
                )}
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Step: Lender */}
      {step === 'lender' && (
        <Card>
          <CardHeader>
            <CardTitle>Select a Lender</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            {lenders.length === 0 && (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-navy-600 mx-auto mb-3" />
                <p className="text-sm text-navy-300">No lenders found for this loan type. You can still proceed without selecting a lender.</p>
              </div>
            )}
            {lenders.map((lender) => (
              <button
                key={lender.id}
                onClick={() => setSelectedLender(lender)}
                className={`w-full text-left rounded-xl p-4 border transition-all ${
                  selectedLender?.id === lender.id
                    ? 'border-accent-400 bg-accent-500/10'
                    : 'border-navy-500/30 bg-navy-700/40 hover:border-navy-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-navy-600/50 text-accent-400">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{lender.name}</h3>
                      <p className="text-xs text-navy-300">{lender.branchName} · {lender.city}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-accent-400 font-medium">{lender.interestRateMin}% - {lender.interestRateMax}%</p>
                    <p className="text-xs text-navy-400">{lender.category}</p>
                  </div>
                </div>
                {selectedLender?.id === lender.id && (
                  <div className="mt-3 pt-3 border-t border-navy-500/30">
                    <p className="text-xs text-navy-300">{lender.eligibilitySummary}</p>
                    <p className="text-xs text-navy-400 mt-1">{lender.openingHours}</p>
                    {!lender.apiEndpoint && (
                      <p className="text-xs text-orange-400 mt-2 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        No electronic API — direct application via lender's official website
                      </p>
                    )}
                  </div>
                )}
              </button>
            ))}

            <div className="rounded-xl bg-navy-700/40 border border-navy-500/20 px-4 py-3">
              <p className="text-xs text-navy-300">
                LoanSure AI does not guarantee loan approval. Lenders determine eligibility based on their own policies. If a lender does not have an electronic API, you will be directed to their official application channel.
              </p>
            </div>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={goBack}>
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
              <Button onClick={handleLenderNext} disabled={!selectedLender}>
                Continue <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Step: Documents */}
      {step === 'documents' && selectedScheme && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Required Documents</CardTitle>
              <Badge variant="info">{documents.length} uploaded</Badge>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="rounded-xl bg-navy-700/40 border border-navy-500/20 px-4 py-3">
              <p className="text-xs text-navy-300">
                Upload the required documents for your {selectedScheme.name} application. Accepted formats: PDF, JPG, JPEG, PNG. Maximum file size: 10 MB. Files are stored privately and can only be accessed by you.
              </p>
            </div>

            {selectedScheme.requiredDocuments.map((docType) => {
              const uploadedDoc = documents.find((d) => d.documentType === docType);
              const progress = uploadProgress[docType];

              return (
                <div key={docType} className="rounded-xl border border-navy-500/30 bg-navy-700/40 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${uploadedDoc ? 'bg-green-500/15 text-green-400' : 'bg-navy-600/50 text-navy-300'}`}>
                        {uploadedDoc ? <FileCheck className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{docType}</p>
                        {uploadedDoc && (
                          <p className="text-xs text-navy-300">{uploadedDoc.fileName} · {Math.round(uploadedDoc.fileSize / 1024)} KB</p>
                        )}
                      </div>
                    </div>
                    {uploadedDoc && (
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          uploadedDoc.status === 'Verified' ? 'success' :
                          uploadedDoc.status === 'Rejected' ? 'danger' :
                          uploadedDoc.status === 'Needs Review' ? 'warning' :
                          'info'
                        }>
                          {uploadedDoc.status}
                        </Badge>
                        <button
                          onClick={() => handleDeleteDocument(uploadedDoc)}
                          className="text-navy-400 hover:text-orange-400 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {progress !== undefined && (
                    <div className="mb-2">
                      <div className="h-1.5 rounded-full bg-navy-600 overflow-hidden">
                        <div className="h-full bg-accent-500 transition-all" style={{ width: `${progress}%` }} />
                      </div>
                      <p className="text-xs text-navy-400 mt-1">Uploading... {progress}%</p>
                    </div>
                  )}

                  {!uploadedDoc && progress === undefined && (
                    <label className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-navy-500/40 py-3 cursor-pointer hover:border-accent-400/40 transition-colors">
                      <Upload className="h-4 w-4 text-navy-300" />
                      <span className="text-xs text-navy-300">Click to upload</span>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUpload(docType, file);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  )}

                  {uploadedDoc && (
                    <button
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png';
                        input.onchange = () => {
                          const file = input.files?.[0];
                          if (file) handleUpload(docType, file);
                        };
                        input.click();
                      }}
                      className="text-xs text-accent-400 hover:text-accent-300"
                    >
                      Replace document
                    </button>
                  )}
                </div>
              );
            })}

            <div className="rounded-xl bg-orange-500/10 border border-orange-500/20 px-4 py-3">
              <p className="text-xs text-orange-300 flex items-start gap-2">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                Uploading a document does not verify its authenticity. Documents are checked for format and readability. Do not upload documents that are not yours.
              </p>
            </div>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={goBack}>
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
              <Button onClick={() => setStep('review')} disabled={documents.length === 0}>
                Continue to Review <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Step: Review */}
      {step === 'review' && selectedScheme && selectedLender && (
        <Card>
          <CardHeader>
            <CardTitle>Application Review</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            <ReviewSection title="Applicant Information">
              <ReviewItem label="Name" value={form.fullName} />
              <ReviewItem label="Age" value={String(form.age)} />
              <ReviewItem label="Employment" value={form.employmentType} />
              <ReviewItem label="Monthly Income" value={formatINR(form.monthlyIncome)} />
              <ReviewItem label="Credit Score" value={String(form.creditScore)} />
            </ReviewSection>

            <ReviewSection title="Loan Details">
              <ReviewItem label="Scheme" value={selectedScheme.name} />
              {form.subType && <ReviewItem label="Sub-Category" value={form.subType} />}
              <ReviewItem label="Requested Amount" value={formatINR(form.requestedAmount)} />
              <ReviewItem label="Tenure" value={`${form.tenureMonths} months`} />
              <ReviewItem label="Purpose" value={form.purpose} />
            </ReviewSection>

            <ReviewSection title="Lender">
              <ReviewItem label="Bank/Lender" value={selectedLender.name} />
              <ReviewItem label="Branch" value={selectedLender.branchName} />
              <ReviewItem label="Interest Rate Range" value={`${selectedLender.interestRateMin}% - ${selectedLender.interestRateMax}%`} />
            </ReviewSection>

            <ReviewSection title="Uploaded Documents">
              {documents.length === 0 ? (
                <p className="text-xs text-navy-300">No documents uploaded yet.</p>
              ) : (
                documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <FileCheck className="h-3.5 w-3.5 text-green-400" />
                      <span className="text-sm text-white">{doc.documentType}</span>
                    </div>
                    <Badge variant={
                      doc.status === 'Verified' ? 'success' :
                      doc.status === 'Rejected' ? 'danger' :
                      doc.status === 'Needs Review' ? 'warning' : 'info'
                    }>
                      {doc.status}
                    </Badge>
                  </div>
                ))
              )}
            </ReviewSection>

            <ReviewSection title="Important Terms">
              <ul className="space-y-2 text-xs text-navy-300">
                <li className="flex items-start gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-accent-400 shrink-0 mt-0.5" />
                  LoanSure AI provides informational estimates only and is not a lender.
                </li>
                <li className="flex items-start gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-accent-400 shrink-0 mt-0.5" />
                  Actual loan approval, interest rates, and terms are determined by the lender.
                </li>
                <li className="flex items-start gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-accent-400 shrink-0 mt-0.5" />
                  Your documents are stored privately and can only be accessed by you.
                </li>
                <li className="flex items-start gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-accent-400 shrink-0 mt-0.5" />
                  If the selected lender has no electronic API, you will be directed to their official application channel.
                </li>
              </ul>
            </ReviewSection>

            <label className="flex items-start gap-3 cursor-pointer rounded-xl bg-navy-700/40 border border-navy-500/20 p-4">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="h-4 w-4 rounded border-navy-500 bg-navy-800 text-accent-500 focus:ring-accent-400 mt-0.5"
              />
              <span className="text-sm text-navy-100">
                I confirm that the information and documents provided by me are accurate and belong to me. I understand that providing false information may result in application rejection and legal consequences.
              </span>
            </label>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={goBack}>
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
              <Button onClick={handleSubmit} disabled={!consent || submitting} variant="primary" size="lg">
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                  </span>
                ) : (
                  <>Submit Loan Application <ArrowRight className="h-4 w-4" /></>
                )}
              </Button>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-navy-700/40 border border-navy-500/20 p-4">
      <h3 className="text-sm font-semibold text-white mb-3">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-navy-300">{label}</span>
      <span className="text-sm font-medium text-white text-right">{value}</span>
    </div>
  );
}
