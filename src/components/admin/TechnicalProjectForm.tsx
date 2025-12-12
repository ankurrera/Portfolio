import { useState } from 'react';
import { TechnicalProject, TechnicalProjectInsert, TechnicalProjectUpdate } from '@/types/technical';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Plus, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TechnicalProjectFormProps {
  project?: TechnicalProject | null;
  onSave: (project: TechnicalProject) => void;
  onCancel: () => void;
}

const TechnicalProjectForm = ({ project, onSave, onCancel }: TechnicalProjectFormProps) => {
  const [title, setTitle] = useState(project?.title || '');
  const [description, setDescription] = useState(project?.description || '');
  const [devYear, setDevYear] = useState(project?.dev_year || new Date().getFullYear().toString());
  const [status, setStatus] = useState(project?.status || 'Live');
  const [githubLink, setGithubLink] = useState(project?.github_link || '');
  const [liveLink, setLiveLink] = useState(project?.live_link || '');
  const [thumbnailUrl, setThumbnailUrl] = useState(project?.thumbnail_url || '');
  const [languages, setLanguages] = useState<string[]>(project?.languages || []);
  const [newLanguage, setNewLanguage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleAddLanguage = () => {
    if (newLanguage.trim() && !languages.includes(newLanguage.trim())) {
      setLanguages([...languages, newLanguage.trim()]);
      setNewLanguage('');
    }
  };

  const handleRemoveLanguage = (lang: string) => {
    setLanguages(languages.filter(l => l !== lang));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError, data } = await supabase.storage
        .from('technical-projects')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('technical-projects')
        .getPublicUrl(filePath);

      setThumbnailUrl(publicUrl);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Please enter a project title');
      return;
    }
    
    if (!description.trim()) {
      toast.error('Please enter a project description');
      return;
    }

    setIsSaving(true);
    try {
      if (project) {
        // Update existing project
        const updates: TechnicalProjectUpdate = {
          title: title.trim(),
          description: description.trim(),
          dev_year: devYear,
          status,
          github_link: githubLink.trim() || null,
          live_link: liveLink.trim() || null,
          thumbnail_url: thumbnailUrl || null,
          languages,
        };

        const { data, error } = await supabase
          .from('technical_projects')
          .update(updates)
          .eq('id', project.id)
          .select()
          .single();

        if (error) throw error;
        
        // Parse languages from JSONB
        const updatedProject = {
          ...data,
          languages: Array.isArray(data.languages) ? data.languages : JSON.parse(data.languages as string)
        };
        
        onSave(updatedProject as TechnicalProject);
        toast.success('Project updated successfully');
      } else {
        // Create new project
        const insert: TechnicalProjectInsert = {
          title: title.trim(),
          description: description.trim(),
          dev_year: devYear,
          status,
          github_link: githubLink.trim() || null,
          live_link: liveLink.trim() || null,
          thumbnail_url: thumbnailUrl || null,
          languages,
        };

        const { data, error } = await supabase
          .from('technical_projects')
          .insert(insert)
          .select()
          .single();

        if (error) throw error;
        
        // Parse languages from JSONB
        const newProject = {
          ...data,
          languages: Array.isArray(data.languages) ? data.languages : JSON.parse(data.languages as string)
        };
        
        onSave(newProject as TechnicalProject);
        toast.success('Project created successfully');
      }
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error('Failed to save project');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{project ? 'Edit Project' : 'New Project'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Project Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="AI Analytics Dashboard"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Real-time data visualization platform with machine learning insights..."
              rows={4}
              required
            />
          </div>

          {/* Dev Year and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="devYear">Development Year *</Label>
              <Input
                id="devYear"
                value={devYear}
                onChange={(e) => setDevYear(e.target.value)}
                placeholder="2024"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Input
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                placeholder="Live, In Development, etc."
              />
            </div>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="githubLink">GitHub Link</Label>
              <Input
                id="githubLink"
                type="url"
                value={githubLink}
                onChange={(e) => setGithubLink(e.target.value)}
                placeholder="https://github.com/..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="liveLink">Live Link</Label>
              <Input
                id="liveLink"
                type="url"
                value={liveLink}
                onChange={(e) => setLiveLink(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          </div>

          {/* Thumbnail Upload */}
          <div className="space-y-2">
            <Label htmlFor="thumbnail">Project Thumbnail (Optional)</Label>
            <div className="flex items-center gap-4">
              <Input
                id="thumbnail"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isUploading}
                className="flex-1"
              />
              {isUploading && <span className="text-sm text-muted-foreground">Uploading...</span>}
            </div>
            {thumbnailUrl && (
              <div className="mt-2">
                <img src={thumbnailUrl} alt="Thumbnail preview" className="h-32 object-cover rounded" />
              </div>
            )}
          </div>

          {/* Languages/Technologies */}
          <div className="space-y-2">
            <Label>Languages & Technologies</Label>
            <div className="flex gap-2">
              <Input
                value={newLanguage}
                onChange={(e) => setNewLanguage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLanguage())}
                placeholder="React, TypeScript, etc."
              />
              <Button type="button" onClick={handleAddLanguage} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {languages.map((lang) => (
                <div
                  key={lang}
                  className="flex items-center gap-1 px-3 py-1 bg-muted rounded text-sm"
                >
                  <span>{lang}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveLanguage(lang)}
                    className="hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : project ? 'Update Project' : 'Create Project'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default TechnicalProjectForm;
