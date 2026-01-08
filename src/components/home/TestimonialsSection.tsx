import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Quote, Star } from "lucide-react";
import { useTranslation } from "react-i18next";

const testimonials = [
  {
    id: 1,
    name: "Amina Benali",
    role: "Environmental Activist",
    location: "Casablanca",
    content: "CleanAfricaNow has transformed how we report environmental issues. The municipality now responds within days instead of weeks!",
    avatar: "",
    rating: 5,
  },
  {
    id: 2,
    name: "Youssef El Mansouri",
    role: "City Council Member",
    location: "Rabat",
    content: "The AI-powered priority scoring helps us allocate resources efficiently. We've resolved 40% more reports this quarter.",
    avatar: "",
    rating: 5,
  },
  {
    id: 3,
    name: "Fatima Zahra",
    role: "Community Leader",
    location: "Marrakech",
    content: "Our neighborhood is cleaner than ever. The real-time tracking keeps everyone accountable and motivated.",
    avatar: "",
    rating: 5,
  },
];

export const TestimonialsSection = () => {
  const { t } = useTranslation();

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h3 className="text-3xl md:text-4xl font-bold mb-4">
            {t('testimonials.title', 'Voices from the Community')}
          </h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('testimonials.subtitle', 'See how CleanAfricaNow is making a difference across Morocco')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {testimonials.map((testimonial) => (
            <Card 
              key={testimonial.id} 
              className="border-2 border-transparent hover:border-primary/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <CardContent className="p-6">
                <Quote className="h-8 w-8 text-primary/20 mb-4" />
                
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  "{testimonial.content}"
                </p>

                <div className="flex items-center gap-3 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={testimonial.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.role} • {testimonial.location}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
