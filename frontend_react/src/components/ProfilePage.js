import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import ProfilePageCard from "./ProfilePageUI/ProfilePageCard";
import ProjectsCard from "./ProfilePageUI/ProjectsCard";
var user = [];

const config = {
  headers: {
    "Content-type": "application/json",
  },
};

const ProfilePage = () => {
  const [User, setUser] = useState(user);

  useEffect(async () => {
    try {
      const apiInstance = axios.create({
        baseURL: "https://localhost:5001",
      });
      apiInstance.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${Cookies.get("token")}`;
      let response2 = new Promise((resolve, reject) => {
        apiInstance
          .get("/User/Get")
          .then((res) => {
            console.log("response: ", res.data);
            resolve(res);
          })
          .catch((e) => {
            const err = "Unable to get the user";
            reject(err);
          });
      });
      let result = await response2;
      console.log("User get request is successful", result);
      setUser(result.data.data);
    } catch (error) {
      console.log(error);
    }
  }, []);

  return (
    <ProfilePageCard
      name={User.name}
      surname={User.surname}
      address={User.address}
      email={User.email}
      username={User.username}
    />
    
  );
};

export default ProfilePage;
