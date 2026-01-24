using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Domain.Entities
{
    public class Salary : BaseEntity
    {
        public int Month { get; set; }
        public int Year { get; set; }

        public double Price { get; set; } 
        public double Bonus { get; set; } 
        public string Description { get; set; } 

        public Guid UserId { get; set; }
        public User User { get; set; }
    }
}
