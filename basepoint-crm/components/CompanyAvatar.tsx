
import React from 'react';

interface CompanyAvatarProps {
  name: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

const CompanyAvatar: React.FC<CompanyAvatarProps> = ({ name, className = "", size = 'sm' }) => {
  const initials = name ? name.substring(0, 2).toUpperCase() : '??';
  
  const sizeClasses = {
    xs: 'w-4 h-4 text-[8px]',
    sm: 'w-5 h-5 text-[9px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-12 h-12 text-sm'
  };

  return (
    <div className={`rounded bg-gray-100 flex items-center justify-center font-bold text-gray-500 border border-gray-200 select-none ${sizeClasses[size]} ${className}`}>
      {initials}
    </div>
  );
};

export default CompanyAvatar;
