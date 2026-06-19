export interface CorsConfig {
    allowedOrigins: string[];
}

export function isAllowedOrigin(origin: string | null, config: CorsConfig): string | null {
    if (!origin) return null;
    if (config.allowedOrigins.includes(origin)) return origin;
    return null;
}

export function corsHeaders(origin: string): HeadersInit {
    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
    };
}

export function preflightResponse(origin: string): Response {
    return new Response(null, {
        status: 204,
        headers: corsHeaders(origin),
    });
}
