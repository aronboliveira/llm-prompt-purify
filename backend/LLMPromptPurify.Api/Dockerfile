FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY backend/LLMPromptPurify.Api/LLMPromptPurify.Api.csproj backend/LLMPromptPurify.Api/
RUN dotnet restore backend/LLMPromptPurify.Api/LLMPromptPurify.Api.csproj

COPY backend/LLMPromptPurify.Api/. backend/LLMPromptPurify.Api/
RUN dotnet publish backend/LLMPromptPurify.Api/LLMPromptPurify.Api.csproj \
  -c Release \
  -o /app/publish \
  /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "LLMPromptPurify.Api.dll"]
