import React, { useState, useCallback } from 'react';
import { ReceiptData, ReceiptItem, Message, AnalysisResult } from './types';
import ReceiptUploader from './components/ReceiptUploader';
import ReceiptList from './components/ReceiptList';
import ChatInterface from './components/ChatInterface';
import SummaryPanel from './components/SummaryPanel';

const App: React.FC = () => {
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleReceiptParsed = useCallback((data: ReceiptData, imageUrl: string) => {
    setReceiptData(data);
    setReceiptImage(imageUrl);
    // Add initial greeting
    setMessages([{
      id: 'init',
      role: 'model',
      text: `I've extracted ${data.items.length} items from your receipt. Who had what? You can say things like "John had the steak" or "Sarah and Mike shared the appetizers".`,
      timestamp: Date.now()
    }]);
  }, []);

  const updateAssignments = useCallback((modifications: AnalysisResult['modifications']) => {
    if (!receiptData) return;

    setReceiptData(prev => {
      if (!prev) return null;
      
      const newItems = prev.items.map(item => {
        const mod = modifications.find(m => m.itemId === item.id);
        if (mod) {
          return { ...item, assignedTo: mod.assignees };
        }
        return item;
      });

      return { ...prev, items: newItems };
    });
  }, [receiptData]);

  const handleReset = () => {
    if (window.confirm("Start over with a new receipt?")) {
      setReceiptData(null);
      setReceiptImage(null);
      setMessages([]);
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-100">
      {/* Top Bar */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">SplitSmart <span className="text-indigo-600">AI</span></h1>
        </div>
        {receiptData && (
          <button 
            onClick={handleReset}
            className="text-sm font-medium text-slate-500 hover:text-red-600 transition-colors"
          >
            Reset
          </button>
        )}
      </header>

      {/* Main Content Grid */}
      <main className="flex-1 overflow-hidden p-4 md:p-6 max-w-7xl mx-auto w-full">
        {!receiptData ? (
          // Empty State / Upload View
          <div className="max-w-xl mx-auto h-full flex flex-col justify-center">
            <div className="h-96">
               <ReceiptUploader 
                 onReceiptParsed={handleReceiptParsed} 
                 isProcessing={isProcessing} 
                 setIsProcessing={setIsProcessing}
               />
            </div>
          </div>
        ) : (
          // Split View
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
            
            {/* Left Column: Receipt & Image (Visible on large screens, togglable on mobile ideally, but stacked for now) */}
            <div className="lg:col-span-4 flex flex-col gap-4 min-h-0">
              {/* Mini Image Preview */}
              {receiptImage && (
                <div className="h-48 rounded-xl overflow-hidden border border-slate-200 shadow-sm relative group shrink-0">
                  <img src={receiptImage} alt="Receipt" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </div>
              )}
              {/* Parsed List */}
              <div className="flex-1 min-h-0">
                <ReceiptList items={receiptData.items} currency={receiptData.currency || '$'} />
              </div>
            </div>

            {/* Center Column: Chat Interface */}
            <div className="lg:col-span-5 min-h-0 h-[500px] lg:h-full">
              <ChatInterface 
                messages={messages} 
                setMessages={setMessages} 
                items={receiptData.items}
                onUpdateAssignments={updateAssignments}
              />
            </div>

            {/* Right Column: Summary */}
            <div className="lg:col-span-3 min-h-0 h-[300px] lg:h-full">
              <SummaryPanel 
                items={receiptData.items} 
                tax={receiptData.tax} 
                tip={receiptData.tip}
                currency={receiptData.currency || '$'} 
              />
            </div>

          </div>
        )}
      </main>
    </div>
  );
};

export default App;