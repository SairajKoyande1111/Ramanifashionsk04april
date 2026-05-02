import React, { useState, useMemo, useRef } from "react";

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
import { Search, Pencil, Trash2, Upload, X, Link as LinkIcon, Download, FileUp, CheckCircle, AlertCircle, SkipForward, ChevronDown, ChevronRight, Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ColorVariantEditor, ColorVariant, ColorVariantEditorHandle } from "@/components/ColorVariantEditor";

const AVAILABLE_COLORS = [
  "Red", "Blue", "Green", "Pink", "Yellow", "Black", "White", "Purple",
  "Maroon", "Grey", "Orange", "Beige", "Brown", "Gold", "Silver",
  "Navy", "Turquoise", "Magenta", "Cream", "Burgundy", "Peach", "Lavender",
  "Dark Green", "Dark Blue", "Dark Red", "Teal", "Coral", "Rose",
];

export default function InventoryManagement() {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const adminToken = localStorage.getItem("adminToken");

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("none");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStockStatus, setFilterStockStatus] = useState("all");
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [expandedMainCats, setExpandedMainCats] = useState<Set<string>>(new Set());

  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editingVariantIndex, setEditingVariantIndex] = useState<number>(-1);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);

  const [addVariantProductId, setAddVariantProductId] = useState<string | null>(null);
  const [addVariantProductData, setAddVariantProductData] = useState<any>(null);
  const [isAddVariantOpen, setIsAddVariantOpen] = useState(false);
  const [isLoadingAddVariant, setIsLoadingAddVariant] = useState(false);
  const [addVariantNewVariants, setAddVariantNewVariants] = useState<ColorVariant[]>([]);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [deleteVariantInfo, setDeleteVariantInfo] = useState<{ productId: string; variantIndex: number; variantColor: string } | null>(null);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [editBlouseSizes, setEditBlouseSizes] = useState<Array<{ size: string; stockQuantity: number }>>([]);
  const [editNewSizeInput, setEditNewSizeInput] = useState("");
  const [editNewSizeStock, setEditNewSizeStock] = useState(0);

  const [isEditVariantDialogOpen, setIsEditVariantDialogOpen] = useState(false);
  const [editVariantProductData, setEditVariantProductData] = useState<any>(null);
  const [editVariantIndex, setEditVariantIndex] = useState<number>(-1);
  const [isLoadingEditVariant, setIsLoadingEditVariant] = useState(false);
  const [editVariantAllVariants, setEditVariantAllVariants] = useState<ColorVariant[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editVariantEditorRef = useRef<ColorVariantEditorHandle>(null);
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
      const file = files[i];
      console.log(`[Upload] File: ${file.name} | Size: ${(file.size / 1024 / 1024).toFixed(2)} MB (${(file.size / 1024).toFixed(1)} KB) | Type: ${file.type}`);
      formData.append('images', file);
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

      if (data.debug) {
        data.debug.forEach((d: any, i: number) => {
          console.log(`[Upload] Server received file ${i+1}: ${d.receivedMB} MB (${(d.receivedBytes/1024).toFixed(1)} KB)`);
        });
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

  const deleteVariantMutation = useMutation({
    mutationFn: async ({ productId, variantIndex }: { productId: string; variantIndex: number }) => {
      const response = await fetch(`/api/products/${productId}`);
      if (!response.ok) throw new Error("Failed to fetch product");
      const fullProduct = await response.json();
      const updatedVariants: ColorVariant[] = (fullProduct.colorVariants || []).filter((_: any, i: number) => i !== variantIndex);
      const totalStock = updatedVariants.reduce((sum, v) => sum + (v.stockQuantity || 0), 0);
      return apiRequest(`/api/admin/products/${productId}`, "PATCH", {
        colorVariants: updatedVariants,
        stockQuantity: totalStock,
        inStock: totalStock > 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Color variant deleted successfully!" });
      setDeleteVariantInfo(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setDeleteVariantInfo(null);
    }
  });

  const addColorVariantMutation = useMutation({
    mutationFn: async ({ productId, newVariants }: { productId: string; newVariants: ColorVariant[] }) => {
      const existingVariants = addVariantProductData?.colorVariants || [];
      const updatedVariants = [...existingVariants, ...newVariants];
      const totalStock = updatedVariants.reduce((sum: number, v: any) => sum + (v.stockQuantity || 0), 0);
      const anyInStock = updatedVariants.some((v: any) => v.inStock);
      return apiRequest(`/api/admin/products/${productId}`, "PATCH", {
        colorVariants: updatedVariants,
        stockQuantity: totalStock,
        inStock: anyInStock,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Color variant added successfully!" });
      setIsAddVariantOpen(false);
      setAddVariantProductId(null);
      setAddVariantProductData(null);
      setAddVariantNewVariants([]);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const handleOpenAddVariant = async (product: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoadingAddVariant(true);
    setIsAddVariantOpen(true);
    setAddVariantNewVariants([]);
    setAddVariantProductId(product._id);
    try {
      const response = await fetch(`/api/products/${product._id}`);
      if (!response.ok) throw new Error("Failed to fetch product");
      const fullProduct = await response.json();
      setAddVariantProductData(fullProduct);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setIsAddVariantOpen(false);
      setAddVariantProductId(null);
    } finally {
      setIsLoadingAddVariant(false);
    }
  };

  const editColorVariantMutation = useMutation({
    mutationFn: async ({ productId, variants }: { productId: string; variants: ColorVariant[] }) => {
      const totalStock = variants.reduce((sum, v) => sum + (v.stockQuantity || 0), 0);
      return apiRequest(`/api/admin/products/${productId}`, "PATCH", {
        colorVariants: variants,
        stockQuantity: totalStock,
        inStock: totalStock > 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Color variant updated successfully!" });
      setIsEditVariantDialogOpen(false);
      setEditVariantProductData(null);
      setEditVariantIndex(-1);
      setEditVariantAllVariants([]);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const handleOpenEditVariant = async (variant: any, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const vIdx = typeof variant.variantIndex === 'number' ? variant.variantIndex : 0;
    setIsLoadingEditVariant(true);
    setIsEditVariantDialogOpen(true);
    setEditVariantIndex(vIdx);
    setEditVariantAllVariants([]);
    setEditVariantProductData(null);
    try {
      const response = await fetch(`/api/products/${variant._id}`);
      if (!response.ok) throw new Error("Failed to fetch product");
      const fullProduct = await response.json();
      setEditVariantProductData(fullProduct);
      setEditVariantAllVariants(fullProduct.colorVariants || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setIsEditVariantDialogOpen(false);
    } finally {
      setIsLoadingEditVariant(false);
    }
  };

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
      setEditingVariantIndex(-1);
      setUploadedImages([]);
      setEditNewSizeInput("");
      setEditNewSizeStock(0);
      setEditBlouseSizes([]);
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
        color: "",
        occasion: fullProduct.occasion || "",
        pattern: fullProduct.pattern || "",
        workType: fullProduct.workType || "",
        blousePiece: fullProduct.blousePiece || false,
        sareeLength: fullProduct.sareeLength || "",
        stockQuantity: "0",
        inStock: fullProduct.inStock ?? true,
        isNew: fullProduct.isNew ?? false,
        isTrending: fullProduct.isTrending ?? false,
        isBestseller: fullProduct.isBestseller ?? false,
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

    // Preserve existing colorVariants unchanged — variants are managed via the variant editor
    const colorVariants = editingProduct?.colorVariants || [];
    const totalVariantStock = colorVariants.reduce((sum: number, v: any) => sum + (v.stockQuantity || 0), 0);
    const productLevelStock = totalVariantStock;

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

  const groupedInventory = useMemo(() => {
    if (!inventory) return [];

    let filtered = [...inventory];

    if (searchQuery) {
      filtered = filtered.filter((p: any) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.subcategory?.toLowerCase().includes(searchQuery.toLowerCase())
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

    const groups: Array<{ product: any; variants: any[] }> = [];

    filtered.forEach((product: any) => {
      const variantRows: any[] = [];

      if (product.colorVariants && product.colorVariants.length > 0) {
        product.colorVariants.forEach((variant: any, vIndex: number) => {
          const isBlouse = product.category === "BLOUSES";
          const variantBlouseSizes: any[] = variant.blouseSizes?.length
            ? variant.blouseSizes
            : (isBlouse && Array.isArray(product.blouseSizes) && product.blouseSizes.length > 0 ? product.blouseSizes : []);

          if (isBlouse && variantBlouseSizes.length > 0) {
            const totalBlouseStock = variantBlouseSizes.reduce((s: number, x: any) => s + (x.stockQuantity || 0), 0);
            variantRows.push({
              ...product,
              variantColor: variant.color,
              variantColorHex: variant.colorHex,
              variantIndex: vIndex,
              variantSize: null,
              variantBlouseSizes: variantBlouseSizes,
              stockQuantity: totalBlouseStock,
              inStock: totalBlouseStock > 0,
            });
          } else {
            variantRows.push({
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
        variantRows.push({ ...product, variantSize: null });
      }

      let filteredVariants = variantRows;
      if (filterStockStatus === "inStock") {
        filteredVariants = variantRows.filter((v: any) => v.inStock === true && (v.stockQuantity || 0) > 0);
      } else if (filterStockStatus === "lowStock") {
        filteredVariants = variantRows.filter((v: any) => (v.stockQuantity || 0) < 10 && (v.stockQuantity || 0) > 0 && v.inStock);
      } else if (filterStockStatus === "outOfStock") {
        filteredVariants = variantRows.filter((v: any) => !v.inStock || (v.stockQuantity || 0) === 0);
      }

      if (filteredVariants.length > 0) {
        groups.push({ product, variants: filteredVariants });
      }
    });

    if (sortBy !== "none") {
      groups.sort((a: any, b: any) => {
        const pa = a.product;
        const pb = b.product;
        switch (sortBy) {
          case "name":
            return (pa.name || "").localeCompare(pb.name || "");
          case "stock":
            return (pa.stockQuantity || 0) - (pb.stockQuantity || 0);
          case "stockDesc":
            return (pb.stockQuantity || 0) - (pa.stockQuantity || 0);
          case "price":
            return (pa.price || 0) - (pb.price || 0);
          case "category":
            return (pa.category || "").localeCompare(pb.category || "");
          default:
            return 0;
        }
      });
    }

    return groups;
  }, [inventory, searchQuery, filterCategory, filterStockStatus, sortBy]);

  const filteredInventory = groupedInventory;

  const toggleProductExpand = (productId: string) => {
    setExpandedProducts(prev => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

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
                  <SelectItem value="none" data-testid="option-sort-none">Newest First</SelectItem>
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
            Inventory ({groupedInventory.length} products)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8" data-testid="text-loading">Loading inventory...</div>
          ) : groupedInventory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="text-no-inventory">
              No inventory items found. {searchQuery || filterCategory !== "all" || filterStockStatus !== "all" ? "Try adjusting your filters." : ""}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-10" />
                    <TableHead data-testid="header-product-name" className="font-semibold min-w-[200px]">Product / Variant</TableHead>
                    <TableHead data-testid="header-category" className="font-semibold">Category</TableHead>
                    <TableHead data-testid="header-price" className="font-semibold">Price</TableHead>
                    <TableHead data-testid="header-stock" className="font-semibold">Stock</TableHead>
                    <TableHead data-testid="header-status" className="font-semibold">Status</TableHead>
                    <TableHead data-testid="header-actions" className="font-semibold text-right pr-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedInventory.map(({ product, variants }) => {
                    const isExpanded = expandedProducts.has(product._id);
                    const totalStock = variants.reduce((sum: number, v: any) => sum + (v.stockQuantity || 0), 0);
                    const allOutOfStock = variants.every((v: any) => !v.inStock || (v.stockQuantity || 0) === 0);
                    const someOutOfStock = variants.some((v: any) => !v.inStock || (v.stockQuantity || 0) === 0);
                    const someLowStock = variants.some((v: any) => (v.stockQuantity || 0) < 10 && (v.stockQuantity || 0) > 0 && v.inStock);

                    const productStatusLabel = allOutOfStock ? "Out of Stock" : someOutOfStock || someLowStock ? "Partially Low" : "In Stock";
                    const productStatusClass = allOutOfStock
                      ? "bg-red-100 text-red-700"
                      : someOutOfStock || someLowStock
                      ? "bg-orange-100 text-orange-700"
                      : "bg-green-100 text-green-700";

                    return (
                      <React.Fragment key={product._id}>
                        {/* Parent product row */}
                        <TableRow
                          key={product._id}
                          className="cursor-pointer hover:bg-muted/30 font-medium"
                          data-testid={`row-product-${product._id}`}
                          onClick={() => toggleProductExpand(product._id)}
                        >
                          <TableCell className="w-10 py-3">
                            <div className="flex items-center justify-center">
                              <ChevronRight
                                className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                                data-testid={`icon-expand-${product._id}`}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="py-3" data-testid={`cell-name-${product._id}`}>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm">{product.name}</span>
                              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                {variants.length} variant{variants.length !== 1 ? "s" : ""}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-3 text-sm text-muted-foreground" data-testid={`cell-category-${product._id}`}>
                            <div className="flex flex-col">
                              <span>{product.category}</span>
                              {product.subcategory && (
                                <span className="text-xs text-pink-600 font-medium" data-testid={`text-subcategory-${product._id}`}>
                                  {product.subcategory}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-3 text-sm font-medium" data-testid={`cell-price-${product._id}`}>
                            ₹{product.price}
                          </TableCell>
                          <TableCell className="py-3" data-testid={`cell-total-stock-${product._id}`}>
                            <span className={`font-semibold text-sm ${allOutOfStock ? "text-red-600" : someLowStock ? "text-orange-600" : "text-green-600"}`}>
                              {totalStock}
                            </span>
                          </TableCell>
                          <TableCell className="py-3" data-testid={`cell-product-status-${product._id}`}>
                            <span className={`px-2 py-1 rounded-md text-xs font-medium ${productStatusClass}`}>
                              {productStatusLabel}
                            </span>
                          </TableCell>
                          <TableCell className="py-3 text-right pr-4" onClick={(e) => e.stopPropagation()} data-testid={`cell-actions-${product._id}`}>
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={(e) => { e.stopPropagation(); handleEdit(product); }}
                                title="Edit Product Details"
                                data-testid={`button-edit-product-${product._id}`}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0 text-pink-600 border-pink-300 hover:bg-pink-50"
                                onClick={(e) => handleOpenAddVariant(product, e)}
                                title="Add Color Variant"
                                data-testid={`button-add-variant-${product._id}`}
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => setDeleteProductId(product._id)}
                                data-testid={`button-delete-${product._id}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>

                        {/* Variant sub-rows */}
                        {isExpanded && variants.map((variant: any) => {
                          const stockQuantity = variant.stockQuantity || 0;
                          const isLowStock = stockQuantity < 10 && stockQuantity > 0;
                          const isOutOfStock = !variant.inStock || stockQuantity === 0;
                          const variantKey = variant.variantColor
                            ? `${variant._id}_${variant.variantIndex}`
                            : variant._id;

                          return (
                            <TableRow
                              key={variantKey}
                              className="bg-muted/10 hover:bg-muted/25"
                              data-testid={`row-variant-${variantKey}`}
                            >
                              <TableCell className="w-10 py-2.5" />
                              <TableCell className="py-2.5 pl-8" data-testid={`cell-variant-info-${variantKey}`}>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-muted-foreground text-xs">↳</span>
                                  {variant.variantColor ? (
                                    <span className="inline-flex items-center gap-1.5 text-xs bg-white border border-border text-foreground px-2 py-0.5 rounded-full shadow-sm font-medium">
                                      {(variant.variantColorHex || variant.colorHex) && (
                                        <span
                                          className="w-3 h-3 rounded-full border border-gray-200 flex-shrink-0"
                                          style={{ backgroundColor: variant.variantColorHex || variant.colorHex }}
                                        />
                                      )}
                                      {variant.variantColor}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground text-xs">Default</span>
                                  )}
                                  {variant.variantBlouseSizes && variant.variantBlouseSizes.length > 0 && (
                                    <div className="flex flex-wrap gap-1 ml-1">
                                      {variant.variantBlouseSizes.map((s: any) => (
                                        <span
                                          key={s.size}
                                          className={`inline-block text-xs px-1.5 py-0.5 rounded border font-medium ${
                                            (s.stockQuantity || 0) === 0
                                              ? "bg-red-50 text-red-600 border-red-200"
                                              : (s.stockQuantity || 0) < 10
                                              ? "bg-orange-50 text-orange-700 border-orange-200"
                                              : "bg-blue-50 text-blue-700 border-blue-200"
                                          }`}
                                        >
                                          {s.size}: {s.stockQuantity ?? 0}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="py-2.5 text-xs text-muted-foreground">—</TableCell>
                              <TableCell className="py-2.5 text-xs text-muted-foreground">—</TableCell>
                              <TableCell className="py-2.5" data-testid={`cell-variant-stock-${variantKey}`}>
                                <span className={`text-sm font-semibold ${isOutOfStock ? "text-red-600" : isLowStock ? "text-orange-600" : "text-green-600"}`}>
                                  {stockQuantity}
                                </span>
                              </TableCell>
                              <TableCell className="py-2.5" data-testid={`cell-variant-status-${variantKey}`}>
                                <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                                  isOutOfStock ? "bg-red-100 text-red-700" : isLowStock ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"
                                }`}>
                                  {isOutOfStock ? "Out of Stock" : isLowStock ? "Low Stock" : "In Stock"}
                                </span>
                              </TableCell>
                              <TableCell className="py-2.5 text-right pr-4" data-testid={`cell-variant-actions-${variantKey}`}>
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={(e) => handleOpenEditVariant(variant, e)}
                                    data-testid={`button-edit-variant-${variantKey}`}
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteVariantInfo({
                                        productId: variant._id,
                                        variantIndex: typeof variant.variantIndex === 'number' ? variant.variantIndex : 0,
                                        variantColor: variant.variantColor || "this",
                                      });
                                    }}
                                    data-testid={`button-delete-variant-${variantKey}`}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </React.Fragment>
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
            <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 border border-border">
              To edit images or colors, use the <strong>Edit Variant</strong> button on the specific color variant.
            </p>

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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-category" data-testid="label-edit-category">Category *</Label>
                <Select
                  value={productForm.category}
                  onValueChange={(value) => setProductForm({...productForm, category: value, subcategory: ""})}
                >
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

              <div className="space-y-2">
                <Label htmlFor="edit-subcategory" data-testid="label-edit-subcategory">Sub Category</Label>
                <Select
                  value={productForm.subcategory || "__none__"}
                  onValueChange={(value) => setProductForm({...productForm, subcategory: value === "__none__" ? "" : value})}
                  disabled={!productForm.category}
                >
                  <SelectTrigger data-testid="select-edit-subcategory">
                    <SelectValue placeholder={productForm.category ? "Select sub-category" : "Select category first"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {(categoryTree || [])
                      .find((cat: any) => cat.name === productForm.category)
                      ?.subCategories?.map((sub: any) => (
                        <SelectItem key={sub.slug} value={sub.name}>{sub.name}</SelectItem>
                      )) || []}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-subDescription" data-testid="label-edit-sub-description">Short Description</Label>
              <p className="text-xs text-muted-foreground">One-liner shown on the product card and below the product name.</p>
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

              <div className="space-y-2">
                <Label data-testid="label-edit-stock-quantity">Total Stock (auto-computed from variants)</Label>
                <div className="h-10 px-3 flex items-center rounded-md border bg-muted text-muted-foreground text-sm" data-testid="text-edit-stock-quantity">
                  {(editingProduct?.colorVariants || []).reduce((sum: number, v: any) => sum + (v.stockQuantity || 0), 0)}
                </div>
              </div>
            </div>

            {productForm.category !== "JEWELLERY" && (
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
                  <Label htmlFor="edit-occasion">Occasion</Label>
                  <Input
                    id="edit-occasion"
                    value={productForm.occasion}
                    onChange={(e) => setProductForm({...productForm, occasion: e.target.value})}
                  />
                </div>

                {productForm.category === "SAREES" && (
                  <>
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
                  </>
                )}
              </div>
            )}

            <div className="flex gap-6 flex-wrap">

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

      <Dialog open={isAddVariantOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddVariantOpen(false);
          setAddVariantProductId(null);
          setAddVariantProductData(null);
          setAddVariantNewVariants([]);
        }
      }}>
        <DialogContent className="max-w-3xl max-h-screen overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="text-add-variant-dialog-title">
              Add Color Variant
              {addVariantProductData && (
                <span className="text-muted-foreground font-normal text-base ml-2">
                  — {addVariantProductData.name}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          {isLoadingAddVariant ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading product...</p>
              </div>
            </div>
          ) : addVariantProductData ? (
            <div className="space-y-4">
              {addVariantProductData.colorVariants?.length > 0 && (
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-sm font-medium mb-2">Existing color variants:</p>
                  <div className="flex flex-wrap gap-2">
                    {addVariantProductData.colorVariants.map((v: any, i: number) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 text-xs bg-white border border-border rounded-full px-2.5 py-1 shadow-sm"
                        data-testid={`badge-existing-variant-${i}`}
                      >
                        {v.colorHex && (
                          <span
                            className="w-3 h-3 rounded-full border border-gray-200 flex-shrink-0"
                            style={{ backgroundColor: v.colorHex }}
                          />
                        )}
                        {v.color}
                        <span className="text-muted-foreground">({v.stockQuantity ?? 0} in stock)</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <ColorVariantEditor
                variants={addVariantNewVariants}
                onChange={setAddVariantNewVariants}
                availableColors={AVAILABLE_COLORS}
                adminToken={adminToken}
                isBlouse={addVariantProductData.category === "BLOUSES"}
              />
              <div className="flex justify-end gap-3 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddVariantOpen(false);
                    setAddVariantProductId(null);
                    setAddVariantProductData(null);
                    setAddVariantNewVariants([]);
                  }}
                  data-testid="button-add-variant-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={addVariantNewVariants.length === 0 || addColorVariantMutation.isPending}
                  onClick={() => {
                    if (!addVariantProductId || addVariantNewVariants.length === 0) return;
                    addColorVariantMutation.mutate({ productId: addVariantProductId, newVariants: addVariantNewVariants });
                  }}
                  data-testid="button-add-variant-submit"
                >
                  {addColorVariantMutation.isPending ? "Saving..." : `Add ${addVariantNewVariants.length > 0 ? addVariantNewVariants.length : ""} Color Variant${addVariantNewVariants.length !== 1 ? "s" : ""}`}
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditVariantDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsEditVariantDialogOpen(false);
          setEditVariantProductData(null);
          setEditVariantIndex(-1);
          setEditVariantAllVariants([]);
        }
      }}>
        <DialogContent className="max-w-3xl max-h-screen overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="text-edit-variant-dialog-title">
              Edit Color Variant
              {editVariantProductData && (
                <span className="text-muted-foreground font-normal text-base ml-2">
                  — {editVariantProductData.name}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          {isLoadingEditVariant ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading variant...</p>
              </div>
            </div>
          ) : editVariantProductData && editVariantAllVariants.length > 0 ? (
            <div className="space-y-4">
              <ColorVariantEditor
                ref={editVariantEditorRef}
                key={`edit-variant-${editVariantProductData._id}-${editVariantIndex}`}
                variants={editVariantAllVariants}
                onChange={setEditVariantAllVariants}
                availableColors={AVAILABLE_COLORS}
                adminToken={adminToken}
                isBlouse={editVariantProductData.category === "BLOUSES"}
                defaultEditIndex={editVariantIndex}
              />
              <p className="text-xs text-muted-foreground">Your changes are applied automatically when you click Save Changes — no need to click "Update Color Variant" first.</p>
              <div className="flex justify-end gap-3 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditVariantDialogOpen(false);
                    setEditVariantProductData(null);
                    setEditVariantIndex(-1);
                    setEditVariantAllVariants([]);
                  }}
                  data-testid="button-edit-variant-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={editColorVariantMutation.isPending}
                  onClick={() => {
                    if (!editVariantProductData) return;
                    const finalVariants = editVariantEditorRef.current
                      ? editVariantEditorRef.current.getUpdatedVariants(editVariantAllVariants)
                      : editVariantAllVariants;
                    editColorVariantMutation.mutate({
                      productId: editVariantProductData._id,
                      variants: finalVariants,
                    });
                  }}
                  data-testid="button-edit-variant-submit"
                >
                  {editColorVariantMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteProductId} onOpenChange={() => setDeleteProductId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete entire product?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this product and ALL its color variants. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-delete-cancel">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteProductId && deleteProductMutation.mutate(deleteProductId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-delete-confirm"
            >
              {deleteProductMutation.isPending ? "Deleting..." : "Delete Product"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteVariantInfo} onOpenChange={() => setDeleteVariantInfo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete color variant?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the <strong>{deleteVariantInfo?.variantColor}</strong> color variant from this product. The rest of the product and its other variants will not be affected. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-delete-variant-cancel">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteVariantInfo && deleteVariantMutation.mutate({ productId: deleteVariantInfo.productId, variantIndex: deleteVariantInfo.variantIndex })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-delete-variant-confirm"
              disabled={deleteVariantMutation.isPending}
            >
              {deleteVariantMutation.isPending ? "Deleting..." : "Delete Variant"}
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
