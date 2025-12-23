# 🕵️‍♂️ Multimedia Steganography — Hide Text in Images, Audio & Video

![Python](https://img.shields.io/badge/Python-3.8+-blue?logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-Web_Framework-black?logo=flask&logoColor=white)
![OpenCV](https://img.shields.io/badge/OpenCV-Computer_Vision-007ACC?logo=opencv&logoColor=white)
![NumPy](https://img.shields.io/badge/NumPy-Numerical-yellow?logo=numpy&logoColor=white)
![HTML](https://img.shields.io/badge/HTML5-Frontend-E34F26?logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-Styling-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?logo=javascript&logoColor=black)

---

## ✨ Project Overview

**Multimedia Steganography** is a web-based application that allows users to **securely hide and extract secret text messages** inside:

- 🖼️ Images  
- 🔊 Audio files  
- 🎥 Video files  

using the **Least Significant Bit (LSB)** steganography technique.

This project focuses on **simplicity, reliability, and educational clarity**, making it ideal for learning multimedia data hiding concepts.

---

## 🎯 Key Features

- ✅ Hide text inside **Images (PNG, JPEG, BMP)**
- ✅ Hide text inside **Audio (WAV only)**
- ✅ Hide text inside **Videos (MP4, AVI, MOV)**
- ✅ Extract hidden text from all supported media
- ✅ Simple and clean web interface
- ✅ Drag-and-drop file upload with preview
- ✅ Secure file handling with validation
- ✅ Download encoded files instantly

---

## 🛠️ Steganography Techniques Used

### 🖼️ Image Steganography
- Uses **LSB manipulation on RGB pixel values**
- Input images are auto-converted to **PNG** for reliability
- End marker used: `1111111111111110`

### 🔊 Audio Steganography
- Uses **LSB manipulation on 16-bit WAV samples**
- WAV format ensures lossless data preservation

### 🎥 Video Steganography
- Encodes text into the **first video frame only**
- Frame is processed using image steganography
- Video is reconstructed using the `mp4v` codec

---

## ⚡ Technology Stack

| Component | Description |
|---------|-------------|
| 🐍 **Python 3.8+** | Core programming language |
| 🌐 **Flask** | Backend web framework |
| 📷 **OpenCV** | Image & video processing |
| 🔢 **NumPy** | Binary and array manipulation |
| 🔊 **wave (Python)** | Audio file processing |
| 🖥️ **HTML5** | Web interface |
| 🎨 **CSS3** | Styling & layout |
| ⚙️ **JavaScript (Vanilla)** | Frontend logic & AJAX |

---

## 📁 Project Structure
multimedia_steganography/
│
├── app.py # Main Flask application
├── run.py # App runner
├── requirements.txt # Dependencies
│
├── stegano_modules/
│ ├── init.py
│ ├── image_stegano.py # Image LSB steganography
│ ├── audio_stegano.py # Audio LSB steganography
│ └── video_stegano.py # Video frame-based steganography
│
└── frontend/
├── index.html # Web interface
├── style.css # Styling
├── script.js # Frontend logic
└── uploads/ # Temporary file storage

---

## 🚀 Installation & Running

### 1️⃣ Clone the repository
```bash
git clone <repository_url>
cd multimedia_steganography
pip install -r requirements.txt
python app.py
http://localhost:5000
```

##🖥️ Web Interface Features
###🔐 Hide Data

Select carrier type (Image / Audio / Video)

Upload file (drag & drop supported)

Enter secret text

Click "Hide Text in File"

Download encoded file

###🔍 Extract Data

Upload encoded media file

Click "Extract Text from File"

View extracted secret message

###🔐 Validation & Security

✔ File type validation per carrier

✔ Maximum file size: 16MB

✔ Secure filenames using secure_filename()

✔ UUID-based unique file naming

✔ Clear error messages for:

Wrong file format

No file selected

No text entered

File too small for message

###🧪 Testing Scenarios
Test Case	Expected Result
JPEG Image + "Hello"	Download PNG → Extract "Hello"
WAV Audio + "Secret"	Download WAV → Extract "Secret"
MP4 Video + "Test"	Download MP4 → Extract "Test"
Wrong File Type	Error message
No Text Entered	Error message
##📦 Dependencies
Flask==2.3.3
opencv-python==4.8.1.78
numpy==1.24.3
Pillow==10.0.1
Werkzeug==2.3.7
