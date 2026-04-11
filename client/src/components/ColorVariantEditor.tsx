import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Upload, Link as LinkIcon, Trash2, Edit2, Plus, X } from "lucide-react";
import { compressImageFile } from "@/lib/compressImage";

export interface BlouseSize {
  size: string;
  stockQuantity: number;
}

export interface ColorVariant {
  color: string;
  images: string[];
  stockQuantity: number;
  inStock: boolean;
  isNew?: boolean;
  isBestseller?: boolean;
  isTrending?: boolean;
  blouseSizes?: BlouseSize[];
}

interface ColorVariantEditorProps {
  variants: ColorVariant[];
  onChange: (variants: ColorVariant[]) => void;
  availableColors: string[];
  adminToken: string | null;
  isBlouse?: boolean;
}

export function ColorVariantEditor({ variants, onChange, availableColors, adminToken, isBlouse = false }: ColorVariantEditorProps) {
  const { toast } = useToast();
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null, null]);
  
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [currentImages, setCurrentImages] = useState<string[]>(["", "", "", "", ""]);
  const [stockQuantity, setStockQuantity] = useState<number>(0);
  const [inStock, setInStock] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean[]>([false, false, false, false, false]);
  const [uploadFailed, setUploadFailed] = useState<boolean[]>([false, false, false, false, false]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showColorSuggestions, setShowColorSuggestions] = useState(false);

  const [variantIsNew, setVariantIsNew] = useState<boolean>(false);
  const [variantIsBestseller, setVariantIsBestseller] = useState<boolean>(false);
  const [variantIsTrending, setVariantIsTrending] = useState<boolean>(false);

  const [blouseSizes, setBlouseSizes] = useState<BlouseSize[]>([]);
  const [newSizeInput, setNewSizeInput] = useState("");
  const [newSizeStock, setNewSizeStock] = useState(0);

  const blouseTotalStock = blouseSizes.reduce((s, x) => s + (x.stockQuantity || 0), 0);
  const filteredColors = availableColors.filter((color) =>
    color.toLowerCase().includes(selectedColor.trim().toLowerCase())
  );
  const hasExactColorMatch = availableColors.some((color) =>
    color.toLowerCase() === selectedColor.trim().toLowerCase()
  );

  const handleImageUpload = async (slotIndex: number, file: File) => {
    setIsUploading(prev => {
      const newState = [...prev];
      newState[slotIndex] = true;
      return newState;
    });

    setUploadFailed(prev => {
      const newState = [...prev];
      newState[slotIndex] = false;
      return newState;
    });

    const compressed = await compressImageFile(file);
    const formData = new FormData();
    formData.append('images', compressed);

    try {
      const response = await fetch('/api/admin/upload-images', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      if (!data.urls || !data.urls[0]) {
        throw new Error('Invalid response from server');
      }
      
      setCurrentImages(prev => {
        const newImages = [...prev];
        newImages[slotIndex] = data.urls[0];
        return newImages;
      });
      toast({ title: "Image uploaded successfully!" });
    } catch (error: any) {
      setUploadFailed(prev => {
        const newState = [...prev];
        newState[slotIndex] = true;
        return newState;
      });
      setCurrentImages(prev => {
        const newImages = [...prev];
        newImages[slotIndex] = "";
        return newImages;
      });
      toast({ 
        title: "Upload failed", 
        description: error.message,
        variant: "destructive" 
      });
    } finally {
      setIsUploading(prev => {
        const newState = [...prev];
        newState[slotIndex] = false;
        return newState;
      });
    }
  };

  const handleImageUrlChange = (slotIndex: number, url: string) => {
    setCurrentImages(prev => {
      const newImages = [...prev];
      newImages[slotIndex] = url;
      return newImages;
    });
    setUploadFailed(prev => {
      const newState = [...prev];
      newState[slotIndex] = false;
      return newState;
    });
  };

  const handleAddSize = () => {
    const trimmed = newSizeInput.trim();
    if (!trimmed) {
      toast({ title: "Enter a size", variant: "destructive" });
      return;
    }
    if (blouseSizes.some(s => s.size === trimmed)) {
      toast({ title: "Size already added", variant: "destructive" });
      return;
    }
    setBlouseSizes(prev => [...prev, { size: trimmed, stockQuantity: newSizeStock }]);
    setNewSizeInput("");
    setNewSizeStock(0);
  };

  const handleRemoveSize = (i: number) => {
    setBlouseSizes(prev => prev.filter((_, idx) => idx !== i));
  };

  const handleAddOrUpdateVariant = () => {
    const colorName = selectedColor.trim();
    const colorAlreadyExists = variants.some((v, index) =>
      index !== editingIndex && v.color.trim().toLowerCase() === colorName.toLowerCase()
    );

    if (!colorName) {
      toast({ 
        title: "Color required", 
        description: "Please select or type a color name",
        variant: "destructive" 
      });
      return;
    }

    const hasActiveUploads = isUploading.some(uploading => uploading);
    if (hasActiveUploads) {
      toast({ 
        title: "Uploads in progress", 
        description: "Please wait for all image uploads to complete before adding this color variant",
        variant: "destructive" 
      });
      return;
    }

    const validImages = currentImages.filter(img => img.trim() !== "");
    if (validImages.length === 0) {
      toast({ 
        title: "At least one image required", 
        description: "Please add at least one image for this color",
        variant: "destructive" 
      });
      return;
    }

    if (validImages.length > 5) {
      toast({ 
        title: "Too many images", 
        description: "Maximum 5 images allowed per color",
        variant: "destructive" 
      });
      return;
    }

    const hasUploadFailures = uploadFailed.some((failed, idx) => failed && currentImages[idx].trim() === "");
    if (hasUploadFailures) {
      toast({ 
        title: "Upload failed for some images", 
        description: "Please retry failed uploads or remove them before adding this color variant",
        variant: "destructive" 
      });
      return;
    }

    if (isBlouse) {
      if (blouseSizes.length === 0) {
        toast({ 
          title: "Add at least one size",
          description: "Blouse variants require at least one size with stock quantity",
          variant: "destructive" 
        });
        return;
      }
      const totalStock = blouseSizes.reduce((s, x) => s + (x.stockQuantity || 0), 0);
      const variant: ColorVariant = {
        color: colorName,
        images: validImages,
        stockQuantity: totalStock,
        inStock: totalStock > 0,
        isNew: variantIsNew,
        isBestseller: variantIsBestseller,
        isTrending: variantIsTrending,
        blouseSizes: [...blouseSizes],
      };
      if (editingIndex !== null) {
        const updated = [...variants];
        updated[editingIndex] = variant;
        onChange(updated);
        toast({ title: "Color variant updated!" });
        setEditingIndex(null);
      } else {
        if (colorAlreadyExists) {
          toast({ title: "Color already exists", description: "This color has already been added", variant: "destructive" });
          return;
        }
        onChange([...variants, variant]);
        toast({ title: "Color variant added successfully!" });
      }
      setSelectedColor("");
      setCurrentImages(["", "", "", "", ""]);
      setBlouseSizes([]);
      setNewSizeInput("");
      setNewSizeStock(0);
      setVariantIsNew(false);
      setVariantIsBestseller(false);
      setVariantIsTrending(false);
      setUploadFailed([false, false, false, false, false]);
      return;
    }

    if (stockQuantity < 0) {
      toast({ 
        title: "Invalid stock quantity", 
        description: "Stock quantity cannot be negative",
        variant: "destructive" 
      });
      return;
    }

    const finalInStock = stockQuantity > 0 ? inStock : false;
    
    if (stockQuantity === 0 && inStock) {
      toast({ 
        title: "Stock adjusted", 
        description: "Stock quantity is 0, so this color variant will be marked as out of stock.",
        variant: "default"
      });
    }

    if (editingIndex !== null) {
      const updatedVariants = [...variants];
      updatedVariants[editingIndex] = { 
        color: colorName, 
        images: validImages,
        stockQuantity: stockQuantity,
        inStock: finalInStock,
        isNew: variantIsNew,
        isBestseller: variantIsBestseller,
        isTrending: variantIsTrending,
      };
      onChange(updatedVariants);
      toast({ title: "Color variant updated!" });
      setEditingIndex(null);
    } else {
      if (colorAlreadyExists) {
        toast({ 
          title: "Color already exists", 
          description: "This color has already been added",
          variant: "destructive" 
        });
        return;
      }
      onChange([...variants, { 
        color: colorName, 
        images: validImages,
        stockQuantity: stockQuantity,
        inStock: finalInStock,
        isNew: variantIsNew,
        isBestseller: variantIsBestseller,
        isTrending: variantIsTrending,
      }]);
      toast({ title: "Color variant added successfully!" });
    }

    setSelectedColor("");
    setCurrentImages(["", "", "", "", ""]);
    setStockQuantity(0);
    setInStock(true);
    setVariantIsNew(false);
    setVariantIsBestseller(false);
    setVariantIsTrending(false);
    setUploadFailed([false, false, false, false, false]);
  };

  const handleEditVariant = (index: number) => {
    const variant = variants[index];
    setSelectedColor(variant.color);
    const paddedImages = [...variant.images];
    while (paddedImages.length < 5) {
      paddedImages.push("");
    }
    setCurrentImages(paddedImages);
    if (isBlouse) {
      setBlouseSizes(variant.blouseSizes ? [...variant.blouseSizes] : []);
    } else {
      setStockQuantity(variant.stockQuantity || 0);
      setInStock(variant.inStock !== undefined ? variant.inStock : true);
    }
    setVariantIsNew(variant.isNew ?? false);
    setVariantIsBestseller(variant.isBestseller ?? false);
    setVariantIsTrending(variant.isTrending ?? false);
    setEditingIndex(index);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRemoveVariant = (index: number) => {
    onChange(variants.filter((_, i) => i !== index));
    toast({ title: "Color variant removed" });
  };

  const handleCancelEdit = () => {
    setSelectedColor("");
    setCurrentImages(["", "", "", "", ""]);
    setStockQuantity(0);
    setInStock(true);
    setVariantIsNew(false);
    setVariantIsBestseller(false);
    setVariantIsTrending(false);
    setBlouseSizes([]);
    setNewSizeInput("");
    setNewSizeStock(0);
    setUploadFailed([false, false, false, false, false]);
    setEditingIndex(null);
  };

  const removeImage = (slotIndex: number) => {
    setCurrentImages(prev => {
      const newImages = [...prev];
      newImages[slotIndex] = "";
      return newImages;
    });
    setUploadFailed(prev => {
      const newState = [...prev];
      newState[slotIndex] = false;
      return newState;
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>
            {editingIndex !== null ? "Edit Color Variant" : "Add Color Variant"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="color-select" data-testid="label-color-select">
              Color *
            </Label>
            <div className="relative">
              <Input
                id="color-select"
                value={selectedColor}
                onChange={(e) => {
                  setSelectedColor(e.target.value);
                  setShowColorSuggestions(true);
                }}
                onFocus={() => setShowColorSuggestions(true)}
                onBlur={() => setTimeout(() => setShowColorSuggestions(false), 120)}
                placeholder="Search or type a custom color name"
                autoComplete="off"
                data-testid="input-color-search"
              />
              {showColorSuggestions && (
                <div className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto rounded-md border bg-background shadow-lg" data-testid="dropdown-color-suggestions">
                  {filteredColors.length > 0 ? (
                    filteredColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setSelectedColor(color);
                          setShowColorSuggestions(false);
                        }}
                        data-testid={`option-color-${color.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {color}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-muted-foreground" data-testid="text-no-color-results">
                      No saved colors found
                    </div>
                  )}
                  {selectedColor.trim() && !hasExactColorMatch && (
                    <button
                      type="button"
                      className="w-full border-t px-3 py-2 text-left text-sm font-medium text-pink-600 hover:bg-pink-50"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setShowColorSuggestions(false);
                      }}
                      data-testid="option-use-custom-color"
                    >
                      Use custom color: {selectedColor.trim()}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {isBlouse ? (
            <div className="border rounded-xl p-4 space-y-3 bg-pink-50/40">
              <h3 className="font-semibold text-sm text-pink-700">Sizes & Stock for this Color</h3>
              <p className="text-xs text-muted-foreground">Add each available size with its own stock quantity. The color's total stock is auto-computed.</p>
              <div className="flex gap-2 items-end flex-wrap">
                <div className="space-y-1 flex-1 min-w-[90px]">
                  <Label className="text-xs">Size</Label>
                  <Input
                    placeholder="e.g. 32"
                    value={newSizeInput}
                    onChange={(e) => setNewSizeInput(e.target.value)}
                    className="h-8"
                    data-testid="input-new-blouse-size"
                  />
                </div>
                <div className="space-y-1 flex-1 min-w-[90px]">
                  <Label className="text-xs">Stock Qty</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={newSizeStock === 0 ? "" : newSizeStock}
                    onChange={(e) => {
                      const v = Math.floor(Number(e.target.value));
                      setNewSizeStock(isNaN(v) ? 0 : Math.max(0, v));
                    }}
                    className="h-8"
                    data-testid="input-new-blouse-size-stock"
                  />
                </div>
                <Button type="button" size="sm" className="h-8" onClick={handleAddSize} data-testid="button-add-size">
                  <Plus className="h-3 w-3 mr-1" /> Add Size
                </Button>
              </div>
              {blouseSizes.length > 0 && (
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
                      {blouseSizes.map((s, i) => (
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
                                setBlouseSizes(prev => prev.map((item, idx) =>
                                  idx === i ? { ...item, stockQuantity: isNaN(v) ? 0 : Math.max(0, v) } : item
                                ));
                              }}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <button type="button" className="text-red-500 hover:text-red-700 text-xs" onClick={() => handleRemoveSize(i)}>
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="px-3 py-2 bg-pink-50/60 text-xs text-pink-700 font-medium border-t">
                    Total Stock for this color: {blouseTotalStock}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stock-quantity" data-testid="label-stock-quantity">
                  Stock Quantity *
                </Label>
                <Input
                  id="stock-quantity"
                  type="number"
                  min="0"
                  value={stockQuantity === 0 ? "" : stockQuantity}
                  placeholder="0"
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === "" || raw === "-") { setStockQuantity(0); return; }
                    const num = Math.floor(Number(raw));
                    setStockQuantity(isNaN(num) ? 0 : Math.max(0, num));
                  }}
                  data-testid="input-stock-quantity"
                />
              </div>

              <div className="space-y-2 flex items-end">
                <div className="flex items-center gap-2 h-9">
                  <input
                    id="in-stock"
                    type="checkbox"
                    checked={inStock}
                    onChange={(e) => setInStock(e.target.checked)}
                    className="h-4 w-4"
                    data-testid="checkbox-in-stock"
                  />
                  <Label htmlFor="in-stock" className="cursor-pointer" data-testid="label-in-stock">
                    In Stock
                  </Label>
                </div>
              </div>
            </div>
          )}

          <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
            <Label className="text-sm font-medium">Status Tags for this Color Variant</Label>
            <p className="text-xs text-muted-foreground">These tags apply only to this specific color variant.</p>
            <div className="flex gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="variant-isNew"
                  checked={variantIsNew}
                  onCheckedChange={(checked) => setVariantIsNew(checked as boolean)}
                  data-testid="checkbox-variant-is-new"
                />
                <Label htmlFor="variant-isNew" className="cursor-pointer text-sm" data-testid="label-variant-is-new">New Arrival</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="variant-isBestseller"
                  checked={variantIsBestseller}
                  onCheckedChange={(checked) => setVariantIsBestseller(checked as boolean)}
                  data-testid="checkbox-variant-is-bestseller"
                />
                <Label htmlFor="variant-isBestseller" className="cursor-pointer text-sm" data-testid="label-variant-is-bestseller">Bestseller</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="variant-isTrending"
                  checked={variantIsTrending}
                  onCheckedChange={(checked) => setVariantIsTrending(checked as boolean)}
                  data-testid="checkbox-variant-is-trending"
                />
                <Label htmlFor="variant-isTrending" className="cursor-pointer text-sm" data-testid="label-variant-is-trending">Trending</Label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label data-testid="label-color-images">
              Product Images (1-5 images required) *
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[0, 1, 2, 3, 4].map((slotIndex) => (
                <Card key={slotIndex} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Image {slotIndex + 1}</span>
                    {currentImages[slotIndex] && (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => removeImage(slotIndex)}
                        data-testid={`button-remove-image-${slotIndex}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {currentImages[slotIndex] ? (
                    <div className="aspect-square relative rounded-md overflow-hidden bg-muted">
                      <img 
                        src={currentImages[slotIndex]} 
                        alt={`Preview ${slotIndex + 1}`}
                        className="w-full h-full object-cover"
                        data-testid={`img-preview-${slotIndex}`}
                      />
                    </div>
                  ) : (
                    <div className="aspect-square rounded-md border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted">
                      <Upload className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                  )}

                  <input
                    ref={el => fileInputRefs.current[slotIndex] = el}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(slotIndex, file);
                    }}
                    data-testid={`input-file-${slotIndex}`}
                  />

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => fileInputRefs.current[slotIndex]?.click()}
                    disabled={isUploading[slotIndex]}
                    data-testid={`button-upload-${slotIndex}`}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {isUploading[slotIndex] ? "Uploading..." : "Upload"}
                  </Button>

                  <div className="flex gap-2">
                    <Input
                      placeholder="Or paste image URL"
                      value={currentImages[slotIndex]}
                      onChange={(e) => handleImageUrlChange(slotIndex, e.target.value)}
                      data-testid={`input-url-${slotIndex}`}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      data-testid={`button-url-${slotIndex}`}
                    >
                      <LinkIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              onClick={handleAddOrUpdateVariant}
              data-testid="button-add-color-variant"
            >
              <Plus className="mr-2 h-4 w-4" />
              {editingIndex !== null ? "Update Color Variant" : "Add Color Variant"}
            </Button>
            {editingIndex !== null && (
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelEdit}
                data-testid="button-cancel-edit"
              >
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {variants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Added Color Variants ({variants.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {variants.map((variant, index) => (
                <Card key={index} data-testid={`card-variant-${index}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge data-testid={`badge-color-${index}`}>{variant.color}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {variant.images.length} image{variant.images.length !== 1 ? 's' : ''}
                          </span>
                          {variant.isNew && <Badge variant="outline" className="text-green-600 border-green-400 text-xs">New</Badge>}
                          {variant.isBestseller && <Badge variant="outline" className="text-amber-600 border-amber-400 text-xs">Bestseller</Badge>}
                          {variant.isTrending && <Badge variant="outline" className="text-blue-600 border-blue-400 text-xs">Trending</Badge>}
                          {isBlouse ? (
                            <>
                              <Badge variant="secondary" data-testid={`badge-stock-status-${index}`}>
                                Total Stock: {variant.stockQuantity ?? 0}
                              </Badge>
                              {variant.blouseSizes && variant.blouseSizes.length > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  Sizes: {variant.blouseSizes.map(s => `${s.size}(${s.stockQuantity})`).join(', ')}
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              <Badge variant={(variant.inStock ?? true) ? "default" : "secondary"} data-testid={`badge-stock-status-${index}`}>
                                Stock: {variant.stockQuantity ?? 0}
                              </Badge>
                              <Badge variant={(variant.inStock ?? true) ? "default" : "secondary"} data-testid={`badge-availability-${index}`}>
                                {(variant.inStock ?? true) ? "In Stock" : "Out of Stock"}
                              </Badge>
                            </>
                          )}
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {variant.images.map((img, imgIndex) => (
                            <div 
                              key={imgIndex} 
                              className="w-16 h-16 rounded-md overflow-hidden bg-muted"
                              data-testid={`img-thumb-${index}-${imgIndex}`}
                            >
                              <img 
                                src={img} 
                                alt={`${variant.color} ${imgIndex + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={() => handleEditVariant(index)}
                          data-testid={`button-edit-variant-${index}`}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={() => handleRemoveVariant(index)}
                          data-testid={`button-remove-variant-${index}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
