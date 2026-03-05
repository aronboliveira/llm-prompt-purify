using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;

namespace LLMPromptPurify.Api.Tests;

public sealed class HealthEndpointTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public HealthEndpointTests(WebApplicationFactory<Program> factory)
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

    [Fact]
    public async Task Health_Returns_200_With_Status_Ok()
    {
        var response = await _client.GetAsync("/api/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.Equal("ok", doc.RootElement.GetProperty("status").GetString());
        Assert.Equal("feedback-api", doc.RootElement.GetProperty("service").GetString());
    }

    [Fact]
    public async Task Health_Returns_Json_Content_Type()
    {
        var response = await _client.GetAsync("/api/health");

        Assert.Equal("application/json", response.Content.Headers.ContentType?.MediaType);
    }
}
