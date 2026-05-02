import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Upload, X, ChevronDown, ChevronRight, ImageIcon, ArrowUp, ArrowDown, Circle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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

interface SubCategory {
  name: string;
  slug: string;
  image: string;
  description?: string;
  subCategories: SubCategory[];
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  image: string;
  subCategories: SubCategory[];
  order: number;
  isActive: boolean;
}

export default function CategoryManagement() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const adminToken = localStorage.getItem("adminToken");

  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const [editCategoryImageDialog, setEditCategoryImageDialog] = useState<Category | null>(null);
  const [categoryImageFile, setCategoryImageFile] = useState<File | null>(null);
  const [categoryImagePreview, setCategoryImagePreview] = useState<string | null>(null);

  const [addSubDialog, setAddSubDialog] = useState<Category | null>(null);
  const [newSubName, setNewSubName] = useState("");
  const [newSubImageFile, setNewSubImageFile] = useState<File | null>(null);
  const [newSubImagePreview, setNewSubImagePreview] = useState<string | null>(null);

  const [editSubDialog, setEditSubDialog] = useState<{ category: Category; sub: SubCategory } | null>(null);
  const [editSubName, setEditSubName] = useState("");
  const [editSubDescription, setEditSubDescription] = useState("");
  const [editSubImageFile, setEditSubImageFile] = useState<File | null>(null);
  const [editSubImagePreview, setEditSubImagePreview] = useState<string | null>(null);

  const [deleteSubDialog, setDeleteSubDialog] = useState<{ category: Category; sub: SubCategory } | null>(null);

  const categoryImageInputRef = useRef<HTMLInputElement>(null);
  const newSubImageInputRef = useRef<HTMLInputElement>(null);
  const editSubImageInputRef = useRef<HTMLInputElement>(null);

  if (!adminToken) {
    setLocation("/admin/ramanifashionlogin");
    return null;
  }

  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: homeCirclesData } = useQuery<any>({
    queryKey: ["/api/home-circles"],
  });

  const [homeCirclesList, setHomeCirclesList] = useState<Array<{ name: string; image: string; order: number }>>([]);
  const [showCirclesSection, setShowCirclesSection] = useState(false);

  useEffect(() => {
    if (homeCirclesData?.homeCircles) {
      const sorted = [...homeCirclesData.homeCircles].sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
      setHomeCirclesList(sorted);
    }
  }, [homeCirclesData]);

  const saveHomeCirclesMutation = useMutation({
    mutationFn: (circles: any[]) =>
      apiRequest("/api/admin/home-circles", "PUT", { homeCircles: circles }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/home-circles"] });
      toast({ title: "Home circles updated successfully!" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const allSubcategories: Array<{ name: string; image: string }> = [];
  (categories || []).forEach((cat) => {
    (cat.subCategories || []).forEach((sub: any) => {
      if (!allSubcategories.find(s => s.name === sub.name)) {
        allSubcategories.push({ name: sub.name, image: sub.image || "" });
      }
    });
  });

  const moveCircle = (index: number, direction: 'up' | 'down') => {
    const newList = [...homeCirclesList];
    const swapIdx = direction === 'up' ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= newList.length) return;
    [newList[index], newList[swapIdx]] = [newList[swapIdx], newList[index]];
    const reordered = newList.map((item, i) => ({ ...item, order: i }));
    setHomeCirclesList(reordered);
  };

  const removeCircle = (index: number) => {
    const newList = homeCirclesList.filter((_, i) => i !== index).map((item, i) => ({ ...item, order: i }));
    setHomeCirclesList(newList);
  };

  const addCircle = (sub: { name: string; image: string }) => {
    if (homeCirclesList.find(c => c.name === sub.name)) return;
    const newList = [...homeCirclesList, { name: sub.name, image: sub.image, order: homeCirclesList.length }];
    setHomeCirclesList(newList);
  };

  const uploadCategoryImageMutation = useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const form = new FormData();
      form.append("image", file);
      const res = await fetch(`/api/admin/categories/${id}/upload-image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}` },
        body: form,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setEditCategoryImageDialog(null);
      setCategoryImageFile(null);
      setCategoryImagePreview(null);
      toast({ title: "Category image updated successfully!" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const addSubcategoryMutation = useMutation({
    mutationFn: async ({ id, name, file }: { id: string; name: string; file?: File }) => {
      const form = new FormData();
      form.append("name", name);
      if (file) form.append("image", file);
      const res = await fetch(`/api/admin/categories/${id}/subcategories`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}` },
        body: form,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add subcategory");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setAddSubDialog(null);
      setNewSubName("");
      setNewSubImageFile(null);
      setNewSubImagePreview(null);
      toast({ title: "Subcategory added successfully!" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const editSubcategoryMutation = useMutation({
    mutationFn: async ({ id, subSlug, name, description, file }: { id: string; subSlug: string; name: string; description?: string; file?: File }) => {
      const form = new FormData();
      form.append("name", name);
      if (description !== undefined) form.append("description", description);
      if (file) form.append("image", file);
      const res = await fetch(`/api/admin/categories/${id}/subcategories/${subSlug}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${adminToken}` },
        body: form,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update subcategory");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setEditSubDialog(null);
      setEditSubName("");
      setEditSubDescription("");
      setEditSubImageFile(null);
      setEditSubImagePreview(null);
      toast({ title: "Subcategory updated successfully!" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteSubcategoryMutation = useMutation({
    mutationFn: async ({ id, subSlug }: { id: string; subSlug: string }) => {
      const res = await fetch(`/api/admin/categories/${id}/subcategories/${subSlug}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete subcategory");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setDeleteSubDialog(null);
      toast({ title: "Subcategory deleted successfully!" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleCategoryImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file.", variant: "destructive" });
      return;
    }
    setCategoryImageFile(file);
    setCategoryImagePreview(URL.createObjectURL(file));
  };

  const handleNewSubImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file.", variant: "destructive" });
      return;
    }
    setNewSubImageFile(file);
    setNewSubImagePreview(URL.createObjectURL(file));
  };

  const handleEditSubImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file.", variant: "destructive" });
      return;
    }
    setEditSubImageFile(file);
    setEditSubImagePreview(URL.createObjectURL(file));
  };

  const openEditSubDialog = (category: Category, sub: SubCategory) => {
    setEditSubDialog({ category, sub });
    setEditSubName(sub.name);
    setEditSubDescription(sub.description || "");
    setEditSubImageFile(null);
    setEditSubImagePreview(null);
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2" data-testid="text-page-title">
              Category Management
            </h2>
            <p className="text-muted-foreground">
              Manage main category images and their subcategories
            </p>
          </div>

          {/* Home Page Circles Management */}
          <Card className="border-pink-200 dark:border-gray-700 shadow-sm mb-6">
            <CardHeader className="pb-3">
              <button
                className="flex items-center gap-3 w-full text-left hover:opacity-80 transition-opacity"
                onClick={() => setShowCirclesSection(!showCirclesSection)}
                data-testid="button-toggle-circles-section"
              >
                {showCirclesSection ? <ChevronDown className="h-5 w-5 text-pink-500" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
                <Circle className="h-5 w-5 text-pink-500" />
                <div>
                  <CardTitle className="text-lg text-gray-900 dark:text-white">Home Page Circles</CardTitle>
                  <CardDescription>Manage which subcategories appear in the circles section on the home screen and their order</CardDescription>
                </div>
              </button>
            </CardHeader>
            {showCirclesSection && (
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Current Circles (drag to reorder using up/down arrows)</Label>
                  {homeCirclesList.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">No circles configured. Add subcategories from below.</p>
                  ) : (
                    <div className="space-y-2">
                      {homeCirclesList.map((circle, idx) => (
                        <div key={circle.name} className="flex items-center gap-3 p-2 bg-pink-50 dark:bg-gray-700 rounded-lg border border-pink-100 dark:border-gray-600">
                          <span className="text-xs font-bold text-pink-400 w-6 text-center">{idx + 1}</span>
                          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-pink-300 flex-shrink-0">
                            {circle.image ? (
                              <img src={circle.image} alt={circle.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-pink-100 flex items-center justify-center">
                                <ImageIcon className="h-4 w-4 text-pink-300" />
                              </div>
                            )}
                          </div>
                          <span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-200">{circle.name}</span>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => moveCircle(idx, 'up')} disabled={idx === 0} data-testid={`button-circle-up-${idx}`}>
                              <ArrowUp className="h-3 w-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => moveCircle(idx, 'down')} disabled={idx === homeCirclesList.length - 1} data-testid={`button-circle-down-${idx}`}>
                              <ArrowDown className="h-3 w-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => removeCircle(idx)} data-testid={`button-circle-remove-${idx}`}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {allSubcategories.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Available Subcategories (click to add)</Label>
                    <div className="flex flex-wrap gap-2">
                      {allSubcategories
                        .filter(sub => !homeCirclesList.find(c => c.name === sub.name))
                        .map((sub) => (
                          <button
                            key={sub.name}
                            onClick={() => addCircle(sub)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 border border-pink-200 dark:border-gray-600 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-gray-700 transition-colors"
                            data-testid={`button-add-circle-${sub.name.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            {sub.image && <img src={sub.image} alt={sub.name} className="w-5 h-5 rounded-full object-cover" />}
                            <Plus className="h-3 w-3 text-pink-500" />
                            {sub.name}
                          </button>
                        ))}
                      {allSubcategories.filter(sub => !homeCirclesList.find(c => c.name === sub.name)).length === 0 && (
                        <p className="text-sm text-muted-foreground">All subcategories are already in the circles list.</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white"
                    disabled={saveHomeCirclesMutation.isPending}
                    onClick={() => saveHomeCirclesMutation.mutate(homeCirclesList)}
                    data-testid="button-save-circles"
                  >
                    {saveHomeCirclesMutation.isPending ? "Saving..." : "Save Circles Order"}
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {(categories || []).map((cat) => (
                <Card key={cat._id} className="border-pink-100 dark:border-gray-700 shadow-sm" data-testid={`card-category-${cat.slug}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <button
                          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                          onClick={() => setExpandedCategory(expandedCategory === cat._id ? null : cat._id)}
                          data-testid={`button-expand-${cat.slug}`}
                        >
                          {expandedCategory === cat._id
                            ? <ChevronDown className="h-5 w-5 text-pink-500" />
                            : <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          }
                          <div className="w-14 h-14 rounded-lg overflow-hidden bg-pink-50 dark:bg-gray-700 flex items-center justify-center border border-pink-100 dark:border-gray-600">
                            {cat.image ? (
                              <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="h-6 w-6 text-pink-300" />
                            )}
                          </div>
                          <div className="text-left">
                            <CardTitle className="text-lg text-gray-900 dark:text-white">{cat.name}</CardTitle>
                            <CardDescription>{cat.subCategories?.length || 0} subcategories</CardDescription>
                          </div>
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-pink-200 hover:bg-pink-50 dark:border-gray-600 dark:hover:bg-gray-700"
                          onClick={() => {
                            setEditCategoryImageDialog(cat);
                            setCategoryImageFile(null);
                            setCategoryImagePreview(null);
                          }}
                          data-testid={`button-edit-image-${cat.slug}`}
                        >
                          <ImageIcon className="h-4 w-4 mr-1 text-pink-500" />
                          Edit Image
                        </Button>
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white"
                          onClick={() => {
                            setAddSubDialog(cat);
                            setNewSubName("");
                            setNewSubImageFile(null);
                            setNewSubImagePreview(null);
                          }}
                          data-testid={`button-add-subcategory-${cat.slug}`}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Subcategory
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {expandedCategory === cat._id && (
                    <CardContent className="pt-0">
                      <div className="border-t border-pink-50 dark:border-gray-700 pt-4">
                        {cat.subCategories && cat.subCategories.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {cat.subCategories.map((sub) => (
                              <div
                                key={sub.slug}
                                className="flex items-center gap-3 p-3 rounded-lg border border-pink-50 dark:border-gray-700 bg-pink-50/30 dark:bg-gray-800/50 hover:border-pink-200 dark:hover:border-gray-600 transition-colors"
                                data-testid={`card-sub-${sub.slug}`}
                              >
                                <div className="w-12 h-12 rounded-md overflow-hidden bg-white dark:bg-gray-700 border border-pink-100 dark:border-gray-600 flex-shrink-0 flex items-center justify-center">
                                  {sub.image ? (
                                    <img src={sub.image} alt={sub.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <ImageIcon className="h-5 w-5 text-pink-200" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{sub.name}</p>
                                </div>
                                <div className="flex gap-1 flex-shrink-0">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 hover:bg-pink-100 dark:hover:bg-gray-600"
                                    onClick={() => openEditSubDialog(cat, sub)}
                                    data-testid={`button-edit-sub-${sub.slug}`}
                                  >
                                    <Pencil className="h-3.5 w-3.5 text-pink-500" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 hover:bg-red-50 dark:hover:bg-gray-600"
                                    onClick={() => setDeleteSubDialog({ category: cat, sub })}
                                    data-testid={`button-delete-sub-${sub.slug}`}
                                  >
                                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <p className="text-sm">No subcategories yet. Add one to get started.</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Category Image Dialog */}
      <Dialog open={!!editCategoryImageDialog} onOpenChange={(open) => { if (!open) { setEditCategoryImageDialog(null); setCategoryImageFile(null); setCategoryImagePreview(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Category Image</DialogTitle>
          </DialogHeader>
          {editCategoryImageDialog && (
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">
                Update the image for <strong>{editCategoryImageDialog.name}</strong>
              </p>
              <div className="flex flex-col items-center gap-4">
                <div className="w-32 h-32 rounded-xl overflow-hidden bg-pink-50 dark:bg-gray-700 border-2 border-dashed border-pink-200 dark:border-gray-600 flex items-center justify-center">
                  {categoryImagePreview ? (
                    <img src={categoryImagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : editCategoryImageDialog.image ? (
                    <img src={editCategoryImageDialog.image} alt={editCategoryImageDialog.name} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="h-10 w-10 text-pink-300" />
                  )}
                </div>
                <input ref={categoryImageInputRef} type="file" accept="image/*" className="hidden" onChange={handleCategoryImageFileChange} />
                <Button variant="outline" size="sm" onClick={() => categoryImageInputRef.current?.click()} className="border-pink-200 hover:bg-pink-50" data-testid="button-select-category-image">
                  <Upload className="h-4 w-4 mr-2" />
                  {categoryImagePreview ? "Change Image" : "Select Image"}
                </Button>
                {categoryImageFile && (
                  <p className="text-xs text-muted-foreground truncate max-w-full">{categoryImageFile.name}</p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditCategoryImageDialog(null); setCategoryImageFile(null); setCategoryImagePreview(null); }}>
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white"
              disabled={!categoryImageFile || uploadCategoryImageMutation.isPending}
              onClick={() => {
                if (editCategoryImageDialog && categoryImageFile) {
                  uploadCategoryImageMutation.mutate({ id: editCategoryImageDialog._id, file: categoryImageFile });
                }
              }}
              data-testid="button-save-category-image"
            >
              {uploadCategoryImageMutation.isPending ? "Uploading..." : "Save Image"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Subcategory Dialog */}
      <Dialog open={!!addSubDialog} onOpenChange={(open) => { if (!open) { setAddSubDialog(null); setNewSubName(""); setNewSubImageFile(null); setNewSubImagePreview(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Subcategory</DialogTitle>
          </DialogHeader>
          {addSubDialog && (
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">
                Adding subcategory to <strong>{addSubDialog.name}</strong>
              </p>
              <div className="space-y-2">
                <Label htmlFor="sub-name">Subcategory Name *</Label>
                <Input
                  id="sub-name"
                  placeholder="e.g. Embroidered Blouses"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  data-testid="input-sub-name"
                />
              </div>
              <div className="space-y-2">
                <Label>Image (optional)</Label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-pink-50 dark:bg-gray-700 border-2 border-dashed border-pink-200 dark:border-gray-600 flex items-center justify-center flex-shrink-0">
                    {newSubImagePreview ? (
                      <img src={newSubImagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-pink-200" />
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <input ref={newSubImageInputRef} type="file" accept="image/*" className="hidden" onChange={handleNewSubImageChange} />
                    <Button variant="outline" size="sm" onClick={() => newSubImageInputRef.current?.click()} className="border-pink-200 hover:bg-pink-50" data-testid="button-select-sub-image">
                      <Upload className="h-4 w-4 mr-2" />
                      {newSubImagePreview ? "Change" : "Upload Image"}
                    </Button>
                    {newSubImagePreview && (
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 h-7 px-2" onClick={() => { setNewSubImageFile(null); setNewSubImagePreview(null); }}>
                        <X className="h-3 w-3 mr-1" /> Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddSubDialog(null); setNewSubName(""); setNewSubImageFile(null); setNewSubImagePreview(null); }}>
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white"
              disabled={!newSubName.trim() || addSubcategoryMutation.isPending}
              onClick={() => {
                if (addSubDialog && newSubName.trim()) {
                  addSubcategoryMutation.mutate({ id: addSubDialog._id, name: newSubName.trim(), file: newSubImageFile || undefined });
                }
              }}
              data-testid="button-save-subcategory"
            >
              {addSubcategoryMutation.isPending ? "Adding..." : "Add Subcategory"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Subcategory Dialog */}
      <Dialog open={!!editSubDialog} onOpenChange={(open) => { if (!open) { setEditSubDialog(null); setEditSubName(""); setEditSubDescription(""); setEditSubImageFile(null); setEditSubImagePreview(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Subcategory</DialogTitle>
          </DialogHeader>
          {editSubDialog && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="edit-sub-name">Subcategory Name *</Label>
                <Input
                  id="edit-sub-name"
                  placeholder="Subcategory name"
                  value={editSubName}
                  onChange={(e) => setEditSubName(e.target.value)}
                  data-testid="input-edit-sub-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-sub-description">Description</Label>
                <Textarea
                  id="edit-sub-description"
                  placeholder="Short description shown on the products page..."
                  value={editSubDescription}
                  onChange={(e) => setEditSubDescription(e.target.value)}
                  rows={3}
                  data-testid="textarea-edit-sub-description"
                />
              </div>
              <div className="space-y-2">
                <Label>Image</Label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-pink-50 dark:bg-gray-700 border-2 border-dashed border-pink-200 dark:border-gray-600 flex items-center justify-center flex-shrink-0">
                    {editSubImagePreview ? (
                      <img src={editSubImagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : editSubDialog.sub.image ? (
                      <img src={editSubDialog.sub.image} alt={editSubDialog.sub.name} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-pink-200" />
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <input ref={editSubImageInputRef} type="file" accept="image/*" className="hidden" onChange={handleEditSubImageChange} />
                    <Button variant="outline" size="sm" onClick={() => editSubImageInputRef.current?.click()} className="border-pink-200 hover:bg-pink-50" data-testid="button-select-edit-sub-image">
                      <Upload className="h-4 w-4 mr-2" />
                      {editSubImagePreview ? "Change" : "Update Image"}
                    </Button>
                    {editSubImagePreview && (
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 h-7 px-2" onClick={() => { setEditSubImageFile(null); setEditSubImagePreview(null); }}>
                        <X className="h-3 w-3 mr-1" /> Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditSubDialog(null); setEditSubName(""); setEditSubDescription(""); setEditSubImageFile(null); setEditSubImagePreview(null); }}>
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white"
              disabled={!editSubName.trim() || editSubcategoryMutation.isPending}
              onClick={() => {
                if (editSubDialog && editSubName.trim()) {
                  editSubcategoryMutation.mutate({
                    id: editSubDialog.category._id,
                    subSlug: editSubDialog.sub.slug,
                    name: editSubName.trim(),
                    description: editSubDescription,
                    file: editSubImageFile || undefined,
                  });
                }
              }}
              data-testid="button-save-edit-subcategory"
            >
              {editSubcategoryMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Subcategory Confirmation */}
      <AlertDialog open={!!deleteSubDialog} onOpenChange={(open) => { if (!open) setDeleteSubDialog(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subcategory</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteSubDialog?.sub.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white"
              disabled={deleteSubcategoryMutation.isPending}
              onClick={() => {
                if (deleteSubDialog) {
                  deleteSubcategoryMutation.mutate({ id: deleteSubDialog.category._id, subSlug: deleteSubDialog.sub.slug });
                }
              }}
              data-testid="button-confirm-delete-sub"
            >
              {deleteSubcategoryMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
