namespace LLMPromptPurify.Api.Features.Feedback.Contracts;

public sealed class FeedbackSubmissionResponse
{
    public DateTimeOffset CreatedAtUtc { get; init; }

    public string DeliveryStatus { get; init; } = string.Empty;

    public Guid Id { get; init; }

    public string Message { get; init; } = string.Empty;
}
