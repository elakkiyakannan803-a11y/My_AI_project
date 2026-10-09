import { useState, useRef } from 'react';
import { FolderOpen, Upload, CheckCircle2, FileText, Info, X, Loader2 } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/lib/toast';
import { demoDocuments } from '@/data/demoData';
import type { DocumentItem } from '@/types';

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];
const MAX_SIZE = 10 * 1024 * 1024;

function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size === 0) return { valid: false, error: 'The selected file is empty.' };
  if (file.size > MAX_SIZE) return { valid: false, error: 'File size must not exceed 10 MB.' };
  const lowerName = file.name.toLowerCase();
  if (!ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext)))
    return { valid: false, error: 'Only PDF, JPG, JPEG, and PNG files are allowed.' };
  if (file.type && !ALLOWED_TYPES.includes(file.type.toLowerCase()))
    return { valid: false, error: 'Unsupported file type. Only PDF, JPG, JPEG, and PNG are allowed.' };
  return { valid: true };
}

export default function Documents() {
  const { showToast } = useToast();
  const [documents, setDocuments] = useState<DocumentItem[]>(
    demoDocuments.map((d) => ({ ...d, uploaded: false, uploadDate: undefined }))
  );
  const [uploadTarget, setUploadTarget] = useState<DocumentItem | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const requiredCount = documents.filter((d) => d.required).length;
  const uploadedCount = documents.filter((d) => d.uploaded).length;
  const requiredUploaded = documents.filter((d) => d.required && d.uploaded).length;
  const progress = requiredCount > 0 ? Math.round((requiredUploaded / requiredCount) * 100) : 0;

  const categories = [...new Set(documents.map((d) => d.category))];

  const openUploadModal = (doc: DocumentItem) => {
    setUploadTarget(doc);
    setSelectedFile(null);
  };

  const closeUploadModal = () => {
    setUploadTarget(null);
    setSelectedFile(null);
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }
    const result = validateFile(file);
    if (!result.valid) {
      showToast(result.error || 'Invalid file.', 'error');
      setSelectedFile(null);
      e.target.value = '';
      return;
    }
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!uploadTarget || !selectedFile) {
      showToast('Please select a file before uploading.', 'error');
      return;
    }

    setUploading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      setDocuments((prev) =>
        prev.map((d) =>
          d.id === uploadTarget.id
            ? { ...d, uploaded: true, uploadDate: new Date().toISOString().split('T')[0] }
            : d
        )
      );
      showToast(`${uploadTarget.name} uploaded successfully.`, 'success');
      closeUploadModal();
    } catch {
      showToast('Upload failed. Please try again.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (doc: DocumentItem) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === doc.id ? { ...d, uploaded: false, uploadDate: undefined } : d))
    );
    showToast(`${doc.name} removed.`, 'info');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Document Checklist</h2>
        <p className="text-sm text-navy-300">Track and manage your loan application documents</p>
      </div>

      {/* Progress */}
      <Card>
        <CardBody className="pt-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-white">Required Documents Progress</p>
              <p className="text-xs text-navy-300">{requiredUploaded} of {requiredCount} required documents uploaded</p>
            </div>
            <span className="text-2xl font-bold text-accent-400">{progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-navy-600/50 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent-500 to-accent-400 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex gap-4 mt-3 text-xs">
            <span className="text-navy-300">Total: <span className="text-white font-medium">{documents.length}</span></span>
            <span className="text-green-400">Uploaded: <span className="font-medium">{uploadedCount}</span></span>
            <span className="text-orange-400">Pending: <span className="font-medium">{documents.length - uploadedCount}</span></span>
          </div>
        </CardBody>
      </Card>

      {/* Info */}
      <div className="rounded-xl bg-navy-700/40 border border-navy-500/20 px-4 py-3 flex gap-3">
        <Info className="h-4 w-4 text-navy-300 shrink-0 mt-0.5" />
        <p className="text-xs text-navy-300">
          Accepted formats: PDF, JPG, JPEG, PNG. Maximum file size: 10 MB. A document will only show as "Uploaded" after a real file is successfully selected and uploaded.
        </p>
      </div>

      {/* Documents by category */}
      {categories.map((category) => {
        const docs = documents.filter((d) => d.category === category);
        return (
          <div key={category}>
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-accent-400" />
              {category}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {docs.map((doc) => (
                <Card key={doc.id} className="hover:border-accent-400/30 transition-colors">
                  <CardBody className="pt-4 flex items-center gap-3">
                    <div className={`p-2.5 rounded-lg shrink-0 ${doc.uploaded ? 'bg-green-500/15 text-green-400' : 'bg-navy-600/50 text-navy-300'}`}>
                      {doc.uploaded ? <CheckCircle2 className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{doc.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {doc.required ? (
                          <Badge variant="warning">Required</Badge>
                        ) : (
                          <Badge variant="neutral">Optional</Badge>
                        )}
                        {doc.uploaded ? (
                          <Badge variant="success">Uploaded</Badge>
                        ) : (
                          <Badge variant="error">Not Uploaded</Badge>
                        )}
                      </div>
                      {doc.uploadDate && (
                        <p className="text-[10px] text-navy-400 mt-1">Uploaded: {doc.uploadDate}</p>
                      )}
                    </div>
                    {doc.uploaded ? (
                      <Button size="sm" variant="ghost" onClick={() => handleRemove(doc)}>
                        Remove
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => openUploadModal(doc)}>
                        <Upload className="h-3.5 w-3.5" />
                        Upload
                      </Button>
                    )}
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        );
      })}

      {/* Upload modal */}
      {uploadTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={closeUploadModal}>
          <Card className="w-full max-w-md" >
            <div className="flex items-center justify-between px-5 py-4 border-b border-navy-600/40" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-base font-bold text-white">Upload Document</h3>
              <button onClick={closeUploadModal} className="text-navy-300 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <CardBody className="space-y-4" >
              <p className="text-sm text-navy-200">Upload: <span className="font-semibold text-white">{uploadTarget.name}</span></p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                className="hidden"
                onChange={onFileChange}
              />

              {selectedFile ? (
                <div className="rounded-xl border border-accent-500/30 bg-accent-500/10 p-4 flex items-center gap-3">
                  <FileText className="h-8 w-8 text-accent-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{selectedFile.name}</p>
                    <p className="text-xs text-navy-300">{(selectedFile.size / 1024).toFixed(1)} KB · {selectedFile.type || 'Unknown type'}</p>
                  </div>
                  <button onClick={handleFileSelect} className="text-xs text-accent-400 hover:text-accent-300 shrink-0">
                    Change
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleFileSelect}
                  className="w-full border-2 border-dashed border-navy-500/40 rounded-xl p-8 text-center hover:border-accent-400/40 transition-colors"
                >
                  <Upload className="h-10 w-10 text-navy-300 mx-auto mb-3" />
                  <p className="text-sm text-navy-200 mb-1">Click to select a file</p>
                  <p className="text-xs text-navy-400">PDF, JPG, JPEG, PNG — max 10 MB</p>
                </button>
              )}

              <div className="rounded-lg bg-orange-500/10 border border-orange-500/30 px-3 py-2">
                <p className="text-xs text-orange-200">You must select a real file. The upload button will not work until a valid file is chosen.</p>
              </div>

              <Button
                className="w-full"
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
              >
                {uploading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</>
                ) : (
                  <><CheckCircle2 className="h-4 w-4" /> Confirm Upload</>
                )}
              </Button>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
