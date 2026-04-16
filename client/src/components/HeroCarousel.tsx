import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

interface BannerItem {
  _id: string;
  url: string;
  order: number;
  categoryLink: string;
}

interface HeroBannersData {
  desktop: BannerItem[];
  mobile: BannerItem[];
}

function Carousel({
  slides,
  className,
}: {
  slides: BannerItem[];
  className?: string;
}) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = slides.length;
  const [, navigate] = useLocation();

  const goNext = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  useEffect(() => {
    setCurrentSlide(0);
  }, [slides]);

  useEffect(() => {
    if (totalSlides <= 1) return;
    const timer = setInterval(goNext, 5000);
    return () => clearInterval(timer);
  }, [totalSlides, goNext]);

  if (slides.length === 0) return null;

  const handleBannerClick = (slide: BannerItem) => {
    if (slide.categoryLink) {
      navigate(slide.categoryLink);
    }
  };

  return (
    <div className={`relative w-full overflow-hidden ${className ?? ""}`}>
      {slides.map((slide, index) => (
        <div
          key={slide._id}
          className="absolute inset-0 transition-opacity duration-700"
          style={{
            opacity: index === currentSlide ? 1 : 0,
            zIndex: index === currentSlide ? 1 : 0,
            cursor: slide.categoryLink ? "pointer" : "default",
          }}
          onClick={() => index === currentSlide && handleBannerClick(slide)}
          data-testid={`slide-hero-banner-${index}`}
        >
          <img
            src={slide.url}
            alt={`Ramani Fashion Banner ${index + 1}`}
            className="w-full h-full object-cover object-center"
            data-testid={`img-hero-banner-${index}`}
            style={{ display: "block" }}
          />
        </div>
      ))}

      {totalSlides > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={(e) => { e.stopPropagation(); setCurrentSlide(index); }}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentSlide ? "bg-white w-5" : "bg-white/60"
              }`}
              data-testid={`button-hero-dot-${index}`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function HeroCarousel() {
  const [legacyDesktop, setLegacyDesktop] = useState<string | null>(null);

  useEffect(() => {
    const cacheBust = Date.now();
    const img = new Image();
    img.onload = () => setLegacyDesktop(`/media/hero-banner.png?t=${cacheBust}`);
    img.src = `/media/hero-banner.png?t=${cacheBust}`;
  }, []);

  const { data: bannersData } = useQuery<HeroBannersData>({
    queryKey: ["/api/hero-banners"],
  });

  const desktopSlides = bannersData?.desktop ?? [];
  const mobileSlides = bannersData?.mobile ?? [];

  const legacySlide: BannerItem | null = legacyDesktop
    ? { _id: "legacy", url: legacyDesktop, order: 0, categoryLink: "" }
    : null;

  const desktopItems: BannerItem[] =
    desktopSlides.length > 0 ? desktopSlides : legacySlide ? [legacySlide] : [];

  const mobileItems: BannerItem[] =
    mobileSlides.length > 0 ? mobileSlides : legacySlide ? [legacySlide] : [];

  const desktopStyle = { height: "65vh", maxHeight: "620px", backgroundColor: "#fff" };
  const mobileStyle = { height: "125vw", maxHeight: "860px", backgroundColor: "#fff" };

  const showDesktop = desktopItems.length > 0;
  const showMobile = mobileItems.length > 0;

  if (!showDesktop && !showMobile) {
    return (
      <>
        <div className="hidden md:block w-full bg-pink-50" style={desktopStyle} />
        <div className="block md:hidden w-full bg-pink-50" style={{ height: "125vw", maxHeight: "860px", backgroundColor: "#fdf2f8" }} />
      </>
    );
  }

  return (
    <>
      {/* Desktop carousel — hidden on mobile */}
      <div className="hidden md:block w-full" style={desktopStyle}>
        {showDesktop ? (
          <Carousel slides={desktopItems} className="h-full" />
        ) : (
          <div className="w-full h-full bg-pink-50" />
        )}
      </div>

      {/* Mobile carousel — hidden on desktop */}
      <div className="block md:hidden w-full" style={mobileStyle}>
        {showMobile ? (
          <Carousel slides={mobileItems} className="h-full" />
        ) : (
          <div className="w-full h-full bg-pink-50" />
        )}
      </div>
    </>
  );
}
