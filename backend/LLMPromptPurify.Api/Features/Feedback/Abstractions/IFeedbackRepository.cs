using LLMPromptPurify.Api.Features.Feedback.Domain;

namespace LLMPromptPurify.Api.Features.Feedback.Abstractions;

public interface IFeedbackRepository
{
    Task CreateAsync(FeedbackEntry entry, CancellationToken cancellationToken);

    Task UpdateDeliveryStatusAsync(
        Guid id,
        FeedbackDeliveryStatus deliveryStatus,
        string? deliveryError,
        CancellationToken cancellationToken
    );
}
