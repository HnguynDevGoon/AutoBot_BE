FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# --- PHẢI THÊM ĐƯỜNG DẪN DÀI VÀO ---
COPY AutoBot_BE/AutoBotCleanArchitecture/AutoBotCleanArchitecture.sln ./
COPY AutoBot_BE/AutoBotCleanArchitecture/AutoBotCleanArchitecture.Api/AutoBotCleanArchitecture.Api.csproj AutoBotCleanArchitecture.Api/
COPY AutoBot_BE/AutoBotCleanArchitecture/AutoBotCleanArchitecture.Application/AutoBotCleanArchitecture.Application.csproj AutoBotCleanArchitecture.Application/
COPY AutoBot_BE/AutoBotCleanArchitecture/AutoBotCleanArchitecture.Domain/AutoBotCleanArchitecture.Domain.csproj AutoBotCleanArchitecture.Domain/
COPY AutoBot_BE/AutoBotCleanArchitecture/AutoBotCleanArchitecture.Infrastructure/AutoBotCleanArchitecture.Infrastructure.csproj AutoBotCleanArchitecture.Infrastructure/
COPY AutoBot_BE/AutoBotCleanArchitecture/AutoBotCleanArchitecture.Persistence/AutoBotCleanArchitecture.Persistence.csproj AutoBotCleanArchitecture.Persistence/

# Restore
RUN dotnet restore AutoBotCleanArchitecture.sln

# Copy toàn bộ (Lưu ý đường dẫn gốc)
COPY AutoBot_BE/AutoBotCleanArchitecture/ .

# Build
RUN dotnet publish AutoBotCleanArchitecture.Api/AutoBotCleanArchitecture.Api.csproj -c Release -o /app/publish

# --- RUNTIME ---
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://0.0.0.0:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "AutoBotCleanArchitecture.Api.dll"]
