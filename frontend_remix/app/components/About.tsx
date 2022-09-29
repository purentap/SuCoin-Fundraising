export default function About () {
  return (
    <div className="p-10 flex flex-col space-y-10">
      <p className="font-semibold text-lg">About SULaunch</p>

      <p>SULaunch is an ENS491/492 project offered at the Sabanci University as a graduation project. The main aim of this project is to introduce Blockchain technology to CS enthusiasts and wants to explore new technology. </p>

      <p>This project aims to create the foundation for the utilization of blockchain technology in Sabanci University through a utility token (SuCoin) deployed on one of the EVM compatible blockchains. The main priority is to provide a fundraising platform for students to propose their projects and distribute their project’s tokens for funds via the auction mechanism provided by our system. The process will be as basic as possible for users to use blockchain technology, most of the key features of our project will be automated through the smart contracts and the backend server. One of the key points of this part of the project is to protect the ideas of the project proposers as in the real world, fundraising can be vulnerable to the theft of ideas. The project provides a hybrid solution where both traditional databases and a blockchain are utilized to provide a safety measure. This is achieved through saving the hash of the project details in the blockchain and commercialized versions of the project details in the database. This lets users be able to show the ownership of the document through their wallet and the logs in the blockchain by our web application during the applying process. The motivation for the project lies in the safety of the project’s owner’s rights, decentralization of the funding mechanisms around the schools, and providing a solid foundation for the later blockchain use cases which can be utilized through SUCoin.</p>
    </div>
  )
}