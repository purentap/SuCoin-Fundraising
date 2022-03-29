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
using SU_COIN_BACK_END.Constants.ProjectStatusConstants;
using System.Text;
using Nethereum.Web3;
using Nethereum.ABI.FunctionEncoding.Attributes;
using Nethereum.Contracts.CQS;
using Nethereum.Util;
using Nethereum.Web3.Accounts;
using Nethereum.Hex.HexConvertors.Extensions;
using Nethereum.Contracts;
using Nethereum.Contracts.Extensions;
using System.Numerics;
using System.Security.Cryptography;

namespace SU_COIN_BACK_END.Services {

    public class ProjectService : IProjectService
    {
        private readonly IMapper _mapper;
        private readonly DataContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IChainInteractionService _chainInteractionService;
        public ProjectService(IMapper mapper, DataContext context, IHttpContextAccessor httpContextAccessor, IChainInteractionService chainInteractionService)
        {
            _mapper = mapper;
            _context = context;
            _httpContextAccessor = httpContextAccessor;
            _chainInteractionService = chainInteractionService;
        }
        private int GetUserId() => int.Parse(_httpContextAccessor.HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier));
        private string GetUsername() => _httpContextAccessor.HttpContext.User.FindFirstValue(ClaimTypes.Name);
        private string GetUserRole() => _httpContextAccessor.HttpContext.User.FindFirstValue(ClaimTypes.Role);
        private string GetUserAddress() => (_httpContextAccessor.HttpContext.User.FindFirstValue(ClaimTypes.Surname));
       
        public async Task<ServiceResponse<string>> AddProject(ProjectDTO project)
        {
            ServiceResponse<string> response = new ServiceResponse<string>();
            try
            {
                if (await ProjectNameExists(project.ProjectName))
                {
                    response.Success = false;
                    response.Message = "Project name already exists please choose another name";
                    return response;
                }
                else if (!await IsProjectSubmittedToChain(project.fileHex))
                {
                    response.Success = false;
                    response.Message = MessageConstants.PROJECT_NOT_SUBMITTED_TO_CHAIN;
                    return response;
                }

                /* Project has not been created in the database. Create the new project */
                Project new_project = _mapper.Map<Project>(project);
                new_project.FileHex = project.fileHex;
                new_project.Date = DateTime.Now;
                new_project.IsApproved = false;
                new_project.Status = ProjectStatusConstants.PENDING;
                new_project.MarkDown = "";
                new_project.Rating = 0;
                new_project.ProposerAddress = GetUserAddress();

                await _context.Projects.AddAsync(new_project);
                await _context.SaveChangesAsync();

                /* For security reasons, we need to recheck the database and then assign the permission */
                Project dbProject = await _context.Projects.FirstOrDefaultAsync(c => c.ProjectName == project.ProjectName);

                if (dbProject != null)
                {
                    ProjectPermission permission = new ProjectPermission
                    {
                        ProjectID = dbProject.ProjectID, 
                        UserID = GetUserId(), 
                        //Role = "Owner", 
                        Role = UserPermissionRoleConstants.OWNER,
                        IsAccepted = true 
                    };
                    await _context.ProjectPermissions.AddAsync(permission);
                    await _context.SaveChangesAsync();
                }
                response.Data = "Ok";
                response.Message = MessageConstants.PROJECT_ADD_SUCCESS;
                response.Success = true;
            }
            catch (Exception e)
            {
                response.Success = false;
                response.Message = MessageConstants.PROJECT_ADD_FAIL + "\nException message: " + e.Message;
                return response;
            }
            return response;
        }

        public async Task<ServiceResponse<bool>> DeleteProject(int ID) //If auction started aviod deleting
        {
            ServiceResponse<bool> response = new ServiceResponse<bool>();
            try
            {
                if (!await HasOwnerPermission(ID)) // owner does not allow you to delete the project
                {
                    response.Success = false;
                    response.Message = MessageConstants.PROJECT_PERMISSION_MANAGE_DENIED;
                    return response;
                }

                /* For security reasons, we need to recheck the database and then delete the project */
                Project project = await _context.Projects.FirstOrDefaultAsync(c => c.ProjectID == ID);

                if (project != null)
                {
                    _context.ProjectPermissions.RemoveRange(_context.ProjectPermissions.Where(c => c.ProjectID == ID));
                    _context.Remove(project);
                    await _context.SaveChangesAsync();
                    response.Message = "Ok";
                    response.Data = true;
                    response.Success = true;
                }
                else
                {
                    response.Message = MessageConstants.PROJECT_NOT_FOUND;
                    response.Success = false;
                }
            }
            catch (Exception e)
            {
                response.Success = false;
                response.Message = MessageConstants.PROJECT_DELETE_FAIL + "\nException message: " + e.Message;
            }
            return response;
        }

        public async Task<ServiceResponse<List<ProjectDTO>>> GetAllProjects()
        {
            ServiceResponse<List<ProjectDTO>> response = new ServiceResponse<List<ProjectDTO>>();
            try
            {
                string userRole = GetUserRole();
                Console.WriteLine("User role:" , userRole);
                List<Project> projects = new List<Project>();

                if (userRole == UserRoleConstants.ADMIN || userRole == UserRoleConstants.WHITELIST)
                {
                    projects = await _context.Projects.ToListAsync();
                }
                else
                {
                    projects = await _context.Projects.Where(c => c.Status == ProjectStatusConstants.APPROVED).ToListAsync();
                }
                
                /* If there is any project, send the project data to the mapper */
                if (projects != null)
                {
                    response.Data = (projects.Select(c => _mapper.Map<ProjectDTO>(c))).ToList(); // map projects to projectDTOs
                    response.Message = "Ok";
                    response.Success = true;
                }
                else
                {
                    response.Message = "No project found!";
                    response.Success = false;
                }
            }
            catch (Exception e)
            {
                response.Message = e.Message;
                response.Success = false;
            }
            return response;
        }

        public async Task<ServiceResponse<ProjectDTO>> GetProjectById(int ID)
        {
            ServiceResponse<ProjectDTO> response = new ServiceResponse<ProjectDTO>();
            try
            {
                Project project = await _context.Projects.FirstOrDefaultAsync(c => c.ProjectID == ID);
                if (project != null)
                {
                    string userRole = GetUserRole();
                    //if(GetUserRole() == "Admin" || GetUserRole() == "Whitelist" || project.Status == "Approved"){
                    if (userRole == UserRoleConstants.ADMIN || userRole == UserRoleConstants.WHITELIST || project.Status == ProjectStatusConstants.APPROVED) 
                    {
                        response.Data = _mapper.Map<ProjectDTO>(project);
                        response.Message = "Ok";
                        response.Success = true;
                    }
                    else
                    {
                        response.Success = false;
                        response.Message = "You are not authorized to access resources";
                    }
                }
                else 
                {
                    response.Success = false;
                    response.Message = MessageConstants.PROJECT_NOT_FOUND;
                }
            }
            catch (Exception e) // Error occurred while retrieving the project from the database
            {
                response.Message = e.Message;
                response.Success = false;
            }
            return response;
        }

        public async Task<ServiceResponse<ProjectDTO>> RateProject(int projectID, double rating_value)
        {
            ServiceResponse<ProjectDTO> response = new ServiceResponse<ProjectDTO>();
            try
            {
                if (rating_value < 0 || rating_value > 10) // rating is invalid
                {
                    response.Success = false;
                    response.Message = "Rating input is invalid, it should be in [0,10]";
                }

                Project project = await _context.Projects.FirstOrDefaultAsync(c => c.ProjectID == projectID);

                if (project != null)
                {
                    int userID = GetUserId();
                    Ratings rating = await _context.Ratings.FirstOrDefaultAsync(
                                        c => c.UserID == userID && c.ProjectID == projectID);

                    if (rating != null)
                    {
                        rating.Rate = rating_value;
                        _context.Ratings.Update(rating);
                    }
                    else
                    {
                        Ratings new_rating = new Ratings 
                        {
                            UserID = userID, 
                            ProjectID = projectID, 
                            Rate = rating_value 
                        };
                        await _context.Ratings.AddAsync(new_rating);
                    }

                    await _context.SaveChangesAsync();
                    project.Rating = _context.Ratings.Where(c => c.ProjectID == projectID).Average(x => x.Rate);
                    _context.Update(project);
                    await _context.SaveChangesAsync();
                    response.Success = true;
                    response.Message = "Ok";
                    response.Data = _mapper.Map<ProjectDTO>(project);
                } 
                else
                {
                    response.Success = false;
                    response.Message = MessageConstants.PROJECT_NOT_FOUND;
                }
            }
            catch (Exception e)
            {
                response.Success = false;
                response.Message = e.Message;
            }
            return response;
        }

        public async Task<ServiceResponse<ProjectDTO>> UpdateProject(ProjectDTO project)
        {
            ServiceResponse<ProjectDTO> response = new ServiceResponse<ProjectDTO>();
            try
            {
                if (!await HasPermission(project.ProjectID))
                {
                    response.Success = false;
                    response.Message = MessageConstants.PROJECT_PERMISSION_MANAGE_DENIED;
                    return response;
                }
                if (await ProjectNameExists(project.ProjectName))
                {
                    response.Success = false;
                    response.Message = "Project name already exists please choose another name";
                    return response;
                }
                Project dbProject = await _context.Projects.FirstOrDefaultAsync(c => c.ProjectID == project.ProjectID);
                if (dbProject != null) // project is in database
                {
                    dbProject.ProjectName = project.ProjectName;
                    dbProject.ProjectDescription = project.ProjectDescription;
                    dbProject.ImageUrl = project.ImageUrl;
                    _context.Projects.Update(dbProject);
                    await _context.SaveChangesAsync();
                    response.Data = _mapper.Map<ProjectDTO>(dbProject);
                    response.Success = true;
                    response.Message = "Ok" ;              
                }
                else
                {
                    response.Message = MessageConstants.PROJECT_NOT_FOUND;
                    response.Success = false;
                }
            }
            catch (Exception e)
            {
                response.Message = e.Message;
                response.Success = false;
            }
            return response;
        }

        public async Task<ServiceResponse<byte[]>> GetProjectPdfById(int projectID)
        {
            ServiceResponse<byte[]> response = new ServiceResponse<byte[]>();
            try
            {
                Project project = await _context.Projects.FirstOrDefaultAsync(c => c.ProjectID == projectID);
                if (project != null) // project exists
                {
                    string userRole = GetUserRole();
                    if (project.Status != ProjectStatusConstants.APPROVED && userRole == UserRoleConstants.BASE)
                    {
                        response.Message = MessageConstants.NOT_AUTHORIZED_TO_ACCESS;
                        response.Success = false;
                    }
                    else
                    {
                        response.Data = Convert.FromHexString(project.FileHex);
                        response.Message = "Ok";
                        response.Success = true;
                    }
                }
                else
                {
                    response.Message = MessageConstants.PROJECT_NOT_FOUND;
                    response.Success = false;
                }
            } 
            catch (Exception e)
            {
                response.Message = e.Message;
                response.Success = false;
            }
            return response;
        }
        
        public async Task<ServiceResponse<List<ProjectDTO>>> GetProjectsByStatus(string status)
        {
            ServiceResponse<List<ProjectDTO>> response = new ServiceResponse<List<ProjectDTO>>();
            try
            {
                List<Project> projects = new List<Project>();
                string userRole = GetUserRole();
                
                if (userRole == UserRoleConstants.ADMIN || userRole == UserRoleConstants.WHITELIST)
                {
                    projects = await _context.Projects.Where(c => c.Status == status).ToListAsync();
                }
                else
                {
                    projects = await _context.Projects.Where(c => c.Status == ProjectStatusConstants.APPROVED).ToListAsync();
                }
                
                if (projects != null)
                {
                    response.Data = (projects.Select(c => _mapper.Map<ProjectDTO>(c))).ToList();
                    response.Message = "Ok";
                    response.Success = true;
                }
                else
                {
                    response.Message = "No project found!";
                    response.Success = false;
                }
            }
            catch (Exception e)
            {
                response.Message = e.Message;
                response.Success = false;
            }
            return response;
        }

        public async Task<ServiceResponse<ProjectDTO>> ChangeStatus(int id) 
        {
            ServiceResponse<ProjectDTO> response = new ServiceResponse<ProjectDTO>();
            try
            {
                Project project = await _context.Projects.FirstOrDefaultAsync(c => c.ProjectID == id);
                if (project != null)
                {
                    ServiceResponse<List<EventLog<ProjectEvaluationEventDTO>>> response_chain = await _chainInteractionService.GetProjectEvaluationEventLogs();
                    if (!response_chain.Success)
                    {
                        response.Success = false;
                        response.Message = "Error occured interacting with chain";
                        return response;
                    }

                    SHA256 sha256 = SHA256.Create();
                    byte[] hashval = sha256.ComputeHash(Encoding.ASCII.GetBytes(project.FileHex));
                    StringBuilder sb = new StringBuilder();

                    foreach (byte b in hashval)
                    {
                        sb.Append(b.ToString("x2"));
                    }

                    String hash_Str = sb.ToString();
                    string status = ProjectStatusConstants.PENDING;

                    for (int i = 0; i < response_chain.Data.Count; i++)
                    {   
                        bool isValidHash = ((response_chain.Data[i].Log.Topics[1]).ToString() == ("0x"+ hash_Str).ToString());
                        bool isProjectApproved = response_chain.Data[i].Event.isApproved;
                        
                        if (isValidHash)
                        {
                            if (isProjectApproved) 
                            {
                                status = ProjectStatusConstants.APPROVED;
                            }
                            else
                            {
                                status = ProjectStatusConstants.REJECTED;
                            }
                            break;
                        }
                    }

                    var previous_status = project.Status;
                    project.Status = status;
                    _context.Projects.Update(project);
                    await _context.SaveChangesAsync();

                    response.Success = true;
                    response.Message = "Status changed from " + previous_status + " to " +  status + ".";
                    response.Data = _mapper.Map<ProjectDTO>(project);
                }
                else
                {
                    response.Success = false;
                    response.Message = MessageConstants.PROJECT_NOT_FOUND;
                }
            }
            catch (Exception e)
            {
                response.Message = e.Message;
                response.Success = false;
            }
            return response;
        }
        public async Task<ServiceResponse<ProjectDTO>> UpdateMarkDown(int projectID, string markdown)
        {
            ServiceResponse<ProjectDTO> response = new ServiceResponse<ProjectDTO>();
            try
            {
                if (!await HasPermission(projectID)) 
                {
                    response.Success = false;
                    response.Message = MessageConstants.PROJECT_PERMISSION_MANAGE_DENIED;
                    return response;
                }

                Project dbProject = await _context.Projects.FirstOrDefaultAsync(c => c.ProjectID == projectID);

                if (dbProject != null)
                {
                    dbProject.MarkDown = markdown;
                    _context.Update(dbProject);
                    await _context.SaveChangesAsync();
                    response.Data = _mapper.Map<ProjectDTO>(dbProject);
                    response.Success = true;
                    response.Message = "Ok";
                }
                else
                {
                    response.Message = MessageConstants.PROJECT_NOT_FOUND;
                    response.Success = false;
                }
            }
            catch (Exception e)
            {
                response.Message = e.Message;
                response.Success = false;
            }
            return response;
        }
    
        public async Task<ServiceResponse<List<ProjectDTO>>> GetAllPermissionedProjects()
        {
            ServiceResponse<List<ProjectDTO>> response = new ServiceResponse<List<ProjectDTO>>();
            try
            {
                List<ProjectPermission> projects = await _context.ProjectPermissions
                    .Where(c => c.UserID == GetUserId() && c.IsAccepted).ToListAsync();
                List<Project> allProjects = new List<Project>();

                if (projects != null)
                {
                    for (int i = 0; i < projects.Count; i++)
                    {
                        Project project = await _context.Projects.FirstOrDefaultAsync(c => c.ProjectID == projects[i].ProjectID);
                        allProjects.Add(project);
                    }

                    response.Data = (allProjects.Select(c => _mapper.Map<ProjectDTO>(c))).ToList();
                    response.Success = true;
                    response.Message = "Ok";
                }
                else
                {
                    response.Success = false;
                    response.Message = String.Format("No permissioned projects found for user: {0}", GetUsername());
                }
            }
            catch (Exception e)
            {
                response.Success = false;
                response.Message = e.Message;
            }
            return response;
        }
    
        public async Task<bool> IsProjectSubmittedToChain(string fileHex)
        {
            try
            {
                ServiceResponse<List<EventLog<ProjectRegisterEventDTO>>> response = await _chainInteractionService.GetRegisterEventLogs();
                if (response.Success)
                {
                    SHA256 sha256 = SHA256.Create();
                    byte[] hashval = sha256.ComputeHash(Encoding.ASCII.GetBytes(fileHex));
                    StringBuilder sb = new StringBuilder();
                    foreach (byte b in hashval)
                    {
                        sb.Append(b.ToString("x2"));
                    }
                    String hash_Str = sb.ToString();
                    for (int i = 0; i < response.Data.Count; i++)
                    {
                        if (response.Data[i].Log.Data == "0x" + hash_Str)
                        {
                            return true;
                        }
                    }
                    return false;
                }
                else 
                {
                    return false;
                }
            }
            catch (Exception e)
            {
                string message = e.Message;
                Console.WriteLine($"Error message: {message}");
                return false;
            }
        }

        public async Task<bool> HasPermission(int projectId)
        {
            if (await _context.ProjectPermissions
                .AnyAsync(x => x.ProjectID == projectId && x.UserID == GetUserId() && x.IsAccepted))
            {
                return true;
            }
            return false;
        }

        public async Task<bool> HasOwnerPermission(int projectId)
        {
            if (await _context.ProjectPermissions
                    .AnyAsync(x => x.ProjectID == projectId && x.UserID == GetUserId() 
                        && x.Role == UserPermissionRoleConstants.OWNER && x.IsAccepted))
            {
                return true;
            }
            return false;
        }

        public async Task<bool> ProjectNameExists(string projectName)
        {
            if (await _context.Projects.AnyAsync(x => x.ProjectName == projectName))
            {
                return true;
            }
            return false;
        }
    }
}
