import { useState, useEffect, useRef, useMemo } from "react";
import {
  LayoutDashboard,
  Receipt,
  Settings,
  Webhook,
  Activity,
  CheckCircle2,
  Clock,
  Plus,
  Moon,
  Sun,
  ShieldCheck,
  AlertTriangle,
  BarChart2,
  Code,
  Wallet,
  XCircle,
} from "lucide-react";
import { Chart } from "react-google-charts";
import { Link, useNavigate } from "react-router-dom";

// Floating Bubbles Component
const FloatingBubbles = () => {
  const bubbles = useMemo(() => Array.from({ length: 15 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}vw`,
    size: `${Math.random() * 40 + 20}px`,
    duration: `${Math.random() * 10 + 10}s`,
    delay: `${Math.random() * 5}s`,
  })), []);

  return (
    <div className="bubbles-container">
      {bubbles.map((b) => (
        <div
          key={b.id}
          className="bubble"
          
          style={{
            left: b.left,
            width: b.size,
            height: b.size,
            animationDuration: b.duration,
            animationDelay: b.delay,
          }}
        />
      ))}
    </div>
  );
};

function App() {
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [stats, setStats] = useState({ income: 0, success: 0, pending: 0, failed: 0 });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [settings, setSettings] = useState({
    storeName: "SanzOfficiallID",
    profilePic: "",
    email: "techprototypex@gmail.com",
    phone: "081234567890",
    password: "SanzternyataCEO",
    sandboxMode: false,
  });
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem("qris_auth") === "true");
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });

  // Toast Notification System
  const [toast, setToast] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: "success" | "warning" | "error" | "info";
  }>({ show: false, title: "", message: "", type: "info" });
  const prevSuccessCount = useRef(0);
  const toastTimerRef = useRef<any | null>(null);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const isEditingRef = useRef(false);

  useEffect(() => {
    isEditingRef.current = isEditingProfile;
  }, [isEditingProfile]);

  const showNotification = (
    title: string,
    message: string,
    type: "success" | "warning" | "error" | "info" = "info",
  ) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);

    // Reset animation if called while already showing
    setToast({ show: false, title: "", message: "", type: "info" });

    setTimeout(() => {
      setToast({ show: true, title, message, type });
      toastTimerRef.current = setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, 5000);
    }, 50); // small delay to force DOM reflow
  };

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Fetch Data dari Backend Node.js
  const fetchData = async () => {
    try {
      const res = await fetch("/api/dashboard");
      const data = await res.json();
      setStats(data.stats);
      setTransactions(data.transactions);
      setLogs(data.logs);

      // Jangan timpa setting jika user sedang edit profil
      if (data.settings && !isEditingRef.current) {
        setSettings(data.settings);
      }

      // Cek apakah ada pembayaran baru yang lunas
      if (
        data.stats.success > prevSuccessCount.current &&
        prevSuccessCount.current !== 0
      ) {
        showNotification(
          "PEMBAYARAN LUNAS",
          "Ada transaksi QRIS yang baru saja terbayar!",
          "success",
        );
      }
      prevSuccessCount.current = data.stats.success;
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh tiap 3 detik
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const toggleSandbox = async () => {
    const newSandboxMode = !settings.sandboxMode;
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sandboxMode: newSandboxMode }),
      });
      setSettings((prev) => ({ ...prev, sandboxMode: newSandboxMode }));
      fetchData();
      showNotification(
        newSandboxMode ? "MODE SANDBOX AKTIF" : "MODE PRODUCTION AKTIF",
        newSandboxMode
          ? "Anda menggunakan data Dummy untuk Testing."
          : "Anda kini menggunakan data Asli / Real-time.",
        newSandboxMode ? "warning" : "success",
      );
    } catch (e) {
      showNotification("ERROR", "Gagal mengganti mode.", "error");
    }
  };
  const buatTagihanBaru = () => {
    setActiveMenu("buat-qris");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 500;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
          setSettings({ ...settings, profilePic: compressedBase64 });
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const saveSettings = async () => {
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      setIsEditingProfile(false);
      showNotification(
        "PENGATURAN DISIMPAN",
        "Data profil & foto toko telah berhasil diperbarui.",
        "info",
      );
    } catch (e) {
      showNotification(
        "GAGAL DISIMPAN",
        "Gagal menyimpan pengaturan.",
        "error",
      );
    }
  };

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "buat-qris", label: "Buat QRIS", icon: Receipt },
    { id: "transactions", label: "Riwayat", icon: Receipt },
    { id: "statistik", label: "Statistik", icon: BarChart2 },
    { id: "webhook", label: "Webhook Listener", icon: Webhook },
    { id: "api-docs", label: "API & Docs", icon: Code },
    { id: "settings", label: "Pengaturan", icon: Settings },
  ];



  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(angka);
  };

  if (!isLoggedIn) {
    return (
      <div className="layout" style={{ justifyContent: "center", alignItems: "center", flexDirection: "column" }}>
        <FloatingBubbles />
        {toast.show && (
          <div
            
          style={{
              position: "fixed", top: "24px", right: "24px", background: "var(--surf)", borderRadius: "16px",
              boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
              border: `1px solid ${toast.type === "success" ? "#86EFAC" : toast.type === "error" ? "#FCA5A5" : "#BFDBFE"}`,
              width: "380px", overflow: "hidden", zIndex: 9999,
              animation: "slideInOut 4.9s ease-in-out forwards",
            }}
          >
            <div style={{ padding: "20px" }}>
              <div style={{ display: "flex", gap: "16px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: "14px", color: "var(--txt)", marginBottom: "4px" }}>{toast.title}</div>
                  <div style={{ fontSize: "13px", fontFamily: "Plus Jakarta Sans", color: "var(--txt3)", lineHeight: 1.5 }}>{toast.message}</div>
                </div>
              </div>
            </div>
            <div style={{ height: "4px", background: toast.type === "success" ? "#16A34A" : toast.type === "error" ? "#DC2626" : "#2563EB", animation: "progressShrink 5s linear forwards" }}></div>
          </div>
        )}

        <div className="card animate-fade-in" style={{ maxWidth: "400px", width: "100%", padding: "40px", position: "relative", zIndex: 10, textAlign: "center" }}>
          <div style={{ display: "inline-flex", marginBottom: "24px" }}>
            <img src="/logo-icon.png" width="80" height="80" style={{ borderRadius: "20px", boxShadow: "0 8px 24px rgba(29, 78, 216, 0.3)" }} alt="QRISGate Logo" />
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "var(--txt)", marginBottom: "8px" }}>Login QRISGate</h1>
          <p style={{ color: "var(--txt3)", fontSize: "14px", marginBottom: "32px" }}>Silakan login untuk mengakses dashboard.</p>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            if (loginForm.username === "QG" && loginForm.password === "QG") {
              localStorage.setItem("qris_auth", "true");
              setIsLoggedIn(true);
            } else {
              showNotification("LOGIN GAGAL", "Username atau password salah!", "error");
            }
          }} style={{ textAlign: "left" }}>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "13px", fontFamily: "Plus Jakarta Sans", fontWeight: 700, marginBottom: "8px", color: "var(--txt)" }}>Username</label>
              <input type="text" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} style={{ width: "100%", padding: "14px 16px", borderRadius: "12px", border: "1px solid var(--bdr)", background: "var(--surf2)", color: "var(--txt)", fontSize: "14px", outline: "none", transition: "border-color 0.2s" }} placeholder="Masukkan username..." required />
            </div>
            <div style={{ marginBottom: "32px" }}>
              <label style={{ display: "block", fontSize: "13px", fontFamily: "Plus Jakarta Sans", fontWeight: 700, marginBottom: "8px", color: "var(--txt)" }}>Password</label>
              <input type="password" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} style={{ width: "100%", padding: "14px 16px", borderRadius: "12px", border: "1px solid var(--bdr)", background: "var(--surf2)", color: "var(--txt)", fontSize: "14px", outline: "none", transition: "border-color 0.2s" }} placeholder="••••••••" required />
            </div>
            <button type="submit" style={{ width: "100%", background: "#1D4ED8", color: "white", padding: "16px", borderRadius: "12px", fontWeight: 800, border: "none", cursor: "pointer", fontSize: "15px", boxShadow: "0 4px 14px rgba(29, 78, 216, 0.4)" }}>Login Dashboard</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="layout">
      <FloatingBubbles />

      {/* Global Toast Notification */}
      {toast.show && (
        <div
          
          style={{
            position: "fixed",
            top: "24px",
            right: "24px",
            background: "var(--surf)",
            borderRadius: "16px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
            border: `1px solid ${toast.type === "success" ? "#86EFAC" : toast.type === "warning" ? "#FDE68A" : toast.type === "error" ? "#FCA5A5" : "#BFDBFE"}`,
            width: "380px",
            overflow: "hidden",
            zIndex: 9999,
            animation: "slideInOut 4.9s ease-in-out forwards",
          }}
        >
          <div style={{ padding: "20px" }}>
            <div style={{ display: "flex", gap: "16px" }}>
              <div
                
          style={{
                  color:
                    toast.type === "success"
                      ? "#16A34A"
                      : toast.type === "warning"
                        ? "#D97706"
                        : toast.type === "error"
                          ? "#DC2626"
                          : "#2563EB",
                  marginTop: "2px",
                }}
              >
                {toast.type === "success" ? (
                  <CheckCircle2 size={20} />
                ) : toast.type === "info" ? (
                  <ShieldCheck size={20} />
                ) : (
                  <AlertTriangle size={20} />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  
          style={{
                    color:
                      toast.type === "success"
                        ? "#16A34A"
                        : toast.type === "warning"
                          ? "#D97706"
                          : toast.type === "error"
                            ? "#DC2626"
                            : "#2563EB",
                    fontSize: "11px",
                    fontWeight: 800,
                    letterSpacing: "0.05em",
                  }}
                >
                  • {toast.type.toUpperCase()}
                </div>
                <div
                  
          style={{
                    fontWeight: 800,
                    fontSize: "14px",
                    marginTop: "4px",
                    marginBottom: "8px",
                    color: "var(--txt)",
                  }}
                >
                  {toast.title}
                </div>
                <div
                  
          style={{
                    fontSize: "13px", fontFamily: "Plus Jakarta Sans",
                    color: "var(--txt3)",
                    lineHeight: 1.5,
                  }}
                >
                  {toast.message}
                </div>
              </div>
              <button
                onClick={() => setToast((prev) => ({ ...prev, show: false }))}
                
          style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--txt3)",
                  cursor: "pointer",
                  padding: 0,
                  height: "max-content",
                }}
              >
                ✕
              </button>
            </div>
          </div>
          {/* Progress Bar Cooldown */}
          <div
            
          style={{
              height: "4px",
              background:
                toast.type === "success"
                  ? "#16A34A"
                  : toast.type === "warning"
                    ? "#D97706"
                    : toast.type === "error"
                      ? "#DC2626"
                      : "#2563EB",
              animation: "progressShrink 5s linear forwards",
            }}
          ></div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="sidebar">
        <div
          
          style={{
            padding: "0 8px",
            marginBottom: "40px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            
          style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "var(--grad)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
            }}
          >
            <Activity size={24} />
          </div>
          <h2 style={{ fontSize: "20px", color: "var(--txt)", margin: 0 }}>
            QRIS<span style={{ color: "var(--acc)" }}>Gate</span>
          </h2>
        </div>

        <nav style={{ flex: 1 }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeMenu === item.id;
            return (
              <div
                key={item.id}
                className={`sidebar-item ${isActive ? "active" : ""}`}
                onClick={() => setActiveMenu(item.id)}
              >
                <div className="sidebar-icon-wrapper">
                  <Icon size={20} />
                </div>
                {item.label}
              </div>
            );
          })}
        </nav>

        <div
          className="card"
          
          style={{
            padding: "16px",
            background: "var(--surf2)",
            border: "none",
            textAlign: "center",
          }}
        >
          <div
            
          style={{
              fontSize: "14px",
              fontWeight: 700,
              color: "var(--txt)",
              marginBottom: "8px",
            }}
          >
            API & Webhook
          </div>
          <div
            
          style={{
              fontSize: "12px",
              color: "var(--txt2)",
              marginBottom: "16px",
            }}
          >
            Terhubung ke http://localhost:3000
          </div>
          <span
            className="status-badge status-success"
            
          style={{ width: "100%" }}
          >
            Online
          </span>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="mobile-header"
          
          
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "32px",
          }}
        >
          <div>
            <h1
              
          style={{
                fontSize: "28px",
                color: "var(--txt)",
                marginBottom: "4px",
              }}
            >
              {activeMenu === "dashboard"
                ? "Dashboard"
                : activeMenu === "buat-qris"
                  ? "Buat QRIS Baru"
                  : activeMenu === "transactions"
                    ? "Riwayat Transaksi"
                    : activeMenu === "statistik"
                      ? "Statistik"
                      : activeMenu === "webhook"
                        ? "Log Webhook"
                        : activeMenu === "api-docs"
                          ? "Open API & Docs"
                          : "Pengaturan"}
            </h1>
            <p style={{ color: "var(--txt2)" }}>
              {activeMenu === "dashboard"
                ? "Selamat datang kembali"
                : activeMenu === "buat-qris"
                  ? "Masukkan nominal pelanggan scan QR lalu bayar"
                  : activeMenu === "transactions"
                    ? "Kelola dan pantau seluruh riwayat transaksi Anda."
                    : activeMenu === "statistik"
                      ? "Ringkasan transaksi & aktivitas terakhir"
                      : activeMenu === "webhook"
                        ? "Monitor notifikasi mutasi yang masuk dari HP Android."
                        : activeMenu === "api-docs"
                          ? "Dokumentasi lengkap integrasi REST API QRISGate ke aplikasi Anda."
                          : "Pengaturan toko dan profil akun Anda."}
            </p>
          </div>
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <button
              onClick={toggleSandbox}
              
          style={{
                background: settings.sandboxMode ? "#FEF2F2" : "var(--surf2)",
                border: `1px solid ${settings.sandboxMode ? "#FCA5A5" : "var(--bdr)"}`,
                borderRadius: "12px",
                height: "44px",
                padding: "0 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                color: settings.sandboxMode ? "#DC2626" : "var(--txt)",
                fontWeight: 700,
                fontSize: "13px", fontFamily: "Plus Jakarta Sans",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <Activity size={18} />
              {settings.sandboxMode ? "Keluar Sandbox" : "Mode Sandbox"}
            </button>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              
          style={{
                background: "var(--surf2)",
                border: "1px solid var(--bdr)",
                borderRadius: "12px",
                width: "44px",
                height: "44px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--txt)",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button className="btn-primary" onClick={buatTagihanBaru}>
              <Plus size={20} /> Buat Tagihan
            </button>
          </div>
        </div>

        <div key={activeMenu} className="tab-content">
          {/* DASHBOARD BARU */}
          {activeMenu === "dashboard" && (
            <div className="grid-1"
              
              style={{
                display: "grid",
                gridTemplateColumns: "1.8fr 1fr",
                gap: "24px",
              }}
            >
              {/* Left Column */}
              <div
                
          style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "24px",
                }}
              >
                {/* Blue Card */}
                <div
                  
          style={{
                    background:
                      "linear-gradient(135deg, #1D4ED8 0%, #1D4ED8 100%)",
                    borderRadius: "24px",
                    padding: "32px",
                    color: "white",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div
                    
          style={{
                      position: "absolute",
                      right: "-10%",
                      top: "-20%",
                      width: "300px",
                      height: "300px",
                      background: "rgba(255,255,255,0.1)",
                      borderRadius: "50%",
                    }}
                  ></div>
                  <div style={{ position: "relative", zIndex: 1 }}>
                    <div
                      
          style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <div>
                        <div
                          
          style={{
                            fontSize: "12px",
                            fontWeight: 700,
                            letterSpacing: "0.1em",
                            opacity: 0.9,
                            marginBottom: "8px",
                          }}
                        >
                          TOTAL PEMASUKAN
                        </div>
                        <div
                          
          style={{
                            fontSize: "40px",
                            fontWeight: 800,
                            marginBottom: "12px",
                          }}
                        >
                          {formatRupiah(stats.income)}
                        </div>
                        <div
                          
          style={{
                            background: "rgba(255,255,255,0.2)",
                            padding: "4px 12px",
                            borderRadius: "999px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            fontSize: "12px",
                            fontWeight: 700,
                          }}
                        >
                          <div
                            
          style={{
                              width: "8px",
                              height: "8px",
                              background: "#86EFAC",
                              borderRadius: "50%",
                            }}
                          ></div>{" "}
                          Pemasukan tercatat - real-time
                        </div>
                      </div>
                      <div
                        
          style={{
                          background: "rgba(255,255,255,0.2)",
                          padding: "12px",
                          borderRadius: "16px",
                        }}
                      >
                        <Wallet size={24} color="white" />
                      </div>
                    </div>

                    <div
                      
          className="grid-2"
                        style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr 1fr auto",
                        gap: "16px",
                        marginTop: "40px",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div
                          
          style={{
                            fontSize: "10px",
                            opacity: 0.8,
                            marginBottom: "4px",
                          }}
                        >
                          INCOME 30D
                        </div>
                        <div style={{ fontSize: "16px", fontWeight: 700 }}>
                          {formatRupiah(stats.income)}
                        </div>
                      </div>
                      <div>
                        <div
                          
          style={{
                            fontSize: "10px",
                            opacity: 0.8,
                            marginBottom: "4px",
                          }}
                        >
                          TRX BERHASIL
                        </div>
                        <div style={{ fontSize: "16px", fontWeight: 700 }}>
                          {stats.success} Trx
                        </div>
                      </div>
                      <div>
                        <div
                          
          style={{
                            fontSize: "10px",
                            opacity: 0.8,
                            marginBottom: "4px",
                          }}
                        >
                          INCOME HR INI
                        </div>
                        <div style={{ fontSize: "16px", fontWeight: 700 }}>
                          {formatRupiah(stats.income)}
                        </div>
                      </div>
                      <div>
                        <div
                          
          style={{
                            fontSize: "10px",
                            opacity: 0.8,
                            marginBottom: "4px",
                          }}
                        >
                          FEE DIBAYAR
                        </div>
                        <div style={{ fontSize: "16px", fontWeight: 700 }}>
                          Rp 0
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ringkasan Hari Ini */}
                <div className="card" style={{ padding: "24px" }}>
                  <div
                    
          style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "20px",
                    }}
                  >
                    <h3 style={{ fontSize: "18px" }}>Ringkasan Hari Ini</h3>
                    <div
                      
          style={{
                        background: "#EFF6FF",
                        color: "#1D4ED8",
                        padding: "6px 12px",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontWeight: 700,
                      }}
                    >
                      {new Date().toLocaleDateString("id-ID", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                    </div>
                  </div>
                  <div
                    
          className="grid-1"
                      style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: "16px",
                    }}
                  >
                    <div
                      
          style={{
                        border: "1px solid var(--bdr)",
                        borderRadius: "16px",
                        padding: "16px",
                      }}
                    >
                      <div
                        
          style={{
                          fontSize: "12px",
                          color: "var(--txt3)",
                          marginBottom: "4px",
                        }}
                      >
                        Masuk Hari Ini
                      </div>
                      <div style={{ fontSize: "20px", fontWeight: 800 }}>
                        {formatRupiah(stats.income)}
                      </div>
                    </div>
                    <div
                      
          style={{
                        border: "1px solid var(--bdr)",
                        borderRadius: "16px",
                        padding: "16px",
                      }}
                    >
                      <div
                        
          style={{
                          fontSize: "12px",
                          color: "var(--txt3)",
                          marginBottom: "4px",
                        }}
                      >
                        Trx Sukses
                      </div>
                      <div style={{ fontSize: "20px", fontWeight: 800 }}>
                        {stats.success} transaksi
                      </div>
                    </div>
                    <div
                      
          style={{
                        border: "1px solid var(--bdr)",
                        borderRadius: "16px",
                        padding: "16px",
                      }}
                    >
                      <div
                        
          style={{
                          fontSize: "12px",
                          color: "var(--txt3)",
                          marginBottom: "4px",
                        }}
                      >
                        Rata-rata/Trx
                      </div>
                      <div style={{ fontSize: "20px", fontWeight: 800 }}>
                        {stats.success > 0
                          ? formatRupiah(stats.income / stats.success)
                          : "0"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 6 Mini Stats */}
                <div
                  
          className="grid-2"
                    style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(6, 1fr)",
                    gap: "12px",
                  }}
                >
                  <div
                    className="card"
                    
          style={{ padding: "16px", textAlign: "center" }}
                  >
                    <div
                      
          style={{
                        display: "inline-flex",
                        background: "#EFF6FF",
                        color: "#1D4ED8",
                        padding: "8px",
                        borderRadius: "8px",
                        marginBottom: "12px",
                      }}
                    >
                      <Activity size={16} />
                    </div>
                    <div
                      
          style={{
                        fontSize: "10px",
                        color: "var(--txt3)",
                        marginBottom: "4px",
                      }}
                    >
                      Total
                      <br />
                      Transaksi
                    </div>
                    <div
                      
          style={{
                        fontSize: "18px",
                        fontWeight: 800,
                        color: "#1D4ED8",
                      }}
                    >
                      {stats.success + stats.pending + (stats.failed || 0)}
                    </div>
                  </div>
                  <div
                    className="card"
                    
          style={{ padding: "16px", textAlign: "center" }}
                  >
                    <div
                      
          style={{
                        display: "inline-flex",
                        background: "#DCFCE7",
                        color: "#16A34A",
                        padding: "8px",
                        borderRadius: "8px",
                        marginBottom: "12px",
                      }}
                    >
                      <CheckCircle2 size={16} />
                    </div>
                    <div
                      
          style={{
                        fontSize: "10px",
                        color: "var(--txt3)",
                        marginBottom: "4px",
                      }}
                    >
                      Berhasil
                      <br />
                      &nbsp;
                    </div>
                    <div
                      
          style={{
                        fontSize: "18px",
                        fontWeight: 800,
                        color: "#16A34A",
                      }}
                    >
                      {stats.success}
                    </div>
                  </div>
                  <div
                    className="card"
                    
          style={{ padding: "16px", textAlign: "center" }}
                  >
                    <div
                      
          style={{
                        display: "inline-flex",
                        background: "#FEF3C7",
                        color: "#D97706",
                        padding: "8px",
                        borderRadius: "8px",
                        marginBottom: "12px",
                      }}
                    >
                      <Clock size={16} />
                    </div>
                    <div
                      
          style={{
                        fontSize: "10px",
                        color: "var(--txt3)",
                        marginBottom: "4px",
                      }}
                    >
                      Pending
                      <br />
                      &nbsp;
                    </div>
                    <div
                      
          style={{
                        fontSize: "18px",
                        fontWeight: 800,
                        color: "#D97706",
                      }}
                    >
                      {stats.pending}
                    </div>
                  </div>
                  <div
                    className="card"
                    
          style={{ padding: "16px", textAlign: "center" }}
                  >
                    <div
                      
          style={{
                        display: "inline-flex",
                        background: "#FEE2E2",
                        color: "#DC2626",
                        padding: "8px",
                        borderRadius: "8px",
                        marginBottom: "12px",
                      }}
                    >
                      <XCircle size={16} />
                    </div>
                    <div
                      
          style={{
                        fontSize: "10px",
                        color: "var(--txt3)",
                        marginBottom: "4px",
                      }}
                    >
                      Gagal
                      <br />
                      &nbsp;
                    </div>
                    <div
                      
          style={{
                        fontSize: "18px",
                        fontWeight: 800,
                        color: "#DC2626",
                      }}
                    >
                      {stats.failed || 0}
                    </div>
                  </div>
                  <div
                    className="card"
                    
          style={{ padding: "16px", textAlign: "center" }}
                  >
                    <div
                      
          style={{
                        display: "inline-flex",
                        background: "#EFF6FF",
                        color: "#1D4ED8",
                        padding: "8px",
                        borderRadius: "8px",
                        marginBottom: "12px",
                      }}
                    >
                      <Wallet size={16} />
                    </div>
                    <div
                      
          style={{
                        fontSize: "10px",
                        color: "var(--txt3)",
                        marginBottom: "4px",
                      }}
                    >
                      Total
                      <br />
                      Income
                    </div>
                    <div
                      
          style={{
                        fontSize: "18px",
                        fontWeight: 800,
                        color: "#16A34A",
                      }}
                    >
                      {formatRupiah(stats.income)}
                    </div>
                  </div>
                  <div
                    className="card"
                    
          style={{ padding: "16px", textAlign: "center" }}
                  >
                    <div
                      
          style={{
                        display: "inline-flex",
                        background: "#F1F5F9",
                        color: "#64748B",
                        padding: "8px",
                        borderRadius: "8px",
                        marginBottom: "12px",
                      }}
                    >
                      <ShieldCheck size={16} />
                    </div>
                    <div
                      
          style={{
                        fontSize: "10px",
                        color: "var(--txt3)",
                        marginBottom: "4px",
                      }}
                    >
                      Total
                      <br />
                      Fee
                    </div>
                    <div
                      
          style={{
                        fontSize: "18px",
                        fontWeight: 800,
                        color: "#1D4ED8",
                      }}
                    >
                      0
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div
                
          style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "24px",
                }}
              >
                {/* Banner Placeholder (Green) */}
                <div
                  
          style={{
                    background: "#DCFCE7",
                    borderRadius: "24px",
                    padding: "24px",
                    border: "1px solid #BBF7D0",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                  <div
                    
          style={{
                      display: "inline-block",
                      background: "#16A34A",
                      color: "white",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      fontSize: "10px",
                      fontWeight: 800,
                      marginBottom: "12px",
                      alignSelf: "flex-start",
                    }}
                  >
                    Fitur Unggulan
                  </div>
                  <h3
                    
          style={{
                      fontSize: "20px",
                      color: "#166534",
                      marginBottom: "8px",
                      lineHeight: 1.3,
                    }}
                  >
                    Custom Nama QRIS Sesuai Nama Tokomu Sepuasnya!
                  </h3>
                  <p style={{ fontSize: "13px", fontFamily: "Plus Jakarta Sans", color: "#15803D" }}>
                    Gratis, Tanpa Batas, Tanpa Ribet.
                  </p>
                </div>

                {/* Quick Action */}
                <div className="card" style={{ padding: "24px" }}>
                  <h3 style={{ fontSize: "16px", marginBottom: "16px" }}>
                    Quick Action
                  </h3>
                  <div
                    
          style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    <div
                      onClick={() => setActiveMenu("buat-qris")}
                      
          style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "16px",
                        border: "1px solid var(--bdr)",
                        borderRadius: "12px",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.borderColor = "#1D4ED8")
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.borderColor = "var(--bdr)")
                      }
                    >
                      <div
                        
          style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          fontWeight: 700,
                        }}
                      >
                        <div
                          
          style={{
                            background: "#EFF6FF",
                            color: "#1D4ED8",
                            padding: "8px",
                            borderRadius: "8px",
                          }}
                        >
                          <Receipt size={18} />
                        </div>
                        Buat QRIS
                      </div>
                      <div style={{ color: "var(--txt3)" }}>{">"}</div>
                    </div>

                    <div
                      onClick={fetchData}
                      
          style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "16px",
                        border: "1px solid var(--bdr)",
                        borderRadius: "12px",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.borderColor = "#1D4ED8")
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.borderColor = "var(--bdr)")
                      }
                    >
                      <div
                        
          style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          fontWeight: 700,
                        }}
                      >
                        <div
                          
          style={{
                            background: "#FEF3C7",
                            color: "#D97706",
                            padding: "8px",
                            borderRadius: "8px",
                          }}
                        >
                          <Clock size={18} />
                        </div>
                        Refresh Data
                      </div>
                      <div style={{ color: "var(--txt3)" }}>{">"}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DASHBOARD (BUAT QRIS) */}
          {activeMenu === "buat-qris" && (
            <div
              
          style={{
                display: "flex",
                flexDirection: "column",
                gap: "24px",
                maxWidth: "1100px",
              }}
            >
              <div
                
          style={{
                  background: "var(--surf)",
                  borderRadius: "24px",
                  padding: "32px",
                  boxShadow: "var(--scard)",
                  border: "1px solid var(--bdr)",
                }}
              >
                <div
                  
          className="grid-1"
                    style={{
                    display: "grid",
                    gridTemplateColumns: "1.2fr 1fr",
                    gap: "40px",
                  }}
                >
                  {/* Kiri: Nominal & Cepat */}
                  <div>
                    <div
                      
          style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        background: "var(--surf2)",
                        padding: "12px 16px",
                        borderRadius: "12px",
                        marginBottom: "24px",
                        border: "1px solid var(--bdr)",
                      }}
                    >
                      <div
                        
          style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          background: "#E0E7FF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                        }}
                      >
                        {settings.profilePic ? (
                          <img
                            src={settings.profilePic}
                            
          style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <ShieldCheck size={16} color="#1D4ED8" />
                        )}
                      </div>
                      <div>
                        <div
                          
          style={{
                            fontSize: "13px", fontFamily: "Plus Jakarta Sans",
                            fontWeight: 700,
                            color: "var(--txt)",
                          }}
                        >
                          {settings.storeName}
                        </div>
                        <div
                          
          style={{
                            fontSize: "11px",
                            color: "#16A34A",
                            fontWeight: 700,
                          }}
                        >
                          Toko Aktif & Siap Menerima Pembayaran
                        </div>
                      </div>
                    </div>

                    <label
                      
          style={{
                        display: "block",
                        fontSize: "13px", fontFamily: "Plus Jakarta Sans",
                        fontWeight: 700,
                        color: "var(--txt3)",
                        letterSpacing: "0.05em",
                        marginBottom: "12px",
                      }}
                    >
                      NOMINAL TAGIHAN
                    </label>
                    <div style={{ position: "relative", marginBottom: "24px" }}>
                      <div
                        
          style={{
                          position: "absolute",
                          left: "20px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          fontSize: "28px",
                          fontWeight: 800,
                          color: "var(--txt3)",
                        }}
                      >
                        Rp
                      </div>
                      <input
                        type="number"
                        id="inputNominal"
                        placeholder="0"
                        
          style={{
                          width: "100%",
                          background: "var(--surf2)",
                          border: "2px solid var(--bdr)",
                          borderRadius: "16px",
                          fontSize: "36px",
                          fontWeight: 800,
                          color: "var(--txt)",
                          padding: "20px 20px 20px 70px",
                          outline: "none",
                          transition: "border 0.3s",
                        }}
                        onFocus={(e) =>
                          (e.target.style.borderColor = "#1D4ED8")
                        }
                        onBlur={(e) =>
                          (e.target.style.borderColor = "var(--bdr)")
                        }
                      />
                    </div>

                    <label
                      
          style={{
                        display: "block",
                        fontSize: "13px", fontFamily: "Plus Jakarta Sans",
                        fontWeight: 700,
                        color: "var(--txt3)",
                        letterSpacing: "0.05em",
                        marginBottom: "12px",
                      }}
                    >
                      NOMINAL CEPAT
                    </label>
                    <div
                      
          style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}
                    >
                      {[10000, 25000, 50000, 100000, 250000, 500000].map(
                        (val) => (
                          <button
                            key={val}
                            onClick={() => {
                              const el = document.getElementById(
                                "inputNominal",
                              ) as HTMLInputElement;
                              if (el) el.value = val.toString();
                            }}
                            
          style={{
                              padding: "8px 16px",
                              borderRadius: "20px",
                              border: "1px solid var(--bdr)",
                              background: "var(--surf2)",
                              color: "var(--txt)",
                              fontSize: "13px", fontFamily: "Plus Jakarta Sans",
                              fontWeight: 700,
                              cursor: "pointer",
                              transition: "all 0.2s",
                            }}
                            onMouseOver={(e) =>
                              (e.currentTarget.style.borderColor = "#1D4ED8")
                            }
                            onMouseOut={(e) =>
                              (e.currentTarget.style.borderColor = "var(--bdr)")
                            }
                          >
                            {formatRupiah(val).replace("Rp", "")}
                          </button>
                        ),
                      )}
                      <button
                        onClick={() => {
                          const el = document.getElementById(
                            "inputNominal",
                          ) as HTMLInputElement;
                          if (el) el.value = "";
                        }}
                        
          style={{
                          padding: "8px 16px",
                          borderRadius: "20px",
                          border: "1px solid var(--bdr)",
                          background: "#FEE2E2",
                          color: "#EF4444",
                          fontSize: "13px", fontFamily: "Plus Jakarta Sans",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                  {/* Kanan: Keterangan & Eksekusi */}
                  <div
                    
          style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "24px",
                    }}
                  >
                    <div>
                      <label
                        
          style={{
                          display: "block",
                          fontSize: "13px", fontFamily: "Plus Jakarta Sans",
                          fontWeight: 700,
                          color: "var(--txt3)",
                          letterSpacing: "0.05em",
                          marginBottom: "12px",
                        }}
                      >
                        KETERANGAN / PRODUK (OPSIONAL)
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Pembayaran Nasi Goreng Spesial"
                        
          style={{
                          width: "100%",
                          background: "var(--surf2)",
                          border: "1px solid var(--bdr)",
                          borderRadius: "12px",
                          fontSize: "14px",
                          color: "var(--txt)",
                          padding: "16px",
                          outline: "none",
                        }}
                      />
                    </div>

                    <div
                      
          style={{
                        background: "var(--surf2)",
                        padding: "20px",
                        borderRadius: "16px",
                        border: "1px dashed var(--bdr)",
                      }}
                    >
                      <div
                        
          style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "12px",
                          fontSize: "13px", fontFamily: "Plus Jakarta Sans",
                          color: "var(--txt3)",
                        }}
                      >
                        <span>Tipe Layanan:</span>
                        <span style={{ fontWeight: 700, color: "var(--txt)" }}>
                          Self-Hosted (Tanpa Potongan)
                        </span>
                      </div>
                      <div
                        
          style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "12px",
                          fontSize: "13px", fontFamily: "Plus Jakarta Sans",
                          color: "var(--txt3)",
                        }}
                      >
                        <span>Biaya Admin (Fee):</span>
                        <span style={{ fontWeight: 700, color: "#16A34A" }}>
                          0 (GRATIS)
                        </span>
                      </div>
                    </div>

                    <button
                      className="btn-primary"
                      
          style={{
                        width: "100%",
                        padding: "16px",
                        fontSize: "16px",
                        borderRadius: "16px",
                        justifyContent: "center",
                      }}
                      onClick={async () => {
                        const el = document.getElementById(
                          "inputNominal",
                        ) as HTMLInputElement;
                        const nominal = parseInt(el.value || "0");
                        if (nominal < 100) {
                          showNotification(
                            "NOMINAL TIDAK VALID",
                            "Minimal nominal adalah Rp 100",
                            "error",
                          );
                          return;
                        }

                        try {
                          const res = await fetch("/api/qris/create", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ nominal }),
                          });
                          const data = await res.json();
                          fetchData();
                          navigate("/trx/" + data.data.id);
                        } catch (e) {
                          showNotification(
                            "GAGAL DIBUAT",
                            "Gagal konek ke backend!",
                            "error",
                          );
                        }
                      }}
                    >
                      Buat Tagihan QRIS
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeMenu === "transactions" && (
            <div className="card card-large" style={{ flex: 1 }}>
              <div
                
          style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "24px",
                }}
              >
                <h3 style={{ fontSize: "18px" }}>Semua Riwayat Transaksi</h3>
                <div style={{ display: "flex", gap: "12px" }}>
                  <input
                    type="text"
                    placeholder="Cari ID Transaksi..."
                    
          style={{
                      padding: "8px 16px",
                      borderRadius: "8px",
                      border: "1px solid var(--bdr)",
                      background: "var(--surf2)",
                      color: "var(--txt)",
                    }}
                  />
                </div>
              </div>

              {transactions.length === 0 ? (
                <div
                  
          style={{
                    padding: "40px",
                    textAlign: "center",
                    color: "var(--txt3)",
                  }}
                >
                  Belum ada riwayat transaksi.
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>ID Transaksi</th>
                        <th>Waktu</th>
                        <th>Nominal Asli</th>
                        <th>Kode Unik</th>
                        <th>Total Bayar</th>
                        <th>Status</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((trx) => (
                        <tr key={trx.id}>
                          <td
                            className="font-mono"
                            
          style={{ fontWeight: 700, fontSize: "14px" }}
                          >
                            {trx.id}
                          </td>
                          <td style={{ fontSize: "14px" }}>{trx.time}</td>
                          <td
                            className="font-mono"
                            
          style={{ fontSize: "14px", fontWeight: 700 }}
                          >
                            {formatRupiah(trx.nominal)}
                          </td>
                          <td
                            className="font-mono"
                            
          style={{
                              color: "var(--acc)",
                              fontWeight: 700,
                              fontSize: "14px",
                            }}
                          >
                            +{trx.unique}
                          </td>
                          <td
                            className="font-mono"
                            
          style={{
                              fontWeight: 800,
                              fontSize: "15px",
                              color: "var(--acc)",
                            }}
                          >
                            {formatRupiah(trx.total)}
                          </td>
                          <td>
                            <span
                              className={`status-badge status-${trx.status}`}
                            >
                              {trx.status === "success"
                                ? "Lunas"
                                : trx.status === "pending"
                                  ? "Pending"
                                  : "Gagal"}
                            </span>
                          </td>
                          <td>
                            <Link
                              to={`/trx/${trx.id}`}
                              
          style={{
                                display: "inline-block",
                                padding: "6px 12px",
                                background: "var(--surf2)",
                                border: "1px solid var(--bdr)",
                                borderRadius: "8px",
                                color: "var(--txt)",
                                textDecoration: "none",
                                fontSize: "12px",
                                fontWeight: 700,
                              }}
                            >
                              Buka
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* STATISTIK PAGE */}
          {activeMenu === "statistik" && (
            <div
              
          style={{ display: "flex", flexDirection: "column", gap: "24px" }}
            >
              {/* Top Grid: Line Chart and Donut */}
              <div
                
          className="grid-1"
                  style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr",
                  gap: "24px",
                }}
              >
                {/* Line Chart */}
                <div className="card" style={{ padding: "24px" }}>
                  <div
                    
          style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "24px",
                    }}
                  >
                    <h3 style={{ fontSize: "18px" }}>Grafik Statistik</h3>
                    <div style={{ display: "flex", gap: "8px" }}>
                      {["7H", "30H", "90H"].map((v) => (
                        <button
                          key={v}
                          
          style={{
                            background: v === "7H" ? "#E2E8F0" : "transparent",
                            border: "1px solid #E2E8F0",
                            padding: "4px 12px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: 700,
                            color: "var(--txt)",
                            cursor: "pointer",
                          }}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ height: "300px" }}>
                    <Chart
                      chartType="AreaChart"
                      width="100%"
                      height="100%"
                      data={[
                        ["Hari", "Income"],
                        ["17 Agu", 0],
                        ["18 Agu", 0],
                        ["19 Agu", 0],
                        ["20 Agu", 0],
                        ["21 Agu", 0],
                        ["22 Agu", 0],
                        ["23 Agu", stats.income || 0],
                      ]}
                      options={{
                        legend: "none",
                        vAxis: {
                          textStyle: { color: isDarkMode ? "#94A3B8" : "#64748B" },
                          gridlines: { color: isDarkMode ? "#1E293B" : "#F1F5F9" },
                          format: "Rp #,###",
                        },
                        hAxis: {
                          textStyle: { color: isDarkMode ? "#94A3B8" : "#64748B" },
                          gridlines: { color: "transparent" },
                        },
                        colors: [isDarkMode ? "#60A5FA" : "#1D4ED8"],
                        areaOpacity: 0.1,
                        pointSize: 6,
                        crosshair: {
                          trigger: "both",
                          orientation: "vertical",
                          color: "#94A3B8",
                        },
                        tooltip: { trigger: "focus" },
                        chartArea: { width: "85%", height: "70%" },
                        backgroundColor: "transparent",
                        curveType: "function",
                      }}
                    />
                  </div>
                </div>

                {/* Donut Chart */}
                <div className="card" style={{ padding: "24px" }}>
                  <h3 style={{ fontSize: "18px", marginBottom: "24px" }}>
                    Ringkasan Status
                  </h3>
                  <div style={{ height: "180px", marginBottom: "24px" }}>
                    <Chart
                      chartType="PieChart"
                      width="100%"
                      height="100%"
                      data={
                        stats.success === 0 && stats.pending === 0 && (stats.failed || 0) === 0
                          ? [
                              ["Status", "Jumlah"],
                              ["Kosong", 1],
                            ]
                          : [
                              ["Status", "Jumlah"],
                              ["Sukses", stats.success],
                              ["Pending", stats.pending],
                              ["Gagal", stats.failed || 0],
                            ]
                      }
                      options={{
                        pieHole: 0.6,
                        legend: "none",
                        colors:
                          stats.success === 0 && stats.pending === 0 && (stats.failed || 0) === 0
                            ? ["#E20B3D"]
                            : ["#3B82F6", "#F59E0B", "#EF4444"],
                        pieSliceText: "none",
                        pieSliceBorderColor: "transparent",
                        chartArea: { width: "85%", height: "85%" },
                        tooltip: { isHtml: true },
                        backgroundColor: "transparent",
                        curveType: "function",
                      }}
                    />
                    {/* Trik: Jika semua 0, google chart akan kosong, tapi mari abaikan dulu */}
                  </div>
                  <div
                    
          style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    <div
                      
          style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div
                        
          style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontSize: "13px", fontFamily: "Plus Jakarta Sans",
                          color: "var(--txt)",
                          fontWeight: 700,
                        }}
                      >
                        <div
                          
          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: "#3B82F6",
                          }}
                        ></div>{" "}
                        Sukses
                      </div>
                      <div style={{ fontWeight: 800, fontSize: "14px" }}>
                        {stats.success}
                      </div>
                    </div>
                    <div
                      
          style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div
                        
          style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontSize: "13px", fontFamily: "Plus Jakarta Sans",
                          color: "var(--txt)",
                          fontWeight: 700,
                        }}
                      >
                        <div
                          
          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: "#F59E0B",
                          }}
                        ></div>{" "}
                        Pending
                      </div>
                      <div style={{ fontWeight: 800, fontSize: "14px" }}>
                        {stats.pending}
                      </div>
                    </div>
                    <div
                      
          style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div
                        
          style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontSize: "13px", fontFamily: "Plus Jakarta Sans",
                          color: "var(--txt)",
                          fontWeight: 700,
                        }}
                      >
                        <div
                          
          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: "#EF4444",
                          }}
                        ></div>{" "}
                        Gagal
                      </div>
                      <div style={{ fontWeight: 800, fontSize: "14px" }}>{stats.failed || 0}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Row Stats */}
              <div
                
          className="grid-2"
                  style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, 1fr)",
                  gap: "16px",
                }}
              >
                <div
                  className="card"
                  
          style={{ textAlign: "center", padding: "24px 16px" }}
                >
                  <div
                    
          style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "#64748B",
                      letterSpacing: "0.05em",
                      marginBottom: "8px",
                    }}
                  >
                    INCOME
                  </div>
                  <div
                    
          style={{
                      fontSize: "24px",
                      fontWeight: 800,
                      color: "#16A34A",
                      margin: "4px 0",
                      fontFamily: "Plus Jakarta Sans",
                    }}
                  >
                    {formatRupiah(stats.income)}
                  </div>
                  <div
                    
          style={{
                      fontSize: "11px",
                      color: "#94A3B8",
                      marginTop: "8px",
                    }}
                  >
                    30 hari
                  </div>
                </div>
                <div
                  className="card"
                  
          style={{ textAlign: "center", padding: "24px 16px" }}
                >
                  <div
                    
          style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "#64748B",
                      letterSpacing: "0.05em",
                      marginBottom: "8px",
                    }}
                  >
                    QRIS
                  </div>
                  <div
                    
          style={{
                      fontSize: "24px",
                      fontWeight: 800,
                      color: "#1D4ED8",
                      margin: "4px 0",
                      fontFamily: "Plus Jakarta Sans",
                    }}
                  >
                    {stats.success}
                  </div>
                  <div
                    
          style={{
                      fontSize: "11px",
                      color: "#94A3B8",
                      marginTop: "8px",
                    }}
                  >
                    Berhasil
                  </div>
                </div>
                <div
                  className="card"
                  
          style={{ textAlign: "center", padding: "24px 16px" }}
                >
                  <div
                    
          style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "#64748B",
                      letterSpacing: "0.05em",
                      marginBottom: "8px",
                    }}
                  >
                    PENDING
                  </div>
                  <div
                    
          style={{
                      fontSize: "24px",
                      fontWeight: 800,
                      color: "#F59E0B",
                      margin: "4px 0",
                      fontFamily: "Plus Jakarta Sans",
                    }}
                  >
                    {stats.pending}
                  </div>
                  <div
                    
          style={{
                      fontSize: "11px",
                      color: "#94A3B8",
                      marginTop: "8px",
                    }}
                  >
                    Tertunda
                  </div>
                </div>
                <div
                  className="card"
                  
          style={{ textAlign: "center", padding: "24px 16px" }}
                >
                  <div
                    
          style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "#64748B",
                      letterSpacing: "0.05em",
                      marginBottom: "8px",
                    }}
                  >
                    GAGAL
                  </div>
                  <div
                    
          style={{
                      fontSize: "24px",
                      fontWeight: 800,
                      color: "#EF4444",
                      margin: "4px 0",
                      fontFamily: "Plus Jakarta Sans",
                    }}
                  >
                    {stats.failed || 0}
                  </div>
                  <div
                    
          style={{
                      fontSize: "11px",
                      color: "#94A3B8",
                      marginTop: "8px",
                    }}
                  >
                    Kadaluarsa
                  </div>
                </div>
                <div
                  className="card"
                  
          style={{ textAlign: "center", padding: "24px 16px" }}
                >
                  <div
                    
          style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "#64748B",
                      letterSpacing: "0.05em",
                      marginBottom: "8px",
                    }}
                  >
                    FEE
                  </div>
                  <div
                    
          style={{
                      fontSize: "24px",
                      fontWeight: 800,
                      color: "var(--txt)",
                      margin: "4px 0",
                      fontFamily: "Plus Jakarta Sans",
                    }}
                  >
                    0
                  </div>
                  <div
                    
          style={{
                      fontSize: "11px",
                      color: "#94A3B8",
                      marginTop: "8px",
                    }}
                  >
                    Biaya
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* WEBHOOK LOGS PAGE */}
          {activeMenu === "webhook" && (
            <div className="card card-large" style={{ flex: 1 }}>
              <h3 style={{ marginBottom: "24px", fontSize: "18px" }}>
                Log Notifikasi Android (Real-time)
              </h3>
              <div
                
          style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                {logs.length === 0 ? (
                  <div
                    
          style={{
                      color: "var(--txt3)",
                      padding: "20px",
                      textAlign: "center",
                    }}
                  >
                    Log kosong. Menunggu webhook...
                  </div>
                ) : null}
                {logs.map((log, i) => (
                  <div
                    key={i}
                    
          style={{
                      padding: "16px",
                      borderRadius: "12px",
                      background: "var(--surf2)",
                      border: "1px solid var(--bdr)",
                    }}
                  >
                    <div
                      
          style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "12px",
                      }}
                    >
                      <span style={{ fontSize: "14px", color: "var(--txt3)" }}>
                        <Clock
                          size={14}
                          
          style={{
                            display: "inline",
                            marginRight: "4px",
                            verticalAlign: "-2px",
                          }}
                        />{" "}
                        {log.time}
                      </span>
                      <span
                        
          style={{
                          fontSize: "13px", fontFamily: "Plus Jakarta Sans",
                          color: "#16A34A",
                          fontWeight: 700,
                        }}
                      >
                        200 OK
                      </span>
                    </div>
                    <pre
                      className="font-mono"
                      
          style={{
                        background: "var(--surf)",
                        color: "var(--txt)",
                        border: "1px solid var(--bdr)",
                        padding: "16px",
                        borderRadius: "8px",
                        fontSize: "13px", fontFamily: "Plus Jakarta Sans",
                        overflowX: "auto",
                        margin: 0,
                      }}
                    >
                      {JSON.stringify(log.payload, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* API DOCS PAGE */}
          {activeMenu === "api-docs" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

              {/* ==================== OVERVIEW ==================== */}
              <div className="card">
                <h2 style={{ fontSize: "20px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Code size={20} color="#1D4ED8" /> Dokumentasi QRISGate
                </h2>
                <p style={{ color: "var(--txt3)", fontSize: "13px", fontFamily: "Plus Jakarta Sans", marginBottom: "24px" }}>Versi 1.0 — Terakhir diperbarui Agustus 2026</p>

                <div style={{ background: "linear-gradient(135deg, #EFF6FF, #DBEAFE)", padding: "24px", borderRadius: "16px", border: "1px solid #BFDBFE", marginBottom: "24px" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#1E40AF", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <ShieldCheck size={18} /> Apa itu QRISGate?
                  </h3>
                  <p style={{ color: "#1E3A5F", lineHeight: 1.8, fontSize: "14px", marginBottom: "16px" }}>
                    QRISGate adalah <b>Self-Hosted Payment Gateway</b> gratis yang memanfaatkan <b>QRIS Statis</b> dari GoPay Merchant Anda, lalu mengubahnya menjadi <b>QRIS Dinamis</b> dengan kode unik agar setiap transaksi dapat dilacak secara otomatis. Sistem ini bekerja dengan bantuan aplikasi <b>MacroDroid</b> di HP Android Anda sebagai "pendeteksi" notifikasi pembayaran masuk.
                  </p>
                  <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                    <div style={{ background: "white", padding: "16px", borderRadius: "12px", textAlign: "center" }}>
                      <div style={{ fontSize: "24px", marginBottom: "4px" }}>📱</div>
                      <div style={{ fontSize: "12px", fontWeight: 700, color: "#1E40AF" }}>HP Android</div>
                      <div style={{ fontSize: "11px", color: "#64748B" }}>Mendeteksi notifikasi GoPay via MacroDroid</div>
                    </div>
                    <div style={{ background: "white", padding: "16px", borderRadius: "12px", textAlign: "center" }}>
                      <div style={{ fontSize: "24px", marginBottom: "4px" }}>⚡</div>
                      <div style={{ fontSize: "12px", fontWeight: 700, color: "#1E40AF" }}>Backend Server</div>
                      <div style={{ fontSize: "11px", color: "#64748B" }}>Menerima webhook & mencocokkan transaksi</div>
                    </div>
                    <div style={{ background: "white", padding: "16px", borderRadius: "12px", textAlign: "center" }}>
                      <div style={{ fontSize: "24px", marginBottom: "4px" }}>🖥️</div>
                      <div style={{ fontSize: "12px", fontWeight: 700, color: "#1E40AF" }}>Dashboard</div>
                      <div style={{ fontSize: "11px", color: "#64748B" }}>Monitoring real-time & buat tagihan</div>
                    </div>
                  </div>
                </div>

                {/* Arsitektur Flow */}
                <div style={{ background: "var(--surf2)", padding: "24px", borderRadius: "12px", border: "1px solid var(--bdr)" }}>
                  <h4 style={{ fontWeight: 700, marginBottom: "16px", color: "var(--txt)" }}>🔄 Alur Kerja Sistem</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {[
                      { step: "1", icon: "🛒", title: "Pelanggan scan QRIS", desc: "Pelanggan membuka halaman invoice & scan QR Code dinamis yang berisi nominal + kode unik." },
                      { step: "2", icon: "💸", title: "Pelanggan membayar", desc: "Pelanggan menyelesaikan pembayaran via GoPay, OVO, Dana, atau e-wallet lainnya." },
                      { step: "3", icon: "🔔", title: "Notifikasi masuk ke HP", desc: "HP Android Anda menerima notifikasi \"Pembayaran diterima Rp 50.213\" dari GoPay." },
                      { step: "4", icon: "🤖", title: "MacroDroid menangkap", desc: "MacroDroid membaca notifikasi tersebut & mengirim HTTP POST ke /api/webhook." },
                      { step: "5", icon: "✅", title: "Transaksi otomatis lunas", desc: "Backend mencocokkan angka unik & menandai transaksi sebagai BERHASIL secara real-time." }
                    ].map((item) => (
                      <div key={item.step} style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                        <div style={{ background: "#EFF6FF", color: "#1D4ED8", fontWeight: 800, width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "13px" }}>{item.step}</div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--txt)", display: "flex", alignItems: "center", gap: "6px" }}>{item.icon} {item.title}</div>
                          <div style={{ fontSize: "13px", fontFamily: "Plus Jakarta Sans", color: "var(--txt3)", marginTop: "2px" }}>{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ==================== SETUP GUIDE ==================== */}
              <div className="card">
                <h2 style={{ fontSize: "18px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Settings size={20} color="#16A34A" /> Panduan Setup dari Nol
                </h2>

                {/* Step 1: Persiapan */}
                <div style={{ background: "#F0FDF4", padding: "20px", borderRadius: "12px", border: "1px solid #BBF7D0", marginBottom: "16px" }}>
                  <h3 style={{ fontSize: "15px", fontWeight: 800, color: "#16A34A", marginBottom: "12px" }}>📋 Langkah 1 — Persiapan</h3>
                  <div style={{ fontSize: "14px", color: "#14532D", lineHeight: 1.8 }}>
                    <p style={{ marginBottom: "8px" }}>Pastikan Anda sudah memiliki:</p>
                    <ul style={{ paddingLeft: "20px", margin: 0 }}>
                      <li><b>Akun GoPay Merchant</b> — Daftar di <span style={{ fontFamily: "monospace", background: "#DCFCE7", padding: "2px 6px", borderRadius: "4px" }}>gobiz.co.id</span> lalu cetak/unduh <b>QRIS Statis</b> Anda.</li>
                      <li style={{ marginTop: "4px" }}><b>1 HP Android</b> — Yang akan selalu menyala & terhubung internet (bisa HP bekas). Ini berfungsi sebagai "sensor" yang mendeteksi notifikasi pembayaran.</li>
                      <li style={{ marginTop: "4px" }}><b>Server / VPS</b> — Bisa pakai layanan gratis seperti Railway, Render, atau VPS murah. Backend & Dashboard akan berjalan di sini.</li>
                      <li style={{ marginTop: "4px" }}><b>Database Supabase</b> — Buat project gratis di <span style={{ fontFamily: "monospace", background: "#DCFCE7", padding: "2px 6px", borderRadius: "4px" }}>supabase.com</span> untuk menyimpan data transaksi.</li>
                    </ul>
                  </div>
                </div>

                {/* Step 2: Deploy */}
                <div style={{ background: "#FFF7ED", padding: "20px", borderRadius: "12px", border: "1px solid #FED7AA", marginBottom: "16px" }}>
                  <h3 style={{ fontSize: "15px", fontWeight: 800, color: "#EA580C", marginBottom: "12px" }}>🚀 Langkah 2 — Deploy Backend & Dashboard</h3>
                  <div style={{ fontSize: "14px", color: "#431407", lineHeight: 1.8 }}>
                    <p style={{ marginBottom: "8px" }}>Clone repository dan atur environment variable:</p>
                    <pre style={{ background: "#0F172A", color: "#E2E8F0", padding: "16px", borderRadius: "8px", overflowX: "auto", fontSize: "12px", lineHeight: 1.6 }}>
{`# 1. Clone repository
git clone https://github.com/yourrepo/qrisgate.git
cd qrisgate

# 2. Install dependencies
cd qris-backend && npm install
cd ../qris-dashboard && npm install

# 3. Set environment variable di server.js
# Edit STATIC_QRIS_MERCHANT dengan string QRIS statis GoPay Anda
# Edit connection string PostgreSQL ke Supabase Anda

# 4. Jalankan backend
cd qris-backend && node server.js

# 5. Build & jalankan dashboard
cd qris-dashboard && npm run build && npx serve dist`}
                    </pre>
                  </div>
                </div>

                {/* Step 3: Setup Tabel Database */}
                <div style={{ background: "#F5F3FF", padding: "20px", borderRadius: "12px", border: "1px solid #DDD6FE", marginBottom: "16px" }}>
                  <h3 style={{ fontSize: "15px", fontWeight: 800, color: "#7C3AED", marginBottom: "12px" }}>🗄️ Langkah 3 — Setup Database Supabase</h3>
                  <div style={{ fontSize: "14px", color: "#1E1B4B", lineHeight: 1.8 }}>
                    <p style={{ marginBottom: "8px" }}>Jalankan SQL berikut di Supabase SQL Editor:</p>
                    <pre style={{ background: "#0F172A", color: "#E2E8F0", padding: "16px", borderRadius: "8px", overflowX: "auto", fontSize: "12px", lineHeight: 1.6 }}>
{`-- Tabel settings
CREATE TABLE settings (
  id SERIAL PRIMARY KEY,
  store_name TEXT DEFAULT 'Toko Saya',
  profile_pic TEXT DEFAULT '',
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  password TEXT DEFAULT '',
  sandbox_mode BOOLEAN DEFAULT false
);
INSERT INTO settings (id) VALUES (1);

-- Tabel transactions
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  time TEXT,
  nominal INT,
  unique_code INT,
  total INT,
  status TEXT DEFAULT 'pending',
  qris_string TEXT,
  is_sandbox BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabel logs
CREATE TABLE logs (
  id SERIAL PRIMARY KEY,
  time TEXT,
  payload JSONB,
  is_sandbox BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);`}
                    </pre>
                  </div>
                </div>

                {/* Step 4: MacroDroid */}
                <div style={{ background: "#FEF2F2", padding: "20px", borderRadius: "12px", border: "1px solid #FECACA", marginBottom: "16px" }}>
                  <h3 style={{ fontSize: "15px", fontWeight: 800, color: "#DC2626", marginBottom: "12px" }}>📱 Langkah 4 — Setup MacroDroid di HP Android</h3>
                  <div style={{ fontSize: "14px", color: "#450A0A", lineHeight: 1.8 }}>

                    <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
                      <a href="https://play.google.com/store/apps/details?id=com.arlosoft.macrodroid" target="_blank" rel="noreferrer" style={{ flex: 1, background: "white", border: "1px solid #FECACA", padding: "16px", borderRadius: "12px", textAlign: "center", textDecoration: "none", color: "#DC2626" }}>
                        <div style={{ fontSize: "28px", marginBottom: "6px" }}>▶️</div>
                        <div style={{ fontWeight: 700, fontSize: "13px" }}>Download MacroDroid</div>
                        <div style={{ fontSize: "11px", color: "#991B1B", marginTop: "2px" }}>Google Play Store</div>
                      </a>
                      <a href="https://macrodroid.com/download" target="_blank" rel="noreferrer" style={{ flex: 1, background: "white", border: "1px solid #FECACA", padding: "16px", borderRadius: "12px", textAlign: "center", textDecoration: "none", color: "#DC2626" }}>
                        <div style={{ fontSize: "28px", marginBottom: "6px" }}>📦</div>
                        <div style={{ fontWeight: 700, fontSize: "13px" }}>Download APK</div>
                        <div style={{ fontSize: "11px", color: "#991B1B", marginTop: "2px" }}>macrodroid.com (langsung)</div>
                      </a>
                    </div>

                    <p style={{ fontWeight: 700, marginBottom: "8px" }}>Konfigurasi Macro:</p>
                    <div style={{ background: "white", padding: "16px", borderRadius: "8px", marginBottom: "12px" }}>
                      <p style={{ fontWeight: 700, color: "#DC2626", fontSize: "12px", marginBottom: "6px" }}>🔹 TRIGGER (Pemicu)</p>
                      <ul style={{ paddingLeft: "16px", margin: 0, fontSize: "13px" }}>
                        <li>Pilih <b>Notification Received</b></li>
                        <li>Application: <b>GoPay / GoBiz</b></li>
                        <li>Content: <b>Contains text "diterima"</b> (atau sesuai bahasa notifikasi)</li>
                      </ul>
                    </div>
                    <div style={{ background: "white", padding: "16px", borderRadius: "8px", marginBottom: "12px" }}>
                      <p style={{ fontWeight: 700, color: "#DC2626", fontSize: "12px", marginBottom: "6px" }}>🔹 ACTION (Aksi)</p>
                      <ul style={{ paddingLeft: "16px", margin: 0, fontSize: "13px" }}>
                        <li>Pilih <b>HTTP Request</b></li>
                        <li>URL: <span style={{ fontFamily: "monospace", background: "#FEE2E2", padding: "2px 6px", borderRadius: "4px" }}>https://domain-anda.com/api/webhook</span></li>
                        <li>Method: <b>POST</b></li>
                        <li>Content-Type: <b>application/json</b></li>
                        <li>Body: lihat contoh JSON di bawah</li>
                      </ul>
                    </div>
                    <pre style={{ background: "#0F172A", color: "#E2E8F0", padding: "16px", borderRadius: "8px", overflowX: "auto", fontSize: "12px", lineHeight: 1.6 }}>
{`// Body HTTP Request MacroDroid
{
  "title": "[notification_title]",
  "text": "[notification_text]",
  "nominal": "[notification_text]"
}

// [notification_title] & [notification_text]
// adalah variabel bawaan MacroDroid yang akan
// otomatis terisi oleh isi notifikasi HP Anda.`}
                    </pre>
                  </div>
                </div>

                {/* Step 5: Penting */}
                <div style={{ background: "#FFFBEB", padding: "20px", borderRadius: "12px", border: "1px solid #FDE68A" }}>
                  <h3 style={{ fontSize: "15px", fontWeight: 800, color: "#D97706", marginBottom: "12px" }}>⚠️ Langkah 5 — Pengaturan Penting di HP Android</h3>
                  <div style={{ fontSize: "14px", color: "#451A03", lineHeight: 1.8 }}>
                    <p style={{ marginBottom: "8px" }}>Agar MacroDroid selalu berjalan di latar belakang:</p>
                    <ul style={{ paddingLeft: "20px", margin: 0 }}>
                      <li><b>Matikan Battery Optimization</b> untuk MacroDroid & GoPay di Settings &gt; Battery.</li>
                      <li style={{ marginTop: "4px" }}><b>Kunci aplikasi</b> agar tidak ter-kill: tahan MacroDroid di recent apps, klik ikon gembok (🔒).</li>
                      <li style={{ marginTop: "4px" }}><b>Aktifkan Auto-Start</b> MacroDroid di pengaturan HP (terutama Xiaomi/OPPO/Realme).</li>
                      <li style={{ marginTop: "4px" }}><b>Pastikan notifikasi GoPay aktif</b> dan tidak dalam mode Do Not Disturb.</li>
                      <li style={{ marginTop: "4px" }}><b>Gunakan Mode Sandbox</b> terlebih dahulu untuk uji coba sebelum production!</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* ==================== API REFERENCE ==================== */}
              <div className="card">
                <h2 style={{ fontSize: "18px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Code size={20} color="#8B5CF6" /> API Reference
                </h2>

                {/* POST /api/qris/create */}
                <div style={{ background: "var(--surf2)", padding: "24px", borderRadius: "12px", border: "1px solid var(--bdr)", marginBottom: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                    <span style={{ background: "#16A34A", color: "white", padding: "4px 12px", borderRadius: "8px", fontWeight: 700, fontSize: "14px" }}>POST</span>
                    <span style={{ fontSize: "16px", fontWeight: 700, fontFamily: "monospace" }}>/api/qris/create</span>
                  </div>
                  <p style={{ color: "var(--txt2)", marginBottom: "16px", fontSize: "14px" }}>
                    Membuat tagihan QRIS dinamis baru. Sistem akan otomatis menambahkan kode unik (1-999) ke nominal agar setiap transaksi bisa dicocokkan secara otomatis.
                  </p>
                  <h4 style={{ marginBottom: "8px", color: "var(--txt)", fontSize: "13px" }}>📤 Request Body</h4>
                  <pre style={{ background: "#0F172A", color: "#E2E8F0", padding: "16px", borderRadius: "8px", overflowX: "auto", fontSize: "12px", marginBottom: "16px" }}>
{`POST /api/qris/create
Content-Type: application/json

{
  "nominal": 50000    // Harga asli dalam Rupiah (tanpa kode unik)
}`}
                  </pre>
                  <h4 style={{ marginBottom: "8px", color: "var(--txt)", fontSize: "13px" }}>📥 Response</h4>
                  <pre style={{ background: "#0F172A", color: "#E2E8F0", padding: "16px", borderRadius: "8px", overflowX: "auto", fontSize: "12px" }}>
{`{
  "success": true,
  "message": "Tagihan dibuat",
  "data": {
    "id": "TRX-123456",       // ID unik transaksi
    "time": "14.30.00",       // Waktu pembuatan
    "nominal": 50000,         // Harga asli
    "unique": 213,            // Kode unik (random)
    "total": 50213,           // Nominal + kode unik (yang dibayar)
    "status": "pending",      // Status awal
    "qris_string": "000201..."// String QRIS dinamis (untuk di-render jadi QR)
  }
}`}
                  </pre>
                </div>

                {/* POST /api/webhook */}
                <div style={{ background: "var(--surf2)", padding: "24px", borderRadius: "12px", border: "1px solid var(--bdr)", marginBottom: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                    <span style={{ background: "#16A34A", color: "white", padding: "4px 12px", borderRadius: "8px", fontWeight: 700, fontSize: "14px" }}>POST</span>
                    <span style={{ fontSize: "16px", fontWeight: 700, fontFamily: "monospace" }}>/api/webhook</span>
                  </div>
                  <p style={{ color: "var(--txt2)", marginBottom: "16px", fontSize: "14px" }}>
                    Endpoint untuk menerima notifikasi pembayaran dari MacroDroid. Sistem akan mencocokkan nominal yang diterima dengan transaksi pending yang ada.
                  </p>
                  <h4 style={{ marginBottom: "8px", color: "var(--txt)", fontSize: "13px" }}>📤 Request Body</h4>
                  <pre style={{ background: "#0F172A", color: "#E2E8F0", padding: "16px", borderRadius: "8px", overflowX: "auto", fontSize: "12px", marginBottom: "16px" }}>
{`POST /api/webhook
Content-Type: application/json

{
  "title": "Pembayaran diterima",
  "text": "Pembayaran Rp 50.213 diterima dari ...",
  "nominal": "50213"
}`}
                  </pre>
                  <h4 style={{ marginBottom: "8px", color: "var(--txt)", fontSize: "13px" }}>📥 Response (Cocok)</h4>
                  <pre style={{ background: "#0F172A", color: "#E2E8F0", padding: "16px", borderRadius: "8px", overflowX: "auto", fontSize: "12px", marginBottom: "12px" }}>
{`{
  "success": true,
  "message": "Transaksi berhasil diupdate (Lunas)."
}`}
                  </pre>
                  <h4 style={{ marginBottom: "8px", color: "var(--txt)", fontSize: "13px" }}>📥 Response (Tidak Cocok)</h4>
                  <pre style={{ background: "#0F172A", color: "#E2E8F0", padding: "16px", borderRadius: "8px", overflowX: "auto", fontSize: "12px" }}>
{`{
  "success": false,
  "message": "Tidak ada transaksi pending yang cocok."
}`}
                  </pre>
                </div>

                {/* GET /api/dashboard */}
                <div style={{ background: "var(--surf2)", padding: "24px", borderRadius: "12px", border: "1px solid var(--bdr)", marginBottom: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                    <span style={{ background: "#1D4ED8", color: "white", padding: "4px 12px", borderRadius: "8px", fontWeight: 700, fontSize: "14px" }}>GET</span>
                    <span style={{ fontSize: "16px", fontWeight: 700, fontFamily: "monospace" }}>/api/dashboard</span>
                  </div>
                  <p style={{ color: "var(--txt2)", marginBottom: "16px", fontSize: "14px" }}>
                    Mengambil seluruh data dashboard: statistik, daftar transaksi, log webhook, dan pengaturan. Data yang dikembalikan sudah difilter berdasarkan mode saat ini (Sandbox / Production).
                  </p>
                  <h4 style={{ marginBottom: "8px", color: "var(--txt)", fontSize: "13px" }}>📥 Response</h4>
                  <pre style={{ background: "#0F172A", color: "#E2E8F0", padding: "16px", borderRadius: "8px", overflowX: "auto", fontSize: "12px" }}>
{`{
  "stats": {
    "income": 150000,    // Total pemasukan (transaksi sukses)
    "success": 3,        // Jumlah transaksi sukses
    "pending": 1         // Jumlah transaksi pending
  },
  "transactions": [ ... ],
  "logs": [ ... ],
  "settings": {
    "storeName": "SanzOfficiallID",
    "profilePic": "data:image/...",
    "email": "admin@sanz.com",
    "sandboxMode": false
  }
}`}
                  </pre>
                </div>

                {/* POST /api/settings */}
                <div style={{ background: "var(--surf2)", padding: "24px", borderRadius: "12px", border: "1px solid var(--bdr)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                    <span style={{ background: "#D97706", color: "white", padding: "4px 12px", borderRadius: "8px", fontWeight: 700, fontSize: "14px" }}>POST</span>
                    <span style={{ fontSize: "16px", fontWeight: 700, fontFamily: "monospace" }}>/api/settings</span>
                  </div>
                  <p style={{ color: "var(--txt2)", marginBottom: "16px", fontSize: "14px" }}>
                    Memperbarui pengaturan toko. Kirim hanya field yang ingin diubah (partial update).
                  </p>
                  <pre style={{ background: "#0F172A", color: "#E2E8F0", padding: "16px", borderRadius: "8px", overflowX: "auto", fontSize: "12px" }}>
{`POST /api/settings
Content-Type: application/json

// Contoh: hanya ubah nama toko & email
{
  "storeName": "Toko Baru Saya",
  "email": "baru@email.com"
}

// Field yang tersedia:
// storeName, profilePic, email, phone, password, sandboxMode`}
                  </pre>
                </div>
              </div>

              {/* ==================== FAQ ==================== */}
              <div className="card">
                <h2 style={{ fontSize: "18px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <AlertTriangle size={20} color="#D97706" /> FAQ & Troubleshooting
                </h2>

                {[
                  { q: "Transaksi tidak otomatis berubah jadi \"Lunas\"?", a: "Pastikan MacroDroid berjalan di latar belakang, baterai tidak dioptimasi, dan URL webhook sudah benar. Cek tab \"Log Webhook\" untuk memastikan data masuk." },
                  { q: "Apakah bisa pakai selain GoPay?", a: "Bisa! Selama e-wallet/bank mengirim notifikasi ke HP Android Anda yang berisi nominal, MacroDroid bisa menangkapnya. Atur trigger di MacroDroid sesuai nama aplikasi yang digunakan." },
                  { q: "Apa bedanya Mode Sandbox dan Production?", a: "Mode Sandbox menggunakan database terpisah (dummy) untuk testing. Semua transaksi yang dibuat saat Sandbox aktif tidak akan tercampur dengan data asli Anda." },
                  { q: "Apakah aman? Data saya tersimpan di mana?", a: "Sangat aman. Semua data tersimpan di database Supabase Anda sendiri (self-hosted). Tidak ada pihak ketiga yang memiliki akses ke data transaksi Anda." },
                  { q: "HP Android harus selalu menyala?", a: "Ya, HP Android berfungsi sebagai \"sensor\" notifikasi. Jika HP mati atau tidak ada internet, sistem tidak bisa mendeteksi pembayaran masuk. Disarankan menggunakan HP bekas yang di-charge terus." },
                  { q: "Berapa biaya / fee per transaksi?", a: "0 — GRATIS! Karena sistem ini self-hosted, tidak ada biaya per transaksi. Anda hanya membayar biaya server/VPS (yang juga bisa gratis)." },
                ].map((item, i) => (
                  <div key={i} style={{ padding: "16px", border: "1px solid var(--bdr)", borderRadius: "12px", marginBottom: i < 5 ? "12px" : "0" }}>
                    <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--txt)", marginBottom: "8px" }}>❓ {item.q}</div>
                    <div style={{ fontSize: "13px", fontFamily: "Plus Jakarta Sans", color: "var(--txt3)", lineHeight: 1.7 }}>{item.a}</div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* SETTINGS PAGE (PROFIL SAYA) */}
          {activeMenu === "settings" && (
            <div style={{ maxWidth: "1000px" }}>
              <h1
                
          style={{
                  fontSize: "24px",
                  fontWeight: 800,
                  marginBottom: "32px",
                }}
              >
                Profil Saya
              </h1>

              <div className="grid-1"
                
          style={{
                  display: "grid",
                  gridTemplateColumns: "320px 1fr",
                  gap: "24px",
                }}
              >
                {/* Kolom Kiri */}
                <div
                  
          style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  {/* Kartu Profil */}
                  <div
                    
          style={{
                      background: "var(--surf2)",
                      borderRadius: "16px",
                      overflow: "hidden",
                      boxShadow: "var(--scard)",
                      border: "1px solid var(--bdr)",
                      position: "relative",
                    }}
                  >
                    <div
                      
          style={{
                        height: "100px",
                        background: "linear-gradient(90deg, #1D4ED8, #1D4ED8)",
                      }}
                    ></div>
                    <div
                      
          style={{
                        padding: "0 24px 24px",
                        textAlign: "center",
                        position: "relative",
                        marginTop: "-40px",
                      }}
                    >
                      <div
                        
          style={{
                          width: "80px",
                          height: "80px",
                          borderRadius: "50%",
                          background: "white",
                          border: "4px solid white",
                          margin: "0 auto 12px",
                          overflow: "hidden",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        }}
                      >
                        {settings.profilePic ? (
                          <img
                            src={settings.profilePic}
                            
          style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <ShieldCheck size={32} color="#1D4ED8" />
                        )}
                      </div>
                      <div
                        
          style={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <h3
                          
          style={{
                            fontSize: "18px",
                            fontWeight: 800,
                            margin: 0,
                            color: "var(--txt)",
                          }}
                        >
                          {settings.storeName}
                        </h3>
                        <span
                          
          style={{
                            fontSize: "10px",
                            background: "#E0E7FF",
                            color: "#4338CA",
                            padding: "2px 8px",
                            borderRadius: "12px",
                            fontWeight: 700,
                          }}
                        >
                          User
                        </span>
                      </div>
                      <div
                        
          style={{
                          color: "var(--txt3)",
                          fontSize: "13px", fontFamily: "Plus Jakarta Sans",
                          marginTop: "4px",
                        }}
                      >
                        @SanzCEO
                      </div>
                    </div>
                  </div>

                  {/* Kartu Saldo */}
                  <div
                    
          style={{
                      background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
                      borderRadius: "16px",
                      padding: "24px",
                      color: "white",
                      position: "relative",
                      overflow: "hidden",
                      boxShadow: "0 4px 12px rgba(37,99,235,0.2)",
                    }}
                  >
                    <div
                      
          style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        letterSpacing: "0.05em",
                        opacity: 0.9,
                        marginBottom: "8px",
                      }}
                    >
                      TOTAL PEMASUKAN
                    </div>
                    <div
                      
          style={{
                        fontSize: "28px",
                        fontWeight: 800,
                        fontFamily: "Plus Jakarta Sans",
                      }}
                    >
                      {formatRupiah(stats.income)}
                    </div>
                    <div
                      
          style={{
                        position: "absolute",
                        right: "20px",
                        bottom: "20px",
                        background: "rgba(255,255,255,0.2)",
                        width: "40px",
                        height: "40px",
                        borderRadius: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Receipt size={20} />
                    </div>
                  </div>

                  {/* Info Tambahan */}
                  <div
                    
          className="grid-1"
                      style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "16px",
                    }}
                  >
                    <div
                      
          style={{
                        background: "var(--surf2)",
                        borderRadius: "12px",
                        padding: "16px",
                        border: "1px solid var(--bdr)",
                      }}
                    >
                      <div
                        
          style={{
                          fontSize: "11px",
                          color: "var(--txt3)",
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          marginBottom: "8px",
                        }}
                      >
                        <Clock size={12} /> BERGABUNG
                      </div>
                      <div
                        
          style={{
                          fontSize: "13px", fontFamily: "Plus Jakarta Sans",
                          fontWeight: 700,
                          color: "var(--txt)",
                        }}
                      >
                        22 Agu 2026
                        <br />
                        16.08
                      </div>
                    </div>
                    <div
                      
          style={{
                        background: "var(--surf2)",
                        borderRadius: "12px",
                        padding: "16px",
                        border: "1px solid var(--bdr)",
                      }}
                    >
                      <div
                        
          style={{
                          fontSize: "11px",
                          color: "var(--txt3)",
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          marginBottom: "8px",
                        }}
                      >
                        <Clock size={12} /> LOGIN TERAKHIR
                      </div>
                      <div
                        
          style={{
                          fontSize: "13px", fontFamily: "Plus Jakarta Sans",
                          fontWeight: 700,
                          color: "var(--txt)",
                        }}
                      >
                        22 Agu 2026
                        <br />
                        16.31
                      </div>
                    </div>
                  </div>
                </div>

                {/* Kolom Kanan */}
                <div
                  
          style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "24px",
                  }}
                >
                  <div>
                    <div
                      
          style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "var(--txt3)",
                        marginBottom: "12px",
                        letterSpacing: "0.05em",
                      }}
                    >
                      DATA PROFIL & AKUN
                    </div>
                    <div
                      
          style={{
                        background: "var(--surf2)",
                        borderRadius: "16px",
                        padding: "24px",
                        border: "1px solid var(--bdr)",
                        boxShadow: "var(--scard)",
                      }}
                    >
                      <div
                        
          style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "24px",
                        }}
                      >
                        <div
                          
          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontWeight: 700,
                            fontSize: "16px",
                            color: "var(--txt)",
                          }}
                        >
                          <Settings size={18} /> Pengaturan Akun
                        </div>
                        {!isEditingProfile && (
                          <button
                            onClick={() => setIsEditingProfile(true)}
                            
          style={{
                              border: "1px solid var(--bdr)",
                              background: "var(--surf)",
                              padding: "6px 12px",
                              borderRadius: "8px",
                              fontSize: "12px",
                              fontWeight: 700,
                              color: "var(--txt)",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              cursor: "pointer",
                            }}
                          >
                            <Settings size={12} /> Edit Profil
                          </button>
                        )}
                      </div>

                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <div
                          
          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            padding: "16px 0",
                            borderBottom: "1px solid var(--bdr)",
                          }}
                        >
                          <span
                            
          style={{ color: "var(--txt3)", fontSize: "14px" }}
                          >
                            Username
                          </span>
                          <span
                            
          style={{
                              fontWeight: 700,
                              fontSize: "14px",
                              color: "var(--txt)",
                            }}
                          >
                            SanzCEO
                          </span>
                        </div>

                        <div
                          
          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "16px 0",
                            borderBottom: "1px solid var(--bdr)",
                          }}
                        >
                          <span
                            
          style={{ color: "var(--txt3)", fontSize: "14px" }}
                          >
                            Nama UMKM / Toko
                          </span>
                          {isEditingProfile ? (
                            <input
                              type="text"
                              value={settings.storeName}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  storeName: e.target.value,
                                })
                              }
                              
          style={{
                                textAlign: "right",
                                fontWeight: 700,
                                fontSize: "14px",
                                border: "1px solid var(--bdr)",
                                padding: "6px 12px",
                                borderRadius: "6px",
                                background: "var(--surf)",
                                outline: "none",
                                color: "var(--txt)",
                                width: "50%",
                              }}
                              autoFocus
                            />
                          ) : (
                            <span
                              
          style={{
                                fontWeight: 700,
                                fontSize: "14px",
                                color: "var(--txt)",
                              }}
                            >
                              {settings.storeName}
                            </span>
                          )}
                        </div>

                        <div
                          
          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "16px 0",
                            borderBottom: "1px solid var(--bdr)",
                          }}
                        >
                          <span
                            
          style={{ color: "var(--txt3)", fontSize: "14px" }}
                          >
                            Email
                          </span>
                          {isEditingProfile ? (
                            <input
                              type="email"
                              value={settings.email || ""}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  email: e.target.value,
                                })
                              }
                              
          style={{
                                textAlign: "right",
                                fontWeight: 700,
                                fontSize: "14px",
                                border: "1px solid var(--bdr)",
                                padding: "6px 12px",
                                borderRadius: "6px",
                                background: "var(--surf)",
                                outline: "none",
                                color: "var(--txt)",
                                width: "60%",
                              }}
                            />
                          ) : (
                            <span
                              
          style={{
                                fontWeight: 700,
                                fontSize: "14px",
                                color: "var(--txt)",
                              }}
                            >
                              {settings.email}
                            </span>
                          )}
                        </div>

                        <div
                          
          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "16px 0",
                            borderBottom: "1px solid var(--bdr)",
                          }}
                        >
                          <span
                            
          style={{ color: "var(--txt3)", fontSize: "14px" }}
                          >
                            No. Handphone
                          </span>
                          {isEditingProfile ? (
                            <input
                              type="text"
                              value={settings.phone || ""}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  phone: e.target.value,
                                })
                              }
                              
          style={{
                                textAlign: "right",
                                fontWeight: 700,
                                fontSize: "14px",
                                border: "1px solid var(--bdr)",
                                padding: "6px 12px",
                                borderRadius: "6px",
                                background: "var(--surf)",
                                outline: "none",
                                color: "var(--txt)",
                                width: "50%",
                              }}
                            />
                          ) : (
                            <span
                              
          style={{
                                fontWeight: 700,
                                fontSize: "14px",
                                color: "var(--txt)",
                              }}
                            >
                              {settings.phone}
                            </span>
                          )}
                        </div>

                        <div
                          
          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "16px 0",
                            borderBottom: "1px solid var(--bdr)",
                          }}
                        >
                          <span
                            
          style={{ color: "var(--txt3)", fontSize: "14px" }}
                          >
                            Password
                          </span>
                          {isEditingProfile ? (
                            <input
                              type="text"
                              value={settings.password || ""}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  password: e.target.value,
                                })
                              }
                              
          style={{
                                textAlign: "right",
                                fontWeight: 700,
                                fontSize: "14px",
                                border: "1px solid var(--bdr)",
                                padding: "6px 12px",
                                borderRadius: "6px",
                                background: "var(--surf)",
                                outline: "none",
                                color: "var(--txt)",
                                width: "50%",
                              }}
                            />
                          ) : (
                            <span
                              
          style={{
                                fontWeight: 700,
                                fontSize: "14px",
                                color: "var(--txt)",
                              }}
                            >
                              ••••••••
                            </span>
                          )}
                        </div>

                        {isEditingProfile && (
                          <div
                            
          style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "16px 0",
                            }}
                          >
                            <span
                              
          style={{ color: "var(--txt3)", fontSize: "14px" }}
                            >
                              Ubah Foto Profil
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              
          style={{
                                fontSize: "12px",
                                maxWidth: "200px",
                                color: "var(--txt)",
                              }}
                            />
                          </div>
                        )}
                      </div>

                      {isEditingProfile && (
                        <div
                          
          style={{
                            display: "flex",
                            gap: "12px",
                            marginTop: "24px",
                          }}
                        >
                          <button
                            onClick={() => setIsEditingProfile(false)}
                            
          style={{
                              flex: 1,
                              padding: "12px",
                              borderRadius: "8px",
                              border: "1px solid var(--bdr)",
                              background: "transparent",
                              color: "var(--txt)",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            Batal
                          </button>
                          <button
                            onClick={saveSettings}
                            className="btn-primary"
                            
          style={{ flex: 2 }}
                          >
                            Simpan Perubahan
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    
          style={{
                      background: "#FEF2F2",
                      padding: "20px",
                      borderRadius: "16px",
                      border: "1px solid #FECACA",
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                    }}
                  >
                    <div
                      
          style={{
                        background: "#FEE2E2",
                        padding: "12px",
                        borderRadius: "12px",
                      }}
                    >
                      <AlertTriangle size={24} color="#DC2626" />
                    </div>
                    <div>
                      <div
                        
          style={{
                          fontWeight: 800,
                          color: "#DC2626",
                          marginBottom: "4px",
                        }}
                      >
                        Zona Berbahaya
                      </div>
                      <div style={{ fontSize: "12px", color: "#991B1B" }}>
                        Menghapus akun akan menghilangkan seluruh data
                        transaksi.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
