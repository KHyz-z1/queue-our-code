// client/src/pages/AdminDashboard.js
import React, { useEffect, useState } from "react";
import api from "../utils/api";

/**
 * Admin Dashboard
 * - Create staff (name + starPassCode) => POST /api/admin/create-staff
 * - List staff => GET /api/admin/staffs
 * - Delete staff => DELETE /api/admin/staffs/:id
 * - Edit staff => PUT /api/admin/staffs/:id
 */

export default function AdminDashboard() {
  const [name, setName] = useState("");
  const [starPassCode, setStarPassCode] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [staffList, setStaffList] = useState([]);

  // edit state
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editStarPassCode, setEditStarPassCode] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, []);

  async function fetchStaff() {
    try {
      const res = await api.get("/admin/staffs");
      setStaffList(res.data.staffs || res.data || []);
    } catch (err) {
      console.error("fetchStaff err", err);
      // fallback
      try {
        const res2 = await api.get("/users?role=staff");
        setStaffList(res2.data.users || res2.data || []);
      } catch (err2) {
        console.error("fetchStaff fallback err", err2);
        setMsg("Could not load staff list (check backend route).");
      }
    }
  }

  async function handleCreateStaff(e) {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    try {
      const body = { name, starPassCode };
      const res = await api.post("/admin/create-staff", body);
      setMsg("Staff created successfully");
      setName("");
      setStarPassCode("");
      fetchStaff();
    } catch (err) {
      console.error(err);
      const serverMsg = err.response?.data?.msg || "Create staff failed";
      setMsg(serverMsg);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteStaff(id) {
    if (!window.confirm("Delete this staff account?")) return;
    try {
      await api.delete(`/admin/staffs/${id}`);
      setMsg("Staff deleted");
      fetchStaff();
    } catch (err) {
      console.error(err);
      setMsg(err.response?.data?.msg || "Delete failed");
    }
  }

  function startEdit(staff) {
    setEditingId(staff.id || staff._id);
    setEditName(staff.name || "");
    setEditStarPassCode(staff.starPassCode || "");
    setMsg("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditStarPassCode("");
    setEditLoading(false);
  }

  async function saveEdit() {
    if (!editingId) return;
    setEditLoading(true);
    setMsg("");
    try {
      const body = {};
      if (editName && editName.trim() !== "") body.name = editName.trim();
      if (editStarPassCode && editStarPassCode.trim() !== "") body.starPassCode = editStarPassCode.trim();

      const res = await api.put(`/admin/staffs/${editingId}`, body);
      setMsg("Staff updated");
      cancelEdit();
      fetchStaff();
    } catch (err) {
      console.error("saveEdit err", err);
      const serverMsg = err.response?.data?.msg || "Update failed";
      setMsg(serverMsg);
    } finally {
      setEditLoading(false);
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
      <h2>Admin Dashboard — Staff Management</h2>

      <section style={{ margin: "12px 0", padding: 12, border: "1px solid #ddd", borderRadius: 6 }}>
        <h3>Create Staff</h3>
        <form onSubmit={handleCreateStaff}>
          <div style={{ marginBottom: 8 }}>
            <input
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ padding: 8, width: 300 }}
            />
          </div>
          <div style={{ marginBottom: 8 }}>
            <input
              placeholder="StarPass code (e.g. STAFF-0001)"
              value={starPassCode}
              onChange={(e) => setStarPassCode(e.target.value)}
              required
              style={{ padding: 8, width: 300 }}
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Staff"}
          </button>
        </form>
        {msg && <p style={{ color: msg.startsWith("Staff created") || msg.startsWith("Staff updated") ? "green" : "red" }}>{msg}</p>}
      </section>

      <section style={{ marginTop: 16 }}>
        <h3>Staff List</h3>
        {staffList.length === 0 ? (
          <p>No staff found.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #ccc" }}>
                <th>Name</th>
                <th>StarPassCode</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staffList.map((s) => {
                const id = s.id || s._id;
                const isEditing = editingId === id;
                return (
                  <tr key={id} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "8px 4px" }}>
                      {isEditing ? (
                        <input value={editName} onChange={(e) => setEditName(e.target.value)} style={{ padding: 6 }} />
                      ) : (
                        s.name
                      )}
                    </td>
                    <td style={{ padding: "8px 4px" }}>
                      {isEditing ? (
                        <input value={editStarPassCode} onChange={(e) => setEditStarPassCode(e.target.value)} style={{ padding: 6 }} />
                      ) : (
                        s.starPassCode || "-"
                      )}
                    </td>
                    <td style={{ padding: "8px 4px" }}>{s.role || "staff"}</td>
                    <td style={{ padding: "8px 4px" }}>
                      {isEditing ? (
                        <>
                          <button onClick={saveEdit} disabled={editLoading} style={{ marginRight: 6 }}>
                            {editLoading ? "Saving..." : "Save"}
                          </button>
                          <button onClick={cancelEdit}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(s)} style={{ marginRight: 6 }}>
                            Edit
                          </button>
                          <button onClick={() => handleDeleteStaff(id)}>Delete</button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
