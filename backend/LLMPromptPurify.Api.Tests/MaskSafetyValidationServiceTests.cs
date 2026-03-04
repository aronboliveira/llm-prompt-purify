using LLMPromptPurify.Api.Features.MaskSafety.Contracts;
using LLMPromptPurify.Api.Features.MaskSafety.Domain;
using LLMPromptPurify.Api.Features.MaskSafety.Services;

namespace LLMPromptPurify.Api.Tests;

public sealed class MaskSafetyValidationServiceTests
{
    private readonly MaskSafetyValidationService _service = new();

    [Fact]
    public void Marks_Valid_Cpf_Candidates_As_Compromising()
    {
        var response = _service.Validate(
            new MaskSafetyValidationRequest
            {
                Candidates =
                [
                    new MaskSafetyValidationItemRequest
                    {
                        CandidateValue = "529.982.247-25",
                        RuleId = "cpf",
                    },
                ],
            }
        );

        var result = Assert.Single(response.Results);
        Assert.True(result.IsSupported);
        Assert.True(result.IsCompromising);
        Assert.Equal(MaskSafetyDecision.Compromising, result.Decision);
    }

    [Fact]
    public void Marks_Invalid_Cpf_Candidates_As_Safe()
    {
        var response = _service.Validate(
            new MaskSafetyValidationRequest
            {
                Candidates =
                [
                    new MaskSafetyValidationItemRequest
                    {
                        CandidateValue = "529.982.247-26",
                        RuleId = "cpf",
                    },
                ],
            }
        );

        var result = Assert.Single(response.Results);
        Assert.True(result.IsSupported);
        Assert.False(result.IsCompromising);
        Assert.Equal(MaskSafetyDecision.Safe, result.Decision);
    }

    [Fact]
    public void Marks_Unsupported_Rules_Explicitly()
    {
        var response = _service.Validate(
            new MaskSafetyValidationRequest
            {
                Candidates =
                [
                    new MaskSafetyValidationItemRequest
                    {
                        CandidateValue = "123-45-6789",
                        RuleId = "us-ssn",
                    },
                ],
            }
        );

        var result = Assert.Single(response.Results);
        Assert.False(result.IsSupported);
        Assert.False(result.IsCompromising);
        Assert.Equal(MaskSafetyDecision.Unsupported, result.Decision);
    }

    [Fact]
    public void Detects_Global_Financial_Identifiers_That_Still_Look_Real()
    {
        var response = _service.Validate(
            new MaskSafetyValidationRequest
            {
                Candidates =
                [
                    new MaskSafetyValidationItemRequest
                    {
                        CandidateValue = "4111 1111 1111 1111",
                        RuleId = "credit-card",
                    },
                    new MaskSafetyValidationItemRequest
                    {
                        CandidateValue = "GB29NWBK60161331926819",
                        RuleId = "iban",
                    },
                ],
            }
        );

        Assert.All(response.Results, result =>
        {
            Assert.True(result.IsSupported);
            Assert.True(result.IsCompromising);
            Assert.Equal(MaskSafetyDecision.Compromising, result.Decision);
        });
    }

    [Fact]
    public void Handles_Mixed_Batch_Results_Across_Locales()
    {
        var response = _service.Validate(
            new MaskSafetyValidationRequest
            {
                Candidates =
                [
                    new MaskSafetyValidationItemRequest
                    {
                        CandidateValue = "11010519491231002X",
                        RuleId = "cn-resident-id-labeled",
                    },
                    new MaskSafetyValidationItemRequest
                    {
                        CandidateValue = "110105194912310021",
                        RuleId = "cn-resident-id-labeled",
                    },
                    new MaskSafetyValidationItemRequest
                    {
                        CandidateValue = "12.345.678-5",
                        RuleId = "chile-rut",
                    },
                    new MaskSafetyValidationItemRequest
                    {
                        CandidateValue = "12.345.678-4",
                        RuleId = "chile-rut",
                    },
                ],
            }
        );

        Assert.Collection(
            response.Results,
            result =>
            {
                Assert.True(result.IsSupported);
                Assert.True(result.IsCompromising);
            },
            result =>
            {
                Assert.True(result.IsSupported);
                Assert.False(result.IsCompromising);
            },
            result =>
            {
                Assert.True(result.IsSupported);
                Assert.True(result.IsCompromising);
            },
            result =>
            {
                Assert.True(result.IsSupported);
                Assert.False(result.IsCompromising);
            }
        );
    }
}
