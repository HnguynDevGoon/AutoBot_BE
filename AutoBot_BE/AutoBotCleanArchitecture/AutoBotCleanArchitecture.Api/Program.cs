using AutoBotCleanArchitecture.Application.Converters;
using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Application.Interfaces;
using AutoBotCleanArchitecture.Application.Responses;
using AutoBotCleanArchitecture.Domain.Constants;
// Thêm namespace này để dùng cho phần Seeding User
using AutoBotCleanArchitecture.Domain.Entities;
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

// ==========================================
// 1. CẤU HÌNH CORS
// ==========================================
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

// ==========================================
// 2. CẤU HÌNH DATABASE
// ==========================================
// Ưu tiên lấy biến môi trường DATABASE_URL từ Railway
var connectionString = Environment.GetEnvironmentVariable("DATABASE_URL") ?? builder.Configuration.GetConnectionString("PostgresCon");

builder.Services.AddDbContext<AppDbContext>(opt =>
   opt.UseNpgsql(connectionString)
);

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

// ==========================================
// 3. CẤU HÌNH SWAGGER & AUTH
// ==========================================
builder.Services.AddSwaggerGen(x =>
{
    x.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo { Title = "Swagger eShop Solution", Version = "v1" });
    x.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "Làm theo mẫu này. Example: Bearer {Token} ",
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
            // Cần đảm bảo biến này đã được thêm trong Variables trên Railway
            builder.Configuration.GetSection("AppSettings:SecretKey").Value!))
    };

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
            await context.Response.WriteAsync(JsonSerializer.Serialize(response));
        }
    };
});


// ==========================================
// 4. REGISTER SERVICES (DI)
// ==========================================
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

// DTOs
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
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// ==========================================
// 5. PIPELINE & MIDDLEWARE
// ==========================================

// Bật Swagger cho cả môi trường Production (Railway)
app.UseSwagger();
app.UseSwaggerUI();

app.MapHub<ChatHub>("/chatHub");

// [QUAN TRỌNG] Tắt dòng này để tránh lỗi vòng lặp Redirect trên Railway
// app.UseHttpsRedirection(); 

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Tự động chuyển hướng trang chủ về Swagger
app.MapGet("/", async context =>
{
    context.Response.Redirect("/swagger/index.html");
    await Task.CompletedTask;
});

// ==========================================
// 6. AUTO MIGRATION & SEEDING (SỬA LỖI 500)
// ==========================================
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();

        // 1. Tự động tạo bảng Database
        context.Database.Migrate();
        Console.WriteLine("--> [Success] Cap nhat Database thanh cong!");

        // 2. Tạo User Admin mặc định nếu chưa có
        // LƯU Ý: Bạn cần kiểm tra lại tên Entity 'User' và các thuộc tính bên dưới có đúng với code của bạn không
        if (!context.users.Any())
        {
            Console.WriteLine("--> [Seeding] Dang tao du lieu mau...");

            // Ví dụ tạo User Admin (Pass: Admin@123)
            // Nếu bạn dùng mã hóa mật khẩu, hãy thay chuỗi bên dưới bằng chuỗi đã mã hóa
            var adminUser = new User
            {
                Id = DefaultRoles.ADMIN_USER_ID,
                UserName = "Admin",
                Email = "huynhnguyen13122005@gmail.com",
                FullName = "Quản Trị Viên",
                PhoneNumber = "0123456789",
                BirthDay = new DateOnly(2000, 1, 1),
                PassWord = "$2a$11$HQe0hJnHsGz3dabdY6FUw.uMrfNVK/w11bVywJ2A3H39tkYPbm80a",
                IsActive = true,
                CreatedDate = DateTime.UtcNow,
                LockoutEnable = false,
                AccessFailedCount = 0,
                UrlAvatar = "https://res.cloudinary.com/drpxjqd47/image/upload/v1763051875/xusxceivnufh4ncc8peb.jpg",
                TwoStep = true,
                RoleId = DefaultRoles.ADMIN_ID
                            };

            context.users.Add(adminUser);
            context.SaveChanges();
            Console.WriteLine("--> [Success] Da tao User: Admin");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine("--> [Error] Loi khi cap nhat Database: " + ex.Message);
    }
}

app.Run();