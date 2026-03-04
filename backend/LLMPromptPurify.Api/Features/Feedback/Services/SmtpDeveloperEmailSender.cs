using System.Net;
using System.Net.Mail;
using System.Text;
using LLMPromptPurify.Api.Features.Feedback.Abstractions;
using LLMPromptPurify.Api.Features.Feedback.Domain;
using LLMPromptPurify.Api.Features.Feedback.Options;
using Microsoft.Extensions.Options;

namespace LLMPromptPurify.Api.Features.Feedback.Services;

public sealed class SmtpDeveloperEmailSender : IDeveloperEmailSender
{
    private readonly ILogger<SmtpDeveloperEmailSender> _logger;
    private readonly DeveloperEmailOptions _options;

    public SmtpDeveloperEmailSender(
        IOptions<DeveloperEmailOptions> options,
        ILogger<SmtpDeveloperEmailSender> logger
    )
    {
        _logger = logger;
        _options = options.Value;
    }

    public async Task<FeedbackDispatchResult> SendAsync(
        FeedbackEntry entry,
        CancellationToken cancellationToken
    )
    {
        if (!_options.IsConfigured())
        {
            return new FeedbackDispatchResult(
                FeedbackDeliveryStatus.StoredOnly,
                "SMTP is not configured for developer email delivery."
            );
        }

        try
        {
            using var message = new MailMessage
            {
                Body = BuildBody(entry),
                From = new MailAddress(
                    string.IsNullOrWhiteSpace(_options.SenderEmail)
                        ? _options.Username!
                        : _options.SenderEmail
                ),
                Subject = BuildSubject(entry),
            };
            message.To.Add(_options.RecipientEmail!);

            if (!string.IsNullOrWhiteSpace(entry.Email))
            {
                message.ReplyToList.Add(new MailAddress(entry.Email));
            }

            using var client = new SmtpClient(_options.Host!, _options.Port)
            {
                Credentials = new NetworkCredential(_options.Username!, _options.Password!),
                EnableSsl = _options.EnableSsl,
            };

            await client.SendMailAsync(message);
            cancellationToken.ThrowIfCancellationRequested();
            return new FeedbackDispatchResult(FeedbackDeliveryStatus.Emailed);
        }
        catch (Exception exception)
        {
            _logger.LogError(
                exception,
                "Developer email delivery failed for feedback submission {FeedbackId}.",
                entry.Id
            );

            return new FeedbackDispatchResult(
                FeedbackDeliveryStatus.StoredOnly,
                exception.Message
            );
        }
    }

    private static string BuildBody(FeedbackEntry entry)
    {
        var body = new StringBuilder();
        body.AppendLine("A new feedback submission was received from the LLM Prompt Purify web app.");
        body.AppendLine();
        body.AppendLine($"Submission ID: {entry.Id}");
        body.AppendLine($"Category: {entry.Category}");
        body.AppendLine($"Rating: {(entry.Rating?.ToString() ?? "none")}");
        body.AppendLine($"Wants reply: {entry.WantsReply}");
        body.AppendLine($"Name: {entry.Name ?? "anonymous"}");
        body.AppendLine($"Email: {entry.Email ?? "not provided"}");
        body.AppendLine($"Subject: {entry.Subject ?? "none"}");
        body.AppendLine($"Submitted at (UTC): {entry.CreatedAtUtc:O}");
        body.AppendLine();
        body.AppendLine("Message:");
        body.AppendLine(entry.Message);
        return body.ToString();
    }

    private static string BuildSubject(FeedbackEntry entry)
    {
        var subjectPrefix = $"[{entry.Category}]";
        return string.IsNullOrWhiteSpace(entry.Subject)
            ? $"{subjectPrefix} New LLM Prompt Purify feedback"
            : $"{subjectPrefix} {entry.Subject}";
    }
}
