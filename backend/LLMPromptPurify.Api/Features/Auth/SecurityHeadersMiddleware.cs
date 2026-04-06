// V-007: Middleware de cabeçalhos de segurança — detectado pelos scripts CISO e White Hat
// Adiciona os cabeçalhos de segurança recomendados pelo OWASP Secure Headers Project.
using Microsoft.AspNetCore.Builder;

namespace LLMPromptPurify.Api.Features.Auth;

/// <summary>
/// V-007: Adiciona cabeçalhos de segurança em todas as respostas HTTP.
/// Detectado por: CISO/security_header_scan.sh, White-Hat/owasp_header_audit.py
/// </summary>
public static class SecurityHeadersMiddlewareExtensions
{
    /// <summary>
    /// Registra o middleware de cabeçalhos de segurança no pipeline HTTP.
    /// </summary>
    public static IApplicationBuilder UseSecurityHeaders(this IApplicationBuilder app)
    {
        return app.Use(async (context, next) =>
        {
            var headers = context.Response.Headers;

            // Previne MIME-type sniffing
            headers["X-Content-Type-Options"] = "nosniff";

            // Previne clickjacking — bloqueia renderização em frames
            headers["X-Frame-Options"] = "DENY";

            // Controla informações de referrer vazadas para terceiros
            headers["Referrer-Policy"] = "strict-origin-when-cross-origin";

            // Restringe APIs do navegador (câmera, microfone, geolocalização, etc.)
            headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(), payment=()";

            // Filtro anti-XSS legado (útil para navegadores antigos)
            headers["X-XSS-Protection"] = "1; mode=block";

            // Content Security Policy — política restritiva padrão
            headers["Content-Security-Policy"] =
                "default-src 'self'; " +
                "script-src 'self'; " +
                "style-src 'self' 'unsafe-inline'; " +
                "img-src 'self' data:; " +
                "connect-src 'self'; " +
                "font-src 'self'; " +
                "object-src 'none'; " +
                "frame-ancestors 'none'; " +
                "base-uri 'self'; " +
                "form-action 'self'";

            // Previne cache de respostas com dados sensíveis
            if (!headers.ContainsKey("Cache-Control"))
            {
                headers["Cache-Control"] = "no-store, no-cache, must-revalidate";
            }

            // Remove cabeçalho Server que expõe informações do servidor
            headers.Remove("Server");
            headers.Remove("X-Powered-By");

            await next();
        });
    }
}
