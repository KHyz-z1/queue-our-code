// client/src/pages/AdminRides.js
import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = "http://localhost:5000/api/admin";
const SERVER_BASE = "http://localhost:5000";

const cardStyle = {
  background: "#fff",
  borderRadius: 8,
  boxShadow: "0 1px 3px rgba(15,23,42,0.06)",
  padding: 16,
  boxSizing: "border-box",
};

export default function AdminRides() {
  const [rides, setRides] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    status: "open",
    capacity: 1,
    duration: 5,
    image: null,
  });
  const [editingRide, setEditingRide] = useState(null);
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("token"); // Admin token

  useEffect(() => {
    fetchRides();
  }, []);

  const fetchRides = async () => {
    try {
      const res = await axios.get(`${API_BASE}/rides`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const list = res.data?.rides ?? res.data ?? [];
      const arr = Array.isArray(list) ? list : [];
      const normalized = arr.map((r) => ({
        ...r,
        id: r.id || r._id || (r._id && r._id.$oid) || null,
      }));
      setRides(normalized);
    } catch (err) {
      console.error("Error fetching rides:", err);
      setMessage("Could not fetch rides (see console).");
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const buildImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (/^https?:\/\//.test(imagePath)) return imagePath;
    if (imagePath.startsWith("/")) return `${SERVER_BASE}${imagePath}`;
    return `${SERVER_BASE}/${imagePath}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      for (const key in formData) {
        if (formData[key] !== null && formData[key] !== "") {
          data.append(key, formData[key]);
        }
      }

      if (editingRide) {
        await axios.put(`${API_BASE}/rides/${editingRide.id}`, data, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
        setMessage("Ride updated successfully!");
      } else {
        await axios.post(`${API_BASE}/rides`, data, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
        setMessage("Ride added successfully!");
      }

      setFormData({
        name: "",
        status: "open",
        capacity: 1,
        duration: 5,
        image: null,
      });
      setEditingRide(null);
      fetchRides();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Error saving ride:", err);
      setMessage(err.response?.data?.msg || "Server error");
    }
  };

  const handleEdit = (ride) => {
    setEditingRide(ride);
    setFormData({
      name: ride.name || "",
      status: ride.status || "open",
      capacity: ride.capacity || 1,
      duration: ride.duration || 5,
      image: null,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!id) {
      setMessage("Invalid ride id");
      return;
    }
    if (!window.confirm("Delete this ride?")) return;
    try {
      await axios.delete(`${API_BASE}/rides/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage("Ride deleted successfully!");
      fetchRides();
    } catch (err) {
      console.error("Delete error:", err);
      setMessage(err.response?.data?.msg || "Server error");
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 18 }}>
      <h2 style={{ textAlign: "center", marginBottom: 12 }}>Ride Management</h2>

      {message && (
        <div style={{ marginBottom: 12, padding: 10, borderRadius: 6, background: "#e6f6ff", color: "#064e3b" }}>
          {message}
        </div>
      )}

      {/* Form card (full width, separated from list) */}
      <div style={{ ...cardStyle, marginBottom: 20 }}>
        <h3 style={{ marginTop: 0 }}>{editingRide ? "Edit Ride" : "Add New Ride"}</h3>

        <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 12, alignItems: "start" }}>
          <div>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Name</label>
            <input
              type="text"
              name="name"
              placeholder="Ride name"
              value={formData.name}
              onChange={handleChange}
              style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #d1d5db" }}
              required
            />

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Status</label>
                <select name="status" value={formData.status} onChange={handleChange} style={{ width: "100%", padding: 10, borderRadius: 6 }}>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>

              <div style={{ width: 120 }}>
                <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Capacity</label>
                <input type="number" name="capacity" value={formData.capacity} onChange={handleChange}
                  style={{ width: "100%", padding: 10, borderRadius: 6 }} min={1} />
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>Seats per batch</div>
              </div>

              <div style={{ width: 140 }}>
                <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Duration</label>
                <input type="number" name="duration" value={formData.duration} onChange={handleChange}
                  style={{ width: "100%", padding: 10, borderRadius: 6 }} min={1} />
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>Minutes per batch</div>
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Image (optional)</label>
              <input type="file" name="image" accept="image/*" onChange={handleChange} />
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>Small images recommended (≤ 3MB). Will be cropped to fit card preview.</div>
            </div>

            <div style={{ marginTop: 12 }}>
              <button type="submit" style={{ background: "#059669", color: "#fff", padding: "10px 14px", borderRadius: 6, border: "none" }}>
                {editingRide ? "Save changes" : "Create ride"}
              </button>

              {editingRide && (
                <button type="button" onClick={() => { setEditingRide(null); setFormData({ name: "", status: "open", capacity: 1, duration: 5, image: null }); }}
                  style={{ marginLeft: 8, padding: "10px 14px", borderRadius: 6, border: "1px solid #d1d5db", background: "#fff" }}>
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Preview Card */}
          <div>
            <div style={{ borderRadius: 8, overflow: "hidden", height: 170, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {editingRide && editingRide.image ? (
                <img src={`${SERVER_BASE}${editingRide.image}`} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ color: "#9ca3af" }}>Image preview</div>
              )}
            </div>
            <div style={{ fontSize: 13, color: "#6b7280", marginTop: 8 }}>
              Preview will show the uploaded image cropped to the above preview area.
            </div>
          </div>
        </form>
      </div>

      {/* Rides list */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
        {rides.map((ride) => {
          const id = ride.id || ride._id || (ride._id && ride._id.$oid);
          const img = buildImageUrl(ride.image);
          return (
            <article key={id} style={{ ...cardStyle, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ height: 160, overflow: "hidden", background: "#f8fafc" }}>
                {img ? (
                  <img src={img} alt={ride.name} style={{ width: "100%", height: "160px", objectFit: "cover", display: "block" }} />
                ) : (
                  <div style={{ height: "160px", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>
                    No image
                  </div>
                )}
              </div>

              <div style={{ padding: 12, borderTop: "1px solid #eef2f7", flex: 1, display: "flex", flexDirection: "column" }}>
                <h4 style={{ margin: "0 0 6px 0" }}>{ride.name}</h4>

                <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>
                  <strong>Status:</strong> {ride.status} &nbsp; | &nbsp;
                  <strong>Capacity:</strong> {ride.capacity} &nbsp; | &nbsp;
                  <strong>Duration:</strong> {ride.duration} min
                </div>

                <div style={{ marginTop: "auto", display: "flex", gap: 8 }}>
                  <button onClick={() => handleEdit(ride)} style={{ padding: "8px 12px", borderRadius: 6, background: "#f59e0b", color: "#fff", border: "none" }}>
                    Edit
                  </button>
                  <button onClick={() => handleDelete(id)} style={{ padding: "8px 12px", borderRadius: 6, background: "#ef4444", color: "#fff", border: "none" }}>
                    Delete
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
