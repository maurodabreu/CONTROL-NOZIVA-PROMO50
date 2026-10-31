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
