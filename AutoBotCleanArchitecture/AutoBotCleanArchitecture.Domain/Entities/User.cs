using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Domain.Entities
{
    public class User : BaseEntity
    {
        public string UserName { get; set; }
        public string PassWord { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public string UrlAvatar { get; set; }
        public bool? IsActive { get; set; } = false;
        public DateTime LockoutEnd { get; set; }
        public bool? LockoutEnable { get; set; }
        public int AccessFailedCount { get; set; }
        //--------------------------
        public Guid? RoleId { get; set; } = new Guid("b0e8db02-4771-46be-8541-5a0ae5f4f065");
        public Role? Role { get; set; }
        //--------------------------
        public ICollection<ConfirmEmail>? ConfirmEmails { get; set; }
        public ICollection<RefreshToken>? RefreshTokens { get; set; }
    }
}
