using LLMPromptPurify.Api.Features.Feedback.Abstractions;
using LLMPromptPurify.Api.Features.Feedback.Domain;
using MongoDB.Driver;

namespace LLMPromptPurify.Api.Features.Feedback.Storage;

public sealed class MongoFeedbackRepository : IFeedbackRepository
{
    private readonly IMongoCollection<FeedbackEntry> _collection;

    public MongoFeedbackRepository(IMongoDatabase database)
    {
        _collection = database.GetCollection<FeedbackEntry>("feedback_submissions");
    }

    public async Task CreateAsync(FeedbackEntry entry, CancellationToken cancellationToken)
    {
        await _collection.InsertOneAsync(entry, cancellationToken: cancellationToken);
    }

    public async Task UpdateDeliveryStatusAsync(
        Guid id,
        FeedbackDeliveryStatus deliveryStatus,
        string? deliveryError,
        CancellationToken cancellationToken
    )
    {
        var update = Builders<FeedbackEntry>.Update
            .Set(e => e.DeliveryStatus, deliveryStatus)
            .Set(e => e.DeliveryError, deliveryError);

        await _collection.UpdateOneAsync(e => e.Id == id, update, cancellationToken: cancellationToken);
    }
}
