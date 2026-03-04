namespace LLMPromptPurify.Api.Features.MaskSafety.Contracts;

public sealed class MaskSafetyValidationItemRequest
{
    public string CandidateValue { get; init; } = string.Empty;

    public string RuleId { get; init; } = string.Empty;
}
