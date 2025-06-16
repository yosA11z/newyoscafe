document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('contactForm');
    const formMessage = document.getElementById('formMessage');

    if (form) { // Aseguramos que el formulario exista
        form.addEventListener('submit', async function(event) {
            event.preventDefault(); // Detenemos el envío normal del formulario para usar JavaScript

            formMessage.classList.remove('success', 'error'); // Limpiamos clases anteriores
            formMessage.textContent = 'Enviando mensaje...'; // Mensaje de carga

            // Obtenemos los datos del formulario
            const formData = new FormData(form);

            try {
                // Enviamos los datos del formulario a la URL de Formspree usando fetch
                const response = await fetch(form.action, {
                    method: form.method, // Usamos el método definido en el HTML (POST)
                    body: formData,      // Los datos del formulario
                    headers: {
                        'Accept': 'application/json' // Le decimos a Formspree que esperamos una respuesta en JSON
                    }
                });

                // Convertimos la respuesta a JSON
                const data = await response.json();

                if (response.ok) { // Si la respuesta HTTP es exitosa (códigos 2xx)
                    formMessage.textContent = '¡Mensaje enviado con éxito! Te contactaremos pronto.';
                    formMessage.classList.add('success');
                    form.reset(); // Limpiamos todos los campos del formulario
                } else {
                    // Si Formspree devuelve un error (ej. validación fallida, spam detectado, etc.)
                    // La respuesta contendrá detalles del error
                    const errorMessage = data.errors && data.errors.length > 0
                                       ? data.errors.map(err => err.message).join(', ')
                                       : (data.message || 'Hubo un problema al enviar tu mensaje. Intenta de nuevo.');
                    
                    formMessage.textContent = `Error: ${errorMessage}`;
                    formMessage.classList.add('error');
                    console.error('Error de Formspree:', data); // Para depuración
                }

            } catch (error) {
                // Capturamos errores de red (ej. sin internet, URL incorrecta)
                console.error('Error de conexión o inesperado:', error);
                formMessage.textContent = '¡Oh no! Parece que hay un problema de conexión. Intenta de nuevo más tarde.';
                formMessage.classList.add('error');
            }
        });
    }
});