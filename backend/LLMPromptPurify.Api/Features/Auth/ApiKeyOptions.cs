namespace LLMPromptPurify.Api.Features.Auth;

/// <summary>
/// V-003: API key configuration options.
/// </summary>
public sealed class ApiKeyOptions
{
    public const string SectionName = "ApiKey";

    /// <summary>
    /// Whether API key validation is enabled. Default: false for development.
    /// </summary>
    public bool Enabled { get; init; } = false;

    /// <summary>
    /// The expected API key value. Should be loaded from user-secrets or Key Vault.
    /// </summary>
    public string? Key { get; init; }

    /// <summary>
    /// Header name for the API key. Default: X-API-Key.
    /// </summary>
    public string HeaderName { get; init; } = "X-API-Key";

    /// <summary>
    /// Endpoints that require API key authentication. Supports wildcards.
    /// </summary>
    public string[] ProtectedEndpoints { get; init; } = ["/api/feedback"];
}
