import { useLocation } from "wouter";
import { Link } from "wouter";
import { FaInstagram, FaFacebook } from "react-icons/fa";
import { SiWhatsapp } from "react-icons/si";
import logoImage from "@assets/PNG__B_ LOGO_1762442171742.png";

export default function Footer() {
  const [location, setLocation] = useLocation();

  const handleHomeClick = () => {
    if (location === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setLocation("/");
    }
  };

  const handleContactClick = () => {
    setLocation("/");
    setTimeout(() => {
      const contactSection = document.getElementById("contact");
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  return (
    <footer className="bg-gradient-to-b from-pink-50 to-white border-t mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">

          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex justify-start mb-4">
              <img
                src={logoImage}
                alt="Ramani Fashion"
                className="h-24 md:h-28 w-auto object-contain"
                data-testid="img-footer-logo"
              />
            </div>
            <p className="text-sm text-muted-foreground mb-6 text-left">
              Your destination for authentic handloom sarees and traditional
              Indian ethnic wear.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <a
                href="https://www.instagram.com/ramanifashionindia/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-all shadow-sm hover:shadow-md"
                data-testid="link-instagram-footer"
                aria-label="Instagram"
              >
                <FaInstagram className="w-4 h-4" />
                <span className="text-sm font-medium">Instagram</span>
              </a>
              <a
                href="https://www.facebook.com/186191114586811"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-sm hover:shadow-md"
                data-testid="link-facebook-footer"
                aria-label="Facebook"
              >
                <FaFacebook className="w-4 h-4" />
                <span className="text-sm font-medium">Facebook</span>
              </a>
              <a
                href="https://chat.whatsapp.com/GqIsU9ZF2SJ9buuSKxGFWB"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-600 text-white hover:bg-green-700 transition-all shadow-sm hover:shadow-md"
                data-testid="link-whatsapp-footer"
                aria-label="WhatsApp"
              >
                <SiWhatsapp className="w-4 h-4" />
                <span className="text-sm font-medium">WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-semibold text-lg mb-4 text-primary">
              Categories
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/products?category=SAREES"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  data-testid="link-cat-sarees"
                >
                  Sarees
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=BLOUSES"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  data-testid="link-cat-blouses"
                >
                  Blouses
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=DRESS MATERIALS"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  data-testid="link-cat-dress-materials"
                >
                  Dress Materials
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=JEWELLERY"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  data-testid="link-cat-jewellery"
                >
                  Jewellery
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4 text-primary">
              Quick Links
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={handleHomeClick}
                  className="text-muted-foreground hover:text-primary transition-colors"
                  data-testid="link-home-footer"
                >
                  Home
                </button>
              </li>
              <li>
                <Link
                  href="/new-arrivals"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  data-testid="link-new-arrivals-footer"
                >
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link
                  href="/trending-collection"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  data-testid="link-trending-footer"
                >
                  Trending
                </Link>
              </li>
              <li>
                <Link
                  href="/sale"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  data-testid="link-sale-footer"
                >
                  Sale
                </Link>
              </li>
              <li>
                <Link
                  href="/best-seller"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  data-testid="link-bestseller-footer"
                >
                  Bestseller
                </Link>
              </li>
              <li>
                <button
                  onClick={handleContactClick}
                  className="text-muted-foreground hover:text-primary transition-colors"
                  data-testid="link-contact-footer"
                >
                  Contact
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-pink-200 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>© 2026 Ramani Fashion India. All rights reserved.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/privacy"
                className="hover:text-primary transition-colors"
                data-testid="link-privacy"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="hover:text-primary transition-colors"
                data-testid="link-terms"
              >
                Terms & Conditions
              </Link>
              <Link
                href="/shipping"
                className="hover:text-primary transition-colors"
                data-testid="link-shipping-footer"
              >
                Shipping Policy
              </Link>
              <Link
                href="/returns"
                className="hover:text-primary transition-colors"
                data-testid="link-returns-footer"
              >
                Return & Refund Policy
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-pink-100 text-center text-sm text-muted-foreground">
          Designed &amp; Developed with 💛 by{" "}
          <a
            href="https://www.airavatatechnologies.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline transition-colors"
            data-testid="link-airavata"
          >
            Airavata Technologies
          </a>
        </div>
      </div>
    </footer>
  );
}
