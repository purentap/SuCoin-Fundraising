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
    [ApiController]
    [Route("[controller]")]
    public class AuthenticationController: ControllerBase
    {       
        private readonly IAuthencticationService _authenticationService;
        public AuthenticationController(IAuthencticationService authencticationService)
        {
            _authenticationService = authencticationService;
        }

        [HttpPost]
        [Route("[action]")]
        [AllowAnonymous]
        public async Task<IActionResult> Login(UserLoginRequest request)
        {
            ServiceResponse<string> response = await _authenticationService.Login(request);
            if (!response.Success)
            {
                if (response.Message == MessageConstants.USER_NOT_FOUND)
                {
                    return NotFound();
                }
                if (response.Message == null)
                {
                    return StatusCode(StatusCodes.Status500InternalServerError, "null Message");
                }
                return BadRequest(response);
            }
            return Ok(response);
        } 

        [HttpPost]
        [Route("[action]")]
        [AllowAnonymous]
        public async Task<IActionResult> Register(UserRegisterRequest request)
        {
            ServiceResponse<string> response = await _authenticationService.Register(request);
            if (!response.Success)
            {                
                if (response.Message == null)
                {
                    return StatusCode(StatusCodes.Status500InternalServerError, "null Message");
                }
                return BadRequest(response);
            }
            return Created($"users/{response.Data}", request);

        }

        [HttpGet]
        [Route("[action]/{address}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetNonce(string address)
        {
            ServiceResponse<int> response = await _authenticationService.GetNonce(address);
            if (!response.Success)
            {
                if (response.Message == MessageConstants.USER_NOT_FOUND)
                {
                    return NotFound(response);
                }
                return BadRequest(response);
            }
            return Ok(response);
        } 
    }      
}