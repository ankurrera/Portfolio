import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Plus, Trash2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { AboutPage, Service } from '@/types/about';

const AdminAboutEdit = () => {
  const { user, isAdmin, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [aboutData, setAboutData] = useState<AboutPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Form fields
  const [profileImageUrl, setProfileImageUrl] = useState<string>('');
  const [bioText, setBioText] = useState<string>('');
  const [services, setServices] = useState<Service[]>([]);

  // Auth redirect effect
  useEffect(() => {
    if (isLoading) return;
    
    if (!user) {
      navigate('/admin/login', { replace: true });
      return;
    }
    
    if (!isAdmin) {
      toast.error('You do not have admin access');
      signOut();
      navigate('/admin/login', { replace: true });
    }
  }, [user, isAdmin, isLoading, navigate, signOut]);

  // Load about page data
  useEffect(() => {
    if (!user || !isAdmin) return;
    
    loadAboutData();
  }, [user, isAdmin]);

  const loadAboutData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('about_page')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "no rows returned" error
        throw error;
      }

      if (data) {
        setAboutData(data);
        setProfileImageUrl(data.profile_image_url || '');
        setBioText(data.bio_text || '');
        setServices(Array.isArray(data.services) ? data.services : []);
      }
    } catch (error) {
      console.error('Error loading about data:', error);
      toast.error('Failed to load About page data');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      
      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `about-profile-${Date.now()}.${fileExt}`;
      const filePath = `about/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(filePath);

      setProfileImageUrl(publicUrl);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setProfileImageUrl('');
  };

  const handleAddService = () => {
    const newService: Service = {
      id: crypto.randomUUID(),
      title: '',
      description: ''
    };
    setServices([...services, newService]);
  };

  const handleUpdateService = (id: string, field: 'title' | 'description', value: string) => {
    setServices(services.map(service => 
      service.id === id ? { ...service, [field]: value } : service
    ));
  };

  const handleDeleteService = (id: string) => {
    setServices(services.filter(service => service.id !== id));
  };

  const handleMoveServiceUp = (index: number) => {
    if (index === 0) return;
    const newServices = [...services];
    [newServices[index - 1], newServices[index]] = [newServices[index], newServices[index - 1]];
    setServices(newServices);
  };

  const handleMoveServiceDown = (index: number) => {
    if (index === services.length - 1) return;
    const newServices = [...services];
    [newServices[index], newServices[index + 1]] = [newServices[index + 1], newServices[index]];
    setServices(newServices);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const updateData = {
        profile_image_url: profileImageUrl || null,
        bio_text: bioText || null,
        services: services
      };

      if (aboutData) {
        // Update existing record
        const { error } = await supabase
          .from('about_page')
          .update(updateData)
          .eq('id', aboutData.id);

        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('about_page')
          .insert(updateData);

        if (error) throw error;
      }

      toast.success('About page updated successfully');
      await loadAboutData();
    } catch (error) {
      console.error('Error saving about data:', error);
      toast.error('Failed to save About page data');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/dashboard')}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-semibold uppercase tracking-wider">About Page Management</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage profile image, bio, and services for the About page
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Profile Image Section */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Image</CardTitle>
              <CardDescription>
                Upload or update the profile image displayed on the About page
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {profileImageUrl ? (
                <div className="space-y-4">
                  <div className="relative inline-block">
                    <img
                      src={profileImageUrl}
                      alt="Profile"
                      className="max-w-xs rounded-lg border border-border"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={handleRemoveImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div>
                    <Label htmlFor="replace-image">Replace Image</Label>
                    <Input
                      id="replace-image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="mt-2"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <Label htmlFor="upload-image">Upload Image</Label>
                  <Input
                    id="upload-image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="mt-2"
                  />
                  {uploading && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bio Section */}
          <Card>
            <CardHeader>
              <CardTitle>Bio / About Description</CardTitle>
              <CardDescription>
                Main content describing the photographer and their work
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={bioText}
                onChange={(e) => setBioText(e.target.value)}
                placeholder="Enter bio text..."
                className="min-h-[200px]"
                maxLength={2000}
              />
              <p className="text-xs text-muted-foreground mt-2">
                {bioText.length} / 2000 characters
              </p>
            </CardContent>
          </Card>

          {/* Services Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Services</CardTitle>
                  <CardDescription>
                    Add, edit, or reorder services offered
                  </CardDescription>
                </div>
                <Button onClick={handleAddService} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {services.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No services added yet. Click "Add Service" to get started.
                </p>
              ) : (
                <div className="space-y-4">
                  {services.map((service, index) => (
                    <Card key={service.id} className="relative">
                      <CardContent className="pt-6 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-4">
                            <div>
                              <Label>Service Title</Label>
                              <Input
                                value={service.title}
                                onChange={(e) => handleUpdateService(service.id, 'title', e.target.value)}
                                placeholder="e.g., Fashion Photography"
                                className="mt-2"
                              />
                            </div>
                            <div>
                              <Label>Description</Label>
                              <Textarea
                                value={service.description}
                                onChange={(e) => handleUpdateService(service.id, 'description', e.target.value)}
                                placeholder="Brief description of the service..."
                                className="mt-2"
                                rows={2}
                              />
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMoveServiceUp(index)}
                              disabled={index === 0}
                            >
                              ↑
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMoveServiceDown(index)}
                              disabled={index === services.length - 1}
                            >
                              ↓
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteService(service.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-4">
            <Button
              variant="outline"
              onClick={() => navigate('/admin/dashboard')}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAboutEdit;
