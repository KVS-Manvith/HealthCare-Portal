import React, { useEffect, useState } from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { getUserById, updateUser } from "../services/api";
import { getCurrentUser, setCurrentUser } from "../utils/auth";

type User = {
  id: number;
  fullName?: string;
  email?: string;
  dob?: string | null;
  phone?: string | null;
};

export default function ProfilePage() {
  const stored = getCurrentUser();
  const initialId = stored?.id ?? null;

  const [user, setUser] = useState<User | null>(stored ?? null);
  const [loading, setLoading] = useState<boolean>(!!initialId);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ fullName: "", dob: "", phone: "" });
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      if (!initialId) return;
      setLoading(true);
      try {
        const data = await getUserById(initialId);
        setUser(data);
        setForm({
          fullName: data.fullName ?? "",
          dob: data.dob ?? "",
          phone: data.phone ?? "",
        });
      } catch (err: any) {
        setMessage(err?.message || "Could not load profile from server.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [initialId]);

  function handleEdit() {
    if (!user) return;
    setForm({
      fullName: user.fullName ?? "",
      dob: user.dob ?? "",
      phone: user.phone ?? "",
    });
    setEditing(true);
    setMessage(null);
  }

  function handleCancel() {
    setEditing(false);
    setMessage(null);
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.id) {
      setMessage("No user found.");
      return;
    }
    if (!form.fullName.trim()) {
      setMessage("Full name is required.");
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const updated = await updateUser(user.id, {
        fullName: form.fullName.trim(),
        dob: form.dob || null,
        phone: form.phone || null,
      });
      const current = getCurrentUser();
      setUser(updated);
      if (current?.token) {
        setCurrentUser({ ...updated, token: current.token, refreshToken: current.refreshToken });
      }
      setEditing(false);
      setMessage("Profile updated successfully.");
    } catch (err: any) {
      setMessage(err?.message || "Update failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <Header />
      <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
        <div className="content-section active" style={{ padding: 20 }}>
          <div className="content-header" style={{ marginBottom: 12 }}>
            <h2>My Profile</h2>
            <div style={{ marginLeft: "auto" }}>
              {!editing && (
                <button className="edit-profile-btn" onClick={handleEdit}>
                  <i className="fas fa-pencil-alt" /> Edit Profile
                </button>
              )}
            </div>
          </div>

          {loading && <div className="loader active" />}
          {message && <p style={{ color: message.toLowerCase().includes("success") ? "lightgreen" : "salmon" }}>{message}</p>}

          {!editing && !loading && user && (
            <div className="profile-info">
              <div className="profile-pic">
                <i className="fas fa-user" />
              </div>
              <div className="profile-details" id="profileDetailsView">
                <div className="detail-item"><span className="detail-label">Full Name:</span><span className="detail-value">{user.fullName ?? "-"}</span></div>
                <div className="detail-item"><span className="detail-label">Email:</span><span className="detail-value">{user.email ?? "-"}</span></div>
                <div className="detail-item"><span className="detail-label">Date of Birth:</span><span className="detail-value">{user.dob ?? "-"}</span></div>
                <div className="detail-item"><span className="detail-label">Phone:</span><span className="detail-value">{user.phone ?? "-"}</span></div>
              </div>
            </div>
          )}

          {editing && user && (
            <form id="profileDetailsEdit" onSubmit={handleSave} className="profile-details" style={{ marginTop: 12 }}>
              <div className="form-group">
                <label htmlFor="fullName">Full Name</label>
                <input name="fullName" id="fullName" value={form.fullName} onChange={onChange} required />
              </div>

              <div className="form-group">
                <label htmlFor="dob">Date of Birth</label>
                <input name="dob" id="dob" type="date" value={form.dob} onChange={onChange} />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input name="phone" id="phone" type="tel" value={form.phone} onChange={onChange} placeholder="(555) 123-4567" />
              </div>

              <div className="profile-edit-actions" style={{ marginTop: 12 }}>
                <button type="button" className="cancel-btn" onClick={handleCancel}>Cancel</button>
                <button type="submit" className="submit-btn" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
              </div>
            </form>
          )}

          {!user && !loading && (
            <p style={{ color: "orange" }}>No profile available. Please log in.</p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
