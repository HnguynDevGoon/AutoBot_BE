using AutoBotCleanArchitecture.Application.Converters;
using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Application.Interfaces;
using AutoBotCleanArchitecture.Application.Requests.User;
using AutoBotCleanArchitecture.Application.Responses;
using AutoBotCleanArchitecture.Domain.Constants;
using AutoBotCleanArchitecture.Domain.Entities;
using AutoBotCleanArchitecture.Handle;
using AutoBotCleanArchitecture.Persistence.DBContext;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Infrastructure.Implements
{
    public class Service_Authen : IService_Authen
    {
        private readonly AppDbContext dbContext;
        private readonly IConfiguration configuration;
        private readonly ResponseObject<DTO_Token> responseObjectToken;
        private readonly Converter_User converter_Authen;
        private readonly ResponseObject<DTO_User> responseObject;
        private readonly ResponseBase responseBase;

        public Service_Authen(AppDbContext dbContext, IConfiguration configuration, ResponseObject<DTO_Token> responseObjectToken, Converter_User converter_Authen, ResponseObject<DTO_User> responseObject, ResponseBase responseBase)
        {
            this.dbContext = dbContext;
            this.configuration = configuration;
            this.responseObjectToken = responseObjectToken;
            this.converter_Authen = converter_Authen;
            this.responseObject = responseObject;
            this.responseBase = responseBase;
        }

        public async Task<ResponseObject<DTO_Token>> RenewAccessToken(DTO_Token request)
        {
            var jwtTokenHandler = new JwtSecurityTokenHandler();
            var secretKeyBytes = Encoding.UTF8.GetBytes(configuration.GetSection("AppSettings:SecretKey").Value);

            var tokenValidation = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                ValidateAudience = false,
                ValidateIssuer = false,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration.GetSection("AppSettings:SecretKey").Value))
            };

            try
            {
                var tokenAuthentication = jwtTokenHandler.ValidateToken(request.AccessToken, tokenValidation, out var validatedToken);
                if (validatedToken is not JwtSecurityToken jwtSecurityToken || jwtSecurityToken.Header.Alg != SecurityAlgorithms.HmacSha256)
                {
                    return responseObjectToken.responseObjectError(StatusCodes.Status400BadRequest, "Token không hợp lệ", null);
                }
                RefreshToken refreshToken = await dbContext.refreshTokens.FirstOrDefaultAsync(x => x.Token == request.RefreshToken);
                if (refreshToken == null)
                {
                    return responseObjectToken.responseObjectError(StatusCodes.Status404NotFound, "RefreshToken không tồn tại trong database", null);
                }
                if (refreshToken.Exprited < DateTime.Now)
                {
                    return responseObjectToken.responseObjectError(StatusCodes.Status401Unauthorized, "Token chưa hết hạn", null);
                }
                var user = dbContext.users.FirstOrDefault(x => x.Id == refreshToken.UserId);
                if (user == null)
                {
                    return responseObjectToken.responseObjectError(StatusCodes.Status404NotFound, "Người dùng không tồn tại", null);
                }
                var newToken = GenerateAccessToken(user);

                return responseObjectToken.responseObjectSuccess("Làm mới token thành công", newToken);
            }
            catch (Exception ex)
            {
                return responseObjectToken.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null);
            }
        }
        private string GenerateRefreshToken()
        {
            var random = new byte[32];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(random);
                return Convert.ToBase64String(random);
            }
        }

        private DTO_Token GenerateAccessToken(User user)
        {
            var jwtTokenHandler = new JwtSecurityTokenHandler();
            var secretKeyBytes = System.Text.Encoding.UTF8.GetBytes(configuration.GetSection("AppSettings:SecretKey").Value);

            var decentralization = dbContext.roles.FirstOrDefault(x => x.Id == user.RoleId);

            var tokenDescription = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
             new Claim("Id", user.Id.ToString()),
             new Claim(ClaimTypes.Email, user.Email),
             new Claim("Username", user.UserName),
             new Claim("RoleId", user.RoleId.ToString()),
             
             new Claim("UrlAvatar", user.UrlAvatar.ToString()),
             new Claim("FullName", user.FullName.ToString()),
             new Claim(ClaimTypes.Role, decentralization?.RoleName ?? "")
         }),
                Expires = DateTime.UtcNow.AddHours(4),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(secretKeyBytes), SecurityAlgorithms.HmacSha256Signature)
            };
            var token = jwtTokenHandler.CreateToken(tokenDescription);
            var accessToken = jwtTokenHandler.WriteToken(token);
            var refreshToken = GenerateRefreshToken();

            RefreshToken rf = new RefreshToken
            {
                Token = refreshToken,
                Exprited = DateTime.UtcNow.AddHours(7),
                UserId = user.Id
            };

            dbContext.refreshTokens.Add(rf);
            dbContext.SaveChanges();

            DTO_Token tokenDTO = new DTO_Token
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken
            };
            return tokenDTO;
        }

        public ResponseObject<DTO_User> CreateUser(Request_CreateUser request)
        {
            if (dbContext.users.Any(x => x.UserName == request.UserName))
            {
                return responseObject.responseObjectError(StatusCodes.Status400BadRequest, "Tên đăng nhập đã tồn tại", null);
            }
            string checkUsername = CheckInput.IsValidUsername(request.UserName);
            if (checkUsername != request.UserName)
            {
                return responseObject.responseObjectError(StatusCodes.Status400BadRequest, checkUsername, null);
            }
            string checkPassword = CheckInput.IsPassWord(request.PassWord);

            if (checkPassword != request.PassWord)
            {
                return responseObject.responseObjectError(StatusCodes.Status400BadRequest, checkPassword, null);
            }

            bool checkEmail = CheckInput.IsValiEmail(request.Email);
            if (!checkEmail)
            {
                return responseObject.responseObjectError(StatusCodes.Status400BadRequest, "Email không hợp lệ !", null);
            }

            int emailCount = dbContext.users.Count(x => x.Email == request.Email);
            if (emailCount >= 1)
            {
                return responseObject.responseObjectError(StatusCodes.Status400BadRequest,
                                                "Email đã có quá 1 tài khoản đăng ký. Vui lòng chọn email khác !", null);
            }

            if (string.IsNullOrEmpty(request.PhoneNumber))
            {
                return responseObject.responseObjectError(StatusCodes.Status400BadRequest, "Số điện thoại là bắt buộc !", null);
            }

            int phoneCount = dbContext.users.Count(x => x.PhoneNumber == request.PhoneNumber);
            if (phoneCount >= 1)
            {
                return responseObject.responseObjectError(StatusCodes.Status400BadRequest,
                                            "Số điện thoại đã được đăng ký. Vui lòng chọn số khác !", null);
            }

            var userAccount = new User()
            {
                UserName = request.UserName,
                FullName = request.FullName,
                PassWord = BCrypt.Net.BCrypt.HashPassword(request.PassWord),
                Email = request.Email,
                PhoneNumber = request.PhoneNumber,
                BirthDay = request.BirthDay,
                RoleId = DefaultRoles.USER_ID,
            };

            string UrlAvt = null;
            if (request.UrlAvatar == null)
            {
                UrlAvt = "https://media.istockphoto.com/id/1300845620/vector/user-icon-flat-isolated-on-white-background-user-symbol-vector-illustration.jpg?s=612x612&w=0&k=20&c=yBeyba0hUkh14_jgv1OKqIH0CCSWU_4ckRkAoy2p73o=";
            }
            else
            {

                if (!CheckInput.IsImage(request.UrlAvatar))
                {
                    return responseObject.responseObjectError(StatusCodes.Status400BadRequest, "Ảnh không hợp lệ !", null);
                }
                CloudinaryService cloudinaryService = new CloudinaryService();
                UrlAvt = cloudinaryService.UploadImage(request.UrlAvatar);
            }
            userAccount.UrlAvatar = UrlAvt;


            dbContext.users.Add(userAccount);
            dbContext.SaveChanges();

            //Email To
            Random r = new Random();
            int code = r.Next(100000, 999999);
            var emailTo = new EmailTo();
            emailTo.Mail = request.Email;
            emailTo.Subject = "Nhận mã";
            emailTo.Content = $"Mã xác nhận của bạn là: {code}. Mã của bạn sẽ hết hạn sau 2 phút !";
            emailTo.SendEmailAsync(emailTo);

            //ConfirmEmail
           var confirmEmail = new ConfirmEmail();
            confirmEmail.Code = code.ToString();
            confirmEmail.Message = "Xác nhận đăng kí !";
            confirmEmail.Starttime = DateTime.Now;
            confirmEmail.Expiredtime = DateTime.Now.AddMinutes(2);
            confirmEmail.UserId = userAccount.Id;
            dbContext.confirmEmails.Add(confirmEmail);
            dbContext.SaveChanges();


            return responseObject.responseObjectSuccess("Đăng ký tài khoản thành công !", null);
        }

        public ResponseBase AccountVerification(Request_AccountVerification request)
        {
            var code = request.Code;

            var confirmEmail = dbContext.confirmEmails.FirstOrDefault(x => x.Code.Equals(code));
            if (confirmEmail == null)
            {
                return responseBase.ResponseError(400, "Mã xác thực không đúng !");
            }

            if (DateTime.Now > confirmEmail.Expiredtime)
            {
                // dbContext.confirmEmails.Remove(confirmEmail);
                // dbContext.SaveChanges();
                return responseBase.ResponseError(StatusCodes.Status400BadRequest, "Mã xác thực đã hết hạn !");
            }

            // 3. Nếu mọi thứ OK, kích hoạt tài khoản
            var nguoiDung = dbContext.users.FirstOrDefault(x => x.Id == confirmEmail.UserId);

            // Check xem đã active chưa, nếu rồi thì thôi
            if (nguoiDung.IsActive == true)
            {
                return responseBase.ResponseSuccess("Tài khoản này đã được kích hoạt trước đó !");
            }

            nguoiDung.IsActive = true;
            dbContext.users.Update(nguoiDung);

            // dbContext.confirmEmails.Remove(confirmEmail);

            dbContext.SaveChanges();
            return responseBase.ResponseSuccess("Xác thực tài khoản thành công !");
        }

        public async Task<ResponseObject<DTO_Token>> UserLogin(Request_UserLogin request)
        {
            if (string.IsNullOrWhiteSpace(request.LoginIdentifier) || string.IsNullOrWhiteSpace(request.PassWord))
            {
                return responseObjectToken.responseObjectError(StatusCodes.Status400BadRequest, "Giá trị nhập không hợp lệ", null);
            }

            // Đổi tên biến request cho khớp với code cũ
            var requestUsernameOrEmail = request.LoginIdentifier;

            var user = dbContext.users
                .FirstOrDefault(x => x.UserName == requestUsernameOrEmail ||
                                     x.Email == requestUsernameOrEmail ||
                                     x.PhoneNumber == requestUsernameOrEmail);

            if (user == null)
            {
                return responseObjectToken.responseObjectError(StatusCodes.Status400BadRequest, "Tên tài khoản hoặc mật khẩu không hợp lệ!", null);
            }

            // --- (1) LOGIC CHECK KHÓA TÀI KHOẢN ---
            if (user.LockoutEnable == true) // Check xem tính năng khóa có bật không
            {
                // Check xem có đang bị khóa không (thời gian khóa chưa hết)
                if (user.LockoutEnd > DateTime.UtcNow)
                {
                    var secondsLeft = Math.Ceiling(user.LockoutEnd.Subtract(DateTime.UtcNow).TotalSeconds);
                    return responseObjectToken.responseObjectError(
                        StatusCodes.Status423Locked, // Lỗi 423 Locked
                        $"Tài khoản đang bị khóa. Vui lòng thử lại sau {secondsLeft} giây.",
                        null
                    );
                }
                else
                {
                    // NẾU CHẠY VÀO ĐÂY (ELSE):
                    // Tức là thời gian khóa (1 phút) ĐÃ HẾT.
                    // Ta phải reset bộ đếm cho họ
                    user.AccessFailedCount = 0;
                    user.LockoutEnable = false; // Tắt cờ khóa
                                                // (Không cần SaveChanges vội, để block dưới xử lý)
                }
            }
            // --- HẾT CHECK KHÓA ---


            // --- (2) LOGIC XỬ LÝ SAI MẬT KHẨU ---
            if (!BCrypt.Net.BCrypt.Verify(request.PassWord, user.PassWord))
            {
                // Tăng bộ đếm lỗi
                user.AccessFailedCount++;

                // (Giả sử 5 lần là khóa)
                if (user.AccessFailedCount >= 5)
                {
                    // SỬA LẠI: KHÓA TRONG 1 PHÚT (để test)
                    user.LockoutEnd = DateTime.UtcNow.AddMinutes(1);
                    user.LockoutEnable = true; // Bật cờ khóa
                }

                // Lưu lại (quan trọng)
                dbContext.SaveChanges();

                return responseObjectToken.responseObjectError(StatusCodes.Status400BadRequest, "Tên tài khoản hoặc mật khẩu không hợp lệ!", null);
            }
            // --- HẾT XỬ LÝ SAI MẬT KHẨU ---


            // --- (3) LOGIC XỬ LÝ ĐÚNG MẬT KHẨU ---
            // (Nếu code chạy tới đây, tức là pass đúng)

            // Nếu trước đó có đăng nhập sai (AccessFailedCount > 0), thì giờ reset về 0
            if (user.AccessFailedCount > 0)
            {
                user.AccessFailedCount = 0;
                // (Không cần SaveChanges() ở đây vội, 
                // vì 2 block code bên dưới (IsActive hoặc GenerateToken) cũng sẽ Save)
            }


            // --- CHECK ISACTIVE (Giữ nguyên code của ông) ---
            if (user.IsActive != true)
            {
                // ... (Code xóa mã cũ, tạo mã mới, gửi email...) ...
                // (Tôi copy lại code cũ của ông)
                var oldCodes = dbContext.confirmEmails.Where(x => x.UserId == user.Id);
                if (oldCodes.Any())
                {
                    dbContext.confirmEmails.RemoveRange(oldCodes);
                }
                Random r = new Random();
                int code = r.Next(100000, 999999);
                var emailTo = new EmailTo();
                emailTo.Mail = user.Email;
                emailTo.Subject = "Xác nhận lại tài khoản";
                emailTo.Content = $"Mã xác nhận của bạn là: {code}. Mã của bạn sẽ hết hạn sau 2 phút !";
                emailTo.SendEmailAsync(emailTo);
                var confirmEmail = new ConfirmEmail();
                confirmEmail.Code = code.ToString();
                confirmEmail.Message = "Xác nhận đăng nhập lại !";
                confirmEmail.Starttime = DateTime.Now;
                confirmEmail.Expiredtime = DateTime.Now.AddMinutes(2);
                confirmEmail.UserId = user.Id;
                dbContext.confirmEmails.Add(confirmEmail);

                // Dòng này sẽ lưu (AccessFailedCount = 0) VÀ (mã confirm mới)
                dbContext.SaveChanges();

                return responseObjectToken.responseObjectError(
                    StatusCodes.Status401Unauthorized,
                    "Tài khoản chưa được kích hoạt. Chúng tôi đã gửi lại mã xác nhận đến email của bạn.",
                    null
                );
            }
            // --- XONG ---

            // Đăng nhập thành công (pass đúng VÀ đã active)
            // Hàm GenerateAccessToken() cũng sẽ SaveChanges() (để lưu RefreshToken)
            // nên (AccessFailedCount = 0) cũng sẽ được lưu.
            return responseObjectToken.responseObjectSuccess("Đăng nhập thành công", GenerateAccessToken(user));
        }

        public ResponseBase ForgotPassword(Request_ForgotPassword request)
        {
            var user = dbContext.users.FirstOrDefault(x => x.Email == request.Email);
            if (user == null)
            {
                return responseBase.ResponseError(StatusCodes.Status404NotFound, "Email này chưa tạo tài khoản !");
            }

            Random r = new Random();
            int code = r.Next(100000, 999999);
            var emailTo = new EmailTo();
            emailTo.Mail = request.Email;
            emailTo.Subject = "Nhận mã";
            emailTo.Content = $"Mã xác nhận của bạn là: {code}. Mã của bạn sẽ hết hạn sau 2 phút !";
            emailTo.SendEmailAsync(emailTo);

            var confirmEmail = new ConfirmEmail();
            confirmEmail.Code = code.ToString();
            confirmEmail.Message = "Xác nhận mã";
            confirmEmail.Starttime = DateTime.Now;
            confirmEmail.Expiredtime = DateTime.Now.AddMinutes(2);
            confirmEmail.UserId = user.Id;
            dbContext.confirmEmails.Add(confirmEmail);
            dbContext.SaveChanges();

            return responseBase.ResponseSuccess("Mã OTP đang gửi vào email của bạn !");

        }

        public ResponseBase UpdatePassAfterOtp(Guid userId, string newPass, string confirmPass)
        {
            if (string.IsNullOrEmpty(newPass) || string.IsNullOrEmpty(confirmPass))
            {
                return responseBase.ResponseError(StatusCodes.Status400BadRequest, "Mật khẩu không được để trống !");
            }

            var user = dbContext.users.FirstOrDefault(x => x.Id == userId);
            if (user == null)
            {
                return responseBase.ResponseError(StatusCodes.Status404NotFound, "Không có user nào được tìm thấy !");
            }

            string checkPassword = CheckInput.IsPassWord(newPass);
            if (checkPassword != newPass)
            {
                return responseBase.ResponseError(StatusCodes.Status400BadRequest, checkPassword);
            }

            if (confirmPass != newPass)
            {
                return responseBase.ResponseError(StatusCodes.Status400BadRequest, "Xác nhận mật khẩu sai !");
            }

            user.PassWord = BCrypt.Net.BCrypt.HashPassword(newPass);

            dbContext.users.Update(user);
            dbContext.SaveChanges();

            return responseBase.ResponseSuccess("Đổi mật khẩu thành công !");
        }

        public ResponseBase ChangePassword(Guid userId, string oldPass, string newPass)
        {
            if (string.IsNullOrWhiteSpace(oldPass) || string.IsNullOrWhiteSpace(newPass))
            {
                return responseBase.ResponseError(StatusCodes.Status400BadRequest, "Giá trị nhập không hợp lệ");
            }

            var user = dbContext.users.FirstOrDefault(x => x.Id == userId);
            if (user == null)
            {
                return responseBase.ResponseError(StatusCodes.Status404NotFound, "Người dùng không tồn tại!");
            }

            string checkPassword = CheckInput.IsPassWord(newPass);
            if (checkPassword != newPass)
            {
                return responseBase.ResponseError(400, checkPassword);
            }

            if (BCrypt.Net.BCrypt.Verify(oldPass, user.PassWord))
            {
                user.PassWord = BCrypt.Net.BCrypt.HashPassword(newPass);
                dbContext.users.Update(user);
                dbContext.SaveChanges();

                return responseBase.ResponseSuccess("Đổi mật khẩu thành công!");
            }

            return responseBase.ResponseError(StatusCodes.Status400BadRequest, "Sai mật khẩu cũ!");
        }

        public IQueryable<DTO_User> GetListUser(int pageSize, int pageNumber)
        {
            return dbContext.users.Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(x => converter_Authen.EntityToDTO(x));
        }

        public ResponseObject<DTO_User> GetUserById(Guid userId)
        {
            var searchUserId = dbContext.users.FirstOrDefault(x => x.Id == userId);
            if (searchUserId == null)
            {
                return responseObject.responseObjectError(StatusCodes.Status404NotFound, "Không tìm thấy user", null);
            }

            // Chuyển đổi role entity thành DTO
            var userDto = converter_Authen.EntityToDTO(searchUserId);

            return responseObject.responseObjectSuccess("Tìm user thành công", userDto);
        }

        public ResponseObject<DTO_User> DeleteUser(Guid userId)
        {
            var searchUserId = dbContext.users.FirstOrDefault(x => x.Id == userId);
            if (searchUserId == null)
            {
                return responseObject.responseObjectError(StatusCodes.Status404NotFound, "User không tồn tại", null);
            }
            dbContext.users.Remove(searchUserId);
            dbContext.SaveChanges();
            return responseObject.responseObjectSuccess("Xóa thành công !", null);
        }

        public ResponseObject<DTO_User> UpdateAvatar(Request_UpdateAvatar request)
        {
            var user = dbContext.users.FirstOrDefault(x => x.Id == request.Id);
            if (user == null)
            {
                return responseObject.responseObjectError(StatusCodes.Status404NotFound, "Không tìm thấy user", null);
            }

            if (request.UrlAvatar != null)
            {
                CloudinaryService cloudinaryService = new CloudinaryService();
                user.UrlAvatar = cloudinaryService.UploadImage(request.UrlAvatar);
            }

            dbContext.users.Update(user);
            dbContext.SaveChanges();

            var userDto = converter_Authen.EntityToDTO(user);
            return responseObject.responseObjectSuccess("Cập nhật ảnh đại diện thành công!", userDto);
        }

        public ResponseBase VerifyResetOtp(Request_VerifyResetOtp request)
        {
            var otp = request.Otp;

            var confirmEmail = dbContext.confirmEmails.FirstOrDefault(x => x.Code == otp);
            if (confirmEmail == null)
            {
                return responseBase.ResponseError(StatusCodes.Status400BadRequest, "Mã OTP không hợp lệ !");
            }

            if (DateTime.Now > confirmEmail.Expiredtime)
            {
                return responseBase.ResponseError(StatusCodes.Status400BadRequest, "Mã OTP đã hết hạn !");
            }

            var user = dbContext.users.FirstOrDefault(x => x.Id == confirmEmail.UserId);

            return responseBase.ResponseSuccess($"{user.Id}");
        }

        public ResponseBase ValidateAccount(Request_ValidateAccount request)
        {
            if (dbContext.users.Any(x => x.UserName == request.UserName))
            {
                return responseBase.ResponseError(StatusCodes.Status400BadRequest, "Tên đăng nhập đã tồn tại");
            }

            string checkUsername = CheckInput.IsValidUsername(request.UserName);
            if (checkUsername != request.UserName)
            {
                return responseBase.ResponseError(StatusCodes.Status400BadRequest, checkUsername);
            }

            bool checkEmail = CheckInput.IsValiEmail(request.Email);
            if (!checkEmail)
            {
                return responseBase.ResponseError(StatusCodes.Status400BadRequest, "Email không hợp lệ !");
            }

            int emailCount = dbContext.users.Count(x => x.Email == request.Email);
            if (emailCount >= 1)
            {
                return responseBase.ResponseError(StatusCodes.Status400BadRequest,
                                                "Email đã có quá 1 tài khoản đăng ký. Vui lòng chọn email khác !");
            }
            return responseBase.ResponseSuccess("Thông tin hợp lệ.");
        }
    }
}
