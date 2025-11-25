
import React, { useState, useEffect } from 'react';

interface ZoomableImageProps {
  src: string;
  alt: string;
  onClose: () => void;
  zoomHint: string;
}

export const ZoomableImage: React.FC<ZoomableImageProps> = ({ src, alt, onClose, zoomHint }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    const newScale = Math.max(1, Math.min(5, scale + delta));
    setScale(newScale);
    if (newScale === 1) setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      e.preventDefault();
      setIsDragging(true);
      setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      e.preventDefault();
      setPosition({
        x: e.clientX - startPos.x,
        y: e.clientY - startPos.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center animate-fade-in overflow-hidden select-none"
      onWheel={handleWheel}
    >
      {/* Toolbar */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <button 
            onClick={() => { setScale(s => Math.min(s + 0.5, 5)) }}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition-colors"
        >
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
             <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
           </svg>
        </button>
        <button 
            onClick={() => { setScale(s => { const ns = Math.max(s - 0.5, 1); if(ns===1) setPosition({x:0,y:0}); return ns; }) }}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition-colors"
        >
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
             <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
           </svg>
        </button>
        <button 
            onClick={onClose}
            className="p-2 bg-white/10 hover:bg-red-500/50 text-white rounded-full backdrop-blur-sm transition-colors ml-2"
        >
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
             <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
           </svg>
        </button>
      </div>

      <div 
        className="relative w-full h-full flex items-center justify-center"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img 
          src={src} 
          alt={alt}
          draggable={false}
          style={{ 
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
          }}
          className="max-w-full max-h-full object-contain transition-transform duration-100 ease-out"
        />
      </div>
      
      {/* Hint */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 backdrop-blur-sm text-white text-sm rounded-full pointer-events-none">
         {zoomHint}
      </div>
    </div>
  );
};
