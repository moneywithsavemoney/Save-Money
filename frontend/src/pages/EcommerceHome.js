import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function EcommerceHome() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [cartCount, setCartCount] = useState(0);

  // Meesho টাইপ জামাকাপড়ের ডেমো প্রোডাক্ট লিস্ট
  const products = [
    {
      id: 1,
      title: "Women Floral Printed Anarkali Kurti",
      category: "Kurti",
      price: 349,
      oldPrice: 899,
      discount: "61% OFF",
      rating: "4.2 ★",
      reviews: "1,240",
      image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400&auto=format&fit=crop&q=60"
    },
    {
      id: 2,
      title: "Men Cotton Solid Slim Fit Shirt",
      category: "Shirt",
      price: 299,
      oldPrice: 699,
      discount: "57% OFF",
      rating: "4.0 ★",
      reviews: "856",
      image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400&auto=format&fit=crop&q=60"
    },
    {
      id: 3,
      title: "Designer Silk Blend Saree with Blouse",
      category: "Saree",
      price: 499,
      oldPrice: 1499,
      discount: "66% OFF",
      rating: "4.5 ★",
      reviews: "3,120",
      image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&auto=format&fit=crop&q=60"
    },
    {
      id: 4,
      title: "Stylish Stylish Printed Casual T-Shirt",
      category: "T-Shirt",
      price: 199,
      oldPrice: 499,
      discount: "60% OFF",
      rating: "4.1 ★",
      reviews: "540",
      image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&auto=format&fit=crop&q=60"
    },
    {
      id: 5,
      title: "Ethnic Cotton Printed Lehenga Choli",
      category: "Lehenga",
      price: 799,
      oldPrice: 2499,
      discount: "68% OFF",
      rating: "4.4 ★",
      reviews: "920",
      image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&auto=format&fit=crop&q=60"
    },
    {
      id: 6,
      title: "Men Slim Fit Denim Jeans Pant",
      category: "Jeans",
      price: 449,
      oldPrice: 1199,
      discount: "62% OFF",
      rating: "4.3 ★",
      reviews: "2,050",
      image: "https://images.unsplash.com/photo-1542272604-780c36856d62?w=400&auto=format&fit=crop&q=60"
    }
  ];

  const categories = ["All", "Kurti", "Saree", "Shirt", "T-Shirt", "Lehenga", "Jeans"];

  const filteredProducts = products.filter((item) => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  const addToCart = () => {
    setCartCount((prev) => prev + 1);
    alert("🛍️ Product added to order list!");
  };

  return (
    <div style={styles.container}>
      {/* 🟢 TOP BAR / HEADER */}
      <header style={styles.header}>
        <div style={styles.brandRow}>
          <h2 style={styles.logoText}>Meesho<span>Shop</span></h2>
          <div style={styles.headerIcons}>
            <div style={styles.cartBtn}>
              🛒 <span style={styles.cartBadge}>{cartCount}</span>
            </div>
            <button style={styles.logoutBtn} onClick={handleLogout}>🚪 Logout</button>
          </div>
        </div>

        {/* Search Bar */}
        <div style={styles.searchBox}>
          🔍 <input
            type="text"
            placeholder="Search Kurti, Saree, Shirt, Jeans..."
            style={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      {/* 🟢 PROMO BANNER */}
      <div style={styles.banner}>
        <div style={styles.bannerText}>
          <span style={styles.bannerBadge}>Lowest Prices Every Day</span>
          <h1 style={styles.bannerTitle}>50% - 80% OFF</h1>
          <p style={styles.bannerSub}>Free Delivery • Cash on Delivery • Easy Returns</p>
        </div>
      </div>

      {/* 🟢 CATEGORY SCROLL */}
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

      {/* 🟢 PRODUCT GRID */}
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
                <span style={styles.reviews}>({product.reviews})</span>
              </div>

              <button style={styles.orderBtn} onClick={addToCart}>
                🛍️ Buy / Order Now
              </button>
            </div>
          </div>
        ))}
      </div>
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
  logoText: {
    margin: 0,
    fontSize: "22px",
    fontWeight: "900",
    color: "#9f208c"
  },
  headerIcons: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  cartBtn: {
    position: "relative",
    fontSize: "22px",
    cursor: "pointer"
  },
  cartBadge: {
    position: "absolute",
    top: "-6px",
    right: "-8px",
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
    padding: "6px 12px",
    borderRadius: "20px",
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
    background: "linear-gradient(135deg, #9f208c 0%, #e11d48 100%)",
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
    fontSize: "28px",
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
    background: "#9f208c",
    color: "#ffffff",
    borderColor: "#9f208c"
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
    paddingTop: "120%"
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
    fontSize: "16px",
    fontWeight: "900",
    color: "#0f172a"
  },
  oldPrice: {
    fontSize: "12px",
    color: "#94a3b8",
    textDecoration: "line-through"
  },
  discount: {
    fontSize: "11px",
    color: "#16a34a",
    fontWeight: "bold"
  },
  ratingRow: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    marginTop: "6px"
  },
  ratingBadge: {
    background: "#22c55e",
    color: "#fff",
    fontSize: "10px",
    fontWeight: "bold",
    padding: "2px 6px",
    borderRadius: "10px"
  },
  reviews: {
    fontSize: "10px",
    color: "#94a3b8"
  },
  orderBtn: {
    marginTop: "10px",
    background: "#9f208c",
    color: "#ffffff",
    border: "none",
    padding: "8px",
    borderRadius: "10px",
    fontWeight: "bold",
    fontSize: "12px",
    cursor: "pointer",
    width: "100%"
  }
};
    
