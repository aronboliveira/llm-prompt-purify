using LLMPromptPurify.Api.Features.Feedback.Abstractions;
using LLMPromptPurify.Api.Features.Feedback.Domain;
using LLMPromptPurify.Api.Features.Feedback.Storage;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Npgsql;

namespace LLMPromptPurify.Api.Tests;

/// <summary>
/// Replaces infrastructure services (PostgreSQL, SMTP) with in-memory fakes
/// so integration tests run without external dependencies.
/// </summary>
public static class TestServiceOverrides
{
    public static void ReplaceExternalDependencies(IServiceCollection services)
    {
        // Remove real Npgsql data source (requires running PostgreSQL)
        services.RemoveAll<NpgsqlDataSource>();

        // Replace database initializer with a no-op stub so GetRequiredService
        // in Program.cs succeeds without needing a real NpgsqlDataSource.
        services.RemoveAll<FeedbackDatabaseInitializer>();
        services.AddSingleton<FeedbackDatabaseInitializer>(sp =>
        {
            // Use the parameterless-style trick: create via
            // System.Runtime.CompilerServices.RuntimeHelpers (uninitialized)
            // — but simpler: pass a null NpgsqlDataSource since
            // InitializeAsync will never be reached (caught by try/catch).
            return (FeedbackDatabaseInitializer)System.Runtime.CompilerServices
                .RuntimeHelpers.GetUninitializedObject(typeof(FeedbackDatabaseInitializer));
        });

        // Replace repository with in-memory fake
        services.RemoveAll<IFeedbackRepository>();
        services.AddSingleton<IFeedbackRepository, InMemoryFeedbackRepository>();

        // Replace email sender with fake that always returns StoredOnly
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
