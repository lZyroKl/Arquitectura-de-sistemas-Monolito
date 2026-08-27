import { api } from "../api.js";
import { navigate } from "../router.js";

export async function renderWebpayReturn(container) {
    // Extraer token_ws de la query string (o body si fue post, pero en SPAs suele llegar por query de retorno o manejamos POST en backend y redirige)
    // Transbank redirige enviando token_ws. Si es un GET (dependiendo versión) viene en URL
    // Con Hash Routing, los query parameters están dentro del hash
    let searchString = window.location.search;
    if (window.location.hash.includes('?')) {
        searchString = window.location.hash.substring(window.location.hash.indexOf('?'));
    }
    
    const urlParams = new URLSearchParams(searchString);
    let token_ws = urlParams.get('token_ws');

    // En versiones nuevas si rechazas el pago puede venir TBK_TOKEN
    const tbk_token = urlParams.get('TBK_TOKEN');
    if (!token_ws && tbk_token) {
        token_ws = tbk_token;
    }

    container.innerHTML = `
        <div class="container" style="padding: 100px 0; text-align: center;">
            <span class="spinner" style="width:40px;height:40px;border-width:4px;display:inline-block;margin-bottom:20px;border-top-color:var(--accent);"></span>
            <h2 class="section-title">Validando Pago con Transbank...</h2>
            <p class="section-subtitle">Por favor no cierres esta ventana.</p>
        </div>
    `;

    if (!token_ws) {
        container.innerHTML = renderResult(false, "No se recibió un token de transacción válido. Posible cancelación.");
        return;
    }

    try {
        const result = await api.commitWebpay(token_ws);
        
        if (result.success) {
            container.innerHTML = renderResult(true, `Tu pedido #CB-${String(result.order_id).padStart(6, '0')} ha sido pagado exitosamente.`, result.order_id);
        } else {
            container.innerHTML = renderResult(false, result.error || "Transacción rechazada por el banco.");
        }
    } catch (err) {
        container.innerHTML = renderResult(false, err.message || "Error de comunicación con el servidor.");
    }
}

function renderResult(isSuccess, message, orderId = null) {
    const icon = isSuccess 
        ? `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="var(--success)" width="48" height="48"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="var(--accent)" width="48" height="48"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>`;
    
    const color = isSuccess ? 'var(--success)' : 'var(--accent)';
    const title = isSuccess ? '¡Pago Aprobado!' : 'Pago Rechazado';

    setTimeout(() => {
        document.getElementById("btn-return-action")?.addEventListener("click", () => {
            if (isSuccess) navigate("/");
            else navigate("/checkout");
        });
    }, 100);

    return `
        <div class="container" style="padding: 60px 0;">
            <div class="glass-card" style="max-width:600px; margin: 0 auto; padding: 40px; text-align: center;">
                <div style="width:80px;height:80px;border-radius:50%;background:rgba(${isSuccess ? '22,163,74' : '235,17,43'},0.12);border:2px solid ${color};display:flex;align-items:center;justify-content:center;margin:0 auto 24px;">
                    ${icon}
                </div>
                <h1 class="section-title" style="margin-bottom:12px;">${title}</h1>
                <p style="color:var(--text-secondary);font-size:1.1rem;margin-bottom:32px;">${message}</p>
                
                <button class="btn btn-primary btn-lg" id="btn-return-action">
                    ${isSuccess ? 'Volver al Inicio' : 'Intentar de Nuevo'}
                </button>
            </div>
        </div>
    `;
}
