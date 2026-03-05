using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using LLMPromptPurify.Api.Features.Feedback.Contracts;
using Microsoft.AspNetCore.Mvc.Testing;

namespace LLMPromptPurify.Api.Tests;

public sealed class FeedbackEndpointTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public FeedbackEndpointTests(WebApplicationFactory<Program> factory)
    {
        _client = factory
            .WithWebHostBuilder(builder =>
            {
                builder.ConfigureServices(services =>
                {
                    TestServiceOverrides.ReplaceExternalDependencies(services);
                });
            })
            .CreateClient();
    }

    // ── Successful submissions ──────────────────────────────────────

    [Fact]
    public async Task Valid_General_Feedback_Returns_201_Created()
    {
        var response = await PostFeedback(new
        {
            category = "general-feedback",
            message = "The scanner works great for detecting SSNs.",
            email = "tester@example.com",
            name = "Tester",
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.NotNull(response.Headers.Location);

        var body = await Deserialize(response);
        Assert.NotEqual(Guid.Empty, body.Id);
        Assert.False(string.IsNullOrWhiteSpace(body.Message));
    }

    [Fact]
    public async Task Appraisal_With_Rating_Returns_201()
    {
        var response = await PostFeedback(new
        {
            category = "appraisal",
            message = "Excellent tool for privacy compliance.",
            rating = 5,
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task Bug_Report_Without_Email_Returns_201()
    {
        var response = await PostFeedback(new
        {
            category = "bug-report",
            message = "The CPF detection misses some edge cases.",
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task Contact_Developers_With_All_Fields_Returns_201()
    {
        var response = await PostFeedback(new
        {
            category = "contact-developers",
            message = "Would love to discuss enterprise licensing.",
            email = "enterprise@corp.com",
            name = "Enterprise Lead",
            subject = "Enterprise inquiry",
            wantsReply = true,
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var body = await Deserialize(response);
        Assert.Contains("/api/feedback/", response.Headers.Location?.ToString());
    }

    [Fact]
    public async Task Response_Contains_DeliveryStatus_And_Timestamp()
    {
        var response = await PostFeedback(new
        {
            category = "general-feedback",
            message = "Just testing the response shape.",
        });

        var body = await Deserialize(response);
        Assert.False(string.IsNullOrWhiteSpace(body.DeliveryStatus));
        Assert.True(body.CreatedAtUtc > DateTimeOffset.MinValue);
    }

    // ── Validation errors ───────────────────────────────────────────

    [Fact]
    public async Task Empty_Body_Returns_Validation_Errors()
    {
        var response = await PostFeedback(new { });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Missing_Category_Returns_Category_Error()
    {
        var response = await PostFeedback(new
        {
            message = "No category provided.",
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var errors = await DeserializeErrors(response);
        Assert.True(errors.ContainsKey("category"));
    }

    [Fact]
    public async Task Unknown_Category_Returns_Category_Error()
    {
        var response = await PostFeedback(new
        {
            category = "nonexistent-category",
            message = "Testing unknown category.",
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var errors = await DeserializeErrors(response);
        Assert.True(errors.ContainsKey("category"));
    }

    [Fact]
    public async Task Missing_Message_Returns_Message_Error()
    {
        var response = await PostFeedback(new
        {
            category = "general-feedback",
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var errors = await DeserializeErrors(response);
        Assert.True(errors.ContainsKey("message"));
    }

    [Fact]
    public async Task Message_Over_4000_Chars_Returns_Message_Error()
    {
        var response = await PostFeedback(new
        {
            category = "general-feedback",
            message = new string('A', 4001),
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var errors = await DeserializeErrors(response);
        Assert.True(errors.ContainsKey("message"));
    }

    [Fact]
    public async Task Appraisal_Without_Rating_Returns_Rating_Error()
    {
        var response = await PostFeedback(new
        {
            category = "appraisal",
            message = "Forgot to include the rating.",
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var errors = await DeserializeErrors(response);
        Assert.True(errors.ContainsKey("rating"));
    }

    [Fact]
    public async Task Rating_Out_Of_Range_Returns_Rating_Error()
    {
        var response = await PostFeedback(new
        {
            category = "general-feedback",
            message = "Testing rating boundary.",
            rating = 0,
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var errors = await DeserializeErrors(response);
        Assert.True(errors.ContainsKey("rating"));
    }

    [Fact]
    public async Task Rating_Above_5_Returns_Rating_Error()
    {
        var response = await PostFeedback(new
        {
            category = "general-feedback",
            message = "Testing upper rating boundary.",
            rating = 6,
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var errors = await DeserializeErrors(response);
        Assert.True(errors.ContainsKey("rating"));
    }

    [Fact]
    public async Task WantsReply_Without_Email_Returns_Email_Error()
    {
        var response = await PostFeedback(new
        {
            category = "general-feedback",
            message = "I want a reply but forgot my email.",
            wantsReply = true,
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var errors = await DeserializeErrors(response);
        Assert.True(errors.ContainsKey("email"));
    }

    [Fact]
    public async Task Invalid_Email_Format_Returns_Email_Error()
    {
        var response = await PostFeedback(new
        {
            category = "general-feedback",
            message = "Bad email format test.",
            email = "not-an-email",
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var errors = await DeserializeErrors(response);
        Assert.True(errors.ContainsKey("email"));
    }

    [Fact]
    public async Task ContactDevelopers_Without_Email_Returns_Email_Error()
    {
        var response = await PostFeedback(new
        {
            category = "contact-developers",
            message = "Please look into this.",
            subject = "Urgent",
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var errors = await DeserializeErrors(response);
        Assert.True(errors.ContainsKey("email"));
    }

    [Fact]
    public async Task ContactDevelopers_Without_Subject_Returns_Subject_Error()
    {
        var response = await PostFeedback(new
        {
            category = "contact-developers",
            message = "I need help.",
            email = "user@example.com",
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var errors = await DeserializeErrors(response);
        Assert.True(errors.ContainsKey("subject"));
    }

    [Fact]
    public async Task Name_Over_80_Chars_Returns_Name_Error()
    {
        var response = await PostFeedback(new
        {
            category = "general-feedback",
            message = "Testing name length.",
            name = new string('A', 81),
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var errors = await DeserializeErrors(response);
        Assert.True(errors.ContainsKey("name"));
    }

    [Fact]
    public async Task Subject_Over_160_Chars_Returns_Subject_Error()
    {
        var response = await PostFeedback(new
        {
            category = "general-feedback",
            message = "Testing subject length.",
            subject = new string('S', 161),
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var errors = await DeserializeErrors(response);
        Assert.True(errors.ContainsKey("subject"));
    }

    // ── Helpers ─────────────────────────────────────────────────────

    private async Task<HttpResponseMessage> PostFeedback(object body)
    {
        return await _client.PostAsJsonAsync("/api/feedback", body);
    }

    private static async Task<FeedbackSubmissionResponse> Deserialize(HttpResponseMessage response)
    {
        var json = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<FeedbackSubmissionResponse>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
        })!;
    }

    private static async Task<Dictionary<string, string[]>> DeserializeErrors(HttpResponseMessage response)
    {
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var errors = new Dictionary<string, string[]>(StringComparer.Ordinal);

        if (doc.RootElement.TryGetProperty("errors", out var errorsElement))
        {
            foreach (var prop in errorsElement.EnumerateObject())
            {
                var values = prop.Value.EnumerateArray().Select(v => v.GetString()!).ToArray();
                errors[prop.Name] = values;
            }
        }

        return errors;
    }
}
