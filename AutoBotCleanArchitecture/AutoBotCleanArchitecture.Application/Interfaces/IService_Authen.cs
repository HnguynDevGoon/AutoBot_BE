using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Application.Requests.User;
using AutoBotCleanArchitecture.Application.Responses;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Application.Interfaces
{
    public interface IService_Authen
    {
        Task<ResponseObject<DTO_Token>> RenewAccessToken(DTO_Token request);
        ResponseObject<DTO_User> CreateUser(Request_CreateUser request);
        Task<ResponseObject<DTO_Token>> UserLogin(Request_UserLogin request);
        public ResponseBase AccountVerification(string code);
        public ResponseBase ForgotPassword(string email);
        public ResponseBase UpdatePassAfterOtp(Guid userId, string newPass, string confirmPass);
        public ResponseBase ChangePassword(Guid userId, string oldPass, string newPass);
        public IQueryable<DTO_User> GetListUser(int pageSize, int pageNumber);
        public ResponseObject<DTO_User> GetUserById(Guid userId);
        public ResponseObject<DTO_User> DeleteUser(Guid userId);
        public ResponseObject<DTO_User> UpdateAvatar(Request_UpdateAvatar request);

    }
}
