import React from 'react';
import { Construction } from 'lucide-react';

interface PlaceholderViewProps {
  title: string;
}

const PlaceholderView: React.FC<PlaceholderViewProps> = ({ title }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-white h-full text-gray-500 gap-4 p-8">
      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
        <Construction size={40} className="text-gray-400" />
      </div>
      <div className="text-center max-w-md">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
        <p className="text-sm text-gray-500">
          This module is part of the Basepoint CRM suite but is currently under development in this demo version.
        </p>
      </div>
      <button className="mt-4 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors">
        Return to Companies
      </button>
    </div>
  );
};

export default PlaceholderView;