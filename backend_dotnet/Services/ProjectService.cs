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
using SU_COIN_BACK_END.Request;
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
using Newtonsoft.Json;

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

        private const int MAXIMUM_ALLOWED_PENDING_PROJECTS = 100;
        private const int MAXIMUM_FILE_SIZE = 10000000; // 10 MB
       
        public async Task<ServiceResponse<ProjectDTO>> AddProject(ProjectRequest request)
        {
            ServiceResponse<ProjectDTO> response = new ServiceResponse<ProjectDTO>();

            if (GetUserRole() == UserRoleConstants.BLACKLIST) 
            {
                response.Success = false;
                response.Message = MessageConstants.USER_IS_BLACKLISTED;
                return response;
            }
            if (Encoding.ASCII.GetBytes(request.FileHex).Count() > MAXIMUM_FILE_SIZE)
            {
                response.Success = false;
                response.Message = $"Maximum file size is exceeded. Please upload a file which has size smaller than {MAXIMUM_FILE_SIZE}";
                return response;
            }
            if (request.ProjectName == null)
            {
                response.Success = false;
                response.Message = "Project name is not added";
                return response;
            }
            if (await ProjectNameExists(request.ProjectName))
            {
                response.Success = false;
                response.Message = MessageConstants.PROJECT_NAME_EXISTS;
                return response;
            }
            if (await _context.Projects.Where(project => project.Status == ProjectStatusConstants.PENDING).CountAsync() == MAXIMUM_ALLOWED_PENDING_PROJECTS)
            {
                response.Success = false;
                response.Message = "Viewer is busy. Please try again later";
                return response;
            }

            try
            {
                /* Project has not been created in the database. Create the new project */
                var uploadResult = await UploadToIpfs(request.FileHex, request.ImageUrl);
                Console.WriteLine($"Upload Result: {uploadResult}"); // Debuging

                var hash = uploadResult?["Hash"];
                Console.WriteLine(hash);
                if (hash == null) 
                {
                    response.Success = false;
                    response.Message = "IPFS upload failed";
                    return response;
                }

                string ipfsHash = Convert.ToHexString(SimpleBase.Base58.Bitcoin.Decode(hash).ToArray()).Substring(4);

                Project new_project = new Project 
                {
                    ProjectName = request.ProjectName,
                    Date = DateTime.Now,
                    ProposerAddress = GetUserAddress(),
                    FileHex = ipfsHash,
                    ProjectDescription = request.ProjectDescription,
                    MarkDown = request.MarkDown                    
                };

                await _context.Projects.AddAsync(new_project);
                await _context.SaveChangesAsync();

                /* For security reasons, we need to recheck the database and then assign the permission */
                Project? dbProject = await _context.Projects.FirstOrDefaultAsync(c => c.ProjectName == new_project.ProjectName);

                if (dbProject == null)  // The project was not added, because some operations were applied to the project while adding the project to the database.
                {
                    response.Message = MessageConstants.PROJECT_ADD_FAIL;
                    response.Success = true;
                    return response;
                }
                    
                /* Since project was added successfully, add an owner to the project */
                ProjectPermission permission = new ProjectPermission
                {
                    ProjectID = dbProject.ProjectID, 
                    UserID = GetUserId(), 
                    Role = UserPermissionRoleConstants.OWNER,
                    IsAccepted = true 
                };

                await _context.ProjectPermissions.AddAsync(permission);
                await _context.SaveChangesAsync();

                response.Data = _mapper.Map<ProjectDTO>(dbProject);
                response.Message = MessageConstants.OK;
                response.Success = true;
            }
            catch (Exception e)
            {
                response.Success = false;
                response.Message = String.Format(MessageConstants.FAIL_MESSAGE, "add project", e.Message);
            }
            return response;
        }

        private async Task<Dictionary<string,string>?> UploadToIpfs(string hexString,string? imageHex)
            {
                string actionUrl = "https://ipfs.infura.io:5001/api/v0/add?wrap-with-directory";
                byte[] paramFileBytes = Convert.FromHexString(hexString);
                byte[] paramImageBytes = Convert.FromHexString(imageHex);

   
                HttpContent bytesContent = new ByteArrayContent(paramFileBytes);
                HttpContent imageContent = new ByteArrayContent(paramImageBytes);

                using (var client = new HttpClient())
                using (var formData = new MultipartFormDataContent())
                {
                    client.DefaultRequestHeaders.Add("Authorization", "Basic MjlJOTJHRHRBR0RaenpZNnNUWUdLdkRXeFdROjg1NTNmOTkwZWE3Nzk3ODVjY2Q2NjVkMjU2NDY2MWZi");
                    formData.Add(bytesContent, "file", "whitepaper");

                    if (imageHex != null)
                        formData.Add(imageContent,"file","image");
                    
                    var response = await client.PostAsync(actionUrl, formData);
                    if (!response.IsSuccessStatusCode)
                    {
                        return null;
                    }

                    string stringResponse = (await response.Content.ReadAsStringAsync()).Split('\n').SkipLast(1).Last();
                    return JsonConvert.DeserializeObject<Dictionary<string, string>>(stringResponse);
                }
            }

        private async Task<bool> RemoveFromIpfs(string encodedHash)
        {
            string actionUrl = "https://ipfs.infura.io:5001/api/v0/pin/rm?arg=" + encodedHash;
            Console.WriteLine(actionUrl);

            using (var client = new HttpClient())
            using (var formData = new MultipartFormDataContent())
            {
                client.DefaultRequestHeaders.Add("Authorization", "Basic MjlJOTJHRHRBR0RaenpZNnNUWUdLdkRXeFdROjg1NTNmOTkwZWE3Nzk3ODVjY2Q2NjVkMjU2NDY2MWZi");
                var response = await client.PostAsync(actionUrl, formData);
                return response.IsSuccessStatusCode;
            }        
        }

        public async Task<ServiceResponse<string>> DeleteProject(int id) //If auction started aviod deleting
        {
            ServiceResponse<string> response = new ServiceResponse<string>();
            try
            {
                if (!await HasOwnerPermission(id)) // owner does not allow you to delete the project
                {
                    response.Success = false;
                    response.Message = MessageConstants.PROJECT_PERMISSION_MANAGE_DENIED;
                    return response;
                }

                /* For security reasons, we need to recheck the database and then delete the project */
                Project? project = await _context.Projects.FirstOrDefaultAsync(c => c.ProjectID == id);

                if (project == null)
                {
                    response.Message = MessageConstants.PROJECT_NOT_FOUND;
                    response.Success = false;
                    return response;
                }


                /* Remove the file (unpin) from ipfs if it still exists*/
                await RemoveFromIpfs(SimpleBase.Base58.Bitcoin.Encode(Convert.FromHexString("1220" + project.FileHex)).ToString());
                
                /* Remove both the current project and the related project permissions */
                _context.ProjectPermissions.RemoveRange(_context.ProjectPermissions.Where(c => c.ProjectID == id));
                _context.Remove(project);
                await _context.SaveChangesAsync();
                response.Message = MessageConstants.OK;
                response.Data = "Project is deleted successfully";
                response.Success = true;
            }
            catch (Exception e)
            {
                response.Success = false;
                response.Message = String.Format(MessageConstants.FAIL_MESSAGE, "delete project", e.Message);
            }
            return response;
        }


        public async Task<ServiceResponse<List<ProjectDTO>>> GetProjects(int count = Int32.MaxValue)
        {
            ServiceResponse<List<ProjectDTO>> response = new ServiceResponse<List<ProjectDTO>>();
            try
            {
                string userRole = GetUserRole();
                List<Project> projects = new List<Project>();

                /* First fetch all the projects. Then check if the user is neither admin nor whitelist, just filter the approved projects */
                projects =  await _context.Projects.ToListAsync(); 
       
                if (userRole != UserRoleConstants.ADMIN && userRole != UserRoleConstants.WHITELIST)
                {
                    projects = projects.Where(c => c.Status == ProjectStatusConstants.APPROVED).ToList();
                }
                        
                /* If there is any project, send the project data to the mapper */                
                if (projects == null)
                {
                    response.Message = MessageConstants.PROJECT_NOT_FOUND;
                    response.Success = true;
                    return response;
                }

                response.Data = (projects.Take(count).Select(c => _mapper.Map<ProjectDTO>(c))).ToList(); // map projects to projectDTOs
                response.Message = MessageConstants.OK;
                response.Success = true;           
            }
            catch (Exception e)
            {
                response.Message = String.Format(MessageConstants.FAIL_MESSAGE, "get projects", e.Message);
                response.Success = false;
            }

            return response;
        }

        public async Task<ServiceResponse<ProjectDTO>> GetProjectById(int id)
        {
            ServiceResponse<ProjectDTO> response = new ServiceResponse<ProjectDTO>();
            try
            {
                Project? project = await _context.Projects.FirstOrDefaultAsync(c => c.ProjectID == id);

                if (project == null)
                {
                    response.Success = false;
                    response.Message = MessageConstants.PROJECT_NOT_FOUND;
                    return response;
                }
                if (!project.ViewerAccepted)
                {
                    response.Success = false;
                    response.Message = MessageConstants.PROJECT_NOT_ACCEPTED_BY_VIEWER;
                    return response;                    
                }
                    
                string userRole = GetUserRole();
                
                if (userRole == UserRoleConstants.ADMIN || userRole == UserRoleConstants.WHITELIST || project.Status == ProjectStatusConstants.APPROVED) 
                {
                    response.Data = _mapper.Map<ProjectDTO>(project);
                    response.Message = MessageConstants.OK;
                    response.Success = true;
                }
                else
                {
                    response.Success = false;
                    response.Message = MessageConstants.NOT_AUTHORIZED_TO_ACCESS;
                }
            }
            catch (Exception e) // Error occurred while retrieving the project from the database
            {
                response.Message = String.Format(MessageConstants.FAIL_MESSAGE, "get project by id", e.Message);
                response.Success = false;
            }
            return response;
        }

        public async Task<ServiceResponse<List<string>>> GetAllFileHashes(bool areOnlyAuctionsStarted = false)
        {
            ServiceResponse<List<string>> response = new ServiceResponse<List<string>>();
            try 
            {
                List<string> hashes = new List<string>();

                if (areOnlyAuctionsStarted)
                {
                    hashes = await _context.Projects.Where(project => project.IsAuctionStarted).Select(project => project.FileHex).ToListAsync();
                }
                else // all projects
                {
                    if (GetUserRole() != UserRoleConstants.ADMIN)
                    {
                        response.Message = MessageConstants.NOT_AUTHORIZED_TO_ACCESS;
                        response.Success = false;
                        return response;
                    }
                    hashes = await _context.Projects.Select(project => project.FileHex).ToListAsync();
                }
                        
                if (hashes == null) 
                {
                    response.Message = MessageConstants.PROJECT_NOT_FOUND;
                    response.Success = true;
                    return response;
                }
                            
                response.Data = hashes;
                response.Message = MessageConstants.OK;
                response.Success = true;
            }
            catch (Exception e) 
            {
                response.Message = String.Format(MessageConstants.FAIL_MESSAGE, "get all file hashes", e.Message);
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
                    response.Message = MessageConstants.INVALID_INPUT;
                    return response;
                }

                Project? project = await _context.Projects.FirstOrDefaultAsync(c => c.ProjectID == projectID);

                if (project == null)
                {
                    response.Success = false;
                    response.Message = MessageConstants.PROJECT_NOT_FOUND;
                    return response;
                }
                if (!project.ViewerAccepted)
                {
                    response.Success = false;
                    response.Message = MessageConstants.PROJECT_NOT_ACCEPTED_BY_VIEWER;
                    return response;
                }
                    
                int userID = GetUserId();
                Rating? rating = await _context.Ratings.FirstOrDefaultAsync(c => c.UserID == userID && c.ProjectID == projectID);

                if (rating != null)
                {
                    rating.Rate = rating_value;
                    _context.Ratings.Update(rating);
                }
                else
                {
                    Rating new_rating = new Rating 
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
                response.Message = MessageConstants.OK;
                response.Data = _mapper.Map<ProjectDTO>(project);
            }
            catch (Exception e)
            {
                response.Success = false;
                response.Message = String.Format(MessageConstants.FAIL_MESSAGE, "rate project", e.Message);
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
                var sameNameProjectId = await IdFromProjectName(project.ProjectName);


                if (sameNameProjectId > 0 && sameNameProjectId != project.ProjectID)
                {
     
                    response.Success = false;
                    response.Message = MessageConstants.PROJECT_NAME_EXISTS;
                    return response;
                }



                Project? dbProject = await _context.Projects.FirstOrDefaultAsync(c => c.ProjectID == project.ProjectID);

                if (dbProject == null)
                {
                    response.Message = MessageConstants.PROJECT_NOT_FOUND;
                    response.Success = false;
                    return response;
                }
                
                dbProject.ProjectName = project.ProjectName;
                dbProject.ProjectDescription = project.ProjectDescription;
                _context.Projects.Update(dbProject);
                await _context.SaveChangesAsync();
                response.Data = _mapper.Map<ProjectDTO>(dbProject);
                response.Success = true;           
                response.Message = MessageConstants.OK;

            }
            catch (Exception e)
            {
                response.Message = String.Format(MessageConstants.FAIL_MESSAGE, "update project", e.Message);
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
                
                if (projects == null)
                {
                    response.Message = MessageConstants.PROJECT_NOT_FOUND;
                    response.Success = false;
                    return response;
                }
                    
                response.Data = (projects.Select(c => _mapper.Map<ProjectDTO>(c))).ToList();
                response.Message = MessageConstants.OK;
                response.Success = true;
            }
            catch (Exception e)
            {
                response.Message = String.Format(MessageConstants.FAIL_MESSAGE, "get project by status", e.Message);
                response.Success = false;
            }
            return response;
        }

        public async Task<ServiceResponse<ProjectDTO>> ChangeStatus(int id) 
        {
            ServiceResponse<ProjectDTO> response = new ServiceResponse<ProjectDTO>();
            try
            {
                Project? project = await _context.Projects.FirstOrDefaultAsync(c => c.ProjectID == id);
                if (project == null)
                {
                    response.Success = false;
                    response.Message = MessageConstants.PROJECT_NOT_FOUND;
                    return response;
                }
                
                if (!project.ViewerAccepted)
                {
                    response.Message = MessageConstants.PROJECT_NOT_ACCEPTED_BY_VIEWER;
                    response.Success = false;
                    return response;
                }
                        
                ServiceResponse<List<EventLog<ProjectEvaluationEventDTO>>> response_chain = await _chainInteractionService.GetProjectEvaluationEventLogs();
                if (!response_chain.Success)
                {
                    response.Success = false;
                    response.Message = MessageConstants.CHAIN_INTERACTION_FAIL;
                    return response;
                }
                else if (response_chain.Data == null)
                {
                    throw new Exception(MessageConstants.CHAIN_INTERACTION_FAIL);
                }
                if (project.FileHex == null)
                {
                    response.Success = false;
                    response.Message = MessageConstants.PROPOSAL_FILE_NOT_FOUND;
                    return response;
                }

                string status = ProjectStatusConstants.PENDING;

                for (int i = 0; i < response_chain.Data.Count; i++)
                {   
                    bool isValidHash = ((response_chain.Data[i].Log.Topics[1]).ToString() == ("0x"+ project.FileHex).ToLower());
                    bool isProjectApproved = response_chain.Data[i].Event.isApproved;

                    if (isValidHash)
                    {
                        status = isProjectApproved ? ProjectStatusConstants.APPROVED : ProjectStatusConstants.REJECTED;
                        break;
                    }
                }

                string? previous_status = project.Status;
                project.Status = status;
                _context.Projects.Update(project);
                await _context.SaveChangesAsync();

                response.Success = true;
                response.Message = "Status changed from " + previous_status + " to " +  status + ".";
                response.Data = _mapper.Map<ProjectDTO>(project);
            }
            catch (Exception e)
            {
                response.Message = String.Format(MessageConstants.FAIL_MESSAGE, "change project status", e.Message);
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

                Project? dbProject = await _context.Projects.FirstOrDefaultAsync(c => c.ProjectID == projectID);

                if (dbProject == null)
                {
                    response.Message = MessageConstants.PROJECT_NOT_FOUND;
                    response.Success = false;
                    return response;
                }

                dbProject.MarkDown = markdown;
                _context.Update(dbProject);
                await _context.SaveChangesAsync();
                response.Data = _mapper.Map<ProjectDTO>(dbProject);
                response.Success = true;
                response.Message = MessageConstants.OK;
            }
            catch (Exception e)
            {
                response.Message = String.Format(MessageConstants.FAIL_MESSAGE, "update markdown", e.Message);
                response.Success = false;
            }
            return response;
        }
    
        public async Task<ServiceResponse<List<ProjectDTO>>> GetAllPermissionedProjects(bool withHex)
        {
            ServiceResponse<List<ProjectDTO>> response = new ServiceResponse<List<ProjectDTO>>();
            try
            {
                List<ProjectPermission> projectPermissions = await _context.ProjectPermissions
                .Where(c => c.UserID == GetUserId() && c.IsAccepted).ToListAsync(); // all project permissions of the logged in user
                List<Project> allProjects = new List<Project>(); // all permissioned projects of the logged in user

                if (projectPermissions == null)
                {
                    response.Success = false;
                    response.Message = $"No permissioned projects found user {GetUsername()}";
                    return response;
                }

                for (int i = 0; i < projectPermissions.Count; i++)
                {
                    /* First fetch all the projects. Then, filter the permissioned projects */
                    Project? project = await _context.Projects
                    .Select(p => withHex ? p : new Project 
                    {
                        ProjectID = p.ProjectID, 
                        ProjectName = p.ProjectName, 
                        Date = p.Date, 
                        FileHex = p.FileHex,
                        ProjectDescription = p.ProjectDescription, 
                        Rating = p.Rating, 
                        Status = p.Status
                    })
                    .FirstOrDefaultAsync(c => c.ProjectID == projectPermissions[i].ProjectID);
                    allProjects.Add(project);
                }

                response.Data = (allProjects.Select(c => _mapper.Map<ProjectDTO>(c))).ToList();
                response.Success = true;
                response.Message = MessageConstants.OK;
            }
            catch (Exception e)
            {
                response.Success = false;
                response.Message = String.Format(MessageConstants.FAIL_MESSAGE, "get all permissioned projects", e.Message);
            }
            return response;
        }

        public async Task<ServiceResponse<string>> ReplyProjectPreview(int id, bool reply)
        {
            ServiceResponse<string> response = new ServiceResponse<string>();
            try
            {
                Project? project = await _context.Projects.FirstOrDefaultAsync(project => project.ProjectID == id);
                if (project == null)
                {
                    response.Message = MessageConstants.PROJECT_NOT_FOUND;
                    response.Success = false;
                    return response;
                }

                /* Evaluate the project as an viewer */
                if (reply)
                {
                    project.ViewerAccepted = true;
                    response.Message = MessageConstants.OK;
                    response.Data = "Project preview is approved by the viewer";
                    response.Success = true;
                }
                else
                {
                    response = await DeleteProject(id);
                    response.Data = "Project preview is rejected by the viewer";
                    response.Success = true;
                }
            }
            catch (Exception e)
            {
                response.Message = String.Format(MessageConstants.FAIL_MESSAGE, "reply project preview", e.Message);
                response.Success = false;
            }
            return response;
        }
       
        public async Task<ServiceResponse<string>> StartAuction(int projectID)
        {
            ServiceResponse<string> response = new ServiceResponse<string>();
            try
            {
                Project? project = await _context.Projects.FirstOrDefaultAsync(project => project.ProjectID == projectID);
                if (project == null)
                {
                    response.Message = MessageConstants.PROJECT_NOT_FOUND;
                    response.Success = false;
                    return response;
                }
                if (!project.IsAuctionCreated)
                {
                    response.Message = "Auction of this project has not been created yet";
                    response.Success = false;
                    return response;
                }
                
                ProjectPermission? permission = await _context.ProjectPermissions
                .FirstOrDefaultAsync(permission => permission.ProjectID == projectID && permission.UserID == GetUserId());

                if (permission == null)
                {
                    response.Message = MessageConstants.PROJECT_PERMISSION_MANAGE_DENIED;
                    response.Success = false;                    
                    return response;
                }
                
                if (permission.Role != UserPermissionRoleConstants.OWNER)
                {
                    response.Message = MessageConstants.NOT_AUTHORIZED_TO_ACCESS;
                    response.Success = false;
                    return response;
                }
                                
                project.IsAuctionStarted = true;
                _context.Projects.Update(project);
                await _context.SaveChangesAsync();

                response.Message = MessageConstants.OK;
                response.Data = $"Auction of project {projectID} has been started";
                response.Success = true;
            }
            catch (Exception e)
            {
                response.Message = String.Format(MessageConstants.FAIL_MESSAGE, "start auction", e.Message);
                response.Success = false;
            }
            return response;
        }

        public async Task<ServiceResponse<string>> CreateAuction(int projectID)
        {
            ServiceResponse<string> response = new ServiceResponse<string>();
            try
            {
                Project? project = await _context.Projects.FirstOrDefaultAsync(project => project.ProjectID == projectID);
                if (project == null)
                {
                    response.Success = false;
                    response.Message = MessageConstants.PROJECT_NOT_FOUND;
                    return response;
                }
                if (!project.ViewerAccepted)
                {
                    response.Success = false;
                    response.Message = MessageConstants.PROJECT_NOT_ACCEPTED_BY_VIEWER;
                    return response;
                }
                if (project.Status != ProjectStatusConstants.APPROVED)
                {
                    response.Success = false;
                    response.Message = "Project is not approved. Therefore, not ready to be auctioned";
                    return response;
                }

                ProjectPermission? permission = await _context.ProjectPermissions
                .FirstOrDefaultAsync(permission => permission.ProjectID == projectID && permission.UserID == GetUserId());

                if (permission == null)
                {
                    response.Success = false;
                    response.Message = MessageConstants.PROJECT_PERMISSION_MANAGE_DENIED;
                    return response;
                }
                if (permission.Role != UserPermissionRoleConstants.OWNER)
                {
                    response.Success = false;
                    response.Message = MessageConstants.NOT_AUTHORIZED_TO_ACCESS;
                    return response;
                }

                project.IsAuctionCreated = true;
                _context.Projects.Update(project);
                await _context.SaveChangesAsync();

                response.Success = true;
                response.Message = MessageConstants.OK;
                response.Data = $"Auction of project {projectID} has been created";
            }
            catch (Exception e)
            {
                response.Success = false;
                response.Message = String.Format(MessageConstants.FAIL_MESSAGE, "create auction", e.Message);
            }
            return response;
        }

        public async Task<bool> HasPermission(int projectId)
        {
            if (await _context.ProjectPermissions.AnyAsync(x => x.ProjectID == projectId && x.UserID == GetUserId() && x.IsAccepted))
            {
                return true;
            }
            return false;
        }

        public async Task<bool> HasOwnerPermission(int projectId)
        {
            if (await _context.ProjectPermissions.AnyAsync(x => x.ProjectID == projectId && x.UserID == GetUserId() 
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

         public async Task<int> IdFromProjectName(string projectName)
        {
            return await _context.Projects
                    .Where(x => x.ProjectName == projectName)
                    .Select(u => u.ProjectID)
                    .FirstOrDefaultAsync();

        }

        public async Task<ServiceResponse<List<ProjectDTO>>> GetAllInvitedProjects()
        {
            ServiceResponse<List<ProjectDTO>> response = new ServiceResponse<List<ProjectDTO>>();
            try
            {
                List<ProjectPermission> projectPermissions = await _context.ProjectPermissions
                .Where(c => c.UserID == GetUserId() && !c.IsAccepted).ToListAsync(); // all project Invitations of the logged in user
                List<Project> allProjects = new List<Project>(); // all permissioned projects of the logged in user

                if (projectPermissions == null)
                {
                    response.Success = false;
                    response.Message = $"No invitations found for user: {GetUsername()}";
                    return response;
                }
                    
                for (int i = 0; i < projectPermissions.Count; i++)
                {
                    /* First fetch all the projects. Then, filter the invited projects */
                    Project? project = await _context.Projects
                    .Select(p => new Project 
                    {
                        ProjectID = p.ProjectID, 
                        ProjectName = p.ProjectName, 
                        Date = p.Date, 
                        ProjectDescription = p.ProjectDescription, 
                        Rating = p.Rating, 
                        Status = p.Status
                    })
                    .FirstOrDefaultAsync(c => c.ProjectID == projectPermissions[i].ProjectID);
                    allProjects.Add(project);
                }

                response.Data = (allProjects.Select(c => _mapper.Map<ProjectDTO>(c))).ToList();
                response.Success = true;
                response.Message = MessageConstants.OK;
            }
            catch (Exception e)
            {
                response.Success = false;
                response.Message = String.Format(MessageConstants.FAIL_MESSAGE, "get all invited projects", e.Message);
            }
            return response;
        }
    }
}
