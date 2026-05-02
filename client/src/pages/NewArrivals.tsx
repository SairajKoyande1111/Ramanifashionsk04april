import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { SlidersHorizontal, X, ArrowUpDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useLocation } from "wouter";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { motion } from "framer-motion";
import { colorPreferences } from "@/lib/colorPreferences";
import { extractUniqueColorsFromProducts, extractColorHexMapFromProducts, getSwatchColor } from "@/lib/colorUtils";

export default function NewArrivals() {
  const [location] = useLocation();
  const [showFilters, setShowFilters] = useState(false);
  const [showMobileSort, setShowMobileSort] = useState(false);
  const [sortBy, setSortBy] = useState("");
  const [order, setOrder] = useState("");
  const [page, setPage] = useState(1);
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedFabrics, setSelectedFabrics] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>([]);
  const [openSections, setOpenSections] = useState<string[]>(["categories", "price", "color"]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    const categoryParam = urlParams.get('category');
    setSelectedCategories(categoryParam ? categoryParam.split(',') : []);
    
    const occasionParam = urlParams.get('occasion');
    setSelectedOccasions(occasionParam ? occasionParam.split(',') : []);
    
    const colorParam = urlParams.get('color');
    setSelectedColors(colorParam ? colorParam.split(',') : []);
    
    const fabricParam = urlParams.get('fabric');
    setSelectedFabrics(fabricParam ? fabricParam.split(',') : []);
    
    setPage(1);
    
    // Scroll to top when filters change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location]);

  const toggleSection = (section: string) => {
    setOpenSections(prev =>
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: "12",
    minPrice: priceRange[0].toString(),
    maxPrice: priceRange[1].toString(),
    isNew: "true",
  });

  if (sortBy && order) {
    queryParams.append("sort", sortBy);
    queryParams.append("order", order);
  }

  if (selectedCategories.length > 0) {
    queryParams.append("category", selectedCategories.join(","));
  }
  if (selectedFabrics.length > 0) {
    queryParams.append("fabric", selectedFabrics.join(","));
  }
  if (selectedColors.length > 0) {
    queryParams.append("color", selectedColors.join(","));
  }
  if (selectedOccasions.length > 0) {
    queryParams.append("occasion", selectedOccasions.join(","));
  }

  const { data: productsData, isLoading } = useQuery({
    queryKey: ["/api/products", queryParams.toString()],
    queryFn: async () => {
      const response = await fetch(`/api/products?${queryParams}`);
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
  });

  const { data: filtersData } = useQuery<{
    categories: string[];
    fabrics: string[];
    colors: string[];
    occasions: string[];
  }>({
    queryKey: ["/api/filters"],
  });

  // Build price range query params (without page/limit)
  const priceRangeParams = new URLSearchParams({
    isNew: "true",
  });
  if (selectedCategories.length > 0) {
    priceRangeParams.append("category", selectedCategories.join(","));
  }
  if (selectedFabrics.length > 0) {
    priceRangeParams.append("fabric", selectedFabrics.join(","));
  }
  if (selectedColors.length > 0) {
    priceRangeParams.append("color", selectedColors.join(","));
  }
  if (selectedOccasions.length > 0) {
    priceRangeParams.append("occasion", selectedOccasions.join(","));
  }

  const { data: priceRangeData } = useQuery<{
    minPrice: number;
    maxPrice: number;
  }>({
    queryKey: [`/api/price-range?${priceRangeParams.toString()}`],
  });

  // Update price range when API data changes - reset to full range
  useEffect(() => {
    if (priceRangeData) {
      if (priceRangeData.maxPrice > 0) {
        setPriceRange([priceRangeData.minPrice, priceRangeData.maxPrice]);
      } else {
        // If no products, use fallback
        setPriceRange([0, 10000]);
      }
    }
  }, [priceRangeData]);

  const products = productsData?.products || [];
  const pagination = productsData?.pagination || { total: 0, pages: 1 };

  const categories = filtersData?.categories || ["Jamdani Paithani", "Khun / Irkal (Ilkal)", "Ajrakh Modal", "Mul Mul Cotton", "Khadi Cotton", "Patch Work", "Pure Linen"];
  const fabrics = filtersData?.fabrics || ["Silk", "Cotton", "Georgette", "Chiffon", "Net", "Crepe", "Chanderi", "Linen"];
  const occasions = filtersData?.occasions || ["Wedding", "Party", "Festival", "Casual", "Office"];
  
  const productColors = useMemo(() => {
    return extractUniqueColorsFromProducts(products);
  }, [products]);

  const colorHexMap = useMemo(() => {
    return extractColorHexMapFromProducts(products);
  }, [products]);

  const handleSortChange = (value: string) => {
    if (value === "none") {
      setSortBy("");
      setOrder("");
    } else {
      const [newSort, newOrder] = value.split("-");
      setSortBy(newSort);
      setOrder(newOrder || "desc");
    }
    setPage(1);
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
    setPage(1);
  };

  const toggleFabric = (fabric: string) => {
    setSelectedFabrics(prev =>
      prev.includes(fabric) ? prev.filter(f => f !== fabric) : [...prev, fabric]
    );
    setPage(1);
  };

  const toggleColor = (color: string) => {
    setSelectedColors(prev =>
      prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
    );
    setPage(1);
  };

  const toggleOccasion = (occasion: string) => {
    setSelectedOccasions(prev =>
      prev.includes(occasion) ? prev.filter(o => o !== occasion) : [...prev, occasion]
    );
    setPage(1);
  };

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedFabrics([]);
    setSelectedColors([]);
    setSelectedOccasions([]);
    const minPrice = priceRangeData?.minPrice || 0;
    const maxPrice = priceRangeData?.maxPrice && priceRangeData.maxPrice > 0 ? priceRangeData.maxPrice : 10000;
    setPriceRange([minPrice, maxPrice]);
    setPage(1);
  };

  const activeFiltersCount = selectedCategories.length + selectedFabrics.length + selectedColors.length + selectedOccasions.length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 lg:px-3 py-8 pb-20 lg:pb-8">
        <div className="mb-6">
          <nav className="text-sm text-muted-foreground mb-4" data-testid="breadcrumb">
            <a href="/" className="hover:text-foreground">Home</a>
            <span className="mx-2">/</span>
            <span className="text-foreground">New Arrivals</span>
          </nav>
          
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold mb-1" data-testid="text-page-title">
                New Arrivals
              </h1>
              <p className="text-muted-foreground" data-testid="text-results-count">
                {pagination.variantTotal ?? products.length} variants
              </p>
            </div>
            
            <div className="hidden lg:flex items-center gap-2">
              <Select 
                value={sortBy && order ? `${sortBy}-${order}` : "none"} 
                onValueChange={handleSortChange}
              >
                <SelectTrigger className="w-48" data-testid="select-sort">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sort By</SelectItem>
                  <SelectItem value="createdAt-desc">What's New</SelectItem>
                  <SelectItem value="rating-desc">Highest Rated</SelectItem>
                  <SelectItem value="reviewCount-desc">Most Reviews</SelectItem>
                  <SelectItem value="price-asc">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc">Price: High to Low</SelectItem>
                  <SelectItem value="discount-desc">Best Discount</SelectItem>
                  <SelectItem value="name-asc">Name: A to Z</SelectItem>
                  <SelectItem value="name-desc">Name: Z to A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {selectedCategories.map(cat => (
                <Button
                  key={cat}
                  size="sm"
                  variant="secondary"
                  onClick={() => toggleCategory(cat)}
                  data-testid={`filter-tag-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {cat} <X className="h-3 w-3 ml-1" />
                </Button>
              ))}
              {selectedFabrics.map(fab => (
                <Button
                  key={fab}
                  size="sm"
                  variant="secondary"
                  onClick={() => toggleFabric(fab)}
                >
                  {fab} <X className="h-3 w-3 ml-1" />
                </Button>
              ))}
              {selectedColors.map(col => (
                <Button
                  key={col}
                  size="sm"
                  variant="secondary"
                  onClick={() => toggleColor(col)}
                >
                  {col} <X className="h-3 w-3 ml-1" />
                </Button>
              ))}
              {selectedOccasions.map(occ => (
                <Button
                  key={occ}
                  size="sm"
                  variant="secondary"
                  onClick={() => toggleOccasion(occ)}
                >
                  {occ} <X className="h-3 w-3 ml-1" />
                </Button>
              ))}
              <Button
                size="sm"
                variant="ghost"
                onClick={clearAllFilters}
                data-testid="button-clear-filters"
              >
                Clear All
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside className="hidden lg:block lg:col-span-1">
            <div className="sticky top-4 space-y-6 max-h-[calc(100vh-6rem)] overflow-y-auto pr-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Filters</h3>
                {activeFiltersCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                    Clear All
                  </Button>
                )}
              </div>

              <Collapsible open={openSections.includes("categories")}>
                <CollapsibleTrigger 
                  className="flex items-center justify-between w-full py-2 hover-elevate px-2 rounded-md"
                  onClick={() => toggleSection("categories")}
                >
                  <span className="font-medium">Categories</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${openSections.includes("categories") ? "rotate-180" : ""}`} />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 pt-2">
                  {categories.map((category: string) => (
                    <div key={category} className="flex items-center space-x-2">
                      <Checkbox 
                        id={category} 
                        checked={selectedCategories.includes(category)}
                        onCheckedChange={() => toggleCategory(category)}
                        data-testid={`checkbox-category-${category.toLowerCase().replace(/\s+/g, '-')}`}
                      />
                      <Label htmlFor={category} className="text-sm cursor-pointer">
                        {category}
                      </Label>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>

              <Collapsible open={openSections.includes("price")}>
                <CollapsibleTrigger 
                  className="flex items-center justify-between w-full py-2 hover-elevate px-2 rounded-md"
                  onClick={() => toggleSection("price")}
                >
                  <span className="font-medium">Price Range</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${openSections.includes("price") ? "rotate-180" : ""}`} />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4 space-y-4">
                  <Slider
                    value={priceRange}
                    onValueChange={(val) => {
                      setPriceRange(val);
                      setPage(1);
                    }}
                    min={priceRangeData?.minPrice || 0}
                    max={priceRangeData?.maxPrice || 10000}
                    step={100}
                    data-testid="slider-price-range"
                  />
                  <div className="flex items-center justify-between text-sm">
                    <span data-testid="text-price-min">₹{priceRange[0]}</span>
                    <span data-testid="text-price-max">₹{priceRange[1]}</span>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {productColors.length > 0 && (
                <Collapsible open={openSections.includes("color")}>
                  <CollapsibleTrigger 
                    className="flex items-center justify-between w-full py-2 hover-elevate px-2 rounded-md"
                    onClick={() => toggleSection("color")}
                  >
                    <span className="font-medium">Color</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${openSections.includes("color") ? "rotate-180" : ""}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2 pb-3 px-1 overflow-visible">
                    <div className="grid grid-cols-5 gap-3 overflow-visible">
                      {productColors.map((color: string) => (
                        <button
                          key={color}
                          className={`w-10 h-10 rounded-full border-2 hover-elevate overflow-visible ${
                            selectedColors.includes(color) ? 'border-primary ring-2 ring-primary ring-offset-1' : 'border-border'
                          }`}
                          style={{ backgroundColor: getSwatchColor(color, colorHexMap) }}
                          onClick={() => toggleColor(color)}
                          title={color}
                          data-testid={`button-color-${color.toLowerCase().replace(/\s+/g, '-')}`}
                        />
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* HIDDEN - Fabric Type Filter (Uncomment to re-enable) */}
              {/* <Collapsible open={openSections.includes("fabric")}>
                <CollapsibleTrigger 
                  className="flex items-center justify-between w-full py-2 hover-elevate px-2 rounded-md"
                  onClick={() => toggleSection("fabric")}
                >
                  <span className="font-medium">Fabric Type</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${openSections.includes("fabric") ? "rotate-180" : ""}`} />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 pt-2">
                  {fabrics.map((fabric: string) => (
                    <div key={fabric} className="flex items-center space-x-2">
                      <Checkbox 
                        id={fabric} 
                        checked={selectedFabrics.includes(fabric)}
                        onCheckedChange={() => toggleFabric(fabric)}
                      />
                      <Label htmlFor={fabric} className="text-sm cursor-pointer">
                        {fabric}
                      </Label>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible> */}

              {/* HIDDEN - Occasion Filter (Uncomment to re-enable) */}
              {/* <Collapsible open={openSections.includes("occasion")}>
                <CollapsibleTrigger 
                  className="flex items-center justify-between w-full py-2 hover-elevate px-2 rounded-md"
                  onClick={() => toggleSection("occasion")}
                >
                  <span className="font-medium">Occasion</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${openSections.includes("occasion") ? "rotate-180" : ""}`} />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 pt-2">
                  {occasions.map((occasion: string) => (
                    <div key={occasion} className="flex items-center space-x-2">
                      <Checkbox 
                        id={occasion} 
                        checked={selectedOccasions.includes(occasion)}
                        onCheckedChange={() => toggleOccasion(occasion)}
                      />
                      <Label htmlFor={occasion} className="text-sm cursor-pointer">
                        {occasion}
                      </Label>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible> */}
            </div>
          </aside>

          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-96 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground text-lg mb-4">No products found</p>
                <Button onClick={clearAllFilters} variant="outline">
                  Clear Filters
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                  {products.map((product: any, index: number) => {
                    const discount = product.originalPrice 
                      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                      : 0;
                    
                    const displayImages = product.displayImages || product.images || [];
                    
                    return (
                      <div key={product._id}>
                        <ProductCard
                          id={product._id}
                          baseProductId={product.baseProductId}
                          displayColor={product.displayColor}
                          name={product.name}
                          image={displayImages[0] || "/placeholder.jpg"}
                          secondaryImage={displayImages[1]}
                          price={product.price}
                          originalPrice={product.originalPrice}
                          discount={discount}
                          rating={product.rating}
                          reviewCount={product.reviewCount}
                          isNew={product.isNew}
                          isBestseller={product.isBestseller}
                          inStock={product.variantInStock !== undefined ? product.variantInStock !== false : product.inStock !== false}
                          context="new-arrivals"
                          shortDescription={product.subDescription}
                        />
                      </div>
                    );
                  })}
                </div>

                {pagination.pages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setPage(p => Math.max(1, p - 1));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      disabled={page === 1}
                      data-testid="button-prev-page"
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {page} of {pagination.pages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setPage(p => Math.min(pagination.pages, p + 1));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      disabled={page === pagination.pages}
                      data-testid="button-next-page"
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Bar with Sort and Filter */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t z-50 safe-area-pb">
        <div className="grid grid-cols-2 gap-px">
          <Sheet open={showMobileSort} onOpenChange={setShowMobileSort}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                className="h-14 rounded-none flex items-center justify-center gap-2"
                data-testid="button-mobile-sort"
              >
                <ArrowUpDown className="h-5 w-5" />
                <span className="font-medium">SORT</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[50vh]">
              <SheetHeader>
                <SheetTitle>Sort By</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-2">
                {[
                  { value: "none", label: "Default" },
                  { value: "createdAt-desc", label: "What's New" },
                  { value: "rating-desc", label: "Highest Rated" },
                  { value: "reviewCount-desc", label: "Most Reviews" },
                  { value: "price-asc", label: "Price: Low to High" },
                  { value: "price-desc", label: "Price: High to Low" },
                  { value: "discount-desc", label: "Best Discount" },
                  { value: "name-asc", label: "Name: A to Z" },
                  { value: "name-desc", label: "Name: Z to A" },
                ].map((option) => (
                  <Button
                    key={option.value}
                    variant={
                      (option.value === "none" && !sortBy && !order) ||
                      (sortBy && order && `${sortBy}-${order}` === option.value)
                        ? "default"
                        : "ghost"
                    }
                    className="w-full justify-start"
                    onClick={() => {
                      handleSortChange(option.value);
                      setShowMobileSort(false);
                    }}
                    data-testid={`button-sort-${option.value}`}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </SheetContent>
          </Sheet>

          <Sheet open={showFilters} onOpenChange={setShowFilters}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                className="h-14 rounded-none flex items-center justify-center gap-2"
                data-testid="button-mobile-filter"
              >
                <SlidersHorizontal className="h-5 w-5" />
                <span className="font-medium">FILTER</span>
                {activeFiltersCount > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
              <SheetHeader className="mb-4">
                <div className="flex items-center justify-between">
                  <SheetTitle>Filters</SheetTitle>
                  {activeFiltersCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                      Clear All
                    </Button>
                  )}
                </div>
              </SheetHeader>
              
              <div className="space-y-6">
                <Collapsible open={openSections.includes("categories")}>
                  <CollapsibleTrigger 
                    className="flex items-center justify-between w-full py-3 hover-elevate px-2 rounded-md"
                    onClick={() => toggleSection("categories")}
                  >
                    <span className="font-medium">Categories</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${openSections.includes("categories") ? "rotate-180" : ""}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-3 pt-2">
                    {categories.map((category: string) => (
                      <div key={category} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`mobile-${category}`} 
                          checked={selectedCategories.includes(category)}
                          onCheckedChange={() => toggleCategory(category)}
                        />
                        <Label htmlFor={`mobile-${category}`} className="text-sm cursor-pointer">
                          {category}
                        </Label>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>

                <Collapsible open={openSections.includes("price")}>
                  <CollapsibleTrigger 
                    className="flex items-center justify-between w-full py-3 hover-elevate px-2 rounded-md"
                    onClick={() => toggleSection("price")}
                  >
                    <span className="font-medium">Price Range</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${openSections.includes("price") ? "rotate-180" : ""}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-4 space-y-4">
                    <Slider
                      value={priceRange}
                      onValueChange={(val) => {
                        setPriceRange(val);
                        setPage(1);
                      }}
                      min={priceRangeData?.minPrice || 0}
                      max={priceRangeData?.maxPrice && priceRangeData.maxPrice > 0 ? priceRangeData.maxPrice : 10000}
                      step={500}
                    />
                    <div className="flex items-center justify-between text-sm">
                      <span>₹{priceRange[0]}</span>
                      <span>₹{priceRange[1]}</span>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* HIDDEN - Mobile Fabric Type Filter (Uncomment to re-enable) */}
                {/* <Collapsible open={openSections.includes("fabric")}>
                  <CollapsibleTrigger 
                    className="flex items-center justify-between w-full py-3 hover-elevate px-2 rounded-md"
                    onClick={() => toggleSection("fabric")}
                  >
                    <span className="font-medium">Fabric Type</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${openSections.includes("fabric") ? "rotate-180" : ""}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-3 pt-2">
                    {fabrics.map((fabric: string) => (
                      <div key={fabric} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`mobile-${fabric}`} 
                          checked={selectedFabrics.includes(fabric)}
                          onCheckedChange={() => toggleFabric(fabric)}
                        />
                        <Label htmlFor={`mobile-${fabric}`} className="text-sm cursor-pointer">
                          {fabric}
                        </Label>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible> */}

                {/* HIDDEN - Mobile Occasion Filter (Uncomment to re-enable) */}
                {/* <Collapsible open={openSections.includes("occasion")}>
                  <CollapsibleTrigger 
                    className="flex items-center justify-between w-full py-3 hover-elevate px-2 rounded-md"
                    onClick={() => toggleSection("occasion")}
                  >
                    <span className="font-medium">Occasion</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${openSections.includes("occasion") ? "rotate-180" : ""}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-3 pt-2">
                    {occasions.map((occasion: string) => (
                      <div key={occasion} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`mobile-${occasion}`} 
                          checked={selectedOccasions.includes(occasion)}
                          onCheckedChange={() => toggleOccasion(occasion)}
                        />
                        <Label htmlFor={`mobile-${occasion}`} className="text-sm cursor-pointer">
                          {occasion}
                        </Label>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible> */}

                {/* HIDDEN - Mobile Color Filter (Uncomment to re-enable) */}
                {/* <Collapsible open={openSections.includes("color")}>
                  <CollapsibleTrigger 
                    className="flex items-center justify-between w-full py-3 hover-elevate px-2 rounded-md"
                    onClick={() => toggleSection("color")}
                  >
                    <span className="font-medium">Color</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${openSections.includes("color") ? "rotate-180" : ""}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2">
                    <div className="grid grid-cols-5 gap-3">
                      {colors.map((color: string) => (
                        <button
                          key={color}
                          className={`w-10 h-10 rounded-full border-2 hover-elevate ${
                            selectedColors.includes(color) ? 'border-primary ring-2 ring-primary' : 'border-border'
                          }`}
                          style={{ backgroundColor: color.toLowerCase() }}
                          onClick={() => toggleColor(color)}
                          title={color}
                        />
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible> */}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <Footer />
    </div>
  );
}
