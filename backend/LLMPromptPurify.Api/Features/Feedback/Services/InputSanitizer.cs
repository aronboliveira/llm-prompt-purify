using System.Net;
using System.Text.RegularExpressions;

namespace LLMPromptPurify.Api.Features.Feedback.Services;

/// <summary>
/// V-002: Input sanitization utilities to prevent XSS and injection attacks.
/// </summary>
public static partial class InputSanitizer
{
    private static readonly Regex ScriptTagPattern = GetScriptTagPattern();
    private static readonly Regex EventHandlerPattern = GetEventHandlerPattern();

    /// <summary>
    /// HTML-encodes a string to prevent XSS when rendered in HTML contexts.
    /// </summary>
    public static string? HtmlEncode(string? input)
    {
        if (string.IsNullOrWhiteSpace(input))
            return input;

        return WebUtility.HtmlEncode(input);
    }

    /// <summary>
    /// Sanitizes user input by HTML-encoding and removing dangerous patterns.
    /// Use for content that will be stored and potentially displayed.
    /// </summary>
    public static string? Sanitize(string? input)
    {
        if (string.IsNullOrWhiteSpace(input))
            return input;

        var sanitized = input;

        // Remove script tags and their content
        sanitized = ScriptTagPattern.Replace(sanitized, string.Empty);

        // Remove event handlers (onclick, onerror, etc.)
        sanitized = EventHandlerPattern.Replace(sanitized, string.Empty);

        // HTML-encode remaining content
        return WebUtility.HtmlEncode(sanitized);
    }

    /// <summary>
    /// Sanitizes and trims input for storage.
    /// </summary>
    public static string SanitizeAndTrim(string? input, string defaultValue = "")
    {
        if (string.IsNullOrWhiteSpace(input))
            return defaultValue;

        return Sanitize(input.Trim()) ?? defaultValue;
    }

    [GeneratedRegex(@"<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>", RegexOptions.IgnoreCase | RegexOptions.Compiled)]
    private static partial Regex GetScriptTagPattern();

    [GeneratedRegex(@"\bon\w+\s*=\s*[""'][^""']*[""']", RegexOptions.IgnoreCase | RegexOptions.Compiled)]
    private static partial Regex GetEventHandlerPattern();
}
