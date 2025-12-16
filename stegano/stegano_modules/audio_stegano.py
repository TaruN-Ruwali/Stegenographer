import wave
import numpy as np

class AudioStegano:
    def __init__(self):
        pass
    
    def string_to_binary(self, text):
        """Convert string to binary representation"""
        binary = ''.join(format(ord(char), '08b') for char in text)
        return binary
    
    def binary_to_string(self, binary):
        """Convert binary to string"""
        chars = []
        for i in range(0, len(binary), 8):
            byte = binary[i:i+8]
            if len(byte) == 8:
                chars.append(chr(int(byte, 2)))
        return ''.join(chars)
    
    def encode(self, audio_path, secret_text, output_path):
        """Encode secret text into audio using LSB"""
        try:
            # Read audio file
            with wave.open(audio_path, 'rb') as audio:
                params = audio.getparams()
                frames = audio.readframes(audio.getnframes())
            
            # Convert to numpy array and MAKE A COPY to ensure it's writable
            audio_array = np.frombuffer(frames, dtype=np.int16).copy()
            
            # Convert secret text to binary
            binary_secret = self.string_to_binary(secret_text)
            binary_secret += '1111111111111110'  # End of message delimiter
            
            # Check if audio can hold the message
            if len(binary_secret) > len(audio_array):
                raise Exception(f"Audio file too small to hold the secret message. Need {len(binary_secret)} samples but only have {len(audio_array)}")
            
            print(f"Encoding {len(binary_secret)} bits into {len(audio_array)} audio samples")
            
            # Encode message in LSB
            for i in range(len(binary_secret)):
                # Clear LSB and set to secret bit
                if binary_secret[i] == '1':
                    audio_array[i] = audio_array[i] | 1  # Set LSB to 1
                else:
                    audio_array[i] = audio_array[i] & 0xFFFE  # Set LSB to 0
            
            # Save encoded audio
            with wave.open(output_path, 'wb') as output:
                output.setparams(params)
                output.writeframes(audio_array.tobytes())
            
            print(f"Audio encoded successfully and saved to {output_path}")
            return output_path
            
        except Exception as e:
            raise Exception(f"Audio encoding failed: {str(e)}")
    
    def decode(self, audio_path):
        """Decode secret text from audio"""
        try:
            # Read audio file
            with wave.open(audio_path, 'rb') as audio:
                frames = audio.readframes(audio.getnframes())
            
            # Convert to numpy array
            audio_array = np.frombuffer(frames, dtype=np.int16)
            
            # Extract LSBs
            binary_secret = ""
            max_bits_to_read = min(len(audio_array), 100000)  # Limit for safety
            
            for i in range(max_bits_to_read):
                binary_secret += str(audio_array[i] & 1)
                
                # Check for end marker every 16 bits
                if len(binary_secret) >= 16:
                    if binary_secret[-16:] == '1111111111111110':
                        binary_secret = binary_secret[:-16]  # Remove end marker
                        break
            
            # If no end marker found, use first 10000 bits
            if len(binary_secret) > 10000:
                binary_secret = binary_secret[:10000]
            
            print(f"Decoded {len(binary_secret)} bits from audio")
            
            # Convert binary to string
            decoded_text = self.binary_to_string(binary_secret)
            return decoded_text
            
        except Exception as e:
            raise Exception(f"Audio decoding failed: {str(e)}")