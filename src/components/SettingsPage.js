import React, { useState } from "react";
import "./SettingsPage.css";

const SettingsPage = ({ user, darkMode, setDarkMode }) => {
  const [notifications, setNotifications] = useState(true);
  const [twoFA, setTwoFA] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);

  const handlePasswordChange = () => {
    setPasswordError("");
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      setPasswordError("All fields are required.");
      return;
    }
    if (passwords.new.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (passwords.new !== passwords.confirm) {
      setPasswordError("New passwords do not match.");
      return;
    }
    console.log("Password change requested");
    setPasswords({ current: "", new: "", confirm: "" });
    setPasswordSaved(true);
    setTimeout(() => setPasswordSaved(false), 2000);
  };

  const Toggle = ({ value, onChange }) => (
    <div
      onClick={() => onChange(!value)}
      className={`settings-toggle${value ? " settings-toggle--on" : ""}`}
    >
      <div className="settings-toggle__knob" />
    </div>
  );

  const SectionTitle = ({ title }) => (
    <p className="settings-section-title">{title}</p>
  );

  const Card = ({ children, danger }) => (
    <div className={`settings-card${danger ? " settings-card--danger" : ""}`}>
      {children}
    </div>
  );

  const Row = ({ children, last }) => (
    <div className={`settings-row${last ? " settings-row--last" : ""}`}>
      {children}
    </div>
  );

  const PasswordField = ({ label, value, onChange, placeholder }) => (
    <div className="settings-pw-field">
      <label className="settings-pw-field__label">{label}</label>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="settings-pw-field__input"
      />
    </div>
  );

  return (
    <div className="settings-page">
      <h2 className="settings-page__heading">Settings</h2>

      {/* Preferences */}
      <SectionTitle title="Preferences" />
      <Card>
        <Row>
          <div className="settings-row__spread">
            <div>
              <p className="settings-row__label">Order Notifications</p>
              <p className="settings-row__desc">Receive alerts for order updates and executions</p>
            </div>
            <Toggle value={notifications} onChange={setNotifications} />
          </div>
        </Row>
        <Row last>
          <div className="settings-row__spread">
            <div>
              <p className="settings-row__label">Dark Mode</p>
              <p className="settings-row__desc">Switch to a darker color theme</p>
            </div>
            <Toggle value={darkMode} onChange={setDarkMode} />
          </div>
        </Row>
      </Card>

      {/* Security */}
      <SectionTitle title="Security" />
      <Card>
        <Row>
          <div className="settings-row__spread">
            <div>
              <p className="settings-row__label">Two-Factor Authentication</p>
              <p className="settings-row__desc">Add an extra layer of security to your account</p>
            </div>
            <Toggle value={twoFA} onChange={setTwoFA} />
          </div>
        </Row>
        <Row last>
          <p className="settings-row__label" style={{ marginBottom: "16px" }}>Change Password</p>
          <PasswordField
            label="Current Password"
            value={passwords.current}
            onChange={(v) => setPasswords({ ...passwords, current: v })}
            placeholder="Enter current password"
          />
          <PasswordField
            label="New Password"
            value={passwords.new}
            onChange={(v) => setPasswords({ ...passwords, new: v })}
            placeholder="Minimum 8 characters"
          />
          <PasswordField
            label="Confirm New Password"
            value={passwords.confirm}
            onChange={(v) => setPasswords({ ...passwords, confirm: v })}
            placeholder="Re-enter new password"
          />
          {passwordError && (
            <p className="settings-pw-error">⚠ {passwordError}</p>
          )}
          <div className="settings-pw-actions">
            <button className="settings-btn" onClick={handlePasswordChange}>
              Update Password
            </button>
            {passwordSaved && (
              <span className="settings-save-success">✓ Password updated successfully</span>
            )}
          </div>
        </Row>
      </Card>

      {/* Account Info */}
      <SectionTitle title="Account" />
      <Card>
        <Row>
          <div className="settings-row__spread">
            <span className="settings-row__desc">Email</span>
            <span className="settings-row__value">{user?.email || "—"}</span>
          </div>
        </Row>
        <Row last>
          <div className="settings-row__spread">
            <span className="settings-row__desc">Member Since</span>
            <span className="settings-row__value">
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "long",
                  })
                : "—"}
            </span>
          </div>
        </Row>
      </Card>

      {/* Danger Zone */}
      <SectionTitle title="Danger Zone" />
      <Card danger>
        <Row last>
          <div className="settings-row__spread">
            <div>
              <p className="settings-row__label settings-row__label--danger">Delete Account</p>
              <p className="settings-row__desc">This action is permanent and cannot be undone</p>
            </div>
            <button
              className="settings-btn settings-btn--danger"
              onClick={() => {
                if (window.confirm("Are you sure you want to delete your account? This cannot be undone.")) {
                  console.log("Account deletion requested");
                }
              }}
            >
              Delete Account
            </button>
          </div>
        </Row>
      </Card>
    </div>
  );
};

export default SettingsPage;