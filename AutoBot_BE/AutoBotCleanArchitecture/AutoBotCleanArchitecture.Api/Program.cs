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
using Net.payOS.Types;
using System;
using System.Text;
using System.Text.Json;


var builder = WebApplication.CreateBuilder(args);

// Thêm CORS
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

// Connect with database

//---Dùng SQL Server ---
//builder.Services.AddDbContext<AppDbContext>(opt =>
//    opt.UseSqlServer(builder.Configuration.GetConnectionString("SqlCon"))
//);

// --- Dùng Postgres ---
// --- Dùng Postgres (Đã cấu hình ưu tiên Railway) ---
var connectionString = Environment.GetEnvironmentVariable("DATABASE_URL") ?? builder.Configuration.GetConnectionString("PostgresCon");

builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseNpgsql(connectionString)
);

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

builder.Services.AddSwaggerGen(x =>
{
    x.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo { Title = "Swagger eShop Solution", Version = "v1" });
    x.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "Làm theo m?u này. Example: Bearer {Token} ",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
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
    //x.OperationFilter<SecurityRequirementsOperationFilter>();
});
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options => {
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        ValidateAudience = false,
        ValidateIssuer = false,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
            builder.Configuration.GetSection("AppSettings:SecretKey").Value!))
    };

    // --- BẮT ĐẦU PHẦN THÊM ĐỂ BÁO LỖI 401 ---
    options.Events = new JwtBearerEvents
    {
        OnChallenge = async context =>
        {
            context.HandleResponse();

            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            context.Response.ContentType = "application/json";

            var response = new
            {
                StatusCode = 401,
                Message = "Vui lòng làm theo mẫu Bearer {token}"
            };

            // Ghi lỗi ra response
            await context.Response.WriteAsync(JsonSerializer.Serialize(response));
        }
    };
});


// Add services to the container.
builder.Services.AddHttpClient();

builder.Services.AddHttpContextAccessor();

builder.Services.AddSignalR();

builder.Services.AddSingleton<PayOS>(sp =>
{
    var config = sp.GetRequiredService<IConfiguration>();
    return new PayOS(
        config["PayOS:ClientId"],
        config["PayOS:ApiKey"],
        config["PayOS:ChecksumKey"]
    );
});

builder.Services.AddScoped<ResponseBase>();

//DTO
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


// IService, Service
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





builder.Services.AddMemoryCache();


builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
//if (app.Environment.IsDevelopment())
//{
//    app.UseSwagger();
//    app.UseSwaggerUI();
//}
app.UseSwagger();
app.UseSwaggerUI();

app.MapHub<ChatHub>("/chatHub");

app.UseHttpsRedirection();

app.UseCors("AllowAll");

app.UseAuthorization();

app.MapControllers();

app.Run();
