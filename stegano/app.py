from flask import Flask, render_template, request, jsonify, send_file
import os
import uuid
from werkzeug.utils import secure_filename
from stegano_modules.image_stegano import ImageStegano
from stegano_modules.audio_stegano import AudioStegano
from stegano_modules.video_stegano import VideoStegano

app = Flask(__name__, 
            template_folder='frontend',  # Point to frontend folder for templates
            static_folder='frontend',
            static_url_path='')    # Point to frontend folder for static files

app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['UPLOAD_FOLDER'] = 'frontend/uploads/'  # Update upload path
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

ALLOWED_EXTENSIONS = {
    'image': {'png', 'jpg', 'jpeg', 'bmp'},
    'audio': {'wav'},
    'video': {'mp4', 'avi', 'mov'}
}

def allowed_file(filename, file_type):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS.get(file_type, set())

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/encode', methods=['POST'])
def encode():
    try:
        if 'carrier_file' not in request.files:
            return jsonify({'error': 'No carrier file provided'}), 400
        
        carrier_file = request.files['carrier_file']
        secret_text = request.form.get('secret_text', '')
        carrier_type = request.form.get('carrier_type', 'image')
        
        if carrier_file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not secret_text:
            return jsonify({'error': 'No secret text provided'}), 400
        
        if not allowed_file(carrier_file.filename, carrier_type):
            return jsonify({'error': f'Invalid file type for {carrier_type}'}), 400
        
        # Generate unique filenames
        file_id = str(uuid.uuid4())
        input_filename = secure_filename(f"{file_id}_{carrier_file.filename}")
        input_path = os.path.join(app.config['UPLOAD_FOLDER'], input_filename)
        output_filename = f"encoded_{input_filename}"
        output_path = os.path.join(app.config['UPLOAD_FOLDER'], output_filename)
        
        # Save uploaded file
        carrier_file.save(input_path)
        
        # Process based on carrier type
        if carrier_type == 'image':
            stegano = ImageStegano()
            result_path = stegano.encode(input_path, secret_text, output_path)
        elif carrier_type == 'audio':
            stegano = AudioStegano()
            result_path = stegano.encode(input_path, secret_text, output_path)
        elif carrier_type == 'video':
            stegano = VideoStegano()
            result_path = stegano.encode(input_path, secret_text, output_path)
        else:
            return jsonify({'error': 'Invalid carrier type'}), 400
        
        return jsonify({
            'success': True,
            'message': 'Text encoded successfully',
            'download_url': f'/download/{output_filename}',
            'filename': output_filename
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/decode', methods=['POST'])
def decode():
    try:
        if 'stego_file' not in request.files:
            return jsonify({'error': 'No stego file provided'}), 400
        
        stego_file = request.files['stego_file']
        carrier_type = request.form.get('carrier_type', 'image')
        
        if stego_file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(stego_file.filename, carrier_type):
            return jsonify({'error': f'Invalid file type for {carrier_type}'}), 400
        
        # Save uploaded file
        file_id = str(uuid.uuid4())
        filename = secure_filename(f"{file_id}_{stego_file.filename}")
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        stego_file.save(filepath)
        
        # Process based on carrier type
        if carrier_type == 'image':
            stegano = ImageStegano()
            decoded_text = stegano.decode(filepath)
        elif carrier_type == 'audio':
            stegano = AudioStegano()
            decoded_text = stegano.decode(filepath)
        elif carrier_type == 'video':
            stegano = VideoStegano()
            decoded_text = stegano.decode(filepath)
        else:
            return jsonify({'error': 'Invalid carrier type'}), 400
        
        # Clean up uploaded file
        os.remove(filepath)
        
        return jsonify({
            'success': True,
            'message': 'Text decoded successfully',
            'decoded_text': decoded_text
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/download/<filename>')
def download_file(filename):
    try:
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], secure_filename(filename))
        if os.path.exists(filepath):
            return send_file(filepath, as_attachment=True)
        else:
            return jsonify({'error': 'File not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)