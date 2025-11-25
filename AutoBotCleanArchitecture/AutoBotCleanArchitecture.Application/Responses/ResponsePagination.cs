using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Responses
{
    public class ResponsePagination<T>
    {
        public IList<T> Items { get; set; }   // Danh sách dữ liệu
        public int CurrentPage { get; set; }  // Trang hiện tại
        public int TotalPages { get; set; }   // Tổng số trang
        public int PageSize { get; set; }     // Kích thước trang
        public int TotalItems { get; set; }   // Tổng số bản ghi

    }
}
