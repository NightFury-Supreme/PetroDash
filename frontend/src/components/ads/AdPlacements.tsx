"use client";

import React from "react";
import { AdSense } from "./AdSense";

export function HeaderAd() {
  return (
    <AdSense
      publisherId=""
      adSlot=""
      adFormat="horizontal"
      adStyle={{ display: 'block', width: '100%', minHeight: '90px' }}
      className="w-full mb-4"
      position="header"
      lazyLoad={false}
      respectUserPrivacy={true}
    />
  );
}

export function SidebarAd() {
  return (
    <AdSense
      publisherId=""
      adSlot=""
      adFormat="vertical"
      adStyle={{ display: 'block', width: '300px', minHeight: '600px' }}
      className="w-full"
      position="sidebar"
      lazyLoad={true}
      respectUserPrivacy={true}
    />
  );
}

export function FooterAd() {
  return (
    <AdSense
      publisherId=""
      adSlot=""
      adFormat="horizontal"
      adStyle={{ display: 'block', width: '100%', minHeight: '90px' }}
      className="w-full mt-4"
      position="footer"
      lazyLoad={true}
      respectUserPrivacy={true}
    />
  );
}

export function ContentAd() {
  return (
    <AdSense
      publisherId=""
      adSlot=""
      adFormat="rectangle"
      adStyle={{ display: 'block', width: '300px', minHeight: '250px' }}
      className="w-full my-4"
      position="content"
      lazyLoad={true}
      respectUserPrivacy={true}
    />
  );
}

export function MobileAd() {
  return (
    <AdSense
      publisherId=""
      adSlot=""
      adFormat="auto"
      adStyle={{ display: 'block', width: '100%', minHeight: '50px' }}
      className="w-full my-4 md:hidden"
      position="mobile"
      lazyLoad={false}
      respectUserPrivacy={true}
    />
  );
}
