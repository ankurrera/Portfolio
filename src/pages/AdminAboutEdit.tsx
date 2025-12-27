import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Plus, Trash2, Upload, X, ChevronUp, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { AboutPage, Service, Education, Experience } from '@/types/about';

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
  const [heroTitle, setHeroTitle] = useState<string>('');
  const [heroSubtitle, setHeroSubtitle] = useState<string>('');
  
  // Education and Experience
  const [education, setEducation] = useState<Education[]>([]);
  const [experience, setExperience] = useState<Experience[]>([]);
  const [educationLoading, setEducationLoading] = useState(true);
  const [experienceLoading, setExperienceLoading] = useState(true);

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
    loadEducation();
    loadExperience();
  }, [user, isAdmin]);

  const loadEducation = async () => {
    try {
      setEducationLoading(true);
      const { data, error } = await supabase
        .from('education')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setEducation(data || []);
    } catch (error) {
      console.error('Error loading education:', error);
      toast.error('Failed to load education data');
    } finally {
      setEducationLoading(false);
    }
  };

  const loadExperience = async () => {
    try {
      setExperienceLoading(true);
      const { data, error } = await supabase
        .from('experience')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setExperience(data || []);
    } catch (error) {
      console.error('Error loading experience:', error);
      toast.error('Failed to load experience data');
    } finally {
      setExperienceLoading(false);
    }
  };

  const loadAboutData = async () => {
    try {
      setLoading(true);
      
      // Load about page data
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
      
      // Load hero text for about page
      const { data: heroData, error: heroError } = await supabase
        .from('hero_text')
        .select('*')
        .eq('page_slug', 'about')
        .single();
        
      if (heroError && heroError.code !== 'PGRST116') {
        console.error('Error loading hero text:', heroError);
      }
      
      if (heroData) {
        setHeroTitle(heroData.hero_title || '');
        setHeroSubtitle(heroData.hero_subtitle || '');
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

  // Education CRUD operations
  const handleAddEducation = () => {
    const newEducation: Education = {
      id: crypto.randomUUID(),
      logo_url: '',
      institution_name: '',
      degree: '',
      start_year: '',
      end_year: '',
      display_order: education.length
    };
    setEducation([...education, newEducation]);
  };

  const handleUpdateEducation = (id: string, field: keyof Education, value: string | number) => {
    setEducation(education.map(edu => 
      edu.id === id ? { ...edu, [field]: value } : edu
    ));
  };

  const handleDeleteEducation = async (id: string) => {
    // If it's a new item (UUID format), just remove from state
    if (id.includes('-')) {
      setEducation(education.filter(edu => edu.id !== id));
      return;
    }

    // Otherwise, delete from database
    try {
      const { error } = await supabase
        .from('education')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadEducation();
      toast.success('Education entry deleted');
    } catch (error) {
      console.error('Error deleting education:', error);
      toast.error('Failed to delete education entry');
    }
  };

  const handleMoveEducationUp = (index: number) => {
    if (index === 0) return;
    const newEducation = [...education];
    [newEducation[index - 1], newEducation[index]] = [newEducation[index], newEducation[index - 1]];
    // Update display_order
    newEducation.forEach((edu, idx) => {
      edu.display_order = idx;
    });
    setEducation(newEducation);
  };

  const handleMoveEducationDown = (index: number) => {
    if (index === education.length - 1) return;
    const newEducation = [...education];
    [newEducation[index], newEducation[index + 1]] = [newEducation[index + 1], newEducation[index]];
    // Update display_order
    newEducation.forEach((edu, idx) => {
      edu.display_order = idx;
    });
    setEducation(newEducation);
  };

  const handleEducationImageUpload = async (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `education-${Date.now()}.${fileExt}`;
      const filePath = `about/education/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(filePath);

      handleUpdateEducation(education[index].id, 'logo_url', publicUrl);
      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveEducation = async () => {
    try {
      setSaving(true);

      // Validate all education entries
      for (const edu of education) {
        if (!edu.logo_url || !edu.institution_name || !edu.degree || !edu.start_year || !edu.end_year) {
          toast.error('Please fill all education fields');
          return;
        }
      }

      // Delete all existing education and insert new ones (simpler than update logic)
      const { error: deleteError } = await supabase
        .from('education')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (deleteError) throw deleteError;

      // Insert all education entries
      const educationToInsert = education.map((edu, index) => ({
        logo_url: edu.logo_url,
        institution_name: edu.institution_name,
        degree: edu.degree,
        start_year: edu.start_year,
        end_year: edu.end_year,
        display_order: index
      }));

      const { error: insertError } = await supabase
        .from('education')
        .insert(educationToInsert);

      if (insertError) throw insertError;

      await loadEducation();
      toast.success('Education saved successfully');
    } catch (error) {
      console.error('Error saving education:', error);
      toast.error('Failed to save education');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  // Experience CRUD operations
  const handleAddExperience = () => {
    const newExperience: Experience = {
      id: crypto.randomUUID(),
      logo_url: '',
      company_name: '',
      role: '',
      start_date: '',
      end_date: null,
      display_order: experience.length
    };
    setExperience([...experience, newExperience]);
  };

  const handleUpdateExperience = (id: string, field: keyof Experience, value: string | number | null) => {
    setExperience(experience.map(exp => 
      exp.id === id ? { ...exp, [field]: value } : exp
    ));
  };

  const handleDeleteExperience = async (id: string) => {
    // If it's a new item (UUID format), just remove from state
    if (id.includes('-')) {
      setExperience(experience.filter(exp => exp.id !== id));
      return;
    }

    // Otherwise, delete from database
    try {
      const { error } = await supabase
        .from('experience')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadExperience();
      toast.success('Experience entry deleted');
    } catch (error) {
      console.error('Error deleting experience:', error);
      toast.error('Failed to delete experience entry');
    }
  };

  const handleMoveExperienceUp = (index: number) => {
    if (index === 0) return;
    const newExperience = [...experience];
    [newExperience[index - 1], newExperience[index]] = [newExperience[index], newExperience[index - 1]];
    // Update display_order
    newExperience.forEach((exp, idx) => {
      exp.display_order = idx;
    });
    setExperience(newExperience);
  };

  const handleMoveExperienceDown = (index: number) => {
    if (index === experience.length - 1) return;
    const newExperience = [...experience];
    [newExperience[index], newExperience[index + 1]] = [newExperience[index + 1], newExperience[index]];
    // Update display_order
    newExperience.forEach((exp, idx) => {
      exp.display_order = idx;
    });
    setExperience(newExperience);
  };

  const handleExperienceImageUpload = async (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `experience-${Date.now()}.${fileExt}`;
      const filePath = `about/experience/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(filePath);

      handleUpdateExperience(experience[index].id, 'logo_url', publicUrl);
      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveExperience = async () => {
    try {
      setSaving(true);

      // Validate all experience entries
      for (const exp of experience) {
        if (!exp.logo_url || !exp.company_name || !exp.role || !exp.start_date) {
          toast.error('Please fill all required experience fields');
          return;
        }
      }

      // Delete all existing experience and insert new ones
      const { error: deleteError } = await supabase
        .from('experience')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (deleteError) throw deleteError;

      // Insert all experience entries
      const experienceToInsert = experience.map((exp, index) => ({
        logo_url: exp.logo_url,
        company_name: exp.company_name,
        role: exp.role,
        start_date: exp.start_date,
        end_date: exp.end_date || null,
        display_order: index
      }));

      const { error: insertError } = await supabase
        .from('experience')
        .insert(experienceToInsert);

      if (insertError) throw insertError;

      await loadExperience();
      toast.success('Experience saved successfully');
    } catch (error) {
      console.error('Error saving experience:', error);
      toast.error('Failed to save experience');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Save about page data
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
      
      // Save hero text for about page using upsert
      const heroUpdateData = {
        page_slug: 'about',
        hero_title: heroTitle || null,
        hero_subtitle: heroSubtitle || null
      };
      
      // Use upsert to insert or update based on page_slug uniqueness
      const { error: heroError } = await supabase
        .from('hero_text')
        .upsert(heroUpdateData, {
          onConflict: 'page_slug'
        });
        
      if (heroError) throw heroError;

      // Save education
      if (education.length > 0) {
        await handleSaveEducation();
      }

      // Save experience
      if (experience.length > 0) {
        await handleSaveExperience();
      }

      toast.success('About page updated successfully');
      await loadAboutData();
      await loadEducation();
      await loadExperience();
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
          {/* Hero Section */}
          <Card>
            <CardHeader>
              <CardTitle>Hero Section</CardTitle>
              <CardDescription>
                Edit the title and subtitle displayed at the top of the About page
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="hero-title">Hero Title</Label>
                <Input
                  id="hero-title"
                  value={heroTitle}
                  onChange={(e) => setHeroTitle(e.target.value)}
                  placeholder="e.g., Ankur Bag"
                  className="mt-2"
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {heroTitle.length} / 100 characters
                </p>
              </div>
              <div>
                <Label htmlFor="hero-subtitle">Hero Subtitle</Label>
                <Input
                  id="hero-subtitle"
                  value={heroSubtitle}
                  onChange={(e) => setHeroSubtitle(e.target.value)}
                  placeholder="e.g., PRODUCTION & PHOTOGRAPHY"
                  className="mt-2"
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {heroSubtitle.length} / 200 characters
                </p>
              </div>
            </CardContent>
          </Card>

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

          {/* Education Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Education</CardTitle>
                  <CardDescription>
                    Add, edit, or reorder education history
                  </CardDescription>
                </div>
                <Button onClick={handleAddEducation} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Education
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {educationLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : education.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No education entries yet. Click "Add Education" to get started.
                </p>
              ) : (
                <div className="space-y-4">
                  {education.map((edu, index) => (
                    <Card key={edu.id} className="relative">
                      <CardContent className="pt-6 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-4">
                            <div>
                              <Label>Logo</Label>
                              {edu.logo_url ? (
                                <div className="mt-2 flex items-center gap-4">
                                  <img src={edu.logo_url} alt="Logo" className="h-16 w-16 object-contain border rounded" />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleUpdateEducation(edu.id, 'logo_url', '')}
                                  >
                                    Remove
                                  </Button>
                                </div>
                              ) : (
                                <Input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleEducationImageUpload(index, e)}
                                  className="mt-2"
                                  disabled={uploading}
                                />
                              )}
                            </div>
                            <div>
                              <Label>Institution Name</Label>
                              <Input
                                value={edu.institution_name}
                                onChange={(e) => handleUpdateEducation(edu.id, 'institution_name', e.target.value)}
                                placeholder="e.g., University of Arts"
                                className="mt-2"
                              />
                            </div>
                            <div>
                              <Label>Degree / Board</Label>
                              <Input
                                value={edu.degree}
                                onChange={(e) => handleUpdateEducation(edu.id, 'degree', e.target.value)}
                                placeholder="e.g., Bachelor of Fine Arts"
                                className="mt-2"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Start Year</Label>
                                <Input
                                  value={edu.start_year}
                                  onChange={(e) => handleUpdateEducation(edu.id, 'start_year', e.target.value)}
                                  placeholder="e.g., 2015"
                                  className="mt-2"
                                />
                              </div>
                              <div>
                                <Label>End Year</Label>
                                <Input
                                  value={edu.end_year}
                                  onChange={(e) => handleUpdateEducation(edu.id, 'end_year', e.target.value)}
                                  placeholder="e.g., 2019"
                                  className="mt-2"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMoveEducationUp(index)}
                              disabled={index === 0}
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMoveEducationDown(index)}
                              disabled={index === education.length - 1}
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteEducation(edu.id)}
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

          {/* Experience Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Experience</CardTitle>
                  <CardDescription>
                    Add, edit, or reorder work experience
                  </CardDescription>
                </div>
                <Button onClick={handleAddExperience} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Experience
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {experienceLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : experience.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No experience entries yet. Click "Add Experience" to get started.
                </p>
              ) : (
                <div className="space-y-4">
                  {experience.map((exp, index) => (
                    <Card key={exp.id} className="relative">
                      <CardContent className="pt-6 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-4">
                            <div>
                              <Label>Logo</Label>
                              {exp.logo_url ? (
                                <div className="mt-2 flex items-center gap-4">
                                  <img src={exp.logo_url} alt="Logo" className="h-16 w-16 object-contain border rounded" />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleUpdateExperience(exp.id, 'logo_url', '')}
                                  >
                                    Remove
                                  </Button>
                                </div>
                              ) : (
                                <Input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleExperienceImageUpload(index, e)}
                                  className="mt-2"
                                  disabled={uploading}
                                />
                              )}
                            </div>
                            <div>
                              <Label>Company Name</Label>
                              <Input
                                value={exp.company_name}
                                onChange={(e) => handleUpdateExperience(exp.id, 'company_name', e.target.value)}
                                placeholder="e.g., Tech Company Inc."
                                className="mt-2"
                              />
                            </div>
                            <div>
                              <Label>Role / Work Done</Label>
                              <Textarea
                                value={exp.role}
                                onChange={(e) => handleUpdateExperience(exp.id, 'role', e.target.value)}
                                placeholder="e.g., Senior Designer"
                                className="mt-2"
                                rows={2}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Start Date (YYYY-MM)</Label>
                                <Input
                                  value={exp.start_date}
                                  onChange={(e) => handleUpdateExperience(exp.id, 'start_date', e.target.value)}
                                  placeholder="e.g., 2020-01"
                                  className="mt-2"
                                />
                              </div>
                              <div>
                                <Label>End Date (YYYY-MM or leave empty for current)</Label>
                                <Input
                                  value={exp.end_date || ''}
                                  onChange={(e) => handleUpdateExperience(exp.id, 'end_date', e.target.value || null)}
                                  placeholder="e.g., 2023-12 or leave empty"
                                  className="mt-2"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMoveExperienceUp(index)}
                              disabled={index === 0}
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMoveExperienceDown(index)}
                              disabled={index === experience.length - 1}
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteExperience(exp.id)}
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
