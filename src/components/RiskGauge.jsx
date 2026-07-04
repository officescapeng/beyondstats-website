import React from 'react';
import { getRiskCategory } from '../data/humanSecurityData';

export default function RiskGauge({ score }) {
  const cat = getRiskCategory(score);
  return (
    <div className="flex flex-col w-full gap-2">
      <div className="flex justify-between items-center text-sm font-semibold">
        <span className="font-poppins uppercase tracking-wider text-xs opacity-80">Security Index score:</span>
        <span className={`px-2 py-0.5 rounded font-poppins text-xs font-bold ${cat.class}`}>
          {score}/100 — {cat.label}
        </span>
      </div>
      <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex">
        <div 
          style={{ width: `${score}%`, backgroundColor: cat.color }} 
          className="h-full rounded-full transition-all duration-500"
        />
      </div>
      <div className="flex justify-between text-[9px] font-mono opacity-50 uppercase tracking-widest mt-1">
        <span>0 (Secure)</span>
        <span>35</span>
        <span>55</span>
        <span>75</span>
        <span>100 (Critical)</span>
      </div>
    </div>
  );
}