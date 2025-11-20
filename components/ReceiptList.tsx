import React from 'react';
import { ReceiptItem } from '../types';
import { User, Users, DollarSign } from 'lucide-react';

interface ReceiptListProps {
  items: ReceiptItem[];
  currency: string;
}

const ReceiptList: React.FC<ReceiptListProps> = ({ items, currency }) => {
  return (
    <div className="flex flex-col h-full overflow-hidden bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <h3 className="font-semibold text-slate-800">Receipt Items</h3>
        <span className="text-xs font-medium px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full">
          {items.length} items
        </span>
      </div>
      
      <div className="overflow-y-auto flex-1 p-2 space-y-2">
        {items.map((item) => {
          const isAssigned = item.assignedTo.length > 0;
          return (
            <div 
              key={item.id} 
              className={`p-3 rounded-lg border transition-all duration-200 ${
                isAssigned 
                  ? 'border-green-200 bg-green-50/30' 
                  : 'border-slate-200 bg-white hover:border-indigo-200'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <p className="font-medium text-slate-900 text-sm">{item.name}</p>
                  <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                </div>
                <div className="font-semibold text-slate-800 flex items-center">
                  <span className="text-xs text-slate-400 mr-1">{currency}</span>
                  {item.price.toFixed(2)}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2">
                {item.assignedTo.length === 0 ? (
                  <div className="flex items-center text-xs text-orange-500 bg-orange-50 px-2 py-1 rounded border border-orange-100">
                    <User className="w-3 h-3 mr-1" />
                    Unassigned
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {item.assignedTo.map((person, idx) => (
                      <span key={idx} className="flex items-center text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full border border-green-200">
                        <User className="w-3 h-3 mr-1" />
                        {person}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReceiptList;