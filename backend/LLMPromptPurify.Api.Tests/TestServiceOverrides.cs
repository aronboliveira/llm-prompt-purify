using LLMPromptPurify.Api.Features.Feedback.Abstractions;
using LLMPromptPurify.Api.Features.Feedback.Domain;
using LLMPromptPurify.Api.Features.Feedback.Storage;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using MongoDB.Driver;

namespace LLMPromptPurify.Api.Tests;

public static class TestServiceOverrides
{
    private class NoOpDatabaseInitializer : FeedbackDatabaseInitializer
    {
        public NoOpDatabaseInitializer() : base(null!, null!) {}
        
        public override Task InitializeAsync(CancellationToken cancellationToken) => Task.CompletedTask;
    }

    public static void ReplaceExternalDependencies(IServiceCollection services)
    {
        services.RemoveAll<IMongoClient>();
        services.RemoveAll<IMongoDatabase>();

        services.RemoveAll<FeedbackDatabaseInitializer>();
        services.AddSingleton<FeedbackDatabaseInitializer, NoOpDatabaseInitializer>();

        services.RemoveAll<IFeedbackRepository>();
        services.AddSingleton<IFeedbackRepository, InMemoryFeedbackRepository>();
        
        services.RemoveAll<IDeveloperEmailSender>();
        services.AddSingleton<IDeveloperEmailSender, FakeDeveloperEmailSender>();
    }

    private sealed class InMemoryFeedbackRepository : IFeedbackRepository
    {
        private readonly List<FeedbackEntry> _entries = [];
        private readonly object _lock = new();

        public Task CreateAsync(FeedbackEntry entry, CancellationToken cancellationToken)
        {
            lock (_lock) { _entries.Add(entry); }
            return Task.CompletedTask;
        }

        public Task UpdateDeliveryStatusAsync(
            Guid id,
            FeedbackDeliveryStatus deliveryStatus,
            string? deliveryError,
            CancellationToken cancellationToken)
        {
            lock (_lock)
            {
                var index = _entries.FindIndex(e => e.Id == id);
                if (index >= 0)
                {
                    _entries[index] = _entries[index] with
                    {
                        DeliveryStatus = deliveryStatus,
                        DeliveryError = deliveryError,
                    };
                }
            }
            return Task.CompletedTask;
        }
    }

    private sealed class FakeDeveloperEmailSender : IDeveloperEmailSender
    {
        public Task<FeedbackDispatchResult> SendAsync(
            FeedbackEntry entry, CancellationToken cancellationToken)
        {
            return Task.FromResult(new FeedbackDispatchResult(
                FeedbackDeliveryStatus.StoredOnly,
                "Test environment — SMTP not configured."));
        }
    }
}
