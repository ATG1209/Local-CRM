import React from 'react';
import { Share2, MessageSquare, MoreVertical, Info } from 'lucide-react';
import { ViewState } from '../types';

interface TopBarProps {
  activeView: ViewState;
}

const TopBar: React.FC<TopBarProps> = ({ activeView }) => {
  const getBreadcrumb = () => {
    // Capitalize first letter
    return activeView.charAt(0).toUpperCase() + activeView.slice(1);
  };

  if (activeView === 'workflows') return null; // Workflows has its own header structure in the mockup

  return (
    <div className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-6">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold text-gray-900">{getBreadcrumb()}</h1>
        {(activeView === 'companies' || activeView === 'deals') && <Info size={16} className="text-gray-400" />}
      </div>
      <div className="flex items-center gap-4">
        <div className="flex -space-x-2">
            <img className="w-8 h-8 rounded-full border-2 border-white" src="https://picsum.photos/32/32?random=50" alt="User 1" />
            <div className="w-8 h-8 rounded-full border-2 border-white bg-yellow-400 flex items-center justify-center text-xs font-bold text-yellow-900">A</div>
            <img className="w-8 h-8 rounded-full border-2 border-white" src="https://picsum.photos/32/32?random=51" alt="User 3" />
            <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">+1</div>
        </div>
        <div className="h-4 w-px bg-gray-200"></div>
        <MessageSquare size={18} className="text-gray-400 hover:text-gray-600 cursor-pointer" />
      </div>
    </div>
  );
};

export default TopBar;