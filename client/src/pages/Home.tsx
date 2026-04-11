import Header from "@/components/Header";
import HeroCarousel from "@/components/HeroCarousel";
import CategoryCard from "@/components/CategoryCard";
import ProductCard from "@/components/ProductCard";
import TestimonialCard from "@/components/TestimonialCard";
import Footer from "@/components/Footer";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";
import { FaInstagram, FaFacebook } from "react-icons/fa";
import whatsappIconImg from "@assets/apple_(1)_1775471745535.png";

import bridalImage from "@assets/generated_images/Bridal_saree_product_shot_3a9642d4.png";
import cottonImage from "@assets/generated_images/Cotton_saree_product_3295c949.png";
import designerImage from "@assets/generated_images/Designer_saree_modern_91330177.png";
import partyImage from "@assets/generated_images/Party_wear_saree_86e79eab.png";
import casualImage from "@assets/generated_images/Casual_linen_saree_030a208d.png";
import banarasiImage from "@assets/generated_images/Banarasi_saree_detail_604e6fdd.png";
import festiveImage from "@assets/generated_images/Festive_collection_banner_7a822710.png";
import customerImage from "@assets/generated_images/Customer_testimonial_portrait_6ffe6534.png";
import paithaniImage from "@/assets/paithani.png";
import khunIrkalImage from "@/assets/khun-irkal.png";
import ajrakhModalImage from "@/assets/ajrakh-modal.png";
import mulCottonImage from "@/assets/mul-cotton.png";
import khadiCottonImage from "@/assets/khadi-cotton.png";
import patchWorkImage from "@/assets/patch-work.png";
import pureLinenImage from "@/assets/pure-linen.png";
import saleImage from "@/assets/sale.png";

const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  mobile: z.string().min(10, "Please enter a valid mobile number"),
  email: z.string().email("Please enter a valid email address"),
  subject: z.string().min(3, "Subject must be at least 3 characters"),
  category: z.string().min(1, "Please select a category"),
  message: z.string().optional(),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

export default function Home() {
  const [, setLocation] = useLocation();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ramaniBanner, setRamaniBanner] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const cacheBust = Date.now();
    const img = new Image();
    img.onload = () => setRamaniBanner(`/media/ramani-banner.png?t=${cacheBust}`);
    img.src = `/media/ramani-banner.png?t=${cacheBust}`;
  }, []);

  useEffect(() => {
    const cacheBust = Date.now();
    fetch(`/media/promotional-video.mp4?t=${cacheBust}`, { method: "HEAD" })
      .then((res) => {
        const contentType = res.headers.get("content-type");
        if (res.ok && contentType && contentType.includes("video/mp4")) {
          setVideoUrl(`/media/promotional-video.mp4?t=${cacheBust}`);
        }
      })
      .catch(() => {});
  }, []);

  const { data: newArrivalsData } = useQuery({
    queryKey: ["/api/products?isNew=true&limit=6&inStock=false"],
  });

  const { data: trendingData } = useQuery({
    queryKey: ["/api/products?isTrending=true&limit=6&inStock=false"],
  });

  const { data: bestsellerData } = useQuery({
    queryKey: ["/api/products?isBestseller=true&limit=6&inStock=false"],
  });

  const { data: categoriesData } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  const { data: homeCirclesData } = useQuery<any>({
    queryKey: ["/api/home-circles"],
  });

  const newArrivals = (newArrivalsData as any)?.products || [];
  const trendingProducts = (trendingData as any)?.products || [];
  const bestsellerProducts = (bestsellerData as any)?.products || [];
  const shopCategories = categoriesData ?? [];

  const contactForm = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      mobile: "",
      email: "",
      subject: "",
      category: "",
      message: "",
    },
  });

  const contactMutation = useMutation({
    mutationFn: async (data: ContactFormValues) => {
      return await apiRequest("/api/contact", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Message Sent Successfully!",
        description: "Thank you for contacting us. We'll get back to you soon.",
      });
      contactForm.reset();
      setIsSubmitting(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description:
          error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  const onContactSubmit = (data: ContactFormValues) => {
    setIsSubmitting(true);
    contactMutation.mutate(data);
  };

  // Build a lookup of subcategory name → API image URL (from admin-managed categories)
  const subCategoryImageMap = new Map<string, string>();
  (categoriesData ?? []).forEach((cat: any) => {
    (cat.subCategories || []).forEach((sub: any) => {
      if (sub.name && sub.image) {
        subCategoryImageMap.set(sub.name, sub.image);
      }
    });
  });

  const staticFallbacks: Record<string, string> = {
    "Jamdani Paithani": paithaniImage,
    "Khun / Irkal (Ilkal)": khunIrkalImage,
    "Ajrakh Modal": ajrakhModalImage,
    "Mul Mul Cotton": mulCottonImage,
    "Khadi Cotton": khadiCottonImage,
    "Patch Work": patchWorkImage,
    "Pure Linen": pureLinenImage,
    "Sale": saleImage,
  };

  const adminHomeCircles: any[] = homeCirclesData?.homeCircles || [];
  const defaultCircleNames = [
    "Jamdani Paithani",
    "Khun / Irkal (Ilkal)",
    "Ajrakh Modal",
    "Mul Mul Cotton",
    "Khadi Cotton",
    "Patch Work",
    "Pure Linen",
    "Sale",
  ];

  const newCategories = adminHomeCircles.length > 0
    ? adminHomeCircles
        .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
        .map((circle: any) => ({
          name: circle.name,
          image: circle.image || subCategoryImageMap.get(circle.name) || staticFallbacks[circle.name] || "",
        }))
    : defaultCircleNames.map((name) => ({
        name,
        image: subCategoryImageMap.get(name) || staticFallbacks[name] || "",
      }));

  const collections = [
    {
      title: "Haldi & Mehendi Hues",
      image: festiveImage,
      link: "/products?occasion=Wedding&color=Yellow,Orange",
    },
    {
      title: "Sangeet & Style",
      image: partyImage,
      link: "/products?occasion=Party",
    },
    {
      title: "Reception Royalty",
      image: designerImage,
      link: "/products?category=Designer Sarees",
    },
    {
      title: "Bride Squad Goals",
      image: bridalImage,
      link: "/products?subcategory=Bridal",
    },
  ];

  const ratingStats = {
    overall: 4.5,
    totalReviews: 2847,
    totalRatings: 3156,
    breakdown: [
      { stars: 5, count: 1890, percentage: 60 },
      { stars: 4, count: 823, percentage: 26 },
      { stars: 3, count: 284, percentage: 9 },
      { stars: 2, count: 95, percentage: 3 },
      { stars: 1, count: 64, percentage: 2 },
    ],
  };

  const customerPhotos = [
    bridalImage,
    designerImage,
    festiveImage,
    partyImage,
    cottonImage,
    casualImage,
    banarasiImage,
    paithaniImage,
    khunIrkalImage,
    bridalImage,
    festiveImage,
    partyImage,
  ];

  const customerReviews = [
    {
      name: "Priya Sharma",
      image: customerImage,
      rating: 5,
      review:
        "Absolutely stunning saree! The quality is exceptional and the colors are even more beautiful in person. The fabric feels luxurious and drapes perfectly.",
      date: "15 Oct 2025",
      helpful: 24,
      photos: [bridalImage, designerImage, festiveImage],
    },
    {
      name: "Anjali Reddy",
      rating: 5,
      review:
        "Perfect for my sister's wedding. Got so many compliments! The fabric quality is amazing and the color is exactly as shown in pictures.",
      date: "8 Oct 2025",
      helpful: 18,
      photos: [partyImage, cottonImage],
    },
    {
      name: "Meera Patel",
      image: customerImage,
      rating: 5,
      review:
        "Beautiful collection and fast delivery. The saree exceeded my expectations. Will definitely shop again from Ramani Fashion!",
      date: "2 Oct 2025",
      helpful: 31,
      photos: [casualImage],
    },
  ];

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <HeroCarousel />
        </motion.div>

        <motion.section
          className="py-4 md:py-2 bg-white"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="max-w-7xl mx-auto px-1 md:px-2">
            <div className="overflow-x-auto scrollbar-hide md:overflow-visible">
              <motion.div
                className="flex gap-6 md:gap-8 lg:gap-10 pb-4 px-2 md:px-0"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {newCategories
                  .filter((cat) => cat.name !== "Sale")
                  .map((category, index) => (
                    <motion.div
                      key={category.name}
                      variants={fadeInUp}
                      transition={{ duration: 0.5 }}
                      className="flex flex-col items-center cursor-pointer group flex-shrink-0"
                      onClick={() => {
                        if (category.name === "Sale") {
                          setLocation("/sale");
                        } else {
                          setLocation(
                            `/products?category=${encodeURIComponent(category.name)}`,
                          );
                        }
                      }}
                      data-testid={`category-circle-${category.name.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <div
                        className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden mb-2 md:mb-3 transition-all duration-300 group-hover:scale-105"
                        style={{
                          border: "2px solid hsl(338, 78%, 62%)",
                          padding: "3px",
                        }}
                      >
                        <div className="w-full h-full rounded-full overflow-hidden">
                          <img
                            src={category.image}
                            alt={category.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                      <h3
                        className="text-center text-xs md:text-sm font-medium max-w-[100px] md:max-w-[130px]"
                        style={{ color: "hsl(338, 78%, 62%)" }}
                      >
                        {category.name}
                      </h3>
                    </motion.div>
                  ))}
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* ── Shop by Category cards ── */}
        <motion.section
          className="py-8 md:py-12"
          style={{ backgroundColor: "rgba(250, 220, 235, 0.7)" }}
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              className="flex justify-center mb-6"
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h2
                className="text-2xl md:text-3xl font-bold font-serif bg-primary text-white border-2 border-white rounded-full px-6 md:px-8 py-2 md:py-3 inline-block"
                data-testid="text-section-shop-by-category"
              >
                Shop by Category
              </h2>
            </motion.div>
            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {shopCategories.map((cat: any) => (
                <motion.div
                  key={cat._id}
                  variants={fadeInUp}
                  transition={{ duration: 0.5 }}
                  className="group cursor-pointer"
                  onClick={() => setLocation(`/products?mainCategory=${encodeURIComponent(cat.name)}`)}
                  data-testid={`card-shop-category-${cat.slug}`}
                >
                  <div className="relative overflow-hidden rounded-2xl shadow-md group-hover:shadow-xl transition-shadow duration-300 aspect-[3/4]">
                    {cat.image ? (
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-pink-100 to-pink-300" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-white font-bold text-base md:text-lg tracking-wide text-center drop-shadow-lg">
                        {cat.name}
                      </h3>
                      <p className="text-white/80 text-xs text-center mt-1 font-medium tracking-wider">
                        EXPLORE →
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>

        <motion.section
          className="py-8 md:py-12"
          style={{ backgroundColor: "rgba(250, 220, 235, 0.7)" }}
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="max-w-7xl mx-auto px-4 lg:px-3">
            <motion.div
              className="flex flex-row items-center justify-between gap-4 mb-6"
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="text-center sm:text-left flex-1">
                <h2
                  className="text-2xl md:text-3xl font-bold font-serif bg-primary text-white border-2 border-white rounded-full px-6 md:px-8 py-2 md:py-3 inline-block"
                  data-testid="text-section-new-arrivals-home"
                >
                  New Arrival
                </h2>
              </div>
              <button
                onClick={() => setLocation("/new-arrivals")}
                className="hidden sm:flex px-6 md:px-8 py-2 md:py-3 bg-primary text-white border-2 border-white rounded-full hover:bg-primary/90 transition-colors font-bold text-sm md:text-base"
                data-testid="button-view-all-new-arrivals"
              >
                View All
              </button>
            </motion.div>
            {/* Mobile: 2 columns × 3 rows grid — always 6 slots */}
            <motion.div
              className="grid grid-cols-2 gap-4 md:hidden"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {[...newArrivals.slice(0, 6), ...Array(Math.max(0, 6 - newArrivals.slice(0, 6).length)).fill(null)].map((product: any, index: number) =>
                product ? (
                  <motion.div
                    key={product._id}
                    variants={fadeInUp}
                    transition={{ duration: 0.5 }}
                  >
                    <ProductCard
                      id={product._id}
                      displayColor={product.displayColor}
                      name={product.name}
                      image={product.displayImages?.[0] || product.images?.[0]}
                      secondaryImage={product.displayImages?.[1] || product.images?.[1]}
                      price={product.price}
                      originalPrice={product.originalPrice}
                      discount={
                        product.originalPrice
                          ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                          : 0
                      }
                      rating={product.rating}
                      reviewCount={product.reviewCount}
                      isNew={true}
                      isBestseller={product.isBestseller}
                      inStock={product.variantInStock !== undefined ? product.variantInStock !== false : product.inStock !== false}
                      shortDescription={product.subDescription}
                      onClick={() => setLocation(`/product/${product._id}`)}
                    />
                  </motion.div>
                ) : (
                  <div key={`na-mobile-placeholder-${index}`} className="invisible" />
                )
              )}
            </motion.div>
            {/* Desktop: horizontally scrollable cards — fixed card width, no stretching */}
            <motion.div
              className="hidden md:flex overflow-x-auto gap-4 pb-3 scrollbar-hide"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {newArrivals.slice(0, 6).map((product: any) => (
                <motion.div
                  key={product._id}
                  variants={fadeInUp}
                  transition={{ duration: 0.5 }}
                  className="flex-shrink-0 w-[220px] lg:w-[240px]"
                >
                  <ProductCard
                    id={product._id}
                    displayColor={product.displayColor}
                    name={product.name}
                    image={product.displayImages?.[0] || product.images?.[0]}
                    secondaryImage={product.displayImages?.[1] || product.images?.[1]}
                    price={product.price}
                    originalPrice={product.originalPrice}
                    discount={
                      product.originalPrice
                        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                        : 0
                    }
                    rating={product.rating}
                    reviewCount={product.reviewCount}
                    isNew={true}
                    isBestseller={product.isBestseller}
                    inStock={product.variantInStock !== undefined ? product.variantInStock !== false : product.inStock !== false}
                    shortDescription={product.subDescription}
                    onClick={() => setLocation(`/product/${product._id}`)}
                  />
                </motion.div>
              ))}
            </motion.div>
            <div className="flex sm:hidden justify-center mt-6">
              <button
                onClick={() => setLocation("/new-arrivals")}
                className="px-6 md:px-8 py-2 md:py-3 bg-primary text-white border-2 border-white rounded-full hover:bg-primary/90 transition-colors font-bold text-sm md:text-base"
                data-testid="button-view-all-new-arrivals-mobile"
              >
                View All
              </button>
            </div>
          </div>
        </motion.section>

        <motion.section
          className="max-w-7xl mx-auto px-4 lg:px-3 py-8"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          {ramaniBanner && (
            <div className="w-full overflow-hidden rounded-lg">
              <img
                src={ramaniBanner}
                alt="Ramani Fashion - Shop the authentic Silk Sarees, crafted with perfection by local artisans"
                className="w-full h-auto object-cover"
              />
            </div>
          )}
        </motion.section>

        <motion.section
          className="py-8 md:py-12"
          style={{ backgroundColor: "rgba(250, 220, 235, 0.7)" }}
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="max-w-7xl mx-auto px-4 lg:px-3">
            <motion.div
              className="flex flex-row items-center justify-between gap-4 mb-6"
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="text-center sm:text-left flex-1">
                <h2
                  className="text-2xl md:text-3xl font-bold font-serif bg-primary text-white border-2 border-white rounded-full px-6 md:px-8 py-2 md:py-3 inline-block"
                  data-testid="text-section-trending-collection"
                >
                  Trending Collection
                </h2>
              </div>
              <button
                onClick={() => setLocation("/trending-collection")}
                className="hidden sm:flex px-6 md:px-8 py-2 md:py-3 bg-primary text-white border-2 border-white rounded-full hover:bg-primary/90 transition-colors font-bold text-sm md:text-base"
                data-testid="button-view-all-trending"
              >
                View All
              </button>
            </motion.div>
            {/* Mobile: 2 columns × 3 rows grid — always 6 slots */}
            <motion.div
              className="grid grid-cols-2 gap-4 md:hidden"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {[...trendingProducts.slice(0, 6), ...Array(Math.max(0, 6 - trendingProducts.slice(0, 6).length)).fill(null)].map((product: any, index: number) =>
                product ? (
                  <motion.div
                    key={product._id}
                    variants={fadeInUp}
                    transition={{ duration: 0.5 }}
                  >
                    <ProductCard
                      id={product._id}
                      displayColor={product.displayColor}
                      name={product.name}
                      image={product.displayImages?.[0] || product.images?.[0]}
                      secondaryImage={product.displayImages?.[1] || product.images?.[1]}
                      price={product.price}
                      originalPrice={product.originalPrice}
                      discount={
                        product.originalPrice
                          ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                          : 0
                      }
                      rating={product.rating}
                      reviewCount={product.reviewCount}
                      isBestseller={product.isBestseller}
                      inStock={product.variantInStock !== undefined ? product.variantInStock !== false : product.inStock !== false}
                      shortDescription={product.subDescription}
                      onClick={() => setLocation(`/product/${product._id}`)}
                    />
                  </motion.div>
                ) : (
                  <div key={`tr-mobile-placeholder-${index}`} className="invisible" />
                )
              )}
            </motion.div>
            {/* Desktop: horizontally scrollable cards — fixed card width, no stretching */}
            <motion.div
              className="hidden md:flex overflow-x-auto gap-4 pb-3 scrollbar-hide"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {trendingProducts.slice(0, 6).map((product: any) => (
                <motion.div
                  key={product._id}
                  variants={fadeInUp}
                  transition={{ duration: 0.5 }}
                  className="flex-shrink-0 w-[220px] lg:w-[240px]"
                >
                  <ProductCard
                    id={product._id}
                    displayColor={product.displayColor}
                    name={product.name}
                    image={product.displayImages?.[0] || product.images?.[0]}
                    secondaryImage={product.displayImages?.[1] || product.images?.[1]}
                    price={product.price}
                    originalPrice={product.originalPrice}
                    discount={
                      product.originalPrice
                        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                        : 0
                    }
                    rating={product.rating}
                    reviewCount={product.reviewCount}
                    isBestseller={product.isBestseller}
                    inStock={product.variantInStock !== undefined ? product.variantInStock !== false : product.inStock !== false}
                    shortDescription={product.subDescription}
                    onClick={() => setLocation(`/product/${product._id}`)}
                  />
                </motion.div>
              ))}
            </motion.div>
            <div className="flex sm:hidden justify-center mt-6">
              <button
                onClick={() => setLocation("/trending-collection")}
                className="px-6 md:px-8 py-2 md:py-3 bg-primary text-white border-2 border-white rounded-full hover:bg-primary/90 transition-colors font-bold text-sm md:text-base"
                data-testid="button-view-all-trending-mobile"
              >
                View All
              </button>
            </div>
          </div>
        </motion.section>

        {videoUrl && (
          <motion.section
            className="max-w-7xl mx-auto px-4 lg:px-3 py-8"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
          >
            <div className="w-full overflow-hidden rounded-lg bg-black">
              <div className="relative w-full" style={{ paddingBottom: "42%" }}>
                <video
                  className="absolute top-0 left-0 w-full h-full"
                  autoPlay
                  muted
                  loop
                  playsInline
                  data-testid="video-banner"
                >
                  <source src={videoUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </motion.section>
        )}

        {bestsellerProducts.length > 0 && (
          <motion.section
            className="py-8 md:py-12"
            style={{ backgroundColor: "rgba(250, 220, 235, 0.7)" }}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <div className="max-w-7xl mx-auto px-4 lg:px-3">
              <motion.div
                className="flex flex-row items-center justify-between gap-4 mb-6"
                initial={{ opacity: 0, y: -20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="text-center sm:text-left flex-1">
                  <h2
                    className="text-2xl md:text-3xl font-bold font-serif bg-primary text-white border-2 border-white rounded-full px-6 md:px-8 py-2 md:py-3 inline-block"
                    data-testid="text-section-bestseller"
                  >
                    Best Sellers
                  </h2>
                </div>
                <button
                  onClick={() => setLocation("/bestseller")}
                  className="hidden sm:flex px-6 md:px-8 py-2 md:py-3 bg-primary text-white border-2 border-white rounded-full hover:bg-primary/90 transition-colors font-bold text-sm md:text-base"
                  data-testid="button-view-all-bestseller"
                >
                  View All
                </button>
              </motion.div>
              {/* Mobile: 2 columns × 3 rows grid */}
              <motion.div
                className="grid grid-cols-2 gap-4 md:hidden"
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                {[...bestsellerProducts.slice(0, 6), ...Array(Math.max(0, 6 - bestsellerProducts.slice(0, 6).length)).fill(null)].map((product: any, index: number) =>
                  product ? (
                    <motion.div
                      key={product._id}
                      variants={fadeInUp}
                      transition={{ duration: 0.5 }}
                    >
                      <ProductCard
                        id={product._id}
                        displayColor={product.displayColor}
                        name={product.name}
                        image={product.displayImages?.[0] || product.images?.[0]}
                        secondaryImage={product.displayImages?.[1] || product.images?.[1]}
                        price={product.price}
                        originalPrice={product.originalPrice}
                        discount={
                          product.originalPrice
                            ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                            : 0
                        }
                        rating={product.rating}
                        reviewCount={product.reviewCount}
                        isBestseller={true}
                        inStock={product.variantInStock !== undefined ? product.variantInStock !== false : product.inStock !== false}
                        shortDescription={product.subDescription}
                        onClick={() => setLocation(`/product/${product._id}`)}
                      />
                    </motion.div>
                  ) : (
                    <div key={`bs-mobile-placeholder-${index}`} className="invisible" />
                  )
                )}
              </motion.div>
              {/* Desktop: horizontally scrollable cards */}
              <motion.div
                className="hidden md:flex overflow-x-auto gap-4 pb-3 scrollbar-hide"
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                {bestsellerProducts.slice(0, 6).map((product: any) => (
                  <motion.div
                    key={product._id}
                    variants={fadeInUp}
                    transition={{ duration: 0.5 }}
                    className="flex-shrink-0 w-[220px] lg:w-[240px]"
                  >
                    <ProductCard
                      id={product._id}
                      displayColor={product.displayColor}
                      name={product.name}
                      image={product.displayImages?.[0] || product.images?.[0]}
                      secondaryImage={product.displayImages?.[1] || product.images?.[1]}
                      price={product.price}
                      originalPrice={product.originalPrice}
                      discount={
                        product.originalPrice
                          ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                          : 0
                      }
                      rating={product.rating}
                      reviewCount={product.reviewCount}
                      isBestseller={true}
                      inStock={product.variantInStock !== undefined ? product.variantInStock !== false : product.inStock !== false}
                      shortDescription={product.subDescription}
                      onClick={() => setLocation(`/product/${product._id}`)}
                    />
                  </motion.div>
                ))}
              </motion.div>
              <div className="flex sm:hidden justify-center mt-6">
                <button
                  onClick={() => setLocation("/bestseller")}
                  className="px-6 md:px-8 py-2 md:py-3 bg-primary text-white border-2 border-white rounded-full hover:bg-primary/90 transition-colors font-bold text-sm md:text-base"
                  data-testid="button-view-all-bestseller-mobile"
                >
                  View All
                </button>
              </div>
            </div>
          </motion.section>
        )}

        <motion.section
          className="py-8 md:py-16"
          style={{ backgroundColor: "rgba(250, 220, 235, 0.7)" }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              className="text-center mb-8 md:mb-12"
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2
                className="text-2xl md:text-3xl font-bold font-serif bg-primary text-white border-2 border-white rounded-full px-6 md:px-8 py-2 md:py-3 inline-block"
                data-testid="text-section-testimonials"
              >
                What Our Customers Say
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-12 mb-8 md:mb-12">
              <motion.div
                className="lg:col-span-1 space-y-6"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6 }}
              >
                <div className="bg-background rounded-xl p-8 shadow-sm border border-border">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-6xl font-bold text-foreground">
                      {ratingStats.overall}
                    </span>
                    <span className="text-4xl text-yellow-500">★</span>
                  </div>
                  <p className="text-muted-foreground mb-6">
                    {ratingStats.totalRatings.toLocaleString()} Ratings,{" "}
                    {ratingStats.totalReviews.toLocaleString()} Reviews
                  </p>

                  <div className="space-y-3">
                    {ratingStats.breakdown.map((item) => (
                      <div key={item.stars} className="flex items-center gap-3">
                        <span className="text-sm font-medium w-8">
                          {item.stars}★
                        </span>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full transition-all duration-300"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-12 text-right">
                          {item.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-background rounded-xl p-6 shadow-sm border border-border">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Customer Photos ({customerPhotos.length})
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {customerPhotos.map((photo, index) => (
                      <div
                        key={index}
                        onClick={() => setSelectedImage(photo)}
                        className="aspect-square overflow-hidden rounded-lg cursor-pointer hover:opacity-80 transition-opacity border border-border"
                      >
                        <img
                          src={photo}
                          alt={`Customer photo ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="lg:col-span-2 space-y-6"
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
              >
                {customerReviews.map((review, index) => (
                  <motion.div
                    key={index}
                    className="bg-background rounded-xl p-6 shadow-sm border border-border"
                    variants={fadeInUp}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                        {review.image ? (
                          <img
                            src={review.image}
                            alt={review.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-xl font-semibold text-primary">
                            {review.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">
                          {review.name}
                        </h4>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex items-center gap-1 bg-green-600 text-white px-2 py-0.5 rounded text-sm font-medium">
                            {review.rating}★
                          </div>
                          <span className="text-sm text-muted-foreground">
                            Posted on {review.date}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-foreground leading-relaxed mb-4">
                      {review.review}
                    </p>

                    {review.photos && review.photos.length > 0 && (
                      <div className="flex gap-2 mb-4">
                        {review.photos.slice(0, 3).map((photo, photoIndex) => (
                          <div
                            key={photoIndex}
                            className="w-20 h-20 rounded-lg overflow-hidden border border-border"
                          >
                            <img
                              src={photo}
                              alt={`Customer photo ${photoIndex + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-muted-foreground">
                      <button className="flex items-center gap-1 text-sm hover:text-foreground transition-colors">
                        <span>👍</span>
                        <span>Helpful ({review.helpful})</span>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </motion.section>

        <motion.section
          id="contact"
          className="py-16 bg-background"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold font-serif bg-primary text-white border-2 border-white rounded-full px-8 py-3 inline-block mb-4">
                Get In Touch
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                We'd love to hear from you! Whether you have a question about
                our products, need assistance, or just want to share your
                feedback.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
              <Card
                className="lg:col-span-3 border shadow-sm h-full"
                style={{ backgroundColor: "rgba(250, 220, 235, 0.7)" }}
                data-testid="card-contact-form"
              >
                <CardContent className="p-8 h-full flex flex-col">
                  <div className="flex justify-center mb-8">
                    <h3 className="text-2xl font-bold font-serif bg-primary text-white border-2 border-white rounded-full px-8 py-3 inline-block">
                      Send Us a Message
                    </h3>
                  </div>
                  <Form {...contactForm}>
                    <form
                      onSubmit={contactForm.handleSubmit(onContactSubmit)}
                      className="space-y-6 flex-1 flex flex-col"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={contactForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name *</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Your full name"
                                  {...field}
                                  data-testid="input-name"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={contactForm.control}
                          name="mobile"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mobile Number *</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Your mobile number"
                                  {...field}
                                  data-testid="input-mobile"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={contactForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address *</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="your.email@example.com"
                                {...field}
                                data-testid="input-email"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={contactForm.control}
                          name="subject"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Subject *</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="What is this regarding?"
                                  {...field}
                                  data-testid="input-subject"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={contactForm.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category of Interest *</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger data-testid="select-category">
                                    <SelectValue placeholder="Select a category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem
                                    value="sarees"
                                    data-testid="option-sarees"
                                  >
                                    Sarees
                                  </SelectItem>
                                  <SelectItem
                                    value="lehengas"
                                    data-testid="option-lehengas"
                                  >
                                    Lehengas
                                  </SelectItem>
                                  <SelectItem
                                    value="kurtis"
                                    data-testid="option-kurtis"
                                  >
                                    Kurtis
                                  </SelectItem>
                                  <SelectItem
                                    value="dress-materials"
                                    data-testid="option-dress-materials"
                                  >
                                    Dress Materials
                                  </SelectItem>
                                  <SelectItem
                                    value="custom-order"
                                    data-testid="option-custom-order"
                                  >
                                    Custom Order
                                  </SelectItem>
                                  <SelectItem
                                    value="bulk-order"
                                    data-testid="option-bulk-order"
                                  >
                                    Bulk Order
                                  </SelectItem>
                                  <SelectItem
                                    value="general-inquiry"
                                    data-testid="option-general-inquiry"
                                  >
                                    General Inquiry
                                  </SelectItem>
                                  <SelectItem
                                    value="complaint"
                                    data-testid="option-complaint"
                                  >
                                    Complaint
                                  </SelectItem>
                                  <SelectItem
                                    value="feedback"
                                    data-testid="option-feedback"
                                  >
                                    Feedback
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={contactForm.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem className="flex-1 flex flex-col">
                            <FormLabel>Message</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Tell us more about your inquiry..."
                                className="min-h-[200px] flex-1 resize-none"
                                {...field}
                                data-testid="textarea-message"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="pt-2">
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-base"
                          data-testid="button-submit"
                        >
                          {isSubmitting ? (
                            "Sending..."
                          ) : (
                            <>
                              <Send className="w-5 h-5 mr-2" />
                              Send Message
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              <div className="lg:col-span-2 space-y-6">
                <Card className="border shadow-sm" data-testid="card-map">
                  <CardContent className="p-0">
                    <div className="relative w-full h-[200px] rounded-t-lg overflow-hidden">
                      <iframe
                        src="https://maps.google.com/maps?q=Shop+A001+Shree+Laxman+CHS+Jaibai+School+Road+Katemanivali+Kalyan+East+421306+Maharashtra&output=embed"
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Ramani Fashion Location"
                        data-testid="iframe-map"
                      ></iframe>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="border shadow-sm hover:shadow-md transition-shadow"
                  data-testid="card-contact-info"
                >
                  <CardContent className="p-6 space-y-4">
                    <div
                      className="rounded-full p-4 flex items-center gap-4"
                      style={{ backgroundColor: "rgba(250, 220, 235, 0.7)" }}
                    >
                      <div
                        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: "hsl(338, 78%, 62%)" }}
                      >
                        <MapPin className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-1">
                          Address
                        </h3>
                        <p
                          className="text-sm text-foreground leading-relaxed"
                          data-testid="text-address"
                        >
                          Shop A001, Shree Laxman CHS, Jaibai School Road,
                          <br />
                          Katemanivali, Kalyan East - 421306
                        </p>
                      </div>
                    </div>

                    <div
                      className="rounded-full p-4 flex items-center gap-4"
                      style={{ backgroundColor: "rgba(250, 220, 235, 0.7)" }}
                    >
                      <div
                        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: "hsl(338, 78%, 62%)" }}
                      >
                        <Phone className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-1">
                          Phone
                        </h3>
                        <a
                          href="tel:+919372494513"
                          className="text-sm text-foreground hover:text-foreground/80 transition-colors"
                          data-testid="link-phone"
                        >
                          +91 93724 94513
                        </a>
                      </div>
                    </div>

                    <div
                      className="rounded-full p-4 flex items-center gap-4"
                      style={{ backgroundColor: "rgba(250, 220, 235, 0.7)" }}
                    >
                      <div
                        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: "hsl(338, 78%, 62%)" }}
                      >
                        <Mail className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-1">
                          Email
                        </h3>
                        <a
                          href="mailto:ramanifashion2024@gmail.com"
                          className="text-sm text-foreground hover:text-foreground/80 transition-colors"
                          data-testid="link-email"
                        >
                          ramanifashion2024@gmail.com
                        </a>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border">
                      <h3 className="font-semibold text-foreground mb-3">
                        Connect With Us
                      </h3>
                      <div className="flex gap-3 flex-wrap">
                        <a
                          href="https://www.instagram.com/ramanifashionindia/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-all shadow-sm hover:shadow-md"
                          data-testid="link-instagram"
                          aria-label="Instagram"
                        >
                          <FaInstagram className="w-5 h-5" />
                          <span className="text-sm font-medium">Instagram</span>
                        </a>
                        <a
                          href="https://www.facebook.com/186191114586811"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-sm hover:shadow-md"
                          data-testid="link-facebook"
                          aria-label="Facebook"
                        >
                          <FaFacebook className="w-5 h-5" />
                          <span className="text-sm font-medium">Facebook</span>
                        </a>
                        <a
                          href="https://chat.whatsapp.com/GqIsU9ZF2SJ9buuSKxGFWB"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-600 text-white hover:bg-green-700 transition-all shadow-sm hover:shadow-md"
                          data-testid="link-whatsapp"
                          aria-label="WhatsApp"
                        >
                          <img src={whatsappIconImg} alt="WhatsApp" className="w-5 h-5 object-contain" />
                          <span className="text-sm font-medium">WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </motion.section>
      </main>

      <Footer />

      <a
        href="https://chat.whatsapp.com/GqIsU9ZF2SJ9buuSKxGFWB"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 block"
        data-testid="button-whatsapp-floating"
        aria-label="Chat on WhatsApp"
      >
        <img src={whatsappIconImg} alt="Chat on WhatsApp" className="w-14 h-14 object-contain drop-shadow-lg" />
      </a>

      <Dialog
        open={!!selectedImage}
        onOpenChange={() => setSelectedImage(null)}
      >
        <DialogContent className="max-w-4xl w-full p-0 bg-black/95 border-none">
          <div className="relative w-full h-[80vh] flex items-center justify-center">
            {selectedImage && (
              <img
                src={selectedImage}
                alt="Customer photo full view"
                className="max-w-full max-h-full object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
