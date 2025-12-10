import { useState, useEffect, useCallback, useRef } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface WYSIWYGEditorProps {
  category: PhotoCategory;
  onCategoryChange: (category: PhotoCategory) => void;
  onSignOut: () => void;
}

export default function WYSIWYGEditor({ category, onCategoryChange, onSignOut }: WYSIWYGEditorProps) {
  const [photos, setPhotos] = useState<PhotoLayoutData[]>([]);
  const [mode, setMode] = useState<EditorMode>('edit');
  const [devicePreview, setDevicePreview] = useState<DevicePreview>('desktop');
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  // History management
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [historyInitialized, setHistoryInitialized] = useState(false);
  
  // Autosave
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchPhotos = async (isRefresh = false) => {
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
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('category', category as 'selected' | 'commissioned' | 'editorial' | 'personal')
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
    } catch (error: any) {
      // Don't show error if request was aborted (user triggered another action)
      if (error.name === 'AbortError' || abortControllerRef.current?.signal.aborted) {
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
  };

  useEffect(() => {
    fetchPhotos();
    
    // Cleanup function to abort in-flight requests when component unmounts or category changes
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [category]);

  // Add to history
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
      const updates = photos.map((photo) => ({
        id: photo.id,
        position_x: photo.position_x,
        position_y: photo.position_y,
        width: photo.width,
        height: photo.height,
        scale: photo.scale,
        rotation: photo.rotation,
        z_index: photo.z_index,
        is_draft: true,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('photos')
          .update(update)
          .eq('id', update.id);

        if (error) throw error;
      }

      setHasUnsavedChanges(false);
      toast.success('Draft saved successfully');
    } catch (error) {
      const errorMessage = formatSupabaseError(error);
      console.error('Save error:', errorMessage);
      toast.error(`Failed to save draft: ${errorMessage}`);
    }
  };

  const handlePublish = async () => {
    try {
      // Update all photos and mark as published
      const updates = photos.map((photo) => ({
        id: photo.id,
        position_x: photo.position_x,
        position_y: photo.position_y,
        width: photo.width,
        height: photo.height,
        scale: photo.scale,
        rotation: photo.rotation,
        z_index: photo.z_index,
        is_draft: false,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('photos')
          .update(update)
          .eq('id', update.id);

        if (error) throw error;
      }

      setHasUnsavedChanges(false);
      toast.success('Layout published successfully!');
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
  }, [isRefreshing, category]);

  const handleUploadComplete = () => {
    setShowUploader(false);
    fetchPhotos();
  };

  // Get device-specific width
  const getDeviceWidth = () => {
    switch (devicePreview) {
      case 'mobile':
        return '375px';
      case 'tablet':
        return '768px';
      case 'desktop':
      default:
        return '100%';
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

  const categoryUpper = category.toUpperCase();

  return (
    <>
      <EditorToolbar
        mode={mode}
        devicePreview={devicePreview}
        snapToGrid={snapToGrid}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        hasChanges={hasUnsavedChanges}
        category={category}
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
        onCategoryChange={onCategoryChange}
        onSignOut={onSignOut}
      />

      <div className="flex flex-col min-h-screen pt-24 bg-background overflow-y-auto">
        {/* Preview Container */}
        <div 
          className="flex-1 mx-auto transition-all duration-300 flex flex-col"
          style={{ 
            width: getDeviceWidth(),
            maxWidth: '1600px',
          }}
        >
          {/* Exact replica of public view */}
          <PortfolioHeader activeCategory={categoryUpper} isAdminContext={true} topOffset="56px" />
          
          <main className="flex-1 flex flex-col">
            <PhotographerBio />

            {/* Photo Canvas - Dynamic height based on content */}
            <div 
              className="relative max-w-[1600px] mx-auto px-3 md:px-5 flex-1"
              style={{
                minHeight: `${calculateCanvasHeight()}px`,
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
                  }}
                />
              )}
              
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
                    snapToGrid={snapToGrid}
                    gridSize={20}
                    onUpdate={handlePhotoUpdate}
                    onDelete={handlePhotoDelete}
                    onBringForward={handleBringForward}
                    onSendBackward={handleSendBackward}
                  />
                ))
              )}
            </div>
          </main>

          {/* Footer outside main content flow */}
          <div className="mt-auto">
            <PortfolioFooter />
          </div>
        </div>
      </div>

      {/* Photo Uploader Dialog */}
      <Dialog open={showUploader} onOpenChange={setShowUploader}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Photos</DialogTitle>
            <DialogDescription>
              Upload photos to add to your {category} portfolio
            </DialogDescription>
          </DialogHeader>
          <PhotoUploader 
            category={category as 'selected' | 'commissioned' | 'editorial' | 'personal'} 
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
    </>
  );
}
