using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Http;
using SU_COIN_BACK_END.Models;
using SU_COIN_BACK_END.DTOs;
using SU_COIN_BACK_END.SU_COIN_INTERFACE;
using SU_COIN_BACK_END.Response;
using SU_COIN_BACK_END.Request;
using SU_COIN_BACK_END.Constants.MessageConstants;
using Nethereum.Web3;
using Nethereum.Util;
using Nethereum.Signer;
using AutoMapper;
using SU_COIN_BACK_END.Data;
using System.Security.Cryptography;

namespace SU_COIN_BACK_END.Services
{
    public class AuthenticationService : IAuthencticationService
    {
        private readonly IMapper _mapper;
        private readonly DataContext _context;
        private readonly IConfiguration _configuration;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IChainInteractionService _chainInteractionService;
        private int GetUserId() => int.Parse(_httpContextAccessor.HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier));
        public AuthenticationService(IMapper mapper, DataContext dataContext, IHttpContextAccessor httpContextAccessor, IConfiguration configuration, IChainInteractionService chainInteractionService)
        {
            _mapper = mapper;
            _context = dataContext;
            _httpContextAccessor = httpContextAccessor;
            _configuration = configuration;
            _chainInteractionService = chainInteractionService;
        }

        public async Task<ServiceResponse<int>> GetNonce(string address)
        {
            ServiceResponse<int> response = new ServiceResponse<int>();
            try{
                User user = await _context.Users.FirstOrDefaultAsync(c => c.Address == address);
                if(user == null){
                    response.Success = false;
                    response.Message = MessageConstants.USER_NOT_FOUND;
                    return response;
                }
                RNGCryptoServiceProvider csp = new RNGCryptoServiceProvider();
                byte[] randomNumber = new byte[32];
                csp.GetBytes(randomNumber);
                if (BitConverter.IsLittleEndian){
                    Array.Reverse(randomNumber);
                }
                int i = Math.Abs(BitConverter.ToInt32(randomNumber, 0));
                Console.WriteLine("int: {0}", i);
                user.Nonce = i;
                _context.Users.Update(user);
                await _context.SaveChangesAsync();
                response.Success = true;
                response.Message = "Ok";
                response.Data = i;
            }catch(Exception e){
                response.Success = false;
                response.Message = e.Message;      
            }
            return response;
        }

        public async Task<ServiceResponse<string>> Login(UserLoginRequest request)
        {   
            ServiceResponse<string> response = new ServiceResponse<string>();
            try{  
                User user = await _context.Users.FirstOrDefaultAsync(c => c.Address == request.Address);
                if (user != null)
                {   if(user.Nonce != null){
                        var signer = new EthereumMessageSigner();
                        var addressRec = signer.EncodeUTF8AndEcRecover("LOGIN: "+ user.Nonce.ToString(), request.SignedMessage);
                        if(request.Address == addressRec){
                            response.Success = true;
                            response.Message = MessageConstants.USER_LOGIN_SUCCES;
                            bool isWhitelisted = await _chainInteractionService.IsWhiteListed(user.Address);
                            if(user.Role != "Whitelist" && isWhitelisted && user.Role != "Admin"){
                                user.Role = "Whitelist";
                            }else if(user.Role == "Whitelist" && !isWhitelisted && user.Role != "Admin"){
                                user.Role = "Base";
                            }
                            response.Data = GenerateToken(user);
                            user.Nonce = null;
                            _context.Users.Update(user);
                            await _context.SaveChangesAsync();
                        }else{
                            response.Success = false;
                            response.Message = String.Format(MessageConstants.SIGNATURE_REJECTED, request.Address);
                        }  
                    }else{
                        response.Success = false;
                        response.Message = MessageConstants.NONCE_NOT_FOUND;
                    }
                }else{
                    response.Success = false;
                    response.Message = MessageConstants.USER_NOT_FOUND;
                }
            }catch(Exception e){
                response.Success = false;
                response.Message = e.Message;
            }
            return response;
        }

        public async Task<ServiceResponse<string>> Register(UserRegisterRequest request)
        {
            ServiceResponse<string> response = new ServiceResponse<string>();
            try{
                var signer = new EthereumMessageSigner();
                var addressRec = signer.EncodeUTF8AndEcRecover("REGISTER", request.SignedMessage);
                if (await UserExists(addressRec))
                {
                    response.Success = false;
                    response.Message = MessageConstants.USER_EXIST;
                    return response;
                }
                if (await UserNameExists(request.Username))
                {
                    response.Success = false;
                    response.Message = MessageConstants.USER_NAME_EXIST;
                    return response;
                }
                User user = new User{Name=request.Name,Surname= request.Surname,Username= request.Username, 
                    MailAddress=request.MailAddress, Address = addressRec};

                    await _context.Users.AddAsync(user);
                    await _context.SaveChangesAsync();
                response.Message = MessageConstants.USER_REGISTER_SUCCESS;
                response.Success  =true;
            }catch(Exception e){
                response.Success = false;
                response.Message = e.Message;
            }
            return response;
        }
        public async Task<bool> UserExists(string address)
        {
            if (await _context.Users.AnyAsync(x => x.Address == address))
            {
                return true;
            }
            return false;
        }

        public async Task<bool> UserNameExists(string username)
        {
            if (await _context.Users.AnyAsync(x => x.Username == username))
            {
                return true;
            }
            return false;
        }
        private string GenerateToken(User user){

           List<Claim> claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Role, user.Role),
                new Claim(ClaimTypes.Surname, user.Address)
            };

            SymmetricSecurityKey key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(_configuration.GetSection("AppSettings:Token").Value)
            );

            SigningCredentials creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512Signature);

            SecurityTokenDescriptor tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.Now.AddHours(2),
                SigningCredentials = creds
            };

            JwtSecurityTokenHandler tokenHandler = new JwtSecurityTokenHandler();
            SecurityToken token = tokenHandler.CreateToken(tokenDescriptor);

            return tokenHandler.WriteToken(token);
        }
    }
}