import React, { useState } from 'react';
import { GripVertical, ArrowUp, ArrowDown } from 'lucide-react';

interface DragDropReorderProps {
  items: string[];
  onReorder: (newOrder: string[]) => void;
  title: string;
  type: 'questions' | 'banners';
}

export function DragDropReorder({ items, onReorder, title, type }: DragDropReorderProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const newItems = [...items];
    const draggedItem = newItems[draggedIndex];
    
    // Remove the dragged item
    newItems.splice(draggedIndex, 1);
    
    // Insert at new position
    newItems.splice(dropIndex, 0, draggedItem);
    
    onReorder(newItems);
    setDraggedIndex(null);
  };

  const moveItem = (fromIndex: number, direction: 'up' | 'down') => {
    const newItems = [...items];
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    
    if (toIndex < 0 || toIndex >= items.length) return;
    
    // Swap items
    [newItems[fromIndex], newItems[toIndex]] = [newItems[toIndex], newItems[fromIndex]];
    onReorder(newItems);
  };

  if (items.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h4 className="font-semibold text-gray-800 mb-3">{title}</h4>
      <p className="text-sm text-gray-600 mb-4">
        Drag items to reorder, or use the arrow buttons. This will affect the order in your exported report.
      </p>
      
      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={item}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            className={`flex items-center gap-3 p-3 border rounded-lg cursor-move transition-all ${
              draggedIndex === index 
                ? 'bg-blue-50 border-blue-300 shadow-md' 
                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <GripVertical size={16} className="text-gray-400 flex-shrink-0" />
            
            <div className="flex-1 min-w-0">
              <span className="text-sm text-gray-800 break-words">{item}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={() => moveItem(index, 'up')}
                disabled={index === 0}
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Move up"
              >
                <ArrowUp size={14} />
              </button>
              <button
                onClick={() => moveItem(index, 'down')}
                disabled={index === items.length - 1}
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Move down"
              >
                <ArrowDown size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}