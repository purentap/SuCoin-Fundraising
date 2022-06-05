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
        private readonly IChainInteractionService _chainInteractionService;
        private readonly IProjectService _projectService;
        
        string[] justInDBRoles = {UserRoleConstants.ADMIN, UserRoleConstants.VIEWER, UserRoleConstants.BASE};

        private int GetUserId() => int.Parse(_httpContextAccessor.HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier));
        private string GetUsername() => _httpContextAccessor.HttpContext.User.FindFirstValue(ClaimTypes.Name);
        private string GetUserRole() => _httpContextAccessor.HttpContext.User.FindFirstValue(ClaimTypes.Role);
        public UserService(IMapper mapper, DataContext context, IHttpContextAccessor httpContextAccessor, 
            IAuthencticationService authencticationService, IChainInteractionService chainInteractionService, 
            IProjectService projectService)
        {
            _mapper = mapper;
            _context = context;
            _httpContextAccessor = httpContextAccessor;
            _authenticationService = authencticationService;
            _chainInteractionService = chainInteractionService;
            _projectService = projectService;
        }

        public async Task<ServiceResponse<string>> DeleteUser()
        {
            ServiceResponse<string> response = new ServiceResponse<string>();
            try
            {
                User? user = await _context.Users.FirstOrDefaultAsync(c => c.Id == GetUserId());

                if (user == null)
                {
                    response.Message = MessageConstants.USER_NOT_FOUND;
                    return response;
                }
                if (GetUserRole() == UserRoleConstants.ADMIN)
                {
                    response.Message = "Admin cannot delete himself/herself.";
                    return response;
                }
                
                bool anyProject = await _projectService.IsUserOwnerInAnyProject();

                if (anyProject)
                {
                    response.Message = "You have some active projects as Owner. In order to delete yourself, first you need to delete these projects or change your role.";
                    return response;
                }
                else
                {
                    _context.Remove(user);
                    await _context.SaveChangesAsync();
                    response.Message = MessageConstants.OK;
                    response.Success = true;
                }
            }
            catch (Exception e)
            {
                response.Message = String.Format(MessageConstants.FAIL_MESSAGE, "delete user", e.Message);
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

                if (user == null)
                {
                    response.Message = MessageConstants.USER_NOT_FOUND;
                    return response;
                }
                
                response.Message = MessageConstants.OK;
                response.Success = true;
                response.Data = _mapper.Map<UserDTO>(user);
                
                response.Data.Invitations = await _context.ProjectPermissions
                .Where(c => c.UserID == userID && !c.IsAccepted)
                .ToListAsync();
            }
            catch (Exception e)
            {
                response.Message = String.Format(MessageConstants.FAIL_MESSAGE, "get user", e.Message);
            }
            return response;
        }

        public async Task<ServiceResponse<UserDTO>> UpdateUser(UserDTO user)
        {
            ServiceResponse<UserDTO> response = new ServiceResponse<UserDTO>();
            try
            {
                if (user == null || user.Name == null || user.Surname == null || user.Address == null || user.MailAddress == null || user.Username == null)
                {
                    response.Message = MessageConstants.INVALID_INPUT;
                    return response;
                }
                    
                User? dbUser = await _context.Users.FirstOrDefaultAsync(c => c.Id == GetUserId());
                if (dbUser == null)
                {
                    response.Message = MessageConstants.USER_NOT_FOUND;
                    return response;
                }
                        
                /* If username is not same with the current one and exists in the database, 
                then we may say that user is trying to get another existing username */
                
                if (user.Username != GetUsername() && await _authenticationService.UserNameExists(user.Username))
                {
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
            catch (Exception e)
            {
                response.Message = String.Format(MessageConstants.FAIL_MESSAGE, "update user", e.Message);
            }
            return response;
        }

        public async Task<ServiceResponse<int>> GivePermissionToProject(ProjectPermissionRequest request)
        {
            ServiceResponse<int> response = new ServiceResponse<int>();
            try
            {
                ProjectPermission? permission = await _context.ProjectPermissions
                    .FirstOrDefaultAsync(c => c.ProjectID == request.ProjectID && c.UserID == GetUserId() 
                    && c.Role == UserPermissionRoleConstants.OWNER && c.IsAccepted);
                        
                if (permission == null)
                {
                    response.Message = MessageConstants.PROJECT_PERMISSION_MANAGE_DENIED;
                    return response;
                }

                if (GetUsername() == request.Username)
                {
                    response.Message = "You cannot give permission to yourself"; 
                    return response;
                }

                User? user = await _context.Users.FirstOrDefaultAsync(c => c.Username == request.Username);

                if (user == null)
                {
                    response.Message = MessageConstants.USER_NOT_FOUND;
                    return response;
                }
                
                if (_context.ProjectPermissions
                    .Any(c => c.ProjectID == request.ProjectID && c.UserID == user.Id)) // Such a projectPermission entity already exists in the database
                    {
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
                        response.Data = new_permission.ID;
                        response.Message = String.Format($"Invitation to collaborate project {request.ProjectID} has been sent");
                }
            }
            catch (Exception e)
            {
                response.Message = String.Format(MessageConstants.FAIL_MESSAGE, "give permission to the project", e.Message);
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
                if (permission == null)
                {
                    response.Message = MessageConstants.PROJECT_PERMISSION_MANAGE_DENIED;
                    return response;
                }
                    
                string reply;
                
                if (request.IsAccepted) // user accepted to join the project
                {
                    permission.IsAccepted = true;
                    _context.ProjectPermissions.Update(permission);
                    reply = "accepted";
                }
                else // user rejected to join the project team. Therefore, remove user's permission for this project
                {
                    _context.ProjectPermissions.Remove(permission);
                    reply = "rejected";
                }

                response.Message = $"Invitation to project {requested_projectID} is {reply}";
                response.Success = true;

                await _context.SaveChangesAsync();
            }
            catch (Exception e)
            {
                response.Message = String.Format(MessageConstants.FAIL_MESSAGE, "evaluate pending projects", e.Message);
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
                    response.Message = MessageConstants.NOT_AUTHORIZED_TO_ACCESS;
                    return response;
                }

                List<User> users = await _context.Users.ToListAsync();

                if (users == null)
                {
                    response.Message = MessageConstants.USER_NOT_FOUND;
                    return response;
                }
                
                response.Data = (users.Select(c => _mapper.Map<UserDTO>(c))).ToList();
                response.Message = MessageConstants.OK;
                response.Success = true;
            } 
            catch (Exception e) 
            {
                response.Message = String.Format(MessageConstants.FAIL_MESSAGE, "get all users", e.Message);
            }
            return response;
        }
    
        public async Task<ServiceResponse<string>> RemovePermissionToProject(ProjectPermissionRequest request)
        {
            ServiceResponse<string> response = new ServiceResponse<string>();
            try
            {
                int loggedIn_userID = GetUserId();
                ProjectPermission? loggedInUser_permission = await _context.ProjectPermissions
                    .FirstOrDefaultAsync(c => c.ProjectID == request.ProjectID && c.UserID == loggedIn_userID && c.IsAccepted);
                
                if (loggedInUser_permission == null) // user is not in the project
                {
                    response.Message = MessageConstants.PROJECT_PERMISSION_MANAGE_DENIED;
                    return response;
                }

                if (loggedInUser_permission.Role == UserPermissionRoleConstants.OWNER)
                {
                    User? removedCollaborator = await _context.Users.FirstOrDefaultAsync(user => user.Username == request.Username);
                        
                    if (removedCollaborator == null) // logged in user does not have any permission for any project
                    {
                        response.Message = MessageConstants.USER_NOT_FOUND;
                        return response;
                    }
                        
                    if (loggedIn_userID == removedCollaborator.Id) // remove yourself
                    {
                        response.Message = "You cannot remove your ownership. In order to remove your ownership, you must delete the project";
                        return response;
                    }
                        
                    ProjectPermission? removedCollaborator_permission = await _context.ProjectPermissions
                        .FirstOrDefaultAsync(c => c.ProjectID == request.ProjectID && c.UserID == removedCollaborator.Id && c.IsAccepted);

                    if (removedCollaborator_permission == null)
                    {
                        response.Message = $"Permission of the {request.Username} for project {request.ProjectID} is not found";
                        return response;
                    }

                    _context.ProjectPermissions.Remove(removedCollaborator_permission);
                    await _context.SaveChangesAsync();
                    response.Success = true;
                    response.Message = $"User {request.Username} is removed from collaboration in project {request.ProjectID}";
                }
                else // Not the owner of the project
                {
                    if (GetUsername() != request.Username) // Trying to remove permission of another person
                    {
                        response.Message = "You cannot remove permission of other user without being owner."; 
                        return response;
                    }
                    
                    /* Remove your own permission */
                    _context.ProjectPermissions.Remove(loggedInUser_permission);
                    await _context.SaveChangesAsync();
                    response.Success = true;
                    response.Message = String.Format($"User {request.Username} removed from collaboration in project {request.ProjectID}");
                }
            }
            catch (Exception e)
            {
                response.Message = String.Format(MessageConstants.FAIL_MESSAGE, "remove permission", e.Message);
            }
            return response;
        }

        public async Task<ServiceResponse<string>> UpdateUserRole(string address, string new_role)
        {
            ServiceResponse<string> response = new ServiceResponse<string>();
            
            if (GetUserRole() != UserRoleConstants.ADMIN)
            {
                response.Message = MessageConstants.NOT_AUTHORIZED_TO_ACCESS;
                return response;
            }

            User? user = _context.Users.FirstOrDefault(user => user.Address == address);
            if (user == null)
            {
                response.Message = MessageConstants.USER_NOT_FOUND;
                return response;
            }

            bool isJustInDB = false;

            foreach (string dbRole in justInDBRoles)
            {
                if (new_role == dbRole)
                {
                    isJustInDB = true;
                    break;
                }
            }
            
            if (isJustInDB)
            {
                if (user.Role == UserRoleConstants.BLACKLIST || user.Role == UserRoleConstants.WHITELIST)
                {
                    response.Message = "You cannot update the roles defined in the chain from the server";
                    return response;
                }

                response = await UpdateRoleJustInDb(address, new_role);

                if (!response.Success)
                {
                    return response;
                }

                _context.Users.Update(user);
                await _context.SaveChangesAsync();
            }
            else // Role is also defined in the chain, so read the updated role from the chain
            {
                try
                {
                    ServiceResponse<string> chainResponse = await _chainInteractionService.GetChainRole(address);
                    if (!chainResponse.Success || chainResponse.Data == null)
                    {
                        response.Message = chainResponse.Message;
                    }
                    else
                    {
                        string oldRole = user.Role;
                        user.Role = chainResponse.Data;
                        string newRole = user.Role;
                        _context.Users.Update(user);
                        await _context.SaveChangesAsync();

                        response.Message = $"User role is switched {oldRole} to {newRole}";
                    }
                }
                catch (Exception e)
                {
                    response.Message = String.Format(MessageConstants.FAIL_MESSAGE, "change role", e.Message);
                }
            }
            return response;
        }

        public async Task<ServiceResponse<string>> UpdateRoleJustInDb(string address, string new_role)
        {
            ServiceResponse<string> response = new ServiceResponse<string>();
            User? user = await _context.Users.FirstOrDefaultAsync(user => user.Address == address);
            
            if (user == null) // for security reasons
            {
                response.Message = MessageConstants.USER_NOT_FOUND;
                return response;
            }
            else
            {
                user.Role = new_role;    
                response.Success = true;
                response.Message = MessageConstants.OK;
                response.Data = $"User role is switched {user.Role} to {new_role}";
            }

            return response;
        }

    }
}