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
    public class UserController: ControllerBase
    { 
        private readonly IUserService _userInterface;

        public UserController(IUserService userInterface)
        {
            _userInterface = userInterface;
        }

        [HttpGet]
        [Route("[action]")]
        public async Task<IActionResult> Get() //might also deliver the permission not only invitations
        { 
            ServiceResponse<UserDTO> response = await _userInterface.GetUser();
            if (!response.Success)
            {
                if (response.Message == MessageConstants.USER_NOT_FOUND)
                {
                    return NotFound();
                }
                return BadRequest(response);
            }
            return Ok(response);
        } 

        [HttpPut]
        [Route("[action]")]
        public async Task<IActionResult> Update(UserDTO request)
        {
            ServiceResponse<UserDTO> response = await _userInterface.UpdateUser(request);
            if (!response.Success)
            {
                if (response.Message == MessageConstants.USER_NOT_FOUND)
                {
                    return NotFound();
                }
                return BadRequest(response);
            }
            return Ok(response);
        } 

        [HttpDelete]
        [Route("[action]")]
        public async Task<IActionResult> Delete()
        {
            ServiceResponse<string> response = await _userInterface.DeleteUser();
            if (!response.Success)
            {
                if (response.Message == MessageConstants.USER_NOT_FOUND)
                {
                    return NotFound();
                }
                return BadRequest(response);
            }
            return StatusCode(StatusCodes.Status204NoContent);
        } 

        [HttpPost]
        [Route("Invite")]
        public async Task<IActionResult> InviteToProject(ProjectPermissionRequest request)
        {
            ServiceResponse<int> response = await _userInterface.GivePermissionToProject(request);
            if (!response.Success)
            {
                if (response.Message == MessageConstants.PROJECT_PERMISSION_MANAGE_DENIED)
                {
                    return Forbid();
                }
                if (response.Message == MessageConstants.PROJECT_NOT_FOUND || response.Message == MessageConstants.USER_NOT_FOUND)
                {
                    return NotFound(response);
                }
                return BadRequest(response);
            }
            return Created($"user/invite/{response.Data}", response);
        } 

        [HttpPut]
        [Route("InvitationReply")]
        public async Task<IActionResult> ReplyProjectInvitation(ProjectPermissionRequest request)
        {
            ServiceResponse<string> response = await _userInterface.EvaluatePendingProjectPermission(request);
            if (!response.Success)
            {
                if (response.Message == MessageConstants.PROJECT_NOT_FOUND || response.Message == MessageConstants.USER_NOT_FOUND)
                {
                    return NotFound(response);
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
        [Route("GetAll")]
        public async Task<IActionResult> GetAllUsers() //Only for admin
        { 
            ServiceResponse<List<UserDTO>> response = await _userInterface.GetAllUsers();
            if (!response.Success)
            {
                if (response.Message == MessageConstants.NOT_AUTHORIZED_TO_ACCESS)
                {
                    return Forbid();
                }
                if (response.Message == MessageConstants.USER_NOT_FOUND)
                {
                    return NotFound(response);
                }
                return BadRequest(response);
            }
            return Ok(response);
        }

        [HttpDelete]
        [Route("[action]")]
        public async Task<IActionResult> RemoveCollab(ProjectPermissionRequest request)
        {
            ServiceResponse<string> response = await _userInterface.RemovePermissionToProject(request);
            if (!response.Success)
            {
                if (response.Message == MessageConstants.PROJECT_PERMISSION_MANAGE_DENIED)
                {
                    return Forbid();
                }
                if (response.Message == MessageConstants.PROJECT_NOT_FOUND || response.Message == MessageConstants.USER_NOT_FOUND)
                {
                    return NotFound(response);
                }
                return BadRequest(response);
            }
            return StatusCode(StatusCodes.Status204NoContent);
        }

        [HttpPatch]
        [Route("[action]/{address}")]
        public async Task<IActionResult> ChangeUserRole(string address)
        {
            ServiceResponse<string> response = await _userInterface.ChangeUserRole(address);
            if (!response.Success)
            {
                if (response.Message == MessageConstants.NOT_AUTHORIZED_TO_ACCESS)
                {
                    return Forbid();
                }
                if (response.Message == MessageConstants.USER_NOT_FOUND || response.Message == MessageConstants.CONTRACT_NOT_FOUND
                    || response.Message == MessageConstants.USER_ROLE_NOT_FOUND_IN_CHAIN)
                {
                    return NotFound(response);
                }
                if (response.Message == MessageConstants.CHAIN_INTERACTION_FAIL)
                {
                    return StatusCode(StatusCodes.Status408RequestTimeout, response);
                }
            }
            return Ok(response);
        }
    }
}