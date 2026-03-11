using LLMPromptPurify.Api.Features.Feedback.Domain;
using MongoDB.Driver;

namespace LLMPromptPurify.Api.Features.Feedback.Storage;

public class FeedbackDatabaseInitializer
{
    private readonly ILogger<FeedbackDatabaseInitializer> _logger;
    private readonly IMongoDatabase _database;

    public FeedbackDatabaseInitializer(
        IMongoDatabase database,
        ILogger<FeedbackDatabaseInitializer> logger
    )
    {
        _database = database;
        _logger = logger;
    }

    public virtual async Task InitializeAsync(CancellationToken cancellationToken)
    {
        var collection = _database.GetCollection<FeedbackEntry>("feedback_submissions");

        var indexKeysDefinition = Builders<FeedbackEntry>.IndexKeys.Descending(x => x.CreatedAtUtc);
        var indexModel = new CreateIndexModel<FeedbackEntry>(indexKeysDefinition);

        await collection.Indexes.CreateOneAsync(indexModel, cancellationToken: cancellationToken);

        _logger.LogInformation("Feedback database (MongoDB) schema and indexes are ready.");
    }
}
