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
                    PhoneNumber = "0908119698",
                    BirthDay = new DateOnly(2000, 1, 1),
                    PassWord = "$2a$11$GdB5Yf5PMum9VAkLAoJDZuf4dTTqdMuYOdwzZKCnKVMKWroqP3dzG",
                    IsActive = true,
                    LockoutEnable = false,
                    AccessFailedCount = 0,
                    UrlAvatar = "https://media.istockphoto.com/id/1300845620/vector/user-icon-flat-isolated-on-white-background-user-symbol-vector-illustration.jpg?s=612x612&w=0&k=20&c=yBeyba0hUkh14_jgv1OKqIH0CCSWU_4ckRkAoy2p73o=",
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
        }
    }
}