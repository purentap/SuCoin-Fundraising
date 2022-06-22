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

namespace SU_COIN_BACK_END.Services 
{
    public class ProjectService : IProjectService
    {
        private readonly IMapper _mapper;
        private readonly DataContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IChainInteractionService _chainInteractionService;
        private readonly IIpfsInteractionService _ipfsInteractionService;
        public ProjectService(
            IMapper mapper, DataContext context, IHttpContextAccessor httpContextAccessor, 
            IChainInteractionService chainInteractionService, IIpfsInteractionService ipfsInteractionService)
        {
            _mapper = mapper;
            _context = context;
            _httpContextAccessor = httpContextAccessor;
            _chainInteractionService = chainInteractionService;
            _ipfsInteractionService = ipfsInteractionService;
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
                response.Message = MessageConstants.USER_IS_BLACKLISTED;
                return response;
            }
            if (Encoding.ASCII.GetBytes(request.FileHex).Count() > MAXIMUM_FILE_SIZE)
            {
                response.Message = $"Maximum file size is exceeded. Please upload a file which has size smaller than {MAXIMUM_FILE_SIZE}";
                return response;
            }
            if (request.ProjectName == null)
            {
                response.Message = "Project name is not added";
                return response;
            }
            if (await ProjectNameExists(request.ProjectName))
            {
                response.Message = MessageConstants.PROJECT_NAME_EXISTS;
                return response;
            }
            if (await _context.Projects
                .Where(project => project.Status == ProjectStatusConstants.PENDING)
                .CountAsync() == MAXIMUM_ALLOWED_PENDING_PROJECTS)
            {
                response.Message = "Viewer is busy. Please try again later";
                return response;
            }

            try
            {
                ServiceResponse<string> ipfs_response_to_upload = await _ipfsInteractionService.UploadToIpfs(request.FileHex, request.ImageUrl);

                if (!ipfs_response_to_upload.Success) 
                {
                    response.Message = ipfs_response_to_upload.Message;
                    return response;
                }

                string ipfsHash = Convert.ToHexString(SimpleBase.Base58.Bitcoin.Decode(ipfs_response_to_upload.Data).ToArray()).Substring(4);
                bool proposalExists = await _context.Projects.AnyAsync(project => project.FileHash == ipfsHash);

                // If it is uploaded previously, do not add the proposal file into the database
                if (proposalExists)
                {
                    /* After that method terminates, 
                       one of the viewers must remove the duplicated (current) proposal file manually from the ipfs
                       to prevent ambiguity **/
                    response.Message = MessageConstants.PROPOSAL_FILE_EXISTS;
                    return response;
                }
                
                /* Project has not been created in the database. Create the new project */
                Project new_project = new Project 
                {
                    ViewerAccepted = false,     // todo temporarily set to true will change later when frontend is implemented
                    ProjectName = request.ProjectName,
                    Date = DateTime.Now,
                    ProposerAddress = GetUserAddress(),
                    FileHash = ipfsHash,
                    ProjectDescription = request.ProjectDescription,
                    MarkDown = request.MarkDown                    
                };

                await _context.Projects.AddAsync(new_project);
                await _context.SaveChangesAsync();

                /* For security reasons, we need to recheck the database and then assign the permission */
                Project? dbProject = await _context.Projects.FirstOrDefaultAsync(c => c.ProjectName == new_project.ProjectName);

                if (dbProject == null)  // The project was not added, because some operations were applied to the project while adding the project to the database.
                {
                    /* In that case, remove the proposal from the ipfs */                    
                    ServiceResponse<bool> ipfs_response_to_remove = await _ipfsInteractionService.RemoveFromIpfs(ipfsHash);
                    if (!ipfs_response_to_remove.Success)
                    {
                        response.Message = ipfs_response_to_remove.Message;
                        return response;
                    }

                    response.Message = MessageConstants.PROJECT_ADD_FAIL;
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
                response.Message = String.Format(MessageConstants.FAIL_MESSAGE, "add project", e.Message);
            }
            return response;
        }

        public async Task<ServiceResponse<string>> DeleteProject(int id) // If auction created aviod deleting
        {
            ServiceResponse<string> response = new ServiceResponse<string>();
            try
            {
                // Role of the user is not admin or owner does not allow you to delete the project
                if (GetUserRole() != UserRoleConstants.ADMIN && !await HasOwnerPermission(id))
                {
                    response.Message = MessageConstants.PROJECT_PERMISSION_MANAGE_DENIED;
                    return response;
                }

                /* For security reasons, we need to recheck the database and then delete the project */
                Project? project = await _context.Projects.FirstOrDefaultAsync(c => c.ProjectID == id);

                if (project == null)
                {
                    response.Message = MessageConstants.PROJECT_NOT_FOUND;
                    return response;
                }
                if (project.IsAuctionCreated)
                {
                    response.Message = $"Auction of project {project.ProjectName} is already created. You cannot delete this project";
                    return response;
                }

                /* Remove the file (unpin) from ipfs if it still exists*/
                ServiceResponse<bool> ipfs_response = await _ipfsInteractionService.RemoveFromIpfs(SimpleBase.Base58.Bitcoin.Encode(Convert.FromHexString("1220" + project.FileHash)).ToString());
                if (!ipfs_response.Success)
                {
                    response.Message = ipfs_response.Message;
                }
                else
                {
                    /* First remove the permissions and ratings, then remove the project */
                    _context.ProjectPermissions
                        .RemoveRange(_context.ProjectPermissions
                            .Where(permission => permission.ProjectID == id)); // remove permissions related to the current project
                    await _context.SaveChangesAsync();

                    _context.Ratings
                        .RemoveRange(_context.Ratings
                            .Where(rating => rating.ProjectID == id)); // remove ratings related to the current project
                    _context.Remove(project); // remove the current project
                    await _context.SaveChangesAsync();

                    response.Message = MessageConstants.OK;
                    response.Data = "Project is deleted successfully";
                    response.Success = true;
                }
            }
            catch (Exception e)
            {
                response.Message = String.Format(MessageConstants.FAIL_MESSAGE, "delete project", e.Message);
            }
            return response;
        }

        public async Task<ServiceResponse<List<ProjectDTO>>> GetProjects(int count = Int32.MaxValue, bool orderByRating = false)
        {
            ServiceResponse<List<ProjectDTO>> response = new ServiceResponse<List<ProjectDTO>>();
            try
            {
                string userRole = GetUserRole();
                List<Project> projects = new List<Project>();

                /* Filter and fetch the projects according to role of the user who logged in */
               if (userRole == UserRoleConstants.VIEWER || userRole == UserRoleConstants.ADMIN)
               {
                    projects = await _context.Projects.ToListAsync();
               }
               else 
               {
                    projects = await _context.Projects.Where(project => project.ViewerAccepted).ToListAsync(); 
                    if (userRole != UserRoleConstants.ADMIN && userRole != UserRoleConstants.WHITELIST)
                    {
                        projects = projects.Where(c => c.Status == ProjectStatusConstants.APPROVED).ToList();
                    }
                }

                if (orderByRating) // order the projects by descending according to rating values, if needed
                {
                    projects = projects.OrderByDescending(project => project.Rating).ToList();
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
            }

            return response;
        }

        public async Task<ServiceResponse<List<ProjectDTO>>> GetProjectsForViewerPage()
        {
            ServiceResponse<List<ProjectDTO>> response = new ServiceResponse<List<ProjectDTO>>();
            
            if (GetUserRole() != UserRoleConstants.VIEWER)
            {
                response.Message = MessageConstants.NOT_AUTHORIZED_TO_ACCESS;
                return response;
            }

            List<Project> projects = await _context.Projects.Where(project => !project.ViewerAccepted).ToListAsync();
            response.Success = true;
            response.Data = (projects.Select(project => _mapper.Map<ProjectDTO>(project))).ToList();
            response.Message = MessageConstants.OK;

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
                    response.Message = MessageConstants.PROJECT_NOT_FOUND;
                    return response;
                }
                if (!project.ViewerAccepted)
                {
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
                    response.Message = MessageConstants.NOT_AUTHORIZED_TO_ACCESS;
                }
            }
            catch (Exception e) // Error occurred while retrieving the project from the database
            {
                response.Message = String.Format(MessageConstants.FAIL_MESSAGE, "get project by id", e.Message);
            }
            return response;
        }

        public async Task<ServiceResponse<List<string?>>> GetAllFileHashes(bool areOnlyAuctionsStarted = false)
        {
            ServiceResponse<List<string?>> response = new ServiceResponse<List<string?>>();
            try 
            {
                List<string?> hashes = new List<string?>();

                if (areOnlyAuctionsStarted)
                {
                    hashes = await _context.Projects
                        .Where(project => project.IsAuctionStarted)
                        .Select(project => project.FileHash)
                        .ToListAsync();
                }
                else // all projects
                {
                    if (GetUserRole() != UserRoleConstants.ADMIN)
                    {
                        response.Message = MessageConstants.NOT_AUTHORIZED_TO_ACCESS;
                        return response;
                    }

                    hashes = await _context.Projects.Select(project => project.FileHash).ToListAsync();
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
            }
            return response;
        }

        public async Task<ServiceResponse<ProjectDTO>> RateProject(int projectID, double rating_value)
        {
            ServiceResponse<ProjectDTO> response = new ServiceResponse<ProjectDTO>();

            if (GetUserRole() == UserRoleConstants.BLACKLIST)
            {
                response.Message = MessageConstants.NOT_AUTHORIZED_TO_ACCESS;
                return response;
            }
            
            if (rating_value < 0 || rating_value > 5) // rating is invalid
            {
                response.Message = MessageConstants.INVALID_INPUT;
                return response;
            }

            try
            {
                Project? project = await _context.Projects.FirstOrDefaultAsync(c => c.ProjectID == projectID);

                if (project == null)
                {
                    response.Message = MessageConstants.PROJECT_NOT_FOUND;
                    return response;
                }

                if (!project.ViewerAccepted) // Users cannot rate the project, unless viewer accept the project
                {
                    response.Message = MessageConstants.PROJECT_NOT_ACCEPTED_BY_VIEWER;
                    return response;
                }

                if (GetUserRole() == UserRoleConstants.BASE && project.Status != ProjectStatusConstants.APPROVED) // Base users may only rate, if project is approved from the committee
                {
                    response.Message = MessageConstants.NOT_AUTHORIZED_TO_ACCESS;
                    return response;
                }

                /* After passing these checks, user may rate the project */
                int userID = GetUserId();
                Rating? currentRating = await _context.Ratings.FirstOrDefaultAsync(rating => rating.UserID == userID && rating.ProjectID == projectID);

                if (currentRating == null) // User is going to rate this project for the first time
                {
                    Rating new_rating = new Rating 
                    {
                        UserID = userID, 
                        ProjectID = projectID, 
                        Rate = rating_value 
                    };
                    await _context.Ratings.AddAsync(new_rating);
                }
                else // User has already rated this project before, because of that user is going to update the previous rating
                {
                    currentRating.Rate = rating_value;
                    _context.Ratings.Update(currentRating);
                }

                await _context.SaveChangesAsync();
                project.Rating = await _context.Ratings.Where(c => c.ProjectID == projectID).AverageAsync(x => x.Rate);
                _context.Update(project);
                await _context.SaveChangesAsync();
                
                response.Success = true;
                response.Message = MessageConstants.OK;
                response.Data = _mapper.Map<ProjectDTO>(project);
            }
            catch (Exception e)
            {
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
                    response.Message = MessageConstants.PROJECT_PERMISSION_MANAGE_DENIED;
                    return response;
                }
                var sameNameProjectId = await IdFromProjectName(project.ProjectName);


                if (sameNameProjectId > 0 && sameNameProjectId != project.ProjectID)
                {
                    response.Message = MessageConstants.PROJECT_NAME_EXISTS;
                    return response;
                }

                Project? dbProject = await _context.Projects.FirstOrDefaultAsync(c => c.ProjectID == project.ProjectID);

                if (dbProject == null)
                {
                    response.Message = MessageConstants.PROJECT_NOT_FOUND;
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
                    return response;
                }
                    
                response.Data = (projects.Select(c => _mapper.Map<ProjectDTO>(c))).ToList();
                response.Message = MessageConstants.OK;
                response.Success = true;
            }
            catch (Exception e)
            {
                response.Message = String.Format(MessageConstants.FAIL_MESSAGE, "get project by status", e.Message);
            }
            return response;
        }

        public async Task<ServiceResponse<ProjectDTO>> ChangeProjectStatus(int id) 
        {
            ServiceResponse<ProjectDTO> response = new ServiceResponse<ProjectDTO>();
            string userRole = GetUserRole();

            if (userRole != UserRoleConstants.WHITELIST)
            {
                response.Message = MessageConstants.NOT_AUTHORIZED_TO_ACCESS;
                return response;
            }

            try
            {
                Project? project = await _context.Projects.FirstOrDefaultAsync(c => c.ProjectID == id);
                if (project == null)
                {
                    response.Message = MessageConstants.PROJECT_NOT_FOUND;
                    return response;
                }
                
                if (!project.ViewerAccepted)
                {
                    response.Message = MessageConstants.PROJECT_NOT_ACCEPTED_BY_VIEWER;
                    return response;
                }
                        
                ServiceResponse<List<EventLog<ProjectEvaluationEventDTO>>> response_chain = await _chainInteractionService.GetProjectEvaluationEventLogs();
                if (!response_chain.Success)
                {
                    response.Message = MessageConstants.CHAIN_INTERACTION_FAIL;
                    return response;
                }
                if (response_chain.Data == null)
                {
                    throw new Exception(MessageConstants.PROJECT_NOT_FOUND_IN_CHAIN);
                }
                if (project.FileHash == null)
                {
                    response.Message = MessageConstants.PROPOSAL_FILE_NOT_FOUND;
                    return response;
                }

                string status = ProjectStatusConstants.PENDING;

                for (int i = 0; i < response_chain.Data.Count; i++)
                {   
                    bool isValidHash = ((response_chain.Data[i].Log.Topics[1]).ToString() == ("0x"+ project.FileHash).ToLower());
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
                    response.Message = MessageConstants.PROJECT_PERMISSION_MANAGE_DENIED;
                    return response;
                }

                Project? dbProject = await _context.Projects.FirstOrDefaultAsync(c => c.ProjectID == projectID);

                if (dbProject == null)
                {
                    response.Message = MessageConstants.PROJECT_NOT_FOUND;
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
                            FileHash = p.FileHash, 
                            ProjectDescription = p.ProjectDescription, 
                            ProposerAddress = p.ProposerAddress, 
                            Rating = p.Rating, 
                            Status = p.Status
                        })
                        .FirstOrDefaultAsync(c => c.ProjectID == projectPermissions[i].ProjectID);
                    
                    if (project != null) 
                    {
                        allProjects.Add(project);
                    }
                }
                
                response.Data = (allProjects.Select(c => _mapper.Map<ProjectDTO>(c))).ToList();
                response.Success = true;
                response.Message = MessageConstants.OK;
            }
            catch (Exception e)
            {
                response.Message = String.Format(MessageConstants.FAIL_MESSAGE, "get all permissioned projects", e.Message);
            }
            return response;
        }

        public async Task<ServiceResponse<string>> ReplyProjectPreview(int id, bool reply)
        {
            ServiceResponse<string> response = new ServiceResponse<string>();

            if (GetUserRole() != UserRoleConstants.VIEWER)
            {
                response.Message = MessageConstants.NOT_AUTHORIZED_TO_ACCESS;
                return response;
            }

            try
            {
                Project? project = await _context.Projects.FirstOrDefaultAsync(project => project.ProjectID == id);
                if (project == null)
                {
                    response.Message = MessageConstants.PROJECT_NOT_FOUND;
                    return response;
                }

                /* Evaluate the project as an viewer */
                if (reply)
                {
                    project.ViewerAccepted = true;
                    project.ViewerAcceptedAddress = GetUserAddress();
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
            }
            return response;
        }
       
        public async Task<ServiceResponse<string>> StartAuction(int projectID)
        {
            ServiceResponse<string> response = new ServiceResponse<string>();
            try
            {
                Project? project = await _context.Projects.FirstOrDefaultAsync(project => project.ProjectID == projectID);
                if (project == null || project.FileHash == null)
                {
                    response.Message = MessageConstants.PROJECT_NOT_FOUND;
                    return response;
                }

                ProjectPermission? permission = await _context.ProjectPermissions
                    .FirstOrDefaultAsync(permission => permission.ProjectID == projectID && permission.UserID == GetUserId());

                if (permission == null)
                {
                    response.Message = MessageConstants.PROJECT_PERMISSION_MANAGE_DENIED;                  
                    return response;
                }
                
                if (permission.Role == UserPermissionRoleConstants.EDITOR) // Only owner and co-owners may start the auction
                {
                    response.Message = MessageConstants.NOT_AUTHORIZED_TO_ACCESS;
                    return response;
                }

                if (!project.IsAuctionCreated)
                {
                    response.Message = "Auction of this project has not been created yet";
                    return response;
                }

                if (project.IsAuctionStarted)  // User tries to re-start an auction
                {
                    response.Message = $"Auction of project {projectID} has already been started";
                    return response;
                }

                ServiceResponse<bool> chainResponse = await _chainInteractionService.IsAuctionStartedInChain(project.FileHash);

                if (!chainResponse.Success)
                {
                    response.Message = chainResponse.Message;
                    return response;
                }

                if (!chainResponse.Data)
                {
                    response.Message = MessageConstants.AUCTION_NOT_STARTED;
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
            }
            return response;
        }

        public async Task<ServiceResponse<string>> CreateAuction(int projectID)
        {
            ServiceResponse<string> response = new ServiceResponse<string>();
            try
            {
                Project? project = await _context.Projects.FirstOrDefaultAsync(project => project.ProjectID == projectID);
                if (project == null || project.FileHash == null)
                {
                    response.Message = MessageConstants.PROJECT_NOT_FOUND;
                    return response;
                }
                if (!await HasOwnerPermission(projectID)) // Only owner may create the auction
                {
                    response.Message = MessageConstants.PROJECT_PERMISSION_MANAGE_DENIED;
                    return response;                    
                }
                if (project.Status != ProjectStatusConstants.APPROVED)
                {
                    response.Message = "Project is not approved. Therefore, not ready to be auctioned";
                    return response;
                }
                if (project.IsAuctionCreated) // User tries to re-create an auction
                {
                    response.Message = $"Auction of project {projectID} has already been created";
                    return response;
                }
                
                ServiceResponse<bool> chainResponse = await _chainInteractionService.IsAuctionCreatedInChain(project.FileHash);
                
                if (!chainResponse.Success)
                {
                    response.Message = chainResponse.Message;
                    return response;
                }
                
                if (!chainResponse.Data) // Auction is not created in the chain
                {
                    response.Message = MessageConstants.AUCTION_NOT_FOUND;
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
            if (await _context.ProjectPermissions
                .AnyAsync(permission => (permission.ProjectID == projectId) && (permission.UserID == GetUserId() )
                    && (permission.Role == UserPermissionRoleConstants.OWNER)))
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
                            ProposerAddress = p.ProposerAddress, 
                            Rating = p.Rating, 
                            Status = p.Status
                        })
                        .FirstOrDefaultAsync(c => c.ProjectID == projectPermissions[i].ProjectID);
                    
                    if (project != null)
                    {
                        allProjects.Add(project);
                    }
                }

                response.Data = (allProjects.Select(c => _mapper.Map<ProjectDTO>(c))).ToList();
                response.Success = true;
                response.Message = MessageConstants.OK;
            }
            catch (Exception e)
            {
                response.Message = String.Format(MessageConstants.FAIL_MESSAGE, "get all invited projects", e.Message);
            }
            return response;
        }

        public async Task<ServiceResponse<string>> DeleteRatings() // Delete all ratings for the current user
        {
            ServiceResponse<string> response = new ServiceResponse<string>();
            int userID = GetUserId();

            /* Retrieve projects which are rated by the current user */   
            IEnumerable<Project>? query = from project in await _context.Projects.ToListAsync()
                                          from rating in _context.Ratings.ToList()
                                          where rating.UserID == userID && project.ProjectID == rating.ProjectID
                                          select project;
                
            List<Project>? projects = query.ToList();

            foreach (Project project in projects)
            {
                Rating? deleted_rating = await _context.Ratings
                    .FirstOrDefaultAsync(rating => rating.UserID == userID && rating.ProjectID == project.ProjectID);
                
                if (deleted_rating == null)
                {
                    continue;
                }
                else 
                {
                    _context.Ratings.Remove(deleted_rating);
                    await _context.SaveChangesAsync();
                    project.Rating = await _context.Ratings.AverageAsync(x => x.Rate);
                    _context.Update(project);
                    await _context.SaveChangesAsync();
                }               
            }

            /* Check whether ratings related to the current user is deleted or not */
            List<Rating>? deleted_ratings = await _context.Ratings.Where(rating => rating.UserID == userID).ToListAsync();
            
            if (deleted_ratings.Count() == 0) 
            {
                response.Success = true;
                response.Message = $"All ratings of {GetUsername()} is succesfully deleted";
            }
            else
            {
                response.Message = $"Problem occured while deleting ratings of {GetUsername()}";
            }

            return response;
        }
    }
}
