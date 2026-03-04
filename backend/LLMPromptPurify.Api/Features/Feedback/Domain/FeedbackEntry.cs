namespace LLMPromptPurify.Api.Features.Feedback.Domain;

public sealed record FeedbackEntry(
    Guid Id,
    string Category,
    string? Email,
    string Message,
    string? Name,
    int? Rating,
    string Source,
    string? Subject,
    bool WantsReply,
    DateTimeOffset CreatedAtUtc,
    FeedbackDeliveryStatus DeliveryStatus,
    string? DeliveryError
);
