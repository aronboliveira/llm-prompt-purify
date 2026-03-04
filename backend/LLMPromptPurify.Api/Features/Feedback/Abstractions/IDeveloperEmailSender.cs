using LLMPromptPurify.Api.Features.Feedback.Domain;

namespace LLMPromptPurify.Api.Features.Feedback.Abstractions;

public interface IDeveloperEmailSender
{
    Task<FeedbackDispatchResult> SendAsync(
        FeedbackEntry entry,
        CancellationToken cancellationToken
    );
}
