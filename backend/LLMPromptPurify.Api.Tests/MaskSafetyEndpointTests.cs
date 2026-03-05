using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;

namespace LLMPromptPurify.Api.Tests;

public sealed class MaskSafetyEndpointTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public MaskSafetyEndpointTests(WebApplicationFactory<Program> factory)
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

    // ── CPF ─────────────────────────────────────────────────────────

    [Theory]
    [InlineData("529.982.247-25", true)]   // valid CPF (check digits pass)
    [InlineData("111.111.111-11", false)]   // all-same digits — fails validation
    [InlineData("000.000.000-00", false)]   // zero CPF — fails
    public async Task Cpf_Rule_Returns_Expected_Decision(string value, bool expectCompromising)
    {
        var result = await ValidateSingle("cpf", value);
        Assert.True(result.IsSupported);
        Assert.Equal(expectCompromising, result.IsCompromising);
    }

    // ── CNPJ ────────────────────────────────────────────────────────

    [Theory]
    [InlineData("11.222.333/0001-81", true)]   // valid CNPJ
    [InlineData("00.000.000/0000-00", false)]   // all zeros
    public async Task Cnpj_Rule_Returns_Expected_Decision(string value, bool expectCompromising)
    {
        var result = await ValidateSingle("cnpj", value);
        Assert.True(result.IsSupported);
        Assert.Equal(expectCompromising, result.IsCompromising);
    }

    // ── Credit Card (Luhn) ──────────────────────────────────────────

    [Theory]
    [InlineData("4111111111111111", true)]    // Visa test card (Luhn valid)
    [InlineData("5500000000000004", true)]    // MasterCard test card
    [InlineData("1234567890123456", false)]   // random digits — Luhn fails
    public async Task CreditCard_Rule_Returns_Expected_Decision(string value, bool expectCompromising)
    {
        var result = await ValidateSingle("credit-card", value);
        Assert.True(result.IsSupported);
        Assert.Equal(expectCompromising, result.IsCompromising);
    }

    // ── IBAN ────────────────────────────────────────────────────────

    [Theory]
    [InlineData("GB29NWBK60161331926819", true)]    // valid UK IBAN
    [InlineData("DE89370400440532013000", true)]     // valid DE IBAN
    [InlineData("XX00INVALID0000000000", false)]     // made-up — fails mod-97
    public async Task Iban_Rule_Returns_Expected_Decision(string value, bool expectCompromising)
    {
        var result = await ValidateSingle("iban", value);
        Assert.True(result.IsSupported);
        Assert.Equal(expectCompromising, result.IsCompromising);
    }

    // ── Argentine CUIT ──────────────────────────────────────────────

    [Theory]
    [InlineData("20-12345678-3", true)]    // valid CUIT
    [InlineData("99-00000000-0", false)]   // invalid
    public async Task Cuit_Rule_Returns_Expected_Decision(string value, bool expectCompromising)
    {
        var result = await ValidateSingle("cuit", value);
        Assert.True(result.IsSupported);
        Assert.Equal(expectCompromising, result.IsCompromising);
    }

    // ── Chilean RUT ─────────────────────────────────────────────────

    [Theory]
    [InlineData("12.345.678-5", true)]    // valid RUT
    [InlineData("00.000.000-0", false)]   // invalid
    public async Task ChileRut_Rule_Returns_Expected_Decision(string value, bool expectCompromising)
    {
        var result = await ValidateSingle("chile-rut", value);
        Assert.True(result.IsSupported);
        Assert.Equal(expectCompromising, result.IsCompromising);
    }

    // ── Spanish DNI ─────────────────────────────────────────────────

    [Theory]
    [InlineData("12345678Z", true)]    // valid DNI (Z is correct letter for 12345678)
    [InlineData("00000000A", false)]   // invalid
    public async Task SpanishDni_Rule_Returns_Expected_Decision(string value, bool expectCompromising)
    {
        var result = await ValidateSingle("es-dni-labeled", value);
        Assert.True(result.IsSupported);
        Assert.Equal(expectCompromising, result.IsCompromising);
    }

    // ── Spanish NIE ─────────────────────────────────────────────────

    [Theory]
    [InlineData("X1234567L", true)]    // valid NIE
    [InlineData("Z0000000X", false)]   // invalid
    public async Task SpanishNie_Rule_Returns_Expected_Decision(string value, bool expectCompromising)
    {
        var result = await ValidateSingle("es-nie-labeled", value);
        Assert.True(result.IsSupported);
        Assert.Equal(expectCompromising, result.IsCompromising);
    }

    // ── Unsupported rules ───────────────────────────────────────────

    [Fact]
    public async Task Unknown_Rule_Returns_Unsupported()
    {
        var result = await ValidateSingle("some-unknown-rule", "12345");
        Assert.False(result.IsSupported);
        Assert.Equal("unsupported", result.Decision);
    }

    // ── Empty values ────────────────────────────────────────────────

    [Fact]
    public async Task Empty_CandidateValue_Returns_Unsupported()
    {
        var result = await ValidateSingle("cpf", "");
        Assert.False(result.IsSupported);
    }

    [Fact]
    public async Task Empty_RuleId_Returns_Unsupported()
    {
        var result = await ValidateSingle("", "529.982.247-25");
        Assert.False(result.IsSupported);
    }

    // ── Batch constraints ───────────────────────────────────────────

    [Fact]
    public async Task Batch_Over_128_Returns_Validation_Error()
    {
        var candidates = Enumerable.Range(0, 129)
            .Select(i => new { ruleId = "cpf", candidateValue = "529.982.247-25" })
            .ToArray();

        var response = await _client.PostAsJsonAsync("/api/mask-safety/validate", new { candidates });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Batch_Of_Multiple_Rules_Returns_All_Results()
    {
        var candidates = new[]
        {
            new { ruleId = "cpf", candidateValue = "529.982.247-25" },
            new { ruleId = "credit-card", candidateValue = "4111111111111111" },
            new { ruleId = "iban", candidateValue = "GB29NWBK60161331926819" },
        };

        var response = await _client.PostAsJsonAsync("/api/mask-safety/validate", new { candidates });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var results = doc.RootElement.GetProperty("results");
        Assert.Equal(3, results.GetArrayLength());

        foreach (var item in results.EnumerateArray())
        {
            Assert.True(item.GetProperty("isSupported").GetBoolean());
            Assert.True(item.GetProperty("isCompromising").GetBoolean());
        }
    }

    // ── Helpers ─────────────────────────────────────────────────────

    private async Task<ValidationResult> ValidateSingle(string ruleId, string candidateValue)
    {
        var body = new
        {
            candidates = new[]
            {
                new { ruleId, candidateValue },
            },
        };

        var response = await _client.PostAsJsonAsync("/api/mask-safety/validate", body);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var first = doc.RootElement.GetProperty("results")[0];

        return new ValidationResult(
            IsSupported: first.GetProperty("isSupported").GetBoolean(),
            IsCompromising: first.GetProperty("isCompromising").GetBoolean(),
            Decision: first.GetProperty("decision").GetString()!
        );
    }

    private sealed record ValidationResult(bool IsSupported, bool IsCompromising, string Decision);
}
