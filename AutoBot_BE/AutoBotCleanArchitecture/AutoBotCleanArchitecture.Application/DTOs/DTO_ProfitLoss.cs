using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.DTOs
{
    public class DTO_ProfitLoss
    {
        public Guid Id { get; set; }
        public double Price { get; set; }
        public DateTime Date { get; set; }
        public Guid? UserId { get; set; }
        public string FullName { get; set; }
    }
}
