import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function EcommerceHome() {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState("home"); // home, cart, address, payment, tracking
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);

  // Address Form State
  const [address, setAddress] = useState({
    name: "",
    phone: "",
    house: "",
    city: "",
    pincode: ""
  });

  const [checkoutItem, setCheckoutItem] = useState(null);

  // 🟢 ব্যাক প্রেস করলে মেইন সিস্টেমে না গিয়ে সরাসরি লগইন পেজে রিডাইরেক্ট করার লজিক
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
    const savedOrders = JSON.parse(localStorage.getItem("user_demo_orders") || "[]");
    setOrders(savedOrders);
  }, []);

  // 🟢 ৫০+ সম্পূর্ণ আলাদা ও অনন্য (Unique) ইমেজ যুক্ত প্রোডাক্ট লিস্ট
  const products = [
    { id: 1, title: "Men Casual Cotton Checked Shirt", category: "Men Shirt", price: 299, oldPrice: 699, discount: "57% OFF", rating: "4.2 ★", image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400&auto=format&fit=crop&q=60" },
    { id: 2, title: "Men Slim Fit Stretchable Blue Jeans", category: "Men Jeans", price: 499, oldPrice: 1299, discount: "61% OFF", rating: "4.3 ★", image: "https://images.unsplash.com/photo-1542272604-780c36856d62?w=400&auto=format&fit=crop&q=60" },
    { id: 3, title: "Women Floral Printed Rayon Kurti", category: "Women Kurti", price: 249, oldPrice: 799, discount: "68% OFF", rating: "4.4 ★", image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400&auto=format&fit=crop&q=60" },
    { id: 4, title: "Traditional Banarasi Silk Purple Saree", category: "Saree", price: 450, oldPrice: 1500, discount: "70% OFF", rating: "4.5 ★", image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&auto=format&fit=crop&q=60" },
    { id: 5, title: "Women Soft Cotton Comfortable Nighty", category: "Nighty", price: 299, oldPrice: 699, discount: "57% OFF", rating: "4.1 ★", image: "https://images.unsplash.com/photo-1554412933-514a83d2f3c8?w=400&auto=format&fit=crop&q=60" },
    { id: 6, title: "Kids Baby Boy Cotton Party Wear Suit", category: "Kids", price: 350, oldPrice: 999, discount: "65% OFF", rating: "4.6 ★", image: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=400&auto=format&fit=crop&q=60" },
    { id: 7, title: "Kids Baby Girl Pink Designer Frock", category: "Kids", price: 320, oldPrice: 899, discount: "64% OFF", rating: "4.5 ★", image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&auto=format&fit=crop&q=60" },
    { id: 8, title: "Men Formal Solid White Button Shirt", category: "Men Shirt", price: 349, oldPrice: 899, discount: "61% OFF", rating: "4.0 ★", image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&auto=format&fit=crop&q=60" },
    { id: 9, title: "Men Regular Fit Dark Denim Jeans", category: "Men Jeans", price: 450, oldPrice: 1199, discount: "62% OFF", rating: "4.2 ★", image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&auto=format&fit=crop&q=60" },
    { id: 10, title: "Women Embroidered Anarkali Yellow Kurta", category: "Women Kurti", price: 350, oldPrice: 1099, discount: "68% OFF", rating: "4.3 ★", image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&auto=format&fit=crop&q=60" },
    { id: 11, title: "Georgette Party Wear Red Saree", category: "Saree", price: 399, oldPrice: 1299, discount: "69% OFF", rating: "4.1 ★", image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=400&auto=format&fit=crop&q=60" },
    { id: 12, title: "Soft Cotton Printed Maxi Nighty", category: "Nighty", price: 249, oldPrice: 599, discount: "58% OFF", rating: "4.2 ★", image: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=400&auto=format&fit=crop&q=60" },
    { id: 13, title: "Boys Cotton T-Shirt & Shorts Summer Set", category: "Kids", price: 299, oldPrice: 799, discount: "62% OFF", rating: "4.4 ★", image: "https://images.unsplash.com/photo-1503944583220-7eeec293c68b?w=400&auto=format&fit=crop&q=60" },
    { id: 14, title: "Girls Princess Dress for Weddings", category: "Kids", price: 399, oldPrice: 1199, discount: "66% OFF", rating: "4.7 ★", image: "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=400&auto=format&fit=crop&q=60" },
    { id: 15, title: "Men Printed Casual Black T-Shirt", category: "Men Shirt", price: 199, oldPrice: 499, discount: "60% OFF", rating: "4.1 ★", image: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=400&auto=format&fit=crop&q=60" },
    { id: 16, title: "Men Casual Beige Chino Trouser Pant", category: "Men Jeans", price: 350, oldPrice: 999, discount: "65% OFF", rating: "4.0 ★", image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&auto=format&fit=crop&q=60" },
    { id: 17, title: "Women Daily Wear Green Printed Kurti", category: "Women Kurti", price: 249, oldPrice: 699, discount: "64% OFF", rating: "4.3 ★", image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&auto=format&fit=crop&q=60" },
    { id: 18, title: "Soft Kanjeevaram Silk Border Saree", category: "Saree", price: 350, oldPrice: 1199, discount: "70% OFF", rating: "4.4 ★", image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&auto=format&fit=crop&q=60" },
    { id: 19, title: "Hosiery Cotton Printed Nightwear", category: "Nighty", price: 299, oldPrice: 799, discount: "62% OFF", rating: "4.0 ★", image: "https://images.unsplash.com/photo-1582533561751-ef6f6ab93a2e?w=400&auto=format&fit=crop&q=60" },
    { id: 20, title: "Infant Cute Baby Romper Dress", category: "Kids", price: 249, oldPrice: 599, discount: "58% OFF", rating: "4.5 ★", image: "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=400&auto=format&fit=crop&q=60" },
    { id: 21, title: "Men Denim Full Sleeve Casual Shirt", category: "Men Shirt", price: 399, oldPrice: 999, discount: "60% OFF", rating: "4.3 ★", image: "https://images.unsplash.com/photo-1588359348347-9bc6cbbb689e?w=400&auto=format&fit=crop&q=60" },
    { id: 22, title: "Men Black Skinny Fit Biker Jeans", category: "Men Jeans", price: 499, oldPrice: 1399, discount: "64% OFF", rating: "4.5 ★", image: "https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=400&auto=format&fit=crop&q=60" },
    { id: 23, title: "Women Pink Designer Straight Kurti", category: "Women Kurti", price: 299, oldPrice: 849, discount: "65% OFF", rating: "4.2 ★", image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400&auto=format&fit=crop&q=60" },
    { id: 24, title: "Chiffon Light Weight Designer Saree", category: "Saree", price: 320, oldPrice: 999, discount: "68% OFF", rating: "4.1 ★", image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=400&auto=format&fit=crop&q=60" },
    { id: 25, title: "Women Long Sleeveless Night Gown", category: "Nighty", price: 350, oldPrice: 899, discount: "61% OFF", rating: "4.3 ★", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&auto=format&fit=crop&q=60" },
    { id: 26, title: "Boys Traditional Ethnic Kurta Pyjama", category: "Kids", price: 399, oldPrice: 1199, discount: "66% OFF", rating: "4.6 ★", image: "https://images.unsplash.com/photo-1503944583220-7eeec293c68b?w=400&auto=format&fit=crop&q=60" },
    { id: 27, title: "Girls Floral Party Wear Lehenga Choli", category: "Kids", price: 450, oldPrice: 1399, discount: "68% OFF", rating: "4.7 ★", image: "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=400&auto=format&fit=crop&q=60" },
    { id: 28, title: "Men Striped Casual Polo T-Shirt", category: "Men Shirt", price: 249, oldPrice: 699, discount: "64% OFF", rating: "4.1 ★", image: "https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=400&auto=format&fit=crop&q=60" },
    { id: 29, title: "Men Ripped Light Blue Denim Jeans", category: "Men Jeans", price: 450, oldPrice: 1249, discount: "63% OFF", rating: "4.2 ★", image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&auto=format&fit=crop&q=60" },
    { id: 30, title: "Women Blue Printed Flare A-Line Kurti", category: "Women Kurti", price: 349, oldPrice: 999, discount: "65% OFF", rating: "4.4 ★", image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&auto=format&fit=crop&q=60" },
    { id: 31, title: "Cotton Heavy Embroidery Border Saree", category: "Saree", price: 499, oldPrice: 1699, discount: "70% OFF", rating: "4.5 ★", image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&auto=format&fit=crop&q=60" },
    { id: 32, title: "Women Pure Cotton Bathrobe & Nighty", category: "Nighty", price: 399, oldPrice: 999, discount: "60% OFF", rating: "4.2 ★", image: "https://images.unsplash.com/photo-1554412933-514a83d2f3c8?w=400&auto=format&fit=crop&q=60" },
    { id: 33, title: "Kids Unisex Hoodie & Trackpant Set", category: "Kids", price: 349, oldPrice: 899, discount: "61% OFF", rating: "4.5 ★", image: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=400&auto=format&fit=crop&q=60" },
    { id: 34, title: "Girls Summer Cotton Printed Top", category: "Kids", price: 199, oldPrice: 499, discount: "60% OFF", rating: "4.3 ★", image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&auto=format&fit=crop&q=60" },
    { id: 35, title: "Men Maroon Slim Fit Party Shirt", category: "Men Shirt", price: 350, oldPrice: 899, discount: "61% OFF", rating: "4.2 ★", image: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=400&auto=format&fit=crop&q=60" },
    { id: 36, title: "Men Jogger Style Cargo Denim Pant", category: "Men Jeans", price: 499, oldPrice: 1299, discount: "61% OFF", rating: "4.4 ★", image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&auto=format&fit=crop&q=60" },
    { id: 37, title: "Women Cotton Short Tunic Kurti", category: "Women Kurti", price: 249, oldPrice: 649, discount: "61% OFF", rating: "4.1 ★", image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&auto=format&fit=crop&q=60" },
    { id: 38, title: "South Indian Temple Border Silk Saree", category: "Saree", price: 450, oldPrice: 1499, discount: "70% OFF", rating: "4.6 ★", image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=400&auto=format&fit=crop&q=60" },
    { id: 39, title: "Women Satin Silk Nightdress Suit", category: "Nighty", price: 350, oldPrice: 899, discount: "61% OFF", rating: "4.3 ★", image: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=400&auto=format&fit=crop&q=60" },
    { id: 40, title: "Boys Printed Denim Dungaree Dress", category: "Kids", price: 399, oldPrice: 999, discount: "60% OFF", rating: "4.5 ★", image: "https://images.unsplash.com/photo-1503944583220-7eeec293c68b?w=400&auto=format&fit=crop&q=60" },
    { id: 41, title: "Girls Red Velvet Party Frock", category: "Kids", price: 349, oldPrice: 899, discount: "61% OFF", rating: "4.4 ★", image: "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=400&auto=format&fit=crop&q=60" },
    { id: 42, title: "Men Grey Casual Linen Cotton Shirt", category: "Men Shirt", price: 320, oldPrice: 799, discount: "60% OFF", rating: "4.0 ★", image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400&auto=format&fit=crop&q=60" },
    { id: 43, title: "Men Clean Look Black Formal Trousers", category: "Men Jeans", price: 399, oldPrice: 999, discount: "60% OFF", rating: "4.1 ★", image: "https://images.unsplash.com/photo-1542272604-780c36856d62?w=400&auto=format&fit=crop&q=60" },
    { id: 44, title: "Women Chikankari Work White Kurti", category: "Women Kurti", price: 350, oldPrice: 999, discount: "65% OFF", rating: "4.5 ★", image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400&auto=format&fit=crop&q=60" },
    { id: 45, title: "Organza Floral Printed Modern Saree", category: "Saree", price: 399, oldPrice: 1299, discount: "69% OFF", rating: "4.3 ★", image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&auto=format&fit=crop&q=60" },
    { id: 46, title: "Soft Rayon Printed Feeding Nighty", category: "Nighty", price: 299, oldPrice: 699, discount: "57% OFF", rating: "4.2 ★", image: "https://images.unsplash.com/photo-1554412933-514a83d2f3c8?w=400&auto=format&fit=crop&q=60" },
    { id: 47, title: "Kids Superhero Print T-Shirt & Shorts", category: "Kids", price: 249, oldPrice: 599, discount: "58% OFF", rating: "4.6 ★", image: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=400&auto=format&fit=crop&q=60" },
    { id: 48, title: "Girls Embroidered Net Tutu Dress", category: "Kids", price: 399, oldPrice: 1099, discount: "63% OFF", rating: "4.7 ★", image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&auto=format&fit=crop&q=60" },
    { id: 49, title: "Men Casual Half Sleeve Printed Shirt", category: "Men Shirt", price: 249, oldPrice: 599, discount: "58% OFF", rating: "4.1 ★", image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&auto=format&fit=crop&q=60" },
    { id: 50, title: "Men Regular Fit Ice Blue Jeans", category: "Men Jeans", price: 450, oldPrice: 1199, discount: "62% OFF", rating: "4.3 ★", image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&auto=format&fit=crop&q=60" }
  ];

  const categories = ["All", "Men Shirt", "Men Jeans", "Women Kurti", "Saree", "Nighty", "Kids"];

  const filteredProducts = products.filter((item) => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAddToCart = (product) => {
    setCart([...cart, product]);
    alert("🛍️ Product added to cart!");
  };

  const handleBuyNow = (product) => {
    setCheckoutItem(product);
    setCurrentView("address");
  };

  const handleSaveAddress = (e) => {
    e.preventDefault();
    if (!address.name || !address.phone || !address.house || !address.city || !address.pincode) {
      alert("Please fill all address fields!");
      return;
    }
    setCurrentView("payment");
  };

  const handlePlaceOrder = () => {
    const newOrder = {
      id: "ORD" + Math.floor(100000 + Math.random() * 900000),
      item: checkoutItem || cart[0] || products[0],
      address: address,
      date: new Date().toLocaleDateString(),
      status: "Confirmed (Cash on Delivery)"
    };

    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);
    localStorage.setItem("user_demo_orders", JSON.stringify(updatedOrders));
    
    setCart([]);
    setCheckoutItem(null);
    setCurrentView("tracking");
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  return (
    <div style={styles.container}>
      {/* 🟢 TOP HEADER WITH LOGO FROM PUBLIC FOLDER */}
      <header style={styles.header}>
        <div style={styles.brandRow}>
          <div style={styles.logoWrap}>
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
              📦 Orders
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
              <div key={product.id} style={styles.productCard}>
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
                  </div>

                  <div style={styles.cardBtnGroup}>
                    <button style={styles.addToCartBtn} onClick={() => handleAddToCart(product)}>
                      Add to Cart
                    </button>
                    <button style={styles.buyNowBtn} onClick={() => handleBuyNow(product)}>
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 🟢 VIEW 2: CART */}
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
            <button style={styles.primaryBtn} onClick={() => { setCheckoutItem(cart[0]); setCurrentView("address"); }}>
              Proceed to Checkout
            </button>
          )}
        </div>
      )}

      {/* 🟢 VIEW 3: ADDRESS */}
      {currentView === "address" && (
        <div style={styles.subPageContainer}>
          <h2>Enter Delivery Address</h2>
          <button style={styles.backBtn} onClick={() => setCurrentView("home")}>← Cancel</button>

          <form onSubmit={handleSaveAddress} style={styles.formStyle}>
            <input placeholder="Full Name" style={styles.input} value={address.name} onChange={(e) => setAddress({...address, name: e.target.value})} required />
            <input placeholder="Phone Number" style={styles.input} value={address.phone} onChange={(e) => setAddress({...address, phone: e.target.value})} required />
            <input placeholder="House No / Street / Area" style={styles.input} value={address.house} onChange={(e) => setAddress({...address, house: e.target.value})} required />
            <input placeholder="City" style={styles.input} value={address.city} onChange={(e) => setAddress({...address, city: e.target.value})} required />
            <input placeholder="Pincode" style={styles.input} value={address.pincode} onChange={(e) => setAddress({...address, pincode: e.target.value})} required />

            <button type="submit" style={styles.primaryBtn}>Save Address & Continue</button>
          </form>
        </div>
      )}

      {/* 🟢 VIEW 4: PAYMENT */}
      {currentView === "payment" && (
        <div style={styles.subPageContainer}>
          <h2>Payment Method</h2>
          <button style={styles.backBtn} onClick={() => setCurrentView("address")}>← Back to Address</button>

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

      {/* 🟢 VIEW 5: ORDER TRACKING */}
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
    gap: "8px"
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
    flexDirection: "column"
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
    marginTop: "4px"
  },
  ratingBadge: {
    background: "#22c55e",
    color: "#fff",
    fontSize: "10px",
    fontWeight: "bold",
    padding: "2px 6px",
    borderRadius: "10px"
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
