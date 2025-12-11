import { motion } from 'motion/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, MapPin, Github, Linkedin, Twitter } from 'lucide-react';
import { useState } from 'react';

const MinimalContact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

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
    },
    {
      icon: MapPin,
      label: 'India',
      value: 'Kolkata, WB',
      href: '#'
    }
  ];

  const socialLinks = [
    { icon: Github, href: '#', label: 'GitHub' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Twitter, href: '#', label: 'Twitter' }
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

            {/* Social Links */}
            <div className="space-y-4">
              <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                Connect
              </div>
              <div className="flex gap-4">
                {socialLinks.map((social) => (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-3 rounded-lg border border-border/50 hover:border-border hover:bg-muted/20 transition-all"
                    aria-label={social.label}
                  >
                    <social.icon className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
                  </motion.a>
                ))}
              </div>
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
