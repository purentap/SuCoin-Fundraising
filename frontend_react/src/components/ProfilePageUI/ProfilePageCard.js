import { Wrapper } from "./ProfilePageCard.styles";

const ProfilePageCard = (props) => {
    
  return (
    <Wrapper>
      <h1>Welcome {props.name}</h1>
      <div>
        <h5>
          Username: <p>{props.username}</p>
        </h5>
        <h5>
          Name: <p>{props.name}</p>{" "}
        </h5>
        <h5>
          Surname: <p>{props.surname}</p>{" "}
        </h5>
        <h5>
          Email: <p>{props.email}</p>
        </h5>
        <h5>
          Wallet Address: <p>{props.address}</p>
        </h5>
      </div>
      <button>Edit User Information</button>
    </Wrapper>
  );
};

export default ProfilePageCard;
