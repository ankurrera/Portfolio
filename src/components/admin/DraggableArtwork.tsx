import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'motion/react';
import { GripVertical, Trash2, Pencil, MoveUp, MoveDown, ZoomIn } from 'lucide-react';
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

// Scaling constants
const SCALE_HOLD_DELAY = 500; // ms to hold before scaling activates
const SCALE_DRAG_SENSITIVITY = 200; // px movement for 1x scale change
const WHEEL_SCALE_SENSITIVITY = 1000; // wheel delta divisor

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
  const [isScaling, setIsScaling] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0, artworkX: 0, artworkY: 0 });
  const resizeStartPos = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const scaleStartPos = useRef({ x: 0, y: 0, scale: 1 });
  const scaleHoldTimer = useRef<NodeJS.Timeout | null>(null);
  const touchStartDistance = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Hold-and-pull scaling for mouse
  const handleScaleStart = (e: React.MouseEvent) => {
    if (!isEditMode) return;
    e.preventDefault();
    e.stopPropagation();
    
    scaleHoldTimer.current = setTimeout(() => {
      setIsScaling(true);
      scaleStartPos.current = {
        x: e.clientX,
        y: e.clientY,
        scale: artwork.scale,
      };
    }, SCALE_HOLD_DELAY);
  };

  const handleScaleEnd = () => {
    if (scaleHoldTimer.current) {
      clearTimeout(scaleHoldTimer.current);
      scaleHoldTimer.current = null;
    }
    setIsScaling(false);
  };

  // Mouse wheel scaling
  const handleWheel = (e: React.WheelEvent) => {
    if (!isEditMode || !isHovered) return;
    e.preventDefault();
    e.stopPropagation();
    
    const delta = -e.deltaY / WHEEL_SCALE_SENSITIVITY;
    const newScale = Math.max(0.5, Math.min(3, artwork.scale + delta));
    
    onUpdate(artwork.id, {
      scale: newScale,
    });
  };

  // Touch handlers for pinch-to-zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isEditMode) return;
    
    if (e.touches.length === 2) {
      // Pinch gesture
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      touchStartDistance.current = distance;
      scaleStartPos.current = {
        x: 0,
        y: 0,
        scale: artwork.scale,
      };
    } else if (e.touches.length === 1) {
      // Single touch for dragging
      const touch = e.touches[0];
      if (onSelect && !isDragging) {
        onSelect(artwork.id);
      }
      setIsDragging(true);
      dragStartPos.current = {
        x: touch.clientX,
        y: touch.clientY,
        artworkX: artwork.position_x,
        artworkY: artwork.position_y,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isEditMode) return;
    
    if (e.touches.length === 2) {
      // Pinch scaling
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      
      const scaleFactor = distance / touchStartDistance.current;
      const newScale = Math.max(0.5, Math.min(3, scaleStartPos.current.scale * scaleFactor));
      
      onUpdate(artwork.id, {
        scale: newScale,
      });
    } else if (e.touches.length === 1 && isDragging) {
      // Single touch dragging
      const touch = e.touches[0];
      const dx = touch.clientX - dragStartPos.current.x;
      const dy = touch.clientY - dragStartPos.current.y;
      
      const newX = snapValue(dragStartPos.current.artworkX + dx);
      const newY = snapValue(dragStartPos.current.artworkY + dy);
      
      onUpdate(artwork.id, {
        position_x: newX,
        position_y: newY,
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchStartDistance.current = 0;
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
    } else if (isScaling) {
      const dx = e.clientX - scaleStartPos.current.x;
      const scaleFactor = 1 + (dx / SCALE_DRAG_SENSITIVITY);
      const newScale = Math.max(0.5, Math.min(3, scaleStartPos.current.scale * scaleFactor));
      
      onUpdate(artwork.id, {
        scale: newScale,
      });
    }
  }, [isDragging, isResizing, isScaling, artwork.id, onUpdate, snapValue]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    handleScaleEnd();
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (scaleHoldTimer.current) {
        clearTimeout(scaleHoldTimer.current);
        scaleHoldTimer.current = null;
      }
    };
  }, []);

  // Mouse event listeners
  useEffect(() => {
    if (isDragging || isResizing || isScaling) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, isScaling, handleMouseMove, handleMouseUp]);

  const handleRotate = () => {
    const newRotation = (artwork.rotation + 90) % 360;
    onUpdate(artwork.id, { rotation: newRotation });
  };

  return (
    <motion.div
      ref={containerRef}
      style={{
        position: 'absolute',
        left: artwork.position_x,
        top: artwork.position_y,
        width: artwork.width,
        height: artwork.height,
        zIndex: isDragging || isResizing || isScaling ? 9999 : artwork.z_index,
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
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      initial={false}
      animate={{
        opacity: isDragging || isResizing || isScaling ? 0.7 : 1,
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

          {/* Scale Handle (Hold to scale) */}
          <div
            className="absolute top-0 right-0 w-6 h-6 bg-secondary rounded-full cursor-pointer shadow-md flex items-center justify-center pointer-events-auto"
            onMouseDown={handleScaleStart}
            onMouseUp={handleScaleEnd}
            onMouseLeave={handleScaleEnd}
            title="Hold and drag to scale (or use mouse wheel)"
          >
            <ZoomIn className="h-3 w-3 text-secondary-foreground" />
          </div>

          {/* Dimensions Label */}
          <div className="absolute -bottom-6 left-0 text-xs text-muted-foreground bg-background/95 backdrop-blur-sm px-2 py-0.5 rounded border">
            {Math.round(artwork.width)} × {Math.round(artwork.height)} | {artwork.scale.toFixed(2)}x
          </div>
        </div>
      )}

      {/* Scaling indicator */}
      {isScaling && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 text-xs rounded-sm whitespace-nowrap">
          Scaling: {artwork.scale.toFixed(2)}x
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
