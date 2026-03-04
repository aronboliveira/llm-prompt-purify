namespace LLMPromptPurify.Api.Features.MaskSafety.Contracts;

public sealed class MaskSafetyValidationRequest
{
    public IReadOnlyList<MaskSafetyValidationItemRequest> Candidates { get; init; } =
        Array.Empty<MaskSafetyValidationItemRequest>();
}
