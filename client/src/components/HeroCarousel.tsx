import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";

interface BannerItem {
  _id: string;
  url: string;
  order: number;
}

interface HeroBannersData {
  desktop: BannerItem[];
  mobile: BannerItem[];
}

export default function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [legacyDesktop, setLegacyDesktop] = useState<string | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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

  const slides: string[] = isMobile
    ? mobileSlides.length > 0
      ? mobileSlides.map((b) => b.url)
      : legacyDesktop
      ? [legacyDesktop]
      : []
    : desktopSlides.length > 0
    ? desktopSlides.map((b) => b.url)
    : legacyDesktop
    ? [legacyDesktop]
    : [];

  const totalSlides = slides.length;

  const goNext = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  useEffect(() => {
    if (totalSlides <= 1) return;
    const timer = setInterval(goNext, 5000);
    return () => clearInterval(timer);
  }, [totalSlides, goNext]);

  useEffect(() => {
    setCurrentSlide(0);
  }, [isMobile]);

  if (slides.length === 0) {
    return (
      <div
        className="w-full bg-pink-50"
        style={
          isMobile
            ? { height: "90vw", maxHeight: "750px" }
            : { height: "65vh", maxHeight: "620px" }
        }
      />
    );
  }

  const containerStyle = isMobile
    ? { height: "90vw", maxHeight: "750px", backgroundColor: "#fff" }
    : { height: "65vh", maxHeight: "620px", backgroundColor: "#fff" };

  return (
    <div className="relative w-full overflow-hidden" style={containerStyle}>
      {slides.map((src, index) => (
        <div
          key={src}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: index === currentSlide ? 1 : 0, zIndex: index === currentSlide ? 1 : 0 }}
        >
          <img
            src={src}
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
              onClick={() => setCurrentSlide(index)}
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
