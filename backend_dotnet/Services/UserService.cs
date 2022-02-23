using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Security.Claims;
using AutoMapper;
using System.Linq;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using SU_COIN_BACK_END.Models;
using SU_COIN_BACK_END.SU_COIN_INTERFACE;
using SU_COIN_BACK_END.Response;
using SU_COIN_BACK_END.DTOs;
using SU_COIN_BACK_END.Data;
using SU_COIN_BACK_END.Constants.MessageConstants;
using SU_COIN_BACK_END.Request;

namespace SU_COIN_BACK_END.Services
{
    public class UserService : IUserService
    {
        private readonly IMapper _mapper;
        private readonly DataContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IAuthencticationService _authenticationService;
        private int GetUserId() => int.Parse(_httpContextAccessor.HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier));
        private string GetUsername() => _httpContextAccessor.HttpContext.User.FindFirstValue(ClaimTypes.Name);
        private string GetUserRole() => _httpContextAccessor.HttpContext.User.FindFirstValue(ClaimTypes.Role);
        public UserService(IMapper mapper, DataContext context, IHttpContextAccessor httpContextAccessor, IAuthencticationService authencticationService)
        {
            _mapper = mapper;
            _context = context;
            _httpContextAccessor = httpContextAccessor;
            _authenticationService = authencticationService;
        }

        public async Task<ServiceResponse<string>> DeleteUser()
        {
            ServiceResponse<string> response = new ServiceResponse<string>();
            try{
                User user = await _context.Users.FirstOrDefaultAsync(c => c.Id == GetUserId());
                if(user != null){
                    _context.Remove(user);
                    await _context.SaveChangesAsync();
                    response.Message = "Ok";
                    response.Success = true;
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

        public async Task<ServiceResponse<UserDTO>> GetUser()
        {
            ServiceResponse<UserDTO> response = new ServiceResponse<UserDTO>();
            try
            {
                User user = await _context.Users.FirstOrDefaultAsync(c => c.Id == GetUserId());
                if (user != null)
                {   
                    response.Message = "Ok";
                    response.Success = true;
                    response.Data = _mapper.Map<UserDTO>(user);
                    response.Data.Invitations = await _context.ProjectPermissions.Where(c => c.UserID == GetUserId() && c.IsAccepted == false).ToListAsync();
                }else{
                    response.Success = false;
                    response.Message = MessageConstants.USER_NOT_FOUND;
                }
            }
            catch (Exception e)
            {
                response.Message = e.Message;
                response.Success = false;
            }
            return response;
        }

        public async Task<ServiceResponse<UserDTO>> UpdateUser(UserDTO user)
        {
            ServiceResponse<UserDTO> response = new ServiceResponse<UserDTO>();
            try
            {
                User dbUser = await _context.Users.FirstOrDefaultAsync(c => c.Id == GetUserId());
                if (user != null)
                {   
                    if (await _authenticationService.UserNameExists(user.Username)){
                        response.Success = false;
                        response.Message = MessageConstants.USER_NAME_EXIST;
                        return response;
                    }
                    dbUser.MailAddress = user.MailAddress;
                    dbUser.Name = user.Name;
                    dbUser.Surname = user.Surname;
                    dbUser.Username =user.Username;
                    dbUser.SUNET_ID = user.SUNET_ID;
                    _context.Users.Update(dbUser);
                    await _context.SaveChangesAsync();
                    response.Message = "Ok";
                    response.Success = true;
                    response.Data = _mapper.Map<UserDTO>(dbUser);
                }else{
                    response.Success = false;
                    response.Message = MessageConstants.USER_NOT_FOUND;
                }
            }
            catch (Exception e)
            {
                response.Message = e.Message;
                response.Success = false;
            }
            return response;
        }

        public async Task<ServiceResponse<string>> GivePermissionToProject(ProjectPermissionRequest request)
        {
            ServiceResponse<string> response = new ServiceResponse<string>();
            try{
                ProjectPermission permission = await _context.ProjectPermissions.FirstOrDefaultAsync(c => c.ProjectID == request.ProjectID && c.UserID == GetUserId() && c.Role == "Owner" && c.IsAccepted == true);
                if(permission != null){
                    if(GetUsername() == request.Username){
                        response.Success = false;
                        response.Message = "You cannot give permission to yourself"; 
                        return response;
                    }
                    User user = await _context.Users.FirstOrDefaultAsync(c => c.Username == request.Username);
                    if(user == null){
                        response.Success = false;
                        response.Message = MessageConstants.USER_NOT_FOUND;
                        return response;
                    }
                    if(!_context.ProjectPermissions.Any(c => c.ProjectID == request.ProjectID  && c.UserID == user.Id)){
                        ProjectPermission new_perm = new ProjectPermission{ProjectID=request.ProjectID, UserID= user.Id, Role= request.Role, IsAccepted = false};
                        _context.ProjectPermissions.AddAsync(new_perm);
                        await _context.SaveChangesAsync();
                        response.Success = true;
                        response.Message = String.Format("Invitation to collab in project {0} has been sent",request.ProjectID);
                    }else{
                        response.Success = false;
                        response.Message = "Invitation already exists or accepted";
                    }
                }else{
                    response.Success = false;
                    response.Message = MessageConstants.PROJECT_PERMISSION_MANAGE_DENIED;
                }

            }catch(Exception e){
                response.Success = false;
                response.Message = e.Message;
            }
            return response;
        }

        public async Task<ServiceResponse<string>> EvaluatePendingProjectPermission(ProjectPermissionRequest request)
        {
            ServiceResponse<string> response = new ServiceResponse<string>();
            try{
                ProjectPermission permissions = await _context.ProjectPermissions.FirstOrDefaultAsync(c => c.ProjectID == request.ProjectID && c.UserID == GetUserId() && c.IsAccepted == false);
                if (permissions != null)
                {
                    if(request.IsAccepted == true){
                        permissions.IsAccepted = true;
                        _context.ProjectPermissions.Update(permissions);
                        response.Message = String.Format("Invitation to project {0} accepted", request.ProjectID);
                    }else{
                        _context.ProjectPermissions.Remove(permissions);
                        response.Message = String.Format("Invitation to project {0} rejected", request.ProjectID);
                    }
                    await _context.SaveChangesAsync();
                    response.Success = true;
                }else{
                    response.Success = false;
                    response.Message = MessageConstants.PROJECT_PERMISSION_MANAGE_DENIED;
                }
            }catch(Exception e){
                response.Success = false;
                response.Message = e.Message;
            }
            return response;
        }
    
        public async Task<ServiceResponse<List<UserDTO>>> GetAllUsers(){
            ServiceResponse<List<UserDTO>> response = new ServiceResponse<List<UserDTO>>();
            try{
                if(GetUserRole() != "Admin"){
                    response.Success = false;
                    response.Message = MessageConstants.NOT_AUTHORIZED_TO_ACCESS;
                    return response;
                }
                List<User> users = await _context.Users.ToListAsync();
                if(users != null){
                    response.Data = (users.Select(c => _mapper.Map<UserDTO>(c))).ToList();
                    response.Message = "Ok";
                    response.Success = true;
                }else{
                    response.Message = "No user found";
                    response.Success = false;
                }
            }catch(Exception e){    
                response.Success = false;
                response.Message = e.Message;
            }
            return response;
        }
    
        public async Task<ServiceResponse<string>> RemovePermissionToProject(ProjectPermissionRequest request)
        {
            ServiceResponse<string> response = new ServiceResponse<string>();
            try{
                ProjectPermission permission = await _context.ProjectPermissions.FirstOrDefaultAsync(c => c.ProjectID == request.ProjectID && c.UserID == GetUserId() && c.IsAccepted == true);
                if(permission != null){
                    if(permission.Role == "Owner"){
                        User user = await _context.Users.FirstOrDefaultAsync(c => c.Username == request.Username);
                        if(user == null){
                            response.Success = false;
                            response.Message = MessageConstants.USER_NOT_FOUND;
                            return response;
                        }
                        if(GetUserId() == user.Id){
                            response.Success = false;
                            response.Message = "You cannot remove ownership before you transfer it to someone else."; 
                            return response;
                        }
                        
                        ProjectPermission perm = await _context.ProjectPermissions.FirstOrDefaultAsync(c => c.ProjectID == request.ProjectID && c.UserID == user.Id && c.IsAccepted == true);
                        if(perm != null){
                            _context.ProjectPermissions.Remove(perm);
                            await _context.SaveChangesAsync();
                            response.Success = true;
                            response.Message = String.Format("User {0} removed from collabration in project {1}", request.Username, request.ProjectID);
                        }else{
                            response.Success = false;
                            response.Message = "User does not have permission to remove";
                        }
                    }else{
                        if(GetUsername() != request.Username){
                            response.Success = false;
                            response.Message = "You cannot remove permission of other user without being owner."; 
                            return response;
                        }
                        _context.ProjectPermissions.Remove(permission);
                        await _context.SaveChangesAsync();
                        response.Success = true;
                        response.Message = String.Format("User {0} removed from collabration in project {1}", request.Username, request.ProjectID);
                    }
                   
                }else{
                    response.Success = false;
                    response.Message = MessageConstants.PROJECT_PERMISSION_MANAGE_DENIED;
                }
            }catch(Exception e){
                response.Success = false;
                response.Message = e.Message;
            }
            return response;
        }
    }
}