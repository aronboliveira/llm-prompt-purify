namespace LLMPromptPurify.Api.Features.Feedback.Domain;

public static class FeedbackCategoryCatalog
{
    public const string Appraisal = "appraisal";
    public const string BugReport = "bug-report";
    public const string ContactDevelopers = "contact-developers";
    public const string GeneralFeedback = "general-feedback";

    public static readonly IReadOnlySet<string> All = new HashSet<string>(
        [GeneralFeedback, Appraisal, BugReport, ContactDevelopers],
        StringComparer.OrdinalIgnoreCase
    );

    public static bool IsKnown(string category)
    {
        return All.Contains(category);
    }
}
