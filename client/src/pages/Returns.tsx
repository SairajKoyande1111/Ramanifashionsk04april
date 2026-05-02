import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import Footer from "@/components/Footer";
import { Truck, RotateCcw, XCircle } from "lucide-react";

export default function Returns() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-pink-50">
      <header className="bg-gradient-to-r from-pink-500 to-purple-500 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">Return & Refund Policy</h1>
          <p className="text-pink-100">Your satisfaction is our priority</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12 space-y-8">

        <Card className="bg-white p-8">
          <div className="flex items-center gap-3 mb-5">
            <Truck className="h-7 w-7 text-pink-500 shrink-0" />
            <h2 className="text-2xl font-bold text-gray-900">Shipping</h2>
          </div>
          <ul className="text-gray-700 space-y-3">
            <li>Orders are dispatched within 1–2 business days.</li>
            <li>Domestic delivery typically takes 3–6 business days after dispatch.</li>
            <li>All orders are shipped via trusted courier partners.</li>
            <li>Tracking details will be shared once your order is dispatched.</li>
            <li>Delivery timelines may occasionally be affected due to unforeseen external factors. In such cases, we will provide complete support to help you track and receive your order smoothly.</li>
          </ul>
        </Card>

        <Card className="bg-white p-8">
          <div className="flex items-center gap-3 mb-5">
            <RotateCcw className="h-7 w-7 text-pink-500 shrink-0" />
            <h2 className="text-2xl font-bold text-gray-900">Return & Refund</h2>
          </div>
          <ul className="text-gray-700 space-y-3">
            <li>If you receive a defective or wrong product, we will arrange a return or replacement.</li>
            <li>A clear parcel opening video without pause or cuts is mandatory for any return or exchange request.</li>
            <li>Any issue must be reported within 24 hours of receiving the parcel.</li>
            <li>Once the returned product is received and passes quality check, refund or replacement will be processed.</li>
            <li>If the pincode is in a non-serviceable pickup zone, the customer may need to self-ship the product. In such cases, we will reimburse the return courier charges along with the product refund, after quality check.</li>
            <li>Color change requests are not accepted.</li>
            <li>Minor variations in color, weave, texture, or threadwork are natural in handloom products and are not considered defects.</li>
          </ul>
        </Card>

        <Card className="bg-white p-8">
          <div className="flex items-center gap-3 mb-5">
            <XCircle className="h-7 w-7 text-pink-500 shrink-0" />
            <h2 className="text-2xl font-bold text-gray-900">Cancellations</h2>
          </div>
          <ul className="text-gray-700 space-y-3">
            <li>Orders can be cancelled within 24 hours of placing the order.</li>
            <li>To request cancellation, please contact us at 9372494513.</li>
            <li>Once the order is shipped, it cannot be cancelled.</li>
            <li>If the customer rejects the parcel at the time of delivery, the refund will be processed after deducting applicable to and from shipping charges.</li>
          </ul>
        </Card>

      </main>

      <Footer />
    </div>
  );
}
