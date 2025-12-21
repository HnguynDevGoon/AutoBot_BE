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
        Task<ResponseObject<DTO_User>> CreateUser(Request_CreateUser request); 
        Task<ResponseObject<DTO_Token>> UserLogin(Request_UserLogin request);
        Task<ResponseBase> AccountVerification(Request_AccountVerification request); 
        Task<ResponseObject<DTO_User>> ForgotPassword(Request_ResendOtp request); 
        Task<ResponseBase> UpdatePassAfterOtp(Request_UpdatePassAfterOtp request); 
        Task<ResponseBase> ChangePassword(Request_ChangePassword request);
        Task<ResponseObject<ResponsePagination<DTO_User>>> GetListUser(int pageSize, int pageNumber);
        Task<ResponseObject<DTO_User>> GetUserById(Guid userId);
        Task<ResponseObject<DTO_User>> DeleteUser(Guid userId); 
        Task<ResponseObject<DTO_User>> UpdateAvatar(Request_UpdateAvatar request); 
        Task<ResponseBase> VerifyResetOtp(Request_VerifyResetOtp request);
        Task<ResponseObject<DTO_Token>> VerifyTwoStep(Request_VerifyTwoStep request);
        Task<ResponseObject<DTO_Token>> GoogleLogin(Request_GoogleLogin request); 
        Task<ResponseObject<DTO_Token>> FacebookLogin(Request_FacebookLogin request);
        Task<ResponseBase> ValidateAccountStepOne(Request_ValidateAccountStepOne request);
        Task<ResponseObject<DTO_User>> ResendOtpForCreateUser(Request_ResendOtp request);
        Task<ResponseObject<DTO_User>> ResendOtpForTwoStep(Request_ResendOtp request);
        Task<ResponseObject<DTO_User>> GetEmailByIdentifier(Request_GetEmail request);
        Task<ResponseObject<DTO_User>> UpdateUserInfo(Request_UpdateUserInfo request);
        Task<ResponseObject<DTO_User>> OnOffTwoStep(Request_OnOffTwoStep request);
        Task<ResponseObject<ResponsePagination<DTO_User>>> SearchUserByAdmin(Request_SearchUserByAdmin request);

    }
}