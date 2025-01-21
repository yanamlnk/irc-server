import React from "react";
import "./UsernameForm.css";

const UsernameForm = ({ handleSetUsername }) => {
  return (
    <div className="username-form-container">
      <h1>Bienvenue !</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSetUsername(e.target.elements.username.value);
        }}
      >
        <div className="form-group">
          <input type="text" name="username" placeholder="Entrez votre nom d'utilisateur" />
          <button type="submit">Valider</button>
        </div>
        <div className="form-group">
          <button type="button" onClick={() => handleSetUsername("")}>
            Générer un nom aléatoire
          </button>
        </div>
      </form>
    </div>
  );
};

export default UsernameForm;