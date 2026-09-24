const ORDER_STATUS = {
    paid: { label: "Pagado · Preparando despacho", badge: "badge-red" },
    pending: { label: "Pago pendiente", badge: "badge-brand" },
    rejected: { label: "Pago rechazado", badge: "badge-category" },
    cancelled: { label: "Pago anulado", badge: "badge-category" },
    failed: { label: "Error al iniciar pago", badge: "badge-category" },
};

export function orderStatusBadge(status) {
    const info = ORDER_STATUS[status] || { label: status, badge: "badge-brand" };
    return `<span class="badge ${info.badge}">${info.label}</span>`;
}

export function formatOrderNumber(id) {
    return `CB-${String(id).padStart(6, "0")}`;
}
