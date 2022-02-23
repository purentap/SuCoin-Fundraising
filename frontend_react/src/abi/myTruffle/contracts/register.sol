// SPDX-License-Identifier: MIT
pragma solidity ^0.5.15;

contract ProjectRegister{
    mapping (address => bool) public whitelist;
    uint public whitelistedCount;
    address public admin;
    string[] public projectsApproved;
    struct vote{
        uint approved;
        uint rejected;
        bool exists;
        mapping (address => bool) voters;
    }
    mapping(string => vote) public projectsRegistered;
    
    event Register(
        address indexed from,
        string projectHash
    );
    constructor(){
        admin = msg.sender;
    }

    function addToWhiteList(address addrToAdd) public {
        require(admin == msg.sender, "Only admin");
        whitelist[addrToAdd] = true;
        whitelistedCount +=1;
    }

    function registerProject(string memory projectUrl) public{
        require(projectsRegistered[projectUrl].exists == false, 'Project Already Exists!!!');
        projectsRegistered[projectUrl].exists = true;
        emit Register(msg.sender, projectUrl);
        
    }

    function approveProject(string memory projectUrl) public{
        require(projectsRegistered[projectUrl].exists, 'Project does not exist');
        require(whitelist[msg.sender], 'User is not in whitelist');
        require(!projectsRegistered[projectUrl].voters[msg.sender], 'User already voted');
        projectsRegistered[projectUrl].approved +=1;
        projectsRegistered[projectUrl].voters[msg.sender] = true;
    }

    function rejectProject(string memory projectUrl) public{
        require(projectsRegistered[projectUrl].exists, 'Project does not exist');
        require(whitelist[msg.sender], 'User is not in whitelist');
        require(!projectsRegistered[projectUrl].voters[msg.sender], 'User already voted');
        projectsRegistered[projectUrl].rejected += 1;
        projectsRegistered[projectUrl].voters[msg.sender] = true;
    }

    function evaluatePendingProjectStatus(string memory projectUrl) public returns(bool){
        require(projectsRegistered[projectUrl].exists, 'Project does not exist');
        require((projectsRegistered[projectUrl].approved + projectsRegistered[projectUrl].rejected) > (whitelistedCount *3)/5, 'Not enough whitelisted users use their vote to make decision');
        if (projectsRegistered[projectUrl].approved > projectsRegistered[projectUrl].rejected) {
            projectsApproved.push(projectUrl);        
            return true;
        } else {
            return false;
        }
    }
    function listContains(address addr) public view returns(bool){
        return whitelist[addr];
    } 
/*
    function getAllPendingProjects() public view returns(bytes32[] memory){
        return projectsRegistered;
    }
*/
    function getAllApprovedProjects() public view returns(string[] memory){
        return projectsApproved;
    }
    
    function deleteApprovedProject(string memory projectUrl) public{
       
    }
}