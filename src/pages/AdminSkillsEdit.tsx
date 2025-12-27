import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, ChevronLeft, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { TechnicalSkill } from '@/types/technicalSkills';
import { SkillCategoryForm } from '@/components/admin/SkillCategoryForm';
import { SkillCategoryList } from '@/components/admin/SkillCategoryList';

const AdminSkillsEdit = () => {
  const { user, isAdmin, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [skills, setSkills] = useState<TechnicalSkill[]>([]);
  const [isLoadingSkills, setIsLoadingSkills] = useState(true);
  const [editingSkill, setEditingSkill] = useState<TechnicalSkill | null>(null);
  const [showForm, setShowForm] = useState(false);

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

  // Load skills
  useEffect(() => {
    if (!user || !isAdmin) return;
    
    loadSkills();
  }, [user, isAdmin]);

  const loadSkills = async () => {
    try {
      const { data, error } = await supabase
        .from('technical_skills')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;

      setSkills(data || []);
    } catch (error) {
      console.error('Error loading skills:', error);
      toast.error('Failed to load skills');
    } finally {
      setIsLoadingSkills(false);
    }
  };

  const handleCreateNew = () => {
    setEditingSkill(null);
    setShowForm(true);
  };

  const handleEdit = (skill: TechnicalSkill) => {
    setEditingSkill(skill);
    setShowForm(true);
  };

  const handleSave = async (skillData: TechnicalSkill | Omit<TechnicalSkill, 'id' | 'created_at'>) => {
    try {
      if ('id' in skillData && editingSkill) {
        // Update existing skill
        const { error } = await supabase
          .from('technical_skills')
          .update({
            category: skillData.category,
            skills: skillData.skills,
            is_visible: skillData.is_visible,
          })
          .eq('id', skillData.id);

        if (error) throw error;

        setSkills(skills.map(s => s.id === skillData.id ? skillData as TechnicalSkill : s));
        toast.success('Skill category updated successfully');
      } else {
        // Create new skill
        const maxOrder = skills.length > 0 
          ? Math.max(...skills.map(s => s.order_index)) 
          : 0;

        const { data, error } = await supabase
          .from('technical_skills')
          .insert({
            category: skillData.category,
            skills: skillData.skills,
            is_visible: skillData.is_visible,
            order_index: maxOrder + 1,
          })
          .select()
          .single();

        if (error) throw error;

        setSkills([...skills, data]);
        toast.success('Skill category created successfully');
      }

      setShowForm(false);
      setEditingSkill(null);
    } catch (error) {
      console.error('Error saving skill:', error);
      toast.error('Failed to save skill category');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingSkill(null);
  };

  const handleDelete = async (skillId: string) => {
    try {
      const { error } = await supabase
        .from('technical_skills')
        .delete()
        .eq('id', skillId);

      if (error) throw error;

      setSkills(skills.filter(s => s.id !== skillId));
      toast.success('Skill category deleted successfully');
    } catch (error) {
      console.error('Error deleting skill:', error);
      toast.error('Failed to delete skill category');
    }
  };

  const handleToggleVisibility = async (skillId: string, isVisible: boolean) => {
    try {
      const { error } = await supabase
        .from('technical_skills')
        .update({ is_visible: isVisible })
        .eq('id', skillId);

      if (error) throw error;

      setSkills(skills.map(s => s.id === skillId ? { ...s, is_visible: isVisible } : s));
      toast.success(`Category ${isVisible ? 'shown' : 'hidden'} successfully`);
    } catch (error) {
      console.error('Error updating visibility:', error);
      toast.error('Failed to update visibility');
    }
  };

  const handleReorder = async (reorderedSkills: TechnicalSkill[]) => {
    // Optimistically update UI
    setSkills(reorderedSkills);

    try {
      // Update order_index for all skills in parallel
      const updates = reorderedSkills.map((skill, index) => 
        supabase
          .from('technical_skills')
          .update({ order_index: index + 1 })
          .eq('id', skill.id)
      );

      const results = await Promise.all(updates);
      
      // Check if any updates failed
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        throw new Error(`Failed to update ${errors.length} skill(s)`);
      }

      toast.success('Categories reordered successfully');
    } catch (error) {
      console.error('Error reordering skills:', error);
      toast.error('Failed to reorder categories');
      // Reload to get correct order
      loadSkills();
    }
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
            Admin / Technical Portfolio / Skills Manager
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold uppercase tracking-wider">
              Skills Manager
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage skill categories displayed in the Technical Portfolio section
            </p>
          </div>
          {!showForm && (
            <Button onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              New Category
            </Button>
          )}
        </div>

        {isLoadingSkills ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : showForm ? (
          <SkillCategoryForm
            skill={editingSkill}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        ) : (
          <SkillCategoryList
            skills={skills}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleVisibility={handleToggleVisibility}
            onReorder={handleReorder}
          />
        )}
      </div>
    </div>
  );
};

export default AdminSkillsEdit;
