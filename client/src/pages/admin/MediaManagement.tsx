import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Upload, Check, Trash2, Monitor, Smartphone, Image, Link as LinkIcon, X, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

interface CategoryItem {
  _id: string;
  name: string;
  slug: string;
  subCategories?: { name: string; slug: string }[];
}

const NO_LINK = "__none__";

function buildCategoryOptions(categories: CategoryItem[]) {
  const options: { label: string; value: string }[] = [
    { label: "No link (not clickable)", value: NO_LINK },
  ];
  for (const cat of categories) {
    options.push({ label: cat.name, value: `/products?category=${encodeURIComponent(cat.name)}` });
    if (cat.subCategories) {
      for (const sub of cat.subCategories) {
        options.push({ label: `  ${cat.name} › ${sub.name}`, value: `/products?category=${encodeURIComponent(sub.name)}` });
      }
    }
  }
  return options;
}

function CategoryLinkDialog({
  bannerId,
  currentLink,
  onClose,
  categoryOptions,
  adminToken,
}: {
  bannerId: string;
  currentLink: string;
  onClose: () => void;
  categoryOptions: { label: string; value: string }[];
  adminToken: string;
}) {
  const { toast } = useToast();
  const [selected, setSelected] = useState(currentLink || NO_LINK);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const linkValue = selected === NO_LINK ? "" : selected;
      const res = await fetch(`/api/admin/hero-banners/${bannerId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ categoryLink: linkValue }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Update failed");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Banner link updated!" });
      queryClient.invalidateQueries({ queryKey: ["/api/hero-banners"] });
      onClose();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Set Banner Category Link</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          When a visitor clicks this banner, they will be taken to the selected category page.
        </p>
        <div className="space-y-3 pt-2">
          <Label>Link to Category</Label>
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger data-testid="select-banner-category-link">
              <SelectValue placeholder="Choose category..." />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selected && selected !== NO_LINK && (
            <p className="text-xs text-muted-foreground">Redirects to: <span className="font-mono">{selected}</span></p>
          )}
        </div>
        <div className="flex gap-3 pt-2">
          <Button
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
            data-testid="button-save-banner-link"
          >
            {updateMutation.isPending ? "Saving..." : "Save Link"}
          </Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CarouselUploadSection({
  type,
  label,
  description,
  icon: Icon,
  aspectHint,
  categoryOptions,
}: {
  type: "desktop" | "mobile";
  label: string;
  description: string;
  icon: React.ElementType;
  aspectHint: string;
  categoryOptions: { label: string; value: string }[];
}) {
  const { toast } = useToast();
  const adminToken = localStorage.getItem("adminToken") ?? "";
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [linkBanner, setLinkBanner] = useState<BannerItem | null>(null);
  const [uploadCategoryLink, setUploadCategoryLink] = useState("");

  const { data: bannersData, isLoading } = useQuery<HeroBannersData>({
    queryKey: ["/api/hero-banners"],
  });

  const slides = type === "desktop" ? (bannersData?.desktop ?? []) : (bannersData?.mobile ?? []);

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/admin/hero-banners/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}` },
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: `${label} image uploaded!` });
      setSelectedFile(null);
      setPreview(null);
      setUploadCategoryLink("");
      queryClient.invalidateQueries({ queryKey: ["/api/hero-banners"] });
    },
    onError: (error: any) => {
      toast({ title: "Upload error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) =>
      apiRequest(`/api/admin/hero-banners/${id}`, "DELETE"),
    onSuccess: () => {
      toast({ title: "Banner removed" });
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/hero-banners"] });
    },
    onError: (error: any) => {
      toast({ title: "Delete error", description: error.message, variant: "destructive" });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file", variant: "destructive" });
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append("image", selectedFile);
    formData.append("type", type);
    const linkValue = uploadCategoryLink && uploadCategoryLink !== NO_LINK ? uploadCategoryLink : "";
    if (linkValue) formData.append("categoryLink", linkValue);
    uploadMutation.mutate(formData);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-pink-600" />
            {label}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : slides.length > 0 ? (
            <div>
              <p className="text-sm font-medium mb-3">Current Slides ({slides.length})</p>
              <div className={`grid gap-3 ${type === "mobile" ? "grid-cols-3 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-3"}`}>
                {slides.map((slide, index) => (
                  <div key={slide._id} className="relative group rounded-lg overflow-hidden border border-border">
                    <img
                      src={`${slide.url}?t=${Date.now()}`}
                      alt={`${label} ${index + 1}`}
                      className={`w-full object-cover ${type === "mobile" ? "aspect-[9/16]" : "aspect-video"}`}
                      data-testid={`img-${type}-banner-${index}`}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setLinkBanner(slide)}
                        data-testid={`button-link-${type}-${index}`}
                        title="Set category link"
                      >
                        <LinkIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setDeleteId(slide._id)}
                        data-testid={`button-delete-${type}-${index}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                      #{index + 1}
                    </div>
                    {slide.categoryLink && (
                      <div className="absolute top-1 right-1 bg-green-600 text-white rounded-full p-0.5" title={`Links to: ${slide.categoryLink}`}>
                        <LinkIcon className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <Image className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No {type} banners uploaded yet</p>
            </div>
          )}

          <div className="border-t pt-4 space-y-3">
            <p className="text-sm font-medium">Add New Slide</p>
            <p className="text-xs text-muted-foreground">{aspectHint}</p>
            {preview && (
              <div className="p-2 bg-muted rounded-lg">
                <img
                  src={preview}
                  alt="Preview"
                  className={`mx-auto object-cover rounded ${type === "mobile" ? "max-h-40 max-w-24" : "max-h-32 max-w-full"}`}
                />
                <p className="text-xs text-muted-foreground mt-1">{selectedFile?.name}</p>
              </div>
            )}

            {selectedFile && categoryOptions.length > 0 && (
              <div className="space-y-1">
                <Label className="text-sm">Link this banner to a category (optional)</Label>
                <Select value={uploadCategoryLink} onValueChange={setUploadCategoryLink}>
                  <SelectTrigger data-testid={`select-upload-category-${type}`}>
                    <SelectValue placeholder="No link (not clickable)" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Label
                htmlFor={`carousel-${type}`}
                className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-200 rounded-md hover:bg-pink-200 dark:hover:bg-pink-800 text-sm"
              >
                <Upload className="h-4 w-4" />
                Choose Image
              </Label>
              <input
                id={`carousel-${type}`}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                data-testid={`input-${type}-carousel-image`}
              />
              {selectedFile && (
                <>
                  <Check className="h-5 w-5 text-green-600" />
                  <Button
                    size="sm"
                    onClick={handleUpload}
                    disabled={uploadMutation.isPending}
                    data-testid={`button-upload-${type}-carousel`}
                  >
                    {uploadMutation.isPending ? "Uploading..." : "Upload Slide"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>

        <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Banner Slide?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this slide from the {type} carousel. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                className="bg-red-600 hover:bg-red-700"
                data-testid="button-confirm-delete-banner"
              >
                Remove Slide
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>

      {linkBanner && (
        <CategoryLinkDialog
          bannerId={linkBanner._id}
          currentLink={linkBanner.categoryLink}
          categoryOptions={categoryOptions}
          adminToken={adminToken}
          onClose={() => setLinkBanner(null)}
        />
      )}
    </>
  );
}

export default function MediaManagement() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const adminToken = localStorage.getItem("adminToken");

  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [previewBanner, setPreviewBanner] = useState<string | null>(null);
  const [previewVideo, setPreviewVideo] = useState<string | null>(null);

  const { data: categories = [] } = useQuery<CategoryItem[]>({
    queryKey: ["/api/categories"],
  });

  const { data: siteSettings } = useQuery<any>({
    queryKey: ["/api/settings"],
    staleTime: 0,
  });

  const showRamaniBanner = siteSettings?.showRamaniBanner !== false;
  const showPromotionalVideo = siteSettings?.showPromotionalVideo !== false;

  const visibilityMutation = useMutation({
    mutationFn: async (body: { showRamaniBanner?: boolean; showPromotionalVideo?: boolean }) => {
      const res = await fetch("/api/admin/settings/homepage-visibility", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Update failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const categoryOptions = buildCategoryOptions(categories);

  if (!adminToken) {
    setLocation("/admin/login");
    return null;
  }

  const uploadMutation = useMutation({
    mutationFn: async (data: FormData) =>
      apiRequest("/api/admin/upload-media", "POST", data as any, true),
    onSuccess: () => {
      toast({
        title: "Media uploaded successfully!",
        description: "Homepage media has been updated.",
      });
      setBannerFile(null);
      setVideoFile(null);
      setPreviewBanner(null);
      setPreviewVideo(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/media"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error uploading media",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({ title: "Invalid file", description: "Banner must be an image file", variant: "destructive" });
        return;
      }
      setBannerFile(file);
      const reader = new FileReader();
      reader.onload = (event) => setPreviewBanner(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("video/")) {
        toast({ title: "Invalid file", description: "Video must be a video file", variant: "destructive" });
        return;
      }
      setVideoFile(file);
      const reader = new FileReader();
      reader.onload = (event) => setPreviewVideo(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerFile && !videoFile) {
      toast({ title: "No files selected", description: "Please select at least one file to upload", variant: "destructive" });
      return;
    }
    const formData = new FormData();
    if (bannerFile) formData.append("banner", bannerFile);
    if (videoFile) formData.append("video", videoFile);
    uploadMutation.mutate(formData);
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2" data-testid="text-page-title">
              Update Images & Video
            </h2>
            <p className="text-muted-foreground">
              Manage homepage hero carousel banners (desktop & mobile), branding banner, and promotional video
            </p>
          </div>

          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Hero carousel: Add multiple slides for desktop and mobile independently. Hover over a slide and click the <strong>link icon</strong> to make it redirect to a category when visitors click on it.
            </AlertDescription>
          </Alert>

          <div className="space-y-6">
            <CarouselUploadSection
              type="desktop"
              label="Desktop Hero Carousel"
              description="Landscape images shown on tablets and desktops. Each uploaded image becomes a carousel slide."
              icon={Monitor}
              aspectHint="Recommended: 1920×1080 (16:9 landscape). Upload one image at a time to add slides."
              categoryOptions={categoryOptions}
            />

            <CarouselUploadSection
              type="mobile"
              label="Mobile Hero Carousel"
              description="Portrait images shown on mobile phones. Each uploaded image becomes a carousel slide."
              icon={Smartphone}
              aspectHint="Recommended size: 1080 × 1350 px (4:5 portrait ratio). This matches the banner height on mobile screens. Minimum width: 1080 px."
              categoryOptions={categoryOptions}
            />

            <form onSubmit={handleSubmit} className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle>Ramani Fashion Banner</CardTitle>
                      <CardDescription className="mt-1">
                        Central branding banner section. Recommended: 1200×600 or similar aspect ratio
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 pt-1">
                      {showRamaniBanner ? (
                        <Eye className="h-4 w-4 text-green-600" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}
                      <Switch
                        checked={showRamaniBanner}
                        onCheckedChange={(checked) =>
                          visibilityMutation.mutate({ showRamaniBanner: checked })
                        }
                        disabled={visibilityMutation.isPending}
                        data-testid="switch-show-ramani-banner"
                      />
                      <span className="text-sm font-medium whitespace-nowrap">
                        {showRamaniBanner ? "Visible" : "Hidden"}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!showRamaniBanner && (
                    <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <EyeOff className="h-4 w-4 text-amber-600 shrink-0" />
                      <p className="text-sm text-amber-700 dark:text-amber-400">
                        This section is currently hidden from the homepage. Toggle the switch to make it visible.
                      </p>
                    </div>
                  )}
                  {previewBanner && (
                    <div className="mb-4 p-2 bg-gray-100 dark:bg-gray-700 rounded">
                      <img src={previewBanner} alt="Banner preview" className="max-h-64 mx-auto" />
                      <p className="text-sm text-muted-foreground mt-2">{bannerFile?.name}</p>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="banner" className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-200 rounded-md hover:bg-pink-200 dark:hover:bg-pink-800">
                      <Upload className="h-4 w-4" />
                      Choose Banner Image
                    </Label>
                    <input
                      id="banner"
                      type="file"
                      accept="image/*"
                      onChange={handleBannerChange}
                      className="hidden"
                      data-testid="input-banner-image"
                    />
                    {bannerFile && <Check className="h-5 w-5 text-green-600" />}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle>Promotional Video</CardTitle>
                      <CardDescription className="mt-1">
                        Featured video on the homepage. Supports MP4, WebM, and other video formats
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 pt-1">
                      {showPromotionalVideo ? (
                        <Eye className="h-4 w-4 text-green-600" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}
                      <Switch
                        checked={showPromotionalVideo}
                        onCheckedChange={(checked) =>
                          visibilityMutation.mutate({ showPromotionalVideo: checked })
                        }
                        disabled={visibilityMutation.isPending}
                        data-testid="switch-show-promotional-video"
                      />
                      <span className="text-sm font-medium whitespace-nowrap">
                        {showPromotionalVideo ? "Visible" : "Hidden"}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!showPromotionalVideo && (
                    <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <EyeOff className="h-4 w-4 text-amber-600 shrink-0" />
                      <p className="text-sm text-amber-700 dark:text-amber-400">
                        This section is currently hidden from the homepage. Toggle the switch to make it visible.
                      </p>
                    </div>
                  )}
                  {previewVideo && (
                    <div className="mb-4 p-2 bg-gray-100 dark:bg-gray-700 rounded">
                      <video src={previewVideo} className="max-h-64 mx-auto" controls />
                      <p className="text-sm text-muted-foreground mt-2">{videoFile?.name}</p>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="video" className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-200 rounded-md hover:bg-pink-200 dark:hover:bg-pink-800">
                      <Upload className="h-4 w-4" />
                      Choose Video File
                    </Label>
                    <input
                      id="video"
                      type="file"
                      accept="video/*"
                      onChange={handleVideoChange}
                      className="hidden"
                      data-testid="input-video-file"
                    />
                    {videoFile && <Check className="h-5 w-5 text-green-600" />}
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={uploadMutation.isPending || (!bannerFile && !videoFile)}
                  data-testid="button-upload-media"
                >
                  {uploadMutation.isPending ? "Uploading..." : "Upload Media"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setBannerFile(null);
                    setVideoFile(null);
                    setPreviewBanner(null);
                    setPreviewVideo(null);
                  }}
                  data-testid="button-cancel-upload"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
