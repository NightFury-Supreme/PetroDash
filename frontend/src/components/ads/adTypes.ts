export interface AdSenseProps {
  publisherId: string;
  adSlot: string;
  adFormat?: 'auto' | 'rectangle' | 'vertical' | 'horizontal';
  adStyle?: {
    display?: 'block' | 'inline-block';
    width?: string;
    height?: string;
    minHeight?: string;
  };
  className?: string;
  position?: 'header' | 'sidebar' | 'footer' | 'content' | 'mobile';
  lazyLoad?: boolean;
  respectUserPrivacy?: boolean;
}

export interface AdSenseSettings {
  enabled: boolean;
  publisherId: string;
  adSlots: {
    header: string;
    sidebar: string;
    footer: string;
    content: string;
    mobile: string;
  };
  adTypes: {
    display: boolean;
    text: boolean;
    link: boolean;
    inFeed: boolean;
    inArticle: boolean;
    matchedContent: boolean;
  };
}
