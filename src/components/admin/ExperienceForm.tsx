import { useState } from 'react';
import { Experience } from '@/types/experience';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ExperienceFormProps {
  experience?: Experience | null;
  onSave: (experience: Experience) => void;
  onCancel: () => void;
}

const ExperienceForm = ({ experience, onSave, onCancel }: ExperienceFormProps) => {
  const [roleTitle, setRoleTitle] = useState(experience?.role_title || '');
  const [companyName, setCompanyName] = useState(experience?.company_name || '');
  const [employmentType, setEmploymentType] = useState(experience?.employment_type || '');
  const [startDate, setStartDate] = useState(experience?.start_date || '');
  const [endDate, setEndDate] = useState(experience?.end_date || '');
  const [isCurrent, setIsCurrent] = useState(experience?.is_current || false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!roleTitle.trim()) {
      toast.error('Please enter a role title');
      return;
    }
    
    if (!companyName.trim()) {
      toast.error('Please enter a company name');
      return;
    }

    if (!startDate.trim()) {
      toast.error('Please enter a start date');
      return;
    }

    setIsSaving(true);
    try {
      if (experience) {
        // Update existing experience
        const updates = {
          role_title: roleTitle.trim(),
          company_name: companyName.trim(),
          employment_type: employmentType.trim() || null,
          start_date: startDate.trim(),
          end_date: isCurrent ? null : (endDate.trim() || null),
          is_current: isCurrent,
        };

        const { data, error } = await supabase
          .from('experience')
          .update(updates)
          .eq('id', experience.id)
          .select()
          .single();

        if (error) throw error;
        
        onSave(data as Experience);
        toast.success('Experience updated successfully');
      } else {
        // Create new experience - get max display_order first
        const { data: maxOrderData } = await supabase
          .from('experience')
          .select('display_order')
          .order('display_order', { ascending: false })
          .limit(1)
          .single();
        
        const nextOrder = maxOrderData ? maxOrderData.display_order + 1 : 1;
        
        const insert = {
          role_title: roleTitle.trim(),
          company_name: companyName.trim(),
          employment_type: employmentType.trim() || null,
          start_date: startDate.trim(),
          end_date: isCurrent ? null : (endDate.trim() || null),
          is_current: isCurrent,
          display_order: nextOrder,
        };

        const { data, error } = await supabase
          .from('experience')
          .insert(insert)
          .select()
          .single();

        if (error) throw error;
        
        onSave(data as Experience);
        toast.success('Experience created successfully');
      }
    } catch (error) {
      console.error('Error saving experience:', error);
      toast.error('Failed to save experience');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{experience ? 'Edit Experience' : 'New Experience'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Role Title */}
          <div className="space-y-2">
            <Label htmlFor="roleTitle">Role Title *</Label>
            <Input
              id="roleTitle"
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
              placeholder="Website Developer"
              required
            />
          </div>

          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name *</Label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Digital Indian pvt Solution"
              required
            />
          </div>

          {/* Employment Type */}
          <div className="space-y-2">
            <Label htmlFor="employmentType">Employment Type</Label>
            <Select value={employmentType} onValueChange={setEmploymentType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                <SelectItem value="Full-time">Full-time</SelectItem>
                <SelectItem value="Part-time">Part-time</SelectItem>
                <SelectItem value="Freelance">Freelance</SelectItem>
                <SelectItem value="Contract">Contract</SelectItem>
                <SelectItem value="Internship">Internship</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="MM/YYYY or YYYY"
                required
              />
              <p className="text-xs text-muted-foreground">Format: MM/YYYY or YYYY</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="MM/YYYY or YYYY"
                disabled={isCurrent}
              />
              <p className="text-xs text-muted-foreground">Leave empty if current</p>
            </div>
          </div>

          {/* Current Position Switch */}
          <div className="flex items-center justify-between space-x-2 py-2">
            <div className="space-y-0.5">
              <Label htmlFor="isCurrent">Currently Working Here</Label>
              <p className="text-xs text-muted-foreground">
                Will display "Present" on the public site
              </p>
            </div>
            <Switch
              id="isCurrent"
              checked={isCurrent}
              onCheckedChange={(checked) => {
                setIsCurrent(checked);
                if (checked) {
                  setEndDate('');
                }
              }}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : experience ? 'Update Experience' : 'Create Experience'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ExperienceForm;
