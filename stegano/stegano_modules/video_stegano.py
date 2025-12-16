import cv2
import numpy as np
import os

class VideoStegano:
    def __init__(self):
        self.end_marker = "1111111111111110"

    def str_to_bin(self, message):
        """Convert string to binary string."""
        binary = ''.join(format(ord(i), '08b') for i in message)
        return binary + self.end_marker

    def bin_to_str(self, binary_data):
        """Convert binary string to text."""
        binary_data = binary_data.split(self.end_marker)[0]
        all_bytes = [binary_data[i:i+8] for i in range(0, len(binary_data), 8)]
        decoded_data = ""
        for byte in all_bytes:
            if len(byte) == 8: # Ensure valid byte
                decoded_data += chr(int(byte, 2))
        return decoded_data

    def encode_frame(self, frame, binary_message):
        """Embed binary message into a single frame using LSB."""
        data_index = 0
        data_len = len(binary_message)
        
        # Flatten frame to simplify iteration
        # frame shape is (height, width, 3)
        rows, cols, channels = frame.shape
        
        for row in range(rows):
            for col in range(cols):
                for channel in range(channels):
                    if data_index < data_len:
                        # Get current pixel value
                        pixel = frame[row, col, channel]
                        
                        # Modify LSB
                        # Clear LSB (bitwise AND with 254) then OR with bit from message
                        bit = int(binary_message[data_index])
                        frame[row, col, channel] = (pixel & 254) | bit
                        
                        data_index += 1
                    else:
                        return frame
        return frame

    def decode_frame(self, frame):
        """Extract binary data from a single frame."""
        binary_data = ""
        rows, cols, channels = frame.shape
        
        for row in range(rows):
            for col in range(cols):
                for channel in range(channels):
                    pixel = frame[row, col, channel]
                    binary_data += str(pixel & 1)
                    
                    # Check for end marker occasionally to stop early (optimization)
                    if len(binary_data) > 16 and binary_data[-16:] == self.end_marker:
                        return binary_data
        return binary_data

    def encode(self, input_path, message, output_path):
        cap = cv2.VideoCapture(input_path)
        if not cap.isOpened():
            raise Exception("Could not open input video")

        # Get Video Properties
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        # Setup Video Writer
        # mp4v is standard for mp4, XVID for avi.
        fourcc = cv2.VideoWriter_fourcc(*'mp4v') 
        out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

        binary_message = self.str_to_bin(message)
        
        # Process First Frame (Encode)
        ret, frame = cap.read()
        if ret:
            encoded_frame = self.encode_frame(frame, binary_message)
            out.write(encoded_frame)
        else:
            cap.release()
            out.release()
            raise Exception("Video has no frames")

        # Process Remaining Frames (Copy exactly)
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            out.write(frame)

        cap.release()
        out.release()
        return output_path

    def decode(self, input_path):
        cap = cv2.VideoCapture(input_path)
        if not cap.isOpened():
            raise Exception("Could not open video for decoding")

        # We only need the first frame
        ret, frame = cap.read()
        cap.release()

        if not ret:
            raise Exception("Could not read video frame")

        # Extract binary data from first frame
        binary_data = self.decode_frame(frame)
        
        try:
            decoded_text = self.bin_to_str(binary_data)
            return decoded_text
        except Exception as e:
            raise Exception("Failed to decode message. File might be corrupted or contain no message.")
        




