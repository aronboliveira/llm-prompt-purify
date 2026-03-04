using LLMPromptPurify.Api.Features.Feedback.Abstractions;
using LLMPromptPurify.Api.Features.Feedback.Contracts;
using LLMPromptPurify.Api.Features.Feedback.Domain;
using LLMPromptPurify.Api.Features.Feedback.Options;
using LLMPromptPurify.Api.Features.Feedback.Services;
using LLMPromptPurify.Api.Features.Feedback.Storage;
using LLMPromptPurify.Api.Features.MaskSafety.Contracts;
using LLMPromptPurify.Api.Features.MaskSafety.Services;
using Npgsql;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddProblemDetails();
builder.Services.AddSingleton<TimeProvider>(TimeProvider.System);
builder.Services.Configure<DeveloperEmailOptions>(
    builder.Configuration.GetSection(DeveloperEmailOptions.SectionName)
);
builder.Services.AddSingleton(
    _ =>
    {
        var connectionString = builder.Configuration.GetConnectionString("FeedbackDatabase");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                "The FeedbackDatabase connection string is required."
            );
        }

        return NpgsqlDataSource.Create(connectionString);
    }
);
builder.Services.AddSingleton<FeedbackDatabaseInitializer>();
builder.Services.AddSingleton<FeedbackRequestValidator>();
builder.Services.AddSingleton<IFeedbackRepository, PostgresFeedbackRepository>();
builder.Services.AddSingleton<IDeveloperEmailSender, SmtpDeveloperEmailSender>();
builder.Services.AddSingleton<FeedbackSubmissionService>();
builder.Services.AddSingleton<MaskSafetyValidationService>();

var app = builder.Build();

app.UseExceptionHandler();

using (var scope = app.Services.CreateScope())
{
    var initializer = scope.ServiceProvider.GetRequiredService<FeedbackDatabaseInitializer>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

    try
    {
        await initializer.InitializeAsync(app.Lifetime.ApplicationStopping);
    }
    catch (Exception exception)
    {
        logger.LogWarning(
            exception,
            "Feedback database initialization failed. Feedback storage will stay unavailable until the database can be reached."
        );
    }
}

app.MapGet(
    "/api/health",
    () =>
        Results.Ok(
            new
            {
                status = "ok",
                service = "feedback-api",
            }
        )
);

app.MapPost(
    "/api/feedback",
    async Task<IResult> (
        FeedbackSubmissionRequest request,
        FeedbackSubmissionService service,
        CancellationToken cancellationToken
    ) =>
    {
        var result = await service.SubmitAsync(request, cancellationToken);
        if (!result.IsValid)
        {
            return Results.ValidationProblem(result.Errors.ToDictionary(pair => pair.Key, pair => pair.Value));
        }

        var entry = result.Entry!;
        return Results.Created(
            $"/api/feedback/{entry.Id}",
            new FeedbackSubmissionResponse
            {
                CreatedAtUtc = entry.CreatedAtUtc,
                DeliveryStatus = entry.DeliveryStatus.ToApiValue(),
                Id = entry.Id,
                Message = entry.DeliveryStatus switch
                {
                    FeedbackDeliveryStatus.Emailed =>
                        "Feedback saved and emailed to the developers.",
                    _ =>
                        "Feedback saved, but the developer email could not be delivered from this environment.",
                },
            }
        );
    }
);

app.MapPost(
    "/api/mask-safety/validate",
    (MaskSafetyValidationRequest request, MaskSafetyValidationService service) =>
    {
        if (request.Candidates.Count > MaskSafetyValidationService.MaxBatchSize)
        {
            return Results.ValidationProblem(
                new Dictionary<string, string[]>
                {
                    ["candidates"] =
                    [
                        $"At most {MaskSafetyValidationService.MaxBatchSize} validation candidates can be checked per request.",
                    ],
                }
            );
        }

        return Results.Ok(service.Validate(request));
    }
);

app.Run();

public partial class Program;
