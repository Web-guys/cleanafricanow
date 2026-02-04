import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Quote, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

const testimonials = [
  {
    id: 1,
    name: "Amina Benali",
    role: "Environmental Activist",
    location: "Casablanca",
    content: "CleanAfricaNow has transformed how we report environmental issues. The municipality now responds within days instead of weeks!",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Amina&backgroundColor=b6e3f4",
    rating: 5,
  },
  {
    id: 2,
    name: "Youssef El Mansouri",
    role: "City Council Member",
    location: "Rabat",
    content: "The AI-powered priority scoring helps us allocate resources efficiently. We've resolved 40% more reports this quarter.",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Youssef&backgroundColor=c0aede",
    rating: 5,
  },
  {
    id: 3,
    name: "Fatima Zahra",
    role: "Community Leader",
    location: "Marrakech",
    content: "Our neighborhood is cleaner than ever. The real-time tracking keeps everyone accountable and motivated.",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Fatima&backgroundColor=d1d4f9",
    rating: 5,
  },
  {
    id: 4,
    name: "Karim Benjelloun",
    role: "NGO Director",
    location: "Tangier",
    content: "We've been able to coordinate cleanup events much more effectively. The community engagement features are amazing!",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Karim&backgroundColor=ffd5dc",
    rating: 5,
  },
];

export const TestimonialsSection = () => {
  const { t } = useTranslation();
  const { ref, isVisible } = useScrollAnimation();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-rotate testimonials
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToNext = () => {
    setIsAutoPlaying(false);
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  const goToPrev = () => {
    setIsAutoPlaying(false);
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section className="py-24 bg-gradient-to-b from-muted/30 to-background dark:from-muted/10 dark:to-background relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-secondary/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10" ref={ref}>
        <div className={cn(
          "text-center mb-16 opacity-0",
          isVisible && "animate-fade-in"
        )}>
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
            <Quote className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Real Stories</span>
          </div>
          <h3 className="text-3xl md:text-5xl font-bold mb-4 text-foreground">
            {t('testimonials.title', 'Voices from the Community')}
          </h3>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('testimonials.subtitle', 'See how CleanAfricaNow is making a difference across Morocco')}
          </p>
        </div>

        {/* Featured Testimonial - Large */}
        <div className={cn(
          "max-w-4xl mx-auto mb-12 opacity-0",
          isVisible && "animate-slide-up"
        )} style={{ animationDelay: "200ms" }}>
          <Card className="relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-card to-muted/20 shadow-2xl">
            {/* Decorative quote */}
            <Quote className="absolute top-6 right-6 h-24 w-24 text-primary/5" />
            
            <CardContent className="p-8 md:p-12">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                {/* Avatar */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-full blur-xl opacity-30 animate-pulse-glow" />
                  <Avatar className="h-28 w-28 md:h-32 md:w-32 border-4 border-primary/20 relative">
                    <AvatarImage src={testimonials[activeIndex].avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                      {testimonials[activeIndex].name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                {/* Content */}
                <div className="flex-1 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-1 mb-4">
                    {[...Array(testimonials[activeIndex].rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-warning text-warning" />
                    ))}
                  </div>
                  
                  <blockquote className="text-xl md:text-2xl text-foreground mb-6 leading-relaxed font-medium">
                    "{testimonials[activeIndex].content}"
                  </blockquote>
                  
                  <div>
                    <p className="font-bold text-lg text-foreground">
                      {testimonials[activeIndex].name}
                    </p>
                    <p className="text-muted-foreground">
                      {testimonials[activeIndex].role} • {testimonials[activeIndex].location}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation & Dots */}
        <div className={cn(
          "flex items-center justify-center gap-4 opacity-0",
          isVisible && "animate-fade-in"
        )} style={{ animationDelay: "400ms" }}>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={goToPrev}
            className="rounded-full"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex gap-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setIsAutoPlaying(false);
                  setActiveIndex(index);
                }}
                className={cn(
                  "h-2.5 rounded-full transition-all duration-300",
                  index === activeIndex 
                    ? "w-8 bg-primary" 
                    : "w-2.5 bg-primary/30 hover:bg-primary/50"
                )}
              />
            ))}
          </div>
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={goToNext}
            className="rounded-full"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Mini testimonial cards */}
        <div className={cn(
          "grid md:grid-cols-4 gap-4 mt-12 opacity-0",
          isVisible && "animate-fade-in"
        )} style={{ animationDelay: "600ms" }}>
          {testimonials.map((testimonial, index) => (
            <button
              key={testimonial.id}
              onClick={() => {
                setIsAutoPlaying(false);
                setActiveIndex(index);
              }}
              className={cn(
                "text-left p-4 rounded-xl border-2 transition-all duration-300",
                index === activeIndex 
                  ? "border-primary bg-primary/5 shadow-lg" 
                  : "border-border/50 hover:border-primary/30 hover:bg-muted/50"
              )}
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={testimonial.avatar} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{testimonial.location}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
