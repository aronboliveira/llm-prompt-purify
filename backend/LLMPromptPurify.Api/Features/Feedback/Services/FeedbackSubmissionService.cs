using LLMPromptPurify.Api.Features.Feedback.Abstractions;
using LLMPromptPurify.Api.Features.Feedback.Contracts;
using LLMPromptPurify.Api.Features.Feedback.Domain;

namespace LLMPromptPurify.Api.Features.Feedback.Services;

public sealed class FeedbackSubmissionService
{
    private static readonly IReadOnlyDictionary<string, string[]> EmptyErrors =
        new Dictionary<string, string[]>();

    private readonly IDeveloperEmailSender _developerEmailSender;
    private readonly IFeedbackRepository _feedbackRepository;
    private readonly ILogger<FeedbackSubmissionService> _logger;
    private readonly TimeProvider _timeProvider;
    private readonly FeedbackRequestValidator _validator;

    public FeedbackSubmissionService(
        IFeedbackRepository feedbackRepository,
        IDeveloperEmailSender developerEmailSender,
        FeedbackRequestValidator validator,
        TimeProvider timeProvider,
        ILogger<FeedbackSubmissionService> logger
    )
    {
        _feedbackRepository = feedbackRepository;
        _developerEmailSender = developerEmailSender;
        _validator = validator;
        _timeProvider = timeProvider;
        _logger = logger;
    }

    public async Task<FeedbackSubmissionResult> SubmitAsync(
        FeedbackSubmissionRequest request,
        CancellationToken cancellationToken
    )
    {
        var normalizedRequest = Normalize(request);
        var errors = _validator.Validate(normalizedRequest);
        if (errors.Count > 0)
        {
            return new FeedbackSubmissionResult(null, errors);
        }

        var initialEntry = new FeedbackEntry(
            Guid.NewGuid(),
            normalizedRequest.Category,
            NullIfWhiteSpace(normalizedRequest.Email),
            normalizedRequest.Message,
            NullIfWhiteSpace(normalizedRequest.Name),
            normalizedRequest.Rating,
            "web-app",
            NullIfWhiteSpace(normalizedRequest.Subject),
            normalizedRequest.WantsReply,
            _timeProvider.GetUtcNow(),
            FeedbackDeliveryStatus.StoredOnly,
            null
        );

        await _feedbackRepository.CreateAsync(initialEntry, cancellationToken);

        var dispatchResult = await _developerEmailSender.SendAsync(initialEntry, cancellationToken);
        var finalizedEntry = initialEntry with
        {
            DeliveryError = dispatchResult.ErrorMessage,
            DeliveryStatus = dispatchResult.Status,
        };

        if (
            finalizedEntry.DeliveryStatus != initialEntry.DeliveryStatus
            || finalizedEntry.DeliveryError != initialEntry.DeliveryError
        )
        {
            await _feedbackRepository.UpdateDeliveryStatusAsync(
                finalizedEntry.Id,
                finalizedEntry.DeliveryStatus,
                finalizedEntry.DeliveryError,
                cancellationToken
            );
        }

        _logger.LogInformation(
            "Feedback submission {FeedbackId} stored with delivery status {DeliveryStatus}.",
            finalizedEntry.Id,
            finalizedEntry.DeliveryStatus
        );

        return new FeedbackSubmissionResult(finalizedEntry, EmptyErrors);
    }

    private static FeedbackSubmissionRequest Normalize(FeedbackSubmissionRequest request)
    {
        // V-002: Sanitize all user-provided input to prevent XSS
        return new FeedbackSubmissionRequest
        {
            Category = request.Category?.Trim().ToLowerInvariant() ?? string.Empty,
            Email = request.Email?.Trim(),
            Message = InputSanitizer.SanitizeAndTrim(request.Message),
            Name = InputSanitizer.Sanitize(request.Name?.Trim()),
            Rating = request.Rating,
            Subject = InputSanitizer.Sanitize(request.Subject?.Trim()),
            WantsReply = request.WantsReply,
        };
    }

    private static string? NullIfWhiteSpace(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
