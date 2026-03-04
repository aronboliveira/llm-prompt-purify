#!/usr/bin/env bash
# V-004: Setup script for managing secrets with dotnet user-secrets
# Run this from the backend/LLMPromptPurify.Api directory

set -e

echo "=== LLM Prompt Purify - Secrets Setup ==="
echo ""

# Initialize user secrets if not already done
if ! grep -q "UserSecretsId" LLMPromptPurify.Api.csproj 2>/dev/null; then
    echo "Initializing user secrets..."
    dotnet user-secrets init
fi

echo "Setting up secrets. Enter values when prompted (leave blank to skip):"
echo ""

# SMTP Credentials
read -p "SMTP Username (email): " smtp_user
if [[ -n "$smtp_user" ]]; then
    dotnet user-secrets set "DeveloperEmail:Username" "$smtp_user"
    echo "  ✓ SMTP username set"
fi

read -sp "SMTP Password (app password): " smtp_pass
echo ""
if [[ -n "$smtp_pass" ]]; then
    dotnet user-secrets set "DeveloperEmail:Password" "$smtp_pass"
    echo "  ✓ SMTP password set"
fi

read -p "SMTP Sender Email: " smtp_sender
if [[ -n "$smtp_sender" ]]; then
    dotnet user-secrets set "DeveloperEmail:SenderEmail" "$smtp_sender"
    echo "  ✓ SMTP sender email set"
fi

# API Key
read -p "API Key (for production, leave blank to disable): " api_key
if [[ -n "$api_key" ]]; then
    dotnet user-secrets set "ApiKey:Enabled" "true"
    dotnet user-secrets set "ApiKey:Key" "$api_key"
    echo "  ✓ API key set and enabled"
fi

# Database password (if different from default)
read -sp "Database Password (leave blank to use default 'postgres'): " db_pass
echo ""
if [[ -n "$db_pass" ]]; then
    dotnet user-secrets set "ConnectionStrings:FeedbackDatabase" "Host=localhost;Port=5432;Database=llm_prompt_purify;Username=postgres;Password=$db_pass"
    echo "  ✓ Database connection string set"
fi

echo ""
echo "=== Secrets configured successfully! ==="
echo ""
echo "To view stored secrets: dotnet user-secrets list"
echo "To clear all secrets:   dotnet user-secrets clear"
echo ""
echo "Note: Secrets are stored in:"
echo "  Linux/macOS: ~/.microsoft/usersecrets/<UserSecretsId>/secrets.json"
echo "  Windows:     %APPDATA%\\Microsoft\\UserSecrets\\<UserSecretsId>\\secrets.json"
