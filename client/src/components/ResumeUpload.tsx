import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

const ResumeUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
  });

  const handleSubmit = async () => {
    if (!file || !jobDescription.trim()) return;

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('jobDescription', jobDescription);

    setLoading(true);
    setFeedback('');

    try {
      const response = await axios.post('http://localhost:5001/analyze', formData);
      setFeedback(response.data.feedback);
    } catch (error) {
      console.error(error);
      setFeedback('There was an error analyzing your resume.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800 font-sans">
      {/* Sidebar layout */}
      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-xl p-6 hidden md:flex flex-col border-r border-zinc-200">
          <h1 className="text-2xl font-bold mb-6">AI Resume Analyzer</h1>
          <nav className="flex-1 space-y-4 text-sm">
            <p className="text-zinc-500">Upload a resume and get tailored feedback.</p>
          </nav>
          <footer className="text-xs text-zinc-400 mt-auto">
            &copy; {new Date().getFullYear()} Daniel Rodriguez
          </footer>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto px-4 md:px-10 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Upload Section */}
            <section className="bg-white border border-zinc-100 shadow-xl rounded-3xl p-8 space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Upload Resume (PDF)</label>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-2xl px-6 py-10 text-center cursor-pointer transition-colors duration-200 ${
                    isDragActive ? 'border-blue-600 bg-blue-50' : 'border-zinc-300 bg-zinc-50'
                  }`}
                >
                  <input {...getInputProps()} />
                  {file ? (
                    <p className="text-zinc-700 font-medium">{file.name}</p>
                  ) : (
                    <p className="text-zinc-400">Drag & drop or click to select a PDF</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="jobDescription" className="block text-sm font-medium text-zinc-700 mb-2">
                  Job Description
                </label>
                <textarea
                  id="jobDescription"
                  className="w-full border border-zinc-300 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={6}
                  placeholder="Paste the job description here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading || !file || !jobDescription.trim()}
                className="w-full py-3 px-6 flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold rounded-2xl shadow hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Analyzing...' : 'Analyze Resume'}
              </button>
            </section>

            {/* Feedback Section */}
            <section className="bg-white border border-zinc-100 shadow-xl rounded-3xl p-8 overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">Feedback</h2>
              {feedback ? (
                <pre className="text-sm text-zinc-700 whitespace-pre-wrap max-h-[500px] overflow-y-auto">{feedback}</pre>
              ) : (
                <p className="text-sm text-zinc-500">Your feedback will appear here after submission.</p>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ResumeUpload;
