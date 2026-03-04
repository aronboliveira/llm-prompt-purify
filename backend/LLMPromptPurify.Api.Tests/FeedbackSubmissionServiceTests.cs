using LLMPromptPurify.Api.Features.Feedback.Abstractions;
using LLMPromptPurify.Api.Features.Feedback.Contracts;
using LLMPromptPurify.Api.Features.Feedback.Domain;
using LLMPromptPurify.Api.Features.Feedback.Services;
using Microsoft.Extensions.Logging.Abstractions;

namespace LLMPromptPurify.Api.Tests;

public sealed class FeedbackSubmissionServiceTests
{
    [Fact]
    public async Task Stores_And_Marks_Submissions_As_Emailed_When_Smtp_Succeeds()
    {
        var repository = new FakeFeedbackRepository();
        var service = CreateService(
            repository,
            new FakeDeveloperEmailSender(
                new FeedbackDispatchResult(FeedbackDeliveryStatus.Emailed)
            ),
            new DateTimeOffset(2026, 3, 3, 12, 0, 0, TimeSpan.Zero)
        );

        var result = await service.SubmitAsync(
            new FeedbackSubmissionRequest
            {
                Category = FeedbackCategoryCatalog.GeneralFeedback,
                Email = "user@example.com",
                Message = "The current scan flow is much clearer now.",
                Name = "Aron",
                Subject = "Quick note",
            },
            CancellationToken.None
        );

        Assert.True(result.IsValid);
        Assert.Single(repository.CreatedEntries);
        Assert.Single(repository.UpdatedDeliveries);
        Assert.Equal(FeedbackDeliveryStatus.Emailed, result.Entry!.DeliveryStatus);
        Assert.Equal(
            new DateTimeOffset(2026, 3, 3, 12, 0, 0, TimeSpan.Zero),
            result.Entry.CreatedAtUtc
        );
    }

    [Fact]
    public async Task Stores_Submissions_Even_When_Email_Delivery_Falls_Back_To_Storage_Only()
    {
        var repository = new FakeFeedbackRepository();
        var service = CreateService(
            repository,
            new FakeDeveloperEmailSender(
                new FeedbackDispatchResult(
                    FeedbackDeliveryStatus.StoredOnly,
                    "SMTP is not configured for developer email delivery."
                )
            ),
            new DateTimeOffset(2026, 3, 3, 12, 5, 0, TimeSpan.Zero)
        );

        var result = await service.SubmitAsync(
            new FeedbackSubmissionRequest
            {
                Category = FeedbackCategoryCatalog.ContactDevelopers,
                Email = "user@example.com",
                Message = "Please reach out about enterprise rollout support.",
                Subject = "Need follow-up",
                WantsReply = true,
            },
            CancellationToken.None
        );

        Assert.True(result.IsValid);
        Assert.Single(repository.CreatedEntries);
        Assert.Single(repository.UpdatedDeliveries);
        Assert.Equal(FeedbackDeliveryStatus.StoredOnly, result.Entry!.DeliveryStatus);
        Assert.Equal(
            "SMTP is not configured for developer email delivery.",
            result.Entry.DeliveryError
        );
    }

    [Fact]
    public async Task Returns_Validation_Errors_Without_Persisting_Invalid_Submissions()
    {
        var repository = new FakeFeedbackRepository();
        var service = CreateService(
            repository,
            new FakeDeveloperEmailSender(
                new FeedbackDispatchResult(FeedbackDeliveryStatus.Emailed)
            ),
            new DateTimeOffset(2026, 3, 3, 12, 10, 0, TimeSpan.Zero)
        );

        var result = await service.SubmitAsync(
            new FeedbackSubmissionRequest
            {
                Category = FeedbackCategoryCatalog.Appraisal,
                Message = "Solid improvements.",
            },
            CancellationToken.None
        );

        Assert.False(result.IsValid);
        Assert.Null(result.Entry);
        Assert.True(result.Errors.ContainsKey("rating"));
        Assert.Empty(repository.CreatedEntries);
        Assert.Empty(repository.UpdatedDeliveries);
    }

    private static FeedbackSubmissionService CreateService(
        IFeedbackRepository repository,
        IDeveloperEmailSender developerEmailSender,
        DateTimeOffset utcNow
    )
    {
        return new FeedbackSubmissionService(
            repository,
            developerEmailSender,
            new FeedbackRequestValidator(),
            new StubTimeProvider(utcNow),
            NullLogger<FeedbackSubmissionService>.Instance
        );
    }

    private sealed class FakeDeveloperEmailSender : IDeveloperEmailSender
    {
        private readonly FeedbackDispatchResult _dispatchResult;

        public FakeDeveloperEmailSender(FeedbackDispatchResult dispatchResult)
        {
            _dispatchResult = dispatchResult;
        }

        public Task<FeedbackDispatchResult> SendAsync(
            FeedbackEntry entry,
            CancellationToken cancellationToken
        )
        {
            return Task.FromResult(_dispatchResult);
        }
    }

    private sealed class FakeFeedbackRepository : IFeedbackRepository
    {
        public List<FeedbackEntry> CreatedEntries { get; } = [];

        public List<(Guid Id, FeedbackDeliveryStatus Status, string? Error)> UpdatedDeliveries { get; } =
            [];

        public Task CreateAsync(FeedbackEntry entry, CancellationToken cancellationToken)
        {
            CreatedEntries.Add(entry);
            return Task.CompletedTask;
        }

        public Task UpdateDeliveryStatusAsync(
            Guid id,
            FeedbackDeliveryStatus deliveryStatus,
            string? deliveryError,
            CancellationToken cancellationToken
        )
        {
            UpdatedDeliveries.Add((id, deliveryStatus, deliveryError));
            return Task.CompletedTask;
        }
    }

    private sealed class StubTimeProvider : TimeProvider
    {
        private readonly DateTimeOffset _utcNow;

        public StubTimeProvider(DateTimeOffset utcNow)
        {
            _utcNow = utcNow;
        }

        public override DateTimeOffset GetUtcNow()
        {
            return _utcNow;
        }
    }
}
