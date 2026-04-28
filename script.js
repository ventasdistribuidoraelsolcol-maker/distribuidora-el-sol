let carrito = [];

async function cargarProductos() {
    const contenedor = document.getElementById('contenedor-productos');
    const menuSub = document.getElementById('subcategorias-menu');
    const urlParams = new URLSearchParams(window.location.search);
    
    const marcaSeleccionada = urlParams.get('marca'); 
    const subSeleccionada = urlParams.get('sub'); 

    if (!marcaSeleccionada) {
        contenedor.innerHTML = "<h2>Por favor, selecciona una marca.</h2>";
        return;
    }

    try {
        const respuesta = await fetch('productos.json');
        const todosLosProductos = await respuesta.json();

        // 1. Filtrar por marca
        const productosDeMarca = todosLosProductos.filter(p => 
            p.marca && p.marca.toLowerCase() === marcaSeleccionada.toLowerCase()
        );

        // 2. Crear botones de subcategorías (Solo si existen subcategorías en esa marca)
        const subsExistentes = productosDeMarca
            .map(p => p.subcategoria)
            .filter(s => s !== undefined && s !== ""); // Quita las que están vacías
        
        const subcategoriasUnicas = [...new Set(subsExistentes)];
        
        if (menuSub) {
            menuSub.innerHTML = ""; 
            if (subcategoriasUnicas.length > 0) {
                subcategoriasUnicas.forEach(sub => {
                    const boton = document.createElement('a');
                    boton.href = `productos.html?marca=${marcaSeleccionada}&sub=${sub}`;
                    boton.innerText = sub.toUpperCase();
                    boton.style = "margin: 5px; padding: 10px; background: #eee; text-decoration: none; display: inline-block; border-radius: 5px; color: black; font-size: 12px; border: 1px solid #ccc;";
                    menuSub.appendChild(boton);
                });
                
                const btnTodos = document.createElement('a');
                btnTodos.href = `productos.html?marca=${marcaSeleccionada}`;
                btnTodos.innerText = "VER TODO";
                btnTodos.style = "margin: 5px; padding: 10px; background: #333; color: white; text-decoration: none; display: inline-block; border-radius: 5px; font-size: 12px;";
                menuSub.appendChild(btnTodos);
            }
        }

        // 3. Filtrar por subcategoría (si se seleccionó una)
        const productosFinales = subSeleccionada 
            ? productosDeMarca.filter(p => p.subcategoria && p.subcategoria.toLowerCase() === subSeleccionada.toLowerCase())
            : productosDeMarca;

        // 4. Mostrar productos
        contenedor.innerHTML = ""; 

        if (productosFinales.length === 0) {
            contenedor.innerHTML = `<h2>No hay productos para mostrar.</h2>`;
            return;
        }

   productosFinales.forEach(p => {
    const div = document.createElement('div');
    div.className = "producto-card";

    // Usamos 'permitemitad' en minúscula como lo tienes en el Excel
    let paso = (p.permitemitad === true || p.permitemitad === "true") ? 0.5 : 1;

    div.innerHTML = `
        <img src="${p.imagen || 'https://via.placeholder.com/150'}" alt="${p.nombre}">
        <h3 id="nombre">${p.nombre}</h3>
        <p class="precio">$${Number(p.precio).toLocaleString('es-CO')}</p>
        
        <div class="control-cantidad" style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 10px;">
            <button type="button" onclick="cambiarCantidad(this, -${paso})">-</button>
            <input type="number" value="0" step="${paso}" min="0" class="input-cantidad" readonly style="width: 50px; text-align: center;">
            <button type="button" onclick="cambiarCantidad(this, ${paso})">+</button>
        </div>

        <button class="btn-agregar" onclick="agregarAlCarrito(this)" style="background-color: #0056b3; color: white; border: none; padding: 10px; width: 100%; border-radius: 5px; cursor: pointer;">
            Añadir al Carrito
        </button>
    `;
    contenedor.appendChild(div);
});


    } catch (error) {
        console.error("Error:", error);
        contenedor.innerHTML = "<h2>Error al cargar el archivo JSON. Revisa que no falten comas.</h2>";
    }
}
cargarProductos();

function cambiarCantidad(boton, cantidadASumar) {
    const input = boton.parentElement.querySelector('.input-cantidad');
    
    let valorActual = parseFloat(input.value);
    let paso = parseFloat(cantidadASumar);
    
    let nuevoValor = valorActual + paso;

    // Esto corrige errores matemáticos raros de los decimales
    nuevoValor = Math.round(nuevoValor * 10) / 10;

    if (nuevoValor < 0) nuevoValor = 0;
    
    input.value = nuevoValor;
}

function agregarAlCarrito(boton) {
    const tarjeta = boton.parentElement;
    const nombre = tarjeta.querySelector('h3').innerText;
    const cantidad = parseFloat(tarjeta.querySelector('.input-cantidad').value);
    const precioTexto = tarjeta.querySelector('.precio').innerText;
    const precio = parseFloat(precioTexto.replace('$', '').replace('.', ''));

    if (cantidad <= 0) {
        alert("Selecciona una cantidad");
        return;
    }

    // Buscamos si el producto ya está en el carrito para no repetirlo, sino sumar la cantidad
    const index = carrito.findIndex(item => item.nombre === nombre);

    if (index > -1) {
        carrito[index].cantidad += cantidad;
    } else {
        carrito.push({ nombre, cantidad, precio });
    }

    alert(`¡${nombre} añadido al carrito!`);
    actualizarVistaCarrito(); // Esta función la creamos abajo
}
function cerrarCarrito() {
    const modal = document.getElementById('carrito-modal'); // Asegúrate que este sea el ID de tu carrito
    if (modal) {
        modal.style.display = 'none';
    }
}

function actualizarVistaCarrito() {  // <--- Usa este nombre para que coincida con tu línea 135
    const contenedorLista = document.getElementById('lista-items-carrito');
    const contenedorTotal = document.getElementById('precio-total-carrito');
    const ventanaCarrito = document.getElementById('carrito-flotante');

    if (carrito.length === 0) {
        ventanaCarrito.style.display = 'none';
        return;
    }

    ventanaCarrito.style.display = 'block';
    contenedorLista.innerHTML = '';
    let totalAcumulado = 0;

    carrito.forEach((item, index) => {
        const subtotal = item.precio * item.cantidad;
        totalAcumulado += subtotal;

        contenedorLista.innerHTML += `
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span>${item.nombre} (x${item.cantidad})</span>
                <span>$${subtotal.toLocaleString()}</span>
            </div>
        `;
    });

    contenedorTotal.innerText = `$${totalAcumulado.toLocaleString()}`;
}
function vaciarCarrito() {
    // 1. Limpiamos el arreglo
    carrito = [];
    // 2. Actualizamos la vista (esto esconderá el carrito automáticamente)
    actualizarVistaCarrito();
    // 3. Opcional: Reiniciar todos los inputs de cantidad a 0 en la página
    document.querySelectorAll('.input-cantidad').forEach(input => input.value = 0);
    
    console.log("Carrito vaciado");
}

function enviarPedidoWhatsApp() {
    if (carrito.length === 0) {
        alert("El carrito está vacío");
        return;
    }

    let mensaje = "Hola *Distribuidora El Sol*! ☀️%0AQuisiera realizar el siguiente pedido:%0A%0A";
    let total = 0;

    carrito.forEach(item => {
        const subtotal = Math.round(item.precio * item.cantidad);
        total += subtotal;
        mensaje += `✅ *${item.nombre}*%0A   Cant: ${item.cantidad} - Sub: $${subtotal.toLocaleString()}%0A%0A`;
    });

    mensaje += `💰 *TOTAL A PAGAR: $${total.toLocaleString()}*`;

    // IMPORTANTE: Asegúrate de que este número tenga el código de país (57 para Colombia)
    const miNumero = "573505377054"; 
    const url = `https://wa.me/${miNumero}?text=${mensaje}`;

    // Intentamos abrir en una pestaña nueva
    window.open(url, '_blank');
}
function filtrarPorNombre() {
    
    const input = document.getElementById('buscador');
    const filtro = input.value.toLowerCase().trim();
    
    // IMPORTANTE: Buscamos todos los elementos con la clase que creaste en la foto a8eb0a0a
    const tarjetas = document.getElementsByClassName('producto-card');

    // Si al escribir no pasa nada, este mensaje te dirá por qué:
    if (tarjetas.length === 0) {
        console.warn("Alerta: No se encontraron elementos con la clase 'producto-card'");
        return;
    }

    for (let i = 0; i < tarjetas.length; i++) {
        //console.log(tarjetas[i]); 
        //alert(`Tarjeta encontrada: ${tarjetas[i].textContent}`);

        // 1. Extraemos el texto del h3 que está dentro de esta tarjeta específica
        let textoNombre = tarjetas[i].querySelector("#nombre").textContent;

        if (textoNombre.toLowerCase().indexOf(filtro) > -1) {
            tarjetas[i].style.setProperty("display", "block", "important");
            
            // 2. Mostramos el alert solo para los que coinciden
            //alert(`Tarjeta encontrada: ${textoNombre}`);
            
        } else {
            tarjetas[i].style.setProperty("display", "none", "important");
        }
    }
}
// --- SOLUCIÓN DEFINITIVA PARA CERRAR EL CARRITO ---
document.addEventListener('click', function(event) {
    // 1. Identificamos el buscador (por ID o por ser el único input de texto)
    const elBuscador = document.getElementById('buscar-producto') || document.querySelector('input[type="text"]');
    
    // 2. Si el usuario hizo clic exactamente en el buscador
    if (elBuscador && elBuscador.contains(event.target)) {
        // Buscamos tu modal (usando el ID que tienes en la línea 138)
        const laVentanaAzul = document.getElementById('carrito-modal');
        
        if (laVentanaAzul) {
            laVentanaAzul.style.display = 'none'; // ¡Lo desaparecemos!
            console.log("Carrito minimizado para buscar productos.");
        }
    }
});