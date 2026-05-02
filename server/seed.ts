import { connectDB } from './db';
import { Product, Settings, AdminUser, Category } from './models';
import bcrypt from 'bcryptjs';

const sampleProducts = [
  {
    name: "Royal Beige Kalamkari Heritage Saree",
    description: "Exquisite Kanchi Kalamkari saree in cream with traditional red blouse. Features intricate hand-painted designs and gold border work.",
    price: 2899,
    originalPrice: 5799,
    images: ["/attached_assets/image_1762454060438.png"],
    category: "Jamdani Paithani",
    subcategory: "Kalamkari",
    fabric: "Silk",
    color: "Cream",
    occasion: "Wedding",
    pattern: "Kalamkari",
    workType: "Hand Painted",
    blousePiece: true,
    sareeLength: "6m",
    inStock: true,
    stockQuantity: 15,
    isNew: true,
    isBestseller: false,
    isTrending: true,
    rating: 4.7,
    reviewCount: 134,
    specifications: {
      fabricComposition: "Pure Kanchi Silk",
      dimensions: "6 meters x 1.2 meters",
      weight: "650g",
      careInstructions: "Dry clean only",
      countryOfOrigin: "India"
    }
  },
  {
    name: "Vibrant Multicolor Festive Saree",
    description: "Stunning multicolor Katan silk saree with vibrant blue, teal, and pink hues. Perfect for festive occasions.",
    price: 1799,
    originalPrice: 3599,
    images: ["/attached_assets/image_1762454101408.png"],
    category: "Jamdani Paithani",
    subcategory: "Katan",
    fabric: "Katan Silk",
    color: "Multicolor",
    occasion: "Festival",
    pattern: "Abstract",
    workType: "Woven",
    blousePiece: true,
    sareeLength: "6m",
    inStock: true,
    stockQuantity: 22,
    isNew: true,
    isBestseller: false,
    isTrending: true,
    rating: 4.8,
    reviewCount: 172,
    specifications: {
      fabricComposition: "Pure Katan Silk",
      dimensions: "6 meters x 1.2 meters",
      weight: "600g",
      careInstructions: "Dry clean only",
      countryOfOrigin: "India"
    }
  },
  {
    name: "Elegant Monochrome Designer Saree",
    description: "Contemporary black and white poly chiffon saree with elegant drape. Perfect for modern fashionistas.",
    price: 2299,
    originalPrice: 4599,
    images: ["/attached_assets/image_1762454138686.png"],
    category: "Khun / Irkal (Ilkal)",
    subcategory: "Contemporary",
    fabric: "Poly Chiffon",
    color: "Black & White",
    occasion: "Party",
    pattern: "Abstract Floral",
    workType: "Printed",
    blousePiece: true,
    sareeLength: "6m",
    inStock: true,
    stockQuantity: 18,
    isNew: true,
    isBestseller: false,
    isTrending: true,
    rating: 4.4,
    reviewCount: 116,
    specifications: {
      fabricComposition: "Poly Chiffon",
      dimensions: "6 meters x 1.2 meters",
      weight: "400g",
      careInstructions: "Hand wash recommended",
      countryOfOrigin: "India"
    }
  },
  {
    name: "Premium Lime Banarasi Silk Saree",
    description: "Vibrant lime green and purple Banarasi Katan silk saree with traditional gold border. A showstopper for any celebration.",
    price: 3499,
    originalPrice: 6999,
    images: ["/attached_assets/image_1762454177115.png"],
    category: "Jamdani Paithani",
    subcategory: "Banarasi",
    fabric: "Banarasi Silk",
    color: "Lime Green",
    occasion: "Wedding",
    pattern: "Traditional Motifs",
    workType: "Zari Work",
    blousePiece: true,
    sareeLength: "6m",
    inStock: true,
    stockQuantity: 12,
    isNew: true,
    isBestseller: false,
    isTrending: true,
    rating: 4.7,
    reviewCount: 139,
    specifications: {
      fabricComposition: "Pure Banarasi Silk",
      dimensions: "6 meters x 1.2 meters",
      weight: "700g",
      careInstructions: "Dry clean only",
      countryOfOrigin: "India"
    }
  },
  {
    name: "Luxurious Pink Tissue Party Saree",
    description: "Elegant rose pink jacquard tissue saree with gold embellished border. Perfect for special occasions.",
    price: 2599,
    originalPrice: 5199,
    images: ["/attached_assets/image_1762454236234.png"],
    category: "Khun / Irkal (Ilkal)",
    subcategory: "Tissue",
    fabric: "Tissue",
    color: "Rose Pink",
    occasion: "Party",
    pattern: "Geometric",
    workType: "Jacquard",
    blousePiece: true,
    sareeLength: "5.5m",
    inStock: true,
    stockQuantity: 20,
    isNew: true,
    isBestseller: false,
    isTrending: true,
    rating: 4.6,
    reviewCount: 98,
    specifications: {
      fabricComposition: "Tissue Silk",
      dimensions: "5.5 meters x 1.15 meters",
      weight: "450g",
      careInstructions: "Dry clean only",
      countryOfOrigin: "India"
    }
  },
  {
    name: "Graceful Purple Kota Doria Saree",
    description: "Beautiful grey-purple Kota Doria saree with intricate embroidery. Lightweight and elegant for daytime events.",
    price: 1999,
    originalPrice: 3999,
    images: ["/attached_assets/image_1762454265222.png"],
    category: "Ajrakh Modal",
    subcategory: "Kota Doria",
    fabric: "Kota Doria",
    color: "Grey Purple",
    occasion: "Formal",
    pattern: "Embroidered",
    workType: "Embroidery",
    blousePiece: true,
    sareeLength: "6m",
    inStock: true,
    stockQuantity: 25,
    isNew: true,
    isBestseller: false,
    isTrending: true,
    rating: 4.8,
    reviewCount: 156,
    specifications: {
      fabricComposition: "Kota Doria Cotton Silk",
      dimensions: "6 meters x 1.2 meters",
      weight: "380g",
      careInstructions: "Dry clean recommended",
      countryOfOrigin: "India"
    }
  },
  {
    name: "Elegant Pink Silk Saree with Golden Border",
    description: "Beautiful handwoven silk saree with intricate golden border work. Perfect for weddings and special occasions.",
    price: 3499,
    originalPrice: 6999,
    images: ["/attached_assets/generated_images/Pink_silk_saree_hero_a644da4b.png"],
    category: "Jamdani Paithani",
    subcategory: "Bridal",
    fabric: "Silk",
    color: "Pink",
    occasion: "Wedding",
    pattern: "Traditional Motifs",
    workType: "Zari Work",
    blousePiece: true,
    sareeLength: "6m",
    inStock: true,
    stockQuantity: 15,
    isNew: false,
    isBestseller: false,
    rating: 4.5,
    reviewCount: 128,
    specifications: {
      fabricComposition: "100% Pure Silk",
      dimensions: "6 meters x 1.2 meters",
      weight: "650g",
      careInstructions: "Dry clean only",
      countryOfOrigin: "India"
    }
  },
  {
    name: "Beautiful Floral Cotton Saree",
    description: "Light and comfortable cotton saree with delicate floral prints. Perfect for daily wear.",
    price: 1999,
    originalPrice: 3999,
    images: ["/attached_assets/generated_images/Cotton_saree_product_3295c949.png"],
    category: "Mul Mul Cotton",
    subcategory: "Casual",
    fabric: "Cotton",
    color: "Blue",
    occasion: "Casual",
    pattern: "Floral",
    workType: "Printed",
    blousePiece: true,
    sareeLength: "5.5m",
    inStock: true,
    stockQuantity: 45,
    isNew: false,
    isBestseller: false,
    rating: 4.8,
    reviewCount: 95,
    specifications: {
      fabricComposition: "100% Cotton",
      dimensions: "5.5 meters x 1.15 meters",
      weight: "450g",
      careInstructions: "Machine wash gentle",
      countryOfOrigin: "India"
    }
  },
  {
    name: "Contemporary Designer Saree",
    description: "Modern designer saree with contemporary geometric patterns. Stand out at parties.",
    price: 4999,
    originalPrice: 9999,
    images: ["/attached_assets/generated_images/Designer_saree_modern_91330177.png"],
    category: "Patch Work",
    subcategory: "Party Wear",
    fabric: "Georgette",
    color: "Navy Blue",
    occasion: "Party",
    pattern: "Geometric",
    workType: "Embroidered",
    blousePiece: true,
    sareeLength: "6m",
    inStock: true,
    stockQuantity: 8,
    isNew: false,
    isBestseller: true,
    rating: 4.7,
    reviewCount: 67,
    specifications: {
      fabricComposition: "Georgette with Silk Blend",
      dimensions: "6 meters x 1.2 meters",
      weight: "550g",
      careInstructions: "Dry clean recommended",
      countryOfOrigin: "India"
    }
  },
  {
    name: "Glamorous Party Wear Saree",
    description: "Stunning party wear saree with sequin embellishments and shimmer. Be the center of attention.",
    price: 2999,
    originalPrice: 5999,
    images: ["/attached_assets/generated_images/Party_wear_saree_86e79eab.png"],
    category: "Khun / Irkal (Ilkal)",
    subcategory: "Evening Wear",
    fabric: "Net",
    color: "Peach",
    occasion: "Party",
    pattern: "Solid",
    workType: "Stone Work",
    blousePiece: true,
    sareeLength: "6m",
    inStock: true,
    stockQuantity: 22,
    isNew: false,
    isBestseller: true,
    rating: 4.6,
    reviewCount: 143,
    specifications: {
      fabricComposition: "Net with Sequin Work",
      dimensions: "6 meters x 1.2 meters",
      weight: "600g",
      careInstructions: "Dry clean only",
      countryOfOrigin: "India"
    }
  },
  {
    name: "Casual Beige Linen Saree",
    description: "Comfortable linen saree for everyday wear. Simple yet elegant design.",
    price: 1499,
    originalPrice: 2999,
    images: ["/attached_assets/generated_images/Casual_linen_saree_030a208d.png"],
    category: "Pure Linen",
    subcategory: "Daily Wear",
    fabric: "Linen",
    color: "Beige",
    occasion: "Casual",
    pattern: "Solid",
    workType: "Plain",
    blousePiece: true,
    sareeLength: "5.5m",
    inStock: true,
    stockQuantity: 60,
    isNew: false,
    isBestseller: false,
    rating: 4.4,
    reviewCount: 89,
    specifications: {
      fabricComposition: "100% Linen",
      dimensions: "5.5 meters x 1.15 meters",
      weight: "400g",
      careInstructions: "Hand wash or machine wash",
      countryOfOrigin: "India"
    }
  },
  {
    name: "Traditional Banarasi Silk Saree",
    description: "Rich Banarasi silk saree with traditional zari weaving. A timeless classic.",
    price: 5999,
    originalPrice: 11999,
    images: ["/attached_assets/generated_images/Banarasi_saree_detail_604e6fdd.png"],
    category: "Jamdani Paithani",
    subcategory: "Banarasi",
    fabric: "Silk",
    color: "Purple",
    occasion: "Festival",
    pattern: "Traditional Motifs",
    workType: "Zari Work",
    blousePiece: true,
    sareeLength: "6.3m",
    inStock: true,
    stockQuantity: 12,
    isNew: false,
    isBestseller: true,
    rating: 4.9,
    reviewCount: 234,
    specifications: {
      fabricComposition: "Pure Banarasi Silk",
      dimensions: "6.3 meters x 1.2 meters",
      weight: "750g",
      careInstructions: "Dry clean only",
      countryOfOrigin: "India"
    }
  },
  {
    name: "Office Wear Cotton Saree",
    description: "Professional cotton saree suitable for office wear. Comfortable all-day wear.",
    price: 1799,
    originalPrice: 3599,
    images: ["/attached_assets/generated_images/Cotton_saree_product_3295c949.png"],
    category: "Khadi Cotton",
    subcategory: "Office Wear",
    fabric: "Cotton",
    color: "Grey",
    occasion: "Office",
    pattern: "Solid",
    workType: "Plain",
    blousePiece: true,
    sareeLength: "5.5m",
    inStock: true,
    stockQuantity: 35,
    isNew: false,
    isBestseller: false,
    rating: 4.3,
    reviewCount: 56,
    specifications: {
      fabricComposition: "100% Cotton",
      dimensions: "5.5 meters x 1.15 meters",
      weight: "450g",
      careInstructions: "Machine washable",
      countryOfOrigin: "India"
    }
  },
  {
    name: "Designer Party Saree with Pearl Work",
    description: "Exquisite designer saree with pearl embellishments. Perfect for special events.",
    price: 3999,
    originalPrice: 7999,
    images: ["/attached_assets/generated_images/Bridal_saree_product_shot_3a9642d4.png"],
    category: "Ajrakh Modal",
    subcategory: "Party Wear",
    fabric: "Chiffon",
    color: "Maroon",
    occasion: "Party",
    pattern: "Floral",
    workType: "Stone Work",
    blousePiece: true,
    sareeLength: "6m",
    inStock: true,
    stockQuantity: 18,
    isNew: false,
    isBestseller: false,
    rating: 4.7,
    reviewCount: 112,
    specifications: {
      fabricComposition: "Chiffon with Pearl Work",
      dimensions: "6 meters x 1.2 meters",
      weight: "500g",
      careInstructions: "Dry clean only",
      countryOfOrigin: "India"
    }
  },
  {
    name: "Kanjeevaram Silk Wedding Saree",
    description: "Traditional Kanjeevaram silk saree with temple border. Perfect for weddings.",
    price: 6999,
    originalPrice: 13999,
    images: ["/attached_assets/generated_images/Kanjeevaram_saree_portrait_0444bedd.png"],
    category: "Jamdani Paithani",
    subcategory: "Kanjeevaram",
    fabric: "Silk",
    color: "Green",
    occasion: "Wedding",
    pattern: "Traditional Motifs",
    workType: "Zari Work",
    blousePiece: true,
    sareeLength: "6m",
    inStock: true,
    stockQuantity: 10,
    isNew: false,
    isBestseller: true,
    rating: 4.8,
    reviewCount: 187,
    specifications: {
      fabricComposition: "Pure Kanjeevaram Silk",
      dimensions: "6 meters x 1.2 meters",
      weight: "800g",
      careInstructions: "Dry clean only",
      countryOfOrigin: "India"
    }
  },
  {
    name: "Festive Red Georgette Saree",
    description: "Vibrant red georgette saree perfect for festivals and celebrations.",
    price: 2799,
    originalPrice: 5599,
    images: ["/attached_assets/generated_images/Festive_collection_banner_7a822710.png"],
    category: "Patch Work",
    subcategory: "Festival Wear",
    fabric: "Georgette",
    color: "Red",
    occasion: "Festival",
    pattern: "Floral",
    workType: "Embroidered",
    blousePiece: true,
    sareeLength: "6m",
    inStock: true,
    stockQuantity: 28,
    isNew: false,
    isBestseller: false,
    rating: 4.5,
    reviewCount: 76,
    specifications: {
      fabricComposition: "Georgette",
      dimensions: "6 meters x 1.2 meters",
      weight: "520g",
      careInstructions: "Dry clean recommended",
      countryOfOrigin: "India"
    }
  },
  {
    name: "Elegant Black Crepe Saree",
    description: "Sophisticated black crepe saree with minimal design. Timeless elegance.",
    price: 2299,
    originalPrice: 4599,
    images: ["/attached_assets/generated_images/Designer_saree_modern_91330177.png"],
    category: "Ajrakh Modal",
    subcategory: "Evening Wear",
    fabric: "Crepe",
    color: "Black",
    occasion: "Party",
    pattern: "Solid",
    workType: "Embroidered",
    blousePiece: true,
    sareeLength: "6m",
    inStock: true,
    stockQuantity: 32,
    isNew: false,
    isBestseller: false,
    rating: 4.6,
    reviewCount: 93,
    specifications: {
      fabricComposition: "Crepe Silk",
      dimensions: "6 meters x 1.2 meters",
      weight: "480g",
      careInstructions: "Dry clean only",
      countryOfOrigin: "India"
    }
  },
  {
    name: "Yellow Chanderi Silk Saree",
    description: "Light and airy Chanderi silk saree in cheerful yellow. Perfect for day events.",
    price: 3299,
    originalPrice: 6599,
    images: ["/attached_assets/generated_images/Festive_collection_banner_7a822710.png"],
    category: "Khun / Irkal (Ilkal)",
    subcategory: "Chanderi",
    fabric: "Chanderi",
    color: "Yellow",
    occasion: "Festival",
    pattern: "Traditional Motifs",
    workType: "Zari Work",
    blousePiece: true,
    sareeLength: "5.5m",
    inStock: true,
    stockQuantity: 20,
    isNew: false,
    isBestseller: false,
    rating: 4.7,
    reviewCount: 64,
    specifications: {
      fabricComposition: "Chanderi Silk",
      dimensions: "5.5 meters x 1.15 meters",
      weight: "380g",
      careInstructions: "Dry clean recommended",
      countryOfOrigin: "India"
    }
  }
];

export async function seedDatabase() {
  try {
    await connectDB();
    
    // Initialize settings if they don't exist
    let settings = await Settings.findOne();
    if (!settings) {
      console.log('🌱 Initializing default settings...');
      settings = await Settings.create({
        shippingCharges: 0,
        freeShippingThreshold: 999
      });
      console.log('✅ Settings initialized with shipping charges: ₹0, free shipping threshold: ₹999');
    }
    
    // Seed admin user — always ensure correct credentials on startup
    const adminEmail = 'deepahande@ramanifashion.in';
    const adminPassword = 'deepahande@132231';
    const existingAdmin = await AdminUser.findOne({});
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await AdminUser.create({ email: adminEmail, password: hashedPassword, role: 'admin' });
      console.log('✅ Admin user created:', adminEmail);
    } else if (existingAdmin.email !== adminEmail) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await AdminUser.findByIdAndUpdate(existingAdmin._id, { email: adminEmail, password: hashedPassword });
      console.log('✅ Admin credentials updated to:', adminEmail);
    } else {
      console.log('✅ Admin user already exists:', adminEmail);
    }

    // Seed categories if not already present
    const categoryCount = await Category.countDocuments();
    if (categoryCount === 0) {
      console.log('🌱 Seeding categories...');
      await Category.insertMany([
        {
          name: 'SAREES',
          slug: 'sarees',
          image: '/attached_assets/generated_images/category_sarees.png',
          order: 1,
          isActive: true,
          subCategories: [
            { name: 'Jamdani Paithani', slug: 'jamdani-paithani', image: '', subCategories: [] },
            { name: 'Khun / Irkal (Ilkal)', slug: 'khun-irkal', image: '', subCategories: [] },
            { name: 'Ajrakh Modal', slug: 'ajrakh-modal', image: '', subCategories: [] },
            { name: 'Mul Mul Cotton', slug: 'mul-mul-cotton', image: '', subCategories: [] },
            { name: 'Khadi Cotton', slug: 'khadi-cotton', image: '', subCategories: [] },
            { name: 'Patch Work', slug: 'patch-work', image: '', subCategories: [] },
            { name: 'Pure Linen', slug: 'pure-linen', image: '', subCategories: [] },
          ],
        },
        {
          name: 'BLOUSES',
          slug: 'blouses',
          image: '/attached_assets/generated_images/category_blouses.png',
          order: 2,
          isActive: true,
          subCategories: [
            { name: 'Designer Blouses', slug: 'designer-blouses', image: '', subCategories: [] },
            { name: 'Plain Blouses', slug: 'plain-blouses', image: '', subCategories: [] },
            { name: 'Embroidered Blouses', slug: 'embroidered-blouses', image: '', subCategories: [] },
            { name: 'Ready-made Blouses', slug: 'ready-made-blouses', image: '', subCategories: [] },
          ],
        },
        {
          name: 'DRESS MATERIALS',
          slug: 'dress-materials',
          image: '/attached_assets/generated_images/category_dress_materials.png',
          order: 3,
          isActive: true,
          subCategories: [
            { name: 'Cotton Dress Materials', slug: 'cotton-dress-materials', image: '', subCategories: [] },
            { name: 'Silk Dress Materials', slug: 'silk-dress-materials', image: '', subCategories: [] },
            { name: 'Linen Dress Materials', slug: 'linen-dress-materials', image: '', subCategories: [] },
            { name: 'Printed Dress Materials', slug: 'printed-dress-materials', image: '', subCategories: [] },
          ],
        },
        {
          name: 'JEWELLERY',
          slug: 'jewellery',
          image: '/attached_assets/generated_images/category_jewellery.png',
          order: 4,
          isActive: true,
          subCategories: [],
        },
      ]);
      console.log('✅ Categories seeded: SAREES, BLOUSES, DRESS MATERIALS, JEWELLERY');
    } else {
      console.log(`✅ Categories already exist (${categoryCount} documents)`);
    }

    const count = await Product.countDocuments();
    if (count === 0) {
      console.log('ℹ️  No products found, skipping sample product seed (add products via admin panel)');
    } else {
      console.log(`✅ Database already contains ${count} products`);
    }
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
}
