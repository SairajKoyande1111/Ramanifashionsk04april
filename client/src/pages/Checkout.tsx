import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useAuthUI } from "@/contexts/AuthUIContext";

export default function Checkout() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { openLogin } = useAuthUI();
  const [paymentMethod, setPaymentMethod] = useState("phonepe");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast({ title: "Please login to proceed with checkout", variant: "destructive" });
      openLogin();
    }
  }, [openLogin, toast]);
  
  const [addressData, setAddressData] = useState({
    fullName: "",
    phone: "",
    pincode: "",
    address: "",
    locality: "",
    city: "",
    state: "",
    landmark: "",
    addressType: "home" as "home" | "office",
  });

  const { data: cart, isLoading: cartLoading, isFetching: cartFetching } = useQuery({
    queryKey: ["/api/cart"],
  });

  const { data: addresses } = useQuery({
    queryKey: ["/api/addresses"],
  });

  const { data: settings, isLoading: settingsLoading, isFetching: settingsFetching } = useQuery({
    queryKey: ["/api/settings"],
  });

  const { data: profileData } = useQuery<any>({
    queryKey: ["/api/auth/me"],
    enabled: !!localStorage.getItem("token"),
    retry: false,
  });

  useEffect(() => {
    if (profileData?.phone) {
      setAddressData((prev) => ({ ...prev, phone: prev.phone || profileData.phone }));
    }
  }, [profileData]);

  const createAddressMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/addresses", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/addresses"] });
      setShowAddressForm(false);
      toast({ title: "Address added successfully" });
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/orders", "POST", data),
    onSuccess: (data: any) => {
      if (paymentMethod === "phonepe") {
        initiatePhonePePayment(data._id, total);
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
        toast({ title: "Order placed successfully!" });
        setLocation("/orders");
      }
    },
    onError: (error: any) => {
      toast({ title: error?.message || "Failed to place order. Please try again.", variant: "destructive" });
    },
  });

  const phonePePaymentMutation = useMutation({
    mutationFn: (data: { orderId: string; amount: number }) => 
      apiRequest("/api/payment/phonepe/initiate", "POST", data),
    onSuccess: (data: any) => {
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    },
    onError: (error: any) => {
      toast({ 
        title: "Payment initiation failed", 
        description: error.message || "Please try again",
        variant: "destructive" 
      });
    },
  });

  const initiatePhonePePayment = (orderId: string, amount: number) => {
    console.log('[CHECKOUT] Initiating PhonePe payment - orderId:', orderId, 'amount:', amount);
    phonePePaymentMutation.mutate({ orderId, amount });
  };

  // Block rendering if data is loading or refetching to prevent incorrect totals
  if (cartLoading || cartFetching || settingsLoading || settingsFetching) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          Loading checkout...
        </div>
        <Footer />
      </div>
    );
  }

  const items = (cart as any)?.items || [];
  const subtotal = items.reduce((sum: number, item: any) => {
    return sum + (item.productId?.price || 0) * item.quantity;
  }, 0);

  const settingsShippingCharges = (settings as any)?.shippingCharges ?? 0;
  const settingsFreeShippingThreshold = (settings as any)?.freeShippingThreshold ?? 999;
  const shippingCharges = subtotal >= settingsFreeShippingThreshold ? 0 : settingsShippingCharges;
  const total = subtotal + shippingCharges;

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    createAddressMutation.mutate(addressData);
  };

  const handlePlaceOrder = () => {
    if (!selectedAddress) {
      toast({ title: "Please select a delivery address", variant: "destructive" });
      return;
    }

    const selectedAddr = (addresses as any)?.find((a: any) => a._id === selectedAddress);
    if (!selectedAddr) return;

    const orderData = {
      items: items.map((item: any) => {
        const selectedColorVariant = item.selectedColor && item.productId?.colorVariants
          ? item.productId.colorVariants.find((v: any) => v.color === item.selectedColor)
          : null;
        const image = selectedColorVariant?.images?.[0]
          || item.productId?.displayImages?.[0]
          || item.productId?.images?.[0]
          || null;
        return {
          productId: item.productId._id,
          name: item.productId.name,
          price: item.productId.price,
          quantity: item.quantity,
          selectedColor: item.selectedColor || null,
          selectedSize: item.selectedSize || null,
          image,
        };
      }),
      shippingAddress: {
        fullName: selectedAddr.fullName,
        phone: selectedAddr.phone,
        address: selectedAddr.address,
        locality: selectedAddr.locality,
        city: selectedAddr.city,
        state: selectedAddr.state,
        pincode: selectedAddr.pincode,
        landmark: selectedAddr.landmark,
      },
      subtotal,
      shippingCharges,
      total,
      paymentMethod,
    };

    createOrderMutation.mutate(orderData);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
          <Button onClick={() => setLocation("/products")}>Continue Shopping</Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8" data-testid="text-page-title">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(addresses as any)?.map((addr: any) => (
                  <div
                    key={addr._id}
                    className={`p-4 border rounded-md cursor-pointer hover-elevate ${
                      selectedAddress === addr._id ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => setSelectedAddress(addr._id)}
                    data-testid={`address-${addr._id}`}
                  >
                    <div className="flex items-start gap-2">
                      <RadioGroup value={selectedAddress || ""}>
                        <RadioGroupItem value={addr._id} />
                      </RadioGroup>
                      <div className="flex-1">
                        <div className="font-semibold">{addr.fullName}</div>
                        <div className="text-sm text-muted-foreground">{addr.phone}</div>
                        <div className="text-sm mt-1">
                          {addr.address}, {addr.locality}, {addr.city}, {addr.state} - {addr.pincode}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {showAddressForm ? (
                  <form onSubmit={handleAddAddress} className="space-y-4 p-4 border rounded-md">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          value={addressData.fullName}
                          onChange={(e) => setAddressData({ ...addressData, fullName: e.target.value })}
                          required
                          data-testid="input-full-name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={addressData.phone}
                          onChange={(e) => setAddressData({ ...addressData, phone: e.target.value })}
                          required
                          data-testid="input-phone"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={addressData.address}
                        onChange={(e) => setAddressData({ ...addressData, address: e.target.value })}
                        required
                        data-testid="input-address"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="locality">Locality</Label>
                        <Input
                          id="locality"
                          value={addressData.locality}
                          onChange={(e) => setAddressData({ ...addressData, locality: e.target.value })}
                          required
                          data-testid="input-locality"
                        />
                      </div>
                      <div>
                        <Label htmlFor="pincode">Pincode</Label>
                        <Input
                          id="pincode"
                          value={addressData.pincode}
                          onChange={(e) => setAddressData({ ...addressData, pincode: e.target.value })}
                          required
                          data-testid="input-pincode"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={addressData.city}
                          onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                          required
                          data-testid="input-city"
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          value={addressData.state}
                          onChange={(e) => setAddressData({ ...addressData, state: e.target.value })}
                          required
                          data-testid="input-state"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button type="submit" disabled={createAddressMutation.isPending} data-testid="button-save-address">
                        Save Address
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setShowAddressForm(false)} data-testid="button-cancel-address">
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <Button variant="outline" onClick={() => setShowAddressForm(true)} data-testid="button-add-address">
                    + Add New Address
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 p-3 border rounded-md border-primary bg-primary/5">
                  <RadioGroup value="phonepe">
                    <RadioGroupItem value="phonepe" id="phonepe" data-testid="radio-phonepe" checked />
                  </RadioGroup>
                  <Label htmlFor="phonepe" className="flex-1 cursor-pointer font-medium">
                    PhonePe / UPI / Cards / Net Banking
                  </Label>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {items.map((item: any) => (
                    <div key={item.productId?._id} className="flex justify-between text-sm">
                      <span className="line-clamp-1">
                        {item.productId?.name} × {item.quantity}
                      </span>
                      <span>₹{(item.productId?.price || 0) * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span data-testid="text-subtotal">₹{subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span data-testid="text-shipping">{shippingCharges === 0 ? 'FREE' : `₹${shippingCharges}`}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary" data-testid="text-total">₹{total}</span>
                </div>

                <Button
                  className="w-full"
                  onClick={handlePlaceOrder}
                  disabled={!selectedAddress || createOrderMutation.isPending}
                  data-testid="button-place-order"
                >
                  Place Order
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
