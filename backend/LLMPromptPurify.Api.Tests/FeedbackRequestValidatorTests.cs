using LLMPromptPurify.Api.Features.Feedback.Contracts;
using LLMPromptPurify.Api.Features.Feedback.Domain;
using LLMPromptPurify.Api.Features.Feedback.Services;

namespace LLMPromptPurify.Api.Tests;

public sealed class FeedbackRequestValidatorTests
{
    private readonly FeedbackRequestValidator _validator = new();

    [Fact]
    public void Requires_A_Rating_For_Appraisals()
    {
        var request = new FeedbackSubmissionRequest
        {
            Category = FeedbackCategoryCatalog.Appraisal,
            Message = "The scanner was accurate and fast.",
        };

        var errors = _validator.Validate(request);

        Assert.True(errors.ContainsKey("rating"));
    }

    [Fact]
    public void Requires_A_Valid_Email_When_A_Reply_Is_Requested()
    {
        var request = new FeedbackSubmissionRequest
        {
            Category = FeedbackCategoryCatalog.GeneralFeedback,
            Email = "not-an-email",
            Message = "Please get back to me.",
            WantsReply = true,
        };

        var errors = _validator.Validate(request);

        Assert.True(errors.ContainsKey("email"));
    }

    [Fact]
    public void Accepts_A_Well_Formed_Message_To_Developers()
    {
        var request = new FeedbackSubmissionRequest
        {
            Category = FeedbackCategoryCatalog.ContactDevelopers,
            Email = "user@example.com",
            Message = "I would like a dedicated export feature for audit-safe prompts.",
            Subject = "Feature idea",
            WantsReply = true,
        };

        var errors = _validator.Validate(request);

        Assert.Empty(errors);
    }
}
