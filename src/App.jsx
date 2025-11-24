import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, addDoc, updateDoc, 
  doc, onSnapshot, query, serverTimestamp, deleteDoc, getDocs 
} from 'firebase/firestore';
import { 
  getAuth, signInAnonymously, onAuthStateChanged 
} from 'firebase/auth';
import { 
  ChefHat, User, Plus, Minus, Trash2, 
  Clock, DollarSign, RefreshCw, LayoutDashboard,
  CheckSquare, ArrowRightCircle, X, Eye, Image as ImageIcon, AlertTriangle
} from 'lucide-react';

// --- CONFIGURACIÓN FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyBEExNnqpZqiA3lXuMd5dLS754E5OmBt50",
  authDomain: "maestromarcelino.firebaseapp.com",
  projectId: "maestromarcelino",
  storageBucket: "maestromarcelino.firebasestorage.app",
  messagingSenderId: "338967235588",
  appId: "1:338967235588:web:b6e35c48b1b90945ffb951",
  measurementId: "G-37WFVGXLKT"
};

// Inicialización
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Menú (Estructura lista para imágenes futuras)
const MENU_ITEMS = [
  { id: 1, name: 'Cerveza', price: 2.50, category: 'Bebidas' },
  { id: 2, name: 'Refresco', price: 2.00, category: 'Bebidas' },
  { id: 3, name: 'Vino Tinto', price: 3.50, category: 'Bebidas' },
  { id: 4, name: 'Bravas', price: 6.00, category: 'Tapas' },
  { id: 5, name: 'Croquetas (6ud)', price: 8.00, category: 'Tapas' },
  { id: 6, name: 'Ensalada Mixta', price: 7.50, category: 'Entrantes' },
  { id: 7, name: 'Hamburguesa', price: 12.00, category: 'Principal' },
  { id: 8, name: 'Entrecot', price: 18.00, category: 'Principal' },
  { id: 9, name: 'Tarta de Queso', price: 5.50, category: 'Postres' },
  { id: 10, name: 'Café', price: 1.50, category: 'Bebidas' },
  { id: 11, name: 'Caña', price: 1.80, category: 'Bebidas' }
];

const ORDER_STATUS = {
  PENDING: 'pendiente',  
  READY: 'listo',        
  DELIVERED: 'servido',  
  PAID: 'pagado'         
};

// --- COMPONENTES UI ---

// Modal simple para ver el detalle
const OrderDetailModal = ({ order, onClose, onCloseOrder }) => {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
          <div>
            <h2 className="text-2xl font-bold">Mesa {order.table}</h2>
            <p className="text-blue-100 text-sm">
              {order.timestamp ? new Date(order.timestamp.seconds * 1000).toLocaleString() : ''}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-blue-700 rounded-full transition-colors">
            <X size={28} />
          </button>
        </div>

        {/* Body Scrollable */}
        <div className="p-6 overflow-y-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200 text-gray-500 text-sm uppercase">
                <th className="py-2 text-gray-700">Cant.</th>
                <th className="py-2 text-gray-700">Producto</th>
                <th className="py-2 text-right text-gray-700">P. Unit</th>
                <th className="py-2 text-right text-gray-700">Total</th>
              </tr>
            </thead>
            <tbody className="text-lg">
              {order.items.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-100">
                  <td className="py-3 font-bold text-gray-900">{item.qty}</td>
                  <td className="py-3 text-gray-900">{item.name}</td>
                  <td className="py-3 text-right text-gray-600">{item.price.toFixed(2)}€</td>
                  <td className="py-3 text-right font-medium text-gray-900">{(item.price * item.qty).toFixed(2)}€</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="mt-6 flex justify-end items-center gap-4 pt-4 border-t-2 border-gray-100">
             <span className="text-gray-600 text-lg uppercase font-bold">Total Comanda:</span>
             <span className="text-4xl font-bold text-blue-600">{order.total?.toFixed(2)}€</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
           <span className={`px-3 py-1 rounded-full text-sm font-bold uppercase ${
              order.status === ORDER_STATUS.PENDING ? 'bg-yellow-100 text-yellow-800' : 
              order.status === ORDER_STATUS.READY ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'
            }`}>
              Estado: {order.status}
           </span>
           <button 
             onClick={() => onCloseOrder(order.id)}
             className="bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-lg font-bold shadow-lg flex items-center gap-2 transform active:scale-95 transition-all"
           >
             <CheckSquare size={20}/> YA ANOTADO EN PC (CERRAR)
           </button>
        </div>
      </div>
    </div>
  );
};

const RoleSelector = ({ onSelectRole }) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-4">
    <div className="max-w-md w-full bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-700">
      <h1 className="text-3xl font-bold text-white text-center mb-8">Restaurante Marcelino</h1>
      <div className="space-y-4">
        <button onClick={() => onSelectRole('waiter')} className="w-full flex items-center justify-center gap-3 p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg">
          <User size={24} /> Camarero
        </button>
        <button onClick={() => onSelectRole('kitchen')} className="w-full flex items-center justify-center gap-3 p-4 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold text-lg">
          <ChefHat size={24} /> Cocina
        </button>
        <button onClick={() => onSelectRole('admin')} className="w-full flex items-center justify-center gap-3 p-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-lg">
          <LayoutDashboard size={24} /> Admin
        </button>
      </div>
    </div>
  </div>
);

const WaiterInterface = ({ user }) => {
  const [table, setTable] = useState('');
  const [cart, setCart] = useState([]);
  const [activeTab, setActiveTab] = useState('menu'); 
  const [activeOrders, setActiveOrders] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'orders'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setActiveOrders(orders.filter(o => o.status !== ORDER_STATUS.PAID));
    }, (error) => console.error("Error snapshot camarero:", error));
    return () => unsubscribe();
  }, [user]);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const updateQty = (itemId, delta) => {
    setCart(prev => prev.map(i => i.id === itemId ? { ...i, qty: Math.max(1, i.qty + delta) } : i));
  };

  const removeFromCart = (itemId) => setCart(prev => prev.filter(i => i.id !== itemId));

  const sendOrder = async () => {
    if (!table || cart.length === 0) return alert('Indica mesa y productos');
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'orders'), {
        table,
        items: cart,
        status: ORDER_STATUS.PENDING,
        timestamp: serverTimestamp(),
        total: cart.reduce((sum, i) => sum + (i.price * i.qty), 0),
        waiterId: user.uid
      });
      setCart([]);
      setTable('');
      setActiveTab('active');
    } catch (e) {
      console.error(e);
      alert('Error al enviar: ' + e.message);
    }
    setSubmitting(false);
  };

  const markDelivered = async (orderId) => {
    await updateDoc(doc(db, 'orders', orderId), { status: ORDER_STATUS.DELIVERED });
  };

  const cartTotal = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="bg-blue-600 text-white p-4 flex justify-between items-center shadow-md">
        <h2 className="font-bold text-lg">Camarero</h2>
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('menu')} className={`px-3 py-1 rounded ${activeTab === 'menu' ? 'bg-white text-blue-600' : 'bg-blue-500'}`}>Carta</button>
          <button onClick={() => setActiveTab('active')} className={`px-3 py-1 rounded ${activeTab === 'active' ? 'bg-white text-blue-600' : 'bg-blue-500'}`}>Activas ({activeOrders.length})</button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 pb-48 md:pb-32">
        {activeTab === 'menu' ? (
          <>
            <div className="mb-4">
              <input type="number" value={table} onChange={(e) => setTable(e.target.value)} placeholder="Nº Mesa" className="w-full p-3 border rounded-lg text-lg text-black outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="grid grid-cols-1 gap-3 mb-6">
              {MENU_ITEMS.map(item => (
                <button 
                  key={item.id} 
                  onClick={() => addToCart(item)} 
                  className="bg-white p-2 rounded-lg shadow border border-gray-200 active:bg-blue-50 flex items-center gap-3 text-left"
                >
                  {/* Placeholder para Imagen - Cambia esto por <img> en el futuro */}
                  <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center text-gray-400 flex-shrink-0">
                    <ImageIcon size={24} />
                  </div>
                  
                  <div className="flex-1">
                    {/* FORZAMOS TEXTO NEGRO PARA QUE SE LEA */}
                    <div className="font-bold text-gray-900 text-lg leading-tight">{item.name}</div>
                    <div className="text-gray-600 text-sm font-medium">{item.price.toFixed(2)}€</div>
                  </div>
                  <div className="bg-blue-50 p-2 rounded-full text-blue-600">
                    <Plus size={20}/>
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            {activeOrders.sort((a,b) => b.timestamp?.seconds - a.timestamp?.seconds).map(order => (
              <div key={order.id} className="bg-white p-4 rounded-lg shadow border">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-lg text-gray-900">Mesa {order.table}</span>
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase 
                    ${order.status === ORDER_STATUS.READY ? 'bg-green-100 text-green-800 animate-pulse' : 'bg-gray-100 text-gray-800'}
                    ${order.status === ORDER_STATUS.DELIVERED ? 'bg-gray-200 text-gray-500' : ''}
                  `}>
                    {order.status}
                  </span>
                </div>
                <ul className="text-sm text-gray-800 mb-3">{order.items.map((it, idx) => <li key={idx}>{it.qty}x {it.name}</li>)}</ul>
                <div className="flex justify-end gap-2">
                  {order.status === ORDER_STATUS.READY && (
                    <button onClick={() => markDelivered(order.id)} className="bg-green-600 text-white px-3 py-2 rounded font-bold shadow-lg animate-bounce">
                      ¡SERVIR!
                    </button>
                  )}
                  {order.status === ORDER_STATUS.DELIVERED && (
                    <span className="text-gray-500 text-sm italic py-2">Esperando cobro...</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {activeTab === 'menu' && cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow p-4 z-50">
          <div className="mb-3 max-h-48 overflow-auto">
            {cart.map(item => (
              <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                {/* FORZAMOS TEXTO OSCURO AQUI TAMBIEN */}
                <span className="text-base font-medium text-gray-900">{item.name}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQty(item.id, -1)} className="p-1 bg-gray-200 rounded text-gray-800"><Minus size={16}/></button>
                  <span className="text-base font-bold w-6 text-center text-gray-900">{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)} className="p-1 bg-gray-200 rounded text-gray-800"><Plus size={16}/></button>
                  <button onClick={() => removeFromCart(item.id)} className="p-1 text-red-500 ml-2"><Trash2 size={18}/></button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-4 items-center pt-2">
            <div className="text-2xl font-bold text-gray-900">{cartTotal.toFixed(2)}€</div>
            <button onClick={sendOrder} disabled={submitting} className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold shadow text-lg disabled:opacity-50">
              {submitting ? '...' : 'ENVIAR A COCINA'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const KitchenInterface = ({ user }) => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'orders'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const all = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(all.filter(o => [ORDER_STATUS.PENDING].includes(o.status)).sort((a, b) => a.timestamp?.seconds - b.timestamp?.seconds));
    }, (error) => console.error("Error cocina:", error));
    return () => unsubscribe();
  }, [user]);

  const markReady = async (id) => await updateDoc(doc(db, 'orders', id), { status: ORDER_STATUS.READY });

  return (
    <div className="min-h-screen bg-gray-900 text-white p-2">
      <div className="flex justify-between items-center mb-4 p-2 border-b border-gray-700">
        <h2 className="text-2xl font-bold flex items-center gap-2"><ChefHat className="text-orange-500"/> COCINA</h2>
        <span className="bg-gray-800 px-3 py-1 rounded text-sm">{orders.length} Pendientes</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {orders.map(order => (
          <div key={order.id} className="border-l-4 border-yellow-500 rounded bg-gray-800 p-4 shadow-lg">
            <div className="flex justify-between items-start mb-4 border-b border-gray-700 pb-2">
              <span className="block text-4xl font-bold text-white">Mesa {order.table}</span>
              <span className="px-2 py-1 rounded text-xs font-bold uppercase bg-yellow-900 text-yellow-100">PENDIENTE</span>
            </div>
            <ul className="space-y-3 mb-6">
              {order.items.map((item, idx) => (
                <li key={idx} className="flex justify-between items-center text-lg">
                  <span className="font-bold text-white text-2xl">{item.qty}x</span>
                  <span className="text-gray-300 flex-1 ml-3 text-xl">{item.name}</span>
                </li>
              ))}
            </ul>
            <button 
              onClick={() => markReady(order.id)} 
              className="w-full bg-green-600 hover:bg-green-500 py-4 rounded-lg font-bold text-xl transition-colors shadow-lg flex items-center justify-center gap-2"
            >
              <CheckSquare size={24} /> ¡OÍDO! (LISTO)
            </button>
          </div>
        ))}
        {orders.length === 0 && <div className="col-span-full text-center py-20 text-gray-500"><RefreshCw className="mx-auto mb-4 animate-spin-slow" size={48}/><p>Oído cocina, todo limpio.</p></div>}
      </div>
    </div>
  );
};

const AdminInterface = ({ user }) => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(query(collection(db, 'orders')), (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  const activeOrders = orders.filter(o => o.status !== ORDER_STATUS.PAID);
  const totalSales = orders.filter(o => o.status === ORDER_STATUS.PAID).reduce((sum, o) => sum + (o.total || 0), 0);

  const closeOrder = async (orderId) => {
    if(!confirm('¿Seguro que ya has anotado esto en el ordenador principal? Esta comanda desaparecerá de la lista activa.')) return;
    await updateDoc(doc(db, 'orders', orderId), { status: ORDER_STATUS.PAID });
    setSelectedOrder(null);
  };

  // FUNCIÓN PELIGROSA: BORRAR TODO (RESET DEL DÍA)
  const resetDay = async () => {
    const confirmText = prompt("ESTO BORRARÁ TODAS LAS COMANDAS Y PONDRÁ LA CAJA A CERO.\n\nEscribe 'BORRAR' para confirmar:");
    if (confirmText !== 'BORRAR') return alert("Cancelado. No se ha borrado nada.");
    
    const snapshot = await getDocs(collection(db, 'orders'));
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    alert("Día reiniciado correctamente. Caja a 0.");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <OrderDetailModal 
        order={selectedOrder} 
        onClose={() => setSelectedOrder(null)} 
        onCloseOrder={closeOrder}
      />

      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2"><LayoutDashboard /> Panel de Caja</h2>
        </div>

        {/* Sección Crítica: Comandas Abiertas */}
        <div className="mb-10">
          <h3 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">
            <ArrowRightCircle className="text-blue-600"/> Comandas Abiertas (Pase al Ordenador)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {activeOrders.sort((a,b) => a.timestamp?.seconds - b.timestamp?.seconds).map(order => (
              <div 
                key={order.id} 
                onClick={() => setSelectedOrder(order)}
                className="bg-white border-l-4 border-blue-500 rounded-lg shadow-md p-4 cursor-pointer hover:shadow-xl hover:scale-105 transition-all group"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-2xl font-bold text-gray-800 group-hover:text-blue-600">Mesa {order.table}</span>
                    <div className="text-xs text-gray-500 mt-1">
                      {order.timestamp ? new Date(order.timestamp.seconds * 1000).toLocaleTimeString() : ''}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                    order.status === ORDER_STATUS.PENDING ? 'bg-yellow-100 text-yellow-800' : 
                    order.status === ORDER_STATUS.READY ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'
                  }`}>
                    {order.status}
                  </span>
                </div>
                
                <div className="text-gray-500 text-sm mb-4">
                  {order.items.length} productos
                </div>

                <div className="flex justify-between items-center border-t pt-2">
                  <span className="text-xl font-bold text-gray-900">{order.total?.toFixed(2)}€</span>
                  <span className="text-blue-600 text-sm font-medium flex items-center gap-1">
                    <Eye size={16}/> Ver Detalle
                  </span>
                </div>
              </div>
            ))}
            {activeOrders.length === 0 && (
              <div className="col-span-full bg-white p-8 rounded-lg border border-dashed border-gray-300 text-center text-gray-400">
                No hay mesas comiendo ahora mismo.
              </div>
            )}
          </div>
        </div>

        {/* Resumen Histórico */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 border-t pt-8">
          <div className="bg-white p-6 rounded shadow"><h3 className="text-gray-500 text-sm font-bold uppercase">Caja del Día (Cerrada)</h3><p className="text-3xl font-bold text-emerald-600">{totalSales.toFixed(2)}€</p></div>
          <div className="bg-white p-6 rounded shadow"><h3 className="text-gray-500 text-sm font-bold uppercase">Mesas Activas</h3><p className="text-3xl font-bold text-blue-600">{activeOrders.length}</p></div>
        </div>

        {/* ZONA PELIGROSA */}
        <div className="mt-12 p-6 bg-red-50 border border-red-200 rounded-xl">
          <h3 className="text-red-800 font-bold flex items-center gap-2 mb-2"><AlertTriangle/> ZONA DE PELIGRO</h3>
          <p className="text-red-600 text-sm mb-4">Estas acciones son irreversibles. Úsalas solo al cerrar el local.</p>
          <button 
            onClick={resetDay}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded shadow flex items-center gap-2"
          >
            <Trash2/> REINICIAR DÍA (BORRAR TODO)
          </button>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    signInAnonymously(auth).catch(e => console.error("Error Auth:", e));
    return onAuthStateChanged(auth, setUser);
  }, []);

  if (!user) return <div className="flex h-screen items-center justify-center">Conectando a Maestro Marcelino...</div>;
  if (!role) return <RoleSelector onSelectRole={setRole} />;

  return (
    <>
      <div className="fixed top-2 right-2 z-50">
        <button onClick={() => setRole(null)} className="bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">Salir</button>
      </div>
      {role === 'waiter' && <WaiterInterface user={user} />}
      {role === 'kitchen' && <KitchenInterface user={user} />}
      {role === 'admin' && <AdminInterface user={user} />}
    </>
  );
}