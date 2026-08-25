import React from 'react';
import HeroSection from '../components/HeroSection';
import SearchBar from '../components/SearchBar';
import HowItWorks from '../components/HowItWorks';
import FeaturedJourneys from '../components/FeaturedJourneys';
import CallToAction from '../components/CallToAction';

const HomePage = () => (
  <>
    <HeroSection />
    {/* Pulled up over the hero so the search sits on the seam. */}
    <SearchBar className="-mt-12 sm:-mt-14" />
    <HowItWorks />
    <FeaturedJourneys />
    <CallToAction />
  </>
);

export default HomePage;
