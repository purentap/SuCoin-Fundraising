using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using SU_COIN_BACK_END.SU_COIN_INTERFACE;
using SU_COIN_BACK_END.Models;
using SU_COIN_BACK_END.DTOs;
using SU_COIN_BACK_END.Response;
using SU_COIN_BACK_END.Request;
using SU_COIN_BACK_END.Constants.MessageConstants;

namespace SU_COIN_BACK_END.Controllers
{
    [Authorize]
    [ApiController]
    [Route("[controller]")]
    public class ProjectController : ControllerBase
    {
        private readonly IProjectService _projectService;

        public ProjectController(IProjectService projectService)
        {
            _projectService = projectService;
        }

        [HttpGet]
        [Route("Get/All")]
        [AllowAnonymous]
        public async Task<IActionResult> GetAllProjects(bool withHex)
        {
            ServiceResponse<List<ProjectDTO>> response = await _projectService.GetProjects();
            if (!response.Success)
            {
                return BadRequest(response);
            }
            return Ok(response);
        }

        [HttpGet]
        [Route("Get/{id:int}")]
        public async Task<IActionResult> GetProjectByID(int Id)
        {
            ServiceResponse<ProjectDTO> response = await _projectService.GetProjectById(Id);
            if (!response.Success)
            {
                if (response.Message == MessageConstants.PROJECT_NOT_FOUND)
                {
                    return NotFound();
                }
                if (response.Message == MessageConstants.PROJECT_NOT_ACCEPTED_BY_VIEWER || response.Message == MessageConstants.NOT_AUTHORIZED_TO_ACCESS)
                {
                    return Forbid();
                }
                return BadRequest(response);
            }
            return Ok(response);
        }

        [HttpPut]
        [Route("Update")]
        public async Task<IActionResult> UpdateProject(ProjectDTO project)
        {
            ServiceResponse<ProjectDTO> response = await _projectService.UpdateProject(project);
            if (!response.Success)
            {
                if (response.Message == MessageConstants.PROJECT_NOT_FOUND)
                {
                    return NotFound();
                }
                if (response.Message == MessageConstants.PROJECT_PERMISSION_MANAGE_DENIED)
                {
                    return Forbid();
                }
                return BadRequest(response);
            }
            return Ok(response);
        }

        [HttpDelete]
        [Route("Delete/{id:int}")]
        public async Task<IActionResult> DeleteProject(int Id)
        {
            ServiceResponse<string> response = await _projectService.DeleteProject(Id);
            if (!response.Success)
            {
                if (response.Message == MessageConstants.PROJECT_NOT_FOUND)
                {
                    return NotFound();
                }
                if (response.Message == MessageConstants.PROJECT_PERMISSION_MANAGE_DENIED)
                {
                    return Forbid();
                }
                return BadRequest(response);
            }
            return StatusCode(StatusCodes.Status204NoContent);
        }

        [HttpPost]
        [Route("Add")]
        public async Task<IActionResult> AddProject(ProjectRequest project)
        {
            ServiceResponse<ProjectDTO> response = await _projectService.AddProject(project);
            if (!response.Success)
            {
                if (response.Message == MessageConstants.PROJECT_NOT_FOUND)
                {
                    return NotFound();
                }
                if (response.Message == MessageConstants.USER_IS_BLACKLISTED)
                {
                    return Forbid();
                }
                if (response.Message == "Viewer is busy. Please try again later")
                {
                    return StatusCode(StatusCodes.Status503ServiceUnavailable, response);
                }
                return BadRequest(response);
            }
            return Created($"projects/{response.Data.ProjectID}", response);
        }

        [HttpPut]
        [Route("Rate/{id:int}/{rating}")]
        public async Task<IActionResult> RateProject(int id, double rating)
        {
            ServiceResponse<ProjectDTO> response = await _projectService.RateProject(id, rating);
            if (!response.Success)
            {
                if (response.Message == MessageConstants.INVALID_INPUT)
                {
                    return BadRequest("Rating should be in [0,10]");
                }
                if (response.Message == MessageConstants.PROJECT_NOT_FOUND)
                {
                    return NotFound(response);
                }
                return BadRequest(response);
            }
            return Ok(response);
        }

        
        [HttpGet]
        [Route("GetByStatus/{status}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetProjectByStatus(string status)
        {
            ServiceResponse<List<ProjectDTO>> response = await _projectService.GetProjectsByStatus(status);
            if (!response.Success)
            {
                return BadRequest(response);
            }
            return Ok(response);
        }

        [HttpPut]
        [Route("[action]/{id:int}")]
        public async Task<IActionResult> ChangeStatus(int id) //Only admin or whitelisted can do it or it can be updated directly from blockchain
        {
            ServiceResponse<ProjectDTO> response = await _projectService.ChangeStatus(id);
            if (!response.Success)
            {
                if (response.Message == MessageConstants.PROJECT_NOT_ACCEPTED_BY_VIEWER || response.Message == MessageConstants.NOT_AUTHORIZED_TO_ACCESS)
                {
                    return Forbid();
                }
                return BadRequest(response);
            }
            return Ok(response);
        }

        [HttpPut]
        [Route("[action]/{id:int}/{markddown}")]
        public async Task<IActionResult> UpdateMarkDown(int id, string markdown)
        {
            ServiceResponse<ProjectDTO> response = await _projectService.UpdateMarkDown(id, markdown);
            if (!response.Success)
            {
                if (response.Message == MessageConstants.PROJECT_PERMISSION_MANAGE_DENIED || response.Message == MessageConstants.NOT_AUTHORIZED_TO_ACCESS)
                {
                    return Forbid();
                }
                if (response.Message == MessageConstants.PROJECT_NOT_FOUND)
                {
                    return NotFound();
                }
                return BadRequest(response);
            }
            return Ok(response);
        }

        [HttpGet]
        [Route("GetAllPermissioned/{withHex}")]
        public async Task<IActionResult> GetAllPermissionedProjects(bool withHex)
        {
            ServiceResponse<List<ProjectDTO>> response = await _projectService.GetAllPermissionedProjects(withHex);
            if (!response.Success)
            {
                return BadRequest(response);
            }
            return Ok(response);
        }

        [HttpGet]
        [Route("GetAllInvitations")]
        public async Task<IActionResult> GetAllInvitedProjects()
        {
            ServiceResponse<List<ProjectDTO>> response = await _projectService.GetAllInvitedProjects();
            if (!response.Success)
            {
                return BadRequest(response);
            }
            return Ok(response);
        }

        [HttpGet]
        [Route("[action]/{numberOfProjects:int}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetProjects(int numberOfProjects) 
        {
            ServiceResponse<List<ProjectDTO>> response = await _projectService.GetProjects(numberOfProjects: numberOfProjects);
            if (!response.Success)
            {
                if (response.Message == MessageConstants.PROJECT_NOT_FOUND)
                {
                    return NotFound();
                }
                return BadRequest(response);
            }
            return Ok(response);
        }

        [HttpGet]
        [Route("[action]/{areOnlyAuctionsStarted}")]
        public async Task<IActionResult> GetAllHashes(bool areOnlyAuctionsStarted)
        {
            ServiceResponse<List<string>> response = await _projectService.GetAllFileHashes(areOnlyAuctionsStarted);
            if (!response.Success)
            {
                if (response.Message == MessageConstants.NOT_AUTHORIZED_TO_ACCESS)
                {
                    return Forbid();
                }
                return BadRequest(response);
            }
            return Ok(response);
        }

        [HttpPut]
        [Route("ViewerReply/{id:int}/{reply}")]
        public async Task<IActionResult> ReplyProjectPreview(int id, bool reply)
        {            
            ServiceResponse<string> response = await _projectService.ReplyProjectPreview(id, reply);
            if (!response.Success)
            {
                if (response.Message == MessageConstants.PROJECT_NOT_FOUND)
                {
                    return NotFound();
                }
                return BadRequest(response);
            }
            return Ok(response);
        }

        [HttpPut]
        [Route("[action]/{id:int}")]
        public async Task<IActionResult> CreateAuction(int id)
        {
            ServiceResponse<string> response = await _projectService.CreateAuction(id);
            if (!response.Success)
            {
                if (response.Message == MessageConstants.PROJECT_NOT_FOUND)
                {
                    return NotFound();
                }
                if (response.Message == MessageConstants.PROJECT_NOT_ACCEPTED_BY_VIEWER || response.Message == MessageConstants.PROJECT_PERMISSION_MANAGE_DENIED)
                {
                    return Forbid();
                }
                return BadRequest(response);
            }
            return Ok(response);
        }

        [HttpPut]
        [Route("[action]/{id:int}")]
        public async Task<IActionResult> StartAuction(int id)
        {            
            ServiceResponse<string> response = await _projectService.StartAuction(id);
            if (!response.Success)
            {
                if (response.Message == MessageConstants.PROJECT_NOT_FOUND)
                {
                    return NotFound();
                }
                if (response.Message == MessageConstants.PROJECT_PERMISSION_MANAGE_DENIED)
                {
                    return Forbid();
                }
                return BadRequest(response);
            }
            return Ok(response);
        }
    }
}
