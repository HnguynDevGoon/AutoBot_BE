using AutoBotCleanArchitecture.Application.Converters;
using AutoBotCleanArchitecture.Application.DTOs;
using AutoBotCleanArchitecture.Application.Interfaces;
using AutoBotCleanArchitecture.Application.Requests.User;
using AutoBotCleanArchitecture.Application.Responses;
using AutoBotCleanArchitecture.Domain.Constants;
using AutoBotCleanArchitecture.Domain.Entities;
using AutoBotCleanArchitecture.Handle;
using AutoBotCleanArchitecture.Persistence.DBContext;
using Google.Apis.Auth;
using Google.Apis.Http;
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
using System.Text.Json;
using System.Net.Http;
using System.Threading.Tasks;

namespace AutoBotCleanArchitecture.Infrastructure.Implements
{
    public class Service_Authen : IService_Authen
    {
        private readonly AppDbContext dbContext;
        private readonly IConfiguration configuration;
        private readonly System.Net.Http.IHttpClientFactory httpClientFactory;
        private readonly ResponseObject<DTO_Token> responseObjectToken;
        private readonly Converter_User converter_Authen;
        private readonly ResponseObject<DTO_User> responseObject;
        private readonly ResponseBase responseBase;
        private readonly ResponseObject<ResponsePagination<DTO_User>> responsePagination;

        public Service_Authen(AppDbContext dbContext, IConfiguration configuration, System.Net.Http.IHttpClientFactory httpClientFactory, ResponseObject<DTO_Token> responseObjectToken, Converter_User converter_Authen, ResponseObject<DTO_User> responseObject, ResponseBase responseBase, ResponseObject<ResponsePagination<DTO_User>> responsePagination)
        {
            this.dbContext = dbContext;
            this.configuration = configuration;
            this.httpClientFactory = httpClientFactory;
            this.responseObjectToken = responseObjectToken;
            this.converter_Authen = converter_Authen;
            this.responseObject = responseObject;
            this.responseBase = responseBase;
            this.responsePagination = responsePagination;
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
                    return responseObjectToken.responseObjectError(StatusCodes.Status401Unauthorized, "Token đã hết hạn", null); 
                }

                var user = await dbContext.users.FirstOrDefaultAsync(x => x.Id == refreshToken.UserId);
                if (user == null)
                {
                    return responseObjectToken.responseObjectError(StatusCodes.Status404NotFound, "Người dùng không tồn tại", null);
                }
                var newToken = await GenerateAccessToken(user);

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

        private async Task<DTO_Token> GenerateAccessToken(User user)
        {
            var jwtTokenHandler = new JwtSecurityTokenHandler();
            var secretKeyBytes = System.Text.Encoding.UTF8.GetBytes(configuration.GetSection("AppSettings:SecretKey").Value);


            var decentralization = await dbContext.roles.FirstOrDefaultAsync(x => x.Id == user.RoleId);

            var tokenDescription = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                        new Claim("Id", user.Id.ToString()),
                        //new Claim(ClaimTypes.Email, user.Email),
                        //new Claim("Username", user.UserName),
                        new Claim("RoleId", user.RoleId.ToString()),
                        
                        //new Claim("UrlAvatar", user.UrlAvatar.ToString()),
                        //new Claim("FullName", user.FullName.ToString()),
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
                Id = Guid.NewGuid(),
                Token = refreshToken,
                Exprited = DateTime.UtcNow.AddHours(7), 
                UserId = user.Id
            };

            await dbContext.refreshTokens.AddAsync(rf); 
            await dbContext.SaveChangesAsync(); 

            DTO_Token tokenDTO = new DTO_Token
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken
            };
            return tokenDTO;
        }

        public async Task<ResponseObject<DTO_User>> CreateUser(Request_CreateUser request)
        {
            if (await dbContext.users.AnyAsync(x => x.UserName == request.UserName))
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

            int emailCount = await dbContext.users.CountAsync(x => x.Email == request.Email);
            if (emailCount >= 1)
            {
                return responseObject.responseObjectError(StatusCodes.Status400BadRequest,
                                                        "Email đã có quá 1 tài khoản đăng ký. Vui lòng chọn email khác !", null);
            }

            if (string.IsNullOrEmpty(request.PhoneNumber))
            {
                return responseObject.responseObjectError(StatusCodes.Status400BadRequest, "Số điện thoại là bắt buộc !", null);
            }

            int phoneCount = await dbContext.users.CountAsync(x => x.PhoneNumber == request.PhoneNumber);
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
                CreatedDate = DateTime.UtcNow,
                RoleId = DefaultRoles.USER_ID,
            };

            string UrlAvt = null;
            if (request.UrlAvatar == null)
            {
                UrlAvt = "https://res.cloudinary.com/drpxjqd47/image/upload/v1763051875/xusxceivnufh4ncc8peb.jpg";
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


            await dbContext.users.AddAsync(userAccount);
            await dbContext.SaveChangesAsync(); 

            //Email To
            Random r = new Random();
            int code = r.Next(100000, 999999);
            var emailTo = new EmailTo();
            emailTo.Mail = request.Email;
            emailTo.Subject = "Xác nhận đăng kí tài khoản";
            emailTo.Content = $"Mã xác nhận đăng kí tài khoản của bạn là: {code}. Mã của bạn sẽ hết hạn sau 2 phút !";
            emailTo.SendEmailAsync(emailTo);

            //ConfirmEmail
            var confirmEmail = new ConfirmEmail();
            confirmEmail.Code = code.ToString();
            confirmEmail.Message = "Xác nhận đăng kí tài khoản";
            confirmEmail.Starttime = DateTime.Now;
            confirmEmail.Expiredtime = DateTime.Now.AddMinutes(2);
            confirmEmail.UserId = userAccount.Id;
            await dbContext.confirmEmails.AddAsync(confirmEmail); 
            await dbContext.SaveChangesAsync(); 


            return responseObject.responseObjectSuccess("Đăng ký tài khoản thành công !", null);
        }

        public async Task<ResponseBase> AccountVerification(Request_AccountVerification request)
        {
            var code = request.Code;

            var confirmEmail = await dbContext.confirmEmails.FirstOrDefaultAsync(x => x.Code.Equals(code));
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
            var nguoiDung = await dbContext.users.FirstOrDefaultAsync(x => x.Id == confirmEmail.UserId);

            if (nguoiDung.IsActive == true)
            {
                return responseBase.ResponseSuccess("Tài khoản này đã được kích hoạt trước đó !");
            }

            nguoiDung.IsActive = true;
            dbContext.users.Update(nguoiDung);

            // dbContext.confirmEmails.Remove(confirmEmail);

            await dbContext.SaveChangesAsync(); 
            return responseBase.ResponseSuccess("Xác thực tài khoản thành công !");
        }

        public async Task<ResponseObject<DTO_Token>> UserLogin(Request_UserLogin request)
        {
            // 1. Validate Input
            if (string.IsNullOrWhiteSpace(request.LoginIdentifier) ||
                string.IsNullOrWhiteSpace(request.PassWord))
            {
                return responseObjectToken.responseObjectError(StatusCodes.Status400BadRequest, "Giá trị nhập không hợp lệ", null);
            }

            // 2. Tìm User
            var identifier = request.LoginIdentifier;
            var user = await dbContext.users
                .FirstOrDefaultAsync(x =>
                    x.UserName == identifier ||
                    x.Email == identifier ||
                    x.PhoneNumber == identifier
                );

            if (user == null)
            {
                return responseObjectToken.responseObjectError(StatusCodes.Status400BadRequest, "Tên tài khoản hoặc mật khẩu không hợp lệ!", null);
            }

            // 3. Check Lockout (Khóa tài khoản)
            if (user.LockoutEnable == true)
            {
                if (user.LockoutEnd > DateTime.UtcNow)
                {
                    var secondsLeft = Math.Ceiling((user.LockoutEnd - DateTime.UtcNow).TotalSeconds);
                    return responseObjectToken.responseObjectError(StatusCodes.Status423Locked, $"Tài khoản đang bị khóa. Vui lòng thử lại sau {secondsLeft} giây.", null);
                }
                // Hết hạn khóa -> Reset
                user.AccessFailedCount = 0;
                user.LockoutEnable = false;
            }

            // 4. Check Password
            if (!BCrypt.Net.BCrypt.Verify(request.PassWord, user.PassWord))
            {
                user.AccessFailedCount++;
                if (user.AccessFailedCount >= 5)
                {
                    user.LockoutEnd = DateTime.UtcNow.AddMinutes(1);
                    user.LockoutEnable = true;
                }
                await dbContext.SaveChangesAsync();
                return responseObjectToken.responseObjectError(StatusCodes.Status400BadRequest, "Tên tài khoản hoặc mật khẩu không hợp lệ!", null);
            }

            // Reset count nếu login đúng
            if (user.AccessFailedCount > 0)
            {
                user.AccessFailedCount = 0;
            }

            // 5. Check Active (Kích hoạt email)
            if (user.IsActive != true)
            {
                var oldCodes = dbContext.confirmEmails.Where(x => x.UserId == user.Id);
                if (oldCodes.Any()) dbContext.confirmEmails.RemoveRange(oldCodes);

                Random r = new Random();
                int code = r.Next(100000, 999999);

                // Gửi mail (Giữ nguyên logic của ông)
                var emailTo = new EmailTo();
                emailTo.Mail = user.Email;
                emailTo.Subject = "Kích hoạt tài khoản";
                emailTo.Content = $"Mã xác nhận của bạn là: {code}. Mã của bạn sẽ hết hạn sau 2 phút !";
                emailTo.SendEmailAsync(emailTo);

                var confirmEmail = new ConfirmEmail();
                confirmEmail.Code = code.ToString();
                confirmEmail.Message = "Xác nhận đăng nhập lại";
                confirmEmail.Starttime = DateTime.Now;
                confirmEmail.Expiredtime = DateTime.Now.AddMinutes(2);
                confirmEmail.UserId = user.Id;

                await dbContext.confirmEmails.AddAsync(confirmEmail);
                await dbContext.SaveChangesAsync();

                return responseObjectToken.responseObjectError(StatusCodes.Status401Unauthorized, "Tài khoản chưa được xác thực. Chúng tôi đã gửi lại mã xác nhận đến email của bạn.", null);
            }

            // 6. Check Two-Step (2FA)
            if (user.TwoStep == true)
            {
                var oldCodes = dbContext.confirmEmails.Where(x => x.UserId == user.Id);
                if (oldCodes.Any()) dbContext.confirmEmails.RemoveRange(oldCodes);

                Random r = new Random();
                int code = r.Next(100000, 999999);

                var emailTo = new EmailTo();
                emailTo.Mail = user.Email;
                emailTo.Subject = "Mã xác thực 2 bước";
                emailTo.Content = $"Mã xác nhận đăng nhập của bạn là: {code}. Mã sẽ hết hạn sau 2 phút!";
                emailTo.SendEmailAsync(emailTo);

                var confirmEmail = new ConfirmEmail();
                confirmEmail.Code = code.ToString();
                confirmEmail.Message = "Xác thực 2 bước đăng nhập";
                confirmEmail.Starttime = DateTime.Now;
                confirmEmail.Expiredtime = DateTime.Now.AddMinutes(2);
                confirmEmail.UserId = user.Id;

                await dbContext.confirmEmails.AddAsync(confirmEmail);
                await dbContext.SaveChangesAsync();

                return responseObjectToken.responseObjectError(StatusCodes.Status412PreconditionFailed, "Tài khoản đã bật xác thực 2 bước. Vui lòng nhập mã OTP được gửi qua email.", null);
            }

            // 7. Tạo Token
            var dtoToken = await GenerateAccessToken(user);

            // ========== 8. QUẢN LÝ THIẾT BỊ (ĐOẠN QUAN TRỌNG ĐỂ FIX LỖI 23505) ==========

            // Clean chuỗi fingerprint
            var clientFingerprint = request.Fingerprint?.Trim();

            // Tìm xem thiết bị đã có chưa
            var device = await dbContext.userDevices
                .FirstOrDefaultAsync(d => d.UserId == user.Id && d.Fingerprint == clientFingerprint);

            if (device != null)
            {
                // CASE A: Đã có -> Update Token mới
                device.AccessToken = dtoToken.AccessToken;
                device.RefreshToken = dtoToken.RefreshToken;
                device.LastUpdatedAt = DateTime.UtcNow;

                await dbContext.SaveChangesAsync();
            }
            else
            {
                // CASE B: Chưa có -> Tạo mới (Dùng Try-Catch để bắt Race Condition)
                var newDevice = new UserDevice
                {
                    Id = Guid.NewGuid(),
                    UserId = user.Id,
                    Fingerprint = clientFingerprint,
                    AccessToken = dtoToken.AccessToken,
                    RefreshToken = dtoToken.RefreshToken,
                    CreatedAt = DateTime.UtcNow,
                    LastUpdatedAt = DateTime.UtcNow
                };

                try
                {
                    await dbContext.userDevices.AddAsync(newDevice);
                    await dbContext.SaveChangesAsync(); // Cố gắng Insert
                }
                catch (DbUpdateException ex)
                {
                    // Kiểm tra xem có phải lỗi trùng lặp Postgres (23505) không
                    bool isDuplicate = false;
                    if (ex.InnerException is Npgsql.PostgresException pgEx && pgEx.SqlState == "23505")
                    {
                        isDuplicate = true;
                    }

                    if (isDuplicate)
                    {
                        // ==> XẢY RA XUNG ĐỘT: Request khác đã tạo xong rồi.

                        // 1. Hủy theo dõi cái entity bị lỗi để tránh EF bị kẹt
                        dbContext.Entry(newDevice).State = EntityState.Detached;

                        // 2. Query lại để lấy cái thằng vừa được tạo bởi request kia
                        var existingRetry = await dbContext.userDevices
                            .FirstOrDefaultAsync(d => d.UserId == user.Id && d.Fingerprint == clientFingerprint);

                        // 3. Update đè lên nó
                        if (existingRetry != null)
                        {
                            existingRetry.AccessToken = dtoToken.AccessToken;
                            existingRetry.RefreshToken = dtoToken.RefreshToken;
                            existingRetry.LastUpdatedAt = DateTime.UtcNow;

                            dbContext.userDevices.Update(existingRetry);
                            await dbContext.SaveChangesAsync();
                        }
                    }
                    else
                    {
                        // Nếu lỗi khác (không phải trùng lặp) thì ném ra ngoài
                        throw;
                    }
                }
            }

            // Lưu các thay đổi khác (ví dụ reset AccessFailedCount) nếu chưa lưu
            if (dbContext.ChangeTracker.HasChanges())
            {
                await dbContext.SaveChangesAsync();
            }

            return responseObjectToken.responseObjectSuccess(
                "Đăng nhập thành công",
                dtoToken
            );
        }

        public async Task<ResponseObject<DTO_User>> ForgotPassword(Request_ResendOtp request)
        {
            var user = await dbContext.users.FirstOrDefaultAsync(x => x.UserName == request.Identifier ||
                                          x.Email == request.Identifier ||
                                          x.PhoneNumber == request.Identifier);

            if (user == null)
            {
                return responseObject.responseObjectError(StatusCodes.Status404NotFound, "Email này chưa tạo tài khoản !", null);
            }

            Random r = new Random();
            int code = r.Next(100000, 999999);
            var emailTo = new EmailTo();
            emailTo.Mail = user.Email;
            emailTo.Subject = "Nhận mã cho quên mật khẩu";
            emailTo.Content = $"Mã xác nhận cho quên mật khẩu của bạn là: {code}. Mã của bạn sẽ hết hạn sau 2 phút !";
            emailTo.SendEmailAsync(emailTo);

            var confirmEmail = new ConfirmEmail();
            confirmEmail.Code = code.ToString();
            confirmEmail.Message = "Xác nhận mã";
            confirmEmail.Starttime = DateTime.Now;
            confirmEmail.Expiredtime = DateTime.Now.AddMinutes(2);
            confirmEmail.UserId = user.Id;
            await dbContext.confirmEmails.AddAsync(confirmEmail);
            await dbContext.SaveChangesAsync();



            return responseObject.responseObjectSuccess(
                "Mã xác nhận cho quên mật khẩu đang gửi vào email của bạn !",
                new DTO_User { Email = user.Email }
            );

        }

        public async Task<ResponseBase> UpdatePassAfterOtp(Request_UpdatePassAfterOtp request)
        {
            if (string.IsNullOrEmpty(request.NewPassword) || string.IsNullOrEmpty(request.ConfirmPassword))
            {
                return responseBase.ResponseError(StatusCodes.Status400BadRequest, "Mật khẩu không được để trống !");
            }

            var user = await dbContext.users.FirstOrDefaultAsync(x => x.Id == request.Id);
            if (user == null)
            {
                return responseBase.ResponseError(StatusCodes.Status404NotFound, "Không có user nào được tìm thấy !");
            }

            string checkPassword = CheckInput.IsPassWord(request.NewPassword);
            if (checkPassword != request.NewPassword)
            {
                return responseBase.ResponseError(StatusCodes.Status400BadRequest, checkPassword);
            }

            if (request.ConfirmPassword != request.NewPassword)
            {
                return responseBase.ResponseError(StatusCodes.Status400BadRequest, "Xác nhận mật khẩu sai !");
            }

            user.PassWord = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);

            dbContext.users.Update(user);
            await dbContext.SaveChangesAsync(); 

            return responseBase.ResponseSuccess("Đổi mật khẩu thành công !");
        }

        public async Task<ResponseBase> ChangePassword(Request_ChangePassword request)
        {
            if (string.IsNullOrWhiteSpace(request.OldPassword) || string.IsNullOrWhiteSpace(request.NewPassword))
            {
                return responseBase.ResponseError(StatusCodes.Status400BadRequest, "Giá trị nhập không hợp lệ");
            }

            var user = await dbContext.users.FirstOrDefaultAsync(x => x.Id == request.Id);
            if (user == null)
            {
                return responseBase.ResponseError(StatusCodes.Status404NotFound, "Người dùng không tồn tại!");
            }

            string checkPassword = CheckInput.IsPassWord(request.NewPassword);
            if (checkPassword != request.NewPassword)
            {
                return responseBase.ResponseError(400, checkPassword);
            }

            if (BCrypt.Net.BCrypt.Verify(request.OldPassword, user.PassWord))
            {
                user.PassWord = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
                dbContext.users.Update(user);
                await dbContext.SaveChangesAsync(); 

                return responseBase.ResponseSuccess("Đổi mật khẩu thành công!");
            }

            return responseBase.ResponseError(StatusCodes.Status400BadRequest, "Sai mật khẩu cũ!");
        }

        public async Task<ResponseObject<ResponsePagination<DTO_User>>> GetListUser(int pageSize, int pageNumber)
        {
            // 1. Tạo Query
            var query = dbContext.users.AsQueryable();

            // 2. Tính toán phân trang
            var totalItems = await query.CountAsync();
            var totalPages = (int)Math.Ceiling((double)totalItems / pageSize);

            // 3. Lấy dữ liệu
            var users = await query
                .Include(x => x.Role)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            // 4. Convert sang DTO
            var userDtos = users.Select(x => converter_Authen.EntityToDTO(x)).ToList();

            // 5. Đóng gói Dữ liệu (Đây là Data)
            var paginationData = new ResponsePagination<DTO_User>
            {
                Items = userDtos,
                CurrentPage = pageNumber,
                PageSize = pageSize,
                TotalItems = totalItems,
                TotalPages = totalPages
            };

            // 6. Trả về Response (Dùng cái Tool đã Inject để bọc Data và Message lại)
            return responsePagination.responseObjectSuccess("Lấy danh sách thành công", paginationData);
        }

        public async Task<ResponseObject<DTO_User>> GetUserById(Guid userId)
        {
            var searchUserId = await dbContext.users.FirstOrDefaultAsync(x => x.Id == userId);
            if (searchUserId == null)
            {
                return responseObject.responseObjectError(StatusCodes.Status404NotFound, "Không tìm thấy người dùng", null);
            }

            var userDto = converter_Authen.EntityToDTO(searchUserId);

            return responseObject.responseObjectSuccess("Tìm người dùng thành công", userDto);
        }

        public async Task<ResponseObject<DTO_User>> DeleteUser(Guid userId)
        {
            // 1. Tìm User
            var user = await dbContext.users.FirstOrDefaultAsync(x => x.Id == userId);

            if (user == null)
            {
                return responseObject.responseObjectError(StatusCodes.Status404NotFound, "Người dùng không tồn tại", null);
            }

            // 2. Xóa sạch các bảng liên quan đến Auth (Token, Device, OTP)
            var tokens = dbContext.refreshTokens.Where(x => x.UserId == userId);
            dbContext.refreshTokens.RemoveRange(tokens);

            var devices = dbContext.userDevices.Where(x => x.UserId == userId);
            dbContext.userDevices.RemoveRange(devices);

            var otps = dbContext.confirmEmails.Where(x => x.UserId == userId);
            dbContext.confirmEmails.RemoveRange(otps);

            // 3. Xóa User
            dbContext.users.Remove(user);

            // 4. Lưu xuống DB
            // Lưu ý: Nếu user còn dính Ví (Wallets) hay Chat -> Dòng này sẽ gây Crash API (Lỗi 500)
            await dbContext.SaveChangesAsync();

            return responseObject.responseObjectSuccess("Xóa thành công người dùng và các thiết bị/token liên quan!", null);
        }

        public async Task<ResponseObject<DTO_User>> UpdateAvatar(Request_UpdateAvatar request)
        {
            var user = await dbContext.users.FirstOrDefaultAsync(x => x.Id == request.Id);
            if (user == null)
            {
                return responseObject.responseObjectError(StatusCodes.Status404NotFound, "Không tìm thấy người dùng", null);
            }

            if (request.UrlAvatar != null)
            {
                //CloudinaryService cloudinaryService = new CloudinaryService();
                //user.UrlAvatar = cloudinaryService.UploadImage(request.UrlAvatar);

                user.UrlAvatar = request.UrlAvatar;
            }

            dbContext.users.Update(user);
            await dbContext.SaveChangesAsync(); 

            var userDto = converter_Authen.EntityToDTO(user);
            return responseObject.responseObjectSuccess("Cập nhật ảnh đại diện thành công!", userDto);
        }

        public async Task<ResponseBase> VerifyResetOtp(Request_VerifyResetOtp request)
        {
            var otp = request.Otp;

            var confirmEmail = await dbContext.confirmEmails.FirstOrDefaultAsync(x => x.Code == otp);
            if (confirmEmail == null)
            {
                return responseBase.ResponseError(StatusCodes.Status400BadRequest, "Mã xác thực cho quên mật khẩu không hợp lệ !");
            }

            if (DateTime.Now > confirmEmail.Expiredtime)
            {
                return responseBase.ResponseError(StatusCodes.Status400BadRequest, "Mã xác thực cho quên mật khẩu đã hết hạn !");
            }

            var user = await dbContext.users.FirstOrDefaultAsync(x => x.Id == confirmEmail.UserId);

            return responseBase.ResponseSuccess($"{user.Id}");
        }

        public async Task<ResponseObject<DTO_Token>> VerifyTwoStep(Request_VerifyTwoStep request)
        {
            var otp = request.Otp;

            var confirmEmail = await dbContext.confirmEmails
                .OrderByDescending(x => x.Starttime)
                .FirstOrDefaultAsync(x => x.Code == otp &&
                (x.Message == "Xác thực 2 bước đăng nhập" ||
                 x.Message == "Xác thực 2 bước đăng nhập (gửi lại)"));

            if (confirmEmail == null)
            {
                return responseObjectToken.responseObjectError(
                    StatusCodes.Status400BadRequest,
                    "Mã xác thực 2 bước không hợp lệ!",
                    null
                );
            }

            if (DateTime.Now > confirmEmail.Expiredtime)
            {
                return responseObjectToken.responseObjectError(
                    StatusCodes.Status400BadRequest,
                    "Mã xác thực 2 bước đã hết hạn!",
                    null
                );
            }

            var user = await dbContext.users.FirstOrDefaultAsync(x => x.Id == confirmEmail.UserId);

            if (user == null)
            {
                return responseObjectToken.responseObjectError(
                    StatusCodes.Status404NotFound,
                    "Không tìm thấy tài khoản!",
                    null
                );
            }

            dbContext.confirmEmails.Remove(confirmEmail);

            var token = await GenerateAccessToken(user);

            // --- THÊM ĐOẠN LOGIC LƯU USER DEVICE VÀO ĐÂY ---
            if (!string.IsNullOrEmpty(request.Fingerprint))
            {
                var device = await dbContext.userDevices
                    .FirstOrDefaultAsync(x => x.UserId == user.Id && x.Fingerprint == request.Fingerprint);

                if (device == null)
                {
                    // Thiết bị mới -> Tạo mới
                    var newDevice = new UserDevice
                    {
                        Id = Guid.NewGuid(),
                        UserId = user.Id,
                        Fingerprint = request.Fingerprint,
                        AccessToken = token.AccessToken,
                        RefreshToken = token.RefreshToken,
                        CreatedAt = DateTime.UtcNow,
                        LastUpdatedAt = DateTime.UtcNow
                    };
                    await dbContext.userDevices.AddAsync(newDevice);
                }
                else
                {
                    // Thiết bị cũ -> Cập nhật Token
                    device.AccessToken = token.AccessToken;
                    device.RefreshToken = token.RefreshToken; // Cập nhật cả RefreshToken nếu cần
                    device.LastUpdatedAt = DateTime.UtcNow;
                    dbContext.userDevices.Update(device);
                }
            }
            // --------------------------------------------------

            // Lưu tất cả thay đổi vào DB (Xóa OTP + Lưu Device)
            await dbContext.SaveChangesAsync();

            return responseObjectToken.responseObjectSuccess(
                "Xác thực 2 bước thành công!",
                token
            );
        }

        public async Task<ResponseBase> ValidateAccountStepOne(Request_ValidateAccountStepOne request)
        {
            if (await dbContext.users.AnyAsync(x => x.UserName == request.UserName))
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

            int emailCount = await dbContext.users.CountAsync(x => x.Email == request.Email);
            if (emailCount >= 1)
            {
                return responseBase.ResponseError(StatusCodes.Status400BadRequest,
                                                "Email đã có quá 1 tài khoản đăng ký. Vui lòng chọn email khác !");
            }
            return responseBase.ResponseSuccess("Thông tin hợp lệ.");
        }

        public async Task<ResponseObject<DTO_Token>> GoogleLogin(Request_GoogleLogin request)
        {
            try
            {
                var googleClientId = configuration["Google:ClientId"];
                var settings = new GoogleJsonWebSignature.ValidationSettings()
                {
                    Audience = new[] { googleClientId }
                };

                // 1. Xác thực idToken với Google (bắt buộc async)
                var payload = await GoogleJsonWebSignature.ValidateAsync(request.IdToken, settings);

                // 2. Tìm user trong DB (dùng async)
                var user = await dbContext.users
                                .Include(u => u.Role) 
                                .FirstOrDefaultAsync(u => u.Email == payload.Email);

                // 3. Nếu User chưa tồn tại -> Tạo mới (dùng async)
                if (user == null)
                {
                    var defaultRole = await dbContext.roles.FirstOrDefaultAsync(r => r.RoleName == "User");
                    if (defaultRole == null)
                    {
                        defaultRole = await dbContext.roles.FindAsync(DefaultRoles.USER_ID);
                        if (defaultRole == null)
                        {
                            return responseObjectToken.responseObjectError(500, "Lỗi hệ thống: Không tìm thấy Role 'User'.", null);
                        }
                    }

                    user = new User
                    {
                        Id = Guid.NewGuid(),
                        Email = payload.Email,
                        FullName = payload.Name,
                        UserName = payload.Email,
                        UrlAvatar = payload.Picture,
                        IsActive = true,
                        CreatedDate = DateTime.UtcNow,
                        RoleId = defaultRole.Id,
                        PassWord = "",
                        PhoneNumber = ""
                    };

                    await dbContext.users.AddAsync(user);
                    await dbContext.SaveChangesAsync();

                    user.Role = defaultRole;
                }

                // 4. Kiểm tra nếu user bị khóa
                if (user.LockoutEnable == true || user.IsActive == false)
                {
                    return responseObjectToken.responseObjectError(StatusCodes.Status403Forbidden, "Tài khoản của bạn đã bị khóa.", null);
                }

                // 5. GỌI HÀM CÓ SẴN CỦA BẠN (SYNC)
                var dtoToken = await GenerateAccessToken(user);

                return responseObjectToken.responseObjectSuccess("Đăng nhập Google thành công.", dtoToken);
            }
            catch (InvalidJwtException)
            {
                return responseObjectToken.responseObjectError(StatusCodes.Status401Unauthorized, "Token không hợp lệ.", null);
            }
            catch (Exception ex)
            {
                return responseObjectToken.responseObjectError(StatusCodes.Status500InternalServerError, $"Lỗi server: {ex.Message}", null);
            }
        }

        public async Task<ResponseObject<DTO_Token>> FacebookLogin(Request_FacebookLogin request)
        {
            try
            {
                // 1. Lấy App ID và App Secret từ config
                var appId = configuration["Facebook:AppId"];
                var appSecret = configuration["Facebook:AppSecret"];

                var client = httpClientFactory.CreateClient();

                // 2. Xác thực User Access Token với Facebook
                var validationUrl = $"https://graph.facebook.com/debug_token?input_token={request.idToken}&access_token={appId}|{appSecret}";
                var validationResponse = await client.GetAsync(validationUrl);

                if (!validationResponse.IsSuccessStatusCode)
                    return responseObjectToken.responseObjectError(401, "Token Facebook không hợp lệ.", null);

                var validationContent = await validationResponse.Content.ReadAsStringAsync();
                using var validationDoc = JsonDocument.Parse(validationContent);
                var validationData = validationDoc.RootElement.GetProperty("data");

                if (!validationData.GetProperty("is_valid").GetBoolean())
                    return responseObjectToken.responseObjectError(401, "Token Facebook không hợp lệ (is_valid = false).", null);

                var userId = validationData.GetProperty("user_id").GetString();

                // 3. Lấy thông tin user từ Facebook (phải có access_token)
                var infoUrl = $"https://graph.facebook.com/{userId}?fields=id,name,email,picture.type(large)&access_token={request.idToken}";
                var infoResponse = await client.GetAsync(infoUrl);

                if (!infoResponse.IsSuccessStatusCode)
                    return responseObjectToken.responseObjectError(400, "Không thể lấy thông tin user từ Facebook.", null);

                var infoContent = await infoResponse.Content.ReadAsStringAsync();
                using var infoDoc = JsonDocument.Parse(infoContent);
                var infoRoot = infoDoc.RootElement;

                // 4. Lấy email, name, picture
                if (!infoRoot.TryGetProperty("email", out var emailElement))
                    return responseObjectToken.responseObjectError(400, "Không thể lấy email từ tài khoản Facebook. Kiểm tra cài đặt bảo mật trên Facebook.", null);

                var email = emailElement.GetString();
                var name = infoRoot.GetProperty("name").GetString();
                var pictureUrl = infoRoot.GetProperty("picture").GetProperty("data").GetProperty("url").GetString();

                // 5. Tìm hoặc tạo user trong DB
                var user = await dbContext.users
                                .Include(u => u.Role)
                                .FirstOrDefaultAsync(u => u.Email == email);

                if (user == null)
                {
                    var defaultRole = await dbContext.roles.FindAsync(DefaultRoles.USER_ID);
                    if (defaultRole == null)
                        return responseObjectToken.responseObjectError(500, "Lỗi hệ thống: Không tìm thấy Role 'User'.", null);

                    user = new User
                    {
                        Id = Guid.NewGuid(),
                        Email = email,
                        FullName = name,
                        UserName = email,
                        UrlAvatar = pictureUrl,
                        IsActive = true,
                        CreatedDate = DateTime.UtcNow,
                        RoleId = defaultRole.Id,
                        PassWord = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString("N")),
                        PhoneNumber = "N/A"
                    };

                    await dbContext.users.AddAsync(user);
                    await dbContext.SaveChangesAsync();
                    user.Role = defaultRole;
                }

                // 6. Kiểm tra khóa tài khoản
                if (user.LockoutEnable == true || user.IsActive == false)
                    return responseObjectToken.responseObjectError(403, "Tài khoản của bạn đã bị khóa.", null);

                // 7. Tạo token hệ thống
                var dtoToken = await GenerateAccessToken(user);
                return responseObjectToken.responseObjectSuccess("Đăng nhập Facebook thành công.", dtoToken);
            }
            catch (Exception ex)
            {
                return responseObjectToken.responseObjectError(500, $"Lỗi server: {ex.Message}", null);
            }
        }

        public async Task<ResponseObject<DTO_User>> ResendOtpForCreateUser(Request_ResendOtp request)
        {
            if (string.IsNullOrWhiteSpace(request.Identifier))
            {
                return responseObject.responseObjectError(StatusCodes.Status400BadRequest, "Giá trị nhập không hợp lệ!", null);
            }
            var identifier = request.Identifier;

            var user = await dbContext.users
                .FirstOrDefaultAsync(x => x.UserName == identifier ||
                                         x.Email == identifier ||
                                         x.PhoneNumber == identifier);

            if (user == null)
            {
                return responseObject.responseObjectError(StatusCodes.Status404NotFound, "Không tìm thấy tài khoản!", null);
            }

            if (user.IsActive == true)
            {
                return responseObject.responseObjectError(StatusCodes.Status400BadRequest, "Tài khoản này đã được kích hoạt.", null);
            }

            var oldCodes = dbContext.confirmEmails.Where(x => x.UserId == user.Id);
            if (oldCodes.Any())
            {
                dbContext.confirmEmails.RemoveRange(oldCodes);
            }

            Random r = new Random();
            int code = r.Next(100000, 999999);

            var emailTo = new EmailTo();
            emailTo.Mail = user.Email;
            emailTo.Subject = "Xác thực tài khoản";
            emailTo.Content = $"Mã xác thực tài khoản của bạn là: {code}. Mã của bạn sẽ hết hạn sau 2 phút !";
            emailTo.SendEmailAsync(emailTo);

            var confirmEmail = new ConfirmEmail();
            confirmEmail.Code = code.ToString();
            confirmEmail.Message = "Xác thực tài khoản (gửi lại)";
            confirmEmail.Starttime = DateTime.Now;
            confirmEmail.Expiredtime = DateTime.Now.AddMinutes(2);
            confirmEmail.UserId = user.Id;

            await dbContext.confirmEmails.AddAsync(confirmEmail);

            await dbContext.SaveChangesAsync();

            return responseObject.responseObjectSuccess(
                "Đã gửi lại mã xác thực. Vui lòng kiểm tra email của bạn!",
                new DTO_User { Email = user.Email } 
            );
        }

        public async Task<ResponseObject<DTO_User>> ResendOtpForTwoStep(Request_ResendOtp request)
        {
            if (string.IsNullOrWhiteSpace(request.Identifier))
            {
                return responseObject.responseObjectError(StatusCodes.Status400BadRequest, "Giá trị nhập không hợp lệ!", null);
            }
            var identifier = request.Identifier;

            var user = await dbContext.users
                .FirstOrDefaultAsync(x => x.UserName == identifier ||
                                         x.Email == identifier ||
                                         x.PhoneNumber == identifier);

            if (user == null)
            {
                return responseObject.responseObjectError(StatusCodes.Status404NotFound, "Tài khoản không tồn tại!", null);
            }

            if (user.TwoStep != true)
            {
                return responseObject.responseObjectError(StatusCodes.Status400BadRequest, "Tài khoản này không sử dụng xác thực 2 bước.", null);
            }

            var oldCodes = dbContext.confirmEmails.Where(x => x.UserId == user.Id);
            if (oldCodes.Any())
            {
                dbContext.confirmEmails.RemoveRange(oldCodes);
            }

            Random r = new Random();
            int code = r.Next(100000, 999999);

            var emailTo = new EmailTo();
            emailTo.Mail = user.Email;
            emailTo.Subject = "Mã xác thực 2 bước";
            emailTo.Content = $"Mã xác thực đăng nhập của bạn là: {code}. Mã sẽ hết hạn sau 2 phút!";
            emailTo.SendEmailAsync(emailTo);

            var confirmEmail = new ConfirmEmail();
            confirmEmail.Code = code.ToString();
            confirmEmail.Message = "Xác thực 2 bước đăng nhập (gửi lại)";
            confirmEmail.Starttime = DateTime.Now;
            confirmEmail.Expiredtime = DateTime.Now.AddMinutes(2);
            confirmEmail.UserId = user.Id;

            await dbContext.confirmEmails.AddAsync(confirmEmail);

            await dbContext.SaveChangesAsync();

            return responseObject.responseObjectSuccess(
                "Đã gửi lại mã xác thực. Vui lòng kiểm tra email của bạn!",
                new DTO_User { Email = user.Email }
            );
        }

        public async Task<ResponseObject<DTO_User>> GetEmailByIdentifier(Request_GetEmail request)
        {
            if (string.IsNullOrWhiteSpace(request.Identifier))
            {
                return responseObject.responseObjectError(StatusCodes.Status400BadRequest, "Giá trị nhập không hợp lệ!", null);
            }
            var identifier = request.Identifier;
            var user = await dbContext.users
                .FirstOrDefaultAsync(x => x.UserName == identifier ||
                                         x.Email == identifier ||
                                         x.PhoneNumber == identifier);
            if (user == null)
            {
                return responseObject.responseObjectError(StatusCodes.Status404NotFound, "Tài khoản không tồn tại!", null);
            }

            if (user.TwoStep != true)
            {
                return responseObject.responseObjectError(StatusCodes.Status400BadRequest, "Tài khoản này không sử dụng xác thực 2 bước.", null);
            }

            return responseObject.responseObjectSuccess(
                "Email của bạn đã được lấy",
                new DTO_User { Email = user.Email }
            );
        }

        public async Task<ResponseObject<DTO_User>> UpdateUserInfo(Request_UpdateUserInfo request)
        {
            try
            {
                var user = await dbContext.users.FirstOrDefaultAsync(x => x.Id == request.Id);

                if (user == null)
                {
                    return responseObject.responseObjectError(StatusCodes.Status404NotFound, "Không tìm thấy người dùng.", null);
                }

                // --- ĐOẠN NÀY LÀM CHO NÓ GIỐNG DỰ ÁN CŨ ---
                // Fix lỗi do Swagger tự điền "string" trong JSON
                if (request.FullName == "string") request.FullName = null;
                if (request.PhoneNumber == "string") request.PhoneNumber = null;
                if (request.UserName == "string") request.UserName = null;
                // --------------------------------------------

                // Check trùng SDT (An toàn vì "string" đã thành null rồi)
                if (!string.IsNullOrEmpty(request.PhoneNumber) && request.PhoneNumber != user.PhoneNumber)
                {
                    bool isDuplicate = await dbContext.users.AnyAsync(x => x.PhoneNumber == request.PhoneNumber && x.Id != request.Id);
                    if (isDuplicate)
                    {
                        return responseObject.responseObjectError(StatusCodes.Status400BadRequest, "Số điện thoại này đã được sử dụng.", null);
                    }
                }

                // CẬP NHẬT (Logic y hệt dự án cũ)
                user.FullName = request.FullName ?? user.FullName;
                user.PhoneNumber = request.PhoneNumber ?? user.PhoneNumber;
                user.UserName = request.UserName ?? user.UserName;
                user.BirthDay = request.BirthDay ?? user.BirthDay;

                dbContext.users.Update(user);
                await dbContext.SaveChangesAsync();

                var userDto = converter_Authen.EntityToDTO(user);
                return responseObject.responseObjectSuccess("Cập nhật thông tin thành công!", userDto);
            }
            catch (Exception ex)
            {
                return responseObject.responseObjectError(StatusCodes.Status500InternalServerError, $"Lỗi Server: {ex.Message}", null);
            }
        }

        public async Task<ResponseObject<DTO_User>> OnOffTwoStep (Request_OnOffTwoStep request)
        {
            var user = await dbContext.users.FirstOrDefaultAsync(x => x.Id == request.UserId);

            if (user == null)
            {
                return responseObject.responseObjectError(StatusCodes.Status404NotFound, "Không tìm thấy người dùng.", null);
            }

            user.TwoStep = request.IsTwoStep;

            dbContext.users.Update(user);
            await dbContext.SaveChangesAsync();

            var userDto = converter_Authen.EntityToDTO(user);

            string message = request.IsTwoStep ? "Đã bật xác thực 2 bước." : "Đã tắt xác thực 2 bước.";

            return responseObject.responseObjectSuccess(message, userDto);
        }

        public async Task<ResponseObject<ResponsePagination<DTO_User>>> SearchUserByAdmin(Request_SearchUserByAdmin request)
        {
            try
            {
                var query = dbContext.users
                    .Include(x => x.Role) // Bắt buộc có dòng này mới search được theo tên Role
                    .AsQueryable();

                // 1. Lọc Keyword (Giữ nguyên)
                if (!string.IsNullOrWhiteSpace(request.Keyword))
                {
                    var keywords = request.Keyword.Trim().ToLower().Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
                    foreach (var k in keywords)
                    {
                        query = query.Where(x =>
                            x.FullName.ToLower().Contains(k) ||
                            x.UserName.ToLower().Contains(k) ||
                            x.Email.ToLower().Contains(k) ||
                            x.PhoneNumber.Contains(k)
                        );
                    }
                }

                // 2. Lọc Active & Lock (Giữ nguyên - Đã fix lỗi null)
                if (request.IsActive.HasValue)
                {
                    if (request.IsActive.Value == true) query = query.Where(x => x.IsActive == true);
                    else query = query.Where(x => x.IsActive != true);
                }

                if (request.IsLock.HasValue)
                {
                    if (request.IsLock.Value == true) query = query.Where(x => x.LockoutEnable == true);
                    else query = query.Where(x => x.LockoutEnable != true);
                }

                // 3. --- SỬA LẠI LOGIC ROLE NAME ---
                if (!string.IsNullOrWhiteSpace(request.RoleName))
                {
                    string roleSearch = request.RoleName.Trim().ToLower();

                    // Tìm chính xác (hoặc Contains tùy ông)
                    // Ở đây tôi dùng so sánh chính xác nhưng không phân biệt hoa thường
                    query = query.Where(x => x.Role.RoleName.ToLower() == roleSearch);
                }
                // ----------------------------------

                // 4. Phân trang & Trả về (Giữ nguyên)
                var totalItems = await query.CountAsync();
                var totalPages = (int)Math.Ceiling((double)totalItems / request.PageSize);

                var users = await query
                    .OrderByDescending(x => x.CreatedDate)
                    .Skip((request.PageNumber - 1) * request.PageSize)
                    .Take(request.PageSize)
                    .ToListAsync();

                var userDtos = users.Select(x => converter_Authen.EntityToDTO(x)).ToList();

                var paginationData = new ResponsePagination<DTO_User>
                {
                    Items = userDtos,
                    CurrentPage = request.PageNumber,
                    PageSize = request.PageSize,
                    TotalItems = totalItems,
                    TotalPages = totalPages
                };

                if (userDtos.Count == 0)
                {
                    return responsePagination.responseObjectSuccess("Không tìm thấy kết quả nào phù hợp.", paginationData);
                }

                return responsePagination.responseObjectSuccess("Tìm kiếm thành công", paginationData);
            }
            catch (Exception ex)
            {
                return responsePagination.responseObjectError(StatusCodes.Status500InternalServerError, ex.Message, null);
            }
        }

        public async Task<ResponseObject<DTO_User>> UpdateRoleByAdmin(Request_UpdateRoleByAdmin request)
        {
            var user = await dbContext.users.FirstOrDefaultAsync(x => x.Id == request.Id);

            if (user == null)
            {
                return responseObject.responseObjectError(StatusCodes.Status404NotFound, "Người dùng không tồn tại", null);
            }

            if (!string.IsNullOrEmpty(request.RoleName))
            {
                var roleEntity = await dbContext.roles.FirstOrDefaultAsync(r => r.RoleName == request.RoleName);

                if (roleEntity != null)
                {
                    user.RoleId = roleEntity.Id;
                }
                else
                {
                    return responseObject.responseObjectError(StatusCodes.Status400BadRequest, "Quyền hạn không hợp lệ", null);
                }
            }

            dbContext.users.Update(user);
            await dbContext.SaveChangesAsync();

            var userDto = converter_Authen.EntityToDTO(user);

            return responseObject.responseObjectSuccess("Cập nhật thông tin người dùng thành công", userDto);
        }
    }
}