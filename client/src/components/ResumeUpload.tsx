import React, { useState, useRef, DragEvent, ChangeEvent, FormEvent } from 'react';
import axios from 'axios';
import { Loader2, Upload, FileText } from 'lucide-react';

const ResumeUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const dropRef = useRef<HTMLDivElement | null>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dropRef.current?.classList.add('border-primary');
  };

  const handleDragLeave = () => {
    dropRef.current?.classList.remove('border-primary');
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dropRef.current?.classList.remove('border-primary');
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
      setError('');
    } else {
      setError('Only PDF files are allowed.');
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError('');
    } else {
      setError('Only PDF files are allowed.');
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!file || !jobDescription.trim()) {
      setError('Both resume and job description are required.');
      return;
    }

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('jobDescription', jobDescription);

    try {
      setLoading(true);
      setError('');
      setFeedback('');

      const response = await axios.post('http://localhost:5001/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setFeedback(response.data.feedback);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-4xl font-bold mb-8 text-center text-neutral-900">AI Resume Analyzer</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Drag-and-Drop Zone */}
        <div
          ref={dropRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="relative border-2 border-dashed border-outlineVariant rounded-xl p-8 text-center bg-surfaceContainer cursor-pointer transition hover:border-primary"
          onClick={() => document.getElementById('fileInput')?.click()}
        >
          <div className="flex flex-col items-center gap-2">
            <Upload className="text-primary w-8 h-8" />
            <p className="text-sm text-onSurfaceVariant">
              {file ? `Uploaded: ${file.name}` : 'Drag & drop your PDF resume here or click to upload'}
            </p>
            <input
              id="fileInput"
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              hidden
            />
          </div>
        </div>

        {/* Job Description Textarea */}
        <div>
          <label className="block text-sm font-medium text-onSurface mb-1">Job Description</label>
          <textarea
            rows={6}
            placeholder="Paste the job description here..."
            className="w-full p-4 border border-outlineVariant rounded-xl text-sm focus:ring-2 focus:ring-primary focus:outline-none bg-surface text-onSurface"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 bg-primary text-white font-medium py-3 rounded-xl transition hover:bg-primaryHover disabled:opacity-50"
          disabled={loading}
        >
          {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <FileText className="h-5 w-5" />}
          {loading ? 'Analyzing...' : 'Analyze Resume'}
        </button>

        {/* Error Alert */}
        {error && (
          <div className="text-sm text-red-700 bg-red-100 p-3 rounded-lg">
            {error}
          </div>
        )}
      </form>

      {/* Feedback Section */}
      {feedback && (
        <div className="mt-10 bg-surfaceContainer p-5 rounded-xl border border-outlineVariant shadow-sm">
          <h2 className="text-xl font-semibold mb-3 text-onSurface">Feedback</h2>
          <pre className="whitespace-pre-wrap text-sm text-onSurfaceVariant">
            {feedback}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ResumeUpload;
