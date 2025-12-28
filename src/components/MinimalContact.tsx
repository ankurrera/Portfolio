import { motion } from 'motion/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail } from 'lucide-react';
import { useState, useEffect } from 'react';
import TechnicalSocialLinks from '@/components/TechnicalSocialLinks';
import { LocationMap } from '@/components/ui/expand-map';
import { supabase } from '@/integrations/supabase/client';

const MinimalContact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const [locationData, setLocationData] = useState<{ location: string; coordinates: string }>({
    location: 'Kolkata, WB',
    coordinates: '22.5726° N, 88.3639° E'
  });

  useEffect(() => {
    const fetchLocationData = async () => {
      const { data, error } = await supabase
        .from('technical_about')
        .select('location, coordinates')
        .single();

      if (error) {
        console.error('Failed to fetch location data from database:', error);
        return;
      }

      if (data) {
        setLocationData({
          location: data.location || 'Kolkata, WB',
          coordinates: data.coordinates || '22.5726° N, 88.3639° E'
        });
      }
    };

    fetchLocationData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
  };

  const contactMethods = [
    {
      icon: Mail,
      label: 'Email',
      value: 'ankurr.era@gmail.com',
      href: 'mailto:ankurr.era@gmail.com'
    }
  ];

  return (
    <section id="contact" className="py-section bg-background">
      <div className="max-w-content mx-auto px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <div className="text-xs font-mono tracking-widest text-muted-foreground uppercase mb-4">
            Contact
          </div>
          <h2 className="text-section font-heading font-light text-foreground">
            Let's Work Together
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-12"
          >
            <div className="space-y-6">
              <p className="text-lg font-light text-foreground leading-relaxed">
                Have a project in mind? Let's discuss how we can bring your ideas to life.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                I'm always interested in new opportunities and collaborations. 
                Whether you need a full-stack developer, technical consultant, 
                or just want to chat about technology, I'd love to hear from you.
              </p>
            </div>

            {/* Contact Methods */}
            <div className="space-y-4">
              {contactMethods.map((method, index) => (
                <motion.a
                  key={method.label}
                  href={method.href}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex items-center gap-4 p-4 rounded-lg border border-border/50 hover:border-border hover:bg-muted/20 transition-all group"
                >
                  <method.icon className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  <div>
                    <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                      {method.label}
                    </div>
                    <div className="text-sm font-medium text-foreground">
                      {method.value}
                    </div>
                  </div>
                </motion.a>
              ))}
            </div>

            {/* Location Map */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="space-y-4"
            >
              <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                Location
              </div>
              <LocationMap 
                location={locationData.location}
                coordinates={locationData.coordinates}
              />
            </motion.div>

            {/* Social Links */}
            <div className="space-y-4">
              <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                Connect
              </div>
              <TechnicalSocialLinks />
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="minimal-card bg-card/50">
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium text-foreground">
                        Name
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Your name"
                        className="border-border/50 focus:border-border bg-background/50"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-foreground">
                        Email
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="your@email.com"
                        className="border-border/50 focus:border-border bg-background/50"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-sm font-medium text-foreground">
                        Message
                      </Label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        placeholder="Tell me about your project..."
                        rows={6}
                        className="border-border/50 focus:border-border bg-background/50 resize-none"
                        required
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    size="lg"
                  >
                    Send Message
                  </Button>
                </form>

                <div className="mt-6 p-4 rounded-lg bg-muted/30 border border-border/30">
                  <p className="text-xs text-muted-foreground text-center">
                    I'll get back to you within 24 hours
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default MinimalContact;
