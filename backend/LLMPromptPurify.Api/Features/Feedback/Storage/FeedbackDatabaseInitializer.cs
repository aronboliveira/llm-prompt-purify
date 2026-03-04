using Npgsql;

namespace LLMPromptPurify.Api.Features.Feedback.Storage;

public sealed class FeedbackDatabaseInitializer
{
    private readonly ILogger<FeedbackDatabaseInitializer> _logger;
    private readonly NpgsqlDataSource _dataSource;

    public FeedbackDatabaseInitializer(
        NpgsqlDataSource dataSource,
        ILogger<FeedbackDatabaseInitializer> logger
    )
    {
        _dataSource = dataSource;
        _logger = logger;
    }

    public async Task InitializeAsync(CancellationToken cancellationToken)
    {
        const string commandText =
            """
            create table if not exists feedback_submissions (
                id uuid primary key,
                category text not null,
                email varchar(160),
                message text not null,
                name varchar(80),
                rating smallint,
                source text not null,
                subject varchar(160),
                wants_reply boolean not null,
                created_at_utc timestamptz not null,
                delivery_status text not null,
                delivery_error text
            );

            create index if not exists ix_feedback_submissions_created_at_utc
                on feedback_submissions (created_at_utc desc);
            """;

        await using var connection = await _dataSource.OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(commandText, connection);
        await command.ExecuteNonQueryAsync(cancellationToken);

        _logger.LogInformation("Feedback database schema is ready.");
    }
}
