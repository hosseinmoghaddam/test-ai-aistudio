import React, { useCallback } from 'react';
import { ReceiptData } from '../types';
import { parseReceiptImage } from '../services/geminiService';
import { Upload, Image as ImageIcon } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

interface ReceiptUploaderProps {
  onReceiptParsed: (data: ReceiptData, imageUrl: string) => void;
  isProcessing: boolean;
  setIsProcessing: (val: boolean) => void;
}

const ReceiptUploader: React.FC<ReceiptUploaderProps> = ({ onReceiptParsed, isProcessing, setIsProcessing }) => {

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64Data = base64String.split(',')[1];
        const mimeType = file.type;

        try {
          const receiptData = await parseReceiptImage(base64Data, mimeType);
          onReceiptParsed(receiptData, base64String);
        } catch (err) {
          alert("Failed to analyze receipt. Please try a clearer image.");
          console.error(err);
        } finally {
          setIsProcessing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("File reading error", error);
      setIsProcessing(false);
    }
  }, [onReceiptParsed, setIsProcessing]);

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500">
        <LoadingSpinner />
        <p className="mt-4 text-sm font-medium animate-pulse">Analyzing receipt with Gemini...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative">
       <input 
        type="file" 
        accept="image/*" 
        onChange={handleFileChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      <div className="bg-indigo-100 p-4 rounded-full mb-4">
        <Upload className="w-8 h-8 text-indigo-600" />
      </div>
      <h3 className="text-lg font-semibold text-slate-800">Upload Receipt</h3>
      <p className="text-slate-500 text-center mt-2 max-w-xs">
        Take a photo or upload an image of your bill to start splitting.
      </p>
      <div className="mt-6 flex items-center gap-2 text-xs text-slate-400 uppercase tracking-wider font-semibold">
        <ImageIcon className="w-4 h-4" />
        <span>Supports JPG, PNG, WEBP</span>
      </div>
    </div>
  );
};

export default ReceiptUploader;