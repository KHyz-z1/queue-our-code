import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import Button from "../../ui/Button";
import Card from "../../ui/Card";

export default function AdminProfile() {
  const [form, setForm] = useState({
    name: "",
    starPassCode: "",
    email: ""
  });
  const [emailVerified, setEmailVerified] = useState(false);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const res = await api.get("/admin/profile");
      setForm(res.data.admin);
      setEmailVerified(res.data.admin.emailVerified);
    } catch {
      setMsg("Failed to load admin profile");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      const res = await api.put("/admin/profile", form);
      setMsg(res.data.msg);
      loadProfile();
    } catch (err) {
      setMsg(err.response?.data?.msg || "Update failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto p-4">
      <Card className="p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">
          Admin Profile
        </h2>

        {msg && (
          <div className="mb-4 text-sm text-center text-slate-700 bg-slate-100 p-2 rounded">
            {msg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <input
              className="w-full mt-1 p-2 border rounded"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-medium">StarPass Code</label>
            <input
              className="w-full mt-1 p-2 border rounded"
              value={form.starPassCode}
              onChange={(e) =>
                setForm({ ...form, starPassCode: e.target.value })
              }
            />
          </div>

          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              className="w-full mt-1 p-2 border rounded"
              value={form.email || ""}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
            />
            {form.email && (
              <div className="text-xs mt-1">
                Status:{" "}
                <span
                  className={
                    emailVerified
                      ? "text-green-600 font-semibold"
                      : "text-red-500 font-semibold"
                  }
                >
                  {emailVerified ? "Verified" : "Not Verified"}
                </span>
              </div>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="w-full"
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
