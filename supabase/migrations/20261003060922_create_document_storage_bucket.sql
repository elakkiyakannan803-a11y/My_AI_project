/*
# Create private document storage bucket

Creates a 'loan-documents' storage bucket for user document uploads.
Files are stored privately and accessible only through signed URLs.
RLS policies ensure users can only access their own documents.
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('loan-documents', 'loan-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Users can upload files to their own folder
DROP POLICY IF EXISTS "Users can upload own documents" ON storage.objects;
CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'loan-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can read their own files
DROP POLICY IF EXISTS "Users can read own documents" ON storage.objects;
CREATE POLICY "Users can read own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'loan-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update their own files (replace)
DROP POLICY IF EXISTS "Users can update own documents" ON storage.objects;
CREATE POLICY "Users can update own documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'loan-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'loan-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own files
DROP POLICY IF EXISTS "Users can delete own documents" ON storage.objects;
CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'loan-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
