import os
import uuid
import logging
import pdfplumber
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
import google.generativeai as genai

# --- Load environment variables ---
load_dotenv()

# --- Flask App Setup ---
app = Flask(__name__)
CORS(app)

# --- Configuration ---
UPLOAD_FOLDER = 'server/uploads'
ALLOWED_EXTENSIONS = {'pdf'}
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max upload

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# --- Logging ---
logging.basicConfig(level=logging.INFO)

# --- Gemini Setup ---
GOOGLE_API_KEY = os.getenv("GEMINI_API_KEY")
if not GOOGLE_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable not set")

genai.configure(api_key=GOOGLE_API_KEY)
model = genai.GenerativeModel(model_name="models/gemini-2.5-flash")

# --- Helper Functions ---
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_pdf(pdf_path):
    with pdfplumber.open(pdf_path) as pdf:
        text_pages = [page.extract_text() for page in pdf.pages if page.extract_text()]
    return "\n".join(text_pages)

def build_prompt(resume_text, job_description):
    return f"""
You are an expert AI resume coach. Compare the resume below to the job description and return detailed, actionable feedback to improve the resume for this specific role.

--- Resume Text ---
{resume_text}

--- Job Description ---
{job_description}

Your output should be a clear, concise list of improvements categorized by relevance, skill alignment, formatting, and clarity.
"""

# --- Error Handlers ---
@app.errorhandler(413)
def file_too_large(error):
    return jsonify({'error': 'File too large. Max size is 16MB.'}), 413

# --- Routes ---
@app.route('/analyze', methods=['POST'])
def analyze_resume():
    if 'resume' not in request.files or 'jobDescription' not in request.form:
        return jsonify({'error': 'Resume and job description are both required'}), 400

    file = request.files['resume']
    job_description = request.form['jobDescription']

    if file.filename == '' or not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type. Only PDF allowed.'}), 400

    # Safe unique filename
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4().hex}{file_ext}"
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], secure_filename(unique_filename))

    try:
        file.save(file_path)
    except Exception as e:
        app.logger.error(f"File saving failed: {e}")
        return jsonify({'error': 'Failed to save file'}), 500

    try:
        resume_text = extract_text_from_pdf(file_path)
        if not resume_text.strip():
            return jsonify({'error': 'No readable text found in resume PDF'}), 400
    except Exception as e:
        app.logger.error(f"PDF extraction failed: {e}")
        return jsonify({'error': 'Failed to extract text from PDF'}), 500

    prompt = build_prompt(resume_text, job_description)

    try:
        response = model.generate_content(prompt)
        feedback = response.text.strip()
        return jsonify({'feedback': feedback})
    except Exception as e:
        app.logger.error(f"Gemini generation failed: {e}")
        return jsonify({'error': f"AI generation failed: {str(e)}"}), 500
    finally:
        # Clean up uploaded file
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception as e:
            app.logger.warning(f"Failed to delete uploaded file: {e}")

# --- Start Server ---
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=False)
