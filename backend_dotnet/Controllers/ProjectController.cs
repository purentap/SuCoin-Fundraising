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
        [Route("[action]")]
        public async Task<IActionResult> Update(ProjectDTO project)
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
        [Route("[action]/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            ServiceResponse<string> response = await _projectService.DeleteProject(id);
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
                if (response.Message == MessageConstants.IPFS_INTERACTION_FAIL)
                {
                    return StatusCode(StatusCodes.Status408RequestTimeout, response);
                }
                return BadRequest(response);
            }
            return NoContent();
        }

        [HttpPost]
        [Route("[action]")]
        public async Task<IActionResult> Add(ProjectRequest project)
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
                if (response.Message != null && response.Message.StartsWith(MessageConstants.UPLOAD_FILE_TOO_LARGE)) {
                    return StatusCode(StatusCodes.Status400BadRequest,response.Message);
                }
                
                if (response.Message == MessageConstants.IPFS_INTERACTION_FAIL)
                {
                    return StatusCode(StatusCodes.Status408RequestTimeout, response.Message);
                }
                if (response.Message == "Viewer is busy. Please try again later")
                {
                    return StatusCode(StatusCodes.Status503ServiceUnavailable, response.Message);
                }
                if (response.Message == MessageConstants.PROJECT_ADD_FAIL)
                {
                    return StatusCode(StatusCodes.Status500InternalServerError, response.Message);
                }
                return BadRequest(response);
            }

            if (response.Data == null) // Even response is returned successfully, data inside project might not be processed well
            {
                return NotFound();
            }

            return Created($"projects/{response.Data.ProjectID}", response);
        }

        [HttpPut]
        [Route("[action]/{id:int}/{rating}")]
        public async Task<IActionResult> Rate(int id, double rating)
        {
            ServiceResponse<ProjectDTO> response = await _projectService.RateProject(id, rating);
            if (!response.Success)
            {
                if (response.Message == MessageConstants.INVALID_INPUT)
                {
                    return BadRequest("Rating should be in [0, 5]");
                }
                if (response.Message == MessageConstants.PROJECT_NOT_FOUND)
                {
                    return NotFound(response);
                }
                if (response.Message == MessageConstants.NOT_AUTHORIZED_TO_ACCESS)
                {
                    return Forbid();
                }
                return BadRequest(response);
            }
            return Ok(response);
        }

        
        [HttpGet]
        [Route("[action]/{status}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetByStatus(string status)
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
        public async Task<IActionResult> ChangeStatus(int id) // Only whitelisted user can do it
        {
            ServiceResponse<ProjectDTO> response = await _projectService.ChangeProjectStatus(id);
            if (!response.Success)
            {
                if (response.Message == MessageConstants.PROJECT_NOT_ACCEPTED_BY_VIEWER || response.Message == MessageConstants.NOT_AUTHORIZED_TO_ACCESS)
                {
                    return Forbid();
                }
                if (response.Message == MessageConstants.CHAIN_INTERACTION_FAIL)
                {
                    return StatusCode(StatusCodes.Status408RequestTimeout, response);
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
        [Route("[action]/{withHex}")]
        public async Task<IActionResult> GetAllPermissioned(bool withHex)
        {
            ServiceResponse<List<ProjectDTO>> response = await _projectService.GetAllPermissionedProjects(withHex);
            if (!response.Success)
            {
                return BadRequest(response);
            }
            return Ok(response);
        }

        [HttpGet]
        [Route("[action]")]
        public async Task<IActionResult> GetAllInvitations()
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
        public async Task<IActionResult> GetProjects(int numberOfProjects) // Get Top N rated projects where N is the number of projects as input parameter
        {
            ServiceResponse<List<ProjectDTO>> response = await _projectService.GetProjects(numberOfProjects: numberOfProjects, orderByRating: true);
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
            ServiceResponse<List<string?>> response = await _projectService.GetAllFileHashes(areOnlyAuctionsStarted);
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
                if (response.Message == MessageConstants.NOT_AUTHORIZED_TO_ACCESS)
                {
                    return Forbid();
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

            Console.WriteLine(response.Message);
            if (!response.Success)
            {
                if (response.Message == MessageConstants.PROJECT_NOT_FOUND || response.Message == MessageConstants.CONTRACT_NOT_FOUND 
                    || response.Message == MessageConstants.PROJECT_NOT_FOUND_IN_CHAIN)
                {
                    return NotFound();
                }
                if (response.Message == MessageConstants.PROJECT_NOT_ACCEPTED_BY_VIEWER || response.Message == MessageConstants.PROJECT_PERMISSION_MANAGE_DENIED)
                {
                    return Forbid();
                }
                if (response.Message == MessageConstants.CHAIN_INTERACTION_FAIL)
                {
                    return StatusCode(StatusCodes.Status408RequestTimeout, response);
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
                if (response.Message == MessageConstants.PROJECT_NOT_FOUND || response.Message == MessageConstants.CONTRACT_NOT_FOUND
                    || response.Message == MessageConstants.PROJECT_NOT_FOUND_IN_CHAIN || response.Message == MessageConstants.AUCTION_NOT_FOUND
                    || response.Message == MessageConstants.AUCTION_NOT_STARTED)
                {
                    return NotFound();
                }
                if (response.Message == MessageConstants.PROJECT_PERMISSION_MANAGE_DENIED || response.Message == MessageConstants.NOT_AUTHORIZED_TO_ACCESS)
                {
                    return Forbid();
                }
                return BadRequest(response);
            }
            return Ok(response);
        }

        [HttpGet]
        [Route("ViewerPage/GetAll")]
        public async Task<IActionResult> GetProjectsForViewerPage()
        {
            ServiceResponse<List<ProjectDTO>> response = await _projectService.GetProjectsForViewerPage();
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

    }
}
