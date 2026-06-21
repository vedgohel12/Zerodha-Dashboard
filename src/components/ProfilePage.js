import React, { useState } from "react";
import "./ProfilePage.css";

const ProfilePage = ({ user }) => {
  const [activeTab, setActiveTab] = useState("personal");
  const [saved, setSaved] = useState(false);

  const [personal, setPersonal] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    dob: user?.dob || "",
    gender: user?.gender || "",
    address: user?.address || "",
  });

  const [kyc, setKyc] = useState({
    pan: user?.pan || "",
    bankAccount: user?.bankAccount || "",
    ifsc: user?.ifsc || "",
  });

  const [nominee, setNominee] = useState({
    nomineeName: user?.nomineeName || "",
    nomineeRelation: user?.nomineeRelation || "",
    nomineePhone: user?.nomineePhone || "",
  });

  // Derived from live state so avatar updates when name is edited
  const initials = personal.fullName
    ? personal.fullName.split(" ").filter(Boolean).map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : (user?.email ? user.email[0].toUpperCase() : "U");

  const showSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const tabs = [
    { key: "personal", label: "Personal Info", icon: "👤" },
    { key: "kyc", label: "KYC & Bank", icon: "🏦" },
    { key: "nominee", label: "Nominee", icon: "👥" },
  ];

  // isMobile check for hiding email field
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 640;

  const Field = ({ label, type = "text", value, onChange, placeholder, readOnly, hideOnMobile }) => {
    if (hideOnMobile && isMobile) return null;
    return (
      <div className="profile-field">
        <label className="profile-field__label">{label}</label>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          className={`profile-field__input${readOnly ? " profile-field__input--readonly" : ""}`}
        />
      </div>
    );
  };

  const SelectField = ({ label, value, onChange, options }) => (
    <div className="profile-field">
      <label className="profile-field__label">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="profile-field__select"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );

  const SaveButton = ({ onClick }) => (
    <div className="profile-save-row">
      <button className="profile-save-btn" onClick={onClick}>
        Save Changes
      </button>
      {saved && <span className="profile-save-success">✓ Saved successfully</span>}
    </div>
  );

  return (
    <div className="profile-page">

      {/* Header — hidden on mobile via CSS */}
      <div className="profile-header">
        <div className="profile-avatar">{initials}</div>
        <div className="profile-header__info">
          <p className="profile-header__name">{user?.fullName || "User"}</p>
          <p className="profile-header__email">{user?.email}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`profile-tab${activeTab === tab.key ? " profile-tab--active" : ""}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="profile-card">

        {/* Personal Info */}
        {activeTab === "personal" && (
          <div>
            <h3 className="profile-section-title">Personal Information</h3>
            <div className="profile-grid">
              <div className="profile-grid__full">
                <Field
                  label="Full Name"
                  value={personal.fullName}
                  onChange={(v) => setPersonal({ ...personal, fullName: v })}
                  placeholder="Enter your full name"
                />
              </div>
              {/* Email — hidden on mobile */}
              <Field
                label="Email"
                type="email"
                value={personal.email}
                onChange={() => {}}
                placeholder="Email address"
                readOnly
                hideOnMobile
              />
              <Field
                label="Phone"
                type="tel"
                value={personal.phone}
                onChange={(v) => setPersonal({ ...personal, phone: v })}
                placeholder="10 digit mobile number"
              />
              <Field
                label="Date of Birth"
                type="date"
                value={personal.dob}
                onChange={(v) => setPersonal({ ...personal, dob: v })}
              />
              <SelectField
                label="Gender"
                value={personal.gender}
                onChange={(v) => setPersonal({ ...personal, gender: v })}
                options={[
                  { value: "", label: "Select gender" },
                  { value: "male", label: "Male" },
                  { value: "female", label: "Female" },
                  { value: "other", label: "Other" },
                ]}
              />
              <div className="profile-grid__full">
                <div className="profile-field">
                  <label className="profile-field__label">Address</label>
                  <textarea
                    value={personal.address}
                    onChange={(e) => setPersonal({ ...personal, address: e.target.value })}
                    placeholder="Enter your full address"
                    rows={3}
                    className="profile-field__textarea"
                  />
                </div>
              </div>
            </div>
            <SaveButton onClick={() => { console.log("Personal saved:", personal); showSaved(); }} />
          </div>
        )}

        {/* KYC & Bank */}
        {activeTab === "kyc" && (
          <div>
            <h3 className="profile-section-title">KYC & Bank Details</h3>
            <p className="profile-section-subtitle">These details are sensitive. Please keep them secure.</p>
            <Field
              label="PAN Card Number"
              value={kyc.pan}
              onChange={(v) => setKyc({ ...kyc, pan: v.toUpperCase() })}
              placeholder="ABCDE1234F"
            />
            <Field
              label="Bank Account Number"
              value={kyc.bankAccount}
              onChange={(v) => setKyc({ ...kyc, bankAccount: v })}
              placeholder="Enter account number"
            />
            <Field
              label="IFSC Code"
              value={kyc.ifsc}
              onChange={(v) => setKyc({ ...kyc, ifsc: v.toUpperCase() })}
              placeholder="SBIN0001234"
            />
            <div className="profile-info-box">
              💡 PAN format: 5 letters + 4 digits + 1 letter (e.g. ABCDE1234F)
            </div>
            <SaveButton onClick={() => { console.log("KYC saved:", kyc); showSaved(); }} />
          </div>
        )}

        {/* Nominee */}
        {activeTab === "nominee" && (
          <div>
            <h3 className="profile-section-title">Nominee Details</h3>
            <p className="profile-section-subtitle">
              Your nominee will receive your investments in case of an unfortunate event.
            </p>
            <Field
              label="Nominee Full Name"
              value={nominee.nomineeName}
              onChange={(v) => setNominee({ ...nominee, nomineeName: v })}
              placeholder="Enter nominee's full name"
            />
            <SelectField
              label="Relationship with Nominee"
              value={nominee.nomineeRelation}
              onChange={(v) => setNominee({ ...nominee, nomineeRelation: v })}
              options={[
                { value: "", label: "Select relationship" },
                { value: "spouse", label: "Spouse" },
                { value: "father", label: "Father" },
                { value: "mother", label: "Mother" },
                { value: "son", label: "Son" },
                { value: "daughter", label: "Daughter" },
                { value: "brother", label: "Brother" },
                { value: "sister", label: "Sister" },
                { value: "other", label: "Other" },
              ]}
            />
            <Field
              label="Nominee Phone"
              type="tel"
              value={nominee.nomineePhone}
              onChange={(v) => setNominee({ ...nominee, nomineePhone: v })}
              placeholder="Enter nominee's mobile number"
            />
            <SaveButton onClick={() => { console.log("Nominee saved:", nominee); showSaved(); }} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;