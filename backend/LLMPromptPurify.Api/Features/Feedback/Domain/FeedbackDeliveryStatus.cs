namespace LLMPromptPurify.Api.Features.Feedback.Domain;

public enum FeedbackDeliveryStatus
{
    Emailed,
    StoredOnly,
}

public static class FeedbackDeliveryStatusExtensions
{
    public static string ToApiValue(this FeedbackDeliveryStatus status)
    {
        return status switch
        {
            FeedbackDeliveryStatus.Emailed => "emailed",
            _ => "stored-only",
        };
    }
}
