namespace LLMPromptPurify.Api.Features.MaskSafety.Contracts;

public sealed class MaskSafetyValidationItemResponse
{
    public string CandidateValue { get; init; } = string.Empty;

    public string Decision { get; init; } = string.Empty;

    public bool IsCompromising { get; init; }

    public bool IsSupported { get; init; }

    public string Message { get; init; } = string.Empty;

    public string RuleId { get; init; } = string.Empty;
}
