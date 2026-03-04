using System.Collections.Frozen;
using LLMPromptPurify.Api.Features.MaskSafety.Contracts;
using LLMPromptPurify.Api.Features.MaskSafety.Domain;

namespace LLMPromptPurify.Api.Features.MaskSafety.Services;

public sealed class MaskSafetyValidationService
{
    public const int MaxBatchSize = 128;

    private static readonly FrozenDictionary<string, Func<string, bool>> Validators =
        new Dictionary<string, Func<string, bool>>(StringComparer.Ordinal)
        {
            ["chile-rut"] = IdentifierValidationAlgorithms.IsValidChileanRut,
            ["cn-resident-id-labeled"] = IdentifierValidationAlgorithms.IsValidChineseResidentId,
            ["cnpj"] = IdentifierValidationAlgorithms.IsValidCnpj,
            ["credit-card"] = IdentifierValidationAlgorithms.IsLikelyCreditCard,
            ["cpf"] = IdentifierValidationAlgorithms.IsValidCpf,
            ["cuit"] = IdentifierValidationAlgorithms.IsValidArgentineCuit,
            ["es-dni-labeled"] = IdentifierValidationAlgorithms.IsValidSpanishDni,
            ["es-nie-labeled"] = IdentifierValidationAlgorithms.IsValidSpanishNie,
            ["iban"] = IdentifierValidationAlgorithms.IsLikelyIban,
            ["in-aadhaar-labeled"] = IdentifierValidationAlgorithms.IsValidIndianAadhaar,
            ["nit"] = IdentifierValidationAlgorithms.IsValidColombianNit,
            ["pis-pasep-labeled"] = IdentifierValidationAlgorithms.IsValidPisPasep,
            ["pt-nif-labeled"] = IdentifierValidationAlgorithms.IsValidPortugueseNif,
            ["ru-inn-labeled"] = IdentifierValidationAlgorithms.IsValidRussianInn,
            ["ru-snils-labeled"] = IdentifierValidationAlgorithms.IsValidRussianSnils,
            ["ruc-labeled"] = IdentifierValidationAlgorithms.IsValidPeruvianRuc,
        }.ToFrozenDictionary(StringComparer.Ordinal);

    public bool IsSupportedRule(string ruleId)
    {
        return Validators.ContainsKey(ruleId);
    }

    public MaskSafetyValidationResponse Validate(MaskSafetyValidationRequest request)
    {
        var results = request.Candidates
            .Take(MaxBatchSize)
            .Select(EvaluateCandidate)
            .ToArray();

        return new MaskSafetyValidationResponse
        {
            Results = results,
        };
    }

    private static MaskSafetyValidationItemResponse EvaluateCandidate(
        MaskSafetyValidationItemRequest candidate
    )
    {
        var candidateValue = candidate.CandidateValue.Trim();
        var ruleId = candidate.RuleId.Trim();

        if (string.IsNullOrWhiteSpace(ruleId) || string.IsNullOrWhiteSpace(candidateValue))
        {
            return new MaskSafetyValidationItemResponse
            {
                CandidateValue = candidate.CandidateValue,
                Decision = MaskSafetyDecision.Unsupported,
                IsCompromising = false,
                IsSupported = false,
                Message = "The candidate could not be validated because the rule id or candidate value is empty.",
                RuleId = candidate.RuleId,
            };
        }

        if (!Validators.TryGetValue(ruleId, out var validator))
        {
            return new MaskSafetyValidationItemResponse
            {
                CandidateValue = candidateValue,
                Decision = MaskSafetyDecision.Unsupported,
                IsCompromising = false,
                IsSupported = false,
                Message = "This rule does not have an API-backed compromising-identifier validator yet.",
                RuleId = ruleId,
            };
        }

        var isCompromising = validator(candidateValue);

        return new MaskSafetyValidationItemResponse
        {
            CandidateValue = candidateValue,
            Decision = isCompromising ? MaskSafetyDecision.Compromising : MaskSafetyDecision.Safe,
            IsCompromising = isCompromising,
            IsSupported = true,
            Message = isCompromising
                ? "The candidate still passes the target identifier validation and should be regenerated."
                : "The candidate no longer passes the target identifier validation.",
            RuleId = ruleId,
        };
    }
}
