// Desestructuración de Hooks de React desde el entorno CDN global
const { useState, useEffect } = React;

// --- Configuración de Bases Disponibles --- 
const BASES_DISPONIBLES = [
  { id: "ruta", name: "AXION La Ruta", address: "Ruta Nac. 12 Km 1027,5", lat: -27.5052648, lng: -58.7741652, color: "#FFF", province: "Corrientes" },
  { id: "jisacentro", name: "AXION Jisa Centro", address: "25 de Mayo, Resistencia, Chaco", lat: -27.4514, lng: -58.9866, color: "#FFF", province: "Chaco" },
  { id: "jisahiper", name: "AXION Jisa Hiper", address: "Hiper Libertad, Resistencia, Chaco", lat: -27.4331, lng: -58.9954, color: "#FFF", province: "Chaco" },
  { id: "sanlorenzo", name: "Lubricantes San Lorenzo", address: "Campana, Santa Fe", lat: -32.7333, lng: -60.7333, color: "#21c354", province: "Proveedor" },
  { id: "yfp_proveedor", name: "YPF Agro Distribución", address: "Santa Fe", lat: -31.6333, lng: -60.7000, color: "#21c354", province: "Proveedor" }
];

const GAS_STATIONS = [
    { name: "AXION Paysandú", address: "Av. Paysandú & Cruz del Sud", lat: -27.4995, lng: -58.8255 },
    { name: "GAS SIFER S.A.", address: "Av. Maipú 801", lat: -27.4860, lng: -58.8232 },
    { name: "Shell El Puente", address: "Av. 3 de Abril 402", lat: -27.4747, lng: -58.8466 },
    { name: "YPF Apala SRL", address: "Av. Maipú 1801", lat: -27.4948, lng: -58.8172 },
    { name: "Shell Yrigoyen", address: "Hipólito Yrigoyen, Perú 2301", lat: -27.4700, lng: -58.8215 },
];

const RESULTS = [
    { value: "sin_visitar", label: "Sin visitar", emoji: "🔵", color: "#6366f1" },
    { value: "interesado", label: "Interesado", emoji: "✅", color: "#21c354" },
    { value: "pendiente", label: "Pendiente", emoji: "⏳", color: "#f59e0b" },
    { value: "rechazado", label: "Rechazado", emoji: "❌", color: "#ff4b4b" },
];

// --- API y Constantes ---
const API_URL = "http://localhost:8000"; // Cambiar por la IP del servidor en red local o la PWA
const APP_VERSION = "1.0.0";

// --- Utilidades ---
const geodist = (lat1, lng1, lat2, lng2) => {
    const R = 6371, dLat = (lat2 - lat1) * Math.PI / 180, dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const fmtTime = (m) => {
    if (!m || m <= 0) return "—";
    const h = Math.floor(m / 60), min = m % 60;
    return h > 0 ? `${ h }h ${ min } m` : `${ min } m`;
};

const calcMins = (a, b) => {
    if (!a || !b) return null;
    const [ah, am] = a.split(":").map(Number);
    const [bh, bm] = b.split(":").map(Number);
    const d = (bh * 60 + bm) - (ah * 60 + am);
    return d > 0 ? d : null;
};

const openMaps = (address, setMapUrl) =>
    setMapUrl(`https://maps.google.com/maps?q=${encodeURIComponent(address + ", Corrientes, Argentina")}&t=&z=15&ie=UTF8&iwloc=&output=embed`);

const openMapsCoords = (lat, lng, setMapUrl) =>
    setMapUrl(`https://maps.google.com/maps?q=${lat},${lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`);

const openMapsRoute = (lat1, lng1, lat2, lng2, setMapUrl) =>
    setMapUrl(`https://maps.google.com/maps?saddr=${lat1},${lng1}&daddr=${lat2},${lng2}&output=embed`);

// --- Componente Principal ---
function App() {
    const [tab, setTab] = useState("clientes");
    const [screen, setScreen] = useState("setup");
    const [role, setRole] = useState("");
    const [vendorName, setVendorName] = useState("");
    const [currentBase, setCurrentBase] = useState(BASES_DISPONIBLES[0]);
    const [nameInput, setNameInput] = useState("");
    const [clients, setClients] = useState([]);
    const [expanded, setExpanded] = useState(null);
    const [confirmDel, setConfirmDel] = useState(null);
    const [toast, setToast] = useState("");
    const [mapUrl, setMapUrl] = useState(null);

    useEffect(() => {
        try {
            const r = localStorage.getItem("ruta-clients");
            if (r) setClients(JSON.parse(r));
        } catch (_) { }
    }, []);

    const saveClients = (updated) => {
        setClients(updated);
        try { localStorage.setItem("ruta-clients", JSON.stringify(updated)); } catch (_) { }
    };

    const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

    const enterApp = (r, enteredName) => {
        setRole(r);
        const inputClean = enteredName.trim().toLowerCase();
        setVendorName(enteredName.trim());

        if (inputClean === "leandro") { // Leandro siempre es vendedor y va a La Ruta
            setCurrentBase(BASES_DISPONIBLES.find(b => b.id === "ruta"));
            setScreen("main");
        } else {
            setScreen("select_base");
        }
    };

    const addClient = () => {
        const c = { id: Date.now(), name: "", address: "", result: "sin_visitar", visitDate: "", arrivalTime: "", departureTime: "", competitor: "", competitorPrice: "", ourPrice: "", notes: "", vendor: vendorName };
        const updated = [...clients, c];
        saveClients(updated);
        setExpanded(c.id);
    };

    const upd = (id, field, val) => {
        saveClients(clients.map(c => c.id === id ? { ...c, [field]: val } : c));
    };

    const deleteClient = (id) => {
        saveClients(clients.filter(c => c.id !== id));
        setExpanded(null);
        setConfirmDel(null);
        showToast("Cliente eliminado");
    };

    const exportCSV = () => {
        const header = ["Cliente", "Dirección", "Resultado", "Fecha", "Llegada", "Salida", "Min. visita", "Competidor", "Precio competidor", "Precio sugerido", "Notas", "Vendedor"];
        const rows = clients.map(c => {
            const m = calcMins(c.arrivalTime, c.departureTime);
            return [c.name, c.address, c.result, c.visitDate, c.arrivalTime, c.departureTime, m || "", c.competitor, c.competitorPrice, c.ourPrice, c.notes, c.vendor];
        });
        const csv = [header, ...rows].map(r => r.map(v => `"${String(v || "").replace(/"/g, '""')}"`).join(",")).join("\n");
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }));
        a.download = "visitas_corrientes_axion.csv";
        a.click();
        showToast("✅ Exportado a Excel");
    };

    const visited = clients.filter(c => c.result !== "sin_visitar");
    const interested = clients.filter(c => c.result === "interesado");
    const rejected = clients.filter(c => c.result === "rechazado");
    const totalMins = clients.reduce((s, c) => s + (calcMins(c.arrivalTime, c.departureTime) || 0), 0);
    const convRate = visited.length ? Math.round(interested.length / visited.length * 100) : 0;

    const COLORS = {
        magenta: "#E6007E",
        magentaDark: "#B30062",
        navy: "#0F1B40",
        bgDark: "#1A1A1A",
        textWhite: "#FFFFFF",
        textMuted: "#A3ACB8"
    };

    const C = {
        app: { maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: COLORS.bgDark, color: COLORS.textWhite, fontFamily: "system-ui, sans-serif", paddingBottom: 80 },
        card: (ex = {}) => ({ background: COLORS.navy, border: "1px solid rgba(230,0,126,0.2)", borderRadius: 12, padding: 16, margin: "10px 16px", boxShadow: "0 4px 15px rgba(0,0,0,0.3)", ...ex }),
        label: { fontSize: 11, fontWeight: 600, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6, display: "block", marginTop: 14 },
        inp: (ex = {}) => ({ width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 12px", color: COLORS.textWhite, fontFamily: "inherit", fontSize: 14, outline: "none", boxSizing: "border-box", ...ex }),
        row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
        btn: (bg, color, ex = {}) => ({ border: "1px solid transparent", borderRadius: 8, padding: "11px 16px", fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: bg, color, width: "100%", marginTop: 10, transition: "0.2s", boxSizing: "border-box", ...ex }),
    };

    // ── SETUP ──────────────────────────────────────────────────────────────────
    
    // --- Cloud y Sincronizacion ---
    const checkUpdate = async () => {
        try {
            const res = await fetch(`${API_URL}/api/ota/check-update?current_version=${APP_VERSION}`);
            const data = await res.json();
            if (data.actualizacion_disponible && data.requerida) {
                alert("Actualización Obligatoria. Descargando nueva versión...");
                window.location.href = data.url_descarga;
            }
        } catch (e) {
            console.log("Servidor inalcanzable para actualizacion OTA.");
        }
    };

    const syncToCloud = async () => {
        if (clients.length === 0) return showToast("Nada que sincronizar.");
        try {
            const payload = clients.map(c => ({
                "Nombre Empleado": vendorName || "Usuario",
                " Ubicación": c.address || "Desconocida",
                " Estado de Tarea": c.result,
                " Latitud": -27.50, // Latitud fija simulada para el modelo actual
                " Longitud": -58.77,
                " Hora": c.visitDate ? `${c.visitDate} ${c.arrivalTime || '00:00'}` : new Date().toISOString()
            }));

            const res = await fetch(`${API_URL}/api/tracking/sync`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                showToast("✅ Sincronizado a la nube");
                generateMLReport(); // Emitir reporte de Machine Learning en paralelo
            }
        } catch (e) {
            showToast("❌ Error al sincronizar. Guardado Local activado.");
        }
    };

    const generateMLReport = async () => {
        const avg = visited.length ? Math.round(totalMins / visited.length) : 0;
        const speedDesc = avg > 30 ? "Ventas Consultivas (Largas)" : "Transactional Speed (Rápidas)";
        const performance = convRate > 50 ? "Alta retención de clientes" : "Fricción en cierre";
        
        const reporte = {
            "Nombre Empleado": vendorName || "Usuario",
            "perfil_usuario": { promedio_minutos: avg, tasa_cierre: convRate },
            "horario_detectado": speedDesc,
            "recomendacion_auditoria": `El vendedor tiene una ejecución basada en ${performance}. Se sugiere seguimiento con el admin.`,
            "fecha_reporte": new Date().toISOString()
        };

        try {
            await fetch(`${API_URL}/api/ml/reporte`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(reporte)
            });
        } catch(e) { console.log(e); }
    };

    useEffect(() => {
        if (screen === "main") {
            checkUpdate();
        }
    }, [screen]);

    if (screen === "setup") return (
        <div style={C.app}>
            <div style={{ padding: "40px 24px 20px", display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ textAlign: "center", marginBottom: 10, display: "flex", justifyContent: "center" }}>
                    <div style={{ fontSize: 48, fontWeight: 900, color: "transparent", WebkitTextStroke: `2px ${COLORS.magenta}`, position: "relative", display: "inline-block" }}>
                        R
                        <span style={{ position: "absolute", bottom: -5, left: -20, fontSize: 13, background: COLORS.magenta, color: "#fff", padding: "4px 8px", borderRadius: 4, letterSpacing: 1, WebkitTextStroke: "0" }}>v2.1</span>
                    </div>
                </div>

                <div style={C.card()}>
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12, textAlign: "center" }}>Acceso al Sistema</div>
                    <label style={C.label}>Tu nombre</label>
                    <input
                        style={C.inp()}
                        placeholder="Ej: Nelson, Leandro, Alexis..."
                        value={nameInput}
                        onChange={e => setNameInput(e.target.value)}
                    />
                    <button
                        style={C.btn(COLORS.magenta, COLORS.textWhite, { opacity: nameInput.trim() ? 1 : 0.4, marginTop: 16 })}
                        disabled={!nameInput.trim()}
                        onClick={() => { enterApp("vendedor", nameInput); }}
                    >
                        Ingresar
                    </button>
                </div>
            </div>
        </div>
    );

    // ── SELECT BASE INTERMEDIATE SCREEN ─────────────────────────────────────────
    if (screen === "select_base") return (
        <div style={C.app}>
            <div style={{ padding: "60px 24px" }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: COLORS.magenta, marginBottom: 10 }}>Punto de Partida</div>
                <div style={{ color: COLORS.textMuted, marginBottom: 24, fontSize: 15 }}>
                    Hola {vendorName}, ¿desde dónde operas hoy?
                </div>

                {BASES_DISPONIBLES.filter(b => {
                    // Filtrar 'sanlorenzo' y 'proveedor' de las bases de partida
                    return b.id !== "sanlorenzo" && b.id !== "proveedor";
                }).map(b => (
                    <div key={b.id} style={C.card({ cursor: "pointer", transition: "0.2s" })} onClick={() => { setCurrentBase(b); setScreen("main"); }}>
                        <div style={{ fontWeight: 800, fontSize: 17, color: "#FFF", marginBottom: 6 }}>🏁 {b.name}</div>
                        <div style={{ fontSize: 13, color: COLORS.textMuted }}>{b.address}</div>
                    </div>
                ))}

                <button style={C.btn("transparent", COLORS.textWhite, { marginTop: 24, border: "1px solid rgba(255,255,255,0.2)" })}
                    onClick={() => setScreen("setup")}>
                    🔙 Volver o Cambiar Perfil
                </button>
            </div>
        </div>
    );

    // ── MAIN ───────────────────────────────────────────────────────────────────
    return (
        <div style={C.app}>
            {/* Modal de Mapa Integrado Side-Bar Layout */}
            {mapUrl && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", flexDirection: "column", padding: "safe-area-inset" }}>
                    <div style={{ background: COLORS.navy, padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `2px solid ${COLORS.magenta}` }}>
                        <div style={{ color: "#FFF", fontWeight: 700, fontSize: 16 }}>📍 Ubicación y Ruta</div>
                        <button style={{ background: "transparent", border: "none", color: "#ff4b4b", fontSize: 24, cursor: "pointer", fontWeight: 900 }} onClick={() => setMapUrl(null)}>×</button>
                    </div>

                    <div style={{ flex: 1, display: "flex", flexDirection: "row", overflow: "hidden" }}>
                        {/* BARRA LATERAL PARA SELECCIÓN PREDETERMINADA */}
                        <div style={{ width: 140, background: COLORS.bgDark, borderRight: `1px solid rgba(255,255,255,0.1)`, overflowY: "auto", padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                            <div style={{ fontSize: 11, color: COLORS.magenta, fontWeight: 800, marginBottom: 4, letterSpacing: 0.5 }}>P. PARTIDA:</div>
                            {BASES_DISPONIBLES.filter(b => b.province !== "Proveedor").map(b => (
                                <div key={b.id} style={{ fontSize: 11, color: b.color || "#FFF", fontWeight: 600, padding: "4px 0", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.05)" }} onClick={() => setCurrentBase(b)}>
                                    {b.id === currentBase.id ? "📍 " : ""}{b.name.replace("AXION ", "")}
                                </div>
                            ))}

                            <div style={{ fontSize: 11, color: COLORS.magenta, fontWeight: 800, marginTop: 10, letterSpacing: 0.5 }}>PROVEEDOR:</div>
                            {BASES_DISPONIBLES.filter(b => b.province === "Proveedor").map(b => (
                                <div key={b.id} style={{ fontSize: 11, color: b.color || "#FFF", fontWeight: 600, padding: "4px 0", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.05)" }} onClick={() => setCurrentBase(b)}>
                                    {b.id === currentBase.id ? "📦 " : ""}{b.name.replace("AXION ", "").replace("Lubricantes ", "Lub. ")}
                                </div>
                            ))}

                            <div style={{ fontSize: 11, color: COLORS.magenta, fontWeight: 800, marginTop: 10, letterSpacing: 0.5 }}>DEST. CORRIENTES:</div>
                            {GAS_STATIONS.filter(g => g.province === "Corrientes").map((g, idx) => (
                                <div key={idx} style={{ background: "rgba(255,255,255,0.05)", padding: "10px 8px", borderRadius: 8, cursor: "pointer", border: "1px solid rgba(255,255,255,0.05)", transition: "0.2s" }}
                                    onClick={() => openMapsRoute(currentBase.lat, currentBase.lng, g.lat, g.lng, setMapUrl)}>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: "#FFF", marginBottom: 2 }}>{g.name.slice(0, 16)}{g.name.length > 16 ? "..." : ""}</div>
                                    <div style={{ fontSize: 10, color: COLORS.magenta, fontWeight: 700 }}>{geodist(currentBase.lat, currentBase.lng, g.lat, g.lng).toFixed(1)} km</div>
                                </div>
                            ))}

                            <div style={{ fontSize: 11, color: COLORS.magenta, fontWeight: 800, marginTop: 10, letterSpacing: 0.5 }}>DEST. CHACO:</div>
                            {GAS_STATIONS.filter(g => g.province === "Chaco").map((g, idx) => (
                                <div key={idx} style={{ background: "rgba(255,255,255,0.05)", padding: "10px 8px", borderRadius: 8, cursor: "pointer", border: "1px solid rgba(255,255,255,0.05)", transition: "0.2s" }}
                                    onClick={() => openMapsRoute(currentBase.lat, currentBase.lng, g.lat, g.lng, setMapUrl)}>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: "#FFF", marginBottom: 2 }}>{g.name.slice(0, 16)}{g.name.length > 16 ? "..." : ""}</div>
                                    <div style={{ fontSize: 10, color: COLORS.magenta, fontWeight: 700 }}>{geodist(currentBase.lat, currentBase.lng, g.lat, g.lng).toFixed(1)} km</div>
                                </div>
                            ))}
                        </div>

                        {/* FRAME DEL MAPA */}
                        <div style={{ flex: 1, background: "#000" }}>
                            <iframe width="100%" height="100%" frameBorder="0" style={{ border: 0 }} src={mapUrl} allowFullScreen></iframe>
                        </div>
                    </div>
                </div>
            )}

            
            {/* Sync Floating Button */}
            {tab === "clientes" && (
                <div style={{ position: "fixed", bottom: 80, right: 16, zIndex: 900 }}>
                    <button style={{ background: COLORS.magenta, border: "none", width: 56, height: 56, borderRadius: "50%", color: "#fff", fontSize: 24, boxShadow: "0 4px 15px rgba(230,0,126,0.5)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={syncToCloud}>
                        ☁️
                    </button>
                </div>
            )}

            {/* Toast Notificación */}
            <div style={{ position: "fixed", bottom: 88, left: "50%", transform: "translateX(-50%)", background: COLORS.magenta, color: "#FFF", padding: "10px 20px", borderRadius: 20, fontWeight: 700, fontSize: 13, zIndex: 999, opacity: toast ? 1 : 0, transition: "opacity 0.3s", pointerEvents: "none", whiteSpace: "nowrap", boxShadow: "0 0 15px rgba(230,0,126,0.5)" }}>{toast}</div>

            {/* Modal Eliminar Cliente */}
            {confirmDel && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, backdropFilter: "blur(2px)" }}>
                    <div style={{ background: COLORS.navy, border: "1px solid #ff4b4b", borderRadius: 16, padding: 24, maxWidth: 320, width: "100%", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
                        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8, color: "#FFF" }}>¿Eliminar cliente?</div>
                        <div style={{ fontSize: 14, color: COLORS.textMuted, marginBottom: 20 }}>Esta acción eliminará el registro actual. No se puede deshacer.</div>
                        <div style={{ display: "flex", gap: 10 }}>
                            <button style={{ flex: 1, padding: "12px 0", borderRadius: 8, border: "1px solid rgba(255,255,255,0.2)", background: "transparent", color: COLORS.textWhite, fontWeight: 600, cursor: "pointer", fontSize: 14 }} onClick={() => setConfirmDel(null)}>Cancelar</button>
                            <button style={{ flex: 1, padding: "12px 0", borderRadius: 8, border: "none", background: "#ff4b4b", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 14 }} onClick={() => deleteClient(confirmDel)}>Eliminar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header Sticky AXION */}
            <div style={{ background: "rgba(15, 27, 64, 0.95)", borderBottom: `2px solid ${COLORS.magenta}`, padding: "14px 18px", position: "sticky", top: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between", backdropFilter: "blur(10px)" }}>
                <div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: "transparent", WebkitTextStroke: `1px ${COLORS.magenta}`, letterSpacing: 1, display: "inline-block" }}>R <span style={{ fontSize: 10, color: COLORS.magenta, WebkitTextStroke: 0 }}>v2.1</span></div>
                    <div style={{ fontSize: 11, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 1, marginTop: 2 }}>{currentBase.name}</div>
                </div>
                <div style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "6px 10px", borderRadius: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                    onClick={() => { setScreen("setup"); setVendorName(""); setNameInput(""); }}>
                    <span>🔄</span> {vendorName}
                </div>
            </div>

            {/* ── CLIENTES ── */}
            {tab === "clientes" && (
                <div style={{ paddingBottom: 20 }}>
                    <div style={{ padding: "20px 16px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ fontSize: 22, fontWeight: 800 }}>
                            Clientes &nbsp;
                            <span style={{ background: COLORS.magenta, color: "#FFF", fontSize: 12, fontWeight: 800, padding: "2px 10px", borderRadius: 20 }}>{clients.length}</span>
                        </div>
                        <button style={C.btn("rgba(230,0,126,0.15)", COLORS.magenta, { width: "auto", marginTop: 0, border: `1px solid ${COLORS.magenta}`, padding: "8px 16px", borderRadius: 20 })} onClick={addClient}>+ Nuevo</button>
                    </div>

                    {clients.length === 0 && (
                        <div style={C.card({ textAlign: "center", padding: "40px 16px", background: "transparent", border: "1px dashed rgba(255,255,255,0.2)", boxShadow: "none" })}>
                            <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.5 }}>📝</div>
                            <div style={{ fontSize: 15, color: COLORS.textMuted }}>No hay clientes registrados.<br />Presiona "+ Nuevo" para comenzar.</div>
                        </div>
                    )}

                    {clients.map((c, i) => {
                        const res = RESULTS.find(r => r.value === c.result) || RESULTS[0];
                        const mins = calcMins(c.arrivalTime, c.departureTime);
                        const open = expanded === c.id;
                        return (
                            <div key={c.id} style={{ background: COLORS.navy, border: `1px solid ${open ? COLORS.magenta : "rgba(255,255,255,0.05)"}`, borderRadius: 16, margin: "12px 16px", overflow: "hidden", transition: "0.3s", boxShadow: open ? "0 4px 20px rgba(230,0,126,0.2)" : "0 2px 10px rgba(0,0,0,0.2)" }}>
                                <div style={{ display: "flex", alignItems: "center", padding: "16px", cursor: "pointer" }} onClick={() => setExpanded(open ? null : c.id)}>
                                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: open ? COLORS.magenta : "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: open ? "#FFF" : COLORS.textWhite, flexShrink: 0, marginRight: 14, transition: "0.3s" }}>{i + 1}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: 15 }}>{c.name || <span style={{ color: COLORS.textMuted, fontStyle: "italic" }}>Sin nombre</span>}</div>
                                        <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 4 }}>{c.address || "Dirección pendiente"}</div>
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                                        <div style={{ width: 12, height: 12, borderRadius: "50%", background: res.color, boxShadow: `0 0 8px ${res.color}66` }} />
                                        <div style={{ fontSize: 12, color: COLORS.textMuted }}>{open ? "▲" : "▼"}</div>
                                    </div>
                                </div>

                                {open && (
                                    <div style={{ padding: "0 16px 20px", borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.15)" }}>
                                        <div style={C.row}>
                                            <div>
                                                <label style={C.label}>Nombre cliente / Razón Social</label>
                                                <input style={C.inp()} value={c.name} onChange={e => upd(c.id, "name", e.target.value)} placeholder="Ej: Transportes X" />
                                            </div>
                                            <div>
                                                <label style={C.label}>Fecha visita</label>
                                                <input type="date" style={C.inp()} value={c.visitDate} onChange={e => upd(c.id, "visitDate", e.target.value)} />
                                            </div>
                                        </div>

                                        <label style={C.label}>Dirección exacta</label>
                                        <input style={C.inp()} value={c.address} onChange={e => upd(c.id, "address", e.target.value)} placeholder="Ej: Ruta 12 Km..." />

                                        <div style={C.row}>
                                            <div>
                                                <label style={C.label}>Hora llegada</label>
                                                <input type="time" style={C.inp()} value={c.arrivalTime} onChange={e => upd(c.id, "arrivalTime", e.target.value)} />
                                            </div>
                                            <div>
                                                <label style={C.label}>Hora salida</label>
                                                <input type="time" style={C.inp()} value={c.departureTime} onChange={e => upd(c.id, "departureTime", e.target.value)} />
                                            </div>
                                        </div>

                                        {mins && (
                                            <div style={{ background: "rgba(230,0,126,0.1)", borderRadius: 8, padding: "10px 14px", marginTop: 12, fontSize: 13, color: COLORS.magenta, border: `1px solid rgba(230,0,126,0.3)` }}>
                                                ⏱ Tiempo neto de visita: <strong>{fmtTime(mins)}</strong>
                                            </div>
                                        )}

                                        <label style={C.label}>Resultado Operativo</label>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                                            {RESULTS.map(opt => (
                                                <div key={opt.value}
                                                    style={{ padding: "8px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600, border: `2px solid ${c.result === opt.value ? opt.color : "rgba(255,255,255,0.1)"}`, cursor: "pointer", background: c.result === opt.value ? opt.color + "22" : "rgba(0,0,0,0.3)", color: c.result === opt.value ? opt.color : COLORS.textMuted, transition: "0.2s" }}
                                                    onClick={() => upd(c.id, "result", opt.value)}>
                                                    {opt.emoji} {opt.label}
                                                </div>
                                            ))}
                                        </div>

                                        {c.result === "rechazado" && (
                                            <div style={{ marginTop: 16, padding: 16, background: "rgba(255, 75, 75, 0.05)", borderRadius: 12, border: "1px solid rgba(255,75,75,0.2)" }}>
                                                <div style={{ fontSize: 13, fontWeight: 700, color: "#ff4b4b", marginBottom: 12 }}>Inteligencia Competitiva Requerida</div>
                                                <div style={C.row}>
                                                    <div>
                                                        <label style={C.label}>Empresa competidora</label>
                                                        <input style={C.inp()} value={c.competitor} onChange={e => upd(c.id, "competitor", e.target.value)} placeholder="YPF / Puma / Shell" />
                                                    </div>
                                                    <div>
                                                        <label style={C.label}>Precio competidor</label>
                                                        <input type="number" style={C.inp()} value={c.competitorPrice} onChange={e => upd(c.id, "competitorPrice", e.target.value)} placeholder="$" />
                                                    </div>
                                                </div>
                                                <label style={C.label}>Costo Cierre Potencial ($)</label>
                                                <input type="number" style={C.inp()} value={c.ourPrice} onChange={e => upd(c.id, "ourPrice", e.target.value)} placeholder="Nuestra oferta de entrada" />
                                            </div>
                                        )}

                                        <label style={C.label}>Notas y Observaciones</label>
                                        <textarea rows={3} style={C.inp({ minHeight: 80, resize: "vertical", paddingTop: 12 })} value={c.notes} onChange={e => upd(c.id, "notes", e.target.value)} placeholder="Anotaciones importantes, comentarios del cliente o pasos a seguir..." />

                                        {c.address && (
                                            <button style={C.btn("rgba(33, 195, 84, 0.15)", "#21c354", { border: "1px solid #21c354", marginTop: 24, padding: "14px" })} onClick={() => openMaps(c.address, setMapUrl)}>
                                                🗺 Trazar Ruta a este Cliente
                                            </button>
                                        )}

                                        <button style={C.btn("transparent", "#ff4b4b", { fontSize: 13, marginTop: 12, padding: "10px" })} onClick={() => setConfirmDel(c.id)}>
                                            🗑 Eliminar Registro
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── MÉTRICAS ── */}
            {tab === "metricas" && (
                <div style={{ paddingBottom: 20 }}>
                    <div style={{ padding: "20px 16px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ fontSize: 22, fontWeight: 800 }}>Métricas y KPIs</div>
                        <button style={C.btn("rgba(255,255,255,0.1)", COLORS.textWhite, { width: "auto", marginTop: 0, padding: "8px 16px", borderRadius: 20 })} onClick={exportCSV}>⏬ Exportar Datos</button>
                    </div>

                    <div style={C.card({ background: `linear-gradient(135deg, ${COLORS.navy}, rgba(230,0,126,0.2))` })}>
                        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                            {[
                                { lbl: "Horas Netas", val: fmtTime(totalMins) },
                                { lbl: "Hit Rate (%)", val: `${convRate}%` },
                                { lbl: "Embudo", val: `${visited.length}/${clients.length}` },
                            ].map(x => (
                                <div key={x.lbl}>
                                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: 0.8 }}>{x.lbl}</div>
                                    <div style={{ fontSize: 28, fontWeight: 900, color: COLORS.textWhite, textShadow: "0 2px 5px rgba(0,0,0,0.5)" }}>{x.val}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, margin: "0 16px" }}>
                        {[
                            { val: interested.length, lbl: "Cierres", color: "#21c354" },
                            { val: rejected.length, lbl: "Perdidos", color: "#ff4b4b" },
                            { val: clients.filter(c => c.result === "pendiente").length, lbl: "En pipeline", color: "#f59e0b" },
                            { val: visited.length > 0 ? fmtTime(Math.round(totalMins / visited.length)) : "—", lbl: "T. Promedio", color: COLORS.magenta },
                        ].map(x => (
                            <div key={x.lbl} style={{ background: COLORS.navy, border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, padding: 20, boxShadow: "0 4px 10px rgba(0,0,0,0.15)" }}>
                                <div style={{ fontSize: 36, fontWeight: 900, color: x.color, lineHeight: 1 }}>{x.val}</div>
                                <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 8, textTransform: "uppercase", fontWeight: 600 }}>{x.lbl}</div>
                            </div>
                        ))}
                    </div>

                    {clients.filter(c => c.competitor).length > 0 && (
                        <div style={C.card({ marginTop: 16, border: "1px solid rgba(255, 75, 75, 0.4)" })}>
                            <div style={{ fontSize: 16, fontWeight: 800, color: "#ff4b4b", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                                <span>🎯</span> Radar Competitivo
                            </div>
                            {clients.filter(c => c.competitor).map((c, i) => (
                                <div key={c.id} style={{ padding: "12px 0", borderBottom: i < clients.filter(c => c.competitor).length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                                    <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name || "Sin nombre"}</div>
                                    <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 6, display: "flex", flexDirection: "column", gap: 4 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between" }}><span>Competencia:</span> <span style={{ color: "#ff4b4b", fontWeight: 600 }}>{c.competitor}</span></div>
                                        {c.competitorPrice && <div style={{ display: "flex", justifyContent: "space-between" }}><span>Precio Mercado:</span> <span>${c.competitorPrice}</span></div>}
                                        {c.ourPrice && <div style={{ display: "flex", justifyContent: "space-between" }}><span>Oferta Ideal:</span> <span style={{ color: "#21c354", fontWeight: 700 }}>${c.ourPrice}</span></div>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div style={C.card({ marginTop: 16 })}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.textWhite, marginBottom: 12 }}>Registro Documental</div>
                        {clients.length === 0 && <div style={{ color: COLORS.textMuted, fontSize: 13, textAlign: "center", padding: "10px 0" }}>Pipeline vacío.</div>}
                        {clients.map((c, i) => {
                            const res = RESULTS.find(r => r.value === c.result) || RESULTS[0];
                            const m = calcMins(c.arrivalTime, c.departureTime);
                            return (
                                <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: i < clients.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: res.color, flexShrink: 0, boxShadow: `0 0 6px ${res.color}` }} />
                                        <div>
                                            <div style={{ fontSize: 14, fontWeight: 600 }}>{c.name || `Prospecto ${i + 1}`}</div>
                                            <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>{c.visitDate || "S/F"}{c.vendor ? ` • ${c.vendor}` : ""}</div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <div style={{ fontSize: 13, color: res.color, fontWeight: 600 }}>{res.label}</div>
                                        <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>{m ? fmtTime(m) : "N/D"}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── ESTACIONES ── */}
            {tab === "estaciones" && (
                <div style={{ paddingBottom: 20 }}>
                    <div style={{ padding: "20px 16px 8px" }}>
                        <div style={{ fontSize: 22, fontWeight: 800 }}>Puntos de Referencia</div>
                    </div>

                    <div style={C.card({ background: `linear-gradient(135deg, ${COLORS.navy}, rgba(230,0,126,0.3))`, border: `1px solid rgba(230,0,126,0.5)`, borderRadius: 16 })}>
                        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                            <div style={{ fontSize: 36 }}>🏁</div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 11, fontWeight: 800, color: COLORS.magenta, textTransform: "uppercase", letterSpacing: 1.5 }}>Punto de Referencia (Cero)</div>
                                <div style={{ fontWeight: 800, fontSize: 16, color: "#fff", marginTop: 2 }}>{currentBase.name}</div>
                                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>{currentBase.address}</div>
                            </div>
                        </div>
                        <button style={C.btn("rgba(0,0,0,0.3)", "#FFF", { border: "1px solid rgba(255,255,255,0.2)", marginTop: 16, padding: "12px" })}
                            onClick={() => openMapsCoords(currentBase.lat, currentBase.lng, setMapUrl)}>
                            📍 Visualizar Geolocalización
                        </button>
                    </div>

                    <div style={C.card()}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.textWhite, marginBottom: 16 }}>Destinos Frecuentes</div>
                        {GAS_STATIONS.map((g, i) => {
                            const d = geodist(currentBase.lat, currentBase.lng, g.lat, g.lng);
                            const isCompetitor = !g.name.includes("AXION") && !g.name.includes("GAS");
                            return (
                                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: i < GAS_STATIONS.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                                    <div style={{ flex: 1, paddingRight: 10 }}>
                                        <div style={{ fontSize: 14, fontWeight: 600, color: isCompetitor ? "#ff4b4b" : "#FFF", display: "flex", alignItems: "center", gap: 8 }}>
                                            ⛽ {g.name}
                                        </div>
                                        <div style={{ fontSize: 11, background: "rgba(255,255,255,0.1)", display: "inline-block", padding: "2px 6px", borderRadius: 4, marginTop: 4, color: COLORS.textWhite }}>{g.province}</div>
                                        <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 4 }}>{g.address}</div>
                                        <button
                                            style={{ marginTop: 8, background: "rgba(255,255,255,0.05)", color: COLORS.textWhite, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "0.2s" }}
                                            onClick={() => openMapsRoute(currentBase.lat, currentBase.lng, g.lat, g.lng, setMapUrl)}>
                                            🗺 Abrir Ruta
                                        </button>
                                    </div>
                                    <div style={{ textAlign: "right", minWidth: 60 }}>
                                        <div style={{ fontSize: 24, fontWeight: 900, color: COLORS.magenta, lineHeight: 1 }}>{d.toFixed(1)}</div>
                                        <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 4, textTransform: "uppercase" }}>KM</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Nav Sticky Bottom */}
            <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: "rgba(15, 27, 64, 0.95)", borderTop: "1px solid rgba(230,0,126,0.3)", display: "flex", zIndex: 200, backdropFilter: "blur(10px)", paddingBottom: "env(safe-area-inset-bottom)" }}>
                {[
                    { id: "clientes", icon: "📝", label: "Registro" },
                    { id: "metricas", icon: "📊", label: "Resultados" },
                    { id: "estaciones", icon: "⛽", label: "Estaciones" },
                ].map(n => (
                    <button key={n.id}
                        style={{ flex: 1, padding: "14px 4px 12px", border: "none", background: "transparent", color: tab === n.id ? COLORS.magenta : COLORS.textMuted, fontSize: 11, fontWeight: tab === n.id ? 700 : 500, fontFamily: "inherit", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, transition: "color 0.2s" }}
                        onClick={() => setTab(n.id)}>
                        <span style={{ fontSize: 22, filter: tab === n.id ? "drop-shadow(0 0 5px rgba(230,0,126,0.5))" : "grayscale(100%) opacity(60%)", transition: "0.2s" }}>{n.icon}</span>
                        {n.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

// Renderizar App con React 18
const rootElement = document.getElementById("root");
const root = ReactDOM.createRoot(rootElement);
root.render(<App />);
