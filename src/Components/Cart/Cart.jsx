import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import baseURL from '../url';
import './Cart.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faShoppingCart, faTrash } from '@fortawesome/free-solid-svg-icons';
import { Link as Anchor } from "react-router-dom";
import moneda from '../moneda';
import Swal from 'sweetalert2';
import MiPedido from '../MiPedido/MiPedido';

// Asegúrate de que el modal se vincule a tu app para accesibilidad
Modal.setAppElement('#root');

export default function Cart() {
    // --- SIN CAMBIOS --- (Todos tus estados se mantienen)
    const [cartItems, setCartItems] = useState([]);
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [modalIsOpen2, setModalIsOpen2] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [noteText, setNoteText] = useState('');
    const [name, setName] = useState('');
    const [telefono, setTelefono] = useState('');
    const [codigo, setCodigo] = useState('');
    const [tienda, setTienda] = useState([]);
    const [totalPrice, setTotalPrice] = useState(0);
    const [metodos, setMetodos] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('');
    const [pagoRecibir, setPagoRecibir] = useState('');
    const [estado, setEstado] = useState(null);
    const [mensaje, setMensaje] = useState('');
    const [mesas, setMesas] = useState([]);
    const [idMesa, setIdMesa] = useState(''); // Usaremos esto para el <select>

    // --- SIN CAMBIOS --- (Hooks de efecto y funciones de carga iniciales)
    useEffect(() => {
        cargarTienda();
        const fetchEstado = async () => {
            try {
                const response = await fetch(`${baseURL}/estado.php`);
                const data = await response.json();
                setEstado(data.estado);
            } catch (error) {
                console.error("Error al obtener el estado:", error);
            }
        };
        fetchEstado();
    }, []);

    useEffect(() => {
        if (isFocused) {
            cargarMetodos();
            cargarProductos();
        }
    }, [isFocused]);

    useEffect(() => {
        const fetchCartItems = async () => {
            const cart = JSON.parse(localStorage.getItem('cart')) || [];
            if (productos.length > 0) {
                const items = cart.map(cartItem => {
                    const producto = productos.find(p => p.idProducto === cartItem.idProducto);
                    return { ...producto, ...cartItem };
                });
                setCartItems(items);
                setLoading(false);
            }
        };
        fetchCartItems();
    }, [productos, isFocused]);

    useEffect(() => {
        const total = cartItems.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
        setTotalPrice(total);
    }, [cartItems]);

    // --- SIN CAMBIOS --- (Funciones de carga de datos)
    const cargarTienda = () => {
        fetch(`${baseURL}/tiendaGet.php`)
            .then(res => res.json())
            .then(data => setTienda(data.tienda.reverse() || []))
            .catch(error => console.error('Error al cargar tienda:', error));
    };

    const cargarMetodos = () => {
        fetch(`${baseURL}/metodoGet.php`)
            .then(res => res.json())
            .then(data => {
                const metodosActivos = (data.metodos || []).filter(m => m.estado === 'Activo');
                setMetodos(metodosActivos);
                if (metodosActivos.length > 0) {
                    setPaymentMethod(metodosActivos[0].tipo);
                }
            })
            .catch(error => console.error('Error al cargar metodos:', error));
    };

    const cargarProductos = () => {
        fetch(`${baseURL}/productosGet.php`)
            .then(res => res.json())
            .then(data => setProductos(data.productos || []))
            .catch(error => console.error('Error al cargar productos:', error));
    };

    // --- CORRECCIÓN PRINCIPAL ---
    // Esta función ahora es ASÍNCRONA y se encarga de todo el flujo
    const handlePedirEnMesaClick = async () => {
        setMensaje('Cargando mesas...'); // Muestra un feedback al usuario
        try {
            const response = await fetch(`${baseURL}/mesaGet.php`);
            const data = await response.json();
            
            // Filtramos las mesas directamente aquí para asegurar que solo las libres se muestren
            const mesasLibres = data.mesas ? data.mesas.filter(m => m.estado === 'libre') : [];
            
            if (mesasLibres.length > 0) {
                setMesas(mesasLibres);
                setModalIsOpen2(true); // Abre el modal SOLO DESPUÉS de tener las mesas
            } else {
                 Swal.fire('No hay mesas', 'Actualmente no hay mesas disponibles.', 'warning');
            }

        } catch (error) {
            console.error('Error al cargar mesas:', error);
            Swal.fire('Error', 'No se pudieron cargar las mesas. Intente de nuevo.', 'error');
        } finally {
            setMensaje(''); // Limpia el mensaje de carga
        }
    };

    // --- SIN CAMBIOS --- (Funciones del modal y carrito)
    const openModal = () => {
        setModalIsOpen(true);
        setIsFocused(true);
    };
    const closeModal = () => setModalIsOpen(false);
    const closeModal2 = () => setModalIsOpen2(false);

    const removeFromCart = (id) => {
        const updatedCart = cartItems.filter(item => item.idProducto !== id);
        setCartItems(updatedCart);
        localStorage.setItem('cart', JSON.stringify(updatedCart.map(item => ({ idProducto: item.idProducto, cantidad: item.cantidad, items: item.items }))));
    };

    const clearCart = () => {
        setCartItems([]);
        localStorage.removeItem('cart');
    };

    const increaseQuantity = (id) => {
        const updatedCart = cartItems.map(item =>
            item.idProducto === id ? { ...item, cantidad: item.cantidad + 1 } : item
        );
        setCartItems(updatedCart);
        localStorage.setItem('cart', JSON.stringify(updatedCart.map(item => ({ idProducto: item.idProducto, cantidad: item.cantidad, items: item.items }))));
    };

    const decreaseQuantity = (id) => {
        const updatedCart = cartItems.map(item =>
            item.idProducto === id && item.cantidad > 1 ? { ...item, cantidad: item.cantidad - 1 } : item
        );
        setCartItems(updatedCart);
        localStorage.setItem('cart', JSON.stringify(updatedCart.map(item => ({ idProducto: item.idProducto, cantidad: item.cantidad, items: item.items }))));
    };

    const obtenerImagen = (item) => item.imagen1 || item.imagen2 || item.imagen3 || item.imagen4 || null;

    // --- FUNCIÓN DE CREAR PEDIDO (Con pequeña mejora) ---
    const crearPedido = async () => {
        if (!name || !telefono || !idMesa) {
            Swal.fire('Campos incompletos', 'Por favor, completa tu nombre, teléfono y selecciona una mesa.', 'warning');
            return;
        }
        setMensaje('Procesando...');

        const mesaSeleccionada = mesas.find(mes => mes.idMesa === idMesa);

        const formData = new FormData();
        formData.append('idMesa', idMesa);
        formData.append('productos', JSON.stringify(cartItems.map(item => ({
            idProducto: item.idProducto,
            titulo: item.titulo,
            cantidad: item.cantidad,
            items: item.items,
            precio: item.precio,
            imagen: obtenerImagen(item),
            estado: 'Pendiente'
        }))));
        formData.append('total', totalPrice);
        formData.append('nombre', name);
        formData.append('telefono', telefono);
        formData.append('entrega', `Mesa: ${mesaSeleccionada?.mesa}`); // Mejoramos el dato que se envía
        formData.append('pago', paymentMethod);
        formData.append('nota', noteText);
        formData.append('codigo', codigo);
        formData.append('estado', 'Pendiente');
        formData.append('pagado', 'No');
        formData.append('pagoRecibir', pagoRecibir);

        try {
            const response = await fetch(`${baseURL}/pedidoPost.php`, { method: 'POST', body: formData });
            const data = await response.json();
            if (data.idPedido) {
                Swal.fire('Pedido enviado!', `Pedido N°${data.idPedido} creado con éxito.`, 'success');
                localStorage.setItem('idPedido', data.idPedido);
                clearCart();
                closeModal();
                closeModal2();
            } else {
                Swal.fire('Error', data.error || 'No se pudo crear el pedido.', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            Swal.fire('Error', 'Error de conexión. Por favor, inténtelo de nuevo.', 'error');
        } finally {
            setMensaje('');
        }
    };
    
    // --- RENDERIZADO DEL COMPONENTE (JSX) ---
    return (
        <div>
            <button onClick={openModal} className='cartIconFixed'>
                {cartItems.length > 0 && <span>{cartItems.reduce((acc, item) => acc + item.cantidad, 0)}</span>}
                <FontAwesomeIcon icon={faShoppingCart} />
            </button>

            {/* MODAL PRINCIPAL DEL CARRITO */}
            <Modal isOpen={modalIsOpen} onRequestClose={closeModal} className="modal-cart" overlayClassName="overlay-cart">
                <div className='deFLex'>
                    <button onClick={closeModal}><FontAwesomeIcon icon={faArrowLeft} /></button>
                    <MiPedido />
                </div>

                {estado === 'Abierto' ? (
                    <>
                        {cartItems.length === 0 ? (
                            <p className='nohay'>No hay productos</p>
                        ) : (
                            <>
                                <div className="modal-content-cart">
                                    {cartItems.map(item => (
                                        <div key={item.idProducto} className='cardProductCart'>
                                            <img src={obtenerImagen(item)} alt={item.titulo} />
                                            <div className='cardProductCartText'>
                                                <h3>{item.titulo}</h3>
                                                {item.items && <span>{item.items.join(', ')}</span>}
                                                <strong>{moneda} {item.precio * item.cantidad}</strong>
                                            </div>
                                            <div className='deColumn'>
                                                <button onClick={() => removeFromCart(item.idProducto)} className='deleteCart'><FontAwesomeIcon icon={faTrash} /></button>
                                                <div className='deFlexCantidad'>
                                                    <button onClick={() => decreaseQuantity(item.idProducto)}>-</button>
                                                    <span>{item.cantidad}</span>
                                                    <button onClick={() => increaseQuantity(item.idProducto)}>+</button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className='deColumnCart'>
                                    <h4>Total: {moneda} {totalPrice}</h4>
                                    
                                    {/* --- CORRECCIÓN EN EL BOTÓN --- */}
                                    {/* Ahora este botón llama a la función corregida */}
                                    <button className='btn' onClick={handlePedirEnMesaClick}>
                                        Pedir en Mesa
                                    </button>
                                    
                                    {/* Aquí iría el botón de "Pedir para llevar" si lo tuvieras */}
                                </div>
                            </>
                        )}
                    </>
                ) : (
                    <p className='nohay'>El establecimiento se encuentra<br />cerrado en estos momentos.</p>
                )}
            </Modal>

            {/* MODAL PARA FINALIZAR PEDIDO EN MESA */}
            <Modal isOpen={modalIsOpen2} onRequestClose={closeModal2} className="modal-cart" overlayClassName="overlay-cart">
                <div className='deFLex'>
                    <button onClick={closeModal2}><FontAwesomeIcon icon={faArrowLeft} /></button>
                    <h4>(*) Campos obligatorios</h4>
                </div>
                <div className="modal-send-form">
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder='Apellido y Nombre (*)' />
                    <input type="number" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder='Teléfono / WhatsApp (*)' />

                    {/* --- CORRECCIÓN: USAR UN SELECT PARA LAS MESAS --- */}
                    <div className='mesasGrapCart'>
                        <select id="idMesa" value={idMesa} onChange={(e) => setIdMesa(e.target.value)} className="idMesa">
                            <option value="" disabled>Selecciona una mesa (*)</option>
                            {mesas.map((item) => (
                                <option key={item.idMesa} value={item.idMesa}>
                                    {item.mesa}
                                </option>
                            ))}
                        </select>
                    </div>

                    <textarea placeholder="Agrega aquí alguna nota para tu pedido" value={noteText} onChange={(e) => setNoteText(e.target.value)} />
                    
                    {mensaje ? (
                        <button type='button' className='btn' disabled>{mensaje}</button>
                    ) : (
                        <button type='button' onClick={crearPedido} className='btn'>Finalizar pedido</button>
                    )}
                </div>
            </Modal>
        </div>
    );
}