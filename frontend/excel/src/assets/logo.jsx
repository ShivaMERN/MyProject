import React from 'react';

export const LogoGrid = () => {
  const squares = Array(9).fill(null);
  
  return (
    <div className="grid grid-cols-3 gap-2 w-24 h-24">
      {squares.map((_, i) => (
        <div 
          key={i} 
          className={`rounded-lg ${i % 2 === 0 ? 'bg-green-400' : 'bg-green-500'}`}
        ></div>
      ))}
    </div>
  );
};