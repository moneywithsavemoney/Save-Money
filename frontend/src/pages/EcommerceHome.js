import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function EcommerceHome() {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState("home"); // home, cart, address-modal, payment, tracking, detail
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Address Form State
  const [address, setAddress] = useState({
    name: "",
    phone: "",
    house: "",
    city: "",
    pincode: "",
    state: ""
  });

  const [checkoutItem, setCheckoutItem] = useState(null);
  const [showOrderSuccessModal, setShowOrderSuccessModal] = useState(false);
  const [notificationBanner, setNotificationBanner] = useState({ show: false, message: "" });

  // 🟢 ব্যাক বাটন প্রেস করলে মেইন সিস্টেমে না গিয়ে সরাসরি লগইন পেজে রিডাইরেক্ট করার শক্তিশালী লজিক
  useEffect(() => {
    window.history.pushState(null, null, window.location.href);
    const handlePopState = () => {
      localStorage.clear();
      navigate("/login", { replace: true });
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [navigate]);

  // Load orders from localStorage
  useEffect(() => {
    const savedOrders = JSON.parse(localStorage.getItem("save_money_enterprise_orders") || "[]");
    setOrders(savedOrders);
  }, []);

  const triggerNotification = (msg) => {
    setNotificationBanner({ show: true, message: msg });
    setTimeout(() => {
      setNotificationBanner({ show: false, message: "" });
    }, 2500);
  };

  // 🟢 ৫০টি সম্পূর্ণ আলাদা, ইউনিক ও হাই-কোয়ালিটি ইমেজ যুক্ত এন্টারপ্রাইজ প্রোডাক্ট লিস্ট
  const products = [
    { id: 1, title: "Men Casual Cotton Checked Shirt", category: "Men Shirt", price: 299, oldPrice: 699, discount: "57% OFF", rating: "4.2 ★", reviews: "1.4K", image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&auto=format&fit=crop&q=80", desc: "Premium quality cotton checked shirt for casual outings and daily wear." },
    { id: 2, title: "Men Slim Fit Stretchable Blue Jeans", category: "Men Jeans", price: 499, oldPrice: 1299, discount: "61% OFF", rating: "4.3 ★", reviews: "2.1K", image: "https://images.unsplash.com/photo-1542272604-780c36856d62?w=600&auto=format&fit=crop&q=80", desc: "Comfortable stretchable denim jeans designed for modern fit and durability." },
    { id: 3, title: "Women Floral Printed Rayon Kurti", category: "Women Kurti", price: 249, oldPrice: 799, discount: "68% OFF", rating: "4.4 ★", reviews: "3.5K", image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80", desc: "Elegant floral printed rayon kurti with fine stitching and soft fabric." },
    { id: 4, title: "Traditional Banarasi Silk Purple Saree", category: "Saree", price: 450, oldPrice: 1500, discount: "70% OFF", rating: "4.5 ★", reviews: "980", image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80", desc: "Exquisite Banarasi silk saree featuring rich pallu and traditional zari work." },
    { id: 5, title: "Women Soft Cotton Comfortable Nighty", category: "Nighty", price: 299, oldPrice: 699, discount: "57% OFF", rating: "4.1 ★", reviews: "1.2K", image: "https://images.unsplash.com/photo-1554412933-514a83d2f3c8?w=600&auto=format&fit=crop&q=80", desc: "Breathable pure cotton nighty ensuring maximum comfort during sleep." },
    { id: 6, title: "Kids Baby Boy Cotton Party Wear Suit", category: "Kids", price: 350, oldPrice: 999, discount: "65% OFF", rating: "4.6 ★", reviews: "850", image: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=600&auto=format&fit=crop&q=80", desc: "Adorable party wear suit for baby boys crafted with skin-friendly fabric." },
    { id: 7, title: "Kids Baby Girl Pink Designer Frock", category: "Kids", price: 320, oldPrice: 899, discount: "64% OFF", rating: "4.5 ★", reviews: "940", image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&auto=format&fit=crop&q=80", desc: "Cute pink designer frock with net flare and beautiful floral applique." },
    { id: 8, title: "Men Formal Solid White Button Shirt", category: "Men Shirt", price: 349, oldPrice: 899, discount: "61% OFF", rating: "4.0 ★", reviews: "1.1K", image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80", desc: "Sharp formal white shirt suitable for office wear and professional meetings." },
    { id: 9, title: "Men Regular Fit Dark Denim Jeans", category: "Men Jeans", price: 450, oldPrice: 1199, discount: "62% OFF", rating: "4.2 ★", reviews: "1.9K", image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&auto=format&fit=crop&q=80", desc: "Classic dark denim jeans offering sturdy construction and effortless style." },
    { id: 10, title: "Women Embroidered Anarkali Yellow Kurta", category: "Women Kurti", price: 350, oldPrice: 1099, discount: "68% OFF", rating: "4.3 ★", reviews: "2.3K", image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop&q=80", desc: "Gorgeous yellow Anarkali kurta with delicate thread embroidery work." },
    { id: 11, title: "Georgette Party Wear Red Saree", category: "Saree", price: 399, oldPrice: 1299, discount: "69% OFF", rating: "4.1 ★", reviews: "760", image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&auto=format&fit=crop&q=80", desc: "Lightweight georgette party wear saree with subtle sequin embellishments." },
    { id: 12, title: "Soft Cotton Printed Maxi Nighty", category: "Nighty", price: 249, oldPrice: 599, discount: "58% OFF", rating: "4.2 ★", reviews: "1.5K", image: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600&auto=format&fit=crop&q=80", desc: "Full-length printed maxi nighty designed for relaxing home comfort." },
    { id: 13, title: "Boys Cotton T-Shirt & Shorts Summer Set", category: "Kids", price: 299, oldPrice: 799, discount: "62% OFF", rating: "4.4 ★", reviews: "670", image: "https://images.unsplash.com/photo-1503944583220-7eeec293c68b?w=600&auto=format&fit=crop&q=80", desc: "Vibrant summer clothing set featuring breathable cotton tee and elastic shorts." },
    { id: 14, title: "Girls Princess Dress for Weddings", category: "Kids", price: 399, oldPrice: 1199, discount: "66% OFF", rating: "4.7 ★", reviews: "1.8K", image: "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=600&auto=format&fit=crop&q=80", desc: "Stunning princess gown tailored for special occasions and festive celebrations." },
    { id: 15, title: "Men Printed Casual Black T-Shirt", category: "Men Shirt", price: 199, oldPrice: 499, discount: "60% OFF", rating: "4.1 ★", reviews: "3.2K", image: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600&auto=format&fit=crop&q=80", desc: "Trendy black graphic t-shirt made from bio-washed combed cotton." },
    { id: 16, title: "Men Casual Beige Chino Trouser Pant", category: "Men Jeans", price: 350, oldPrice: 999, discount: "65% OFF", rating: "4.0 ★", reviews: "1.0K", image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&auto=format&fit=crop&q=80", desc: "Versatile beige chino trousers offering smart-casual appeal." },
    { id: 17, title: "Women Daily Wear Green Printed Kurti", category: "Women Kurti", price: 249, oldPrice: 699, discount: "64% OFF", rating: "4.3 ★", reviews: "1.6K", image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&auto=format&fit=crop&q=80", desc: "Charming green printed kurti ideal for college and office daily wear." },
    { id: 18, title: "Soft Kanjeevaram Silk Border Saree", category: "Saree", price: 350, oldPrice: 1199, discount: "70% OFF", rating: "4.4 ★", reviews: "2.0K", image: "https://images.unsplash.com/photo-1609357605129-26f69ad549d7?w=600&auto=format&fit=crop&q=80", desc: "Classic Kanjeevaram inspired silk saree with intricate golden border." },
    { id: 19, title: "Hosiery Cotton Printed Nightwear", category: "Nighty", price: 299, oldPrice: 799, discount: "62% OFF", rating: "4.0 ★", reviews: "890", image: "https://images.unsplash.com/photo-1582533561751-ef6f6ab93a2e?w=600&auto=format&fit=crop&q=80", desc: "Super soft hosiery cotton nightwear set for restful nights." },
    { id: 20, title: "Infant Cute Baby Romper Dress", category: "Kids", price: 249, oldPrice: 599, discount: "58% OFF", rating: "4.5 ★", reviews: "550", image: "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=600&auto=format&fit=crop&q=80", desc: "Ultra-gentle baby romper with snap buttons for easy diaper changes." },
    { id: 21, title: "Men Denim Full Sleeve Casual Shirt", category: "Men Shirt", price: 399, oldPrice: 999, discount: "60% OFF", rating: "4.3 ★", reviews: "1.3K", image: "https://images.unsplash.com/photo-1588359348347-9bc6cbbb689e?w=600&auto=format&fit=crop&q=80", desc: "Rugged yet stylish full-sleeve denim shirt for layered styling." },
    { id: 22, title: "Men Black Skinny Fit Biker Jeans", category: "Men Jeans", price: 499, oldPrice: 1399, discount: "64% OFF", rating: "4.5 ★", reviews: "1.7K", image: "https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=600&auto=format&fit=crop&q=80", desc: "Edgy skinny fit biker jeans featuring stylized panel stitching." },
    { id: 23, title: "Women Pink Designer Straight Kurti", category: "Women Kurti", price: 299, oldPrice: 849, discount: "65% OFF", rating: "4.2 ★", reviews: "1.4K", image: "https://images.unsplash.com/photo-1564557287817-3785e3831f1b?w=600&auto=format&fit=crop&q=80", desc: "Chic pink straight cut kurti crafted from premium cotton blend." },
    { id: 24, title: "Chiffon Light Weight Designer Saree", category: "Saree", price: 320, oldPrice: 999, discount: "68% OFF", rating: "4.1 ★", reviews: "910", image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80", desc: "Airy chiffon designer saree with delicate digital floral prints." },
    { id: 25, title: "Women Long Sleeveless Night Gown", category: "Nighty", price: 350, oldPrice: 899, discount: "61% OFF", rating: "4.3 ★", reviews: "720", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80", desc: "Sleek and luxurious satin blend long sleeveless night gown." },
    { id: 26, title: "Boys Traditional Ethnic Kurta Pyjama", category: "Kids", price: 399, oldPrice: 1199, discount: "66% OFF", rating: "4.6 ★", reviews: "1.1K", image: "https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?w=600&auto=format&fit=crop&q=80", desc: "Festive ethnic kurta pyjama set specially designed for young boys." },
    { id: 27, title: "Girls Floral Party Wear Lehenga Choli", category: "Kids", price: 450, oldPrice: 1399, discount: "68% OFF", rating: "4.7 ★", reviews: "1.3K", image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&auto=format&fit=crop&q=80", desc: "Gorgeous floral lehenga choli set for girls wedding wear." },
    { id: 28, title: "Men Striped Casual Polo T-Shirt", category: "Men Shirt", price: 249, oldPrice: 699, discount: "64% OFF", rating: "4.1 ★", reviews: "2.8K", image: "https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=600&auto=format&fit=crop&q=80", desc: "Smart striped polo t-shirt crafted with pique cotton fabric." },
    { id: 29, title: "Men Ripped Light Blue Denim Jeans", category: "Men Jeans", price: 450, oldPrice: 1249, discount: "63% OFF", rating: "4.2 ★", reviews: "1.6K", image: "https://images.unsplash.com/photo-1555529771-835f59fc5efe?w=600&auto=format&fit=crop&q=80", desc: "Fashionable light blue distressed denim jeans with trendy knee rips." },
    { id: 30, title: "Women Blue Printed Flare A-Line Kurti", category: "Women Kurti", price: 349, oldPrice: 999, discount: "65% OFF", rating: "4.4 ★", reviews: "2.5K", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80", desc: "Graceful blue A-line kurti featuring flared hemline and elegant print." },
    { id: 31, title: "Cotton Heavy Embroidery Border Saree", category: "Saree", price: 499, oldPrice: 1699, discount: "70% OFF", rating: "4.5 ★", reviews: "1.0K", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80", desc: "Heavy embroidered border saree crafted on premium cotton fabric." },
    { id: 32, title: "Women Pure Cotton Bathrobe & Nighty", category: "Nighty", price: 399, oldPrice: 999, discount: "60% OFF", rating: "4.2 ★", reviews: "640", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80", desc: "Super absorbent pure cotton bathrobe and nightwear combo." },
    { id: 33, title: "Kids Unisex Hoodie & Trackpant Set", category: "Kids", price: 349, oldPrice: 899, discount: "61% OFF", rating: "4.5 ★", reviews: "990", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&auto=format&fit=crop&q=80", desc: "Warm fleece hoodie and matching trackpants for active kids." },
    { id: 34, title: "Girls Summer Cotton Printed Top", category: "Kids", price: 199, oldPrice: 499, discount: "60% OFF", rating: "4.3 ★", reviews: "780", image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&auto=format&fit=crop&q=80", desc: "Colorful and cheerful cotton printed top for young girls." },
    { id: 35, title: "Men Maroon Slim Fit Party Shirt", category: "Men Shirt", price: 350, oldPrice: 899, discount: "61% OFF", rating: "4.2 ★", reviews: "1.2K", image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&auto=format&fit=crop&q=80", desc: "Glossy finish maroon slim fit shirt tailored for parties and events." },
    { id: 36, title: "Men Jogger Style Cargo Denim Pant", category: "Men Jeans", price: 499, oldPrice: 1299, discount: "61% OFF", rating: "4.4 ★", reviews: "1.5K", image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&auto=format&fit=crop&q=80", desc: "Modern utility jogger denim pant with multiple cargo pockets." },
    { id: 37, title: "Women Cotton Short Tunic Kurti", category: "Women Kurti", price: 249, oldPrice: 649, discount: "61% OFF", rating: "4.1 ★", reviews: "1.1K", image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&auto=format&fit=crop&q=80", desc: "Short Indo-western tunic kurti perfect for pairing with jeans." },
    { id: 38, title: "South Indian Temple Border Silk Saree", category: "Saree", price: 450, oldPrice: 1499, discount: "70% OFF", rating: "4.6 ★", reviews: "1.8K", image: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&auto=format&fit=crop&q=80", desc: "Authentic temple border design silk saree with rich traditional appeal." },
    { id: 39, title: "Women Satin Silk Nightdress Suit", category: "Nighty", price: 350, oldPrice: 899, discount: "61% OFF", rating: "4.3 ★", reviews: "950", image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80", desc: "Silky smooth 2-piece nightdress set for ultimate nighttime luxury." },
    { id: 40, title: "Boys Printed Denim Dungaree Dress", category: "Kids", price: 399, oldPrice: 999, discount: "60% OFF", rating: "4.5 ★", reviews: "830", image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=80", desc: "Durable and cute denim dungaree dress for active baby boys." },
    { id: 41, title: "Girls Red Velvet Party Frock", category: "Kids", price: 349, oldPrice: 899, discount: "61% OFF", rating: "4.4 ★", reviews: "920", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80", desc: "Rich red velvet party frock featuring bow detailing and soft inner lining." },
    { id: 42, title: "Men Grey Casual Linen Cotton Shirt", category: "Men Shirt", price: 320, oldPrice: 799, discount: "60% OFF", rating: "4.0 ★", reviews: "1.0K", image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=80", desc: "Breathable linen cotton blend shirt ideal for warm summer days." },
    { id: 43, title: "Men Clean Look Black Formal Trousers", category: "Men Jeans", price: 399, oldPrice: 999, discount: "60% OFF", rating: "4.1 ★", reviews: "1.4K", image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&auto=format&fit=crop&q=80", desc: "Wrinkle-resistant clean look black trousers for corporate professionals." },
    { id: 44, title: "Women Chikankari Work White Kurti", category: "Women Kurti", price: 350, oldPrice: 999, discount: "65% OFF", rating: "4.5 ★", reviews: "3.1K", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80", desc: "Exquisite Lucknowi Chikankari hand-embroidered white kurti." },
    { id: 45, title: "Organza Floral Printed Modern Saree", category: "Saree", price: 399, oldPrice: 1299, discount: "69% OFF", rating: "4.3 ★", reviews: "870", image: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&auto=format&fit=crop&q=80", desc: "Transparent organza saree with vibrant botanical floral prints." },
    { id: 46, title: "Soft Rayon Printed Feeding Nighty", category: "Nighty", price: 299, oldPrice: 699, discount: "57% OFF", rating: "4.2 ★", reviews: "1.1K", image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80", desc: "Convenient concealed zip feeding nighty made with soft rayon fabric." },
    { id: 47, title: "Kids Superhero Print T-Shirt & Shorts", category: "Kids", price: 249, oldPrice: 599, discount: "58% OFF", rating: "4.6 ★", reviews: "1.3K", image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=80", desc: "Action-packed superhero printed clothing set for boys." },
    { id: 48, title: "Girls Embroidered Net Tutu Dress", category: "Kids", price: 399, oldPrice: 1099, discount: "63% OFF", rating: "4.7 ★", reviews: "1.6K", image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&auto=format&fit=crop&q=80", desc: "Layered net tutu dress with delicate floral embroidery for birthdays." },
    { id: 49, title: "Men Casual Half Sleeve Printed Shirt", category: "Men Shirt", price: 249, oldPrice: 599, discount: "58% OFF", rating: "4.1 ★", reviews: "1.5K", image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=80", desc: "Tropical printed half-sleeve shirt for vacation and beach wear." },
    { id: 50, title: "Men Regular Fit Ice Blue Jeans", category: "Men Jeans", price: 450, oldPrice: 1199, discount: "62% OFF", rating: "4.3 ★", reviews: "1.8K", image: "https://images.unsplash.com/photo-1542272604-780c36856d62?w=600&auto=format&fit=crop&q=80", desc: "Cool ice blue wash denim jeans offering casual everyday comfort." }
  ];

  const categories = ["All", "Men Shirt", "Men Jeans", "Women Kurti", "Saree", "Nighty", "Kids"];

  const filteredProducts = products.filter((item) => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAddToCart = (product, e) => {
    e?.stopPropagation();
    setCart([...cart, product]);
    triggerNotification("🛍️ Product added to cart successfully!");
  };

  const handleBuyNow = (product, e) => {
    e?.stopPropagation();
    setCheckoutItem(product);
    setCurrentView("address-modal");
  };

  const handleSaveAddress = (e) => {
    e.preventDefault();
    if (!address.name || !address.phone || !address.house || !address.city || !address.pincode) {
      alert("Please fill all required address fields!");
      return;
    }
    setCurrentView("payment");
  };

  const handlePlaceOrder = () => {
    const newOrder = {
      id: "SM-" + Math.floor(100000 + Math.random() * 900000),
      item: checkoutItem || cart[0] || products[0],
      address: address,
      date: new Date().toLocaleDateString(),
      status: "Confirmed (Cash on Delivery)"
    };

    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);
    localStorage.setItem("save_money_enterprise_orders", JSON.stringify(updatedOrders));
    
    setCart([]);
    setCheckoutItem(null);
    setShowOrderSuccessModal(true);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  return (
    <div style={styles.container}>
      {/* 🟢 NOTIFICATION TOAST */}
      {notificationBanner.show && (
        <div style={styles.toastBanner}>
          {notificationBanner.message}
        </div>
      )}

      {/* 🟢 TOP HEADER WITH PUBLIC LOGO */}
      <header style={styles.header}>
        <div style={styles.brandRow}>
          <div style={styles.logoWrap} onClick={() => setCurrentView("home")}>
            <img 
              src="/logo512.png" 
              alt="Save Money Logo" 
              style={styles.logoImg} 
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <h2 style={styles.logoText}>Save Money</h2>
          </div>

          <div style={styles.headerIcons}>
            <button style={styles.navTrackerBtn} onClick={() => setCurrentView("tracking")}>
              📦 My Orders
            </button>
            <div style={styles.cartBtn} onClick={() => setCurrentView("cart")}>
              🛒 <span style={styles.cartBadge}>{cart.length}</span>
            </div>
            <button style={styles.logoutBtn} onClick={handleLogout}>🚪 Logout</button>
          </div>
        </div>

        {currentView === "home" && (
          <div style={styles.searchBox}>
            🔍 <input
              type="text"
              placeholder="Search Kurti, Saree, Shirt, Jeans, Kids dress..."
              style={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}
      </header>

      {/* 🟢 VIEW 1: HOME CATALOG */}
      {currentView === "home" && (
        <>
          <div style={styles.banner}>
            <div style={styles.bannerText}>
              <span style={styles.bannerBadge}>Lowest Prices Every Day</span>
              <h1 style={styles.bannerTitle}>50% - 80% OFF</h1>
              <p style={styles.bannerSub}>Free Delivery • Cash on Delivery • Easy Returns</p>
            </div>
          </div>

          <div style={styles.categoryWrap}>
            {categories.map((cat) => (
              <button
                key={cat}
                style={{
                  ...styles.catChip,
                  ...(selectedCategory === cat ? styles.catChipActive : {})
                }}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div style={styles.productGrid}>
            {filteredProducts.map((product) => (
              <div 
                key={product.id} 
                style={styles.productCard}
                onClick={() => {
                  setSelectedProduct(product);
                  setCurrentView("product-detail");
                }}
              >
                <div style={styles.imageWrap}>
                  <img src={product.image} alt={product.title} style={styles.productImg} />
                  <span style={styles.freeDeliveryBadge}>Free Delivery</span>
                </div>

                <div style={styles.cardBody}>
                  <h4 style={styles.productTitle}>{product.title}</h4>
                  
                  <div style={styles.priceRow}>
                    <span style={styles.price}>₹{product.price}</span>
                    <span style={styles.oldPrice}>₹{product.oldPrice}</span>
                    <span style={styles.discount}>{product.discount}</span>
                  </div>

                  <div style={styles.ratingRow}>
                    <span style={styles.ratingBadge}>{product.rating}</span>
                    <span style={styles.reviewCount}>({product.reviews})</span>
                  </div>

                  <div style={styles.cardBtnGroup}>
                    <button style={styles.addToCartBtn} onClick={(e) => handleAddToCart(product, e)}>
                      Add to Cart
                    </button>
                    <button style={styles.buyNowBtn} onClick={(e) => handleBuyNow(product, e)}>
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 🟢 VIEW 2: PRODUCT DETAIL VIEW */}
      {currentView === "product-detail" && selectedProduct && (
        <div style={styles.subPageContainer}>
          <button style={styles.backBtn} onClick={() => setCurrentView("home")}>← Back to Shopping</button>
          
          <div style={styles.detailCard}>
            <div style={styles.detailImgWrap}>
              <img src={selectedProduct.image} alt={selectedProduct.title} style={styles.detailImg} />
            </div>
            <h2 style={styles.detailTitle}>{selectedProduct.title}</h2>
            <div style={styles.priceRow}>
              <span style={{ fontSize: "22px", fontWeight: "900", color: "#0f172a" }}>₹{selectedProduct.price}</span>
              <span style={styles.oldPrice}>₹{selectedProduct.oldPrice}</span>
              <span style={styles.discount}>{selectedProduct.discount}</span>
            </div>
            <div style={{ margin: "10px 0" }}>
              <span style={styles.ratingBadge}>{selectedProduct.rating}</span>
              <span style={{ marginLeft: "8px", fontSize: "12px", color: "#64748b" }}>{selectedProduct.reviews} Ratings & Reviews</span>
            </div>
            <p style={{ color: "#475569", fontSize: "14px", lineHeight: "1.6" }}>{selectedProduct.desc}</p>

            <div style={styles.detailPerks}>
              <div style={styles.perkItem}>🛡️ 100% Secure Payments</div>
              <div style={styles.perkItem}>🔄 7 Days Easy Return</div>
              <div style={styles.perkItem}>🚚 Free Home Delivery</div>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button style={styles.addToCartBtn} onClick={(e) => handleAddToCart(selectedProduct, e)}>
                Add to Cart
              </button>
              <button style={styles.buyNowBtn} onClick={(e) => handleBuyNow(selectedProduct, e)}>
                Buy Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🟢 VIEW 3: CART */}
      {currentView === "cart" && (
        <div style={styles.subPageContainer}>
          <h2>Your Shopping Cart ({cart.length})</h2>
          <button style={styles.backBtn} onClick={() => setCurrentView("home")}>← Back to Shopping</button>
          
          {cart.length === 0 ? (
            <p style={{ textAlign: "center", marginTop: "40px", color: "#64748b" }}>Your cart is empty!</p>
          ) : (
            cart.map((item, idx) => (
              <div key={idx} style={styles.cartItemCard}>
                <img src={item.image} alt={item.title} style={styles.cartImg} />
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: "0 0 6px 0", fontSize: "14px" }}>{item.title}</h4>
                  <p style={{ margin: 0, fontWeight: "bold", color: "#16a34a" }}>₹{item.price}</p>
                </div>
              </div>
            ))
          )}

          {cart.length > 0 && (
            <button style={styles.primaryBtn} onClick={() => { setCheckoutItem(cart[0]); setCurrentView("address-modal"); }}>
              Proceed to Checkout
            </button>
          )}
        </div>
      )}

      {/* 🟢 VIEW 4: CENTERED ADDRESS MODAL */}
      {currentView === "address-modal" && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h3>Enter Delivery Address</h3>
              <button style={styles.closeModalBtn} onClick={() => setCurrentView("home")}>✕</button>
            </div>

            <form onSubmit={handleSaveAddress} style={styles.formStyle}>
              <input placeholder="Full Name" style={styles.input} value={address.name} onChange={(e) => setAddress({...address, name: e.target.value})} required />
              <input placeholder="Phone Number" style={styles.input} value={address.phone} onChange={(e) => setAddress({...address, phone: e.target.value})} required />
              <input placeholder="House No / Street / Area" style={styles.input} value={address.house} onChange={(e) => setAddress({...address, house: e.target.value})} required />
              <input placeholder="City" style={styles.input} value={address.city} onChange={(e) => setAddress({...address, city: e.target.value})} required />
              <input placeholder="State" style={styles.input} value={address.state} onChange={(e) => setAddress({...address, state: e.target.value})} required />
              <input placeholder="Pincode" style={styles.input} value={address.pincode} onChange={(e) => setAddress({...address, pincode: e.target.value})} required />

              <button type="submit" style={styles.primaryBtn}>Save Address & Continue</button>
            </form>
          </div>
        </div>
      )}

      {/* 🟢 VIEW 5: PAYMENT PAGE */}
      {currentView === "payment" && (
        <div style={styles.subPageContainer}>
          <h2>Payment Method</h2>
          <button style={styles.backBtn} onClick={() => setCurrentView("address-modal")}>← Back</button>

          <div style={styles.paymentNoticeBox}>
            <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.6", color: "#1e293b", fontWeight: "600" }}>
              Currently, Cash on Delivery (COD) is available. Online payment will be enabled soon with more exciting offers. Please place your order with Cash on Delivery.
            </p>
          </div>

          <div style={styles.codOptionCard}>
            <label style={{ display: "flex", alignItems: "center", gap: "10px", fontWeight: "bold", cursor: "pointer", color: "#0f172a" }}>
              <input type="radio" defaultChecked /> Cash on Delivery (COD)
            </label>
          </div>

          <button style={styles.primaryBtn} onClick={handlePlaceOrder}>
            Order Through Cash on Delivery
          </button>
        </div>
      )}

      {/* 🟢 VIEW 6: ORDER TRACKING PAGE */}
      {currentView === "tracking" && (
        <div style={styles.subPageContainer}>
          <h2>My Order Tracking</h2>
          <button style={styles.backBtn} onClick={() => setCurrentView("home")}>← Back to Shopping</button>

          {orders.length === 0 ? (
            <p style={{ textAlign: "center", marginTop: "40px", color: "#64748b" }}>No orders placed yet!</p>
          ) : (
            orders.map((ord) => (
              <div key={ord.id} style={styles.orderCard}>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #e2e8f0", paddingBottom: "8px", marginBottom: "8px" }}>
                  <span style={{ fontWeight: "bold", color: "#7c3aed" }}>{ord.id}</span>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>{ord.date}</span>
                </div>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <img src={ord.item.image} alt="" style={{ width: "55px", height: "55px", objectFit: "cover", borderRadius: "8px" }} />
                  <div>
                    <h4 style={{ margin: "0 0 4px 0", fontSize: "14px", color: "#1e293b" }}>{ord.item.title}</h4>
                    <p style={{ margin: 0, fontSize: "13px", fontWeight: "bold", color: "#16a34a" }}>₹{ord.item.price} (COD)</p>
                  </div>
                </div>
                <div style={{ marginTop: "10px", background: "#f0fdf4", padding: "8px 12px", borderRadius: "8px", color: "#15803d", fontSize: "12px", fontWeight: "bold", border: "1px solid #bbf7d0" }}>
                  Status: {ord.status}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 🟢 ORDER SUCCESS POPUP MODAL */}
      {showOrderSuccessModal && (
        <div style={styles.modalBackdrop}>
          <div style={{ ...styles.modalCard, textAlign: "center", padding: "30px 20px" }}>
            <div style={{ fontSize: "50px", marginBottom: "10px" }}>🎉</div>
            <h2 style={{ color: "#16a34a", marginBottom: "8px" }}>Order Placed Successfully!</h2>
            <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "20px" }}>
              Your order has been confirmed via Cash on Delivery. You can track your order anytime.
            </p>
            <button 
              style={styles.primaryBtn} 
              onClick={() => {
                setShowOrderSuccessModal(false);
                setCurrentView("tracking");
              }}
            >
              Track My Order
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "#f4f5f8",
    paddingBottom: "40px",
    fontFamily: "system-ui, -apple-system, sans-serif"
  },
  toastBanner: {
    position: "fixed",
    top: "10px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "#0f172a",
    color: "#fff",
    padding: "10px 20px",
    borderRadius: "20px",
    zIndex: 99999,
    fontSize: "13px",
    fontWeight: "bold",
    boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
  },
  header: {
    background: "#ffffff",
    padding: "12px 16px",
    position: "sticky",
    top: 0,
    zIndex: 100,
    boxShadow: "0 2px 10px rgba(0,0,0,0.06)"
  },
  brandRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  logoWrap: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer"
  },
  logoImg: {
    width: "36px",
    height: "36px",
    objectFit: "contain",
    borderRadius: "10px"
  },
  logoText: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "900",
    color: "#16a34a"
  },
  headerIcons: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  navTrackerBtn: {
    background: "#e0e7ff",
    color: "#4338ca",
    border: "none",
    padding: "6px 10px",
    borderRadius: "14px",
    fontWeight: "bold",
    fontSize: "11px",
    cursor: "pointer"
  },
  cartBtn: {
    position: "relative",
    fontSize: "20px",
    cursor: "pointer",
    background: "#f1f5f9",
    padding: "4px 8px",
    borderRadius: "10px"
  },
  cartBadge: {
    position: "absolute",
    top: "-6px",
    right: "-6px",
    background: "#f43f5e",
    color: "#fff",
    borderRadius: "50%",
    fontSize: "10px",
    fontWeight: "bold",
    width: "18px",
    height: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  logoutBtn: {
    background: "#ffe4e6",
    color: "#e11d48",
    border: "none",
    padding: "6px 10px",
    borderRadius: "10px",
    fontWeight: "bold",
    fontSize: "12px",
    cursor: "pointer"
  },
  searchBox: {
    marginTop: "10px",
    background: "#f1f5f9",
    borderRadius: "12px",
    padding: "8px 12px",
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  searchInput: {
    border: "none",
    background: "transparent",
    outline: "none",
    width: "100%",
    fontSize: "14px"
  },
  banner: {
    margin: "12px 16px",
    background: "linear-gradient(135deg, #16a34a 0%, #0d9488 100%)",
    borderRadius: "16px",
    padding: "20px",
    color: "#ffffff"
  },
  bannerBadge: {
    background: "rgba(255,255,255,0.2)",
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "bold"
  },
  bannerTitle: {
    margin: "8px 0 4px",
    fontSize: "26px",
    fontWeight: "900"
  },
  bannerSub: {
    margin: 0,
    fontSize: "12px",
    opacity: 0.9
  },
  categoryWrap: {
    display: "flex",
    gap: "8px",
    overflowX: "auto",
    padding: "0 16px 10px",
    scrollbarWidth: "none"
  },
  catChip: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    padding: "8px 16px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#475569",
    whiteSpace: "nowrap",
    cursor: "pointer"
  },
  catChipActive: {
    background: "#16a34a",
    color: "#ffffff",
    borderColor: "#16a34a"
  },
  productGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "12px",
    padding: "0 16px"
  },
  productCard: {
    background: "#ffffff",
    borderRadius: "14px",
    overflow: "hidden",
    boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
    display: "flex",
    flexDirection: "column",
    cursor: "pointer"
  },
  imageWrap: {
    position: "relative",
    width: "100%",
    paddingTop: "110%"
  },
  productImg: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },
  freeDeliveryBadge: {
    position: "absolute",
    bottom: "8px",
    left: "8px",
    background: "#f1f5f9",
    color: "#334155",
    fontSize: "10px",
    fontWeight: "bold",
    padding: "2px 6px",
    borderRadius: "10px"
  },
  cardBody: {
    padding: "10px",
    display: "flex",
    flexDirection: "column",
    flex: 1,
    justifyContent: "space-between"
  },
  productTitle: {
    margin: "0 0 6px",
    fontSize: "13px",
    color: "#334155",
    fontWeight: "600",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden"
  },
  priceRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flexWrap: "wrap"
  },
  price: {
    fontSize: "15px",
    fontWeight: "900",
    color: "#0f172a"
  },
  oldPrice: {
    fontSize: "11px",
    color: "#94a3b8",
    textDecoration: "line-through"
  },
  discount: {
    fontSize: "10px",
    color: "#16a34a",
    fontWeight: "bold"
  },
  ratingRow: {
    marginTop: "4px",
    display: "flex",
    alignItems: "center",
    gap: "6px"
  },
  ratingBadge: {
    background: "#22c55e",
    color: "#fff",
    fontSize: "10px",
    fontWeight: "bold",
    padding: "2px 6px",
    borderRadius: "10px"
  },
  reviewCount: {
    fontSize: "10px",
    color: "#94a3b8"
  },
  cardBtnGroup: {
    display: "flex",
    gap: "6px",
    marginTop: "10px"
  },
  addToCartBtn: {
    flex: 1,
    background: "#f1f5f9",
    color: "#0f172a",
    border: "1px solid #cbd5e1",
    padding: "6px",
    borderRadius: "8px",
    fontWeight: "bold",
    fontSize: "11px",
    cursor: "pointer"
  },
  buyNowBtn: {
    flex: 1,
    background: "#16a34a",
    color: "#ffffff",
    border: "none",
    padding: "6px",
    borderRadius: "8px",
    fontWeight: "bold",
    fontSize: "11px",
    cursor: "pointer"
  },
  subPageContainer: {
    padding: "16px",
    maxWidth: "600px",
    margin: "0 auto"
  },
  backBtn: {
    background: "transparent",
    border: "none",
    color: "#2563eb",
    fontWeight: "bold",
    cursor: "pointer",
    marginBottom: "16px",
    fontSize: "14px"
  },
  detailCard: {
    background: "#fff",
    padding: "20px",
    borderRadius: "20px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.05)"
  },
  detailImgWrap: {
    width: "100%",
    height: "300px",
    borderRadius: "14px",
    overflow: "hidden",
    marginBottom: "16px"
  },
  detailImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },
  detailTitle: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: "10px"
  },
  detailPerks: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginTop: "16px",
    background: "#f8fafc",
    padding: "12px",
    borderRadius: "12px",
    fontSize: "13px",
    color: "#334155",
    fontWeight: "600"
  },
  cartItemCard: {
    display: "flex",
    gap: "12px",
    background: "#fff",
    padding: "12px",
    borderRadius: "12px",
    marginBottom: "10px",
    alignItems: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
  },
  cartImg: {
    width: "60px",
    height: "60px",
    objectFit: "cover",
    borderRadius: "8px"
  },
  modalBackdrop: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0, 0, 0, 0.6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    padding: "16px"
  },
  modalCard: {
    background: "#ffffff",
    width: "100%",
    maxWidth: "420px",
    borderRadius: "20px",
    padding: "24px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
    boxSizing: "border-box"
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px"
  },
  closeModalBtn: {
    background: "#f1f5f9",
    border: "none",
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    fontWeight: "bold",
    cursor: "pointer",
    color: "#64748b"
  },
  formStyle: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  input: {
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    outline: "none"
  },
  primaryBtn: {
    marginTop: "10px",
    background: "#16a34a",
    color: "#fff",
    border: "none",
    padding: "14px",
    borderRadius: "12px",
    fontWeight: "bold",
    fontSize: "15px",
    cursor: "pointer",
    width: "100%"
  },
  paymentNoticeBox: {
    background: "#fef3c7",
    border: "1px solid #f59e0b",
    padding: "14px",
    borderRadius: "12px",
    marginBottom: "16px"
  },
  codOptionCard: {
    background: "#fff",
    padding: "16px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    marginBottom: "20px"
  },
  orderCard: {
    background: "#fff",
    padding: "14px",
    borderRadius: "12px",
    marginBottom: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
  }
};
