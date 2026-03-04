using Microsoft.Extensions.Options;

namespace LLMPromptPurify.Api.Features.Auth;

/// <summary>
/// V-003: Middleware for API key validation on protected endpoints.
/// </summary>
public sealed class ApiKeyMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ApiKeyMiddleware> _logger;

    public ApiKeyMiddleware(RequestDelegate next, ILogger<ApiKeyMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, IOptionsMonitor<ApiKeyOptions> options)
    {
        var config = options.CurrentValue;

        // Skip if API key validation is disabled
        if (!config.Enabled)
        {
            await _next(context);
            return;
        }

        var path = context.Request.Path.Value ?? string.Empty;

        // Check if the current path is protected
        var isProtected = config.ProtectedEndpoints.Any(endpoint =>
            path.StartsWith(endpoint, StringComparison.OrdinalIgnoreCase));

        if (!isProtected)
        {
            await _next(context);
            return;
        }

        // Validate API key
        if (!context.Request.Headers.TryGetValue(config.HeaderName, out var providedKey))
        {
            _logger.LogWarning("API key missing for protected endpoint: {Path}", path);
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            await context.Response.WriteAsJsonAsync(new { error = "API key is required." });
            return;
        }

        if (string.IsNullOrWhiteSpace(config.Key))
        {
            _logger.LogError("API key validation enabled but no key configured.");
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            await context.Response.WriteAsJsonAsync(new { error = "Authentication not configured." });
            return;
        }

        if (!string.Equals(providedKey, config.Key, StringComparison.Ordinal))
        {
            _logger.LogWarning("Invalid API key provided for endpoint: {Path}", path);
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            await context.Response.WriteAsJsonAsync(new { error = "Invalid API key." });
            return;
        }

        await _next(context);
    }
}

/// <summary>
/// Extension methods for API key middleware registration.
/// </summary>
public static class ApiKeyMiddlewareExtensions
{
    public static IServiceCollection AddApiKeyAuthentication(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<ApiKeyOptions>(configuration.GetSection(ApiKeyOptions.SectionName));
        return services;
    }

    public static IApplicationBuilder UseApiKeyAuthentication(this IApplicationBuilder app)
    {
        return app.UseMiddleware<ApiKeyMiddleware>();
    }
}
