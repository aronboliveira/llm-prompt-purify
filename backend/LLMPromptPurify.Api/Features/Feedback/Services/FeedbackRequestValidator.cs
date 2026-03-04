using System.Net.Mail;
using LLMPromptPurify.Api.Features.Feedback.Contracts;
using LLMPromptPurify.Api.Features.Feedback.Domain;

namespace LLMPromptPurify.Api.Features.Feedback.Services;

public sealed class FeedbackRequestValidator
{
    public IReadOnlyDictionary<string, string[]> Validate(FeedbackSubmissionRequest request)
    {
        var errors = new Dictionary<string, List<string>>(StringComparer.Ordinal);

        if (string.IsNullOrWhiteSpace(request.Category))
        {
            AddError(errors, "category", "Choose the kind of feedback you want to send.");
        }
        else if (!FeedbackCategoryCatalog.IsKnown(request.Category))
        {
            AddError(errors, "category", "The selected feedback category is not supported.");
        }

        if (string.IsNullOrWhiteSpace(request.Message))
        {
            AddError(errors, "message", "Write a short message before submitting feedback.");
        }
        else if (request.Message.Length > 4000)
        {
            AddError(errors, "message", "Keep the message under 4000 characters.");
        }

        if (!string.IsNullOrWhiteSpace(request.Name) && request.Name.Length > 80)
        {
            AddError(errors, "name", "Keep the name under 80 characters.");
        }

        if (!string.IsNullOrWhiteSpace(request.Subject) && request.Subject.Length > 160)
        {
            AddError(errors, "subject", "Keep the subject under 160 characters.");
        }

        if (request.Rating is < 1 or > 5)
        {
            AddError(errors, "rating", "Ratings must be between 1 and 5.");
        }

        if (
            string.Equals(
                request.Category,
                FeedbackCategoryCatalog.Appraisal,
                StringComparison.OrdinalIgnoreCase
            ) && request.Rating is null
        )
        {
            AddError(errors, "rating", "Appraisals need a 1 to 5 rating.");
        }

        var emailIsRequired = request.WantsReply
            || string.Equals(
                request.Category,
                FeedbackCategoryCatalog.ContactDevelopers,
                StringComparison.OrdinalIgnoreCase
            );

        if (emailIsRequired && string.IsNullOrWhiteSpace(request.Email))
        {
            AddError(
                errors,
                "email",
                "Add an email address when you want the developers to reply."
            );
        }
        else if (!string.IsNullOrWhiteSpace(request.Email) && !LooksLikeEmail(request.Email))
        {
            AddError(errors, "email", "Use a valid email address.");
        }

        if (
            string.Equals(
                request.Category,
                FeedbackCategoryCatalog.ContactDevelopers,
                StringComparison.OrdinalIgnoreCase
            ) && string.IsNullOrWhiteSpace(request.Subject)
        )
        {
            AddError(errors, "subject", "Add a subject for messages directed to the developers.");
        }

        return errors.ToDictionary(
            pair => pair.Key,
            pair => pair.Value.ToArray(),
            StringComparer.Ordinal
        );
    }

    private static void AddError(
        IDictionary<string, List<string>> errors,
        string key,
        string message
    )
    {
        if (!errors.TryGetValue(key, out var messages))
        {
            messages = [];
            errors[key] = messages;
        }

        messages.Add(message);
    }

    private static bool LooksLikeEmail(string emailAddress)
    {
        try
        {
            _ = new MailAddress(emailAddress);
            return true;
        }
        catch
        {
            return false;
        }
    }
}
