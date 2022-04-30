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
using SU_COIN_BACK_END.Constants.UserPermissionRoleConstants;
using SU_COIN_BACK_END.Constants.UserRoleConstants;
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
            try
            {
                User? user = await _context.Users.FirstOrDefaultAsync(c => c.Id == GetUserId());

                if (user != null)
                {
                    _context.Remove(user);
                    await _context.SaveChangesAsync();
                    response.Message = MessageConstants.OK;
                    response.Success = true;
                }
                else
                {
                    response.Success = false;
                    response.Message = MessageConstants.USER_NOT_FOUND;
                }
            }
            catch (Exception e)
            {
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
                int userID = GetUserId();
                User? user = await _context.Users.FirstOrDefaultAsync(c => c.Id == userID);

                if (user != null)
                {   
                    response.Message = MessageConstants.OK;
                    response.Success = true;
                    response.Data = _mapper.Map<UserDTO>(user);
                    response.Data.Invitations = await _context.ProjectPermissions
                        .Where(c => c.UserID == userID && !c.IsAccepted)
                        .ToListAsync();
                }
                else
                {
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
                User? dbUser = await _context.Users.FirstOrDefaultAsync(c => c.Id == GetUserId());
                if (user != null)
                {   
                    if (await _authenticationService.UserNameExists(user.Username))
                    {
                        response.Success = false;
                        response.Message = MessageConstants.USER_NAME_EXIST;
                        return response;
                    }

                    /* Update properties */
                    dbUser.MailAddress = user.MailAddress;
                    dbUser.Name = user.Name;
                    dbUser.Surname = user.Surname;
                    dbUser.Username = user.Username;

                    _context.Users.Update(dbUser);
                    await _context.SaveChangesAsync();
                    response.Message = MessageConstants.OK;
                    response.Success = true;
                    response.Data = _mapper.Map<UserDTO>(dbUser);
                }
                else 
                {
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
            try
            {
                ProjectPermission? permission = await _context.ProjectPermissions
                    .FirstOrDefaultAsync(c => c.ProjectID == request.ProjectID && c.UserID == GetUserId() 
                        && c.Role == UserPermissionRoleConstants.OWNER && c.IsAccepted);
                        
                if (permission != null)
                {
                    if (GetUsername() == request.Username)
                    {
                        response.Success = false;
                        response.Message = "You cannot give permission to yourself"; 
                        return response;
                    }

                    User? user = await _context.Users.FirstOrDefaultAsync(c => c.Username == request.Username);

                    if (user == null)
                    {
                        response.Success = false;
                        response.Message = MessageConstants.USER_NOT_FOUND;
                        return response;
                    }
                    else if (_context.ProjectPermissions
                            .Any(c => c.ProjectID == request.ProjectID && c.UserID == user.Id)) // Such a projectPermission entity already exists in the database
                    {
                        response.Success = false;
                        response.Message = "Invitation already exists or accepted";
                    }
                    else 
                    {
                        ProjectPermission new_permission = new ProjectPermission
                        {
                            ProjectID = request.ProjectID,
                            UserID = user.Id,
                            Role = request.Role,
                            IsAccepted = false
                        };

                        _context.ProjectPermissions.AddAsync(new_permission);
                        await _context.SaveChangesAsync();

                        response.Success = true;
                        response.Message = String.Format($"Invitation to collaborate project {request.ProjectID} has been sent");
                    }
                }
                else
                {
                    response.Success = false;
                    response.Message = MessageConstants.PROJECT_PERMISSION_MANAGE_DENIED;
                }

            }
            catch (Exception e)
            {
                response.Success = false;
                response.Message = e.Message;
            }
            return response;
        }

        public async Task<ServiceResponse<string>> EvaluatePendingProjectPermission(ProjectPermissionRequest request)
        {
            ServiceResponse<string> response = new ServiceResponse<string>();
            try
            {
                /* Retrieve pending permission entity for user&project pair from database. Then include the current user in the related project based on the current user's response. */
                int requested_projectID = request.ProjectID;
                ProjectPermission? permission = await _context.ProjectPermissions
                .FirstOrDefaultAsync(c => c.ProjectID == requested_projectID && c.UserID == GetUserId() && !c.IsAccepted); // pending permissions

                /* Default value for IsAccepted is false. If the user accepted the invitation, change its value of IsAccepted property as true. */
                if (permission != null)
                {
                    if (request.IsAccepted) // user accepted to join the project
                    {
                        permission.IsAccepted = true;
                        _context.ProjectPermissions.Update(permission);
                        response.Message = String.Format($"Invitation to project {requested_projectID} is accepted");
                    }
                    else // user rejected to join the project team. Therefore, remove user's permission for this project
                    {
                        _context.ProjectPermissions.Remove(permission);
                        response.Message = String.Format($"Invitation to project {requested_projectID} is rejected");
                    }
                    await _context.SaveChangesAsync();
                    response.Success = true;
                }
                else
                {
                    response.Success = false;
                    response.Message = MessageConstants.PROJECT_PERMISSION_MANAGE_DENIED;
                }
            }
            catch (Exception e)
            {
                response.Success = false;
                response.Message = e.Message;
            }
            return response;
        }
    
        public async Task<ServiceResponse<List<UserDTO>>> GetAllUsers()
        {
            ServiceResponse<List<UserDTO>> response = new ServiceResponse<List<UserDTO>>();
            try
            {
                if (GetUserRole() != UserRoleConstants.ADMIN)
                {
                    response.Success = false;
                    response.Message = MessageConstants.NOT_AUTHORIZED_TO_ACCESS;
                    return response;
                }

                List<User> users = await _context.Users.ToListAsync();

                if (users != null)
                {
                    response.Data = (users.Select(c => _mapper.Map<UserDTO>(c))).ToList();
                    response.Message = MessageConstants.OK;
                    response.Success = true;
                }
                else 
                {
                    response.Message = MessageConstants.USER_NOT_FOUND;
                    response.Success = false;
                }
            } catch (Exception e) {    
                response.Success = false;
                response.Message = e.Message;
            }
            return response;
        }
    
        public async Task<ServiceResponse<string>> RemovePermissionToProject(ProjectPermissionRequest request)
        {
            ServiceResponse<string> response = new ServiceResponse<string>();
            try
            {
                int loggedIn_userID = GetUserId();
                ProjectPermission? permission = await _context.ProjectPermissions
                    .FirstOrDefaultAsync(c => c.ProjectID == request.ProjectID && c.UserID == loggedIn_userID && c.IsAccepted);
                
                if (permission != null)
                {
                    if (permission.Role == UserPermissionRoleConstants.OWNER)
                    {
                        User? user = await _context.Users.FirstOrDefaultAsync(c => c.Username == request.Username);
                        
                        if (user == null) 
                        {
                            response.Success = false;
                            response.Message = MessageConstants.USER_NOT_FOUND;
                            return response;
                        }
                        else if (loggedIn_userID == user.Id) // remove yourself
                        {
                            response.Success = false;
                            response.Message = "You cannot remove ownership before you transfer it to someone else."; 
                            return response;
                        }
                        
                        ProjectPermission? perm = await _context.ProjectPermissions
                            .FirstOrDefaultAsync(c => c.ProjectID == request.ProjectID && c.UserID == user.Id && c.IsAccepted);

                        if (perm != null)
                        {
                            _context.ProjectPermissions.Remove(perm);
                            await _context.SaveChangesAsync();
                            response.Success = true;
                            response.Message = String.Format($"User {request.Username} removed from collabration in project {request.ProjectID}");
                        }
                        else
                        {
                            response.Success = false;
                            response.Message = "User does not have permission to remove";
                        }
                    }
                    else // Not the owner of the project
                    {
                        if (GetUsername() != request.Username) // Trying to remove permission of another person
                        {
                            response.Success = false;
                            response.Message = "You cannot remove permission of other user without being owner."; 
                            return response;
                        }
                        /* Remove your own permission */
                        _context.ProjectPermissions.Remove(permission);
                        await _context.SaveChangesAsync();
                        response.Success = true;
                        response.Message = String.Format($"User {request.Username} removed from collaboration in project {request.ProjectID}");
                    }
                }
                else // logged in user does not have any permission for any project
                {
                    response.Success = false;
                    response.Message = MessageConstants.PROJECT_PERMISSION_MANAGE_DENIED;
                }
            }
            catch (Exception e)
            {
                response.Success = false;
                response.Message = e.Message;
            }
            return response;
        }
    }
}