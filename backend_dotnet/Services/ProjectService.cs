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

    public class ProjectService : IProjectService{
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
            try{
                if(await ProjectNameExists(project.ProjectName)){
                    response.Success = false;
                    response.Message = "Project name already exists please choose another name";
                    return response;
                }
                if(!await IsProjectSubmittedToChain(project.fileHex)){
                    response.Success =false;
                    response.Message = MessageConstants.PROJECT_NOT_SUBMITTED_TO_CHAIN;
                    return response;
                }
                Project new_project = _mapper.Map<Project>(project);
                new_project.FileHex = project.fileHex;
                new_project.Date = DateTime.Now;
                new_project.IsApproved = false;
                new_project.Status ="Pending";
                new_project.MarkDown = "";
                new_project.Rating = 0;
                new_project.ProposerAddress = GetUserAddress();
                await _context.Projects.AddAsync(new_project);
                await _context.SaveChangesAsync();
                Project dbProject = await _context.Projects.FirstOrDefaultAsync(c => c.ProjectName == project.ProjectName);
                if (dbProject != null){
                    ProjectPermission permission = new ProjectPermission{ProjectID = dbProject.ProjectID, UserID = GetUserId(), Role = "Owner", IsAccepted =true } ;
                    await _context.ProjectPermissions.AddAsync(permission);
                    await _context.SaveChangesAsync();
                }
                response.Data = "Ok";
                response.Message = MessageConstants.PROJECT_ADD_SUCCESS;
                response.Success = true;
            }catch(Exception e){
                response.Success = false;
                response.Message = MessageConstants.PROJECT_ADD_FAIL+"\nException message: " +e.Message;
                return response;
            }
            return response;
        }

        public async Task<ServiceResponse<bool>> DeleteProject(int ID) //If auction started aviod deleting
        {
            ServiceResponse<bool> response = new ServiceResponse<bool>();
            try{
                if(! await HasOwnerPermission(ID)){
                    response.Success = false;
                    response.Message = MessageConstants.PROJECT_PERMISSION_MANAGE_DENIED;
                    return response;
                }
                Project project = await _context.Projects.FirstOrDefaultAsync(c => c.ProjectID == ID);
                if (project != null){
                    _context.ProjectPermissions.RemoveRange(_context.ProjectPermissions.Where(c => c.ProjectID == ID));
                    _context.Remove(project);
                    await _context.SaveChangesAsync();
                    response.Message ="Ok";
                    response.Data = true;
                    response.Success = true;
                }else{
                    response.Message = MessageConstants.PROJECT_NOT_FOUND;
                    response.Success = false;
                }
            }catch(Exception e){
                response.Success  = false;
                response.Message = MessageConstants.PROJECT_DELETE_FAIL +"\nException message: "+e.Message;
            }
            return response;
        }

        public async Task<ServiceResponse<List<ProjectDTO>>> GetAllProjects()
        {
            ServiceResponse<List<ProjectDTO>> response = new ServiceResponse<List<ProjectDTO>>();
            try{
                List<Project> projects = new List<Project>();
                if(GetUserRole() != "Admin" && GetUserRole() != "Whitelist"){
                    projects = await _context.Projects.Where(c => c.Status == "Approved").ToListAsync();
                }else{
                    projects = await _context.Projects.ToListAsync();
                }
                if (projects != null){
                    response.Data = (projects.Select(c => _mapper.Map<ProjectDTO>(c))).ToList();
                    response.Message = "Ok";
                    response.Success = true;
                }else{
                    response.Message = "No project found!";
                    response.Success = false;
                }
            }catch(Exception e){
                response.Message = e.Message;
                response.Success = false;
            }
            return response;
        }

        public async Task<ServiceResponse<ProjectDTO>> GetProjectById(int ID)
        {
            ServiceResponse<ProjectDTO> response = new ServiceResponse<ProjectDTO>();
            try{
                Project project = await _context.Projects.FirstOrDefaultAsync(c => c.ProjectID == ID);
                if (project != null){
                    if(GetUserRole() == "Admin" || GetUserRole() == "Whitelist" || project.Status == "Approved"){
                        response.Data = _mapper.Map<ProjectDTO>(project);
                        response.Message = "Ok";
                        response.Success = true;
                    }else{
                        response.Success = false;
                        response.Message = "You are not authorized to access resources";
                    }
                }else{
                    response.Success = false;
                    response.Message = MessageConstants.PROJECT_NOT_FOUND;
                }
            }catch(Exception e){
                response.Message = e.Message;
                response.Success = false;
            }
            return response;
        }

        public async Task<ServiceResponse<ProjectDTO>> RateProject(int projectID, double rating)
        {
            ServiceResponse<ProjectDTO> response = new ServiceResponse<ProjectDTO>();
            try{
                if(rating > 10 || rating < 0){
                    response.Success = false;
                    response.Message = "Rating input is not valid should be in [0,10]";
                }
                Project project = await _context.Projects.FirstOrDefaultAsync(c => c.ProjectID == projectID);
                if(project != null){
                    Ratings ratings = await _context.Ratings.FirstOrDefaultAsync(c => c.UserID == GetUserId() && c.ProjectID == projectID);
                    if(rating != null){
                        ratings.Rate = rating;
                        _context.Ratings.Update(ratings);
                    }else{
                        Ratings new_rating = new Ratings{UserID = GetUserId(), ProjectID = projectID, Rate = rating };
                        await _context.Ratings.AddAsync(new_rating);
                    }
                    await _context.SaveChangesAsync();
                    project.Rating = _context.Ratings.Where(c => c.ProjectID == projectID).Average(x => x.Rate);
                    _context.Update(project);
                    await _context.SaveChangesAsync();
                    response.Success = true;
                    response.Message = "Ok";
                    response.Data = _mapper.Map<ProjectDTO>(project);
                } else{
                    response.Success = false;
                    response.Message = MessageConstants.PROJECT_NOT_FOUND;
                }
            }catch(Exception e){
                response.Success = false;
                response.Message = e.Message;
            }
            return response;
        }

        public async Task<ServiceResponse<ProjectDTO>> UpdateProject(ProjectDTO project)
        {
            ServiceResponse<ProjectDTO> response = new ServiceResponse<ProjectDTO>();
            try{
                if(! await HasPermission(project.ProjectID)){
                    response.Success = false;
                    response.Message = MessageConstants.PROJECT_PERMISSION_MANAGE_DENIED;
                    return response;
                }
                if(await ProjectNameExists(project.ProjectName)){
                    response.Success = false;
                    response.Message = "Project name already exists please choose another name";
                    return response;
                }
                Project dbProject = await _context.Projects.FirstOrDefaultAsync(c => c.ProjectID == project.ProjectID);
                if(dbProject != null){
                    dbProject.ProjectName = project.ProjectName;
                    dbProject.ProjectDescription = project.ProjectDescription;
                    dbProject.ImageUrl = project.ImageUrl;
                    _context.Projects.Update(dbProject);
                    await _context.SaveChangesAsync();
                    response.Data = _mapper.Map<ProjectDTO>(dbProject)       ;
                    response.Success = true;
                    response.Message = "Ok" ;              
                }else{
                    response.Message = MessageConstants.PROJECT_NOT_FOUND;
                    response.Success = false;
                }
            }catch(Exception e){
                response.Message = e.Message;
                response.Success = false;
            }
            return response;
        }

        public async Task<ServiceResponse<byte[]>> GetProjectPdfById(int projectID){
            ServiceResponse<byte[]> response = new ServiceResponse<byte[]>();
            try{
                    Project project = await _context.Projects.FirstOrDefaultAsync(c => c.ProjectID == projectID);
                    if(project != null){
                        if(project.Status != "Approved" && GetUserRole() != "Admin" && GetUserRole() != "Whitelist"){
                            response.Message = MessageConstants.NOT_AUTHORIZED_TO_ACCESS;
                            response.Success = false;
                        }else{
                        response.Data = Convert.FromHexString(project.FileHex);
                        response.Message = "Ok";
                        response.Success = true;
                        }
                    }else{
                        response.Message = MessageConstants.PROJECT_NOT_FOUND;
                        response.Success = false;
                    }
            }catch(Exception e){
                response.Message = e.Message;
                response.Success = false;
            }
            return response;
        }
        
        public async Task<ServiceResponse<List<ProjectDTO>>> GetProjectsByStatus(string status){
            ServiceResponse<List<ProjectDTO>> response = new ServiceResponse<List<ProjectDTO>>();
            try{
                List<Project> projects = new List<Project>();
                if (GetUserRole() == "Admin" || GetUserRole() == "Whitelist")
                {
                    projects = await _context.Projects.Where(c => c.Status == status).ToListAsync();
                }else{
                    projects = await _context.Projects.Where(c => c.Status == "Approved").ToListAsync();
                }
                
                if (projects != null){
                    response.Data = (projects.Select(c => _mapper.Map<ProjectDTO>(c))).ToList();
                    response.Message = "Ok";
                    response.Success = true;
                }else{
                    response.Message = "No project found!";
                    response.Success = false;
                }
            }catch(Exception e){
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
                if(project != null){
                    ServiceResponse<List<EventLog<ProjectEvaluationEventDTO>>> resp = await _chainInteractionService.GetProjectEvaluationEventLogs();
                    if(!resp.Success){
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
                    string status = "Pending";
                    for (int i = 0; i < resp.Data.Count; i++)
                    {   
                        if((resp.Data[i].Log.Topics[1]).ToString() == ("0x"+ hash_Str).ToString() && resp.Data[i].Event.isApproved){
                            status = "Approved";
                            break;
                        }else if((resp.Data[i].Log.Topics[1]).ToString() == ("0x"+ hash_Str).ToString() && !resp.Data[i].Event.isApproved){
                            status = "Rejected";
                            break;
                        }
                    }
                    var temp = project.Status;
                    project.Status = status;
                    _context.Projects.Update(project);
                    await _context.SaveChangesAsync();
                    response.Success = true;
                    response.Message = "Status changed from "+temp+" to "+ status+".";
                    response.Data = _mapper.Map<ProjectDTO>(project) ;
                }else{
                    response.Success =false;
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
        public async Task<ServiceResponse<ProjectDTO>> UpdateMarkDown(int id, string markdown)
        {
            ServiceResponse<ProjectDTO> response = new ServiceResponse<ProjectDTO>();
            try{
                if(! await HasPermission(id)){
                    response.Success = false;
                    response.Message = MessageConstants.PROJECT_PERMISSION_MANAGE_DENIED;
                    return response;
                }
                Project dbProject = await _context.Projects.FirstOrDefaultAsync(c => c.ProjectID == id);
                if(dbProject != null){
                    dbProject.MarkDown = markdown;
                    _context.Update(dbProject);
                    await _context.SaveChangesAsync();
                    response.Data = _mapper.Map<ProjectDTO>(dbProject)       ;
                    response.Success = true;
                    response.Message = "Ok" ;              
                }else{
                    response.Message = MessageConstants.PROJECT_NOT_FOUND;
                    response.Success = false;
                }
            }catch(Exception e){
                response.Message = e.Message;
                response.Success = false;
            }
            return response;
        }
    
        public async Task<ServiceResponse<List<ProjectDTO>>> GetAllPermissionedProjects(){
            ServiceResponse<List<ProjectDTO>> response = new ServiceResponse<List<ProjectDTO>>();
            try{
                List<ProjectPermission> projects = await _context.ProjectPermissions.Where(c => c.UserID == GetUserId() && c.IsAccepted).ToListAsync();
                List<Project> allprojects = new List<Project>();
                if(projects != null){
                    for (int i = 0; i < projects.Count; i++)
                    {
                        Project project = await _context.Projects.FirstOrDefaultAsync(c => c.ProjectID == projects[i].ProjectID);
                        allprojects.Add(project);
                    }
                    response.Data = (allprojects.Select(c => _mapper.Map<ProjectDTO>(c))).ToList();
                    response.Success= true;
                    response.Message = "Ok";
                }else{
                    response.Success = false;
                    response.Message = String.Format("No permissioned projects found for user: {0}", GetUsername());
                }
            }catch(Exception e){
                response.Success = false;
                response.Message = e.Message;
            }
            return response;
        }    
    
        public async Task<bool> IsProjectSubmittedToChain(string fileHex){
            try{
                ServiceResponse<List<EventLog<ProjectRegisterEventDTO>>> response = await _chainInteractionService.GetRegisterEventLogs();
                if(response.Success){
                    SHA256 sha256 = SHA256.Create();
                    byte[] hashval = sha256.ComputeHash(Encoding.ASCII.GetBytes(fileHex));
                    StringBuilder sb = new StringBuilder();
                    foreach (byte b in hashval)
                    {
                        sb.Append(b.ToString("x2"));
                    }
                    String hash_Str = sb.ToString();
                    for (int i = 0; i < response.Data.Count ; i++)
                    {
                        if(response.Data[i].Log.Data == "0x"+hash_Str){
                            return true;
                        }
                    }
                    return false;
                }else{
                    return false;
                }
            }catch(Exception e){
                return false;
            }
        }

        public async Task<bool> HasPermission(int projectId)
        {
            if (await _context.ProjectPermissions.AnyAsync(x => x.ProjectID == projectId && x.UserID == GetUserId() && x.IsAccepted == true))
            {
                return true;
            }
            return false;
        }

        public async Task<bool> HasOwnerPermission(int projectId)
        {
            if (await _context.ProjectPermissions.AnyAsync(x => x.ProjectID == projectId && x.UserID == GetUserId() && x.Role == "Owner" && x.IsAccepted == true))
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
