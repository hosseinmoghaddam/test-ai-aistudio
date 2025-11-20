import React, { useMemo } from 'react';
import { ReceiptItem, PersonSummary } from '../types';
import { PieChart, DollarSign, Receipt } from 'lucide-react';

interface SummaryPanelProps {
  items: ReceiptItem[];
  tax: number;
  tip: number;
  currency: string;
}

const SummaryPanel: React.FC<SummaryPanelProps> = ({ items, tax, tip, currency }) => {
  const summary = useMemo(() => {
    const peopleMap = new Map<string, PersonSummary>();

    // 1. Calculate subtotal for each person based on assigned items
    let assignedSubtotal = 0;

    items.forEach(item => {
      if (item.assignedTo.length > 0) {
        const splitCost = item.price / item.assignedTo.length;
        assignedSubtotal += item.price;
        
        item.assignedTo.forEach(person => {
          if (!peopleMap.has(person)) {
            peopleMap.set(person, {
              name: person,
              subtotal: 0,
              taxShare: 0,
              tipShare: 0,
              total: 0,
              items: []
            });
          }
          const p = peopleMap.get(person)!;
          p.subtotal += splitCost;
          p.items.push(item.name);
        });
      }
    });

    // 2. Handle Unassigned items? 
    // For simplicity in this MVP, unassigned items are not distributed yet.
    // Ideally, they should be highlighted or split among everyone.
    // We will calculate ratios based on valid subtotals.

    const totalSubtotal = Array.from(peopleMap.values()).reduce((acc, curr) => acc + curr.subtotal, 0);

    // 3. Distribute Tax and Tip proportionally
    if (totalSubtotal > 0) {
      peopleMap.forEach(person => {
        const ratio = person.subtotal / totalSubtotal;
        person.taxShare = tax * ratio;
        person.tipShare = tip * ratio;
        person.total = person.subtotal + person.taxShare + person.tipShare;
      });
    }

    return Array.from(peopleMap.values());
  }, [items, tax, tip]);

  const totalBill = useMemo(() => {
    const itemsTotal = items.reduce((acc, item) => acc + item.price, 0);
    return itemsTotal + tax + tip;
  }, [items, tax, tip]);

  const assignedTotal = summary.reduce((acc, curr) => acc + curr.total, 0);
  const unassignedTotal = totalBill - assignedTotal; // Approximation due to rounding/unassigned items

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
        <PieChart className="w-5 h-5 text-indigo-600" />
        <h3 className="font-semibold text-slate-800">Live Summary</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {summary.length === 0 ? (
          <div className="text-center text-slate-400 py-8">
            <p className="text-sm">Assign items to see the breakdown.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {summary.map(person => (
              <div key={person.name} className="flex flex-col p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-slate-800">{person.name}</span>
                  <span className="font-bold text-indigo-600">{currency}{person.total.toFixed(2)}</span>
                </div>
                <div className="text-xs text-slate-500 space-y-1">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{currency}{person.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax & Tip</span>
                    <span>{currency}{(person.taxShare + person.tipShare).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grand Total Footer */}
      <div className="p-4 bg-slate-900 text-white mt-auto">
        <div className="flex justify-between items-center mb-1 text-slate-400 text-xs uppercase tracking-wider font-semibold">
          <span>Total Bill</span>
          {unassignedTotal > 0.01 && <span className="text-orange-400">Unassigned: {currency}{unassignedTotal.toFixed(2)}</span>}
        </div>
        <div className="flex justify-between items-end">
          <div className="flex items-center gap-1 text-slate-300 text-sm">
            <Receipt className="w-4 h-4" />
            <span>Includes Tax & Tip</span>
          </div>
          <span className="text-2xl font-bold">{currency}{totalBill.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default SummaryPanel;