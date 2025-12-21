using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Responses
{
    public class ResponseObject<T>
    {
        public int Status { get; set; }
        public string Message { get; set; }
        public T Data { get; set; }


        public ResponseObject() { }
        public ResponseObject(int status, string message, T data)
        {
            Status = status;
            Message = message;
            Data = data;
        }

        public ResponseObject<T> responseObjectSuccess(string message, T data)
        {
            return new ResponseObject<T>(StatusCodes.Status200OK, message, data);
        }
        public ResponseObject<T> responseObjectError(int status, string message, T data)
        {
            return new ResponseObject<T>(status, message, data);
        }
    }
}
