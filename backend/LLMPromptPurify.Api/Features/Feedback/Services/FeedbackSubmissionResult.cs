using LLMPromptPurify.Api.Features.Feedback.Domain;

namespace LLMPromptPurify.Api.Features.Feedback.Services;

public sealed record FeedbackSubmissionResult(
    FeedbackEntry? Entry,
    IReadOnlyDictionary<string, string[]> Errors
)
{
    public bool IsValid => Errors.Count == 0;
}
