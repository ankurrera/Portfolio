import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import PortfolioHeader from "@/components/PortfolioHeader";
import PortfolioFooter from "@/components/PortfolioFooter";
import PageLayout from "@/components/PageLayout";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { Portrait, DEFAULT_PHOTO_WIDTH, DEFAULT_PHOTO_HEIGHT } from "@/types/gallery";
import { Education, Experience } from "@/types/about";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useHeroText } from "@/hooks/useHeroText";
import { useAboutPage } from "@/hooks/useAboutPage";
import { Loader2 } from "lucide-react";

const contactSchema = z.object({
  name: z.string().trim().min(1, { message: "Name is required" }).max(100, { message: "Name must be less than 100 characters" }),
  email: z.string().trim().email({ message: "Invalid email address" }).max(255, { message: "Email must be less than 255 characters" }),
  message: z.string().trim().min(1, { message: "Message is required" }).max(1000, { message: "Message must be less than 1000 characters" }),
});

type ContactFormValues = z.infer<typeof contactSchema>;

const About = () => {
  const [portrait, setPortrait] = useState<Portrait | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [education, setEducation] = useState<Education[]>([]);
  const [experience, setExperience] = useState<Experience[]>([]);
  const [loadingEducation, setLoadingEducation] = useState(true);
  const [loadingExperience, setLoadingExperience] = useState(true);
  const { toast } = useToast();
  const { heroText, loading: heroLoading } = useHeroText('about');
  const { aboutData, loading: aboutLoading } = useAboutPage();

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  });

  const onSubmit = async (data: ContactFormValues) => {
    setIsSubmitting(true);

    // Simulate form submission
    setTimeout(() => {
      toast({
        title: "Message sent",
        description: "Thank you for your inquiry. I'll get back to you soon.",
      });
      form.reset();
      setIsSubmitting(false);
    }, 1000);
  };

  // Load education data
  useEffect(() => {
    const loadEducation = async () => {
      try {
        setLoadingEducation(true);
        const { data, error } = await supabase
          .from('education')
          .select('*')
          .order('display_order', { ascending: true });

        if (error) throw error;
        setEducation(data || []);
      } catch (err) {
        console.error('Error fetching education:', err);
      } finally {
        setLoadingEducation(false);
      }
    };

    loadEducation();
  }, []);

  // Load experience data
  useEffect(() => {
    const loadExperience = async () => {
      try {
        setLoadingExperience(true);
        const { data, error } = await supabase
          .from('experience')
          .select('*')
          .order('display_order', { ascending: true });

        if (error) throw error;
        setExperience(data || []);
      } catch (err) {
        console.error('Error fetching experience:', err);
      } finally {
        setLoadingExperience(false);
      }
    };

    loadExperience();
  }, []);

  useEffect(() => {
    const loadPortrait = async () => {
      try {
        // First, try to use the profile image from about_page
        if (aboutData?.profile_image_url) {
          setPortrait({
            src: aboutData.profile_image_url,
            alt: 'Portrait',
            width: DEFAULT_PHOTO_WIDTH,
            height: DEFAULT_PHOTO_HEIGHT,
          });
          setLoading(false);
          return;
        }

        // Fallback: Fetch a portrait from Supabase uploads
        const { data, error: fetchError } = await supabase
          .from('photos')
          .select('*')
          .eq('is_draft', false)
          .order('display_order', { ascending: true })
          .limit(1);

        if (fetchError) throw fetchError;

        if (data && data.length > 0) {
          const photo = data[0];
          setPortrait({
            src: photo.image_url,
            alt: photo.title || 'Portrait',
            width: photo.width || DEFAULT_PHOTO_WIDTH,
            height: photo.height || DEFAULT_PHOTO_HEIGHT,
          });
        }
      } catch (err) {
        console.error('Error fetching portrait:', err);
      } finally {
        setLoading(false);
      }
    };

    // Only load portrait when aboutData is ready
    if (!aboutLoading) {
      loadPortrait();
    }
  }, [aboutData, aboutLoading]);

  return (
    <PageLayout>
      <SEO
        title="About - Ankur Bag"
        description="Learn about Ankur Bag, a production photographer specializing in fashion, editorial, and commercial photography."
        canonicalUrl="/about"
      />

      <PortfolioHeader
        activeCategory="ABOUT"
      />
      
      <main className="flex-1">
        <section className="max-w-[1600px] mx-auto pt-20 pb-12 md:pt-24 md:pb-16">
          <div className="text-center space-y-8 mb-16 px-3 md:px-5 max-w-2xl mx-auto">
            {heroLoading ? (
              <div className="flex items-center justify-center min-h-[200px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                <h1 className="font-playfair text-4xl md:text-5xl text-foreground">
                  {heroText?.hero_title || 'Ankur Bag'}
                </h1>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-inter">
                  {heroText?.hero_subtitle || 'PRODUCTION & PHOTOGRAPHY'}
                </p>
              </div>
            )}

            {/* Portrait */}
            {!loading && portrait && (
              <div className="max-w-xs mx-auto border border-foreground/10 overflow-hidden">
                <picture className="relative block">
                  {portrait.width && portrait.height && (
                    <svg
                      width={portrait.width}
                      height={portrait.height}
                      viewBox={`0 0 ${portrait.width} ${portrait.height}`}
                      className="w-full h-auto"
                    >
                      <rect
                        width={portrait.width}
                        height={portrait.height}
                        fill="white"
                      />
                    </svg>
                  )}
                  <img
                    src={portrait.src}
                    alt={portrait.alt}
                    className="absolute top-0 left-0 w-full h-auto grayscale"
                    style={{
                      opacity: loading ? 0 : 1,
                      transition: 'opacity 0.5s ease-out'
                    }}
                  />
                </picture>
              </div>
            )}
          </div>

          {/* Bio Section */}
          <div className="max-w-2xl mx-auto px-3 md:px-5 space-y-8 text-center text-foreground/80 text-sm leading-relaxed mb-16">
            {aboutLoading ? (
              <div className="flex items-center justify-center min-h-[200px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : aboutData?.bio_text ? (
              // Display bio from database, preserving line breaks
              aboutData.bio_text.split('\n').map((paragraph, index) => (
                paragraph.trim() && <p key={index}>{paragraph}</p>
              ))
            ) : (
              // Fallback content
              <>
                <p>
                  Production photographer specializing in fashion, editorial, and commercial photography.
                  Creating compelling imagery with technical precision and creative vision for global brands
                  and publications.
                </p>

                <p>
                  Full production services including art buying, location scouting, casting, and on-set
                  management. Collaborative approach ensuring seamless execution from concept to delivery.
                </p>
              </>
            )}

            {/* Services Section */}
            {!aboutLoading && aboutData?.services && Array.isArray(aboutData.services) && aboutData.services.length > 0 && (
              <div className="pt-8">
                <h2 className="font-playfair text-xl text-foreground mb-4">Services</h2>
                <div className="space-y-4">
                  {aboutData.services.map((service) => (
                    <div key={service.id} className="text-left border-l-2 border-foreground/20 pl-4">
                      <h3 className="font-semibold text-foreground mb-1">{service.title}</h3>
                      <p className="text-foreground/70 text-xs">{service.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Show fallback services if no services in database */}
            {!aboutLoading && (!aboutData?.services || !Array.isArray(aboutData.services) || aboutData.services.length === 0) && (
              <div className="pt-8">
                <h2 className="font-playfair text-xl text-foreground mb-4">Services</h2>
                <p className="text-foreground/70 text-xs uppercase tracking-wider leading-loose">
                  Fashion & Editorial Photography / Commercial Production / Art Buying & Creative Direction /
                  Location Scouting / Casting & Talent Coordination
                </p>
              </div>
            )}

            {/* Education & Experience Section */}
            {(!loadingEducation || !loadingExperience) && (education.length > 0 || experience.length > 0) && (
              <div className="pt-16 space-y-12">
                {/* Education Section */}
                {education.length > 0 && (
                  <div>
                    <h2 className="font-playfair text-2xl text-foreground mb-8">Education</h2>
                    <div className="space-y-6">
                      {education.map((edu) => (
                        <div key={edu.id} className="flex items-start gap-4 text-left">
                          {/* Logo */}
                          <div className="flex-shrink-0 w-16 h-16 md:w-20 md:h-20">
                            <img
                              src={edu.logo_url}
                              alt={edu.institution_name}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          
                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground text-base">
                              {edu.institution_name}
                            </h3>
                            <p className="text-foreground/70 text-sm mt-1">
                              {edu.degree}
                            </p>
                          </div>
                          
                          {/* Year */}
                          <div className="flex-shrink-0 text-right">
                            <p className="text-foreground/60 text-sm">
                              {edu.start_year} - {edu.end_year}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Experience Section */}
                {experience.length > 0 && (
                  <div>
                    <h2 className="font-playfair text-2xl text-foreground mb-8">Experience</h2>
                    <div className="space-y-6">
                      {experience.map((exp) => (
                        <div key={exp.id} className="flex items-start gap-4 text-left">
                          {/* Logo */}
                          <div className="flex-shrink-0 w-16 h-16 md:w-20 md:h-20">
                            <img
                              src={exp.logo_url}
                              alt={exp.company_name}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          
                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground text-base">
                              {exp.company_name}
                            </h3>
                            <p className="text-foreground/70 text-sm mt-1">
                              {exp.role}
                            </p>
                          </div>
                          
                          {/* Duration */}
                          <div className="flex-shrink-0 text-right">
                            <p className="text-foreground/60 text-sm">
                              {exp.start_date} - {exp.end_date || 'Present'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="pt-4">
              <h2 className="font-playfair text-xl text-foreground mb-4">Select Clients</h2>
              <p className="text-foreground/70 text-xs uppercase tracking-wider leading-loose">
                Various fashion brands and editorial publications
              </p>
            </div>
          </div>

          {/* Contact Form Section */}
          <div className="max-w-xl mx-auto px-3 md:px-5 pt-16">
            <div className="text-center space-y-4 mb-12">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-inter">
                INQUIRIES
              </p>
              <h2 className="font-playfair text-4xl md:text-5xl text-foreground">
                Contact
              </h2>
              <p className="text-foreground/80 text-sm leading-relaxed">
                For project inquiries and collaborations.
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm uppercase tracking-wider text-foreground/70 font-inter">
                        Name *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Your name"
                          className="border-0 border-b border-foreground/20 rounded-none bg-transparent text-foreground px-0 focus-visible:ring-0 focus-visible:border-foreground transition-colors"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm uppercase tracking-wider text-foreground/70 font-inter">
                        Email *
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="your@email.com"
                          className="border-0 border-b border-foreground/20 rounded-none bg-transparent text-foreground px-0 focus-visible:ring-0 focus-visible:border-foreground transition-colors"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm uppercase tracking-wider text-foreground/70 font-inter">
                        Message *
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell me about your project..."
                          className="border-0 border-b border-foreground/20 rounded-none bg-transparent text-foreground min-h-[150px] px-0 focus-visible:ring-0 focus-visible:border-foreground transition-colors resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-4 text-center">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    variant="outline"
                    className="w-full md:w-auto px-12 py-6 text-sm uppercase tracking-widest font-inter border-foreground/40 hover:bg-foreground hover:text-background transition-all"
                  >
                    {isSubmitting ? "Sending..." : "Send"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </section>
      </main>

      <PortfolioFooter />
    </PageLayout>
  );
};

export default About;
