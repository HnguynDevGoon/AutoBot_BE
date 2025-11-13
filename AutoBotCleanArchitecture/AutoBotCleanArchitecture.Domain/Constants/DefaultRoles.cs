using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Domain.Constants
{
    public class DefaultRoles
    {
        // (1) Guid cho Role "Admin"
        public static readonly Guid ADMIN_ID = new Guid("c3f08f62-b9b2-4d14-b8e7-3f3d5b0c7a6c");

        // (2) Guid cho Role "User" 
        public static readonly Guid USER_ID = new Guid("d1d08c62-c6e2-4d12-b8e8-3f3d5b0c7a6d");

        // (3) Guid cho Account (Admin)
        public static readonly Guid ADMIN_USER_ID = new Guid("7b26185e-e90d-4ea6-bea8-5562ad4f627c");
    }
}