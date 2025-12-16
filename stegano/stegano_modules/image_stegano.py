import cv2
import numpy as np

class ImageStegano:
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
    
    def encode(self, image_path, secret_text, output_path):
        """Encode secret text into image using LSB"""
        # Read image
        image = cv2.imread(image_path)
        if image is None:
            raise Exception("Could not read image file")
        
        # Convert secret text to binary
        binary_secret = self.string_to_binary(secret_text)
        binary_secret += '1111111111111110'  # End of message delimiter
        
        # Check if image can hold the message
        total_pixels = image.shape[0] * image.shape[1] * 3
        if len(binary_secret) > total_pixels:
            raise Exception("Image too small to hold the secret message")
        
        print(f"Encoding {len(secret_text)} characters ({len(binary_secret)} bits) into image")
        
        # Encode message in LSB
        binary_index = 0
        for row in image:
            for pixel in row:
                for channel in range(3):  # BGR channels
                    if binary_index < len(binary_secret):
                        # Clear LSB and set to secret bit
                        pixel[channel] = (pixel[channel] & 0xFE) | int(binary_secret[binary_index])
                        binary_index += 1
                    else:
                        break
                if binary_index >= len(binary_secret):
                    break
            if binary_index >= len(binary_secret):
                break
        
        # Save encoded image - USE PNG FOR LOSSLESS COMPRESSION
        if not output_path.lower().endswith('.png'):
            output_path = output_path.rsplit('.', 1)[0] + '.png'
        
        cv2.imwrite(output_path, image)
        return output_path
    
    def decode(self, image_path):
        """Decode secret text from image"""
        # Read image
        image = cv2.imread(image_path)
        if image is None:
            raise Exception("Could not read image file")
        
        # Extract LSBs but STOP when we find the end marker
        binary_secret = ""
        end_marker = '1111111111111110'
        
        # Only read enough pixels to contain the message
        for row in image:
            for pixel in row:
                for channel in range(3):  # BGR channels
                    binary_secret += str(pixel[channel] & 1)
                    
                    # Check for end marker every time we have enough bits
                    if len(binary_secret) >= len(end_marker):
                        if binary_secret[-len(end_marker):] == end_marker:
                            # Remove the end marker and return
                            binary_secret = binary_secret[:-len(end_marker)]
                            return self.binary_to_string(binary_secret)
        
        # If we get here, no end marker was found
        raise Exception("No hidden message found in image")