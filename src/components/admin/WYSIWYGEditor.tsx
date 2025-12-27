import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { PhotoLayoutData, EditorMode, DevicePreview, HistoryEntry, PhotoCategory } from '@/types/wysiwyg';
import { formatSupabaseError } from '@/lib/utils';
import PortfolioHeader from '@/components/PortfolioHeader';
import PhotographerBio from '@/components/PhotographerBio';
import PortfolioFooter from '@/components/PortfolioFooter';
import DraggablePhoto from './DraggablePhoto';
import EditorToolbar from './EditorToolbar';
import PhotoUploader from './PhotoUploader';
import PhotoEditPanel from './PhotoEditPanel';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface WYSIWYGEditorProps {
  onSignOut: () => void;
}

// Desktop canvas baseline width for device preview scaling
const DESKTOP_CANVAS_WIDTH = 1600;

export default function WYSIWYGEditor({ onSignOut }: WYSIWYGEditorProps) {
  const [photos, setPhotos] = useState<PhotoLayoutData[]>([]);
  const [mode, setMode] = useState<EditorMode>('edit');
  const [devicePreview, setDevicePreview] = useState<DevicePreview>('desktop');
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  
  // History management
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [historyInitialized, setHistoryInitialized] = useState(false);
  
  // Autosave
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchPhotos = useCallback(async (isRefresh = false) => {
    // Cancel any in-flight requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Clear any pending refresh timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    
    // Set timeout fallback - if fetch doesn't complete in 10 seconds, show error
    refreshTimeoutRef.current = setTimeout(() => {
      if (isRefresh) {
        setIsRefreshing(false);
        toast.error('Request timed out. Please check your connection and try again.');
      } else {
        setLoading(false);
        toast.error('Failed to load photos: Request timed out. Please check your connection.');
      }
    }, 10000);
    
    try {
      // Fetch all photos, not filtered by category
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .order('z_index', { ascending: true })
        .abortSignal(abortControllerRef.current.signal);

      if (error) throw error;
      
      const photosData = (data || []) as PhotoLayoutData[];
      setPhotos(photosData);
      
      // Initialize history only once
      if (photosData.length > 0 && !historyInitialized) {
        const initialEntry: HistoryEntry = {
          photos: JSON.parse(JSON.stringify(photosData)),
          timestamp: Date.now(),
          description: 'Initial state',
        };
        setHistory([initialEntry]);
        setHistoryIndex(0);
        setHistoryInitialized(true);
      }
      
      if (isRefresh) {
        toast.success('Photos refreshed successfully');
      }
    } catch (error: unknown) {
      // Don't show error if request was aborted (user triggered another action)
      const isAbortError = error && typeof error === 'object' && 'name' in error && error.name === 'AbortError';
      const isSignalAborted = abortControllerRef.current?.signal.aborted;
      
      if (isAbortError || isSignalAborted) {
        return;
      }
      
      const errorMessage = formatSupabaseError(error);
      console.error('Error fetching photos:', errorMessage);
      toast.error(`Failed to load photos: ${errorMessage}`);
    } finally {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
      
      setLoading(false);
      setIsRefreshing(false);
      abortControllerRef.current = null;
    }
  }, [historyInitialized]);

  useEffect(() => {
    fetchPhotos();
    
    // Cleanup function to abort in-flight requests when component unmounts
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [fetchPhotos]);

  // Handle device preview changes to ensure layout recalculation
  useEffect(() => {
    // Force a re-render of draggable components when device preview changes
    // This ensures motion library recalculates positions and placeholders
    let frame: number | null = null;
    
    if (devicePreview !== 'desktop') {
      // Use requestAnimationFrame for better performance
      frame = requestAnimationFrame(() => {
        // Trigger layout recalculation by dispatching resize event
        window.dispatchEvent(new Event('resize'));
      });
    }
    
    return () => {
      if (frame !== null) {
        cancelAnimationFrame(frame);
      }
    };
  }, [devicePreview]);

  // Add to history - must be declared before handlers that use it
  const addToHistory = useCallback((newPhotos: PhotoLayoutData[], description?: string) => {
    const newEntry: HistoryEntry = {
      photos: JSON.parse(JSON.stringify(newPhotos)),
      timestamp: Date.now(),
      description,
    };
    
    setHistory((prevHistory) => {
      setHistoryIndex((prevIndex) => {
        // Remove any entries after current index
        const newHistory = prevHistory.slice(0, prevIndex + 1);
        newHistory.push(newEntry);
        
        // Keep only last 50 entries
        if (newHistory.length > 50) {
          newHistory.shift();
          return newHistory.length - 1; // Adjust index after shift
        }
        
        return prevIndex + 1;
      });
      
      // Return new history for setState
      const newHistory = prevHistory.slice(0, historyIndex + 1);
      newHistory.push(newEntry);
      
      if (newHistory.length > 50) {
        newHistory.shift();
      }
      
      return newHistory;
    });
    
    setHasUnsavedChanges(true);
  }, [historyIndex]);

  // Delete photo handler - declared before useEffect that uses it
  const handlePhotoDelete = useCallback(async (id: string) => {
    const photo = photos.find((p) => p.id === id);
    if (!photo) return;

    try {
      // Extract file path from URL
      const urlParts = photo.image_url.split('/photos/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from('photos').remove([filePath]);
      }

      // Delete from database
      const { error } = await supabase
        .from('photos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      const newPhotos = photos.filter((p) => p.id !== id);
      setPhotos(newPhotos);
      addToHistory(newPhotos, 'Deleted photo');
      toast.success('Photo deleted');
    } catch (error) {
      const errorMessage = formatSupabaseError(error);
      console.error('Delete error:', errorMessage);
      toast.error(`Failed to delete photo: ${errorMessage}`);
    }
  }, [photos, addToHistory]);

  // Handle keyboard shortcuts (delete selected photo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle backspace/delete if a photo is selected and not editing in a panel
      if ((e.key === 'Backspace' || e.key === 'Delete') && selectedPhotoId && !editingPhotoId) {
        // Check if we're not in an input/textarea
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          handlePhotoDelete(selectedPhotoId);
          setSelectedPhotoId(null);
        }
      }
      
      // Escape to deselect
      if (e.key === 'Escape' && selectedPhotoId) {
        setSelectedPhotoId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhotoId, editingPhotoId, handlePhotoDelete]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setPhotos(JSON.parse(JSON.stringify(history[newIndex].photos)));
      setHasUnsavedChanges(true);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setPhotos(JSON.parse(JSON.stringify(history[newIndex].photos)));
      setHasUnsavedChanges(true);
    }
  }, [history, historyIndex]);

  const handlePhotoUpdate = useCallback((id: string, updates: Partial<PhotoLayoutData>) => {
    setPhotos((prevPhotos) => {
      const newPhotos = prevPhotos.map((photo) =>
        photo.id === id ? { ...photo, ...updates } : photo
      );
      
      // Debounced history update
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
      
      autosaveTimerRef.current = setTimeout(() => {
        addToHistory(newPhotos, 'Updated photo position/size');
      }, 500);
      
      return newPhotos;
    });
  }, [addToHistory]);

  const handlePhotoSelect = useCallback((id: string) => {
    setSelectedPhotoId(id);
  }, []);

  const handlePhotoEdit = useCallback((id: string) => {
    setEditingPhotoId(id);
  }, []);


  const handleBringForward = useCallback((id: string) => {
    setPhotos((prevPhotos) => {
      const photo = prevPhotos.find((p) => p.id === id);
      if (!photo) return prevPhotos;
      
      const maxZIndex = Math.max(...prevPhotos.map((p) => p.z_index));
      const newPhotos = prevPhotos.map((p) =>
        p.id === id ? { ...p, z_index: maxZIndex + 1 } : p
      );
      
      addToHistory(newPhotos, 'Brought photo forward');
      return newPhotos;
    });
  }, [addToHistory]);

  const handleSendBackward = useCallback((id: string) => {
    setPhotos((prevPhotos) => {
      const photo = prevPhotos.find((p) => p.id === id);
      if (!photo) return prevPhotos;
      
      const minZIndex = Math.min(...prevPhotos.map((p) => p.z_index));
      const newPhotos = prevPhotos.map((p) =>
        p.id === id ? { ...p, z_index: minZIndex - 1 } : p
      );
      
      addToHistory(newPhotos, 'Sent photo backward');
      return newPhotos;
    });
  }, [addToHistory]);

  const handleSave = async () => {
    try {
      // Update all photos in database
      // CRITICAL: We do NOT set is_draft here to prevent photos from disappearing from public view.
      // Public pages filter for is_draft=false, so changing this flag would hide all photos.
      // Save only updates layout positions while preserving publish status.
      const updates = photos.map((photo) => ({
        id: photo.id,
        position_x: photo.position_x,
        position_y: photo.position_y,
        width: photo.width,
        height: photo.height,
        scale: photo.scale,
        rotation: photo.rotation,
        z_index: photo.z_index,
        // Don't change is_draft status on save
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('photos')
          .update(update)
          .eq('id', update.id);

        if (error) throw error;
      }

      setHasUnsavedChanges(false);
      toast.success('Layout saved successfully');
    } catch (error) {
      const errorMessage = formatSupabaseError(error);
      console.error('Save error:', errorMessage);
      toast.error(`Failed to save layout: ${errorMessage}`);
    }
  };

  const handlePublish = async () => {
    try {
      // Update all photos and ensure they are published
      const updates = photos.map((photo) => ({
        id: photo.id,
        position_x: photo.position_x,
        position_y: photo.position_y,
        width: photo.width,
        height: photo.height,
        scale: photo.scale,
        rotation: photo.rotation,
        z_index: photo.z_index,
        is_draft: false, // Ensure photos are published
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('photos')
          .update(update)
          .eq('id', update.id);

        if (error) throw error;
      }

      setHasUnsavedChanges(false);
      toast.success('Layout published successfully! All photos are now visible to the public.');
    } catch (error) {
      const errorMessage = formatSupabaseError(error);
      console.error('Publish error:', errorMessage);
      toast.error(`Failed to publish layout: ${errorMessage}`);
    }
  };

  const handleRefresh = useCallback(() => {
    // Don't allow refresh if already refreshing
    if (isRefreshing) return;
    
    fetchPhotos(true);
  }, [isRefreshing, fetchPhotos]);

  const handleUploadComplete = () => {
    setShowUploader(false);
    fetchPhotos();
  };

  // Get device-specific width
  const getDeviceWidth = () => {
    switch (devicePreview) {
      case 'mobile':
        return '420px';
      case 'tablet':
        return '900px';
      case 'desktop':
      default:
        return '100%';
    }
  };

  // Get device max-width for the frame
  const getDeviceMaxWidth = () => {
    switch (devicePreview) {
      case 'mobile':
        return 420;
      case 'tablet':
        return 900;
      case 'desktop':
      default:
        return null;
    }
  };

  // Calculate canvas height dynamically based on photo positions
  const calculateCanvasHeight = useCallback(() => {
    if (photos.length === 0) return 600;
    
    let maxExtent = 0;
    photos.forEach((photo) => {
      const bottomExtent = photo.position_y + (photo.height * photo.scale);
      maxExtent = Math.max(maxExtent, bottomExtent);
    });
    
    // Add padding for comfortable editing and footer clearance
    return Math.max(600, maxExtent + 300);
  }, [photos]);

  // Calculate scale factor for device preview
  // Desktop baseline is DESKTOP_CANVAS_WIDTH, we scale down for smaller devices
  const getDeviceScaleFactor = useCallback(() => {
    switch (devicePreview) {
      case 'mobile':
        // 420px / 1600px = 0.2625
        return 420 / DESKTOP_CANVAS_WIDTH;
      case 'tablet':
        // 900px / 1600px = 0.5625
        return 900 / DESKTOP_CANVAS_WIDTH;
      case 'desktop':
      default:
        return 1; // No scaling
    }
  }, [devicePreview]);

  const canvasHeight = calculateCanvasHeight();
  const scaleFactor = getDeviceScaleFactor();
  
  // Find the photo being edited for the edit panel
  const editingPhoto = editingPhotoId ? photos.find(p => p.id === editingPhotoId) : null;

  return (
    <>
      <EditorToolbar
        mode={mode}
        devicePreview={devicePreview}
        snapToGrid={snapToGrid}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        hasChanges={hasUnsavedChanges}
        isRefreshing={isRefreshing}
        onModeChange={setMode}
        onDevicePreviewChange={setDevicePreview}
        onSnapToGridChange={setSnapToGrid}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onSave={handleSave}
        onPublish={handlePublish}
        onShowHistory={() => setShowHistory(true)}
        onAddPhoto={() => setShowUploader(true)}
        onRefresh={handleRefresh}
        onSignOut={onSignOut}
      />

      <div className="flex flex-col min-h-screen pt-24 bg-background overflow-y-auto overflow-x-hidden">
        {/* Outer container for centering */}
        <div className="flex-1 w-full flex justify-center px-4">
          {/* Device Frame - with visible dashed border for tablet/mobile */}
          <div 
            className="flex-1 transition-all duration-300 flex flex-col relative"
            style={{ 
              width: getDeviceWidth(),
              maxWidth: devicePreview === 'desktop' ? `${DESKTOP_CANVAS_WIDTH}px` : getDeviceWidth(),
            }}
          >
            {/* Dashed device outline for tablet/mobile previews */}
            {devicePreview !== 'desktop' && (
              <>
                <div 
                  className="absolute inset-0 pointer-events-none z-10 border-2 border-dashed border-muted-foreground/50 rounded"
                  aria-label={`${devicePreview} preview frame`}
                />
                {/* Device preview label */}
                <div className="absolute top-2 right-2 z-20 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-sm pointer-events-none">
                  {devicePreview === 'tablet' ? 'Tablet Preview (900px)' : 'Mobile Preview (420px)'}
                </div>
              </>
            )}

            {/* Device Inner - constrained content area */}
            <div className="device-inner flex-1 flex flex-col relative">
              {/* Exact replica of public view */}
              <PortfolioHeader activeCategory="PHOTOSHOOTS" isAdminContext={true} topOffset="56px" />
              
              <main className="flex-1 flex flex-col">
                <PhotographerBio />

                {/* Photo Canvas - Dynamic height based on content */}
                <div 
                  className="gallery-wrapper-outer relative mx-auto"
                  style={{
                    width: devicePreview === 'desktop' ? '100%' : getDeviceWidth(),
                    maxWidth: devicePreview === 'desktop' ? `${DESKTOP_CANVAS_WIDTH}px` : 'none',
                  }}
                >
                  <div 
                    className="gallery-wrapper relative px-3 md:px-5"
                    style={{
                      minHeight: `${canvasHeight}px`,
                      height: `${canvasHeight}px`,
                      width: `${DESKTOP_CANVAS_WIDTH}px`,
                      zoom: scaleFactor,
                    }}
                  >
                    {/* Grid overlay when snap-to-grid is enabled */}
                    {mode === 'edit' && snapToGrid && (
                      <div 
                        className="absolute inset-0 pointer-events-none opacity-20"
                        style={{
                          backgroundImage: `
                            repeating-linear-gradient(0deg, transparent, transparent 19px, #888 19px, #888 20px),
                            repeating-linear-gradient(90deg, transparent, transparent 19px, #888 19px, #888 20px)
                          `,
                          backgroundSize: '20px 20px',
                          width: '100%',
                          height: '100%',
                        }}
                      />
                    )}
                    
                    {/* Gallery container for photos */}
                    <div className="gallery relative w-full h-full">
                    {loading ? (
                      <div className="text-center py-20">
                        <p className="text-muted-foreground">Loading...</p>
                      </div>
                    ) : photos.length === 0 ? (
                      <div className="text-center py-20">
                        <p className="text-muted-foreground">
                          No photos yet. Click "Add Photo" to get started.
                        </p>
                      </div>
                    ) : (
                      photos.map((photo) => (
                        <DraggablePhoto
                          key={photo.id}
                          photo={photo}
                          isEditMode={mode === 'edit'}
                          isSelected={selectedPhotoId === photo.id}
                          snapToGrid={snapToGrid}
                          gridSize={20}
                          onUpdate={handlePhotoUpdate}
                          onDelete={handlePhotoDelete}
                          onBringForward={handleBringForward}
                          onSendBackward={handleSendBackward}
                          onEdit={handlePhotoEdit}
                          onSelect={handlePhotoSelect}
                        />
                      ))
                    )}
                    </div>
                  </div>
                </div>
              </main>

              {/* Footer outside main content flow */}
              <div className="mt-auto">
                <PortfolioFooter />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Photo Uploader Dialog */}
      <Dialog open={showUploader} onOpenChange={setShowUploader}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Photos</DialogTitle>
            <DialogDescription>
              Upload photos to your photoshoot gallery
            </DialogDescription>
          </DialogHeader>
          <PhotoUploader 
            onUploadComplete={handleUploadComplete}
          />
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit History</DialogTitle>
            <DialogDescription>
              View and restore previous versions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {history.map((entry, index) => (
              <div
                key={entry.timestamp}
                className={`p-3 rounded border ${
                  index === historyIndex
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-secondary/50'
                } cursor-pointer`}
                onClick={() => {
                  setHistoryIndex(index);
                  setPhotos(JSON.parse(JSON.stringify(entry.photos)));
                  setHasUnsavedChanges(true);
                  setShowHistory(false);
                  toast.success('Restored to previous version');
                }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium">
                      {entry.description || 'Change'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(entry.timestamp).toLocaleString()}
                    </p>
                  </div>
                  {index === historyIndex && (
                    <span className="text-xs text-primary">Current</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Photo Edit Panel */}
      {editingPhoto && (
        <PhotoEditPanel
          photo={editingPhoto}
          onClose={() => setEditingPhotoId(null)}
          onUpdate={handlePhotoUpdate}
        />
      )}
    </>
  );
}
