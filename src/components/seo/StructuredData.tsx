import { useEffect } from 'react';

interface OrganizationData {
  name: string;
  url: string;
  logo: string;
  description: string;
  sameAs?: string[];
}

interface WebsiteData {
  name: string;
  url: string;
  description: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface StructuredDataProps {
  type: 'Organization' | 'WebSite' | 'FAQPage' | 'WebApplication';
  data?: OrganizationData | WebsiteData | FAQItem[];
}

const defaultOrganization: OrganizationData = {
  name: 'CleanAfricaNow',
  url: 'https://cleanafricanow.com',
  logo: 'https://cleanafricanow.com/favicon.png',
  description: 'CleanAfricaNow is a community-powered environmental platform for reporting and tracking waste, pollution, and ecological issues across Africa.',
  sameAs: [
    'https://twitter.com/cleanafricanow',
    'https://facebook.com/cleanafricanow',
    'https://linkedin.com/company/cleanafricanow',
  ],
};

const defaultWebsite: WebsiteData = {
  name: 'CleanAfricaNow',
  url: 'https://cleanafricanow.com',
  description: 'Report and track environmental issues across Africa. Join the Clean Africa movement.',
};

const defaultFAQs: FAQItem[] = [
  {
    question: 'What is CleanAfricaNow?',
    answer: 'CleanAfricaNow is a community-powered platform that enables citizens, tourists, and municipal agents to report waste, pollution, and environmental hazards across Morocco and Africa.',
  },
  {
    question: 'How do I report an environmental issue?',
    answer: 'Simply click on "Report Issue" button, select the category (waste, pollution, illegal dumping, etc.), add a description, take a photo, and submit. Your report will be sent to local authorities.',
  },
  {
    question: 'Is CleanAfricaNow free to use?',
    answer: 'Yes, CleanAfricaNow is completely free for citizens to use. We believe everyone should have access to tools that help protect our environment.',
  },
  {
    question: 'How does CleanAfricaNow help with recycling?',
    answer: 'We connect communities with recycling centers, track waste collection routes, and provide education on proper waste sorting and recycling practices.',
  },
  {
    question: 'What cities does CleanAfricaNow cover?',
    answer: 'We currently cover all major cities in Morocco and are expanding across Africa. Check our interactive map to see coverage in your area.',
  },
];

export const StructuredData = ({ type, data }: StructuredDataProps) => {
  useEffect(() => {
    const scriptId = `structured-data-${type.toLowerCase()}`;
    
    // Remove existing script if any
    const existingScript = document.getElementById(scriptId);
    if (existingScript) {
      existingScript.remove();
    }

    let jsonLd: object;

    switch (type) {
      case 'Organization':
        const orgData = (data as OrganizationData) || defaultOrganization;
        jsonLd = {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: orgData.name,
          url: orgData.url,
          logo: orgData.logo,
          description: orgData.description,
          sameAs: orgData.sameAs,
          contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'customer service',
            email: 'contact@cleanafricanow.com',
          },
        };
        break;

      case 'WebSite':
        const webData = (data as WebsiteData) || defaultWebsite;
        jsonLd = {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: webData.name,
          url: webData.url,
          description: webData.description,
          potentialAction: {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: `${webData.url}/map?search={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
          },
        };
        break;

      case 'FAQPage':
        const faqs = (data as FAQItem[]) || defaultFAQs;
        jsonLd = {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqs.map(faq => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: faq.answer,
            },
          })),
        };
        break;

      case 'WebApplication':
        jsonLd = {
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'CleanAfricaNow',
          url: 'https://cleanafricanow.com',
          applicationCategory: 'EnvironmentApplication',
          operatingSystem: 'Web',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
          },
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.8',
            ratingCount: '1250',
          },
          featureList: [
            'Report environmental issues',
            'Track waste and pollution',
            'Real-time interactive map',
            'Community leaderboard',
            'Mobile-friendly PWA',
          ],
        };
        break;

      default:
        return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById(scriptId);
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [type, data]);

  return null;
};