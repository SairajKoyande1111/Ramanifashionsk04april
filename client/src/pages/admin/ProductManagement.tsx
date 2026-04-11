import { useState, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ColorVariantEditor, ColorVariant } from "@/components/ColorVariantEditor";
import { JewelleryImagesEditor, JewelleryImagesState } from "@/components/JewelleryImagesEditor";
import { 
  Download,
  FileUp,
  Check
} from "lucide-react";

const AVAILABLE_COLORS = [
  "Red", "Blue", "Green", "Pink", "Yellow", "Black", "White", "Purple", 
  "Maroon", "Grey", "Orange", "Beige", "Brown", "Gold", "Silver", 
  "Navy", "Turquoise", "Magenta", "Cream", "Burgundy", "Peach", "Lavender"
];

interface SubCategory {
  name: string;
  slug: string;
}

interface MainCategory {
  _id: string;
  name: string;
  slug: string;
  subCategories: SubCategory[];
}

const CATEGORY_ICONS: Record<string, string> = {
  SAREES: "🥻",
  BLOUSES: "👗",
  "DRESS MATERIALS": "🧵",
  JEWELLERY: "💍",
};

interface CategoryFieldConfig {
  showFabric: boolean;
  showOccasion: boolean;
  showPattern: boolean;
  showWorkType: boolean;
  workTypeLabel: string;
  showSareeLength: boolean;
  showBlousePiece: boolean;
  showBlouseSizes: boolean;
}

interface BlouseSize {
  size: string;
  stockQuantity: number;
}

const CATEGORY_FIELD_CONFIG: Record<string, CategoryFieldConfig> = {
  SAREES: {
    showFabric: true,
    showOccasion: true,
    showPattern: true,
    showWorkType: true,
    workTypeLabel: "Work Type",
    showSareeLength: true,
    showBlousePiece: true,
    showBlouseSizes: false,
  },
  BLOUSES: {
    showFabric: true,
    showOccasion: true,
    showPattern: true,
    showWorkType: true,
    workTypeLabel: "Work Type",
    showSareeLength: false,
    showBlousePiece: false,
    showBlouseSizes: true,
  },
  "DRESS MATERIALS": {
    showFabric: true,
    showOccasion: true,
    showPattern: true,
    showWorkType: true,
    workTypeLabel: "Work Type",
    showSareeLength: false,
    showBlousePiece: false,
    showBlouseSizes: false,
  },
  JEWELLERY: {
    showFabric: false,
    showOccasion: true,
    showPattern: false,
    showWorkType: true,
    workTypeLabel: "Jewellery Type",
    showSareeLength: false,
    showBlousePiece: false,
    showBlouseSizes: false,
  },
};

export default function ProductManagement() {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const adminToken = localStorage.getItem("adminToken");
  const excelImportRef = useRef<HTMLInputElement>(null);

  const [colorVariants, setColorVariants] = useState<ColorVariant[]>([]);

  const defaultJewelleryData: JewelleryImagesState = {
    images: ["", "", "", "", ""],
    stockQuantity: 0,
    inStock: true,
    isUploading: [false, false, false, false, false],
  };
  const [jewelleryData, setJewelleryData] = useState<JewelleryImagesState>(defaultJewelleryData);

  const { data: mainCategories = [] } = useQuery<MainCategory[]>({
    queryKey: ["/api/categories"],
  });

  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    subDescription: "",
    detailedDescription: "",
    price: "",
    originalPrice: "",
    category: "",
    subcategory: "",
    fabric: "",
    occasion: "",
    pattern: "",
    workType: "",
    blousePiece: false,
    sareeLength: "",
    isNew: false,
    isTrending: false,
    isBestseller: false,
    onSale: false,
    fabricComposition: "",
    dimensions: "",
    weight: "",
    careInstructions: "",
    countryOfOrigin: "",
    material: "",
    plating: "",
    stoneType: "",
    setIncludes: "",
  });


  const importExcelMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/admin/products/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Import failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/inventory"] });
      toast({ 
        title: "Import successful!", 
        description: data.message 
      });
      if (excelImportRef.current) {
        excelImportRef.current.value = '';
      }
    },
    onError: (error: any) => {
      toast({ 
        title: "Import failed", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importExcelMutation.mutate(file);
    }
  };

  const handleExcelExport = async () => {
    try {
      const response = await fetch('/api/admin/products/export', {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products_export_${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({ title: "Products exported successfully!" });
    } catch (error: any) {
      toast({ 
        title: "Export failed", 
        description: error.message,
        variant: "destructive" 
      });
    }
  };

  const addProductMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/admin/products", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/inventory"] });
      toast({ title: "Product added successfully!" });
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const [selectedMainCategory, setSelectedMainCategory] = useState<MainCategory | null>(null);

  const fieldConfig: CategoryFieldConfig | null = selectedMainCategory
    ? (CATEGORY_FIELD_CONFIG[selectedMainCategory.name] ?? null)
    : null;

  const handleMainCategorySelect = (cat: MainCategory) => {
    setSelectedMainCategory(cat);
    const cfg = CATEGORY_FIELD_CONFIG[cat.name];
    setProductForm(prev => ({
      ...prev,
      category: cat.name,
      subcategory: "",
      fabric: cfg?.showFabric ? prev.fabric : "",
      occasion: cfg?.showOccasion ? prev.occasion : "",
      pattern: cfg?.showPattern ? prev.pattern : "",
      workType: cfg?.showWorkType ? prev.workType : "",
      sareeLength: cfg?.showSareeLength ? prev.sareeLength : "",
      blousePiece: cfg?.showBlousePiece ? prev.blousePiece : false,
    }));
  };

  const resetForm = () => {
    setProductForm({
      name: "",
      description: "",
      subDescription: "",
      detailedDescription: "",
      price: "",
      originalPrice: "",
      category: "",
      subcategory: "",
      fabric: "",
      occasion: "",
      pattern: "",
      workType: "",
      blousePiece: false,
      sareeLength: "",
      isNew: false,
      isTrending: false,
      isBestseller: false,
      onSale: false,
      fabricComposition: "",
      dimensions: "",
      weight: "",
      careInstructions: "",
      countryOfOrigin: "",
      material: "",
      plating: "",
      stoneType: "",
      setIncludes: "",
    });
    setColorVariants([]);
    setJewelleryData(defaultJewelleryData);
    setSelectedMainCategory(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!productForm.category) {
      toast({
        title: "Please select a category",
        description: "Click one of the main category cards to continue",
        variant: "destructive"
      });
      return;
    }
    
    const isJewellery = productForm.category === "JEWELLERY";

    if (isJewellery) {
      const validImages = jewelleryData.images.filter(img => img.trim() !== "");
      if (validImages.length === 0) {
        toast({
          title: "At least one image required",
          description: "Please upload at least one product image",
          variant: "destructive",
        });
        return;
      }
    } else {
      if (colorVariants.length === 0) {
        toast({ 
          title: "At least one color variant required", 
          description: "Please add at least one color with images",
          variant: "destructive" 
        });
        return;
      }

    }

    let finalColorVariants: ColorVariant[];
    let totalStock: number;
    let anyInStock: boolean;
    const isBlouse = productForm.category === "BLOUSES";

    if (isJewellery) {
      const validImages = jewelleryData.images.filter(img => img.trim() !== "");
      finalColorVariants = [{
        color: "Default",
        images: validImages,
        stockQuantity: jewelleryData.stockQuantity,
        inStock: jewelleryData.stockQuantity > 0 ? jewelleryData.inStock : false,
      }];
      totalStock = jewelleryData.stockQuantity;
      anyInStock = jewelleryData.stockQuantity > 0 ? jewelleryData.inStock : false;
    } else {
      finalColorVariants = colorVariants;
      totalStock = colorVariants.reduce((sum, variant) => sum + (variant.stockQuantity ?? 0), 0);
      anyInStock = colorVariants.some(variant => (variant.stockQuantity ?? 0) > 0);
    }

    const formattedData = {
      name: productForm.name,
      description: productForm.description,
      subDescription: productForm.subDescription || undefined,
      detailedDescription: productForm.detailedDescription || undefined,
      price: parseFloat(productForm.price),
      originalPrice: productForm.originalPrice ? parseFloat(productForm.originalPrice) : undefined,
      category: productForm.category,
      subcategory: productForm.subcategory || undefined,
      fabric: productForm.fabric || undefined,
      colorVariants: finalColorVariants,
      blouseSizes: [],
      occasion: productForm.occasion || undefined,
      pattern: productForm.pattern || undefined,
      workType: productForm.workType || undefined,
      blousePiece: productForm.blousePiece,
      sareeLength: productForm.sareeLength || undefined,
      stockQuantity: totalStock,
      inStock: anyInStock,
      isNew: isJewellery ? productForm.isNew : false,
      isTrending: isJewellery ? productForm.isTrending : false,
      isBestseller: isJewellery ? productForm.isBestseller : false,
      onSale: productForm.onSale,
      specifications: productForm.category === "JEWELLERY"
        ? {
            material: productForm.material || undefined,
            plating: productForm.plating || undefined,
            stoneType: productForm.stoneType || undefined,
            setIncludes: productForm.setIncludes || undefined,
            weight: productForm.weight || undefined,
            countryOfOrigin: productForm.countryOfOrigin || undefined,
          }
        : {
            fabricComposition: productForm.fabricComposition || undefined,
            dimensions: productForm.dimensions || undefined,
            weight: productForm.weight || undefined,
            careInstructions: productForm.careInstructions || undefined,
            countryOfOrigin: productForm.countryOfOrigin || undefined,
          }
    };

    addProductMutation.mutate(formattedData);
  };

  if (!adminToken) {
    setLocation("/login");
    return null;
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Product Management</h1>
          <div className="flex gap-2 flex-wrap">
            <input
              ref={excelImportRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleExcelImport}
              data-testid="input-excel-import-hidden"
            />
            <Button
              variant="outline"
              onClick={() => excelImportRef.current?.click()}
              disabled={importExcelMutation.isPending}
              data-testid="button-import-excel"
            >
              <FileUp className="mr-2 h-4 w-4" />
              {importExcelMutation.isPending ? "Importing..." : "Import Excel"}
            </Button>
            <Button
              variant="outline"
              onClick={handleExcelExport}
              data-testid="button-export-excel"
            >
              <Download className="mr-2 h-4 w-4" />
              Export Excel
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle data-testid="text-form-title">Add New Product</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* ── Step 1: Main Category Selection (always visible) ── */}
              <div className="space-y-3">
                <Label data-testid="label-main-category">Select Category *</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {mainCategories.map((cat) => {
                    const isSelected = selectedMainCategory?._id === cat._id;
                    return (
                      <button
                        key={cat._id}
                        type="button"
                        onClick={() => handleMainCategorySelect(cat)}
                        data-testid={`button-category-${cat.slug}`}
                        className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-4 text-center transition-all cursor-pointer
                          ${isSelected
                            ? "border-pink-500 bg-pink-50 dark:bg-pink-950/30 shadow-md"
                            : "border-gray-200 dark:border-gray-700 hover:border-pink-300 hover:bg-pink-50/50 dark:hover:bg-pink-950/10"
                          }`}
                      >
                        {isSelected && (
                          <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-pink-500">
                            <Check className="h-3 w-3 text-white" />
                          </span>
                        )}
                        <span className="text-3xl">{CATEGORY_ICONS[cat.name] ?? "🏷️"}</span>
                        <span className={`text-sm font-semibold leading-tight ${isSelected ? "text-pink-600 dark:text-pink-400" : "text-gray-700 dark:text-gray-300"}`}>
                          {cat.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Placeholder until category picked ── */}
              {!selectedMainCategory && (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border-2 border-dashed rounded-xl">
                  <span className="text-4xl mb-3">☝️</span>
                  <p className="font-medium">Select a category above to continue</p>
                  <p className="text-sm mt-1">The form will appear once you choose a category.</p>
                </div>
              )}

              {/* ── Everything below only shows after category is selected ── */}
              {selectedMainCategory && (
                <>
                  {/* Step 2: Subcategory Selection */}
                  {selectedMainCategory.subCategories.length > 0 && (
                    <div className="space-y-3">
                      <Label data-testid="label-subcategory">Subcategory <span className="text-gray-400 font-normal">(optional)</span></Label>
                      <div className="flex flex-wrap gap-2">
                        {selectedMainCategory.subCategories.map((sub) => {
                          const isSelected = productForm.subcategory === sub.name;
                          return (
                            <button
                              key={sub.slug}
                              type="button"
                              onClick={() => setProductForm(prev => ({
                                ...prev,
                                subcategory: isSelected ? "" : sub.name
                              }))}
                              data-testid={`button-subcategory-${sub.slug}`}
                              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all
                                ${isSelected
                                  ? "border-pink-500 bg-pink-500 text-white shadow"
                                  : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-pink-400 hover:text-pink-600"
                                }`}
                            >
                              {sub.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Step 3: Images & Color (category-dependent) */}
                  {productForm.category === "JEWELLERY" ? (
                    <JewelleryImagesEditor
                      value={jewelleryData}
                      onChange={setJewelleryData}
                      adminToken={adminToken}
                    />
                  ) : (
                    <ColorVariantEditor
                      variants={colorVariants}
                      onChange={setColorVariants}
                      availableColors={AVAILABLE_COLORS}
                      adminToken={adminToken}
                      isBlouse={productForm.category === "BLOUSES"}
                    />
                  )}

                  {/* Product Name */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" data-testid="label-product-name">Product Name *</Label>
                      <Input
                        id="name"
                        value={productForm.name}
                        onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                        required
                        data-testid="input-product-name"
                      />
                    </div>
                  </div>

              <div className="space-y-2">
                <Label htmlFor="subDescription" data-testid="label-sub-description">Sub Description</Label>
                <p className="text-xs text-muted-foreground">Short one-liner shown on the product card and below the product name.</p>
                <Input
                  id="subDescription"
                  value={productForm.subDescription}
                  onChange={(e) => setProductForm({...productForm, subDescription: e.target.value})}
                  placeholder="e.g., Handcrafted pure silk saree with zari border"
                  data-testid="input-sub-description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="detailedDescription" data-testid="label-detailed-description">Detailed Description</Label>
                <p className="text-xs text-muted-foreground">Full description shown in the "Product Description" section on the detail page.</p>
                <Textarea
                  id="detailedDescription"
                  value={productForm.detailedDescription}
                  onChange={(e) => setProductForm({...productForm, detailedDescription: e.target.value})}
                  rows={5}
                  placeholder="Describe the product in detail — fabric, craftsmanship, styling tips, etc."
                  data-testid="input-detailed-description"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price" data-testid="label-price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={productForm.price}
                    onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                    required
                    data-testid="input-price"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="originalPrice" data-testid="label-original-price">Original Price</Label>
                  <Input
                    id="originalPrice"
                    type="number"
                    step="0.01"
                    value={productForm.originalPrice}
                    onChange={(e) => setProductForm({...productForm, originalPrice: e.target.value})}
                    data-testid="input-original-price"
                  />
                </div>
              </div>

              {fieldConfig && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {fieldConfig.showFabric && (
                    <div className="space-y-2">
                      <Label htmlFor="fabric" data-testid="label-fabric">Fabric</Label>
                      <Input
                        id="fabric"
                        value={productForm.fabric}
                        onChange={(e) => setProductForm({...productForm, fabric: e.target.value})}
                        data-testid="input-fabric"
                      />
                    </div>
                  )}

                  {fieldConfig.showOccasion && (
                    <div className="space-y-2">
                      <Label htmlFor="occasion" data-testid="label-occasion">Occasion</Label>
                      <Input
                        id="occasion"
                        value={productForm.occasion}
                        onChange={(e) => setProductForm({...productForm, occasion: e.target.value})}
                        data-testid="input-occasion"
                      />
                    </div>
                  )}

                  {fieldConfig.showPattern && (
                    <div className="space-y-2">
                      <Label htmlFor="pattern" data-testid="label-pattern">Pattern</Label>
                      <Input
                        id="pattern"
                        value={productForm.pattern}
                        onChange={(e) => setProductForm({...productForm, pattern: e.target.value})}
                        data-testid="input-pattern"
                      />
                    </div>
                  )}

                  {fieldConfig.showWorkType && (
                    <div className="space-y-2">
                      <Label htmlFor="workType" data-testid="label-work-type">{fieldConfig.workTypeLabel}</Label>
                      <Input
                        id="workType"
                        value={productForm.workType}
                        onChange={(e) => setProductForm({...productForm, workType: e.target.value})}
                        data-testid="input-work-type"
                      />
                    </div>
                  )}

                  {fieldConfig.showSareeLength && (
                    <div className="space-y-2">
                      <Label htmlFor="sareeLength" data-testid="label-saree-length">Saree Length</Label>
                      <Input
                        id="sareeLength"
                        value={productForm.sareeLength}
                        onChange={(e) => setProductForm({...productForm, sareeLength: e.target.value})}
                        data-testid="input-saree-length"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-6 flex-wrap">
                {fieldConfig?.showBlousePiece && (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="blousePiece"
                      checked={productForm.blousePiece}
                      onCheckedChange={(checked) => setProductForm({...productForm, blousePiece: checked as boolean})}
                      data-testid="checkbox-blouse-piece"
                    />
                    <Label htmlFor="blousePiece" data-testid="label-blouse-piece">Blouse Piece</Label>
                  </div>
                )}

                {productForm.category === "JEWELLERY" && (
                  <>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="isNew"
                        checked={productForm.isNew}
                        onCheckedChange={(checked) => setProductForm({...productForm, isNew: checked as boolean})}
                        data-testid="checkbox-is-new"
                      />
                      <Label htmlFor="isNew" data-testid="label-is-new">New Arrival</Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="isTrending"
                        checked={productForm.isTrending}
                        onCheckedChange={(checked) => setProductForm({...productForm, isTrending: checked as boolean})}
                        data-testid="checkbox-is-trending"
                      />
                      <Label htmlFor="isTrending" data-testid="label-is-trending">Trending</Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="isBestseller"
                        checked={productForm.isBestseller}
                        onCheckedChange={(checked) => setProductForm({...productForm, isBestseller: checked as boolean})}
                        data-testid="checkbox-is-bestseller"
                      />
                      <Label htmlFor="isBestseller" data-testid="label-is-bestseller">Bestseller</Label>
                    </div>
                  </>
                )}

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="onSale"
                    checked={productForm.onSale}
                    onCheckedChange={(checked) => setProductForm({...productForm, onSale: checked as boolean})}
                    data-testid="checkbox-on-sale"
                  />
                  <Label htmlFor="onSale" data-testid="label-on-sale">On Sale</Label>
                </div>
              </div>

              {productForm.category === "JEWELLERY" ? (
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-semibold text-sm">Jewellery Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="material" data-testid="label-material">Material</Label>
                      <Input
                        id="material"
                        value={productForm.material}
                        onChange={(e) => setProductForm({...productForm, material: e.target.value})}
                        placeholder="e.g., Gold, Silver, Brass, Alloy"
                        data-testid="input-material"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="plating" data-testid="label-plating">Plating / Finish</Label>
                      <Input
                        id="plating"
                        value={productForm.plating}
                        onChange={(e) => setProductForm({...productForm, plating: e.target.value})}
                        placeholder="e.g., Gold Plated, Silver Plated, Rose Gold"
                        data-testid="input-plating"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="stoneType" data-testid="label-stone-type">Stone / Gemstone</Label>
                      <Input
                        id="stoneType"
                        value={productForm.stoneType}
                        onChange={(e) => setProductForm({...productForm, stoneType: e.target.value})}
                        placeholder="e.g., Kundan, Pearl, Ruby, No Stone"
                        data-testid="input-stone-type"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="weight" data-testid="label-weight">Weight</Label>
                      <Input
                        id="weight"
                        value={productForm.weight}
                        onChange={(e) => setProductForm({...productForm, weight: e.target.value})}
                        placeholder="e.g., 45g"
                        data-testid="input-weight"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="countryOfOrigin" data-testid="label-country-of-origin">Country of Origin</Label>
                      <Input
                        id="countryOfOrigin"
                        value={productForm.countryOfOrigin}
                        onChange={(e) => setProductForm({...productForm, countryOfOrigin: e.target.value})}
                        placeholder="e.g., India"
                        data-testid="input-country-of-origin"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="setIncludes" data-testid="label-set-includes">Set Includes</Label>
                      <Input
                        id="setIncludes"
                        value={productForm.setIncludes}
                        onChange={(e) => setProductForm({...productForm, setIncludes: e.target.value})}
                        placeholder="e.g., Necklace + Earrings + Maang Tikka"
                        data-testid="input-set-includes"
                      />
                    </div>
                  </div>
                </div>
              ) : productForm.category ? (
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-semibold text-sm">Product Specifications</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fabricComposition" data-testid="label-fabric-composition">Fabric Composition</Label>
                      <Input
                        id="fabricComposition"
                        value={productForm.fabricComposition}
                        onChange={(e) => setProductForm({...productForm, fabricComposition: e.target.value})}
                        placeholder="e.g., 100% Cotton Silk"
                        data-testid="input-fabric-composition"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dimensions" data-testid="label-dimensions">Dimensions</Label>
                      <Input
                        id="dimensions"
                        value={productForm.dimensions}
                        onChange={(e) => setProductForm({...productForm, dimensions: e.target.value})}
                        placeholder="e.g., 6 meters x 1.2 meters"
                        data-testid="input-dimensions"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="weight" data-testid="label-weight">Weight</Label>
                      <Input
                        id="weight"
                        value={productForm.weight}
                        onChange={(e) => setProductForm({...productForm, weight: e.target.value})}
                        placeholder="e.g., 380g"
                        data-testid="input-weight"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="countryOfOrigin" data-testid="label-country-of-origin">Country of Origin</Label>
                      <Input
                        id="countryOfOrigin"
                        value={productForm.countryOfOrigin}
                        onChange={(e) => setProductForm({...productForm, countryOfOrigin: e.target.value})}
                        placeholder="e.g., India"
                        data-testid="input-country-of-origin"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="careInstructions" data-testid="label-care-instructions">Care Instructions</Label>
                      <Textarea
                        id="careInstructions"
                        value={productForm.careInstructions}
                        onChange={(e) => setProductForm({...productForm, careInstructions: e.target.value})}
                        placeholder="e.g., Dry clean recommended"
                        rows={2}
                        data-testid="input-care-instructions"
                      />
                    </div>
                  </div>
                </div>
              ) : null}

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={resetForm} data-testid="button-reset">
                      Reset Form
                    </Button>
                    <Button type="submit" disabled={addProductMutation.isPending} data-testid="button-submit">
                      {addProductMutation.isPending ? "Adding Product..." : "Add Product"}
                    </Button>
                  </div>
                </>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
