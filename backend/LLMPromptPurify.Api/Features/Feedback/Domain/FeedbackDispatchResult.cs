namespace LLMPromptPurify.Api.Features.Feedback.Domain;

public sealed record FeedbackDispatchResult(
    FeedbackDeliveryStatus Status,
    string? ErrorMessage = null
);
