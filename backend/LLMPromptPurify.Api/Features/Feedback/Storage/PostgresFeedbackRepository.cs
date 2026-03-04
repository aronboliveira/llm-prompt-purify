using LLMPromptPurify.Api.Features.Feedback.Abstractions;
using LLMPromptPurify.Api.Features.Feedback.Domain;
using Npgsql;

namespace LLMPromptPurify.Api.Features.Feedback.Storage;

public sealed class PostgresFeedbackRepository : IFeedbackRepository
{
    private readonly NpgsqlDataSource _dataSource;

    public PostgresFeedbackRepository(NpgsqlDataSource dataSource)
    {
        _dataSource = dataSource;
    }

    public async Task CreateAsync(FeedbackEntry entry, CancellationToken cancellationToken)
    {
        const string commandText =
            """
            insert into feedback_submissions (
                id,
                category,
                email,
                message,
                name,
                rating,
                source,
                subject,
                wants_reply,
                created_at_utc,
                delivery_status,
                delivery_error
            )
            values (
                @id,
                @category,
                @email,
                @message,
                @name,
                @rating,
                @source,
                @subject,
                @wantsReply,
                @createdAtUtc,
                @deliveryStatus,
                @deliveryError
            );
            """;

        await using var connection = await _dataSource.OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(commandText, connection);
        command.Parameters.AddWithValue("id", entry.Id);
        command.Parameters.AddWithValue("category", entry.Category);
        command.Parameters.AddWithValue("email", (object?)entry.Email ?? DBNull.Value);
        command.Parameters.AddWithValue("message", entry.Message);
        command.Parameters.AddWithValue("name", (object?)entry.Name ?? DBNull.Value);
        command.Parameters.AddWithValue("rating", (object?)entry.Rating ?? DBNull.Value);
        command.Parameters.AddWithValue("source", entry.Source);
        command.Parameters.AddWithValue("subject", (object?)entry.Subject ?? DBNull.Value);
        command.Parameters.AddWithValue("wantsReply", entry.WantsReply);
        command.Parameters.AddWithValue("createdAtUtc", entry.CreatedAtUtc);
        command.Parameters.AddWithValue("deliveryStatus", entry.DeliveryStatus.ToApiValue());
        command.Parameters.AddWithValue(
            "deliveryError",
            (object?)entry.DeliveryError ?? DBNull.Value
        );
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task UpdateDeliveryStatusAsync(
        Guid id,
        FeedbackDeliveryStatus deliveryStatus,
        string? deliveryError,
        CancellationToken cancellationToken
    )
    {
        const string commandText =
            """
            update feedback_submissions
            set
                delivery_status = @deliveryStatus,
                delivery_error = @deliveryError
            where id = @id;
            """;

        await using var connection = await _dataSource.OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(commandText, connection);
        command.Parameters.AddWithValue("id", id);
        command.Parameters.AddWithValue("deliveryStatus", deliveryStatus.ToApiValue());
        command.Parameters.AddWithValue("deliveryError", (object?)deliveryError ?? DBNull.Value);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }
}
