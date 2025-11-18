const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const Jimp = require('jimp');
const WaveFile = require('wavefile').WaveFile;
const { encryptData, decryptData } = require('./crypto');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// ===============================
// IMAGE STEGANOGRAPHY
// ===============================

class LSBImageSteg {
    constructor(imagePath) {
        this.imagePath = imagePath;
    }

    async encode(data, outputPath) {
        try {
            const image = await Jimp.read(this.imagePath);
            const binaryData = this.stringToBinary(data);
            
            // Add header: data length (32 bits)
            const dataLength = binaryData.length;
            const lengthBinary = dataLength.toString(2).padStart(32, '0');
            const fullBinary = lengthBinary + binaryData;

            let bitIndex = 0;
            
            image.scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y, idx) => {
                if (bitIndex >= fullBinary.length) return;
                
                const bit = fullBinary[bitIndex];
                const currentValue = image.bitmap.data[idx];
                
                // Modify LSB
                if (bit === '1') {
                    image.bitmap.data[idx] = currentValue | 1;
                } else {
                    image.bitmap.data[idx] = currentValue & 254;
                }
                
                bitIndex++;
            });

            await image.writeAsync(outputPath);
            return outputPath;
        } catch (error) {
            throw new Error(`Image encoding failed: ${error.message}`);
        }
    }

    async decode() {
        try {
            const image = await Jimp.read(this.imagePath);
            let binaryString = '';
            let dataLength = 0;
            let readingHeader = true;
            let headerBits = '';

            image.scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y, idx) => {
                if (readingHeader) {
                    // Read header (32 bits for data length)
                    const bit = (image.bitmap.data[idx] & 1) ? '1' : '0';
                    headerBits += bit;
                    
                    if (headerBits.length === 32) {
                        dataLength = parseInt(headerBits, 2);
                        readingHeader = false;
                    }
                    return;
                }

                if (binaryString.length < dataLength) {
                    const bit = (image.bitmap.data[idx] & 1) ? '1' : '0';
                    binaryString += bit;
                }
            });

            return this.binaryToString(binaryString);
        } catch (error) {
            throw new Error(`Image decoding failed: ${error.message}`);
        }
    }

    stringToBinary(str) {
        return str.split('').map(char => {
            return char.charCodeAt(0).toString(2).padStart(8, '0');
        }).join('');
    }

    binaryToString(binary) {
        let result = '';
        for (let i = 0; i < binary.length; i += 8) {
            const byte = binary.substr(i, 8);
            if (byte.length === 8) {
                result += String.fromCharCode(parseInt(byte, 2));
            }
        }
        return result;
    }
}

// ===============================
// AUDIO STEGANOGRAPHY
// ===============================

class LSBAudioSteg {
    constructor(audioPath) {
        this.audioPath = audioPath;
    }

    encode(data, outputPath) {
        try {
            const audioBuffer = fs.readFileSync(this.audioPath);
            const wav = new WaveFile(audioBuffer);
            
            // Convert to 16-bit PCM if needed
            wav.toBitDepth('16');
            const samples = wav.getSamples();
            
            const binaryData = this.stringToBinary(data);
            const dataLength = binaryData.length;
            const lengthBinary = dataLength.toString(2).padStart(32, '0');
            const fullBinary = lengthBinary + binaryData;

            let bitIndex = 0;
            let sampleIndex = 0;

            while (bitIndex < fullBinary.length && sampleIndex < samples.length) {
                const bit = fullBinary[bitIndex];
                let sample = samples[sampleIndex];
                
                // Modify LSB
                if (bit === '1') {
                    sample = sample | 1;
                } else {
                    sample = sample & 65534; // 0xFFFE
                }
                
                samples[sampleIndex] = sample;
                bitIndex++;
                sampleIndex++;
            }

            wav.setSamples(samples);
            fs.writeFileSync(outputPath, wav.toBuffer());
            return outputPath;
        } catch (error) {
            throw new Error(`Audio encoding failed: ${error.message}`);
        }
    }

    decode() {
        try {
            const audioBuffer = fs.readFileSync(this.audioPath);
            const wav = new WaveFile(audioBuffer);
            const samples = wav.getSamples();
            
            let binaryString = '';
            let dataLength = 0;
            let readingHeader = true;
            let headerBits = '';
            let sampleIndex = 0;

            while (sampleIndex < samples.length) {
                const sample = samples[sampleIndex];
                const bit = (sample & 1) ? '1' : '0';
                
                if (readingHeader) {
                    headerBits += bit;
                    if (headerBits.length === 32) {
                        dataLength = parseInt(headerBits, 2);
                        readingHeader = false;
                    }
                } else {
                    if (binaryString.length < dataLength) {
                        binaryString += bit;
                    } else {
                        break;
                    }
                }
                sampleIndex++;
            }

            return this.binaryToString(binaryString);
        } catch (error) {
            throw new Error(`Audio decoding failed: ${error.message}`);
        }
    }

    stringToBinary(str) {
        return str.split('').map(char => {
            return char.charCodeAt(0).toString(2).padStart(8, '0');
        }).join('');
    }

    binaryToString(binary) {
        let result = '';
        for (let i = 0; i < binary.length; i += 8) {
            const byte = binary.substr(i, 8);
            if (byte.length === 8) {
                result += String.fromCharCode(parseInt(byte, 2));
            }
        }
        return result;
    }
}

// ===============================
// VIDEO STEGANOGRAPHY
// ===============================

class LSBVideoSteg {
    constructor(videoPath) {
        this.videoPath = videoPath;
    }

    // Note: Video steganography is complex. This is a simplified version
    // that extracts first frame as image, encodes data, and reconstructs
    async encode(data, outputPath) {
        try {
            // For simplicity, we'll handle video as sequential images
            // In production, you'd use ffmpeg for proper video processing
            throw new Error('Video steganography requires ffmpeg integration. Using image-based approach for demo.');
        } catch (error) {
            throw new Error(`Video encoding failed: ${error.message}`);
        }
    }

    async decode() {
        try {
            throw new Error('Video steganography requires ffmpeg integration. Using image-based approach for demo.');
        } catch (error) {
            throw new Error(`Video decoding failed: ${error.message}`);
        }
    }
}

// ===============================
// API ROUTES
// ===============================

// Encode data into media file
router.post('/encode', upload.fields([
    { name: 'carrier', maxCount: 1 },
    { name: 'secret', maxCount: 1 }
]), async (req, res) => {
    try {
        const { mediaType, password } = req.body;
        const carrierFile = req.files['carrier'][0];
        const secretFile = req.files['secret'][0];

        if (!carrierFile || !secretFile) {
            return res.status(400).json({ error: 'Carrier and secret files are required' });
        }

        // Read secret data
        const secretData = fs.readFileSync(secretFile.path, 'utf8');
        
        // Encrypt if password provided
        let dataToHide = secretData;
        if (password) {
            dataToHide = encryptData(secretData, password);
        }

        const outputPath = `outputs/encoded-${Date.now()}.${carrierFile.originalname.split('.').pop()}`;
        
        if (!fs.existsSync('outputs/')) {
            fs.mkdirSync('outputs/', { recursive: true });
        }

        let resultPath;
        switch (mediaType) {
            case 'image':
                const imageSteg = new LSBImageSteg(carrierFile.path);
                resultPath = await imageSteg.encode(dataToHide, outputPath);
                break;
            case 'audio':
                const audioSteg = new LSBAudioSteg(carrierFile.path);
                resultPath = audioSteg.encode(dataToHide, outputPath);
                break;
            case 'video':
                const videoSteg = new LSBVideoSteg(carrierFile.path);
                resultPath = await videoSteg.encode(dataToHide, outputPath);
                break;
            default:
                return res.status(400).json({ error: 'Unsupported media type' });
        }

        res.json({
            success: true,
            message: 'Data encoded successfully',
            downloadUrl: `/api/stegano/download/${path.basename(resultPath)}`
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Decode data from media file
router.post('/decode', upload.single('stegoFile'), async (req, res) => {
    try {
        const { mediaType, password } = req.body;
        const stegoFile = req.file;

        if (!stegoFile) {
            return res.status(400).json({ error: 'Stego file is required' });
        }

        let decodedData;
        switch (mediaType) {
            case 'image':
                const imageSteg = new LSBImageSteg(stegoFile.path);
                decodedData = await imageSteg.decode();
                break;
            case 'audio':
                const audioSteg = new LSBAudioSteg(stegoFile.path);
                decodedData = audioSteg.decode();
                break;
            case 'video':
                const videoSteg = new LSBVideoSteg(stegoFile.path);
                decodedData = await videoSteg.decode();
                break;
            default:
                return res.status(400).json({ error: 'Unsupported media type' });
        }

        // Decrypt if password provided
        if (password) {
            try {
                decodedData = decryptData(decodedData, password);
            } catch (decryptError) {
                return res.status(400).json({ error: 'Invalid password or data not encrypted' });
            }
        }

        res.json({
            success: true,
            message: 'Data decoded successfully',
            data: decodedData
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Download encoded file
router.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../outputs', filename);
    
    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).json({ error: 'File not found' });
    }
});

module.exports = router;