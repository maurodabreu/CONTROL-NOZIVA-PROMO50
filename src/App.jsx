import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  DollarSign, 
  Ticket, 
  TrendingUp, 
  Clock, 
  Plus, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Edit3, 
  Share2, 
  Users, 
  Sparkles, 
  X, 
  Phone, 
  Target, 
  LogOut, 
  Award,
  Crown,
  RefreshCw,
  Settings,
  Lock,
  UserPlus
} from 'lucide-react';

// ==========================================
// CONFIGURACIÓN DE FIREBASE (CREDANCIALES REALES)
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyCPkvRTmRFX7cjP8Yhoa-z-WvFdPNFRldk",
  authDomain: "noziva-entradaspromo50.firebaseapp.com",
  projectId: "noziva-entradaspromo50",
  storageBucket: "noziva-entradaspromo50.firebasestorage.app",
  messagingSenderId: "778889961321",
  appId: "1:778889961321:web:9ce02075470c3832c4a7f8"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'noziva-fiesta-pro-fondos';

const PRECIO_ENTRADA_FIX = 5;
const META_ENTRADAS_DEF = 600;

export default function App() {
  // Autenticación de Firebase
  const [user, setUser] = useState(null);
  
  // Lista de Usuarios Registrados (Sincronizada desde Firestore)
  const [usuariosRegistrados, setUsuariosRegistrados] = useState([]);

  // Usuario actualmente logueado
  const [vendedoraActual, setVendedoraActual] = useState(
    () => localStorage.getItem('vendedora_noziva') || ''
  );

  // Estados de Login / Registro
  const [selectedUser, setSelectedUser] = useState('');
  const [inputPin, setInputPin] = useState('');
  const [modoCrearUsuario, setModoCrearUsuario] = useState(false);
  const [nuevoNombreInput, setNuevoNombreInput] = useState('');
  const [nuevoPinInput, setNuevoPinInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // Datos
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Configuraciones
  const [metaEntradas, setMetaEntradas] = useState(META_ENTRADAS_DEF);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [tempMetaInput, setTempMetaInput] = useState(META_ENTRADAS_DEF.toString());

  // UI
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODAS');
  
  // Modales y Notificaciones
  const [modalNuevaVenta, setModalNuevaVenta] = useState(false);
  const [editingVenta, setEditingVenta] = useState(null);
  const [copiadoNotif, setCopiadoNotif] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Formulario de Venta
  const [formVenta, setFormVenta] = useState({
    comprador: '',
    telefono: '',
    cantidad: 1,
    metodoPago: 'Binance',
    estadoPago: 'PAGADO',
    notas: ''
  });

  // Inicializar Firebase Auth
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Error al autenticar:", err);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      setUser(usr);
    });

    return () => unsubscribe();
  }, []);

  // Suscripción Firestore (Ventas y Usuarios en tiempo real)
  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const ventasRef = collection(db, 'artifacts', appId, 'public', 'data', 'ventas_entradas');
    const usuariosRef = collection(db, 'artifacts', appId, 'public', 'data', 'usuarios_comite');

    // Suscripción a Ventas
    const unsubVentas = onSnapshot(
      ventasRef,
      (snapshot) => {
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        docs.sort((a, b) => {
          const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.timestamp || 0);
          const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.timestamp || 0);
          return tB - tA;
        });

        setVentas(docs);
        setLoading(false);
      },
      (err) => {
        console.error("Error en ventas:", err);
        setLoading(false);
      }
    );

    // Suscripción a Usuarios en la Nube
    const unsubUsuarios = onSnapshot(
      usuariosRef,
      (snapshot) => {
        const usersList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsuariosRegistrados(usersList);
      },
      (err) => {
        console.error("Error al obtener usuarios:", err);
      }
    );

    return () => {
      unsubVentas();
      unsubUsuarios();
    };
  }, [user]);

  // Manejar Login
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setLoginError('');

    if (!selectedUser) {
      setLoginError('Selecciona tu usuario de la lista');
      return;
    }

    const usrEncontrado = usuariosRegistrados.find(u => u.nombre === selectedUser);
    if (!usrEncontrado) {
      setLoginError('Usuario no encontrado');
      return;
    }

    if (usrEncontrado.pin && inputPin !== usrEncontrado.pin) {
      setLoginError('PIN incorrecto. Intenta de nuevo.');
      return;
    }

    setVendedoraActual(usrEncontrado.nombre);
    localStorage.setItem('vendedora_noziva', usrEncontrado.nombre);
    setInputPin('');
  };

  // Crear Nuevo Usuario Guardándolo en Firestore Cloud
  const handleCrearUsuario = async (e) => {
    e.preventDefault();
    setLoginError('');
    const nombreLimpio = nuevoNombreInput.trim();
    
    if (!nombreLimpio) {
      setLoginError('Ingresa un nombre válido');
      return;
    }

    if (usuariosRegistrados.some(u => u.nombre.toLowerCase() === nombreLimpio.toLowerCase())) {
      setLoginError('Ese nombre ya existe');
      return;
    }

    if (nuevoPinInput.length < 4) {
      setLoginError('El PIN debe tener 4 dígitos');
      return;
    }

    try {
      const usuariosRef = collection(db, 'artifacts', appId, 'public', 'data', 'usuarios_comite');
      await addDoc(usuariosRef, {
        nombre: nombreLimpio,
        pin: nuevoPinInput,
        createdAt: serverTimestamp()
      });

      setVendedoraActual(nombreLimpio);
      localStorage.setItem('vendedora_noziva', nombreLimpio);

      setModoCrearUsuario(false);
      setNuevoNombreInput('');
      setNuevoPinInput('');
    } catch (err) {
      console.error("Error al guardar usuario en la nube:", err);
      setLoginError("No se pudo guardar el usuario en la nube.");
    }
  };

  // Abrir Modal Nueva Venta
  const handleOpenNuevaVenta = () => {
    setFormVenta({
      comprador: '',
      telefono: '',
      cantidad: 1,
      metodoPago: 'Binance',
      estadoPago: 'PAGADO',
      notas: ''
    });
    setEditingVenta(null);
    setModalNuevaVenta(true);
  };

  // Guardar o Editar Venta
  const handleSubmitVenta = async (e) => {
    e.preventDefault();
    if (!formVenta.comprador.trim()) {
      alert("Por favor ingresa el nombre del comprador.");
      return;
    }

    try {
      const totalMonto = formVenta.cantidad * PRECIO_ENTRADA_FIX;
      const ventasRef = collection(db, 'artifacts', appId, 'public', 'data', 'ventas_entradas');

      if (editingVenta) {
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'ventas_entradas', editingVenta.id);
        await updateDoc(docRef, {
          comprador: formVenta.comprador.trim(),
          telefono: formVenta.telefono.trim(),
          cantidad: Number(formVenta.cantidad),
          montoTotal: totalMonto,
          metodoPago: formVenta.metodoPago,
          estadoPago: formVenta.estadoPago,
          notas: formVenta.notas.trim(),
          vendedora: vendedoraActual || 'Comité'
        });
      } else {
        await addDoc(ventasRef, {
          comprador: formVenta.comprador.trim(),
          telefono: formVenta.telefono.trim(),
          cantidad: Number(formVenta.cantidad),
          montoTotal: totalMonto,
          metodoPago: formVenta.metodoPago,
          estadoPago: formVenta.estadoPago,
          vendedora: vendedoraActual || 'Comité',
          notas: formVenta.notas.trim(),
          createdAt: serverTimestamp(),
          timestamp: Date.now()
        });
      }

      setModalNuevaVenta(false);
      setEditingVenta(null);
    } catch (err) {
      console.error("Error al guardar:", err);
      alert("Error al guardar en la nube.");
    }
  };

  // Cambiar Estado Rápido
  const toggleEstadoPago = async (e, item) => {
    if (e) e.stopPropagation();
    try {
      const nuevoEstado = item.estadoPago === 'PAGADO' ? 'PENDIENTE' : 'PAGADO';
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'ventas_entradas', item.id);
      await updateDoc(docRef, { estadoPago: nuevoEstado });
    } catch (err) {
      console.error("Error al cambiar estado:", err);
    }
  };

  // Eliminar
  const executeDelete = async (id) => {
    setDeletingId(id);
    try {
      setVentas(prev => prev.filter(v => v.id !== id));
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'ventas_entradas', id);
      await deleteDoc(docRef);
    } catch (err) {
      console.error("Error al eliminar:", err);
      alert("No se pudo eliminar de la base de datos.");
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  // Editar Entrada
  const handleStartEdit = (e, venta) => {
    if (e) e.stopPropagation();
    setEditingVenta(venta);
    setFormVenta({
      comprador: venta.comprador,
      telefono: venta.telefono || '',
      cantidad: venta.cantidad,
      metodoPago: venta.metodoPago || 'Binance',
      estadoPago: venta.estadoPago || 'PAGADO',
      notas: venta.notas || ''
    });
    setModalNuevaVenta(true);
  };

  // Métricas
  const metricas = useMemo(() => {
    let totalEntradasVendidas = 0;
    let totalRecaudado = 0;
    let totalPendienteMonto = 0;
    let entradasPagadas = 0;
    let entradasPendientes = 0;
    const vendedorasMap = {};

    ventas.forEach(v => {
      const cant = Number(v.cantidad) || 0;
      const monto = Number(v.montoTotal) || (cant * PRECIO_ENTRADA_FIX);

      totalEntradasVendidas += cant;

      if (v.estadoPago === 'PAGADO') {
        totalRecaudado += monto;
        entradasPagadas += cant;
      } else {
        totalPendienteMonto += monto;
        entradasPendientes += cant;
      }

      const vend = v.vendedora || 'Comité';
      if (!vendedorasMap[vend]) {
        vendedorasMap[vend] = { entradas: 0, recaudado: 0 };
      }
      vendedorasMap[vend].entradas += cant;
      if (v.estadoPago === 'PAGADO') {
        vendedorasMap[vend].recaudado += monto;
      }
    });

    const porcentajeMeta = Math.min(Math.round((totalEntradasVendidas / metaEntradas) * 100), 100);

    const rankingVendedoras = Object.keys(vendedorasMap)
      .map(nombre => ({
        nombre,
        entradas: vendedorasMap[nombre].entradas,
        recaudado: vendedorasMap[nombre].recaudado
      }))
      .sort((a, b) => b.entradas - a.entradas);

    return {
      totalEntradasVendidas,
      totalRecaudado,
      totalPendienteMonto,
      entradasPagadas,
      entradasPendientes,
      porcentajeMeta,
      rankingVendedoras
    };
  }, [ventas, metaEntradas]);

  // Filtros
  const ventasFiltradas = useMemo(() => {
    return ventas.filter(v => {
      const query = searchQuery.toLowerCase();
      const coincideBusqueda = 
        v.comprador.toLowerCase().includes(query) ||
        (v.vendedora && v.vendedora.toLowerCase().includes(query)) ||
        (v.telefono && v.telefono.includes(query));

      if (statusFilter === 'PAGADO') return coincideBusqueda && v.estadoPago === 'PAGADO';
      if (statusFilter === 'PENDIENTE') return coincideBusqueda && v.estadoPago === 'PENDIENTE';
      return coincideBusqueda;
    });
  }, [ventas, searchQuery, statusFilter]);

  // WhatsApp Report
  const copiarResumenWhatsApp = () => {
    const texto = `✨ *GOLD PROMO - PROMO 50* ✨\n` +
      `👑 *Control Entradas Fiesta Pro Fondos - NOZIVA - 06/11/2026*\n\n` +
      `📊 *RESUMEN DE VENTAS EN TIEMPO REAL*\n` +
      `-----------------------------------\n` +
      `💰 *Total Recaudado:* $${metricas.totalRecaudado}\n` +
      `🎟️ *Entradas Vendidas:* ${metricas.totalEntradasVendidas} / ${metaEntradas} (${metricas.porcentajeMeta}%)\n` +
      `⏳ *Por Cobrar:* $${metricas.totalPendienteMonto} (${metricas.entradasPendientes} entradas)\n` +
      `💵 *Valor Entrada:* $${PRECIO_ENTRADA_FIX} (Binance / Efectivo)\n\n` +
      `🏆 *TOP VENDEDORAS (GOLD COMITÉ):*\n` +
      metricas.rankingVendedoras.slice(0, 5).map((v, i) => `${i + 1}. ${v.nombre}: ${v.entradas} ent. ($${v.recaudado})`).join('\n') +
      `\n\n¡Seguimos sumando para nuestra Fiesta de Revelación de Logo! 🎓🥂`;

    navigator.clipboard.writeText(texto);
    setCopiadoNotif(true);
    setTimeout(() => setCopiadoNotif(false), 3000);
  };

  // ==========================================
  // PANTALLA DE LOGIN CON PESTAÑAS (RESTAURADA)
  // ==========================================
  if (!vendedoraActual) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl"></div>

        <div className="max-w-md w-full bg-slate-900/90 border border-amber-500/30 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 relative backdrop-blur-xl">
          
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
              <Crown className="w-9 h-9" />
            </div>
            <span className="inline-block px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-amber-500/10 text-amber-300 border border-amber-500/30">
              PROMO 50 • NOZIVA
            </span>
            <h1 className="text-xl font-black text-amber-100 leading-snug">
              Fiesta Pro-Fondos NOZIVA
            </h1>
          </div>

          {/* PESTAÑAS DE NAVEGACIÓN ENTRE INGRESAR Y CREAR USUARIO */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-amber-500/20">
            <button
              type="button"
              onClick={() => {
                setModoCrearUsuario(false);
                setLoginError('');
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                !modoCrearUsuario
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-amber-200'
              }`}
            >
              Ingresar
            </button>
            <button
              type="button"
              onClick={() => {
                setModoCrearUsuario(true);
                setLoginError('');
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                modoCrearUsuario
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-amber-200'
              }`}
            >
              Crear Usuario
            </button>
          </div>

          {loginError && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs p-3 rounded-xl text-center font-semibold">
              {loginError}
            </div>
          )}

          {!modoCrearUsuario ? (
            /* PESTAÑA 1: INGRESAR */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-amber-300/80 uppercase tracking-wider block mb-1">
                  Usuario / Integrante:
                </label>
                {usuariosRegistrados.length > 0 ? (
                  <select
                    value={selectedUser}
                    onChange={(e) => {
                      setSelectedUser(e.target.value);
                      setLoginError('');
                    }}
                    className="w-full bg-slate-950 border border-amber-500/30 focus:border-amber-400 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none"
                  >
                    <option value="">-- Selecciona tu nombre --</option>
                    {usuariosRegistrados.map((u) => (
                      <option key={u.id || u.nombre} value={u.nombre}>
                        {u.nombre}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-center py-3 text-slate-500 text-xs bg-slate-950 rounded-xl border border-slate-800">
                    No hay usuarios en la nube. Ve a "Crear Usuario".
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-amber-300/80 uppercase tracking-wider block mb-1">
                  PIN de 4 dígitos:
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="••••"
                    value={inputPin}
                    onChange={(e) => setInputPin(e.target.value)}
                    className="w-full bg-slate-950 border border-amber-500/30 focus:border-amber-400 rounded-xl pl-10 pr-4 py-3 text-slate-100 text-sm focus:outline-none tracking-widest"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-extrabold text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all transform active:scale-98"
              >
                Entrar
              </button>
            </form>
          ) : (
            /* PESTAÑA 2: CREAR USUARIO */
            <form onSubmit={handleCrearUsuario} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-amber-300/80 uppercase tracking-wider block mb-1">
                  Tu Nombre:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Anabel, Camila, Sofía..."
                  value={nuevoNombreInput}
                  onChange={(e) => setNuevoNombreInput(e.target.value)}
                  className="w-full bg-slate-950 border border-amber-500/30 focus:border-amber-400 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-amber-300/80 uppercase tracking-wider block mb-1">
                  Crea tu PIN de 4 dígitos:
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    maxLength={4}
                    required
                    placeholder="Ej: 1234"
                    value={nuevoPinInput}
                    onChange={(e) => setNuevoPinInput(e.target.value)}
                    className="w-full bg-slate-950 border border-amber-500/30 focus:border-amber-400 rounded-xl pl-10 pr-4 py-3 text-slate-100 text-sm focus:outline-none tracking-widest"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-extrabold text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all transform active:scale-98"
              >
                Guardar Usuario en la Nube
              </button>
            </form>
          )}

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-24 md:pb-8 selection:bg-amber-500 selection:text-slate-950">
      
      {/* HEADER PRINCIPAL GOLD */}
      <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-amber-500/20">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-sm md:text-base leading-tight bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-400 bg-clip-text text-transparent">
                  Control Entradas Fiesta Pro Fondos - NOZIVA - 06/11/2026
                </h1>
              </div>
              <p className="text-[11px] text-amber-400/80 font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3 inline text-amber-400" />
                <span>GOLD PROMO 50 • Entrada: $5</span>
              </p>
            </div>
          </div>

          {/* Botones Header */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setTempMetaInput(metaEntradas.toString());
                setShowConfigModal(true);
              }}
              className="p-2 text-amber-400/80 hover:text-amber-200 hover:bg-slate-900 rounded-xl transition-colors"
              title="Configurar Meta"
            >
              <Target className="w-5 h-5" />
            </button>

            <button
              onClick={() => {
                setVendedoraActual('');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-amber-500/30 rounded-xl text-xs font-semibold text-amber-200 transition-colors"
              title="Cambiar integrante"
            >
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span className="max-w-[90px] truncate">{vendedoraActual}</span>
              <LogOut className="w-3 h-3 text-slate-500 ml-0.5" />
            </button>
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-5xl mx-auto px-4 pt-4 space-y-6">

        {/* NOTIFICACIÓN COPIADO */}
        {copiadoNotif && (
          <div className="fixed top-16 right-4 z-50 bg-amber-400 text-slate-950 font-extrabold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce border border-yellow-200">
            <CheckCircle2 className="w-5 h-5" />
            <span>¡Resumen copiado para WhatsApp!</span>
          </div>
        )}

        {/* NAVEGACIÓN Y ACCIÓN */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-2xl border border-amber-500/20">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'dashboard'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-amber-200'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Resumen</span>
            </button>
            <button
              onClick={() => setActiveTab('ventas')}
              className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'ventas'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-amber-200'
              }`}
            >
              <Ticket className="w-4 h-4" />
              <span>Registros ({ventas.length})</span>
            </button>
          </div>

          <button
            onClick={handleOpenNuevaVenta}
            className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-extrabold text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all transform active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nueva Venta ($5)</span>
          </button>
        </div>

        {/* CARD BIENVENIDA GOLD */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/30 p-5 md:p-6 shadow-2xl">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-extrabold px-2.5 py-1 bg-amber-500/20 text-amber-300 rounded-lg border border-amber-500/30 inline-block mb-2 uppercase tracking-wider">
                👑 Sesión Gold: {vendedoraActual}
              </span>
              <h2 className="text-xl md:text-2xl font-black text-amber-100">
                Fiesta Pro Fondos NOZIVA
              </h2>
              <p className="text-xs md:text-sm text-slate-300 mt-1">
                Entradas fijas a <b className="text-amber-300">$5</b> • Métodos: <span className="text-amber-200 font-semibold">Binance y Efectivo</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={copiarResumenWhatsApp}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-200 rounded-xl border border-amber-500/30 text-xs font-bold transition-colors"
              >
                <Share2 className="w-4 h-4 text-amber-400" />
                <span>Reporte WhatsApp</span>
              </button>

              <button
                onClick={handleOpenNuevaVenta}
                className="flex md:hidden items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-amber-500/20"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Registrar Venta</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* VISTA 1: DASHBOARD / RESUMEN */}
        {/* ========================================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            
            {/* TARJETAS DE MÉTRICAS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              
              {/* Recaudado */}
              <div className="bg-slate-900/90 border border-amber-500/20 rounded-2xl p-4 flex flex-col justify-between shadow-lg">
                <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                  <span>Total Recaudado</span>
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2">
                  <div className="text-2xl md:text-3xl font-black text-amber-300">
                    ${metricas.totalRecaudado}
                  </div>
                  <p className="text-[10px] text-emerald-400 font-semibold mt-0.5">
                    Pago confirmado
                  </p>
                </div>
              </div>

              {/* Entradas Vendidas */}
              <div className="bg-slate-900/90 border border-amber-500/20 rounded-2xl p-4 flex flex-col justify-between shadow-lg">
                <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                  <span>Vendidas</span>
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Ticket className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2">
                  <div className="text-2xl md:text-3xl font-black text-white">
                    {metricas.totalEntradasVendidas}
                  </div>
                  <p className="text-[10px] text-amber-400/80 font-semibold mt-0.5">
                    Meta: {metaEntradas} entradas
                  </p>
                </div>
              </div>

              {/* Avance % */}
              <div className="bg-slate-900/90 border border-amber-500/20 rounded-2xl p-4 flex flex-col justify-between shadow-lg">
                <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                  <span>Alcance Meta</span>
                  <div className="p-2 rounded-xl bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2">
                  <div className="text-2xl md:text-3xl font-black text-amber-200">
                    {metricas.porcentajeMeta}%
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full mt-2 overflow-hidden border border-slate-800">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-yellow-300 h-full rounded-full transition-all duration-500"
                      style={{ width: `${metricas.porcentajeMeta}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Por Cobrar */}
              <div className="bg-slate-900/90 border border-amber-500/20 rounded-2xl p-4 flex flex-col justify-between shadow-lg">
                <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                  <span>Por Cobrar</span>
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2">
                  <div className="text-2xl md:text-3xl font-black text-amber-400">
                    ${metricas.totalPendienteMonto}
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                    {metricas.entradasPendientes} entradas pendientes
                  </p>
                </div>
              </div>

            </div>

            {/* SECCIÓN DESGLOSE POR VENDEDORA & ÚLTIMAS VENTAS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* RANKING DE VENDEDORAS GOLD */}
              <div className="bg-slate-900/90 border border-amber-500/20 rounded-3xl p-5 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-extrabold text-amber-200 flex items-center gap-2 text-sm md:text-base">
                    <Award className="w-5 h-5 text-amber-400" />
                    Ventas por Miembro del Comité
                  </h3>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Recaudado</span>
                </div>

                {metricas.rankingVendedoras.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs">
                    Aún no hay ventas registradas
                  </div>
                ) : (
                  <div className="space-y-3">
                    {metricas.rankingVendedoras.map((v, index) => {
                      const maxEntradas = metricas.rankingVendedoras[0]?.entradas || 1;
                      const porcentajeRelativo = Math.round((v.entradas / maxEntradas) * 100);

                      return (
                        <div key={v.nombre} className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3">
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="font-bold text-slate-200 flex items-center gap-2">
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                                index === 0 
                                  ? 'bg-amber-400 text-slate-950 font-black' 
                                  : 'bg-slate-800 text-slate-300'
                              }`}>
                                {index + 1}
                              </span>
                              {v.nombre}
                            </span>
                            <div className="text-right">
                              <span className="font-extrabold text-amber-300">{v.entradas} entradas</span>
                              <span className="text-slate-400 ml-1.5 font-semibold">(${v.recaudado})</span>
                            </div>
                          </div>
                          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-amber-500 to-yellow-300 h-full rounded-full transition-all duration-500"
                              style={{ width: `${porcentajeRelativo}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ÚLTIMOS REGISTROS EN TIEMPO REAL */}
              <div className="bg-slate-900/90 border border-amber-500/20 rounded-3xl p-5 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-extrabold text-amber-200 flex items-center gap-2 text-sm md:text-base">
                      <Clock className="w-5 h-5 text-amber-400" />
                      Últimos Registros
                    </h3>
                    <button
                      onClick={() => setActiveTab('ventas')}
                      className="text-xs font-bold text-amber-400 hover:underline"
                    >
                      Ver todos →
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {ventas.slice(0, 4).map((item) => (
                      <div
                        key={item.id}
                        className="bg-slate-950/60 border border-slate-800 p-3 rounded-2xl flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-slate-100 truncate">
                            {item.comprador}
                          </p>
                          <p className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span className="text-amber-300/90 font-semibold">{item.cantidad} ent. (${item.montoTotal})</span>
                            <span>•</span>
                            <span className="text-slate-400">{item.metodoPago}</span>
                          </p>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                            item.estadoPago === 'PAGADO'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {item.estadoPago}
                        </span>
                      </div>
                    ))}

                    {ventas.length === 0 && (
                      <div className="text-center py-12 text-slate-500 text-xs">
                        No hay ventas registradas. ¡Haz clic en "Nueva Venta"!
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 text-center">
                  <p className="text-[11px] text-amber-300/70">
                    ⚡ Se sincroniza automáticamente para todas las compañeras del comité.
                  </p>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* VISTA 2: LISTA DE ENTRADAS (REGISTROS) */}
        {/* ========================================== */}
        {activeTab === 'ventas' && (
          <div className="space-y-4">
            
            {/* BUSCADOR Y FILTROS */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por comprador, vendedora o teléfono..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-amber-500/20 rounded-2xl pl-10 pr-4 py-2.5 text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* FILTRO ESTADO */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 border border-amber-500/20 rounded-2xl self-start sm:self-auto">
                <button
                  onClick={() => setStatusFilter('TODAS')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    statusFilter === 'TODAS'
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-400 hover:text-amber-200'
                  }`}
                >
                  Todas
                </button>
                <button
                  onClick={() => setStatusFilter('PAGADO')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    statusFilter === 'PAGADO'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-amber-200'
                  }`}
                >
                  Pagadas
                </button>
                <button
                  onClick={() => setStatusFilter('PENDIENTE')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    statusFilter === 'PENDIENTE'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-slate-400 hover:text-amber-200'
                  }`}
                >
                  Pendientes
                </button>
              </div>
            </div>

            {/* LISTA DE ENTRADAS */}
            {loading ? (
              <div className="text-center py-16 text-amber-400/70 flex flex-col items-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
                <span className="text-xs font-semibold">Cargando datos en tiempo real...</span>
              </div>
            ) : ventasFiltradas.length === 0 ? (
              <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 text-center text-slate-500 space-y-2">
                <Ticket className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-sm font-bold text-slate-400">No se encontraron registros</p>
                <p className="text-xs text-slate-600">Intenta cambiar el término de búsqueda o filtro.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {ventasFiltradas.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-900 border border-amber-500/20 hover:border-amber-500/40 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-lg transition-all"
                  >
                    <div>
                      {/* Cabecera Tarjeta */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-extrabold text-slate-100 text-sm md:text-base">
                            {item.comprador}
                          </h4>
                        </div>

                        {/* Toggle Estado */}
                        <button
                          onClick={(e) => toggleEstadoPago(e, item)}
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold flex items-center gap-1 border transition-transform active:scale-95 ${
                            item.estadoPago === 'PAGADO'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                          }`}
                          title="Haz clic para cambiar estado"
                        >
                          {item.estadoPago === 'PAGADO' ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <AlertCircle className="w-3 h-3" />
                          )}
                          <span>{item.estadoPago}</span>
                        </button>
                      </div>

                      {/* Detalle */}
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 mt-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                        <div>
                          <span className="text-[10px] text-slate-500 block">Entradas / Total</span>
                          <span className="font-black text-amber-300">
                            {item.cantidad} ent. (${item.montoTotal})
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Método de Pago</span>
                          <span className="font-bold text-slate-200">{item.metodoPago || 'Binance'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Teléfono / WhatsApp</span>
                          <span className="font-semibold text-slate-200">
                            {item.telefono ? (
                              <a
                                href={`https://wa.me/${item.telefono.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-emerald-400 hover:underline flex items-center gap-1 font-bold"
                              >
                                <Phone className="w-3 h-3 inline" />
                                {item.telefono}
                              </a>
                            ) : (
                              'No registrado'
                            )}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Registrado Por</span>
                          <span className="font-bold text-amber-200/90">{item.vendedora || 'Comité'}</span>
                        </div>
                      </div>

                      {item.notas && (
                        <p className="text-[11px] text-slate-400 italic mt-2 bg-slate-950/40 px-2.5 py-1 rounded-lg">
                          " {item.notas} "
                        </p>
                      )}
                    </div>

                    {/* Acciones Editar / Eliminar */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                      <span className="text-[10px] text-slate-500">
                        {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Reciente'}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => handleStartEdit(e, item)}
                          className="p-2 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded-xl transition-colors"
                          title="Editar Registro"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* MODO CONFIRMACIÓN INLINE DE ELIMINACIÓN */}
                        {confirmDeleteId === item.id ? (
                          <div className="flex items-center gap-1 bg-rose-950/80 border border-rose-500/50 p-1 rounded-xl">
                            <button
                              type="button"
                              disabled={deletingId === item.id}
                              onClick={() => executeDelete(item.id)}
                              className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white font-black text-[10px] rounded-lg shadow-md transition-all flex items-center gap-1"
                            >
                              {deletingId === item.id ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <span>¿Confirmar?</span>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="p-1 text-slate-400 hover:text-slate-200"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(item.id)}
                            className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-500/20 hover:border-rose-500/40 rounded-xl transition-colors"
                            title="Eliminar Registro"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* BOTÓN FLOTANTE REGISTRAR PARA MÓVIL */}
      <div className="fixed bottom-6 right-6 md:hidden z-40">
        <button
          onClick={handleOpenNuevaVenta}
          className="p-4 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 rounded-full shadow-2xl shadow-amber-500/40 border border-yellow-200 flex items-center justify-center active:scale-95 transition-transform"
        >
          <Plus className="w-7 h-7 stroke-[3]" />
        </button>
      </div>

      {/* MODAL REGISTRO / EDICIÓN */}
      {modalNuevaVenta && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/30 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-amber-200 text-base flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                {editingVenta ? 'Editar Entrada' : 'Registrar Nueva Venta ($5)'}
              </h3>
              <button
                onClick={() => setModalNuevaVenta(false)}
                className="p-1 text-slate-400 hover:text-amber-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitVenta} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Nombre del Comprador *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Carlos Gómez"
                  value={formVenta.comprador}
                  onChange={(e) => setFormVenta({ ...formVenta, comprador: e.target.value })}
                  className="w-full bg-slate-950 border border-amber-500/20 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-slate-100 placeholder-slate-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Cantidad de Entradas
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={formVenta.cantidad}
                    onChange={(e) => setFormVenta({ ...formVenta, cantidad: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="w-full bg-slate-950 border border-amber-500/20 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-slate-100 focus:outline-none font-extrabold"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Monto Total ($)
                  </label>
                  <div className="w-full bg-slate-950 border border-amber-500/40 rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-amber-300 font-black flex items-center justify-between">
                    <span>${formVenta.cantidad * PRECIO_ENTRADA_FIX}</span>
                    <span className="text-[10px] text-slate-500 font-normal">($5 c/u)</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Método de Pago
                  </label>
                  <select
                    value={formVenta.metodoPago}
                    onChange={(e) => setFormVenta({ ...formVenta, metodoPago: e.target.value })}
                    className="w-full bg-slate-950 border border-amber-500/20 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-slate-100 focus:outline-none"
                  >
                    <option value="Binance">Binance</option>
                    <option value="Efectivo">Efectivo</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Estado de Pago
                  </label>
                  <select
                    value={formVenta.estadoPago}
                    onChange={(e) => setFormVenta({ ...formVenta, estadoPago: e.target.value })}
                    className="w-full bg-slate-950 border border-amber-500/20 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-slate-100 focus:outline-none"
                  >
                    <option value="PAGADO">PAGADO</option>
                    <option value="PENDIENTE">PENDIENTE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Teléfono / WhatsApp (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: +584121234567"
                  value={formVenta.telefono}
                  onChange={(e) => setFormVenta({ ...formVenta, telefono: e.target.value })}
                  className="w-full bg-slate-950 border border-amber-500/20 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-slate-100 placeholder-slate-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Notas adicionales
                </label>
                <input
                  type="text"
                  placeholder="Ej: Entregada en físico / Pago verificado"
                  value={formVenta.notas}
                  onChange={(e) => setFormVenta({ ...formVenta, notas: e.target.value })}
                  className="w-full bg-slate-950 border border-amber-500/20 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-slate-100 placeholder-slate-600 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalNuevaVenta(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-yellow-300 transition-all"
                >
                  {editingVenta ? 'Guardar Cambios' : 'Registrar Venta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIGURACIÓN META */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/30 w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-amber-200 text-sm flex items-center gap-2">
                <Settings className="w-4 h-4 text-amber-400" />
                Configurar Meta de Entradas
              </h3>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1 text-slate-400 hover:text-amber-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-300 block">
                Meta Total de Entradas:
              </label>
              <input
                type="number"
                min="10"
                value={tempMetaInput}
                onChange={(e) => setTempMetaInput(e.target.value)}
                className="w-full bg-slate-950 border border-amber-500/30 focus:border-amber-400 rounded-xl px-4 py-2.5 text-slate-100 font-extrabold text-sm focus:outline-none"
              />
              <p className="text-[11px] text-slate-500">
                La meta actual está fijada en {metaEntradas} entradas ($
                {metaEntradas * PRECIO_ENTRADA_FIX}).
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const val = parseInt(tempMetaInput);
                  if (val && val > 0) {
                    setMetaEntradas(val);
                  }
                  setShowConfigModal(false);
                }}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md"
              >
                Actualizar Meta
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
