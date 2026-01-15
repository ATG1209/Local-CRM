
import React, { useState, useEffect } from 'react';
import { Deal, PipelineStage } from '../types';
import { api } from '../utils/api';
import CompanyAvatar from './CompanyAvatar';
import {
  Settings,
  Download,
  Plus,
  MoreHorizontal,
  MessageSquare,
  FileText,
  Clock,
  ChevronDown
} from 'lucide-react';

const STAGES: PipelineStage[] = [
  { id: 'Lead', name: 'Lead', count: 212, color: 'bg-cyan-500' },
  { id: 'Contacted', name: 'Contacted', count: 347, color: 'bg-blue-600' },
  { id: 'Qualification', name: 'Qualification', count: 62, color: 'bg-fuchsia-500' },
  { id: 'Evaluation', name: 'Evaluation', count: 44, color: 'bg-violet-600' },
];

const DealsView: React.FC = () => {
  const [deals, setDeals] = useState<Deal[]>([]);

  useEffect(() => {
    api.get('/deals')
      .then(data => {
        if (Array.isArray(data)) {
          setDeals(data);
        } else {
          console.warn("DealsView: API returned non-array data", data);
          setDeals([]);
        }
      })
      .catch(err => console.error("DealsView: Failed to fetch deals", err));
  }, []);

  const getDealsForStage = (stageId: string) => deals.filter(d => d.stage === stageId);

  const handleAddDeal = (stageId: 'Lead' | 'Contacted' | 'Qualification' | 'Evaluation') => {
    const newDeal: Deal = {
      id: Math.random().toString(36).substr(2, 9),
      companyName: 'New Deal Company',
      companyLogo: `https://picsum.photos/24/24?random=${Math.floor(Math.random() * 1000)}`,
      ownerName: 'You',
      ownerAvatar: `https://picsum.photos/32/32?random=${Math.floor(Math.random() * 1000)}`,
      value: Math.floor(Math.random() * 50000) + 1000,
      stage: stageId,
      tags: ['New'],
      lastActivity: 'Just now',
      comments: 0,
      tasks: 0
    };
    setDeals([...deals, newDeal]);
    api.post('/deals', newDeal).catch(err => {
      console.error(err);
      // Revert optimism if necessary
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
      {/* Header */}
      <div className="h-14 border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-orange-100 text-orange-600 p-1 rounded-md">
            <span className="font-bold text-xs">P</span>
          </div>
          <span className="font-semibold text-gray-900">Pipeline</span>
          <ChevronDown size={14} className="text-gray-400 cursor-pointer" />
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 rounded-md border border-gray-200 transition-colors">
            <Settings size={14} /> View settings
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 rounded-md border border-gray-200 transition-colors">
            <Download size={14} /> Import / Export <ChevronDown size={12} />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="h-12 border-b border-gray-200 flex items-center px-6 gap-2 bg-white flex-shrink-0">
        <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 border border-gray-200 rounded-md text-xs text-gray-600">
          <span className="text-gray-400"><MoreHorizontal size={12} /></span>
          <span>Sorted by <strong>Deal value</strong></span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 border border-gray-200 rounded-md text-xs text-gray-600">
          <span>Advanced filter</span>
          <span className="bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded text-[10px]">3</span>
          <MoreHorizontal size={12} className="text-gray-400 rotate-90" />
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 border border-gray-200 rounded-md text-xs text-gray-600">
          <span>Deal stage</span>
          <span className="text-gray-400">is not</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Closed - Lost</span>
          <MoreHorizontal size={12} className="text-gray-400 rotate-90" />
        </div>
        <div className="w-8 h-8 flex items-center justify-center rounded-md border border-dashed border-gray-300 hover:border-gray-400 cursor-pointer hover:bg-gray-50 text-gray-400"
          onClick={() => handleAddDeal('Lead')}
          title="Add random deal"
        >
          <Plus size={16} />
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden bg-gray-50/50">
        <div className="h-full flex px-4 pb-4 pt-2 gap-4 min-w-max">
          {STAGES.map(stage => (
            <div key={stage.id} className="w-[300px] flex flex-col h-full">
              {/* Column Header */}
              <div className="flex items-center justify-between py-3 mb-1 px-1">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${stage.color}`}></div>
                  <span className="font-semibold text-sm text-gray-800">{stage.name}</span>
                  <span className="bg-gray-200 text-gray-600 px-1.5 rounded-full text-[10px] font-medium">{getDealsForStage(stage.id).length}</span>
                </div>
                <div onClick={() => handleAddDeal(stage.id as any)} className="cursor-pointer text-gray-400 hover:text-gray-600 transition-colors">
                  <Plus size={16} />
                </div>
              </div>

              {/* Cards Container */}
              <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                {getDealsForStage(stage.id).map(deal => (
                  <div key={deal.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow group cursor-pointer relative">
                    {/* Card Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <CompanyAvatar name={deal.companyName} size="xs" />
                        <span className="font-medium text-sm text-gray-900 line-clamp-1">{deal.companyName}</span>
                      </div>
                    </div>

                    {/* Owner */}
                    <div className="flex items-center gap-2 mb-3">
                      <img src={deal.ownerAvatar} alt="" className="w-4 h-4 rounded-full bg-gray-100" />
                      <span className="text-xs text-gray-500">{deal.ownerName}</span>
                    </div>

                    {/* Value */}
                    <div className="font-semibold text-gray-900 mb-2">
                      ${deal.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <span className="text-xs text-gray-500 font-mono"># {Math.floor(Math.random() * 90) + 10}</span>
                      {deal.tags.map((tag, i) => (
                        <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded border ${tag === 'Enterprise' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                          tag === 'Pro' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                            'bg-blue-50 text-blue-700 border-blue-100'
                          }`}>
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Footer Info */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-2">
                      <div className="flex items-center gap-3">
                        {deal.comments > 0 && (
                          <div className="flex items-center gap-1 text-gray-400 text-xs">
                            <MessageSquare size={12} /> {deal.comments}
                          </div>
                        )}
                        {deal.tasks > 0 && (
                          <div className="flex items-center gap-1 text-gray-400 text-xs">
                            <FileText size={12} /> {deal.tasks}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-gray-400 text-[10px]">
                        <Clock size={10} />
                        {deal.lastActivity.includes('202') ? Math.floor(Math.random() * 30) + 'd' : 'Today'}
                      </div>
                    </div>

                  </div>
                ))}
              </div>

              {/* Column Footer Summary */}
              <div className="pt-2 text-[10px] text-gray-400 text-right uppercase tracking-wider font-medium">
                USD ${(getDealsForStage(stage.id).reduce((acc, curr) => acc + curr.value, 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })} sum
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DealsView;
