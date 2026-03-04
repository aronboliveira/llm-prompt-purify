namespace LLMPromptPurify.Api.Features.MaskSafety.Domain;

public static class MaskSafetyDecision
{
    public const string Compromising = "compromising";
    public const string Safe = "safe";
    public const string Unsupported = "unsupported";
}
