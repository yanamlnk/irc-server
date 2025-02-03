import React from "react";

const UserList = ({ users }) => {
  return (
    <div className="sidebar-right">
      <h3>Utilisateurs</h3>
      <ul>
        {users.map((user, index) => (
          <li key={user.user_id || index}>{user.nickname}</li>
        ))}
      </ul>
    </div>
  );
};

export default UserList;