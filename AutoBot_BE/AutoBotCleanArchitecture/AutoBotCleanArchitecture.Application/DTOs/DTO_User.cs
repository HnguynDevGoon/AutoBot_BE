using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.DTOs
{
    public class DTO_User
    {
        public Guid Id { get; set; }
        public string UserName { get; set; }
        public string PassWord { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public string UrlAvatar { get; set; }
        public DateOnly? BirthDay { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime LockoutEnd { get; set; }
        public bool? LockoutEnable { get; set; }
        public int AccessFailedCount { get; set; }
        public bool? IsActive { get; set; }
        public bool? TwoStep { get; set; }
        public string? RoleName { get; set; }
    }
}
