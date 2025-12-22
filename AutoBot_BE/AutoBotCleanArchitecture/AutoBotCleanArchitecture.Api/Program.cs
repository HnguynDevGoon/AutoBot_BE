using AutoBotCleanArchitecture.Application.Converters;
using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Application.Interfaces;
using AutoBotCleanArchitecture.Application.Responses;
using AutoBotCleanArchitecture.Infrastructure.Hubs;
using AutoBotCleanArchitecture.Infrastructure.Implements;
using AutoBotCleanArchitecture.Persistence.DBContext;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Net.payOS;
using System.Text;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy =>
        {
            policy
               .AllowAnyHeader()
               .AllowAnyMethod()
               .AllowCredentials()
               .SetIsOriginAllowed(_ => true);
        });
});

var connectionString =
    Environment.GetEnvironmentVariable("DATABASE_URL")
    ?? builder.Configuration.GetConnectionString("PostgresCon");

builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseNpgsql(connectionString)
);

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

builder.Services.AddSwaggerGen(x =>
{
    x.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Swagger eShop Solution",
        Version = "v1"
    });

    x.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Bearer {Token}",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    x.AddSecurityRequirement(new OpenApiSecurityRequirement()
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                },
                Scheme = "oauth2",
                Name = "Bearer",
                In = ParameterLocation.Header,
            },
            new List<string>()
        }
    });
});

var jwtSecretKey =
    Environment.GetEnvironmentVariable("AppSettings__SecretKey")
    ?? builder.Configuration["AppSettings:SecretKey"];

if (string.IsNullOrEmpty(jwtSecretKey))
{
    throw new Exception("JWT SecretKey is missing");
}

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false;
        options.SaveToken = true;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            ValidateAudience = false,
            ValidateIssuer = false,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSecretKey)
            )
        };

        options.Events = new JwtBearerEvents
        {
            OnChallenge = async context =>
            {
                context.HandleResponse();
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                context.Response.ContentType = "application/json";

                await context.Response.WriteAsync(JsonSerializer.Serialize(new
                {
                    StatusCode = 401,
                    Message = "Vui lòng làm theo mẫu Bearer {token}"
                }));
            }
        };
    });

builder.Services.AddSingleton<PayOS>(sp =>
{
    var config = sp.GetRequiredService<IConfiguration>();

    var clientId =
        Environment.GetEnvironmentVariable("PayOS__ClientId")
        ?? config["PayOS:ClientId"];

    var apiKey =
        Environment.GetEnvironmentVariable("PayOS__ApiKey")
        ?? config["PayOS:ApiKey"];

    var checksumKey =
        Environment.GetEnvironmentVariable("PayOS__ChecksumKey")
        ?? config["PayOS:ChecksumKey"];

    if (string.IsNullOrEmpty(clientId)
        || string.IsNullOrEmpty(apiKey)
        || string.IsNullOrEmpty(checksumKey))
    {
        throw new Exception("PayOS config missing");
    }

    return new PayOS(clientId, apiKey, checksumKey);
});

builder.Services.AddHttpClient();

builder.Services.AddHttpContextAccessor();

builder.Services.AddSignalR();

builder.Services.AddMemoryCache();

builder.Services.AddScoped<ResponseBase>();

// DTO Response
builder.Services.AddScoped<ResponseObject<DTO_Role>>();
builder.Services.AddScoped<ResponseObject<DTO_User>>();
builder.Services.AddScoped<ResponseObject<DTO_Token>>();
builder.Services.AddScoped<ResponseObject<DTO_LogHistory>>();
builder.Services.AddScoped<ResponseObject<DTO_Wallet>>();
builder.Services.AddScoped<ResponseObject<DTO_ChatRoom>>();
builder.Services.AddScoped<ResponseObject<DTO_WalletTransaction>>();
builder.Services.AddScoped<ResponseObject<DTO_ChatMessage>>();
builder.Services.AddScoped<ResponseObject<DTO_Content>>();
builder.Services.AddScoped<ResponseObject<DTO_WithdrawMoney>>();
builder.Services.AddScoped<ResponseObject<DTO_PurchaseHistory>>();
builder.Services.AddScoped<ResponseObject<DTO_RevenueResponse>>();
builder.Services.AddScoped<ResponseObject<DTO_PriceBots>>();
builder.Services.AddScoped<ResponseObject<DTO_BotTrading>>();
builder.Services.AddScoped<ResponseObject<IList<DTO_LogHistory>>>();
builder.Services.AddScoped<ResponseObject<IList<DTO_WalletTransaction>>>();
builder.Services.AddScoped<ResponseObject<IList<DTO_ChatMessage>>>();
builder.Services.AddScoped<ResponseObject<List<DTO_UserDevice>>>();
builder.Services.AddScoped<ResponseObject<List<DTO_ChatRoom>>>();
builder.Services.AddScoped<ResponseObject<List<DTO_BotTrading>>>();
builder.Services.AddScoped<ResponseObject<List<DTO_UserBot>>>();
builder.Services.AddScoped<ResponseObject<List<DTO_PurchaseHistory>>>();
builder.Services.AddScoped<ResponseObject<List<DTO_PriceBots>>>();
builder.Services.AddScoped<ResponseObject<string>>();
builder.Services.AddScoped<ResponseObject<bool>>();
builder.Services.AddScoped<ResponseObject<ResponsePagination<DTO_User>>>();
builder.Services.AddScoped<ResponseObject<ResponsePagination<DTO_WalletTransaction>>>();
builder.Services.AddScoped<ResponseObject<ResponsePagination<DTO_Content>>>();
builder.Services.AddScoped<ResponseObject<ResponsePagination<DTO_BotTrading>>>();
builder.Services.AddScoped<ResponseObject<ResponsePagination<DTO_WithdrawMoney>>>();
builder.Services.AddScoped<ResponseObject<ResponsePagination<DTO_PriceBots>>>();
builder.Services.AddScoped<ResponseObject<ResponsePagination<DTO_PurchaseHistory>>>();

// Converter
builder.Services.AddScoped<Converter_Role>();
builder.Services.AddScoped<Converter_User>();
builder.Services.AddScoped<Converter_LogHistory>();
builder.Services.AddScoped<Converter_Wallet>();
builder.Services.AddScoped<Converter_WalletTransaction>();
builder.Services.AddScoped<Converter_ChatMessage>();
builder.Services.AddScoped<Converter_Content>();
builder.Services.AddScoped<Converter_BotTrading>();
builder.Services.AddScoped<Converter_UserBot>();
builder.Services.AddScoped<Converter_PurchaseHistory>();

// Service
builder.Services.AddScoped<IService_Role, Service_Role>();
builder.Services.AddScoped<IService_Authen, Service_Authen>();
builder.Services.AddScoped<IService_LogHistory, Service_LogHistory>();
builder.Services.AddScoped<IService_Payment, Service_Payment>();
builder.Services.AddScoped<IService_Wallet, Service_Wallet>();
builder.Services.AddScoped<IService_WalletTransaction, Service_WalletTransaction>();
builder.Services.AddScoped<IService_Chat, Service_Chat>();
builder.Services.AddScoped<IService_Device, Service_Device>();
builder.Services.AddScoped<IService_Content, Service_Content>();
builder.Services.AddScoped<IService_ChatRoom, Service_ChatRoom>();
builder.Services.AddScoped<IService_BotTrading, Service_BotTrading>();
builder.Services.AddScoped<IService_PurchaseHistory, Service_PurchaseHistory>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

app.MapHub<ChatHub>("/chatHub");

app.UseHttpsRedirection();

app.UseCors("AllowAll");

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.Run();
