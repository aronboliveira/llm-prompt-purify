using System.Globalization;

namespace LLMPromptPurify.Api.Features.MaskSafety.Services;

internal static class IdentifierValidationAlgorithms
{
    public static bool IsLikelyCreditCard(string value)
    {
        var digits = DigitsOnly(value);
        if (digits.Length is < 13 or > 19 || HasRepeatedDigits(digits))
        {
            return false;
        }

        var checksum = 0;
        var shouldDouble = false;

        for (var index = digits.Length - 1; index >= 0; index -= 1)
        {
            var digit = digits[index] - '0';

            if (shouldDouble)
            {
                digit *= 2;
                if (digit > 9)
                {
                    digit -= 9;
                }
            }

            checksum += digit;
            shouldDouble = !shouldDouble;
        }

        return checksum % 10 == 0;
    }

    public static bool IsLikelyIban(string value)
    {
        var normalized = value.Replace(" ", string.Empty, StringComparison.Ordinal).ToUpperInvariant();
        if (!System.Text.RegularExpressions.Regex.IsMatch(normalized, "^[A-Z]{2}\\d{2}[A-Z0-9]{11,30}$"))
        {
            return false;
        }

        var rearranged = string.Concat(normalized.AsSpan(4), normalized.AsSpan(0, 4));
        var remainder = 0;

        foreach (var character in rearranged)
        {
            if (char.IsLetter(character))
            {
                var encoded = (character - 'A' + 10).ToString(CultureInfo.InvariantCulture);
                foreach (var digit in encoded)
                {
                    remainder = (remainder * 10 + (digit - '0')) % 97;
                }
            }
            else
            {
                remainder = (remainder * 10 + (character - '0')) % 97;
            }
        }

        return remainder == 1;
    }

    public static bool IsValidArgentineCuit(string value)
    {
        var digits = DigitsOnly(value);
        if (!HasLength(digits, 11) || HasRepeatedDigits(digits))
        {
            return false;
        }

        var weights = new[] { 5, 4, 3, 2, 7, 6, 5, 4, 3, 2 };
        var total = 0;

        for (var index = 0; index < weights.Length; index += 1)
        {
            total += (digits[index] - '0') * weights[index];
        }

        var remainder = 11 - total % 11;
        var verifier = remainder switch
        {
            11 => 0,
            10 => 9,
            _ => remainder,
        };

        return digits[10] - '0' == verifier;
    }

    public static bool IsValidChileanRut(string value)
    {
        var normalized = value.Replace(".", string.Empty, StringComparison.Ordinal)
            .Replace("-", string.Empty, StringComparison.Ordinal)
            .ToUpperInvariant();

        if (!System.Text.RegularExpressions.Regex.IsMatch(normalized, "^\\d{7,8}[0-9K]$"))
        {
            return false;
        }

        var verifier = normalized[^1];
        var sum = 0;
        var multiplier = 2;

        for (var index = normalized.Length - 2; index >= 0; index -= 1)
        {
            sum += (normalized[index] - '0') * multiplier;
            multiplier = multiplier == 7 ? 2 : multiplier + 1;
        }

        var remainder = 11 - sum % 11;
        var expectedVerifier = remainder switch
        {
            11 => '0',
            10 => 'K',
            _ => remainder.ToString(CultureInfo.InvariantCulture)[0],
        };

        return verifier == expectedVerifier;
    }

    public static bool IsValidChineseResidentId(string value)
    {
        var normalized = value.Replace(" ", string.Empty, StringComparison.Ordinal).ToUpperInvariant();
        if (!System.Text.RegularExpressions.Regex.IsMatch(normalized, "^\\d{17}[\\dX]$"))
        {
            return false;
        }

        if (!DateOnly.TryParseExact(
                normalized.Substring(6, 8),
                "yyyyMMdd",
                CultureInfo.InvariantCulture,
                DateTimeStyles.None,
                out _
            ))
        {
            return false;
        }

        var weights = new[] { 7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2 };
        var verifiers = new[] { '1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2' };
        var checksum = 0;

        for (var index = 0; index < weights.Length; index += 1)
        {
            checksum += (normalized[index] - '0') * weights[index];
        }

        return normalized[17] == verifiers[checksum % 11];
    }

    public static bool IsValidCnpj(string value)
    {
        var digits = DigitsOnly(value);
        if (!HasLength(digits, 14) || HasRepeatedDigits(digits))
        {
            return false;
        }

        var firstWeights = new[] { 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2 };
        var secondWeights = new[] { 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2 };
        var firstDigit = CalculateWeightedDigit(digits.AsSpan(0, 12), firstWeights);
        var secondDigit = CalculateWeightedDigit(
            string.Concat(digits.AsSpan(0, 12), firstDigit.ToString(CultureInfo.InvariantCulture)),
            secondWeights
        );

        return digits.EndsWith(
            $"{firstDigit}{secondDigit}",
            StringComparison.Ordinal
        );
    }

    public static bool IsValidColombianNit(string value)
    {
        var digits = DigitsOnly(value);
        if (!System.Text.RegularExpressions.Regex.IsMatch(digits, "^\\d{8,10}$") || HasRepeatedDigits(digits))
        {
            return false;
        }

        var body = digits[..^1];
        var verifier = digits[^1] - '0';
        var weights = new[] { 71, 67, 59, 53, 47, 43, 41, 37, 29, 23, 19, 17, 13, 7, 3 };
        var weightOffset = weights.Length - body.Length;
        var total = 0;

        for (var index = 0; index < body.Length; index += 1)
        {
            total += (body[index] - '0') * weights[weightOffset + index];
        }

        var remainder = total % 11;
        var expectedVerifier = remainder > 1 ? 11 - remainder : remainder;

        return verifier == expectedVerifier;
    }

    public static bool IsValidCpf(string value)
    {
        var digits = DigitsOnly(value);
        if (!HasLength(digits, 11) || HasRepeatedDigits(digits))
        {
            return false;
        }

        var firstDigit = CalculateCpfDigit(digits[..9], 10);
        var secondDigit = CalculateCpfDigit(
            string.Concat(digits.AsSpan(0, 9), firstDigit.ToString(CultureInfo.InvariantCulture)),
            11
        );

        return digits.EndsWith($"{firstDigit}{secondDigit}", StringComparison.Ordinal);
    }

    public static bool IsValidIndianAadhaar(string value)
    {
        var digits = DigitsOnly(value);
        if (!HasLength(digits, 12) || HasRepeatedDigits(digits))
        {
            return false;
        }

        var multiplicationTable = new[]
        {
            new[] { 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 },
            new[] { 1, 2, 3, 4, 0, 6, 7, 8, 9, 5 },
            new[] { 2, 3, 4, 0, 1, 7, 8, 9, 5, 6 },
            new[] { 3, 4, 0, 1, 2, 8, 9, 5, 6, 7 },
            new[] { 4, 0, 1, 2, 3, 9, 5, 6, 7, 8 },
            new[] { 5, 9, 8, 7, 6, 0, 4, 3, 2, 1 },
            new[] { 6, 5, 9, 8, 7, 1, 0, 4, 3, 2 },
            new[] { 7, 6, 5, 9, 8, 2, 1, 0, 4, 3 },
            new[] { 8, 7, 6, 5, 9, 3, 2, 1, 0, 4 },
            new[] { 9, 8, 7, 6, 5, 4, 3, 2, 1, 0 },
        };
        var permutationTable = new[]
        {
            new[] { 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 },
            new[] { 1, 5, 7, 6, 2, 8, 3, 0, 9, 4 },
            new[] { 5, 8, 0, 3, 7, 9, 6, 1, 4, 2 },
            new[] { 8, 9, 1, 6, 0, 4, 3, 5, 2, 7 },
            new[] { 9, 4, 5, 3, 1, 2, 6, 8, 7, 0 },
            new[] { 4, 2, 8, 6, 5, 7, 3, 9, 0, 1 },
            new[] { 2, 7, 9, 3, 8, 0, 6, 4, 1, 5 },
            new[] { 7, 0, 4, 6, 9, 1, 3, 2, 5, 8 },
        };
        var checksum = 0;
        var reversedDigits = digits.Reverse().ToArray();

        for (var index = 0; index < reversedDigits.Length; index += 1)
        {
            checksum = multiplicationTable[checksum][permutationTable[index % 8][reversedDigits[index] - '0']];
        }

        return checksum == 0;
    }

    public static bool IsValidPeruvianRuc(string value)
    {
        var digits = DigitsOnly(value);
        if (!HasLength(digits, 11) || HasRepeatedDigits(digits))
        {
            return false;
        }

        if (!digits.StartsWith("10", StringComparison.Ordinal)
            && !digits.StartsWith("15", StringComparison.Ordinal)
            && !digits.StartsWith("16", StringComparison.Ordinal)
            && !digits.StartsWith("17", StringComparison.Ordinal)
            && !digits.StartsWith("20", StringComparison.Ordinal))
        {
            return false;
        }

        var weights = new[] { 5, 4, 3, 2, 7, 6, 5, 4, 3, 2 };
        var total = 0;

        for (var index = 0; index < weights.Length; index += 1)
        {
            total += (digits[index] - '0') * weights[index];
        }

        var remainder = 11 - total % 11;
        var verifier = remainder switch
        {
            10 => 0,
            11 => 1,
            _ => remainder,
        };

        return digits[10] - '0' == verifier;
    }

    public static bool IsValidPisPasep(string value)
    {
        var digits = DigitsOnly(value);
        if (!HasLength(digits, 11) || HasRepeatedDigits(digits))
        {
            return false;
        }

        var weights = new[] { 3, 2, 9, 8, 7, 6, 5, 4, 3, 2 };
        var total = 0;

        for (var index = 0; index < weights.Length; index += 1)
        {
            total += (digits[index] - '0') * weights[index];
        }

        var remainder = 11 - total % 11;
        var verifier = remainder is 10 or 11 ? 0 : remainder;

        return digits[10] - '0' == verifier;
    }

    public static bool IsValidPortugueseNif(string value)
    {
        var digits = DigitsOnly(value);
        if (!HasLength(digits, 9) || HasRepeatedDigits(digits))
        {
            return false;
        }

        if ("125689".IndexOf(digits[0], StringComparison.Ordinal) < 0)
        {
            return false;
        }

        var total = 0;
        for (var index = 0; index < 8; index += 1)
        {
            total += (digits[index] - '0') * (9 - index);
        }

        var remainder = 11 - total % 11;
        var verifier = remainder >= 10 ? 0 : remainder;

        return digits[8] - '0' == verifier;
    }

    public static bool IsValidRussianInn(string value)
    {
        var digits = DigitsOnly(value);
        if (!System.Text.RegularExpressions.Regex.IsMatch(digits, "^\\d{10}(\\d{2})?$") || HasRepeatedDigits(digits))
        {
            return false;
        }

        if (digits.Length == 10)
        {
            var expected = CalculateMod11Digit(digits[..9], new[] { 2, 4, 10, 3, 5, 9, 4, 6, 8 });
            return digits[9] - '0' == expected;
        }

        var firstExpected = CalculateMod11Digit(
            digits[..10],
            new[] { 7, 2, 4, 10, 3, 5, 9, 4, 6, 8 }
        );
        var secondExpected = CalculateMod11Digit(
            digits[..11],
            new[] { 3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8 }
        );

        return digits[10] - '0' == firstExpected && digits[11] - '0' == secondExpected;
    }

    public static bool IsValidRussianSnils(string value)
    {
        var digits = DigitsOnly(value);
        if (!HasLength(digits, 11) || HasRepeatedDigits(digits))
        {
            return false;
        }

        var total = 0;
        for (var index = 0; index < 9; index += 1)
        {
            total += (digits[index] - '0') * (9 - index);
        }

        var rawVerifier = total switch
        {
            < 100 => total,
            100 or 101 => 0,
            _ => total % 101,
        };
        var verifier = rawVerifier == 100 ? 0 : rawVerifier;

        return int.Parse(digits[9..], CultureInfo.InvariantCulture) == verifier;
    }

    public static bool IsValidSpanishDni(string value)
    {
        var normalized = value.Replace(" ", string.Empty, StringComparison.Ordinal).ToUpperInvariant();
        if (!System.Text.RegularExpressions.Regex.IsMatch(normalized, "^\\d{8}[A-Z]$"))
        {
            return false;
        }

        return normalized[8] == CalculateSpanishDocumentLetter(normalized[..8]);
    }

    public static bool IsValidSpanishNie(string value)
    {
        var normalized = value.Replace(" ", string.Empty, StringComparison.Ordinal).ToUpperInvariant();
        if (!System.Text.RegularExpressions.Regex.IsMatch(normalized, "^[XYZ]\\d{7}[A-Z]$"))
        {
            return false;
        }

        var numericBody = string.Concat(
            normalized[0] switch
            {
                'X' => '0',
                'Y' => '1',
                'Z' => '2',
                _ => '0',
            },
            normalized.Substring(1, 7)
        );

        return normalized[8] == CalculateSpanishDocumentLetter(numericBody);
    }

    private static int CalculateCpfDigit(string value, int factor)
    {
        var total = 0;
        for (var index = 0; index < value.Length; index += 1)
        {
            total += (value[index] - '0') * (factor - index);
        }

        var remainder = total * 10 % 11;
        return remainder == 10 ? 0 : remainder;
    }

    private static int CalculateMod11Digit(string value, IReadOnlyList<int> weights)
    {
        var total = 0;
        for (var index = 0; index < value.Length; index += 1)
        {
            total += (value[index] - '0') * weights[index];
        }

        return total % 11 % 10;
    }

    private static char CalculateSpanishDocumentLetter(string value)
    {
        const string letters = "TRWAGMYFPDXBNJZSQVHLCKE";
        return letters[int.Parse(value, CultureInfo.InvariantCulture) % 23];
    }

    private static int CalculateWeightedDigit(ReadOnlySpan<char> value, IReadOnlyList<int> weights)
    {
        var total = 0;
        for (var index = 0; index < value.Length; index += 1)
        {
            total += (value[index] - '0') * weights[index];
        }

        var remainder = total % 11;
        return remainder < 2 ? 0 : 11 - remainder;
    }

    private static int CalculateWeightedDigit(string value, IReadOnlyList<int> weights)
    {
        return CalculateWeightedDigit(value.AsSpan(), weights);
    }

    private static string DigitsOnly(string value)
    {
        return new string(value.Where(char.IsDigit).ToArray());
    }

    private static bool HasLength(string value, int length)
    {
        return value.Length == length;
    }

    private static bool HasRepeatedDigits(string digits)
    {
        return digits.Length > 0 && digits.All(digit => digit == digits[0]);
    }
}
