using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.DTOs
{
    public class DTO_Salary
    {
        public Guid Id { get; set; }
        public int Month { get; set; }
        public int Year { get; set; }
        public double Price { get; set; }
        public double Bonus { get; set; }
        public string Description { get; set; }
        public string FullName { get; set; }
        public Guid UserId { get; set; }
    }
}
