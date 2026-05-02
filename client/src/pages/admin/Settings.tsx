import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Truck } from "lucide-react";

export default function Settings() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const adminToken = localStorage.getItem("adminToken");

  const [shippingCharges, setShippingCharges] = useState("0");
  const [freeShippingThreshold, setFreeShippingThreshold] = useState("999");

  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/admin/settings"],
    enabled: !!adminToken,
  });

  useEffect(() => {
    if (settings) {
      setShippingCharges(((settings as any).shippingCharges ?? 0).toString());
      setFreeShippingThreshold(((settings as any).freeShippingThreshold ?? 999).toString());
    }
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: (data: { shippingCharges: number; freeShippingThreshold: number }) =>
      apiRequest("/api/admin/settings", "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ 
        title: "Settings updated successfully!",
        description: "Shipping settings have been saved."
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error updating settings", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleSaveShipping = (e: React.FormEvent) => {
    e.preventDefault();
    
    const charges = parseFloat(shippingCharges);
    const threshold = parseFloat(freeShippingThreshold);

    if (isNaN(charges) || charges < 0) {
      toast({ 
        title: "Invalid shipping charges", 
        description: "Please enter a valid non-negative number",
        variant: "destructive" 
      });
      return;
    }

    if (isNaN(threshold) || threshold < 0) {
      toast({ 
        title: "Invalid threshold", 
        description: "Please enter a valid non-negative number",
        variant: "destructive" 
      });
      return;
    }

    updateSettingsMutation.mutate({
      shippingCharges: charges,
      freeShippingThreshold: threshold
    });
  };

  if (!adminToken) {
    setLocation("/admin/ramanifashionlogin");
    return null;
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2" data-testid="text-page-title">
              Store Settings
            </h2>
            <p className="text-muted-foreground">
              Configure your store's settings and preferences
            </p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-pink-600" />
                  <CardTitle>Shipping Settings</CardTitle>
                </div>
                <CardDescription>
                  Configure shipping charges and free shipping threshold for your store
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveShipping} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="shippingCharges">Shipping Charges (₹)</Label>
                    <Input
                      id="shippingCharges"
                      type="number"
                      min="0"
                      step="1"
                      value={shippingCharges}
                      onChange={(e) => setShippingCharges(e.target.value)}
                      placeholder="Enter shipping charges (e.g., 99)"
                      data-testid="input-shipping-charges"
                    />
                    <p className="text-sm text-muted-foreground">
                      Amount charged for shipping. Set to 0 for free shipping on all orders.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="freeShippingThreshold">Free Shipping Threshold (₹)</Label>
                    <Input
                      id="freeShippingThreshold"
                      type="number"
                      min="0"
                      step="1"
                      value={freeShippingThreshold}
                      onChange={(e) => setFreeShippingThreshold(e.target.value)}
                      placeholder="Enter minimum cart value for free shipping (e.g., 999)"
                      data-testid="input-free-shipping-threshold"
                    />
                    <p className="text-sm text-muted-foreground">
                      Minimum cart value required for free shipping. Shipping is free if cart total is equal to or greater than this amount.
                    </p>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="bg-pink-50 dark:bg-pink-950/20 p-4 rounded-md mb-4">
                      <h4 className="font-medium mb-2 text-sm">Current Configuration:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Shipping Charges: ₹{shippingCharges}</li>
                        <li>• Free Shipping On Orders: ₹{freeShippingThreshold}+</li>
                        <li>
                          • Orders below ₹{freeShippingThreshold} will be charged ₹{shippingCharges}
                        </li>
                        <li>
                          • Orders ₹{freeShippingThreshold} or above get FREE shipping
                        </li>
                      </ul>
                    </div>

                    <Button 
                      type="submit" 
                      disabled={updateSettingsMutation.isPending || isLoading}
                      data-testid="button-save-shipping-settings"
                    >
                      {updateSettingsMutation.isPending ? "Saving..." : "Save Shipping Settings"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
