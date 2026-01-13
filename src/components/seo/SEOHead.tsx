import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  type?: 'website' | 'article' | 'profile';
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    section?: string;
  };
}

const defaultSEO = {
  siteName: 'CleanAfricaNow',
  title: 'CleanAfricaNow - Clean Africa Initiative | Report Waste & Pollution',
  description: 'Join the Clean Africa movement. Report waste, pollution, and environmental hazards across Morocco and Africa. Together we can achieve clean environment through recycling and waste management.',
  keywords: 'Clean Africa, Clean Morocco, clean environment, recycling, waste management, plastic recycling, environmental protection, report pollution, illegal dumping, eco Africa, sustainable Africa, green Morocco, waste reporting app, environmental monitoring',
  image: 'https://cleanafricanow.com/og-image.png',
  url: 'https://cleanafricanow.com',
};

export const SEOHead = ({
  title,
  description,
  keywords,
  image,
  type = 'website',
  article,
}: SEOHeadProps) => {
  const location = useLocation();
  const currentUrl = `${defaultSEO.url}${location.pathname}`;
  
  const fullTitle = title 
    ? `${title} | ${defaultSEO.siteName}` 
    : defaultSEO.title;
  
  const metaDescription = description || defaultSEO.description;
  const metaKeywords = keywords 
    ? `${keywords}, ${defaultSEO.keywords}` 
    : defaultSEO.keywords;
  const metaImage = image || defaultSEO.image;

  useEffect(() => {
    // Update document title
    document.title = fullTitle;

    // Update meta tags
    const updateMeta = (name: string, content: string, property = false) => {
      const selector = property 
        ? `meta[property="${name}"]` 
        : `meta[name="${name}"]`;
      let element = document.querySelector(selector);
      
      if (!element) {
        element = document.createElement('meta');
        if (property) {
          element.setAttribute('property', name);
        } else {
          element.setAttribute('name', name);
        }
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Basic meta tags
    updateMeta('description', metaDescription);
    updateMeta('keywords', metaKeywords);
    
    // Open Graph
    updateMeta('og:title', fullTitle, true);
    updateMeta('og:description', metaDescription, true);
    updateMeta('og:image', metaImage, true);
    updateMeta('og:url', currentUrl, true);
    updateMeta('og:type', type, true);
    updateMeta('og:site_name', defaultSEO.siteName, true);
    
    // Twitter
    updateMeta('twitter:title', fullTitle);
    updateMeta('twitter:description', metaDescription);
    updateMeta('twitter:image', metaImage);
    updateMeta('twitter:card', 'summary_large_image');
    
    // Article-specific meta
    if (type === 'article' && article) {
      if (article.publishedTime) {
        updateMeta('article:published_time', article.publishedTime, true);
      }
      if (article.modifiedTime) {
        updateMeta('article:modified_time', article.modifiedTime, true);
      }
      if (article.author) {
        updateMeta('article:author', article.author, true);
      }
      if (article.section) {
        updateMeta('article:section', article.section, true);
      }
    }

    // Update canonical link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', currentUrl);

  }, [fullTitle, metaDescription, metaKeywords, metaImage, currentUrl, type, article]);

  return null;
};

// Predefined SEO configs for common pages
export const pageSEO = {
  home: {
    title: 'Clean Africa Now - Environmental Protection & Waste Management',
    description: 'CleanAfricaNow empowers communities to report and track environmental issues. Join thousands making Africa cleaner through waste management, recycling, and pollution reporting.',
    keywords: 'Clean Africa, environmental platform, waste reporting, pollution tracking, clean Morocco',
  },
  map: {
    title: 'Interactive Environmental Map - Track Pollution & Waste',
    description: 'Explore real-time environmental reports on our interactive map. Find and report waste, pollution, and ecological hazards across Morocco and Africa.',
    keywords: 'pollution map, waste tracking, environmental monitoring, Africa pollution map, Morocco waste map',
  },
  report: {
    title: 'Report Environmental Issues - Waste, Pollution & More',
    description: 'Submit environmental reports for waste, pollution, illegal dumping, and ecological hazards. Your report helps create a cleaner Africa.',
    keywords: 'report pollution, report waste, environmental reporting, citizen science, eco reporting',
  },
  leaderboard: {
    title: 'Environmental Champions Leaderboard',
    description: 'Celebrate the top environmental heroes making Africa cleaner. See community leaders and their impact on waste reduction and pollution prevention.',
    keywords: 'environmental leaders, eco champions, clean Africa heroes, community impact',
  },
  about: {
    title: 'About CleanAfricaNow - Our Mission for a Clean Africa',
    description: 'Learn about our mission to create a cleaner Africa through technology, community engagement, and environmental education.',
    keywords: 'about CleanAfricaNow, clean Africa mission, environmental organization, eco initiative',
  },
};