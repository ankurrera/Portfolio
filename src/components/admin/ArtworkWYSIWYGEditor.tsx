import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ArtworkData } from '@/types/artwork';
import { formatSupabaseError } from '@/lib/utils';
import { EditorMode, DevicePreview } from '@/types/wysiwyg';
import DraggableArtwork from './DraggableArtwork';
import EditorToolbar from './EditorToolbar';
import ArtworkUploader from './ArtworkUploader';
import ArtworkEditPanel from './ArtworkEditPanel';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ArtworkWYSIWYGEditorProps {
  onSignOut: () => void;
}

// Desktop canvas baseline width for device preview scaling
const DESKTOP_CANVAS_WIDTH = 1600;

export default function ArtworkWYSIWYGEditor({ onSignOut }: ArtworkWYSIWYGEditorProps) {
  const [artworks, setArtworks] = useState<ArtworkData[]>([]);
  const [mode, setMode] = useState<EditorMode>('edit');
  const [devicePreview, setDevicePreview] = useState<DevicePreview>('desktop');
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [selectedArtworkId, setSelectedArtworkId] = useState<string | null>(null);
  const [editingArtworkId, setEditingArtworkId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Autosave
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchArtworks = async (isRefresh = false) => {
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
    
    // Set timeout fallback
    refreshTimeoutRef.current = setTimeout(() => {
      if (isRefresh) {
        setIsRefreshing(false);
        toast.error('Request timed out. Please check your connection and try again.');
      } else {
        setLoading(false);
        toast.error('Failed to load artworks: Request timed out. Please check your connection.');
      }
    }, 10000);
    
    try {
      const { data, error } = await supabase
        .from('artworks')
        .select('*')
        .order('z_index', { ascending: true })
        .abortSignal(abortControllerRef.current.signal);

      if (error) throw error;
      
      const artworksData = (data || []) as ArtworkData[];
      setArtworks(artworksData);
      
      if (isRefresh) {
        toast.success('Artworks refreshed successfully');
      }
    } catch (error: unknown) {
      // Don't show error if request was aborted
      const isAbortError = error && typeof error === 'object' && 'name' in error && error.name === 'AbortError';
      const isSignalAborted = abortControllerRef.current?.signal.aborted;
      
      if (isAbortError || isSignalAborted) {
        return;
      }
      
      const errorMessage = formatSupabaseError(error);
      console.error('Error fetching artworks:', errorMessage);
      toast.error(`Failed to load artworks: ${errorMessage}`);
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
    fetchArtworks();
    
    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, []);

  const handleArtworkUpdate = useCallback((id: string, updates: Partial<ArtworkData>) => {
    setArtworks((prev) =>
      prev.map((artwork) => (artwork.id === id ? { ...artwork, ...updates } : artwork))
    );
    setHasUnsavedChanges(true);

    // Autosave after 2 seconds of inactivity
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }
    autosaveTimerRef.current = setTimeout(() => {
      saveArtworkToDatabase(id, updates);
    }, 2000);
  }, []);

  const saveArtworkToDatabase = async (id: string, updates: Partial<ArtworkData>) => {
    try {
      const { error } = await supabase
        .from('artworks')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      setHasUnsavedChanges(false);
    } catch (error) {
      const errorMessage = formatSupabaseError(error);
      console.error('Autosave error:', errorMessage);
      toast.error(`Failed to autosave: ${errorMessage}`);
    }
  };

  const handleArtworkDelete = useCallback(async (id: string) => {
    const artwork = artworks.find((a) => a.id === id);
    if (!artwork) return;

    if (!confirm(`Delete "${artwork.title}"? This cannot be undone.`)) {
      return;
    }

    try {
      // Delete images from storage
      const primaryUrl = artwork.primary_image_url;
      const originalUrl = artwork.primary_image_original_url;
      
      const filesToDelete: string[] = [];
      
      if (primaryUrl) {
        const urlParts = primaryUrl.split('/photos/');
        if (urlParts.length > 1) filesToDelete.push(urlParts[1]);
      }
      
      if (originalUrl) {
        const urlParts = originalUrl.split('/photos/');
        if (urlParts.length > 1) filesToDelete.push(urlParts[1]);
      }

      // Delete process images
      if (Array.isArray(artwork.process_images)) {
        artwork.process_images.forEach((img: { url?: string; original_url?: string }) => {
          if (img.url) {
            const urlParts = img.url.split('/photos/');
            if (urlParts.length > 1) filesToDelete.push(urlParts[1]);
          }
          if (img.original_url) {
            const urlParts = img.original_url.split('/photos/');
            if (urlParts.length > 1) filesToDelete.push(urlParts[1]);
          }
        });
      }

      if (filesToDelete.length > 0) {
        await supabase.storage.from('photos').remove(filesToDelete);
      }

      // Delete from database
      const { error } = await supabase
        .from('artworks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setArtworks((prev) => prev.filter((a) => a.id !== id));
      toast.success('Artwork deleted');
    } catch (error) {
      const errorMessage = formatSupabaseError(error);
      console.error('Delete error:', errorMessage);
      toast.error(`Failed to delete artwork: ${errorMessage}`);
    }
  }, [artworks]);

  const handleBringForward = useCallback(async (id: string) => {
    const currentArtwork = artworks.find((a) => a.id === id);
    if (!currentArtwork) return;

    const higherArtworks = artworks.filter((a) => a.z_index > currentArtwork.z_index);
    if (higherArtworks.length === 0) return;

    const nextZIndex = Math.min(...higherArtworks.map((a) => a.z_index));
    handleArtworkUpdate(id, { z_index: nextZIndex + 1 });
  }, [artworks, handleArtworkUpdate]);

  const handleSendBackward = useCallback(async (id: string) => {
    const currentArtwork = artworks.find((a) => a.id === id);
    if (!currentArtwork) return;

    const lowerArtworks = artworks.filter((a) => a.z_index < currentArtwork.z_index);
    if (lowerArtworks.length === 0) return;

    const prevZIndex = Math.max(...lowerArtworks.map((a) => a.z_index));
    handleArtworkUpdate(id, { z_index: prevZIndex - 1 });
  }, [artworks, handleArtworkUpdate]);

  const handleSaveAll = async () => {
    try {
      toast.info('Saving all changes...');
      
      // Save all artworks in batch
      const updates = artworks.map((artwork) => ({
        id: artwork.id,
        position_x: artwork.position_x,
        position_y: artwork.position_y,
        width: artwork.width,
        height: artwork.height,
        scale: artwork.scale,
        rotation: artwork.rotation,
        z_index: artwork.z_index,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('artworks')
          .update(update)
          .eq('id', update.id);
        
        if (error) throw error;
      }

      setHasUnsavedChanges(false);
      toast.success('All changes saved');
    } catch (error) {
      const errorMessage = formatSupabaseError(error);
      console.error('Save error:', errorMessage);
      toast.error(`Failed to save: ${errorMessage}`);
    }
  };

  const handlePublish = async () => {
    try {
      toast.info('Publishing all artworks...');
      
      // Save all artworks and ensure they are published
      const updates = artworks.map((artwork) => ({
        id: artwork.id,
        position_x: artwork.position_x,
        position_y: artwork.position_y,
        width: artwork.width,
        height: artwork.height,
        scale: artwork.scale,
        rotation: artwork.rotation,
        z_index: artwork.z_index,
        is_published: true,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('artworks')
          .update(update)
          .eq('id', update.id);
        
        if (error) throw error;
      }

      setHasUnsavedChanges(false);
      toast.success('All artworks published successfully!');
    } catch (error) {
      const errorMessage = formatSupabaseError(error);
      console.error('Publish error:', errorMessage);
      toast.error(`Failed to publish: ${errorMessage}`);
    }
  };

  const handleUndo = useCallback(() => {
    // Undo functionality not implemented for artwork editor
    toast.info('Undo not available for artwork editor');
  }, []);

  const handleRedo = useCallback(() => {
    // Redo functionality not implemented for artwork editor
    toast.info('Redo not available for artwork editor');
  }, []);

  const handleShowHistory = useCallback(() => {
    // History functionality not implemented for artwork editor
    toast.info('History not available for artwork editor');
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Backspace' || e.key === 'Delete') && selectedArtworkId && !editingArtworkId) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          handleArtworkDelete(selectedArtworkId);
          setSelectedArtworkId(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedArtworkId, editingArtworkId, handleArtworkDelete]);

  // Calculate scale factor for device preview
  const getScaleFactor = () => {
    switch (devicePreview) {
      case 'tablet':
        return 0.75;
      case 'mobile':
        return 0.5;
      default:
        return 1;
    }
  };

  // Calculate canvas height dynamically based on artwork positions
  const calculateCanvasHeight = useCallback(() => {
    if (artworks.length === 0) return 800;
    
    let maxExtent = 0;
    artworks.forEach((artwork) => {
      const bottomExtent = artwork.position_y + (artwork.height * artwork.scale);
      maxExtent = Math.max(maxExtent, bottomExtent);
    });
    
    // Add padding for comfortable editing
    return Math.max(800, maxExtent + 300);
  }, [artworks]);

  const scaleFactor = getScaleFactor();
  const canvasWidth = DESKTOP_CANVAS_WIDTH * scaleFactor;
  const canvasHeight = calculateCanvasHeight();

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Toolbar */}
      <EditorToolbar
        mode={mode}
        devicePreview={devicePreview}
        snapToGrid={snapToGrid}
        canUndo={false} // TODO: Implement undo/redo history for artwork editor (similar to WYSIWYGEditor)
        canRedo={false} // TODO: Implement undo/redo history for artwork editor (similar to WYSIWYGEditor)
        hasChanges={hasUnsavedChanges}
        category={'artistic' as 'selected' | 'commissioned' | 'editorial' | 'personal' | 'artistic'}
        isRefreshing={isRefreshing}
        onModeChange={setMode}
        onDevicePreviewChange={setDevicePreview}
        onSnapToGridChange={setSnapToGrid}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onSave={handleSaveAll}
        onPublish={handlePublish}
        onShowHistory={handleShowHistory}
        onAddPhoto={() => setShowUploader(true)}
        onRefresh={() => fetchArtworks(true)}
        onCategoryChange={() => {}} // No category switching for artistic
        onSignOut={onSignOut}
      />

      {/* Canvas */}
      <div className="flex-1 overflow-auto bg-muted/30">
        <div className="min-h-full p-8">
          <div
            className="relative bg-background border shadow-lg mx-auto"
            style={{
              width: canvasWidth,
              minHeight: canvasHeight,
            }}
          >
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Loading artworks...</p>
                </div>
              </div>
            )}

            {!loading && artworks.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">No artworks yet</p>
                  <button
                    onClick={() => setShowUploader(true)}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                  >
                    Upload First Artwork
                  </button>
                </div>
              </div>
            )}

            {!loading && artworks.map((artwork) => (
              <DraggableArtwork
                key={artwork.id}
                artwork={artwork}
                isEditMode={mode === 'edit'}
                snapToGrid={snapToGrid}
                gridSize={20}
                isSelected={selectedArtworkId === artwork.id}
                onUpdate={handleArtworkUpdate}
                onDelete={handleArtworkDelete}
                onBringForward={handleBringForward}
                onSendBackward={handleSendBackward}
                onEdit={(id) => setEditingArtworkId(id)}
                onSelect={setSelectedArtworkId}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploader} onOpenChange={setShowUploader}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload New Artwork</DialogTitle>
            <DialogDescription>
              Upload your artistic work with detailed metadata
            </DialogDescription>
          </DialogHeader>
          <ArtworkUploader
            onUploadComplete={() => {
              setShowUploader(false);
              fetchArtworks(true);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Panel */}
      {editingArtworkId && (
        <ArtworkEditPanel
          artwork={artworks.find((a) => a.id === editingArtworkId)!}
          onClose={() => setEditingArtworkId(null)}
          onUpdate={handleArtworkUpdate}
        />
      )}
    </div>
  );
}
