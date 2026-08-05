import { useEffect, useState } from "react";
import { listUsers, inviteUser } from "@/api/userService";
import { UserPlus, Shield, Mail } from "lucide-react";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [msg, setMsg] = useState("");

  const fetch = () => {
    listUsers().then(setUsers).catch(() => setUsers([]));
  };
  useEffect(() => { fetch(); }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      const response = await inviteUser(inviteEmail);
      const tokenMessage = response?.invite_token
        ? ` Lien d'activation (à transmettre en privé, valable 7 jours) : jeton ${response.invite_token}`
        : "";
      setMsg("✅ Invitation envoyée à " + inviteEmail + tokenMessage);
      setInviteEmail("");
      fetch();
    } catch (err) {
      setMsg("❌ " + err.message);
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-lg">
        <strong>Info :</strong> La gestion des rôles est centralisée dans Firebase. Pour attribuer le rôle d'administrateur, modifiez les claims ou ajoutez isAdmin: true dans Firestore (admins/{'{uid}'} ou users/{'{uid}'}).
      </div>
      {msg && <p className="text-sm text-center">{msg}</p>}

      {/* Invite form */}
      <form onSubmit={handleInvite} className="bg-card rounded-2xl p-5 border border-border">
        <h3 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
          <UserPlus size={16} /> Inviter un utilisateur
        </h3>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
              placeholder="email@exemple.com" required
              className="w-full pl-9 pr-3 py-2.5 border border-border bg-background rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          {/* Invitations default to Apprenant; role management moved to Firebase */}
          <div className="border border-border bg-background rounded-xl px-3 py-2.5 text-sm flex items-center text-muted-foreground">Apprenant</div>
          <button type="submit" className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition">
            Inviter
          </button>
        </div>
      </form>

      {/* User list */}
      <div className="space-y-2">
        {users.map(u => (
          <div key={u.id} className="bg-card rounded-xl p-3 border border-border flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white font-bold text-sm">
              {(u.full_name || u.email || "?")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-foreground text-sm truncate">{u.full_name || "Sans nom"}</div>
              <div className="text-xs text-muted-foreground truncate">{u.email}</div>
            </div>
            <div className={`text-xs px-2.5 py-1.5 rounded-full font-medium flex items-center gap-1 transition ${u.role === "admin" ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>
              <Shield size={12} /> {u.role === "admin" ? "Admin" : "Apprenant"}
            </div>
          </div>
        ))}
        {users.length === 0 && <p className="text-center text-sm text-muted-foreground py-4">Aucun utilisateur</p>}
      </div>
    </div>
  );
}