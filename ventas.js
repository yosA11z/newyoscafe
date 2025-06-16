// ** CONFIGURACIÓN DE STRIPE **
// ¡TU NUEVA CLAVE PUBLISHABLE DE STRIPE!
const STRIPE_PUBLISHABLE_KEY = "pk_test_51RaTFNRHhRRFfUmqBhlqSYfJ57cTtLgFzYztLCvt6CLgxsvFAvxgoUYXiqAqo9JGLZY10TvBgzMBQVd0tCiClkiy00QHCWm1kq";
// La instancia de Stripe se inicializa aquí
const stripe = Stripe(STRIPE_PUBLISHABLE_KEY);

// Mensajes del sistema
const systemMessageContainer = document.getElementById('systemMessageContainer');

/**
 * Muestra un mensaje al usuario en el contenedor de mensajes del sistema.
 * @param {string} message - El texto del mensaje.
 * @param {'info'|'success'|'error'} type - El tipo de mensaje para aplicar estilos.
 */
function showSystemMessage(message, type = 'info') {
    systemMessageContainer.textContent = message;
    // Elimina todas las clases de tipo antes de añadir la nueva
    systemMessageContainer.classList.remove('hidden', 'success', 'error', 'info', 'bg-green-100', 'text-green-800', 'bg-red-100', 'text-red-800', 'bg-blue-100', 'text-blue-800');
    if (type === 'success') {
        systemMessageContainer.classList.add('bg-green-100', 'text-green-800', 'success');
    } else if (type === 'error') {
        systemMessageContainer.classList.add('bg-red-100', 'text-red-800', 'error');
    } else {
        systemMessageContainer.classList.add('bg-blue-100', 'text-blue-800', 'info');
    }
    systemMessageContainer.classList.remove('hidden'); // Asegura que el mensaje sea visible
}

/**
 * Oculta el contenedor de mensajes del sistema.
 */
function hideSystemMessage() {
    systemMessageContainer.classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
    // Definición de productos con sus respectivos Price IDs de Stripe
    const products = {
        classic: {
            name: "Café Yoscafé Clásico",
            price: 25000, // Precio en COP
            id: 'classic',
            // ID de Precio real de Stripe para Café Yoscafé Clásico
            stripePriceId: 'price_1RaTIdRHhRRFfUmq2K9VWTDy',
            keywords: "clásico, tradicional, medio, suave, chocolate, frutos secos, tostado"
        },
        premium: {
            name: "Café Yoscafé Premium Selección",
            price: 40000,
            id: 'premium',
            // ID de Precio real de Stripe para Café Yoscafé Premium Selección
            stripePriceId: 'price_1RaTJQRHhRRFfUmqKDrV6jrN',
            keywords: "premium, selección, especial, fuerte, intenso, frutal, acidez, floral, exótico"
        },
        decaf: {
            name: "Café Yoscafé Descafeinado",
            price: 30000,
            id: 'decaf',
            // ID de Precio real de Stripe para Café Yoscafé Descafeinado
            stripePriceId: 'price_1RaTKDRHhRRFfUmqEkTuqSUm',
            keywords: "descafeinado, suave, sin cafeína, noche, ligero, tranquilo"
        }
    };

    let cart = []; // Array para almacenar los productos en el carrito

    // Elementos del DOM
    const productCards = document.querySelectorAll('.product-card');
    const cartItemsContainer = document.getElementById('cartItems');
    const cartTotalSpan = document.getElementById('cartTotal');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const emptyCartMessage = document.querySelector('.empty-cart-message');
    const checkoutFormContainer = document.getElementById('checkoutFormContainer');
    const shippingForm = document.getElementById('shippingForm');
    const orderMessage = document.getElementById('orderMessage');

    // Elementos de la barra de búsqueda
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');

    // Campos ocultos para Formspree (se mantendrán por si decides usarlos para el envío de información a Formspree,
    // pero el pago con Stripe los hace menos relevantes para el flujo de checkout directo).
    const orderDetailsHidden = document.getElementById('orderDetailsHidden');
    const orderTotalHidden = document.getElementById('orderTotalHidden');

    // --- Funciones de la Barra de Búsqueda ---

    function filterProducts() {
        const searchTerm = searchInput.value.toLowerCase().trim();

        productCards.forEach(card => {
            const productTitle = card.querySelector('.product-title').textContent.toLowerCase();
            const productDescription = card.querySelector('.product-description').textContent.toLowerCase();
            const productKeywords = card.dataset.keywords ? card.dataset.keywords.toLowerCase() : '';

            if (productTitle.includes(searchTerm) ||
                productDescription.includes(searchTerm) ||
                productKeywords.includes(searchTerm)) {
                card.style.display = 'flex'; // Usar 'flex' si tu CSS lo define así
            } else {
                card.style.display = 'none';
            }
        });
    }

    // --- Funciones del Carrito ---

    function updateCartDisplay() {
        cartItemsContainer.innerHTML = '';
        let total = 0;

        if (cart.length === 0) {
            emptyCartMessage.style.display = 'block';
            checkoutBtn.disabled = true; // Deshabilita el botón de pago si el carrito está vacío
            checkoutBtn.style.backgroundColor = '#cccccc'; // Estilo para botón deshabilitado
            checkoutBtn.style.cursor = 'not-allowed';
        } else {
            emptyCartMessage.style.display = 'none';
            checkoutBtn.disabled = false; // Habilita el botón de pago
            checkoutBtn.style.backgroundColor = ''; // Restablece el estilo
            checkoutBtn.style.cursor = 'pointer';

            cart.forEach(item => {
                const itemTotal = item.price * item.quantity;
                total += itemTotal;

                const cartItemDiv = document.createElement('div');
                cartItemDiv.classList.add('cart-item'); // Asegúrate de que 'ventas.css' tenga estilos para .cart-item
                cartItemDiv.innerHTML = `
                    <div class="item-details">
                        <span>${item.name}</span> x ${item.quantity}
                    </div>
                    <div class="item-price">
                        $ ${(itemTotal).toLocaleString('es-CO')} COP
                        <button class="remove-item-btn" data-product-id="${item.id}"><i class="fas fa-trash-alt"></i> Eliminar</button>
                    </div>
                `;
                cartItemsContainer.appendChild(cartItemDiv);
            });
        }

        cartTotalSpan.textContent = `$ ${total.toLocaleString('es-CO')} COP`;

        // Actualizar campos ocultos para Formspree, si se siguen usando.
        // Estos valores serán los que se envíen si el formulario de envío se activa.
        orderDetailsHidden.value = JSON.stringify(cart.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.price * item.quantity
        })));
        orderTotalHidden.value = total.toLocaleString('es-CO');
    }

    /**
     * Añade un producto al carrito o incrementa su cantidad.
     * @param {string} productId - ID del producto a añadir.
     * @param {number} quantity - Cantidad a añadir.
     */
    function addToCart(productId, quantity) {
        const product = products[productId];
        if (!product || quantity <= 0) {
            showSystemMessage('Error: Producto no encontrado o cantidad inválida.', 'error');
            return;
        }

        const existingItemIndex = cart.findIndex(item => item.id === productId);

        if (existingItemIndex > -1) {
            cart[existingItemIndex].quantity += quantity;
        } else {
            cart.push({ ...product, quantity: quantity });
        }
        updateCartDisplay();
        hideSystemMessage(); // Oculta mensajes si la adición fue exitosa
    }

    /**
     * Elimina un producto del carrito.
     * @param {string} productId - ID del producto a eliminar.
     */
    function removeFromCart(productId) {
        cart = cart.filter(item => item.id !== productId);
        updateCartDisplay();
        hideSystemMessage(); // Oculta mensajes si la eliminación fue exitosa
    }

    // --- Event Listeners ---

    // Añadir al Carrito
    productCards.forEach(card => {
        const productId = card.dataset.productId;
        // Asegúrate de que el ID del input de cantidad sea el correcto, si no es 'qty-PRODUCTID'
        const quantityInput = card.querySelector(`.product-quantity[id="qty-${productId}"]`);
        const addToCartBtn = card.querySelector('.add-to-cart-btn');

        addToCartBtn.addEventListener('click', () => {
            const quantity = parseInt(quantityInput.value);
            addToCart(productId, quantity);
        });
    });

    // Eliminar del Carrito
    cartItemsContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('remove-item-btn') || event.target.closest('.remove-item-btn')) {
            const button = event.target.closest('.remove-item-btn');
            const productId = button.dataset.productId;
            removeFromCart(productId);
        }
    });

    // ** INTEGRACIÓN DE STRIPE: Botón Proceder al Pago **
    checkoutBtn.addEventListener('click', async (e) => {
        e.preventDefault(); // Evita el comportamiento por defecto del botón (ej. envío de formulario)

        if (cart.length === 0) {
            showSystemMessage('Tu carrito está vacío. Añade productos antes de proceder al pago.', 'error');
            return;
        }

        showSystemMessage('Redirigiendo a Stripe para completar el pago...', 'info');
        checkoutBtn.disabled = true; // Deshabilita el botón para evitar múltiples clics
        checkoutBtn.style.backgroundColor = '#cccccc'; // Estilo para botón deshabilitado
        checkoutBtn.style.cursor = 'not-allowed';

        // Mapear los productos del carrito a lineItems de Stripe
        const lineItemsForStripe = cart.map(item => {
            const productDetails = products[item.id];
            // Validar que el producto tenga un stripePriceId definido
            if (!productDetails || !productDetails.stripePriceId) {
                console.error(`Error: Product ${item.id} missing Stripe Price ID.`);
                showSystemMessage(`Error: El producto "${item.name}" no tiene un ID de Precio de Stripe válido.`, 'error');
                return null; // Devuelve null para filtrar este ítem
            }
            return {
                price: productDetails.stripePriceId, // El ID de Precio de Stripe
                quantity: item.quantity,
            };
        }).filter(item => item !== null); // Filtra cualquier ítem nulo si hubo errores

        if (lineItemsForStripe.length === 0 || lineItemsForStripe.some(item => !item.price)) {
            showSystemMessage('No se pudieron preparar los productos para el pago de Stripe. Asegúrate de que todos los productos tienen un "stripePriceId" válido.', 'error');
            checkoutBtn.disabled = false; // Habilita el botón si no se puede continuar
            checkoutBtn.style.backgroundColor = ''; // Restablece el estilo
            checkoutBtn.style.cursor = 'pointer';
            return;
        }

        try {
            const result = await stripe.redirectToCheckout({
                lineItems: lineItemsForStripe,
                mode: "payment",
                // ¡IMPORTANTE! Actualiza estas URLs a tu dominio real.
                // Son las páginas a las que Stripe redirigirá después del pago.
                successUrl: "https://newyoscafe.vercel.app/pasareladepago/success.html",
                cancelUrl: "https://newyoscafe.vercel.app/pasareladepago/cancel.html"
            });

            if (result.error) {
                // Si hay un error ANTES de la redirección, lo puedes ver aquí.
                console.error("Error en redirectToCheckout:", result.error.message);
                showSystemMessage(`Error al procesar el pago: ${result.error.message}`, 'error');
                checkoutBtn.disabled = false; // Habilita el botón si hubo un error de Stripe
                checkoutBtn.style.backgroundColor = '';
                checkoutBtn.style.cursor = 'pointer';
            }
        } catch (error) {
            // Captura errores de red o errores inesperados antes de la redirección.
            console.error("Ocurrió un error inesperado al intentar redirigir a Checkout:", error);
            showSystemMessage(`Ocurrió un error inesperado: ${error.message}`, 'error');
            checkoutBtn.disabled = false; // Habilita el botón en caso de error
            checkoutBtn.style.backgroundColor = '';
            checkoutBtn.style.cursor = 'pointer';
        }
    });

    // Lógica para el formulario de envío (Formspree)
    shippingForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Previene el envío normal del formulario

        // Aquí puedes agregar validación adicional si lo deseas

        // Muestra un mensaje de envío (esto es independiente del flujo de Stripe)
        orderMessage.classList.remove('success', 'error');
        orderMessage.textContent = 'Enviando tu orden... Recibirás las instrucciones de pago por correo.';
        orderMessage.style.color = 'green'; // Puedes estilizar esto con tu CSS

        // Enviar el formulario a Formspree
        const formData = new FormData(shippingForm);
        fetch(shippingForm.action, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        }).then(response => {
            if (response.ok) {
                orderMessage.textContent = '¡Orden enviada con éxito! Revisa tu correo para las instrucciones de pago.';
                orderMessage.style.color = 'green';
                shippingForm.reset(); // Limpia el formulario
                // Opcional: podrías limpiar el carrito si el pedido se considera completado aquí
                // cart = [];
                // updateCartDisplay();
            } else {
                response.json().then(data => {
                    if (Object.hasOwnProperty.call(data, 'errors')) {
                        orderMessage.textContent = data["errors"].map(error => error["message"]).join(", ");
                    } else {
                        orderMessage.textContent = 'Ocurrió un error al enviar tu orden.';
                    }
                    orderMessage.style.color = 'red';
                });
            }
        }).catch(error => {
            console.error('Error al enviar el formulario:', error);
            orderMessage.textContent = 'Hubo un problema de conexión al enviar tu orden.';
            orderMessage.style.color = 'red';
        });
    });


    // --- Event Listeners para la Barra de Búsqueda ---
    searchInput.addEventListener('input', filterProducts);
    searchBtn.addEventListener('click', filterProducts);

    // Inicializar la vista del carrito y filtros (mostrar todos los productos al cargar)
    updateCartDisplay();
    filterProducts();
});
