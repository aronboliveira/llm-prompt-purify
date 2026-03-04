namespace LLMPromptPurify.Api.Features.Feedback.Contracts;

public sealed class FeedbackSubmissionRequest
{
    public string Category { get; init; } = string.Empty;

    public string? Email { get; init; }

    public string Message { get; init; } = string.Empty;

    public string? Name { get; init; }

    public int? Rating { get; init; }

    public string? Subject { get; init; }

    public bool WantsReply { get; init; }
}
