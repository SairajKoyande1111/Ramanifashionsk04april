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
import { User, MapPin, Trash2, Plus, Calendar, Mail, Edit2 } from "lucide-react";
import { auth } from "@/lib/auth";

export default function Profile() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    dob: "",
  });

  const [addressData, setAddressData] = useState(() => ({
    fullName: "",
    phone: auth.getCustomer()?.phone || "",
    pincode: "",
    address: "",
    locality: "",
    city: "",
    state: "",
    landmark: "",
    addressType: "home" as "home" | "office",
    isDefault: false,
  }));

  const { data: user, isLoading: userLoading, isError: userError, error: userFetchError } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  const { data: addresses, isLoading: addressesLoading, isError: addressesError } = useQuery({
    queryKey: ["/api/addresses"],
    enabled: !!user,
  });

  useEffect(() => {
    // Only redirect if we're not authenticated at all (no token)
    // Don't redirect if query is still loading or if we have a token but query failed temporarily
    if (!userLoading && !auth.isAuthenticated()) {
      setLocation("/");
    }
  }, [userLoading, setLocation]);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        email: user.email || "",
        dob: user.dob ? new Date(user.dob).toISOString().split('T')[0] : "",
      });
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: (data: typeof profileData) => 
      apiRequest("/api/customer/profile", "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setEditingProfile(false);
      toast({ title: "Profile updated successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to update profile", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const createAddressMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/addresses", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/addresses"] });
      setShowAddressForm(false);
      resetAddressForm();
      toast({ title: "Address added successfully" });
    },
  });

  const updateAddressMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      apiRequest(`/api/addresses/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/addresses"] });
      setEditingAddress(null);
      resetAddressForm();
      toast({ title: "Address updated successfully" });
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/addresses/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/addresses"] });
      toast({ title: "Address deleted successfully" });
    },
  });

  const resetAddressForm = () => {
    setAddressData({
      fullName: "",
      phone: auth.getCustomer()?.phone || "",
      pincode: "",
      address: "",
      locality: "",
      city: "",
      state: "",
      landmark: "",
      addressType: "home",
      isDefault: false,
    });
  };

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAddress) {
      updateAddressMutation.mutate({ id: editingAddress._id, data: addressData });
    } else {
      createAddressMutation.mutate(addressData);
    }
  };

  const handleEditAddress = (addr: any) => {
    setEditingAddress(addr);
    setAddressData({
      fullName: addr.fullName,
      phone: addr.phone,
      pincode: addr.pincode,
      address: addr.address,
      locality: addr.locality,
      city: addr.city,
      state: addr.state,
      landmark: addr.landmark || "",
      addressType: addr.addressType,
      isDefault: addr.isDefault || false,
    });
    setShowAddressForm(true);
  };

  const handleCancelEdit = () => {
    setEditingAddress(null);
    setShowAddressForm(false);
    resetAddressForm();
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          Loading profile...
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <p className="mb-4">Redirecting to login...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8" data-testid="text-page-title">My Profile</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Details
                </CardTitle>
                {!editingProfile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingProfile(true)}
                    data-testid="button-edit-profile"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {editingProfile ? (
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    updateProfileMutation.mutate(profileData);
                  }} className="space-y-4">
                    <div>
                      <Label htmlFor="profile-name">Name</Label>
                      <Input
                        id="profile-name"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        placeholder="Enter your name"
                        data-testid="input-profile-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="profile-email">Email</Label>
                      <Input
                        id="profile-email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        placeholder="Enter your email"
                        data-testid="input-profile-email"
                      />
                    </div>
                    <div>
                      <Label htmlFor="profile-dob">Date of Birth</Label>
                      <Input
                        id="profile-dob"
                        type="date"
                        value={profileData.dob}
                        onChange={(e) => setProfileData({ ...profileData, dob: e.target.value })}
                        data-testid="input-profile-dob"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        type="submit" 
                        size="sm"
                        disabled={updateProfileMutation.isPending}
                        data-testid="button-save-profile"
                      >
                        {updateProfileMutation.isPending ? "Saving..." : "Save"}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setEditingProfile(false);
                          setProfileData({
                            name: user.name || "",
                            email: user.email || "",
                            dob: user.dob ? new Date(user.dob).toISOString().split('T')[0] : "",
                          });
                        }}
                        data-testid="button-cancel-profile"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div>
                      <Label className="text-muted-foreground">Phone</Label>
                      <p className="font-semibold" data-testid="text-user-phone">{(user as any).phone}</p>
                      <span className="text-xs text-green-600">Verified</span>
                    </div>
                    <Separator />
                    <div>
                      <Label className="text-muted-foreground flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Name
                      </Label>
                      <p className="font-semibold" data-testid="text-user-name">
                        {(user as any).name || <span className="text-muted-foreground">Not set</span>}
                      </p>
                    </div>
                    <Separator />
                    <div>
                      <Label className="text-muted-foreground flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </Label>
                      <p className="font-semibold" data-testid="text-user-email">
                        {(user as any).email || <span className="text-muted-foreground">Not set</span>}
                      </p>
                    </div>
                    {(user as any).dob && (
                      <>
                        <Separator />
                        <div>
                          <Label className="text-muted-foreground flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Date of Birth
                          </Label>
                          <p className="font-semibold" data-testid="text-user-dob">
                            {new Date((user as any).dob).toLocaleDateString()}
                          </p>
                        </div>
                      </>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Saved Addresses
                </CardTitle>
                <Button
                  onClick={() => {
                    setEditingAddress(null);
                    resetAddressForm();
                    setShowAddressForm(!showAddressForm);
                  }}
                  variant={showAddressForm ? "outline" : "default"}
                  data-testid="button-add-address"
                >
                  {showAddressForm ? "Cancel" : <><Plus className="h-4 w-4 mr-2" />Add New Address</>}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {showAddressForm && (
                  <form onSubmit={handleAddAddress} className="space-y-4 p-4 border rounded-md bg-muted/30">
                    <h3 className="font-semibold">{editingAddress ? "Edit Address" : "Add New Address"}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="fullName">Full Name *</Label>
                        <Input
                          id="fullName"
                          value={addressData.fullName}
                          onChange={(e) => setAddressData({ ...addressData, fullName: e.target.value })}
                          required
                          data-testid="input-full-name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone *</Label>
                        <Input
                          id="phone"
                          value={addressData.phone}
                          onChange={(e) => setAddressData({ ...addressData, phone: e.target.value })}
                          required
                          data-testid="input-phone"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="pincode">Pincode *</Label>
                        <Input
                          id="pincode"
                          value={addressData.pincode}
                          onChange={(e) => setAddressData({ ...addressData, pincode: e.target.value })}
                          required
                          data-testid="input-pincode"
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">State *</Label>
                        <Input
                          id="state"
                          value={addressData.state}
                          onChange={(e) => setAddressData({ ...addressData, state: e.target.value })}
                          required
                          data-testid="input-state"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="address">Address *</Label>
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
                        <Label htmlFor="locality">Locality *</Label>
                        <Input
                          id="locality"
                          value={addressData.locality}
                          onChange={(e) => setAddressData({ ...addressData, locality: e.target.value })}
                          required
                          data-testid="input-locality"
                        />
                      </div>
                      <div>
                        <Label htmlFor="city">City *</Label>
                        <Input
                          id="city"
                          value={addressData.city}
                          onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                          required
                          data-testid="input-city"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="landmark">Landmark (Optional)</Label>
                      <Input
                        id="landmark"
                        value={addressData.landmark}
                        onChange={(e) => setAddressData({ ...addressData, landmark: e.target.value })}
                        data-testid="input-landmark"
                      />
                    </div>

                    <div>
                      <Label>Address Type</Label>
                      <RadioGroup
                        value={addressData.addressType}
                        onValueChange={(value: any) => setAddressData({ ...addressData, addressType: value })}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="home" id="home" data-testid="radio-home" />
                          <Label htmlFor="home">Home</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="office" id="office" data-testid="radio-office" />
                          <Label htmlFor="office">Office</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        type="submit" 
                        disabled={createAddressMutation.isPending || updateAddressMutation.isPending}
                        data-testid="button-save-address"
                      >
                        {editingAddress ? "Update Address" : "Save Address"}
                      </Button>
                      {editingAddress && (
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
                  </form>
                )}

                {addressesLoading ? (
                  <div className="text-center py-4">Loading addresses...</div>
                ) : addressesError ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-red-500">Failed to load addresses. Please try again.</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/addresses"] })}
                    >
                      Retry
                    </Button>
                  </div>
                ) : (addresses as any)?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No saved addresses yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(addresses as any)?.map((addr: any) => (
                      <div
                        key={addr._id}
                        className="p-4 border rounded-md hover-elevate"
                        data-testid={`address-${addr._id}`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold" data-testid={`text-address-name-${addr._id}`}>
                                {addr.fullName}
                              </span>
                              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                {addr.addressType}
                              </span>
                              {addr.isDefault && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                  Default
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">{addr.phone}</div>
                            <div className="text-sm mt-1">
                              {addr.address}, {addr.locality}, {addr.city}, {addr.state} - {addr.pincode}
                            </div>
                            {addr.landmark && (
                              <div className="text-sm text-muted-foreground mt-1">
                                Landmark: {addr.landmark}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditAddress(addr)}
                              data-testid={`button-edit-${addr._id}`}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteAddressMutation.mutate(addr._id)}
                              data-testid={`button-delete-${addr._id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
