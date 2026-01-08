import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Loader2, Leaf, Shield, Users, Globe, Eye, EyeOff, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const signupSchema = z.object({
  fullName: z.string().trim().min(2, { message: "Name must be at least 2 characters" }).max(100),
  email: z.string().trim().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string(),
  role: z.enum(["citizen", "tourist", "municipality"], {
    required_error: "Please select a role",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const Auth = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, signIn, signUp, getRoleBasedRedirect } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [signupFullName, setSignupFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupRole, setSignupRole] = useState<"citizen" | "tourist" | "municipality">("citizen");

  useEffect(() => {
    if (user) {
      const redirectPath = getRoleBasedRedirect();
      navigate(redirectPath);
    }
  }, [user, navigate, getRoleBasedRedirect]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const validated = loginSchema.parse({ email: loginEmail, password: loginPassword });
      const { error } = await signIn(validated.email, validated.password);
      
      if (!error) {
        navigate('/');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const validated = signupSchema.parse({
        fullName: signupFullName,
        email: signupEmail,
        password: signupPassword,
        confirmPassword: signupConfirmPassword,
        role: signupRole,
      });

      const { error } = await signUp(validated.email, validated.password, validated.fullName, validated.role);
      
      if (!error) {
        const redirectPath = getRoleBasedRedirect();
        navigate(redirectPath);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Leaf, text: t('auth.feature1', 'Report environmental issues instantly'), delay: '0ms' },
    { icon: Globe, text: t('auth.feature2', 'Cover cities across Africa'), delay: '100ms' },
    { icon: Users, text: t('auth.feature3', 'Join thousands of active citizens'), delay: '200ms' },
    { icon: Shield, text: t('auth.feature4', 'Track report resolution progress'), delay: '300ms' },
  ];

  const roleDescriptions = {
    citizen: "Report local issues and track community impact",
    tourist: "Help maintain destinations you visit",
    municipality: "Manage and resolve reports for your city",
  };

  return (
    <div className="min-h-screen flex bg-background overflow-hidden">
      {/* Left side - Animated Features Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary to-secondary relative">
        {/* Animated Background Blobs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/3 -right-20 w-60 h-60 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute -bottom-20 left-1/4 w-72 h-72 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
        
        <div className="relative z-10 flex flex-col justify-between p-12 lg:p-16 text-primary-foreground h-full w-full">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-xl">
              <MapPin className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">CleanAfricaNow</h1>
              <p className="text-primary-foreground/70 text-sm">Environmental Reporting Platform</p>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-white/10">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium">AI-Powered Platform</span>
              </div>
              <h2 className="text-4xl xl:text-5xl font-bold mb-4 leading-tight">
                {t('auth.heroTitle', 'Make Your City Cleaner')}
              </h2>
              <p className="text-lg text-primary-foreground/80 max-w-md">
                {t('auth.heroDesc', 'Join our community of environmental advocates and help create cleaner, safer spaces for everyone.')}
              </p>
            </div>

            {/* Animated Feature Cards */}
            <div className="space-y-3">
              {features.map((feature, index) => (
                <div 
                  key={index} 
                  className="flex items-center gap-4 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 hover:bg-white/15 transition-all duration-300 hover:translate-x-2 group cursor-default animate-fade-in"
                  style={{ animationDelay: feature.delay }}
                >
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <span className="font-medium text-lg">{feature.text}</span>
                  <ArrowRight className="w-5 h-5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </div>

          {/* Footer Stats */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-10 h-10 rounded-full bg-white/20 border-2 border-primary flex items-center justify-center">
                    <Users className="w-4 h-4 opacity-60" />
                  </div>
                ))}
              </div>
              <span className="text-sm text-primary-foreground/80 ml-2">
                <strong className="text-primary-foreground">10K+</strong> Active Users
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Auth forms */}
      <div className="flex-1 flex flex-col bg-gradient-to-b from-background to-muted/30">
        <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl">
          <div className="px-6 lg:px-10 py-4 flex justify-between items-center">
            <Link to="/" className="flex items-center gap-2 lg:hidden group">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <MapPin className="w-6 h-6 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                CleanAfricaNow
              </h1>
            </Link>
            <Link to="/" className="hidden lg:flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group">
              <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
              {t('common.back', 'Back to home')}
            </Link>
            <div className="flex gap-2">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-6 lg:p-10">
          <div className="w-full max-w-md">
            {/* Mobile Welcome */}
            <div className="lg:hidden text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">{t('auth.welcome', 'Welcome')}</h2>
              <p className="text-muted-foreground">{t('auth.subtitle', 'Join the environmental movement')}</p>
            </div>

            <Card className="border-0 shadow-2xl bg-card/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-2 pt-8">
                <CardTitle className="text-2xl lg:text-3xl hidden lg:block">{t('auth.welcome', 'Welcome')}</CardTitle>
                <CardDescription className="text-base hidden lg:block">{t('auth.subtitle', 'Join the environmental movement')}</CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-4">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-8 h-12 p-1 bg-muted/80">
                    <TabsTrigger value="login" className="text-base data-[state=active]:shadow-md transition-all">
                      {t('auth.login', 'Sign In')}
                    </TabsTrigger>
                    <TabsTrigger value="signup" className="text-base data-[state=active]:shadow-md transition-all">
                      {t('auth.signup', 'Sign Up')}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="login" className="mt-0 animate-fade-in">
                    <form onSubmit={handleLogin} className="space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="login-email" className="text-sm font-medium">{t('auth.email', 'Email')}</Label>
                        <Input
                          id="login-email"
                          type="email"
                          placeholder={t('auth.emailPlaceholder', 'you@example.com')}
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          className="h-12 bg-background/50 border-border/50 focus:border-primary transition-colors"
                          required
                        />
                        {errors.email && (
                          <p className="text-sm text-destructive flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-destructive" />
                            {errors.email}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="login-password" className="text-sm font-medium">{t('auth.password', 'Password')}</Label>
                        <div className="relative">
                          <Input
                            id="login-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            className="h-12 bg-background/50 border-border/50 focus:border-primary transition-colors pr-12"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                        {errors.password && (
                          <p className="text-sm text-destructive flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-destructive" />
                            {errors.password}
                          </p>
                        )}
                      </div>
                      <Button type="submit" className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all" disabled={loading}>
                        {loading ? (
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="mr-2 h-5 w-5" />
                        )}
                        {t('auth.signInButton', 'Sign In')}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="signup" className="mt-0 animate-fade-in">
                    <form onSubmit={handleSignup} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name" className="text-sm font-medium">{t('auth.fullName', 'Full Name')}</Label>
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder={t('auth.namePlaceholder', 'John Doe')}
                          value={signupFullName}
                          onChange={(e) => setSignupFullName(e.target.value)}
                          className="h-12 bg-background/50 border-border/50 focus:border-primary transition-colors"
                          required
                        />
                        {errors.fullName && (
                          <p className="text-sm text-destructive">{errors.fullName}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email" className="text-sm font-medium">{t('auth.email', 'Email')}</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder={t('auth.emailPlaceholder', 'you@example.com')}
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          className="h-12 bg-background/50 border-border/50 focus:border-primary transition-colors"
                          required
                        />
                        {errors.email && (
                          <p className="text-sm text-destructive">{errors.email}</p>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="signup-password" className="text-sm font-medium">{t('auth.password', 'Password')}</Label>
                          <div className="relative">
                            <Input
                              id="signup-password"
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••"
                              value={signupPassword}
                              onChange={(e) => setSignupPassword(e.target.value)}
                              className="h-12 bg-background/50 border-border/50 focus:border-primary transition-colors pr-10"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          {errors.password && (
                            <p className="text-sm text-destructive">{errors.password}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-confirm" className="text-sm font-medium">{t('auth.confirmPassword', 'Confirm')}</Label>
                          <div className="relative">
                            <Input
                              id="signup-confirm"
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="••••••"
                              value={signupConfirmPassword}
                              onChange={(e) => setSignupConfirmPassword(e.target.value)}
                              className="h-12 bg-background/50 border-border/50 focus:border-primary transition-colors pr-10"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          {errors.confirmPassword && (
                            <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-role" className="text-sm font-medium">{t('auth.role', 'Your Role')}</Label>
                        <Select value={signupRole} onValueChange={(value: "citizen" | "tourist" | "municipality") => setSignupRole(value)}>
                          <SelectTrigger id="signup-role" className="h-12 bg-background/50 border-border/50 focus:border-primary">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="citizen" className="py-3">
                              <div className="flex flex-col items-start">
                                <span className="font-medium">{t('auth.roles.citizen', 'Citizen')}</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="tourist" className="py-3">
                              <div className="flex flex-col items-start">
                                <span className="font-medium">{t('auth.roles.tourist', 'Tourist')}</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="municipality" className="py-3">
                              <div className="flex flex-col items-start">
                                <span className="font-medium">{t('auth.roles.municipality', 'Municipality')}</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
                          {roleDescriptions[signupRole]}
                        </p>
                      </div>
                      <Button type="submit" className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all" disabled={loading}>
                        {loading ? (
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                          <ArrowRight className="mr-2 h-5 w-5" />
                        )}
                        {t('auth.createAccount', 'Create Account')}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>

                {/* Social Proof */}
                <div className="mt-8 pt-6 border-t border-border/50">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Shield className="h-4 w-4 text-primary" />
                    <span>Secure & encrypted authentication</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Footer */}
            <p className="text-center text-xs text-muted-foreground mt-6">
              © 2024 CleanAfricaNow. {t('auth.poweredBy', 'Powered by WebGuys Agency')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;