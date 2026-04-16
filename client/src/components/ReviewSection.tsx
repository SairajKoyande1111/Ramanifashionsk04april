import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Star, ThumbsUp, CheckCircle, ImagePlus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { auth } from "@/lib/auth";
import { useAuthUI } from "@/contexts/AuthUIContext";

interface ReviewSectionProps {
  productId: string;
}

interface Review {
  _id: string;
  customerName: string;
  rating: number;
  title: string;
  comment: string;
  verifiedPurchase: boolean;
  helpful: number;
  createdAt: string;
  photos?: string[];
}

interface ReviewData {
  reviews: Review[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export default function ReviewSection({ productId }: ReviewSectionProps) {
  const [page, setPage] = useState(1);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [uploadingCount, setUploadingCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { openLogin } = useAuthUI();

  const { data, isLoading } = useQuery<ReviewData>({
    queryKey: ["/api/reviews", productId, page],
    queryFn: async () => {
      const response = await fetch(`/api/reviews/${productId}?page=${page}&limit=10`);
      if (!response.ok) throw new Error("Failed to fetch reviews");
      return response.json();
    },
  });

  const createReviewMutation = useMutation({
    mutationFn: async (reviewData: { productId: string; rating: number; title: string; comment: string; photos: string[] }) => {
      return await apiRequest("/api/reviews", "POST", reviewData);
    },
    onSuccess: () => {
      toast({
        title: "Review submitted!",
        description: "Thank you for your feedback.",
      });
      setShowReviewForm(false);
      setTitle("");
      setComment("");
      setRating(5);
      setUploadedPhotos([]);
      queryClient.invalidateQueries({ queryKey: ["/api/reviews", productId], exact: false, refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ["/api/products", productId], exact: false, refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews"], exact: false, refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews/homepage"], exact: false, refetchType: 'all' });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive",
      });
    },
  });

  const helpfulMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      return await apiRequest(`/api/reviews/${reviewId}/helpful`, "PUT");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reviews", productId], exact: false, refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews"], exact: false, refetchType: 'all' });
    },
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remaining = 3 - uploadedPhotos.length;
    const toUpload = files.slice(0, remaining);

    if (toUpload.length === 0) {
      toast({ title: "Limit reached", description: "You can upload up to 3 photos.", variant: "destructive" });
      return;
    }

    setUploadingCount(prev => prev + toUpload.length);
    const token = localStorage.getItem("token");

    const uploadPromises = toUpload.map(async (file) => {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/reviews/upload-image", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }
      return (await res.json()).url as string;
    });

    try {
      const urls = await Promise.all(uploadPromises);
      setUploadedPhotos(prev => [...prev, ...urls]);
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingCount(prev => prev - toUpload.length);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removePhoto = (index: number) => {
    setUploadedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitReview = () => {
    if (!auth.isAuthenticated()) {
      openLogin();
      return;
    }

    if (!title.trim() || !comment.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    createReviewMutation.mutate({
      productId,
      rating,
      title: title.trim(),
      comment: comment.trim(),
      photos: uploadedPhotos,
    });
  };

  const handleWriteReview = () => {
    if (!auth.isAuthenticated()) {
      openLogin();
      return;
    }
    setShowReviewForm(true);
  };

  if (isLoading) {
    return <div className="py-8">Loading reviews...</div>;
  }

  const reviews = data?.reviews || [];
  const ratingDist = data?.ratingDistribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const totalReviews = data?.pagination.total || 0;
  const avgRating = totalReviews > 0
    ? ((ratingDist[5] * 5 + ratingDist[4] * 4 + ratingDist[3] * 3 + ratingDist[2] * 2 + ratingDist[1] * 1) / totalReviews).toFixed(1)
    : "0.0";

  const renderStars = (rating: number, size: "sm" | "md" | "lg" = "md") => {
    const sizeClasses = { sm: "w-3 h-3", md: "w-4 h-4", lg: "w-5 h-5" };
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= rating ? "fill-primary text-primary" : "fill-muted text-muted"
            }`}
          />
        ))}
      </div>
    );
  };

  const renderInteractiveStars = () => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          data-testid={`button-star-${star}`}
          onClick={() => setRating(star)}
          onMouseEnter={() => setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`w-8 h-8 ${
              star <= (hoverRating || rating) ? "fill-primary text-primary" : "fill-muted text-muted"
            }`}
          />
        </button>
      ))}
    </div>
  );

  return (
    <div className="py-8" data-testid="section-reviews">
      <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>

      {/* Rating Overview */}
      <Card className="p-6 mb-6">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="flex flex-col items-center justify-center border-r border-border pr-8">
            <div className="text-5xl font-bold mb-2" data-testid="text-avg-rating">
              {avgRating}
            </div>
            <div className="mb-2">{renderStars(Math.round(parseFloat(avgRating)), "lg")}</div>
            <div className="text-sm text-muted-foreground" data-testid="text-total-reviews">
              {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
            </div>
          </div>

          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = ratingDist[star as keyof typeof ratingDist];
              const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-sm font-medium w-12">{star} star</span>
                  <Progress value={percentage} className="flex-1" />
                  <span className="text-sm text-muted-foreground w-12 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <Button onClick={handleWriteReview} data-testid="button-write-review" variant="default">
            Write a Review
          </Button>
        </div>
      </Card>

      {/* Review Form */}
      {showReviewForm && (
        <Card className="p-6 mb-6" data-testid="form-review">
          <h3 className="text-lg font-semibold mb-4">Write Your Review</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Rating</label>
              {renderInteractiveStars()}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Summarize your experience"
                data-testid="input-review-title"
                maxLength={100}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Your Review</label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your thoughts about this product"
                data-testid="textarea-review-comment"
                rows={5}
                maxLength={1000}
              />
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Add Photos <span className="text-muted-foreground font-normal">(up to 3)</span>
              </label>
              <div className="flex flex-wrap gap-3 items-center">
                {uploadedPhotos.map((url, idx) => (
                  <div key={idx} className="relative w-20 h-20 rounded-md overflow-hidden border border-border" data-testid={`img-review-upload-${idx}`}>
                    <img src={url} alt={`Review photo ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(idx)}
                      className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 hover:bg-black/80"
                      data-testid={`button-remove-photo-${idx}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {uploadingCount > 0 && (
                  <div className="w-20 h-20 rounded-md border border-border flex items-center justify-center bg-muted">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                )}
                {uploadedPhotos.length < 3 && uploadingCount === 0 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 rounded-md border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 hover:border-primary hover:bg-muted transition-colors"
                    data-testid="button-add-photo"
                  >
                    <ImagePlus className="w-5 h-5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Add</span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handlePhotoUpload}
                  data-testid="input-review-photos"
                />
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={handleSubmitReview}
                disabled={createReviewMutation.isPending || uploadingCount > 0}
                data-testid="button-submit-review"
              >
                {createReviewMutation.isPending ? "Submitting..." : "Submit Review"}
              </Button>
              <Button
                onClick={() => { setShowReviewForm(false); setUploadedPhotos([]); }}
                variant="outline"
                data-testid="button-cancel-review"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No reviews yet. Be the first to review this product!</p>
          </Card>
        ) : (
          reviews.map((review) => (
            <Card key={review._id} className="p-6" data-testid={`card-review-${review._id}`}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="font-medium" data-testid={`text-reviewer-${review._id}`}>
                      {review.customerName}
                    </span>
                    {review.verifiedPurchase && (
                      <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        <span>Verified Purchase</span>
                      </div>
                    )}
                  </div>
                  <div className="mb-2">{renderStars(review.rating)}</div>
                  <h4 className="font-semibold mb-2" data-testid={`text-review-title-${review._id}`}>
                    {review.title}
                  </h4>
                  <p className="text-muted-foreground mb-3" data-testid={`text-review-comment-${review._id}`}>
                    {review.comment}
                  </p>

                  {/* Review Photos */}
                  {review.photos && review.photos.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {review.photos.map((photo, photoIdx) => (
                        <img
                          key={photoIdx}
                          src={photo}
                          alt={`Review photo ${photoIdx + 1}`}
                          className="w-20 h-20 object-cover rounded-md border border-border cursor-pointer hover:opacity-90 transition-opacity"
                          data-testid={`img-review-photo-${review._id}-${photoIdx}`}
                          onClick={() => window.open(photo, "_blank")}
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                    <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                    <button
                      onClick={() => {
                        if (!auth.isAuthenticated()) { openLogin(); return; }
                        helpfulMutation.mutate(review._id);
                      }}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                      data-testid={`button-helpful-${review._id}`}
                    >
                      <ThumbsUp className="w-4 h-4" />
                      Helpful ({review.helpful})
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {data && data.pagination.pages > 1 && (
        <div className="flex justify-center gap-2 mt-6 flex-wrap">
          <Button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            variant="outline"
            data-testid="button-prev-page"
          >
            Previous
          </Button>
          <div className="flex items-center gap-2 px-4">
            <span className="text-sm">Page {page} of {data.pagination.pages}</span>
          </div>
          <Button
            onClick={() => setPage((p) => Math.min(data.pagination.pages, p + 1))}
            disabled={page === data.pagination.pages}
            variant="outline"
            data-testid="button-next-page"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
