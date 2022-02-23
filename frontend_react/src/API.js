/*

const apiSettings = {

};

export default apiSettings;
*/

import ProjectRegister from './abi/project.json'
import Web3 from 'web3';

export default {
    fetchProjects: async (contract, searchTerm, page) => {
        return [
            { name: "mert", descrp: "a project", id: "0" },
            { name: "ege", descrp: "b project", id: "1" },
            { name: "volk", descrp: "c project", id: "2" },
            { name: "puren", descrp: "d project", id: "3" },
        ];
    },

    fetchProject: async (contract, projectId) => {
        var proj = await contract.methods.registeredProjects(projectId).call();
        console.log(proj)
        return proj;
    },

    fetchProjectCount: async (contract) => {
        var projCount = await contract.methods.getProjectCount().call();
        console.log(projCount)
        return projCount;
    },

    fetchWhitelistOfProject: async (contract, projectId, addr) => {
        try {
            var projCount = await contract.methods.isWhitelisted(projectId, addr).call();
        console.log(projCount)
        return projCount;
            
        } catch (error) {
            console.log(error)
        }
        
    }
    
}