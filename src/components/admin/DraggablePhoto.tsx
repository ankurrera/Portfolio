import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { GripVertical, Maximize2, ZoomIn, MoveUp, MoveDown, Trash2, Pencil } from 'lucide-react';
import { PhotoLayoutData } from '@/types/wysiwyg';
import { Button } from '@/components/ui/button';

interface DraggablePhotoProps {
  photo: PhotoLayoutData;
  isEditMode: boolean;
  snapToGrid: boolean;
  gridSize: number;
  isSelected?: boolean;
  onUpdate: (id: string, updates: Partial<PhotoLayoutData>) => void;
  onDelete: (id: string) => void;
  onBringForward: (id: string) => void;
  onSendBackward: (id: string) => void;
  onEdit?: (id: string) => void;
  onSelect?: (id: string) => void;
}

export default function DraggablePhoto({
  photo,
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
}: DraggablePhotoProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isScaling, setIsScaling] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0, photoX: 0, photoY: 0 });
  const resizeStartPos = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const scaleStartPos = useRef({ x: 0, y: 0, scale: 1 });
  const touchStartDistance = useRef(0);
  const scaleHoldTimer = useRef<NodeJS.Timeout | null>(null);

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
      onSelect(photo.id);
    }
    
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      photoX: photo.position_x,
      photoY: photo.position_y,
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
      width: photo.width,
      height: photo.height,
    };
  };

  // Hold-and-pull scaling for mouse
  const handleScaleStart = (e: React.MouseEvent) => {
    if (!isEditMode) return;
    e.preventDefault();
    e.stopPropagation();
    
    // Hold for 500ms to start scaling
    scaleHoldTimer.current = setTimeout(() => {
      setIsScaling(true);
      scaleStartPos.current = {
        x: e.clientX,
        y: e.clientY,
        scale: photo.scale,
      };
    }, 500);
  };

  const handleScaleEnd = () => {
    if (scaleHoldTimer.current) {
      clearTimeout(scaleHoldTimer.current);
      scaleHoldTimer.current = null;
    }
    setIsScaling(false);
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
        scale: photo.scale,
      };
    } else if (e.touches.length === 1) {
      // Single touch for dragging
      const touch = e.touches[0];
      setIsDragging(true);
      dragStartPos.current = {
        x: touch.clientX,
        y: touch.clientY,
        photoX: photo.position_x,
        photoY: photo.position_y,
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
      
      onUpdate(photo.id, {
        scale: newScale,
      });
    } else if (e.touches.length === 1 && isDragging) {
      // Single touch dragging
      const touch = e.touches[0];
      const deltaX = touch.clientX - dragStartPos.current.x;
      const deltaY = touch.clientY - dragStartPos.current.y;
      
      const newX = snapValue(dragStartPos.current.photoX + deltaX);
      const newY = snapValue(dragStartPos.current.photoY + deltaY);
      
      onUpdate(photo.id, {
        position_x: newX,
        position_y: newY,
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchStartDistance.current = 0;
  };

  useEffect(() => {
    if (!isDragging && !isResizing && !isScaling) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - dragStartPos.current.x;
        const deltaY = e.clientY - dragStartPos.current.y;
        
        const newX = snapValue(dragStartPos.current.photoX + deltaX);
        const newY = snapValue(dragStartPos.current.photoY + deltaY);
        
        onUpdate(photo.id, {
          position_x: newX,
          position_y: newY,
        });
      }

      if (isResizing) {
        const deltaX = e.clientX - resizeStartPos.current.x;
        const deltaY = e.clientY - resizeStartPos.current.y;
        
        const aspectRatio = resizeStartPos.current.width / resizeStartPos.current.height;
        const newWidth = Math.max(100, resizeStartPos.current.width + deltaX);
        const newHeight = newWidth / aspectRatio;
        
        onUpdate(photo.id, {
          width: newWidth,
          height: newHeight,
        });
      }

      if (isScaling) {
        const deltaX = e.clientX - scaleStartPos.current.x;
        const scaleFactor = 1 + (deltaX / 200); // 200px movement = 1x scale change
        const newScale = Math.max(0.5, Math.min(3, scaleStartPos.current.scale * scaleFactor));
        
        onUpdate(photo.id, {
          scale: newScale,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      handleScaleEnd();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, isScaling, photo.id, snapValue, onUpdate]);

  return (
    <motion.div
      className="absolute select-none"
      style={{
        left: photo.position_x,
        top: photo.position_y,
        width: photo.width,
        height: photo.height,
        transform: `scale(${photo.scale}) rotate(${photo.rotation}deg)`,
        transformOrigin: 'center center',
        zIndex: isDragging || isResizing || isScaling ? 9999 : photo.z_index,
        cursor: isEditMode ? (isDragging ? 'grabbing' : 'grab') : 'default',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      animate={{
        scale: isDragging || isResizing || isScaling ? 1.02 : 1,
      }}
      transition={{ duration: 0.1 }}
    >
      {/* Photo Image */}
      <img
        src={photo.image_url}
        alt={photo.title || 'Photo'}
        className="w-full h-full object-contain rounded-sm shadow-lg"
        draggable={false}
        onMouseDown={handleMouseDown}
      />

      {/* Edit Mode Overlay */}
      {isEditMode && (isHovered || isSelected) && (
        <div className={`absolute inset-0 border-2 ${isSelected ? 'border-primary' : 'border-primary/50'} rounded-sm pointer-events-none`}>
          {/* Position Indicator */}
          <div className="absolute -top-8 left-0 bg-primary text-primary-foreground px-2 py-1 text-xs rounded-sm">
            {Math.round(photo.position_x)}, {Math.round(photo.position_y)}
          </div>
          
          {/* Size Indicator */}
          <div className="absolute -bottom-8 left-0 bg-primary text-primary-foreground px-2 py-1 text-xs rounded-sm">
            {Math.round(photo.width)} × {Math.round(photo.height)} | {photo.scale.toFixed(2)}x
          </div>
        </div>
      )}

      {/* Controls */}
      {isEditMode && isHovered && (
        <div className="absolute -top-10 -right-2 flex gap-1 pointer-events-auto">
          {onEdit && (
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8 shadow-md"
              onClick={() => onEdit(photo.id)}
              title="Edit metadata"
            >
              <Pencil className="h-3 w-3" />
            </Button>
          )}
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8 shadow-md"
            onClick={() => onBringForward(photo.id)}
            title="Bring forward"
          >
            <MoveUp className="h-3 w-3" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8 shadow-md"
            onClick={() => onSendBackward(photo.id)}
            title="Send backward"
          >
            <MoveDown className="h-3 w-3" />
          </Button>
          <Button
            size="icon"
            variant="destructive"
            className="h-8 w-8 shadow-md"
            onClick={() => onDelete(photo.id)}
            title="Delete photo"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Resize Handle */}
      {isEditMode && isHovered && (
        <div
          className="absolute -bottom-2 -right-2 w-6 h-6 bg-primary rounded-full cursor-nwse-resize shadow-md flex items-center justify-center pointer-events-auto"
          onMouseDown={handleResizeStart}
          title="Resize (maintains aspect ratio)"
        >
          <Maximize2 className="h-3 w-3 text-primary-foreground" />
        </div>
      )}

      {/* Scale Handle (Hold to scale) */}
      {isEditMode && isHovered && (
        <div
          className="absolute -top-2 -right-2 w-6 h-6 bg-secondary rounded-full cursor-pointer shadow-md flex items-center justify-center pointer-events-auto"
          onMouseDown={handleScaleStart}
          onMouseUp={handleScaleEnd}
          onMouseLeave={handleScaleEnd}
          title="Hold and drag to scale"
        >
          <ZoomIn className="h-3 w-3 text-secondary-foreground" />
        </div>
      )}

      {/* Drag Handle */}
      {isEditMode && isHovered && (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-primary/80 rounded-full cursor-grab shadow-md flex items-center justify-center pointer-events-auto"
          onMouseDown={handleMouseDown}
          title="Drag to move"
        >
          <GripVertical className="h-4 w-4 text-primary-foreground" />
        </div>
      )}

      {/* Scaling indicator */}
      {isScaling && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 text-xs rounded-sm whitespace-nowrap">
          Scaling: {photo.scale.toFixed(2)}x
        </div>
      )}
    </motion.div>
  );
}
