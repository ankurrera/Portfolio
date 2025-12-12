import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'motion/react';
import { GripVertical, Trash2, Pencil, MoveUp, MoveDown } from 'lucide-react';
import { ArtworkData } from '@/types/artwork';
import { Button } from '@/components/ui/button';

interface DraggableArtworkProps {
  artwork: ArtworkData;
  isEditMode: boolean;
  snapToGrid: boolean;
  gridSize: number;
  isSelected?: boolean;
  onUpdate: (id: string, updates: Partial<ArtworkData>) => void;
  onDelete: (id: string) => void;
  onBringForward: (id: string) => void;
  onSendBackward: (id: string) => void;
  onEdit?: (id: string) => void;
  onSelect?: (id: string) => void;
}

export default function DraggableArtwork({
  artwork,
  isEditMode,
  snapToGrid,
  gridSize,
  isSelected = false,
  onUpdate,
  onDelete,
  onBringForward,
  onSendBackward,
  onEdit,
  onSelect,
}: DraggableArtworkProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0, artworkX: 0, artworkY: 0 });
  const resizeStartPos = useRef({ x: 0, y: 0, width: 0, height: 0 });

  const snapValue = useCallback((value: number) => {
    if (!snapToGrid) return value;
    return Math.round(value / gridSize) * gridSize;
  }, [snapToGrid, gridSize]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isEditMode || e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    
    // Handle selection on click
    if (onSelect && !isDragging) {
      onSelect(artwork.id);
    }
    
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      artworkX: artwork.position_x,
      artworkY: artwork.position_y,
    };
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    if (!isEditMode) return;
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    resizeStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      width: artwork.width,
      height: artwork.height,
    };
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const dx = e.clientX - dragStartPos.current.x;
      const dy = e.clientY - dragStartPos.current.y;
      
      const newX = snapValue(dragStartPos.current.artworkX + dx);
      const newY = snapValue(dragStartPos.current.artworkY + dy);
      
      onUpdate(artwork.id, {
        position_x: newX,
        position_y: newY,
      });
    } else if (isResizing) {
      const dx = e.clientX - resizeStartPos.current.x;
      const dy = e.clientY - resizeStartPos.current.y;
      
      // Calculate new dimensions maintaining aspect ratio
      const aspectRatio = resizeStartPos.current.height / resizeStartPos.current.width;
      const newWidth = Math.max(100, resizeStartPos.current.width + dx);
      const newHeight = newWidth * aspectRatio;
      
      onUpdate(artwork.id, {
        width: snapValue(newWidth),
        height: snapValue(newHeight),
      });
    }
  }, [isDragging, isResizing, artwork.id, onUpdate, snapValue]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  // Mouse event listeners
  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  const handleRotate = () => {
    const newRotation = (artwork.rotation + 90) % 360;
    onUpdate(artwork.id, { rotation: newRotation });
  };

  return (
    <motion.div
      style={{
        position: 'absolute',
        left: artwork.position_x,
        top: artwork.position_y,
        width: artwork.width,
        height: artwork.height,
        zIndex: artwork.z_index,
        transform: `scale(${artwork.scale}) rotate(${artwork.rotation}deg)`,
        transformOrigin: 'center',
      }}
      className={`
        ${isEditMode ? 'cursor-move' : 'cursor-default'}
        ${isSelected ? 'ring-2 ring-primary' : ''}
        ${isHovered && isEditMode ? 'ring-1 ring-primary/50' : ''}
        transition-shadow
      `}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={false}
      animate={{
        opacity: isDragging || isResizing ? 0.7 : 1,
      }}
    >
      {/* Image */}
      <img
        src={artwork.primary_image_url}
        alt={artwork.title}
        className="w-full h-full object-contain select-none"
        draggable={false}
        style={{ pointerEvents: isEditMode ? 'none' : 'auto' }}
      />

      {/* Edit Mode Controls */}
      {isEditMode && (isHovered || isSelected) && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Toolbar */}
          <div className="absolute -top-10 left-0 right-0 flex items-center justify-center gap-1 pointer-events-auto">
            <div className="bg-background/95 backdrop-blur-sm border rounded-md shadow-lg px-2 py-1 flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation();
                  onBringForward(artwork.id);
                }}
                title="Bring Forward"
              >
                <MoveUp className="h-3.5 w-3.5" />
              </Button>
              
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation();
                  onSendBackward(artwork.id);
                }}
                title="Send Backward"
              >
                <MoveDown className="h-3.5 w-3.5" />
              </Button>

              {onEdit && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(artwork.id);
                  }}
                  title="Edit Metadata"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              )}

              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(artwork.id);
                }}
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>

              <div className="w-px h-4 bg-border mx-1" />

              <div className="flex items-center gap-1 text-xs text-muted-foreground px-1">
                <GripVertical className="h-3.5 w-3.5" />
                <span>Drag</span>
              </div>
            </div>
          </div>

          {/* Resize Handle */}
          <div
            className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize pointer-events-auto"
            onMouseDown={handleResizeStart}
            title="Resize"
          >
            <div className="absolute bottom-1 right-1 w-3 h-3 border-r-2 border-b-2 border-primary rounded-br" />
          </div>

          {/* Dimensions Label */}
          <div className="absolute -bottom-6 left-0 text-xs text-muted-foreground bg-background/95 backdrop-blur-sm px-2 py-0.5 rounded border">
            {Math.round(artwork.width)} × {Math.round(artwork.height)}
          </div>
        </div>
      )}

      {/* Title overlay in preview mode */}
      {!isEditMode && isHovered && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white px-3 py-2">
          <p className="text-sm font-medium truncate">{artwork.title}</p>
          {artwork.creation_date && (
            <p className="text-xs opacity-75">{new Date(artwork.creation_date).getFullYear()}</p>
          )}
        </div>
      )}
    </motion.div>
  );
}
