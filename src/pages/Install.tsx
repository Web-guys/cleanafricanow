import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Smartphone, 
  Wifi, 
  WifiOff, 
  Bell, 
  MapPin, 
  Camera,
  CheckCircle2,
  ArrowLeft,
  Share,
  Plus,
  MoreVertical
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import logo from '@/assets/cleanafricanow-logo.png';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const Install = () => {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    setIsStandalone(mediaQuery.matches);

    // Check for iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    
    setDeferredPrompt(null);
  };

  const features = [
    { icon: WifiOff, title: t('install.features.offline', 'Works Offline'), desc: t('install.features.offlineDesc', 'Report issues even without internet') },
    { icon: Bell, title: t('install.features.notifications', 'Push Notifications'), desc: t('install.features.notificationsDesc', 'Get updates on your reports') },
    { icon: MapPin, title: t('install.features.location', 'GPS Location'), desc: t('install.features.locationDesc', 'Precise location detection') },
    { icon: Camera, title: t('install.features.camera', 'Photo Capture'), desc: t('install.features.cameraDesc', 'Document issues with photos') },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="CleanAfricaNow" className="w-10 h-10 object-contain" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              CleanAfricaNow
            </h1>
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('common.back', 'Back')}
            </Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-2xl">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-primary to-secondary p-0.5 shadow-xl">
            <div className="w-full h-full rounded-3xl bg-background flex items-center justify-center overflow-hidden">
              <img src={logo} alt="CleanAfricaNow" className="w-16 h-16 object-contain" />
            </div>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {t('install.title', 'Install CleanAfricaNow')}
          </h1>
          
          <p className="text-lg text-muted-foreground mb-6">
            {t('install.subtitle', 'Get the full app experience on your device. Fast, reliable, and works offline.')}
          </p>

          {isStandalone ? (
            <Badge className="text-base px-4 py-2 bg-success">
              <CheckCircle2 className="mr-2 h-5 w-5" />
              {t('install.alreadyInstalled', 'Already Installed!')}
            </Badge>
          ) : isInstalled ? (
            <Badge className="text-base px-4 py-2 bg-success">
              <CheckCircle2 className="mr-2 h-5 w-5" />
              {t('install.success', 'Installation Complete!')}
            </Badge>
          ) : null}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          {features.map((feature, i) => (
            <Card key={i} className="border-border/50">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-primary/10 flex items-center justify-center">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
                <p className="text-xs text-muted-foreground">{feature.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Install Instructions */}
        {!isStandalone && !isInstalled && (
          <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-primary" />
                {t('install.howToInstall', 'How to Install')}
              </CardTitle>
              <CardDescription>
                {t('install.chooseMethod', 'Choose your installation method')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Native Install Button */}
              {deferredPrompt && (
                <div className="space-y-3">
                  <Button 
                    onClick={handleInstallClick} 
                    size="lg" 
                    className="w-full text-lg py-6"
                  >
                    <Download className="mr-2 h-5 w-5" />
                    {t('install.installNow', 'Install Now')}
                  </Button>
                  <p className="text-center text-sm text-muted-foreground">
                    {t('install.recommended', 'Recommended - One-click installation')}
                  </p>
                </div>
              )}

              {/* iOS Instructions */}
              {isIOS && (
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Share className="h-4 w-4" />
                    {t('install.iosTitle', 'iPhone / iPad')}
                  </h3>
                  <ol className="space-y-3 text-sm">
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">1</span>
                      <span>{t('install.iosStep1', 'Tap the Share button')} <Share className="inline h-4 w-4" /> {t('install.iosStep1b', 'at the bottom of Safari')}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">2</span>
                      <span>{t('install.iosStep2', 'Scroll down and tap "Add to Home Screen"')} <Plus className="inline h-4 w-4" /></span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">3</span>
                      <span>{t('install.iosStep3', 'Tap "Add" to confirm')}</span>
                    </li>
                  </ol>
                </div>
              )}

              {/* Android Instructions */}
              {!isIOS && !deferredPrompt && (
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <MoreVertical className="h-4 w-4" />
                    {t('install.androidTitle', 'Android')}
                  </h3>
                  <ol className="space-y-3 text-sm">
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">1</span>
                      <span>{t('install.androidStep1', 'Tap the menu button')} <MoreVertical className="inline h-4 w-4" /> {t('install.androidStep1b', 'in Chrome')}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">2</span>
                      <span>{t('install.androidStep2', 'Tap "Install app" or "Add to Home screen"')}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">3</span>
                      <span>{t('install.androidStep3', 'Tap "Install" to confirm')}</span>
                    </li>
                  </ol>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Already Installed - Go to App */}
        {(isStandalone || isInstalled) && (
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              {t('install.installedMessage', 'The app is installed on your device. You can now use it like any other app!')}
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild size="lg">
                <Link to="/map">
                  <MapPin className="mr-2 h-5 w-5" />
                  {t('install.openMap', 'Open Map')}
                </Link>
              </Button>
              <Button variant="outline" asChild size="lg">
                <Link to="/report">
                  <Camera className="mr-2 h-5 w-5" />
                  {t('install.reportIssue', 'Report Issue')}
                </Link>
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Install;
