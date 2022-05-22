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
using Nethereum.Contracts;
using SU_COIN_BACK_END.Constants.UserRoleConstants;
using SU_COIN_BACK_END.Constants.MessageConstants;

namespace SU_COIN_BACK_END.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class EventDebugController: ControllerBase
    {       
        private readonly IChainInteractionService _chainInteractionService;
        public EventDebugController(IChainInteractionService chainInteractionService)
        {
            _chainInteractionService = chainInteractionService;
        }

        [HttpGet]
        [Route("[action]")]
        public async Task<IActionResult> Debug() 
        {
            ServiceResponse<List<EventLog<ProjectEvaluationEventDTO>>> response = await _chainInteractionService.GetProjectEvaluationEventLogs();
            if (!response.Success)
            {
                if (response.Message == MessageConstants.EVENT_NOT_FOUND)
                {
                    return NotFound(response);
                }
                return StatusCode(StatusCodes.Status408RequestTimeout, response);
            }
            return Ok(response);
        }

        [HttpGet]
        [Route("[action]/{address}")]
        public async Task<IActionResult> DebugRemove(string address) 
        {
            ServiceResponse<List<EventLog<WhitelistRemoveEventDTO>>> response = await _chainInteractionService.GetWhiteListRemoveEventLogs(address);
            if (!response.Success)
            {
                if (response.Message == MessageConstants.NOT_WHITLISTED)
                {
                    return BadRequest(response);
                }
                if (response.Message == MessageConstants.EVENT_NOT_FOUND)
                {
                    return NotFound(response);
                }
                return StatusCode(StatusCodes.Status408RequestTimeout, response);
            }
            return Ok(response);
        }

        [HttpGet]
        [Route("[action]/{address}")]
        public async Task<IActionResult> DebugAdd(string address) 
        {
            ServiceResponse<List<EventLog<WhitelistInsertEventDTO>>> response = await _chainInteractionService.GetWhiteListInsertEventLogs(address);
            if (!response.Success)
            {
                if (response.Message == MessageConstants.NOT_WHITLISTED)
                {
                    return BadRequest(response);
                }
                if (response.Message == MessageConstants.EVENT_NOT_FOUND)
                {
                    return NotFound(response);
                }
                return StatusCode(StatusCodes.Status408RequestTimeout, response);
            }
            return Ok(response);
        }

        [HttpGet]
        [Route("Whitelisted/{address}")]
        public async Task<IActionResult> IsWhiteListed(string address) 
        {
            ServiceResponse<string> chainResponse = await _chainInteractionService.GetChainRole(address);

            if (!chainResponse.Success)
            {
                if (chainResponse.Message == MessageConstants.CHAIN_INTERACTION_FAIL)
                {
                    return StatusCode(StatusCodes.Status408RequestTimeout, chainResponse);
                }
                return BadRequest(chainResponse);
            }

            bool response = (chainResponse.Data == UserRoleConstants.WHITELIST);
            return Ok(response);
        }
    }
}