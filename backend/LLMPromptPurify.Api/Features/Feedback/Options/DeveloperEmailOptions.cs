namespace LLMPromptPurify.Api.Features.Feedback.Options;

public sealed class DeveloperEmailOptions
{
    public const string SectionName = "DeveloperEmail";

    public bool EnableSsl { get; init; } = true;

    public string? Host { get; init; }

    public string? Password { get; init; }

    public int Port { get; init; } = 587;

    public string? RecipientEmail { get; init; }

    public string? SenderEmail { get; init; }

    public string? Username { get; init; }

    public bool IsConfigured()
    {
        return !string.IsNullOrWhiteSpace(Host)
            && Port > 0
            && !string.IsNullOrWhiteSpace(Password)
            && !string.IsNullOrWhiteSpace(RecipientEmail)
            && !string.IsNullOrWhiteSpace(Username);
    }
}
