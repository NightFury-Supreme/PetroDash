"use client";

import React from "react";
import { AdSense } from "./AdSense";

export function HeaderAd() {
  return (
    <AdSense
      adFormat="horizontal"
      adStyle={{ display: "block", width: "100%", minHeight: "90px" }}
      className="w-full px-4 sm:px-6 pt-4 max-w-7xl mx-auto"
      position="header"
      lazyLoad={false}
      respectUserPrivacy={true}
    />
  );
}

export function SidebarAd() {
  return (
    <AdSense
      adFormat="auto"
      adStyle={{ display: "block", width: "100%" }}
      className="w-full rounded-lg overflow-hidden my-2"
      position="sidebar"
      lazyLoad={true}
      respectUserPrivacy={true}
    />
  );
}

export function FooterAd() {
  return (
    <AdSense
      adFormat="horizontal"
      adStyle={{ display: "block", width: "100%", minHeight: "90px" }}
      className="w-full px-4 sm:px-6 pb-4 max-w-7xl mx-auto"
      position="footer"
      lazyLoad={true}
      respectUserPrivacy={true}
    />
  );
}

export function ContentAd({ className = "" }: { className?: string }) {
  return (
    <AdSense
      adFormat="rectangle"
      adStyle={{ display: "block", width: "100%", minHeight: "250px" }}
      className={`w-full my-4 max-w-5xl mx-auto ${className}`.trim()}
      position="content"
      lazyLoad={true}
      respectUserPrivacy={true}
    />
  );
}

export function MobileAd() {
  return (
    <AdSense
      adFormat="auto"
      adStyle={{ display: "block", width: "100%", minHeight: "50px" }}
      className="w-full px-4 py-2 md:hidden"
      position="mobile"
      lazyLoad={false}
      respectUserPrivacy={true}
    />
  );
}
