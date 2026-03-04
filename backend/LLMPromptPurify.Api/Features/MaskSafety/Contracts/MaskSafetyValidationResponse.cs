namespace LLMPromptPurify.Api.Features.MaskSafety.Contracts;

public sealed class MaskSafetyValidationResponse
{
    public IReadOnlyList<MaskSafetyValidationItemResponse> Results { get; init; } =
        Array.Empty<MaskSafetyValidationItemResponse>();
}
