import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { REVENUE_DATA } from '../constants';
import { 
  RefreshCw, 
  Plus, 
  MoreHorizontal,
  ChevronDown
} from 'lucide-react';

const PIE_DATA = [
  { name: 'ICP', value: 400, color: '#F472B6' },
  { name: 'VC', value: 300, color: '#3B82F6' },
  { name: 'SP', value: 300, color: '#0EA5E9' },
  { name: 'TtS', value: 200, color: '#C084FC' },
];

const ReportsView: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
      {/* Header */}
      <div className="h-14 border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
         <div className="flex items-center gap-2 text-gray-500 text-sm">
           <span>Reports</span>
           <span className="text-gray-300">/</span>
           <span className="font-semibold text-gray-900">Business Metrics</span>
         </div>
         <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 rounded-md border border-gray-200 transition-colors">
              <RefreshCw size={12} /> Refresh data
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-sm">
              <Plus size={14} /> Add report
            </button>
         </div>
      </div>

      <div className="flex-1 overflow-auto p-8 bg-gray-50/30">
        <div className="max-w-6xl mx-auto space-y-6">
          
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">Business Metrics</h1>
            <p className="text-gray-500 text-sm">Overview of our sales pipeline, revenue growth, customer demographics, and more.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm h-[400px] flex flex-col">
               <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center gap-2">
                   <h3 className="font-medium text-gray-900">Revenue growth by paid plan</h3>
                   <span className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0.5 rounded border border-purple-200">Workspaces</span>
                 </div>
               </div>

               {/* Legend */}
               <div className="flex items-center gap-4 text-xs text-gray-500 mb-4 justify-center">
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-gray-200"></div> Apr - Jun</div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-gray-300"></div> Jul - Sep</div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-yellow-200"></div> Plus</div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-pink-300"></div> Pro</div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-purple-400"></div> Enterprise</div>
               </div>

               <div className="flex-1 w-full text-xs">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={REVENUE_DATA} barGap={4} barSize={12}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 10}} dy={10} />
                     <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 10}} tickFormatter={(value) => `$ ${value / 1000}M`} />
                     <Tooltip 
                       contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                       cursor={{ fill: '#f9fafb' }}
                     />
                     <Bar dataKey="uv" stackId="a" fill="#FEF08A" radius={[0,0,2,2]} />
                     <Bar dataKey="pv" stackId="a" fill="#F472B6" />
                     <Bar dataKey="amt" stackId="a" fill="#C084FC" radius={[2,2,0,0]} />
                   </BarChart>
                 </ResponsiveContainer>
               </div>
            </div>

            {/* Closed Won Chart */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm h-[400px] flex flex-col">
               <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center gap-2">
                   <h3 className="font-medium text-gray-900">Closed-won deals by MQL type</h3>
                   <span className="bg-orange-100 text-orange-700 text-[10px] px-1.5 py-0.5 rounded border border-orange-200">Deals</span>
                 </div>
               </div>

                {/* Legend */}
               <div className="flex items-center gap-4 text-xs text-gray-500 mb-4 justify-center">
                  {PIE_DATA.map((entry, index) => (
                    <div key={index} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{backgroundColor: entry.color}}></div>
                      {entry.name}
                    </div>
                  ))}
                  <div className="flex items-center gap-1.5 text-blue-500 font-medium">
                     <div className="grid grid-cols-2 gap-0.5 w-3 h-3">
                       <div className="bg-blue-500 rounded-full"></div>
                       <div className="bg-blue-300 rounded-full"></div>
                       <div className="bg-blue-200 rounded-full"></div>
                       <div className="bg-blue-100 rounded-full"></div>
                     </div>
                     +3 more
                  </div>
               </div>

               <div className="flex-1 w-full relative">
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie
                       data={PIE_DATA}
                       innerRadius={80}
                       outerRadius={110}
                       paddingAngle={2}
                       dataKey="value"
                       stroke="none"
                     >
                       {PIE_DATA.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={entry.color} />
                       ))}
                     </Pie>
                     <Tooltip />
                   </PieChart>
                 </ResponsiveContainer>
                 {/* Center Content simulating the hover state in screenshot */}
                 {/* This would ideally be dynamic based on hover, but static for now for the "look" */}
                 <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsView;