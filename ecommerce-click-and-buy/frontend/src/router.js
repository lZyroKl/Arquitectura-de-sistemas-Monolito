const routes = {};
let currentCleanup = null;

export function route(path, handler) {
    routes[path] = handler;
}

export function navigate(path) {
    window.location.hash = path;
}

export function getParams() {
    const hash = window.location.hash.slice(1);
    const parts = hash.split("/").filter(Boolean);
    return parts;
}

function matchRoute(hash) {
    const path = hash || "/";

    if (routes[path]) return { handler: routes[path], params: {} };

    for (const pattern of Object.keys(routes)) {
        const patternParts = pattern.split("/").filter(Boolean);
        const pathParts = path.split("/").filter(Boolean);

        if (patternParts.length !== pathParts.length) continue;

        const params = {};
        let match = true;

        for (let i = 0; i < patternParts.length; i++) {
            if (patternParts[i].startsWith(":")) {
                params[patternParts[i].slice(1)] = pathParts[i];
            } else if (patternParts[i] !== pathParts[i]) {
                match = false;
                break;
            }
        }

        if (match) return { handler: routes[pattern], params };
    }

    return null;
}

export function startRouter() {
    async function handleRoute() {
        const hash = window.location.hash.slice(1) || "/";
        const result = matchRoute(hash);

        if (currentCleanup) {
            currentCleanup();
            currentCleanup = null;
        }

        const main = document.querySelector("main");
        if (!main) return;

        if (result) {
            const cleanup = await result.handler(main, result.params);
            if (typeof cleanup === "function") {
                currentCleanup = cleanup;
            }
        } else {
            main.innerHTML = `
                <div class="container" style="text-align:center;padding:100px 0;">
                    <h1 class="section-title">404</h1>
                    <p class="section-subtitle" style="margin:0 auto;">Página no encontrada</p>
                </div>
            `;
        }

        window.scrollTo(0, 0);
    }

    window.addEventListener("hashchange", handleRoute);
    handleRoute();
}
