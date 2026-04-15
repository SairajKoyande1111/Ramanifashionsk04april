import { Truck, BadgeCheck, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const badges = [
  {
    icon: Truck,
    title: "Free Shipping",
    description: "On orders above ₹999",
  },
  {
    icon: BadgeCheck,
    title: "100% Authentic Handloom",
    description: "Guaranteed quality products",
  },
  {
    icon: Shield,
    title: "Secure Payment Options",
    description: "Multiple payment methods",
  },
];

export default function TrustBadges() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {badges.map((badge, index) => (
        <Card key={index} className="hover-elevate" data-testid={`card-trust-${index}`}>
          <CardContent className="flex flex-col items-center text-center p-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <badge.icon className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold mb-2" data-testid={`text-trust-title-${index}`}>
              {badge.title}
            </h3>
            <p className="text-sm text-muted-foreground" data-testid={`text-trust-description-${index}`}>
              {badge.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
