import { Link } from "react-router-dom";
import { Mail, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import { useTranslation } from "react-i18next";
import logo from "@/assets/cleanafricanow-logo.png";

const Footer = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="hidden md:block bg-gradient-to-b from-background to-muted/50 dark:from-background dark:to-muted/20 border-t border-border">
      <div className="container mx-auto px-4 py-16">
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-6 animate-fade-in">
            <Link to="/" className="flex items-center gap-3">
              <img src={logo} alt="CleanAfricaNow" className="w-12 h-12 object-contain" />
              <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                CleanAfricaNow
              </h3>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
              {t('footer.tagline')}
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-muted-foreground group">
                <Mail className="w-4 h-4 group-hover:text-primary transition-colors" />
                <a href="mailto:Cleanafricanow@gmail.com" className="hover:text-primary transition-colors">
                  Cleanafricanow@gmail.com
                </a>
              </div>
            </div>
          </div>

          {/* Company Column */}
          <div className="space-y-4 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              {t('footer.company')}
            </h4>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/about" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 inline-block hover:translate-x-1"
                >
                  {t('footer.aboutUs')}
                </Link>
              </li>
              <li>
                <Link 
                  to="/mission" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 inline-block hover:translate-x-1"
                >
                  {t('footer.ourMission')}
                </Link>
              </li>
              <li>
                <Link 
                  to="/team" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 inline-block hover:translate-x-1"
                >
                  {t('footer.team')}
                </Link>
              </li>
              <li>
                <Link 
                  to="/careers" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 inline-block hover:translate-x-1"
                >
                  {t('footer.careers')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources Column */}
          <div className="space-y-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              {t('footer.resources')}
            </h4>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/docs" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 inline-block hover:translate-x-1"
                >
                  {t('footer.documentation')}
                </Link>
              </li>
              <li>
                <Link 
                  to="/community" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 inline-block hover:translate-x-1"
                >
                  {t('footer.community')}
                </Link>
              </li>
              <li>
                <Link 
                  to="/blog" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 inline-block hover:translate-x-1"
                >
                  {t('footer.blog')}
                </Link>
              </li>
              <li>
                <Link 
                  to="/press" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 inline-block hover:translate-x-1"
                >
                  {t('footer.pressKit')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Column */}
          <div className="space-y-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              {t('footer.legal')}
            </h4>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/privacy" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 inline-block hover:translate-x-1"
                >
                  {t('footer.privacy')}
                </Link>
              </li>
              <li>
                <Link 
                  to="/terms" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 inline-block hover:translate-x-1"
                >
                  {t('footer.terms')}
                </Link>
              </li>
              <li>
                <Link 
                  to="/cookies" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 inline-block hover:translate-x-1"
                >
                  {t('footer.cookies')}
                </Link>
              </li>
              <li>
                <Link 
                  to="/support" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 inline-block hover:translate-x-1"
                >
                  {t('footer.support')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Social Media Section */}
        <div className="py-8 border-y border-border/40">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">{t('footer.followUs')}</h4>
              <p className="text-xs text-muted-foreground max-w-md">
                {t('footer.stayUpdated')}
              </p>
            </div>
            <div className="flex gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 rounded-xl bg-muted/50 border border-border/40 flex items-center justify-center hover:bg-primary hover:border-primary hover:scale-110 transition-all duration-200 group"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5 text-muted-foreground group-hover:text-primary-foreground transition-colors" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 rounded-xl bg-muted/50 border border-border/40 flex items-center justify-center hover:bg-primary hover:border-primary hover:scale-110 transition-all duration-200 group"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5 text-muted-foreground group-hover:text-primary-foreground transition-colors" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 rounded-xl bg-muted/50 border border-border/40 flex items-center justify-center hover:bg-primary hover:border-primary hover:scale-110 transition-all duration-200 group"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5 text-muted-foreground group-hover:text-primary-foreground transition-colors" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 rounded-xl bg-muted/50 border border-border/40 flex items-center justify-center hover:bg-primary hover:border-primary hover:scale-110 transition-all duration-200 group"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5 text-muted-foreground group-hover:text-primary-foreground transition-colors" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-muted-foreground text-center md:text-left">
              © {currentYear} CleanAfricaNow. {t('footer.allRightsReserved')}
            </p>
            <a
              href="https://webguys.agency"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-primary transition-colors duration-200 group flex items-center gap-2"
            >
              {t('footer.builtBy')}{" "}
              <span className="font-semibold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent group-hover:opacity-80 transition-opacity">
                WebGuys Agency
              </span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;