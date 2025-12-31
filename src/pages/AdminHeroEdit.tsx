import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Loader2, Plus, Pencil, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { HeroText } from '@/hooks/useHeroText';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import { useBeforeUnload } from '@/hooks/useBeforeUnload';
import { DraftIndicator } from '@/components/admin/DraftIndicator';

// Page slug validation pattern
const PAGE_SLUG_PATTERN = /^[a-z0-9-]+$/;

// Type guard for Supabase errors
interface SupabaseError {
  code?: string;
  message?: string;
}

const isSupabaseError = (error: unknown): error is SupabaseError => {
  return typeof error === 'object' && error !== null && 'code' in error;
};

interface HeroFormData {
  page_slug: string;
  hero_title: string;
  hero_subtitle: string;
  hero_description: string;
  cta_text: string;
  cta_link: string;
  background_media_url: string;
}

const AdminHeroEdit = () => {
  const { user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const [heroes, setHeroes] = useState<HeroText[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedHero, setSelectedHero] = useState<HeroText | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<HeroFormData>({
    page_slug: '',
    hero_title: '',
    hero_subtitle: '',
    hero_description: '',
    cta_text: '',
    cta_link: '',
    background_media_url: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<HeroFormData>>({});

  // Generate unique key for draft storage
  const draftKey = useMemo(() => {
    if (selectedHero) {
      return `admin:hero_edit:draft:${selectedHero.page_slug}`;
    }
    return isCreating ? 'admin:hero_edit:draft:new' : '';
  }, [selectedHero, isCreating]);

  // Use form persistence hook (only when dialog is open)
  const { draftRestored, isSaving: isDraftSaving, clearDraft, hasUnsavedChanges } = useFormPersistence({
    key: draftKey,
    data: formData,
    onRestore: (restored) => {
      setFormData(restored);
    },
    enabled: editDialogOpen && draftKey !== '',
  });

  // Warn before leaving page with unsaved changes
  useBeforeUnload(hasUnsavedChanges && editDialogOpen);

  const handleDiscardDraft = () => {
    clearDraft();
    // Reset form to initial state
    if (selectedHero) {
      setFormData({
        page_slug: selectedHero.page_slug,
        hero_title: selectedHero.hero_title || '',
        hero_subtitle: selectedHero.hero_subtitle || '',
        hero_description: selectedHero.hero_description || '',
        cta_text: selectedHero.cta_text || '',
        cta_link: selectedHero.cta_link || '',
        background_media_url: selectedHero.background_media_url || '',
      });
    } else {
      setFormData({
        page_slug: '',
        hero_title: '',
        hero_subtitle: '',
        hero_description: '',
        cta_text: '',
        cta_link: '',
        background_media_url: '',
      });
    }
    toast.success('Draft discarded');
  };

  useEffect(() => {
    if (isLoading) return;
    if (!user || !isAdmin) {
      navigate('/admin/login', { replace: true });
      return;
    }
  }, [user, isAdmin, isLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      loadHeroes();
    }
  }, [user, isAdmin]);

  const loadHeroes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('hero_text')
        .select('*')
        .order('page_slug', { ascending: true });

      if (error) throw error;
      setHeroes(data || []);
    } catch (err) {
      console.error('Error loading heroes:', err);
      toast.error('Failed to load hero sections');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<HeroFormData> = {};
    
    if (!formData.page_slug.trim()) {
      errors.page_slug = 'Page slug is required';
    } else if (!PAGE_SLUG_PATTERN.test(formData.page_slug)) {
      errors.page_slug = 'Page slug must contain only lowercase letters, numbers, and hyphens';
    }
    
    if (!formData.hero_title.trim()) {
      errors.hero_title = 'Hero title is required';
    } else if (formData.hero_title.length > 200) {
      errors.hero_title = 'Hero title must be less than 200 characters';
    }

    if (formData.hero_subtitle.length > 200) {
      errors.hero_subtitle = 'Hero subtitle must be less than 200 characters';
    }

    if (formData.hero_description.length > 1000) {
      errors.hero_description = 'Hero description must be less than 1000 characters';
    }

    if (formData.cta_text.length > 100) {
      errors.cta_text = 'CTA text must be less than 100 characters';
    }

    if (formData.cta_link && !/^(https?:\/\/|\/)[^\s]*$/.test(formData.cta_link)) {
      errors.cta_link = 'CTA link must be a valid URL or path';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenCreate = () => {
    setIsCreating(true);
    setSelectedHero(null);
    setFormData({
      page_slug: '',
      hero_title: '',
      hero_subtitle: '',
      hero_description: '',
      cta_text: '',
      cta_link: '',
      background_media_url: '',
    });
    setFormErrors({});
    setEditDialogOpen(true);
  };

  const handleOpenEdit = (hero: HeroText) => {
    setIsCreating(false);
    setSelectedHero(hero);
    setFormData({
      page_slug: hero.page_slug,
      hero_title: hero.hero_title || '',
      hero_subtitle: hero.hero_subtitle || '',
      hero_description: hero.hero_description || '',
      cta_text: hero.cta_text || '',
      cta_link: hero.cta_link || '',
      background_media_url: hero.background_media_url || '',
    });
    setFormErrors({});
    setEditDialogOpen(true);
  };

  const handleOpenPreview = (hero: HeroText) => {
    setSelectedHero(hero);
    setPreviewDialogOpen(true);
  };

  const handleOpenDelete = (hero: HeroText) => {
    setSelectedHero(hero);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      if (isCreating) {
        const { error } = await supabase
          .from('hero_text')
          .insert([{
            page_slug: formData.page_slug.trim(),
            hero_title: formData.hero_title.trim() || null,
            hero_subtitle: formData.hero_subtitle.trim() || null,
            hero_description: formData.hero_description.trim() || null,
            cta_text: formData.cta_text.trim() || null,
            cta_link: formData.cta_link.trim() || null,
            background_media_url: formData.background_media_url.trim() || null,
          }]);

        if (error) throw error;
        toast.success('Hero section created successfully');
      } else if (selectedHero) {
        const { error } = await supabase
          .from('hero_text')
          .update({
            page_slug: formData.page_slug.trim(),
            hero_title: formData.hero_title.trim() || null,
            hero_subtitle: formData.hero_subtitle.trim() || null,
            hero_description: formData.hero_description.trim() || null,
            cta_text: formData.cta_text.trim() || null,
            cta_link: formData.cta_link.trim() || null,
            background_media_url: formData.background_media_url.trim() || null,
          })
          .eq('id', selectedHero.id);

        if (error) throw error;
        toast.success('Hero section updated successfully');
      }

      // Clear draft on successful save
      clearDraft();
      setEditDialogOpen(false);
      loadHeroes();
    } catch (err: unknown) {
      console.error('Error saving hero:', err);
      if (isSupabaseError(err) && err.code === '23505') {
        toast.error('A hero section with this page slug already exists');
      } else {
        toast.error('Failed to save hero section');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedHero) return;

    try {
      const { error } = await supabase
        .from('hero_text')
        .delete()
        .eq('id', selectedHero.id);

      if (error) throw error;

      toast.success('Hero section deleted successfully');
      setDeleteDialogOpen(false);
      loadHeroes();
    } catch (err) {
      console.error('Error deleting hero:', err);
      toast.error('Failed to delete hero section');
    }
  };

  if (isLoading || !user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin/dashboard')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <h1 className="text-xl font-semibold uppercase tracking-wider">Hero Sections</h1>
            </div>
            <Button onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Hero Section
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : heroes.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-4">No hero sections yet.</p>
            <Button onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Hero Section
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {heroes.map((hero) => (
              <Card key={hero.id} className="hover:border-foreground/20 transition-all">
                <CardHeader>
                  <CardTitle className="text-base uppercase tracking-wider">
                    {hero.page_slug}
                  </CardTitle>
                  <CardDescription className="text-sm line-clamp-2">
                    {hero.hero_title || 'No title'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-xs text-muted-foreground">
                    Last updated: {new Date(hero.updated_at).toLocaleDateString()}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleOpenEdit(hero)}
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenPreview(hero)}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDelete(hero)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>
                  {isCreating ? 'Create Hero Section' : 'Edit Hero Section'}
                </DialogTitle>
                <DialogDescription>
                  {isCreating
                    ? 'Add a new hero section for a page'
                    : 'Update the hero section content'}
                </DialogDescription>
              </div>
              <DraftIndicator 
                draftRestored={draftRestored}
                isSaving={isDraftSaving}
                onDiscard={handleDiscardDraft}
              />
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="page_slug">
                Page Slug * <span className="text-xs text-muted-foreground">(e.g., home, about, services)</span>
              </Label>
              <Input
                id="page_slug"
                value={formData.page_slug}
                onChange={(e) => setFormData({ ...formData, page_slug: e.target.value })}
                placeholder="home"
                disabled={!isCreating}
              />
              {formErrors.page_slug && (
                <p className="text-xs text-destructive">{formErrors.page_slug}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="hero_title">
                Hero Title * <span className="text-xs text-muted-foreground">(max 200 chars)</span>
              </Label>
              <Input
                id="hero_title"
                value={formData.hero_title}
                onChange={(e) => setFormData({ ...formData, hero_title: e.target.value })}
                placeholder="Ankur Bag"
              />
              {formErrors.hero_title && (
                <p className="text-xs text-destructive">{formErrors.hero_title}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="hero_subtitle">
                Hero Subtitle <span className="text-xs text-muted-foreground">(max 200 chars)</span>
              </Label>
              <Input
                id="hero_subtitle"
                value={formData.hero_subtitle}
                onChange={(e) => setFormData({ ...formData, hero_subtitle: e.target.value })}
                placeholder="FASHION PRODUCTION & PHOTOGRAPHY"
              />
              {formErrors.hero_subtitle && (
                <p className="text-xs text-destructive">{formErrors.hero_subtitle}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="hero_description">
                Hero Description <span className="text-xs text-muted-foreground">(max 1000 chars)</span>
              </Label>
              <Textarea
                id="hero_description"
                value={formData.hero_description}
                onChange={(e) => setFormData({ ...formData, hero_description: e.target.value })}
                placeholder="Production photographer specializing in..."
                rows={4}
              />
              {formErrors.hero_description && (
                <p className="text-xs text-destructive">{formErrors.hero_description}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cta_text">
                CTA Text <span className="text-xs text-muted-foreground">(optional, max 100 chars)</span>
              </Label>
              <Input
                id="cta_text"
                value={formData.cta_text}
                onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                placeholder="Get Started"
              />
              {formErrors.cta_text && (
                <p className="text-xs text-destructive">{formErrors.cta_text}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cta_link">
                CTA Link <span className="text-xs text-muted-foreground">(optional, URL or path)</span>
              </Label>
              <Input
                id="cta_link"
                value={formData.cta_link}
                onChange={(e) => setFormData({ ...formData, cta_link: e.target.value })}
                placeholder="/contact or https://example.com"
              />
              {formErrors.cta_link && (
                <p className="text-xs text-destructive">{formErrors.cta_link}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="background_media_url">
                Background Image URL <span className="text-xs text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="background_media_url"
                value={formData.background_media_url}
                onChange={(e) => setFormData({ ...formData, background_media_url: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : isCreating ? (
                'Create'
              ) : (
                'Update'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Hero Preview - {selectedHero?.page_slug}</DialogTitle>
          </DialogHeader>
          {selectedHero && (
            <div 
              className="border border-border rounded-lg p-8"
              style={selectedHero.background_media_url ? {
                backgroundImage: `url(${selectedHero.background_media_url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              } : undefined}
            >
              <div className="space-y-4 text-center bg-background/90 backdrop-blur-sm p-8 rounded">
                <h2 className="font-playfair text-3xl md:text-4xl text-foreground">
                  {selectedHero.hero_title || 'No title'}
                </h2>
                {selectedHero.hero_subtitle && (
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-inter">
                    {selectedHero.hero_subtitle}
                  </p>
                )}
                {selectedHero.hero_description && (
                  <p className="text-sm text-foreground/80 max-w-2xl leading-relaxed mx-auto">
                    {selectedHero.hero_description}
                  </p>
                )}
                {selectedHero.cta_text && selectedHero.cta_link && (
                  <div className="pt-4">
                    <span className="inline-block px-6 py-3 text-sm uppercase tracking-wider border border-foreground/20">
                      {selectedHero.cta_text}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the hero section for "{selectedHero?.page_slug}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminHeroEdit;
