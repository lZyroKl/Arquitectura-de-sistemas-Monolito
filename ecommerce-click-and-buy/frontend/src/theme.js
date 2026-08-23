export function getTheme() {
    return localStorage.getItem("theme") || "light";
}

export function setTheme(theme) {
    localStorage.setItem("theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
}

export function toggleTheme() {
    const current = getTheme();
    const next = current === "dark" ? "light" : "dark";
    setTheme(next);
    return next;
}

export function initTheme() {
    const saved = getTheme();
    document.documentElement.setAttribute("data-theme", saved);
}
