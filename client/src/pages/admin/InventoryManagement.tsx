import { useState, useMemo, useRef } from "react";
import { compressImageFile } from "@/lib/compressImage";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, Pencil, Trash2, Upload, X, Link as LinkIcon, Download, FileUp, CheckCircle, AlertCircle, SkipForward, ChevronDown, ChevronRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function InventoryManagement() {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const adminToken = localStorage.getItem("adminToken");

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("stock");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStockStatus, setFilterStockStatus] = useState("all");
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [expandedMainCats, setExpandedMainCats] = useState<Set<string>>(new Set());

  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editingVariantIndex, setEditingVariantIndex] = useState<number>(-1);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [editBlouseSizes, setEditBlouseSizes] = useState<Array<{ size: string; stockQuantity: number }>>([]);
  const [editNewSizeInput, setEditNewSizeInput] = useState("");
  const [editNewSizeStock, setEditNewSizeStock] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  const importFileRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    imported: number;
    skipped: number;
    failed: number;
    errors: string[];
    message: string;
  } | null>(null);
  const [importResultOpen, setImportResultOpen] = useState(false);
  
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
    color: "",
    occasion: "",
    pattern: "",
    workType: "",
    blousePiece: false,
    sareeLength: "",
    stockQuantity: "",
    inStock: true,
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

  const { data: inventory, isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/inventory"],
    enabled: !!adminToken,
    refetchInterval: 30000,
  });

  const { data: categoryTree } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (uploadedImages.length + files.length > 5) {
      toast({ 
        title: "Too many images", 
        description: "Maximum 5 images allowed per product",
        variant: "destructive" 
      });
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    
    for (let i = 0; i < files.length; i++) {
      const compressed = await compressImageFile(files[i]);
      formData.append('images', compressed);
    }

    try {
      const response = await fetch('/api/admin/upload-images', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        const errMsg = data?.error || data?.details || `Server error ${response.status}`;
        console.error('[Upload] Failed:', response.status, data);
        throw new Error(errMsg);
      }

      console.log('[Upload] Success:', data.urls);
      setUploadedImages([...uploadedImages, ...data.urls]);
      toast({ title: "Images uploaded successfully!" });
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('[Upload] Error:', error);
      toast({ 
        title: "Upload failed", 
        description: error.message,
        variant: "destructive" 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index));
  };

  const handleAddImageUrl = () => {
    if (!imageUrl.trim()) {
      toast({ 
        title: "URL required", 
        description: "Please enter a valid image URL",
        variant: "destructive" 
      });
      return;
    }

    if (uploadedImages.length >= 5) {
      toast({ 
        title: "Too many images", 
        description: "Maximum 5 images allowed per product",
        variant: "destructive" 
      });
      return;
    }

    try {
      new URL(imageUrl);
      setUploadedImages([...uploadedImages, imageUrl]);
      setImageUrl("");
      toast({ title: "Image URL added successfully!" });
    } catch (error) {
      toast({ 
        title: "Invalid URL", 
        description: "Please enter a valid image URL",
        variant: "destructive" 
      });
    }
  };

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: any) => apiRequest(`/api/admin/products/${id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Product updated successfully!" });
      handleCloseEditDialog();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/admin/products/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Product deleted successfully!" });
      setDeleteProductId(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await fetch('/api/admin/inventory/export', {
        headers: { 'Authorization': `Bearer ${adminToken}` },
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "Export successful", description: "Inventory downloaded as Excel file." });
    } catch (error: any) {
      toast({ title: "Export failed", description: error.message, variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/admin/inventory/import', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${adminToken}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');
      setImportResult(data);
      setImportResultOpen(true);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    } catch (error: any) {
      toast({ title: "Import failed", description: error.message, variant: "destructive" });
    } finally {
      setIsImporting(false);
    }
  };

  const handleEdit = async (product: any) => {
    setIsLoadingProduct(true);
    setIsEditDialogOpen(true);
    
    try {
      const response = await fetch(`/api/products/${product._id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch product details');
      }
      const fullProduct = await response.json();

      // Determine which variant is being edited based on the row's variantIndex
      const vIdx = typeof product.variantIndex === 'number' ? product.variantIndex : -1;
      const activeVariant = vIdx >= 0 && fullProduct.colorVariants?.[vIdx]
        ? fullProduct.colorVariants[vIdx]
        : null;

      const variantColor = activeVariant?.color
        || fullProduct.color
        || (fullProduct.colorVariants && fullProduct.colorVariants[0]?.color)
        || "";

      const variantStock = activeVariant?.stockQuantity ?? fullProduct.stockQuantity ?? 0;

      const images = activeVariant?.images?.length
        ? activeVariant.images
        : (fullProduct.images?.length ? fullProduct.images : (fullProduct.colorVariants?.[0]?.images || []));

      setEditingProduct(fullProduct);
      setEditingVariantIndex(vIdx);
      setUploadedImages(images);
      setEditNewSizeInput("");
      setEditNewSizeStock(0);
      if (fullProduct.category === "BLOUSES") {
        const variantBlouseSizes = activeVariant?.blouseSizes?.length
          ? activeVariant.blouseSizes
          : (Array.isArray(fullProduct.blouseSizes) ? fullProduct.blouseSizes : []);
        setEditBlouseSizes(variantBlouseSizes);
      } else {
        setEditBlouseSizes([]);
      }
      setProductForm({
        name: fullProduct.name || "",
        description: fullProduct.description || "",
        subDescription: fullProduct.subDescription || "",
        detailedDescription: fullProduct.detailedDescription || "",
        price: fullProduct.price?.toString() || "",
        originalPrice: fullProduct.originalPrice?.toString() || "",
        category: fullProduct.category || "",
        subcategory: fullProduct.subcategory || "",
        fabric: fullProduct.fabric || "",
        color: variantColor,
        occasion: fullProduct.occasion || "",
        pattern: fullProduct.pattern || "",
        workType: fullProduct.workType || "",
        blousePiece: fullProduct.blousePiece || false,
        sareeLength: fullProduct.sareeLength || "",
        stockQuantity: variantStock.toString(),
        inStock: variantStock > 0,
        isNew: fullProduct.isNew || false,
        isTrending: fullProduct.isTrending || false,
        isBestseller: fullProduct.isBestseller || false,
        onSale: fullProduct.onSale || false,
        fabricComposition: fullProduct.specifications?.fabricComposition || "",
        dimensions: fullProduct.specifications?.dimensions || "",
        weight: fullProduct.specifications?.weight || "",
        careInstructions: fullProduct.specifications?.careInstructions || "",
        countryOfOrigin: fullProduct.specifications?.countryOfOrigin || "",
        material: fullProduct.specifications?.material || "",
        plating: fullProduct.specifications?.plating || "",
        stoneType: fullProduct.specifications?.stoneType || "",
        setIncludes: fullProduct.specifications?.setIncludes || "",
      });
    } catch (error: any) {
      toast({ 
        title: "Error loading product", 
        description: error.message,
        variant: "destructive" 
      });
      setIsEditDialogOpen(false);
    } finally {
      setIsLoadingProduct(false);
    }
  };
  
  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingProduct(null);
    setEditingVariantIndex(-1);
    setUploadedImages([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let colorVariants;
    const newStockQty = parseInt(productForm.stockQuantity) || 0;
    if (editingProduct) {
      colorVariants = editingProduct.colorVariants || [{
        color: productForm.color || 'Default',
        images: uploadedImages.length > 0 ? uploadedImages : (editingProduct.images || [])
      }];

      if (editingVariantIndex >= 0 && colorVariants[editingVariantIndex]) {
        // Only update the specific variant being edited — leave others unchanged
        colorVariants = colorVariants.map((v: any, i: number) => {
          if (i === editingVariantIndex) {
            return {
              ...v,
              color: productForm.color || v.color,
              stockQuantity: newStockQty,
              inStock: newStockQty > 0,
              images: uploadedImages.length > 0 ? uploadedImages : v.images,
            };
          }
          return v;
        });
      } else {
        // No specific variant — update images on first variant if provided
        if (uploadedImages.length > 0 && productForm.color && colorVariants.length > 0) {
          colorVariants[0] = {
            ...colorVariants[0],
            color: productForm.color,
            images: uploadedImages,
            stockQuantity: newStockQty,
            inStock: newStockQty > 0,
          };
        }
      }
    } else {
      colorVariants = [{
        color: productForm.color || 'Default',
        images: uploadedImages
      }];
    }

    const isBlouseCategory = productForm.category === "BLOUSES";

    // For blouses: inject per-variant blouseSizes and recompute variant stockQuantity
    if (isBlouseCategory && editingVariantIndex >= 0 && colorVariants[editingVariantIndex]) {
      const variantSizeStock = editBlouseSizes.reduce((s, x) => s + (x.stockQuantity || 0), 0);
      colorVariants = colorVariants.map((v: any, i: number) => {
        if (i === editingVariantIndex) {
          return {
            ...v,
            blouseSizes: editBlouseSizes,
            stockQuantity: variantSizeStock,
            inStock: variantSizeStock > 0,
          };
        }
        return v;
      });
    }

    const totalVariantStock = colorVariants.reduce((sum: number, v: any) => sum + (v.stockQuantity || 0), 0);
    const productLevelStock = colorVariants.length > 0 ? totalVariantStock : newStockQty;

    const isJewellery = productForm.category === "JEWELLERY";

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
      color: productForm.color || undefined,
      colorVariants: colorVariants,
      blouseSizes: [],
      occasion: productForm.occasion || undefined,
      pattern: productForm.pattern || undefined,
      workType: productForm.workType || undefined,
      blousePiece: productForm.blousePiece,
      sareeLength: productForm.sareeLength || undefined,
      stockQuantity: productLevelStock,
      inStock: productLevelStock > 0,
      isNew: productForm.isNew,
      isTrending: productForm.isTrending,
      isBestseller: productForm.isBestseller,
      onSale: productForm.onSale,
      images: uploadedImages,
      specifications: isJewellery
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

    updateProductMutation.mutate({ id: editingProduct._id, data: formattedData });
  };

  const filteredInventory = useMemo(() => {
    if (!inventory) return [];

    let filtered = [...inventory];

    if (searchQuery) {
      filtered = filtered.filter((p: any) => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterCategory !== "all") {
      if (filterCategory.includes("::")) {
        const [mainCat, subCat] = filterCategory.split("::");
        filtered = filtered.filter((p: any) => p.category === mainCat && p.subcategory === subCat);
      } else {
        filtered = filtered.filter((p: any) => p.category === filterCategory);
      }
    }

    const expanded: any[] = [];
    filtered.forEach((product: any) => {
      if (product.colorVariants && product.colorVariants.length > 0) {
        product.colorVariants.forEach((variant: any, vIndex: number) => {
          const isBlouse = product.category === "BLOUSES";
          const variantBlouseSizes: any[] = variant.blouseSizes?.length
            ? variant.blouseSizes
            : (isBlouse && Array.isArray(product.blouseSizes) && product.blouseSizes.length > 0 ? product.blouseSizes : []);

          if (isBlouse && variantBlouseSizes.length > 0) {
            variantBlouseSizes.forEach((sizeEntry: any) => {
              expanded.push({
                ...product,
                variantColor: variant.color,
                variantIndex: vIndex,
                variantSize: sizeEntry.size,
                stockQuantity: sizeEntry.stockQuantity ?? 0,
                inStock: (sizeEntry.stockQuantity ?? 0) > 0,
              });
            });
          } else {
            expanded.push({
              ...product,
              variantColor: variant.color,
              variantIndex: vIndex,
              variantSize: null,
              stockQuantity: variant.stockQuantity ?? product.stockQuantity ?? 0,
              inStock: variant.inStock !== undefined ? variant.inStock : ((variant.stockQuantity ?? 0) > 0),
            });
          }
        });
      } else {
        expanded.push({ ...product, variantSize: null });
      }
    });

    let result = expanded;
    if (filterStockStatus === "inStock") {
      result = expanded.filter((p: any) => p.inStock === true && (p.stockQuantity || 0) > 0);
    } else if (filterStockStatus === "lowStock") {
      result = expanded.filter((p: any) => (p.stockQuantity || 0) < 10 && (p.stockQuantity || 0) > 0 && p.inStock);
    } else if (filterStockStatus === "outOfStock") {
      result = expanded.filter((p: any) => !p.inStock || (p.stockQuantity || 0) === 0);
    }

    result.sort((a: any, b: any) => {
      switch (sortBy) {
        case "name":
          return (a.name || "").localeCompare(b.name || "");
        case "stock":
          return (a.stockQuantity || 0) - (b.stockQuantity || 0);
        case "stockDesc":
          return (b.stockQuantity || 0) - (a.stockQuantity || 0);
        case "price":
          return (a.price || 0) - (b.price || 0);
        case "category":
          return (a.category || "").localeCompare(b.category || "");
        default:
          return 0;
      }
    });

    return result;
  }, [inventory, searchQuery, filterCategory, filterStockStatus, sortBy]);

  const categories = useMemo(() => {
    if (!inventory) return [];
    const cats = new Set(inventory.map((p: any) => p.category).filter(Boolean));
    return Array.from(cats);
  }, [inventory]);

  const categoryFilterLabel = useMemo(() => {
    if (filterCategory === "all") return "All Categories";
    if (filterCategory.includes("::")) {
      const [, sub] = filterCategory.split("::");
      return sub;
    }
    return filterCategory;
  }, [filterCategory]);

  const toggleMainCat = (name: string) => {
    setExpandedMainCats(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const totalProducts = inventory?.length || 0;
  const lowStockProducts = inventory?.filter((p: any) => (p.stockQuantity || 0) < 10 && (p.stockQuantity || 0) > 0 && p.inStock) || [];
  const outOfStockProducts = inventory?.filter((p: any) => !p.inStock || (p.stockQuantity || 0) === 0) || [];

  if (!adminToken) {
    setLocation("/login");
    return null;
  }

  return (
    <AdminLayout>
      <div className="p-6">
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">
            Inventory Management
          </h1>
          <p className="text-muted-foreground">
            Track and manage product stock levels
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <input
            ref={importFileRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleImportFileChange}
            data-testid="input-import-file"
          />
          <Button
            variant="outline"
            onClick={() => importFileRef.current?.click()}
            disabled={isImporting}
            data-testid="button-import-excel"
          >
            <FileUp className="h-4 w-4 mr-2" />
            {isImporting ? "Importing..." : "Import Excel"}
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={isExporting}
            data-testid="button-export-excel"
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? "Exporting..." : "Export Excel"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground" data-testid="text-total-products-label">
              Total Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-products">
              {totalProducts}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground" data-testid="text-low-stock-label">
              Low Stock (&lt; 10)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600" data-testid="text-low-stock">
              {lowStockProducts.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground" data-testid="text-out-of-stock-label">
              Out of Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" data-testid="text-out-of-stock">
              {outOfStockProducts.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle data-testid="text-search-filter-title">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

            {/* ── Category Tree Dropdown (leftmost) ── */}
            <div>
              <Label data-testid="label-filter-category">Category</Label>
              <Popover open={categoryDropdownOpen} onOpenChange={setCategoryDropdownOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    data-testid="button-category-filter"
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <span className={filterCategory === "all" ? "text-muted-foreground" : "font-medium text-foreground"}>
                      {categoryFilterLabel}
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-0" align="start" data-testid="popover-category-filter">
                  <div className="max-h-72 overflow-y-auto py-1">

                    {/* All Categories */}
                    <button
                      type="button"
                      onClick={() => { setFilterCategory("all"); setCategoryDropdownOpen(false); }}
                      data-testid="option-category-all"
                      className={`w-full flex items-center px-3 py-2 text-sm transition-colors hover:bg-accent
                        ${filterCategory === "all" ? "bg-pink-50 text-pink-600 font-semibold dark:bg-pink-950/30 dark:text-pink-400" : "text-foreground"}`}
                    >
                      All Categories
                    </button>

                    <div className="h-px bg-border mx-2 my-1" />

                    {/* Main categories with subcategories */}
                    {(categoryTree || []).map((cat: any) => {
                      const hasSubCats = cat.subCategories && cat.subCategories.length > 0;
                      const isExpanded = expandedMainCats.has(cat.name);
                      const isMainSelected = filterCategory === cat.name;

                      return (
                        <div key={cat._id}>
                          {/* Main category row */}
                          <div className="flex items-center">
                            <button
                              type="button"
                              onClick={() => { setFilterCategory(cat.name); setCategoryDropdownOpen(false); }}
                              data-testid={`option-category-${cat.name.toLowerCase().replace(/\s+/g, '-')}`}
                              className={`flex-1 flex items-center px-3 py-2 text-sm font-medium transition-colors hover:bg-accent
                                ${isMainSelected ? "text-pink-600 dark:text-pink-400" : "text-foreground"}`}
                            >
                              {cat.name}
                            </button>
                            {hasSubCats && (
                              <button
                                type="button"
                                onClick={() => toggleMainCat(cat.name)}
                                data-testid={`button-expand-${cat.name.toLowerCase().replace(/\s+/g, '-')}`}
                                className="pr-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
                              >
                                <ChevronRight
                                  className={`h-4 w-4 transition-transform duration-150 ${isExpanded ? "rotate-90" : ""}`}
                                />
                              </button>
                            )}
                          </div>

                          {/* Subcategories */}
                          {hasSubCats && isExpanded && (
                            <div className="ml-4 border-l border-border pl-2 pb-1">
                              {cat.subCategories.map((sub: any) => {
                                const subVal = `${cat.name}::${sub.name}`;
                                const isSubSelected = filterCategory === subVal;
                                return (
                                  <button
                                    key={sub.slug}
                                    type="button"
                                    onClick={() => { setFilterCategory(subVal); setCategoryDropdownOpen(false); }}
                                    data-testid={`option-subcategory-${sub.slug}`}
                                    className={`w-full text-left px-2 py-1.5 text-sm rounded transition-colors hover:bg-accent
                                      ${isSubSelected ? "text-pink-600 font-medium dark:text-pink-400" : "text-muted-foreground hover:text-foreground"}`}
                                  >
                                    {sub.name}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* ── Search (spans 2 cols) ── */}
            <div className="md:col-span-2">
              <Label htmlFor="search" data-testid="label-search">Search Products</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  className="pl-9"
                  placeholder="Search by name or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search"
                />
              </div>
            </div>

            {/* ── Sort By ── */}
            <div>
              <Label htmlFor="sort" data-testid="label-sort">Sort By</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger id="sort" data-testid="select-sort">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stock" data-testid="option-sort-stock-asc">Stock (Low to High)</SelectItem>
                  <SelectItem value="stockDesc" data-testid="option-sort-stock-desc">Stock (High to Low)</SelectItem>
                  <SelectItem value="name" data-testid="option-sort-name">Name (A-Z)</SelectItem>
                  <SelectItem value="price" data-testid="option-sort-price">Price</SelectItem>
                  <SelectItem value="category" data-testid="option-sort-category">Category</SelectItem>
                </SelectContent>
              </Select>
            </div>

          </div>

          <div className="mt-4 flex gap-4 flex-wrap">
            <Label data-testid="label-stock-filter">Stock Status:</Label>
            <div className="flex gap-4 flex-wrap">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="stockFilter"
                  value="all"
                  checked={filterStockStatus === "all"}
                  onChange={(e) => setFilterStockStatus(e.target.value)}
                  data-testid="radio-stock-all"
                />
                <span>All</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="stockFilter"
                  value="inStock"
                  checked={filterStockStatus === "inStock"}
                  onChange={(e) => setFilterStockStatus(e.target.value)}
                  data-testid="radio-stock-in-stock"
                />
                <span>In Stock</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="stockFilter"
                  value="lowStock"
                  checked={filterStockStatus === "lowStock"}
                  onChange={(e) => setFilterStockStatus(e.target.value)}
                  data-testid="radio-stock-low-stock"
                />
                <span>Low Stock (&lt; 10)</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="stockFilter"
                  value="outOfStock"
                  checked={filterStockStatus === "outOfStock"}
                  onChange={(e) => setFilterStockStatus(e.target.value)}
                  data-testid="radio-stock-out-of-stock"
                />
                <span>Out of Stock</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle data-testid="text-inventory-title">
            Inventory ({filteredInventory.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8" data-testid="text-loading">Loading inventory...</div>
          ) : filteredInventory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="text-no-inventory">
              No inventory items found. {searchQuery || filterCategory !== "all" || filterStockStatus !== "all" ? "Try adjusting your filters." : ""}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead data-testid="header-product-name">Product Name</TableHead>
                    <TableHead data-testid="header-color">Color</TableHead>
                    <TableHead data-testid="header-size">Size</TableHead>
                    <TableHead data-testid="header-category">Category</TableHead>
                    <TableHead data-testid="header-price">Price</TableHead>
                    <TableHead data-testid="header-current-stock">Current Stock</TableHead>
                    <TableHead data-testid="header-status">Status</TableHead>
                    <TableHead data-testid="header-actions">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.map((product: any) => {
                    const stockQuantity = product.stockQuantity || 0;
                    const isLowStock = stockQuantity < 10 && stockQuantity > 0;
                    const isOutOfStock = !product.inStock || stockQuantity === 0;
                    const rowKey = product.variantColor
                      ? (product.variantSize
                          ? `${product._id}_${product.variantIndex}_${product.variantSize}`
                          : `${product._id}_${product.variantIndex}`)
                      : product._id;

                    return (
                      <TableRow key={rowKey} data-testid={`row-inventory-${rowKey}`}>
                        <TableCell className="font-medium" data-testid={`cell-name-${rowKey}`}>
                          {product.name}
                        </TableCell>
                        <TableCell data-testid={`cell-color-${rowKey}`}>
                          {product.variantColor ? (
                            <span className="inline-block text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                              {product.variantColor}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell data-testid={`cell-size-${rowKey}`}>
                          {product.variantSize ? (
                            <span className="inline-block text-xs bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">
                              {product.variantSize}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell data-testid={`cell-category-${rowKey}`}>
                          {product.category}
                        </TableCell>
                        <TableCell data-testid={`cell-price-${rowKey}`}>
                          ₹{product.price}
                        </TableCell>
                        <TableCell data-testid={`cell-stock-${rowKey}`}>
                          <span className={
                            isOutOfStock ? 'text-red-600 font-bold' : 
                            isLowStock ? 'text-orange-600 font-semibold' : 
                            'text-green-600'
                          }>
                            {stockQuantity}
                          </span>
                        </TableCell>
                        <TableCell data-testid={`cell-status-${product._id}`}>
                          <span className={`px-2 py-1 rounded-md text-xs ${
                            isOutOfStock ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 
                            isLowStock ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' : 
                            'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          }`}>
                            {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
                          </span>
                        </TableCell>
                        <TableCell data-testid={`cell-actions-${product._id}`}>
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(product)}
                              data-testid={`button-edit-${product._id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setDeleteProductId(product._id)}
                              data-testid={`button-delete-${product._id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={(open) => !open && handleCloseEditDialog()}>
        <DialogContent className="max-w-3xl max-h-screen overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="text-edit-dialog-title">Edit Product</DialogTitle>
          </DialogHeader>
          {isLoadingProduct ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading product details...</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label data-testid="label-edit-product-images">Product Images (Max 5)</Label>
              <div className="flex gap-2 flex-wrap">
                {uploadedImages.map((url, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={url} 
                      alt={`Product ${index + 1}`}
                      className="w-20 h-20 object-cover rounded-md"
                      data-testid={`img-edit-uploaded-${index}`}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={() => removeImage(index)}
                      data-testid={`button-edit-remove-image-${index}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              {uploadedImages.length < 5 && (
                <Tabs defaultValue="device" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="device" data-testid="tab-edit-upload-device">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload from Device
                    </TabsTrigger>
                    <TabsTrigger value="url" data-testid="tab-edit-upload-url">
                      <LinkIcon className="mr-2 h-4 w-4" />
                      Upload via Link
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="device" className="space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageUpload}
                      data-testid="input-edit-file-upload-hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      data-testid="button-edit-upload-images"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {isUploading ? "Uploading..." : "Upload Images"}
                    </Button>
                  </TabsContent>
                  <TabsContent value="url" className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter image URL"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddImageUrl();
                          }
                        }}
                        data-testid="input-edit-image-url"
                      />
                      <Button
                        type="button"
                        onClick={handleAddImageUrl}
                        data-testid="button-edit-add-url"
                      >
                        Add
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name" data-testid="label-edit-product-name">Product Name *</Label>
                <Input
                  id="edit-name"
                  value={productForm.name}
                  onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                  required
                  data-testid="input-edit-product-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-category" data-testid="label-edit-category">Category *</Label>
                <Select value={productForm.category} onValueChange={(value) => setProductForm({...productForm, category: value})}>
                  <SelectTrigger data-testid="select-edit-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {(categoryTree || []).map((cat: any) => (
                      <SelectItem key={cat._id} value={cat.name}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-subDescription" data-testid="label-edit-sub-description">Sub Description</Label>
              <p className="text-xs text-muted-foreground">Short one-liner shown on the product card and below the product name.</p>
              <Input
                id="edit-subDescription"
                value={productForm.subDescription}
                onChange={(e) => setProductForm({...productForm, subDescription: e.target.value})}
                placeholder="e.g., Handcrafted pure silk saree with zari border"
                data-testid="input-edit-sub-description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-detailedDescription" data-testid="label-edit-detailed-description">Detailed Description</Label>
              <p className="text-xs text-muted-foreground">Full description shown in the "Product Description" section on the detail page.</p>
              <Textarea
                id="edit-detailedDescription"
                value={productForm.detailedDescription}
                onChange={(e) => setProductForm({...productForm, detailedDescription: e.target.value})}
                rows={4}
                placeholder="Describe the product in detail — fabric, craftsmanship, styling tips, etc."
                data-testid="input-edit-detailed-description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description" data-testid="label-edit-description">Description (legacy)</Label>
              <Textarea
                id="edit-description"
                value={productForm.description}
                onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                rows={2}
                data-testid="input-edit-description"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-price" data-testid="label-edit-price">Price *</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  value={productForm.price}
                  onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                  required
                  data-testid="input-edit-price"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-originalPrice" data-testid="label-edit-original-price">Original Price</Label>
                <Input
                  id="edit-originalPrice"
                  type="number"
                  step="0.01"
                  value={productForm.originalPrice}
                  onChange={(e) => setProductForm({...productForm, originalPrice: e.target.value})}
                  data-testid="input-edit-original-price"
                />
              </div>

              {productForm.category !== "BLOUSES" && (
                <div className="space-y-2">
                  <Label htmlFor="edit-stockQuantity" data-testid="label-edit-stock-quantity">Stock Quantity</Label>
                  <Input
                    id="edit-stockQuantity"
                    type="number"
                    value={productForm.stockQuantity}
                    onChange={(e) => setProductForm({...productForm, stockQuantity: e.target.value})}
                    data-testid="input-edit-stock-quantity"
                  />
                </div>
              )}
              {productForm.category === "BLOUSES" && (
                <div className="space-y-2">
                  <Label>Stock Quantity (auto-computed from sizes)</Label>
                  <div className="h-10 px-3 flex items-center rounded-md border bg-muted text-muted-foreground text-sm">
                    {editBlouseSizes.reduce((s, x) => s + (x.stockQuantity || 0), 0)}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-fabric">Fabric</Label>
                <Input
                  id="edit-fabric"
                  value={productForm.fabric}
                  onChange={(e) => setProductForm({...productForm, fabric: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-color">Color</Label>
                <Input
                  id="edit-color"
                  value={productForm.color}
                  onChange={(e) => setProductForm({...productForm, color: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-occasion">Occasion</Label>
                <Input
                  id="edit-occasion"
                  value={productForm.occasion}
                  onChange={(e) => setProductForm({...productForm, occasion: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-pattern">Pattern</Label>
                <Input
                  id="edit-pattern"
                  value={productForm.pattern}
                  onChange={(e) => setProductForm({...productForm, pattern: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-workType">Work Type</Label>
                <Input
                  id="edit-workType"
                  value={productForm.workType}
                  onChange={(e) => setProductForm({...productForm, workType: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-sareeLength">Saree Length</Label>
                <Input
                  id="edit-sareeLength"
                  value={productForm.sareeLength}
                  onChange={(e) => setProductForm({...productForm, sareeLength: e.target.value})}
                />
              </div>
            </div>

            <div className="flex gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="edit-blousePiece"
                  checked={productForm.blousePiece}
                  onCheckedChange={(checked) => setProductForm({...productForm, blousePiece: checked as boolean})}
                />
                <Label htmlFor="edit-blousePiece">Blouse Piece</Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="edit-inStock"
                  checked={productForm.inStock}
                  onCheckedChange={(checked) => setProductForm({...productForm, inStock: checked as boolean})}
                />
                <Label htmlFor="edit-inStock">In Stock</Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="edit-isNew"
                  checked={productForm.isNew}
                  onCheckedChange={(checked) => setProductForm({...productForm, isNew: checked as boolean})}
                />
                <Label htmlFor="edit-isNew">New Arrival</Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="edit-isTrending"
                  checked={productForm.isTrending}
                  onCheckedChange={(checked) => setProductForm({...productForm, isTrending: checked as boolean})}
                />
                <Label htmlFor="edit-isTrending">Trending</Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="edit-isBestseller"
                  checked={productForm.isBestseller}
                  onCheckedChange={(checked) => setProductForm({...productForm, isBestseller: checked as boolean})}
                />
                <Label htmlFor="edit-isBestseller">Bestseller</Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="edit-onSale"
                  checked={productForm.onSale}
                  onCheckedChange={(checked) => setProductForm({...productForm, onSale: checked as boolean})}
                  data-testid="checkbox-edit-on-sale"
                />
                <Label htmlFor="edit-onSale" data-testid="label-edit-on-sale">On Sale</Label>
              </div>
            </div>

            {/* Blouse Sizes (only shown for BLOUSES category) */}
            {productForm.category === "BLOUSES" && (
              <div className="border rounded-xl p-4 space-y-3 bg-pink-50/40">
                <h3 className="font-semibold text-sm text-pink-700">Sizes & Stock for this Color Variant</h3>
                <p className="text-xs text-muted-foreground">Edit each size's stock. Add or remove sizes as needed.</p>
                <div className="flex gap-2 items-end flex-wrap">
                  <div className="space-y-1 flex-1 min-w-[80px]">
                    <Label className="text-xs">Size</Label>
                    <Input
                      placeholder="e.g. 32"
                      value={editNewSizeInput}
                      onChange={(e) => setEditNewSizeInput(e.target.value)}
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-1 flex-1 min-w-[80px]">
                    <Label className="text-xs">Stock Qty</Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={editNewSizeStock === 0 ? "" : editNewSizeStock}
                      onChange={(e) => {
                        const v = Math.floor(Number(e.target.value));
                        setEditNewSizeStock(isNaN(v) ? 0 : Math.max(0, v));
                      }}
                      className="h-8"
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="h-8"
                    onClick={() => {
                      const trimmed = editNewSizeInput.trim();
                      if (!trimmed) {
                        toast({ title: "Enter a size", variant: "destructive" });
                        return;
                      }
                      if (editBlouseSizes.some(s => s.size === trimmed)) {
                        toast({ title: "Size already exists", variant: "destructive" });
                        return;
                      }
                      setEditBlouseSizes(prev => [...prev, { size: trimmed, stockQuantity: editNewSizeStock }]);
                      setEditNewSizeInput("");
                      setEditNewSizeStock(0);
                    }}
                  >
                    Add Size
                  </Button>
                </div>
                {editBlouseSizes.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-pink-100/60">
                        <tr>
                          <th className="text-left px-3 py-2 font-medium">Size</th>
                          <th className="text-left px-3 py-2 font-medium">Stock</th>
                          <th className="px-3 py-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {editBlouseSizes.map((s, i) => (
                          <tr key={i} className="border-t">
                            <td className="px-3 py-2 font-medium">{s.size}</td>
                            <td className="px-3 py-2">
                              <Input
                                type="number"
                                min="0"
                                className="h-7 w-24"
                                value={s.stockQuantity === 0 ? "" : s.stockQuantity}
                                placeholder="0"
                                onChange={(e) => {
                                  const v = Math.floor(Number(e.target.value));
                                  setEditBlouseSizes(prev => prev.map((item, idx) =>
                                    idx === i ? { ...item, stockQuantity: isNaN(v) ? 0 : Math.max(0, v) } : item
                                  ));
                                }}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <button
                                type="button"
                                className="text-red-500 hover:text-red-700 text-xs"
                                onClick={() => setEditBlouseSizes(prev => prev.filter((_, idx) => idx !== i))}
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="px-3 py-2 bg-pink-50/60 text-xs text-pink-700 font-medium border-t">
                      Total Stock: {editBlouseSizes.reduce((s, x) => s + (x.stockQuantity || 0), 0)}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No sizes configured yet. Add sizes above.</p>
                )}
              </div>
            )}

            {productForm.category === "JEWELLERY" ? (
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold text-sm">Jewellery Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-material" data-testid="label-edit-material">Material</Label>
                    <Input
                      id="edit-material"
                      value={productForm.material}
                      onChange={(e) => setProductForm({...productForm, material: e.target.value})}
                      placeholder="e.g., Gold, Silver, Brass, Alloy"
                      data-testid="input-edit-material"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-plating" data-testid="label-edit-plating">Plating / Finish</Label>
                    <Input
                      id="edit-plating"
                      value={productForm.plating}
                      onChange={(e) => setProductForm({...productForm, plating: e.target.value})}
                      placeholder="e.g., Gold Plated, Silver Plated, Rose Gold"
                      data-testid="input-edit-plating"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-stoneType" data-testid="label-edit-stone-type">Stone / Gemstone</Label>
                    <Input
                      id="edit-stoneType"
                      value={productForm.stoneType}
                      onChange={(e) => setProductForm({...productForm, stoneType: e.target.value})}
                      placeholder="e.g., Kundan, Pearl, Ruby, No Stone"
                      data-testid="input-edit-stone-type"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-weight-jewellery" data-testid="label-edit-weight">Weight</Label>
                    <Input
                      id="edit-weight-jewellery"
                      value={productForm.weight}
                      onChange={(e) => setProductForm({...productForm, weight: e.target.value})}
                      placeholder="e.g., 45g"
                      data-testid="input-edit-weight"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-countryOfOrigin-jewellery" data-testid="label-edit-country-of-origin">Country of Origin</Label>
                    <Input
                      id="edit-countryOfOrigin-jewellery"
                      value={productForm.countryOfOrigin}
                      onChange={(e) => setProductForm({...productForm, countryOfOrigin: e.target.value})}
                      placeholder="e.g., India"
                      data-testid="input-edit-country-of-origin"
                    />
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="edit-setIncludes" data-testid="label-edit-set-includes">Set Includes</Label>
                    <Input
                      id="edit-setIncludes"
                      value={productForm.setIncludes}
                      onChange={(e) => setProductForm({...productForm, setIncludes: e.target.value})}
                      placeholder="e.g., Necklace + Earrings + Maang Tikka"
                      data-testid="input-edit-set-includes"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold text-sm">Product Specifications</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-fabricComposition">Fabric Composition</Label>
                    <Input
                      id="edit-fabricComposition"
                      value={productForm.fabricComposition}
                      onChange={(e) => setProductForm({...productForm, fabricComposition: e.target.value})}
                      placeholder="e.g., 100% Cotton Silk"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-dimensions">Dimensions</Label>
                    <Input
                      id="edit-dimensions"
                      value={productForm.dimensions}
                      onChange={(e) => setProductForm({...productForm, dimensions: e.target.value})}
                      placeholder="e.g., 6 meters x 1.2 meters"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-weight">Weight</Label>
                    <Input
                      id="edit-weight"
                      value={productForm.weight}
                      onChange={(e) => setProductForm({...productForm, weight: e.target.value})}
                      placeholder="e.g., 380g"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-countryOfOrigin">Country of Origin</Label>
                    <Input
                      id="edit-countryOfOrigin"
                      value={productForm.countryOfOrigin}
                      onChange={(e) => setProductForm({...productForm, countryOfOrigin: e.target.value})}
                      placeholder="e.g., India"
                    />
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="edit-careInstructions">Care Instructions</Label>
                    <Textarea
                      id="edit-careInstructions"
                      value={productForm.careInstructions}
                      onChange={(e) => setProductForm({...productForm, careInstructions: e.target.value})}
                      rows={2}
                      placeholder="e.g., Dry clean recommended"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseEditDialog}
                data-testid="button-edit-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateProductMutation.isPending}
                data-testid="button-edit-submit"
              >
                {updateProductMutation.isPending ? "Updating..." : "Update Product"}
              </Button>
            </div>
          </form>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteProductId} onOpenChange={() => setDeleteProductId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this product. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-delete-cancel">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteProductId && deleteProductMutation.mutate(deleteProductId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-delete-confirm"
            >
              {deleteProductMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={importResultOpen} onOpenChange={setImportResultOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Results</DialogTitle>
          </DialogHeader>
          {importResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <div className="text-2xl font-bold text-green-700 dark:text-green-400">{importResult.imported}</div>
                  <div className="text-xs text-green-600 dark:text-green-500 font-medium">Imported</div>
                </div>
                <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800">
                  <SkipForward className="h-6 w-6 text-yellow-600" />
                  <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{importResult.skipped}</div>
                  <div className="text-xs text-yellow-600 dark:text-yellow-500 font-medium">Skipped</div>
                </div>
                <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                  <div className="text-2xl font-bold text-red-700 dark:text-red-400">{importResult.failed}</div>
                  <div className="text-xs text-red-600 dark:text-red-500 font-medium">Failed</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground text-center">{importResult.message}</p>
              {importResult.skipped > 0 && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400 text-center">
                  Skipped rows already exist in the database (matched by product name).
                </p>
              )}
              {importResult.errors.length > 0 && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-destructive">Errors:</p>
                  <div className="max-h-40 overflow-y-auto rounded border p-2 space-y-1 bg-muted/30">
                    {importResult.errors.map((err, i) => (
                      <p key={i} className="text-xs text-destructive">{err}</p>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-end">
                <Button onClick={() => setImportResultOpen(false)} data-testid="button-import-result-close">
                  Done
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      </div>
    </AdminLayout>
  );
}
