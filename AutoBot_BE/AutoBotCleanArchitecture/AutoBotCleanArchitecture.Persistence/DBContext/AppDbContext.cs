using AutoBotCleanArchitecture.Domain.Constants;
using AutoBotCleanArchitecture.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Persistence.DBContext
{
    public class AppDbContext : DbContext
    {
        public AppDbContext() { }
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> users { get; set; }
        public DbSet<Role> roles { get; set; }
        public DbSet<ConfirmEmail> confirmEmails { get; set; }
        public DbSet<RefreshToken> refreshTokens { get; set; }
        public DbSet<BotTrading> botTradings { get; set; }
        public DbSet<PriceBot> priceBots { get; set; }
        public DbSet<LogHistory> logHistories { get; set; }
        public DbSet<WalletTransaction> walletTransactions { get; set; }
        public DbSet<Wallet> wallets { get; set; }
        public DbSet<ChatRoom> chatRooms { get; set; }
        public DbSet<ChatMessage> chatMessages { get; set; }
        public DbSet<UserDevice> userDevices { get; set; }
        public DbSet<Content> contents { get; set; }
        public DbSet<WithdrawMoney> withdrawMoneys { get; set; }
        public DbSet<UserBot> userBots { get; set; }
        public DbSet<PurchaseHistory> purchaseHistories { get; set; }
        public DbSet<PaymentOrder> paymentOrders { get; set; }
        public DbSet<ProfitLoss> profitLosses { get; set; }
        public DbSet<BotSignal> botSignals { get; set; }
        public DbSet<OtherContent> otherContents { get; set; }
        public DbSet<Review> reviews { get; set; }






        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // (1) Gieo Role
            builder.Entity<Role>().HasData(
                new Role
                {
                    Id = DefaultRoles.ADMIN_ID, // Dùng Guid hằng số
                    RoleName = "Admin",
                },
                new Role
                {
                    Id = DefaultRoles.USER_ID, // Dùng Guid hằng số
                    RoleName = "User",
                }
            );

            // (2) Gieo Admin User
            builder.Entity<User>().HasData(
                new User
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
                }
            );

            // --- THÊM CÁI NÀY VÀO ---
            // Mặc dù Id (Guid) là Khóa chính, 
            // ta thêm một Ràng buộc Duy nhất (Unique Index)
            // cho cặp (Month, BotTradingId) để đảm bảo logic.
            builder.Entity<PriceBot>()
                .HasIndex(pb => new { pb.Month, pb.BotTradingId })
                .IsUnique();

            builder.Entity<UserDevice>()
            .HasIndex(d => new { d.UserId, d.Fingerprint })
            .IsUnique();
        }
    }
}