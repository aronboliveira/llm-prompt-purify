using MongoDB.Bson.Serialization;
using MongoDB.Bson.Serialization.Serializers;
using MongoDB.Bson;
using System.Threading.RateLimiting;
using LLMPromptPurify.Api.Features.Auth;
using LLMPromptPurify.Api.Features.Feedback.Abstractions;
using LLMPromptPurify.Api.Features.Feedback.Contracts;
using LLMPromptPurify.Api.Features.Feedback.Domain;
using LLMPromptPurify.Api.Features.Feedback.Options;
using LLMPromptPurify.Api.Features.Feedback.Services;
using LLMPromptPurify.Api.Features.Feedback.Storage;
using LLMPromptPurify.Api.Features.MaskSafety.Contracts;
using LLMPromptPurify.Api.Features.MaskSafety.Services;
using MongoDB.Driver;

if (!BsonClassMap.IsClassMapRegistered(typeof(FeedbackEntry)))
{
    try
    {
        BsonClassMap.RegisterClassMap<FeedbackEntry>(cm =>
        {
            cm.AutoMap();
            cm.MapIdMember(c => c.Id)
              .SetSerializer(new GuidSerializer(BsonType.String));
        });
    }
    catch (ArgumentException) { /* Already registered by a concurrent startup (e.g. parallel xUnit fixtures) */ }
}
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddProblemDetails();
builder.Services.AddSingleton<TimeProvider>(TimeProvider.System);

// S-011: Add Swagger/OpenAPI documentation
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new()
    {
        Title = "LLM Prompt Purify API",
        Version = "v1",
        Description = "Backend API for the LLM Prompt Purifier - privacy-first text masking service"
    });
});

// V-003: Configure API key authentication (disabled by default in development)
builder.Services.AddApiKeyAuthentication(builder.Configuration);

// V-005: Configure CORS with explicit origin restrictions
var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:4200", "http://localhost:4000"];
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// V-001: Configure rate limiting (5 requests/minute per IP for feedback)
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("feedback", httpContext =>
        RateLimitPartition.GetSlidingWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new SlidingWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(1),
                SegmentsPerWindow = 2,
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            }));
});

builder.Services.Configure<DeveloperEmailOptions>(
    builder.Configuration.GetSection(DeveloperEmailOptions.SectionName)
);
builder.Services.AddSingleton<IMongoClient>(
    _ =>
    {
        var connectionString = builder.Configuration.GetConnectionString("FeedbackDatabase") 
            ?? "mongodb://localhost:27017";
        return new MongoClient(connectionString);
    }
);
builder.Services.AddSingleton<IMongoDatabase>(
    sp =>
    {
        var client = sp.GetRequiredService<IMongoClient>();
        return client.GetDatabase("llm_prompt_purify");
    }
);
builder.Services.AddSingleton<FeedbackDatabaseInitializer>();
builder.Services.AddSingleton<FeedbackRequestValidator>();
builder.Services.AddSingleton<IFeedbackRepository, MongoFeedbackRepository>();
builder.Services.AddSingleton<IDeveloperEmailSender, SmtpDeveloperEmailSender>();
builder.Services.AddSingleton<FeedbackSubmissionService>();
builder.Services.AddSingleton<MaskSafetyValidationService>();

var app = builder.Build();

app.UseExceptionHandler();

// S-011: Enable Swagger UI in development
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "LLM Prompt Purify API v1");
    });
}

app.UseCors();
app.UseRateLimiter();
app.UseApiKeyAuthentication(); // V-003: API key validation

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
).RequireRateLimiting("feedback");

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
