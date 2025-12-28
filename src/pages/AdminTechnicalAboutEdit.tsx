import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { TechnicalAbout } from '@/types/technicalAbout';
import { TechnicalAboutForm } from '@/components/admin/TechnicalAboutForm';

const AdminTechnicalAboutEdit = () => {
  const { user, isAdmin, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [aboutData, setAboutData] = useState<TechnicalAbout | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

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

  // Load about data
  useEffect(() => {
    if (!user || !isAdmin) return;
    
    const createDefaultAboutData = async () => {
      try {
        const defaultData = {
          section_label: 'About',
          heading: 'Who Am I?',
          content_blocks: [
            "I'm a passionate full-stack Web developer with over 1 year of experience creating digital solutions that matter.",
            "My journey began with a curiosity about how things work. Today, I specialize in building scalable web applications, integrating AI capabilities, and crafting user experiences that feel natural and intuitive.",
            "When I'm not coding, you'll find me exploring new technologies, contributing to open source projects, or sharing knowledge with the developer community."
          ],
          stats: [
            { value: "10+", label: "Projects Delivered" },
            { value: "9+", label: "Happy Clients" }
          ]
        };

        const { data, error } = await supabase
          .from('technical_about')
          .insert(defaultData)
          .select()
          .single();

        if (error) throw error;

        setAboutData(data as TechnicalAbout);
        toast.success('Default about section created');
      } catch (error) {
        console.error('Error creating default about data:', error);
        toast.error('Failed to create default about section');
      } finally {
        setIsLoadingData(false);
      }
    };

    const loadAboutData = async () => {
      try {
        const { data, error } = await supabase
          .from('technical_about')
          .select('*')
          .single();

        if (error) {
          // If no data exists, create default entry
          if (error.code === 'PGRST116') {
            await createDefaultAboutData();
            return;
          }
          throw error;
        }

        setAboutData(data as TechnicalAbout);
      } catch (error) {
        console.error('Error loading about data:', error);
        toast.error('Failed to load about section data');
      } finally {
        setIsLoadingData(false);
      }
    };

    loadAboutData();
  }, [user, isAdmin]);

  const handleSave = async (data: Partial<TechnicalAbout>) => {
    try {
      if (aboutData?.id) {
        // Update existing entry
        const { error } = await supabase
          .from('technical_about')
          .update({
            section_label: data.section_label,
            heading: data.heading,
            content_blocks: data.content_blocks,
            stats: data.stats,
          })
          .eq('id', aboutData.id);

        if (error) throw error;

        setAboutData({ ...aboutData, ...data } as TechnicalAbout);
        toast.success('About section updated successfully');
      } else {
        // Create new entry
        const { data: newData, error } = await supabase
          .from('technical_about')
          .insert({
            section_label: data.section_label,
            heading: data.heading,
            content_blocks: data.content_blocks,
            stats: data.stats,
          })
          .select()
          .single();

        if (error) throw error;

        setAboutData(newData as TechnicalAbout);
        toast.success('About section created successfully');
      }
    } catch (error) {
      console.error('Error saving about section:', error);
      toast.error('Failed to save about section');
    }
  };

  const handleCancel = () => {
    navigate('/admin/dashboard');
  };

  if (isLoading) {
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
    <div className="flex flex-col min-h-screen bg-background">
      {/* Breadcrumb Navigation */}
      <div className="border-b border-border bg-background z-40">
        <div className="container mx-auto px-4 py-3">
          <Link 
            to="/admin/dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <div className="mt-2 text-xs text-muted-foreground">
            Admin / Technical Portfolio / About Section
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold uppercase tracking-wider">
            About Section Manager
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage the About section content displayed on the Technical Portfolio page
          </p>
        </div>

        {isLoadingData ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <TechnicalAboutForm
            aboutData={aboutData}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}
      </div>
    </div>
  );
};

export default AdminTechnicalAboutEdit;
