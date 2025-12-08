import { useState } from 'react';
import { 
  Eye, 
  Edit3, 
  Monitor, 
  Tablet, 
  Smartphone,
  Grid3x3,
  Save,
  Upload,
  Undo2,
  Redo2,
  History,
  Settings,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { EditorMode, DevicePreview } from '@/types/wysiwyg';

interface EditorToolbarProps {
  mode: EditorMode;
  devicePreview: DevicePreview;
  snapToGrid: boolean;
  canUndo: boolean;
  canRedo: boolean;
  hasChanges: boolean;
  category: string;
  onModeChange: (mode: EditorMode) => void;
  onDevicePreviewChange: (device: DevicePreview) => void;
  onSnapToGridChange: (enabled: boolean) => void;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onPublish: () => void;
  onShowHistory: () => void;
  onAddPhoto: () => void;
  onCategoryChange: (category: 'selected' | 'commissioned' | 'editorial' | 'personal') => void;
  onSignOut: () => void;
}

export default function EditorToolbar({
  mode,
  devicePreview,
  snapToGrid,
  canUndo,
  canRedo,
  hasChanges,
  category,
  onModeChange,
  onDevicePreviewChange,
  onSnapToGridChange,
  onUndo,
  onRedo,
  onSave,
  onPublish,
  onShowHistory,
  onAddPhoto,
  onCategoryChange,
  onSignOut,
}: EditorToolbarProps) {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-background border-b border-border shadow-sm">
      <div className="container mx-auto px-4 py-2 flex items-center justify-between gap-4">
        {/* Left Section: Category Selector & Mode Toggle */}
        <div className="flex items-center gap-2">
          <Select value={category} onValueChange={(value) => onCategoryChange(value as 'selected' | 'commissioned' | 'editorial' | 'personal')}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="selected">Selected</SelectItem>
              <SelectItem value="commissioned">Commissioned</SelectItem>
              <SelectItem value="editorial">Editorial</SelectItem>
              <SelectItem value="personal">Personal</SelectItem>
            </SelectContent>
          </Select>

          <Separator orientation="vertical" className="h-6" />
          
          <Button
            variant={mode === 'preview' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onModeChange('preview')}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button
            variant={mode === 'edit' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onModeChange('edit')}
          >
            <Edit3 className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>

        {/* Center Section: Device Preview & Tools */}
        <div className="flex items-center gap-2">
          <Separator orientation="vertical" className="h-6" />
          
          {/* Device Preview */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={devicePreview === 'desktop' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onDevicePreviewChange('desktop')}
              >
                <Monitor className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Desktop View</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={devicePreview === 'tablet' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onDevicePreviewChange('tablet')}
              >
                <Tablet className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Tablet View</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={devicePreview === 'mobile' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onDevicePreviewChange('mobile')}
              >
                <Smartphone className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Mobile View</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6" />

          {/* Undo/Redo */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onUndo}
                disabled={!canUndo}
              >
                <Undo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onRedo}
                disabled={!canRedo}
              >
                <Redo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Redo</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6" />

          {/* Grid Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={snapToGrid ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onSnapToGridChange(!snapToGrid)}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Snap to Grid</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6" />

          {/* History */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onShowHistory}
              >
                <History className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Show History</TooltipContent>
          </Tooltip>
        </div>

        {/* Right Section: Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onAddPhoto}
          >
            <Upload className="h-4 w-4 mr-2" />
            Add Photo
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onSave}
            disabled={!hasChanges}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>

          <Button
            size="sm"
            onClick={onPublish}
            disabled={!hasChanges}
          >
            Publish
          </Button>

          <Separator orientation="vertical" className="h-6" />

          <Button
            variant="ghost"
            size="sm"
            onClick={onSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
