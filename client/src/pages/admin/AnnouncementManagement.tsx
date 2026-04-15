import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, GripVertical, Megaphone } from "lucide-react";

interface AnnouncementItem {
  _id: string;
  text: string;
  isActive: boolean;
  order: number;
}

function getAdminHeaders() {
  const token = localStorage.getItem("adminToken");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function AnnouncementManagement() {
  const { toast } = useToast();
  const [newText, setNewText] = useState("");

  const { data: items = [], isLoading } = useQuery<AnnouncementItem[]>({
    queryKey: ["/api/admin/announcement-bar"],
    queryFn: async () => {
      const res = await fetch("/api/admin/announcement-bar", {
        headers: getAdminHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch announcements");
      return res.json();
    },
  });

  const addMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await fetch("/api/admin/announcement-bar", {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify({ text, isActive: true, order: items.length }),
      });
      if (!res.ok) throw new Error("Failed to add announcement");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/announcement-bar"] });
      queryClient.invalidateQueries({ queryKey: ["/api/announcement-bar"] });
      setNewText("");
      toast({ title: "Announcement added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add announcement", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<AnnouncementItem> }) => {
      const res = await fetch(`/api/admin/announcement-bar/${id}`, {
        method: "PUT",
        headers: getAdminHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update announcement");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/announcement-bar"] });
      queryClient.invalidateQueries({ queryKey: ["/api/announcement-bar"] });
      toast({ title: "Announcement updated" });
    },
    onError: () => {
      toast({ title: "Failed to update announcement", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/announcement-bar/${id}`, {
        method: "DELETE",
        headers: getAdminHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete announcement");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/announcement-bar"] });
      queryClient.invalidateQueries({ queryKey: ["/api/announcement-bar"] });
      toast({ title: "Announcement deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete announcement", variant: "destructive" });
    },
  });

  const handleAdd = () => {
    const trimmed = newText.trim();
    if (!trimmed) return;
    addMutation.mutate(trimmed);
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center">
              <Megaphone className="text-white h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-page-title">
                Announcement Bar
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage the scrolling text that appears at the top of the website
              </p>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="mb-8 rounded-xl overflow-hidden border border-pink-100 shadow-sm">
          <p className="px-4 py-2 text-xs font-medium text-muted-foreground bg-gray-50 dark:bg-gray-800 border-b border-pink-100">
            Live Preview
          </p>
          <div
            className="w-full overflow-hidden select-none py-2"
            style={{ backgroundColor: "hsl(338, 78%, 62%)" }}
            data-testid="announcement-preview"
          >
            {items.filter((i) => i.isActive).length > 0 ? (
              <p className="text-sm font-medium tracking-wide text-white text-center px-4 truncate">
                {items
                  .filter((i) => i.isActive)
                  .map((i) => i.text)
                  .join("   ✦   ")}
              </p>
            ) : (
              <p className="text-sm text-white/70 text-center">No active announcements</p>
            )}
          </div>
        </div>

        {/* Add new */}
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl border border-pink-100 dark:border-gray-700 p-6 shadow-sm">
          <h2 className="text-base font-semibold mb-4 text-gray-800 dark:text-white">Add New Announcement</h2>
          <div className="flex gap-3">
            <Input
              placeholder="e.g. Free shipping on orders above ₹999 | Use code WELCOME10 for 10% off"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              className="flex-1 border-pink-200 focus:border-pink-400 focus:ring-pink-400"
              data-testid="input-new-announcement"
            />
            <Button
              onClick={handleAdd}
              disabled={!newText.trim() || addMutation.isPending}
              className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white"
              data-testid="button-add-announcement"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </div>

        {/* List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-pink-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-pink-100 dark:border-gray-700">
            <h2 className="text-base font-semibold text-gray-800 dark:text-white">
              All Announcements
              <span className="ml-2 text-sm font-normal text-muted-foreground">({items.length})</span>
            </h2>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No announcements yet. Add your first one above.
            </div>
          ) : (
            <ul className="divide-y divide-pink-50 dark:divide-gray-700">
              {items.map((item) => (
                <li
                  key={item._id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-pink-50/40 dark:hover:bg-gray-700/30 transition-colors"
                  data-testid={`row-announcement-${item._id}`}
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />

                  <span
                    className="flex-1 text-sm text-gray-800 dark:text-gray-200"
                    data-testid={`text-announcement-${item._id}`}
                  >
                    {item.text}
                  </span>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Label
                      htmlFor={`toggle-${item._id}`}
                      className="text-xs text-muted-foreground"
                    >
                      {item.isActive ? "Active" : "Hidden"}
                    </Label>
                    <Switch
                      id={`toggle-${item._id}`}
                      checked={item.isActive}
                      onCheckedChange={(checked) =>
                        updateMutation.mutate({ id: item._id, data: { isActive: checked } })
                      }
                      data-testid={`toggle-announcement-${item._id}`}
                      className="data-[state=checked]:bg-pink-500"
                    />
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex-shrink-0"
                    onClick={() => deleteMutation.mutate(item._id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-announcement-${item._id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
