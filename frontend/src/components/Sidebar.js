import React from "react";

const Sidebar = ({ view, setView, channels, selectedChannel, setSelectedChannel, isMenuOpen, setIsMenuOpen, renameChannel, deleteChannel, users }) => {
  return (
    <div className={`sidebar-left ${isMenuOpen ? "open" : ""}`}>
      <h3>Navigation</h3>
      {view === "channels" ? (
        <ul>
          {channels.map((channel, index) => (
            <li
              key={channel.channel_id || index}
              className={selectedChannel === channel.name ? "selected" : ""}
            >
              <span
                onClick={() => {
                  setSelectedChannel(channel.name);
                  setIsMenuOpen(false);
                }}
              >
                {channel.name}
              </span>
              <div className="channel-actions">
                <i
                  className="fas fa-edit small"
                  title="Renommer"
                  onClick={() => renameChannel(channel.channel_id)}
                ></i>
                <i
                  className="fas fa-trash-alt small"
                  title="Supprimer"
                  onClick={() => deleteChannel(channel.channel_id)}
                ></i>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <ul>
          {users.map((user, index) => (
            <li key={index}>{user}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Sidebar;