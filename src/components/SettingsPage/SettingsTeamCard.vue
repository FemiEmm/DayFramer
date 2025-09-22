<!-- src/components/SettingsPage/SettingsTeamCard.vue -->
<template>
  <section class="card">
    <h2 class="h2">Team</h2>

    <!-- No team yet -->
    <div v-if="!myTeam" class="grid-two">
      <!-- JOIN TEAM -->
      <div class="panel">
        <h3 class="panel-title">Join a team</h3>
        <div class="field">
          <label class="label">Enter team code</label>
          <input class="input" v-model.trim="joinCode" placeholder="Enter team code" />
        </div>
        <div class="row">
          <button class="btn" :disabled="!joinCode || busy" @click="joinTeam">
            {{ busy && action==='join' ? 'Joining…' : 'Join team' }}
          </button>
          <span class="muted" v-if="action==='join' && msg">{{ msg }}</span>
        </div>
      </div>

      <!-- CREATE TEAM -->
      <div class="panel">
        <h3 class="panel-title">Create a team</h3>
        <div class="field">
          <label class="label">Enter team name</label>
          <input class="input" v-model.trim="teamName" placeholder="Enter team name" />
        </div>
        <div class="row">
          <button class="btn btn-secondary" :disabled="!teamName || busy" @click="createTeam">
            {{ busy && action==='create' ? 'Creating…' : 'Create team' }}
          </button>
          <span class="muted" v-if="action==='create' && msg">{{ msg }}</span>
        </div>
      </div>
    </div>

    <!-- Team details -->
    <div v-else class="team-details">
      <div class="info">
        <div class="line">
          <span class="label">Team name</span>
          <span class="value">{{ myTeam?.name }}</span>
        </div>
        <div class="line">
          <span class="label">Team code</span>
          <code class="code">{{ myTeam?.join_code }}</code>
        </div>
      </div>

      <div class="members">
        <div class="mh">Team members ({{ members.length }})</div>
        <ul class="mlist">
          <li v-for="m in members" :key="m.user_id" class="mrow">
            <span class="avatar mini">{{ initials(m.display_name) }}</span>
            <span class="mname">
              {{ m.display_name }}
              <small class="mrole">· {{ m.role }}</small>
            </span>

            <button
              v-if="isOwner && m.user_id !== userId"
              class="xbtn"
              title="Remove member"
              @click="removeMember(m.user_id)"
              :disabled="busy"
            >×</button>
          </li>
        </ul>
      </div>

      <div class="actions">
        <button
          class="btn btn-danger"
          :disabled="!myTeam || busy"
          @click="onLeaveClick"
        >
          {{ busy && action==='leave' ? 'Processing…' : 'Leave team' }}
        </button>
      </div>

      <p class="muted" v-if="msg && action!=='join' && action!=='create'">{{ msg }}</p>
    </div>

    <!-- Leave / Transfer / Delete Modal (only shows for owners when they are sole owner) -->
    <div v-if="showLeaveModal" class="modal-backdrop" @click.self="closeLeaveModal">
      <div class="modal">
        <h3 class="modal-title">You are the only owner</h3>
        <p class="modal-text">
          To leave, you can transfer ownership to another member, or delete the team.
        </p>

        <div class="modal-section">
          <label class="label">Transfer ownership to</label>
          <select class="input" v-model="transferTarget">
            <option disabled value="">Select a member</option>
            <option v-for="m in transferableMembers" :key="m.user_id" :value="m.user_id">
              {{ m.display_name }} ({{ m.role }})
            </option>
          </select>
          <div class="row" style="margin-top:8px;">
            <button
              class="btn"
              :disabled="!transferTarget || busy"
              @click="transferOwnershipAndLeave"
            >
              {{ busy && action==='transfer' ? 'Transferring…' : 'Transfer & leave' }}
            </button>
          </div>
        </div>

        <div class="divider"></div>

        <div class="modal-section danger">
          <p class="muted">Alternatively, you can delete this team. This cannot be undone.</p>
          <button
            class="btn btn-danger"
            :disabled="busy"
            @click="deleteTeam"
          >
            {{ busy && action==='delete' ? 'Deleting…' : 'Delete team' }}
          </button>
        </div>

        <div class="row" style="margin-top:12px; justify-content: flex-end;">
          <button class="btn btn-secondary" :disabled="busy" @click="closeLeaveModal">Cancel</button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { supabase } from "@/lib/supabase";

type Team = { id: string; name: string; owner_id: string; join_code: string };
type Role = "owner" | "admin" | "member";
type Member = { user_id: string; display_name: string; role: Role };

const userId = ref<string | null>(null);
const myTeam = ref<Team | null>(null);
const members = ref<Member[]>([]);

const joinCode = ref("");
const teamName = ref("");

const busy = ref(false);
const action = ref<"join" | "create" | "load" | "leave" | "remove" | "transfer" | "delete" | null>(null);
const msg = ref("");

const isOwner = computed(() => !!(userId.value && myTeam.value && myTeam.value.owner_id === userId.value));
const ownerCount = computed(() => members.value.filter(m => m.role === "owner").length);
const otherOwners = computed(() => members.value.filter(m => m.role === "owner" && m.user_id !== userId.value));
const transferableMembers = computed(() => members.value.filter(m => m.user_id !== userId.value));

/** Leave modal state (only for sole owner) */
const showLeaveModal = ref(false);
const transferTarget = ref<string>("");

onMounted(async () => {
  await loadUser();
  await loadTeam();
});

/** Utilities for code creation from name */
function normalizeForCode(name: string) {
  return name.replace(/[^A-Za-z0-9]/g, "").toLowerCase();
}
function random4() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}
function buildJoinCodeFromName(name: string) {
  const base = normalizeForCode(name);
  return `${base}${random4()}`;
}

async function loadUser() {
  const { data } = await supabase.auth.getUser();
  userId.value = data.user?.id ?? null;
}

async function getMyDisplayName(): Promise<string> {
  const uid = userId.value;
  if (!uid) return "User";
  const { data: p } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", uid)
    .maybeSingle();
  return p?.display_name || "User";
}

/** Owners and members both see everyone; only owners can remove */
async function loadTeam() {
  msg.value = "";
  action.value = "load";
  myTeam.value = null;
  members.value = [];
  if (!userId.value) return;

  let teamId: string | null = null;

  // 1) If user CREATED a team, prefer that
  const { data: ownedTeams, error: ownedErr } = await supabase
    .from("teams")
    .select("*")
    .eq("owner_id", userId.value)
    .order("created_at", { ascending: true })
    .limit(1);

  if (ownedErr) {
    msg.value = ownedErr.message || "Failed to check owned team.";
    return;
  }

  if (ownedTeams && ownedTeams[0]) {
    myTeam.value = ownedTeams[0] as Team;
    teamId = myTeam.value.id;
  } else {
    // 2) Otherwise, find a team where this user is a member
    const { data: mems, error: mErr } = await supabase
      .from("team_members")
      .select("team_id, role, created_at")
      .eq("user_id", userId.value)
      .order("created_at", { ascending: true })
      .limit(1);

    if (mErr) {
      msg.value = mErr.message || "Failed to check memberships.";
      return;
    }
    if (!mems || !mems[0]) return;

    teamId = mems[0].team_id;

    // fetch the team header for non-owners
    const { data: teams } = await supabase
      .from("teams")
      .select("*")
      .eq("id", teamId)
      .limit(1);

    if (teams && teams[0]) {
      myTeam.value = teams[0] as Team;
    }
  }

  if (!teamId) return;

  // 3) Fetch EVERY member on that team
  const { data: rawMembers, error: memErr2 } = await supabase
    .from("team_members")
    .select("user_id, role, display_name, created_at")
    .eq("team_id", teamId)
    .order("created_at", { ascending: true });

  if (memErr2) {
    msg.value = memErr2.message || "Failed to load members.";
    return;
  }

  members.value = (rawMembers ?? []).map(r => ({
    user_id: r.user_id,
    role: r.role as Role,
    display_name: r.display_name || "User",
  }));
}

/** Create team with name→code and add owner as member (with display_name) */
async function createTeam() {
  if (!teamName.value || !userId.value) return;
  busy.value = true;
  action.value = "create";
  msg.value = "";

  const myName = await getMyDisplayName();

  const MAX_TRIES = 5;
  for (let attempt = 1; attempt <= MAX_TRIES; attempt++) {
    const code = buildJoinCodeFromName(teamName.value);

    const { data: tRows, error: tErr } = await supabase
      .from("teams")
      .insert({ name: teamName.value, owner_id: userId.value, join_code: code })
      .select()
      .limit(1);

    if (!tErr && tRows?.[0]) {
      const team = tRows[0] as Team;

      const { error: mErr } = await supabase
        .from("team_members")
        .insert({ team_id: team.id, user_id: userId.value, role: "owner", display_name: myName });

      if (mErr) {
        msg.value = mErr.message || "Team created but failed to add owner.";
        busy.value = false;
        return;
      }

      msg.value = `Team created. Share code: ${team.join_code}`;
      teamName.value = "";
      await loadTeam();
      busy.value = false;
      return;
    }

    const isUniqueViolation = tErr?.code === "23505" || /duplicate key.*join_code/i.test(tErr?.message || "");
    if (!isUniqueViolation) {
      msg.value = tErr?.message || "Could not create team.";
      busy.value = false;
      return;
    }
    if (attempt === MAX_TRIES) {
      msg.value = "Could not create a unique team code. Please try again.";
      busy.value = false;
      return;
    }
  }
}

/** Join by code (store display_name on membership row) */
async function joinTeam() {
  if (!joinCode.value || !userId.value) return;
  busy.value = true;
  action.value = "join";
  msg.value = "";

  try {
    const code = joinCode.value.trim().toLowerCase();
    const { data: team, error } = await supabase
      .from("teams")
      .select("*")
      .eq("join_code", code)
      .maybeSingle();

    if (error || !team) {
      msg.value = "Team not found.";
      return;
    }

    const { data: exists } = await supabase
      .from("team_members")
      .select("user_id")
      .eq("team_id", team.id)
      .eq("user_id", userId.value);

    if (exists && exists.length) {
      msg.value = "You’re already in this team.";
      await loadTeam();
      return;
    }

    const myName = await getMyDisplayName();

    const { error: addErr } = await supabase
      .from("team_members")
      .insert({ team_id: team.id, user_id: userId.value, role: "member", display_name: myName });

    if (addErr) {
      msg.value = addErr.message || "Could not join team.";
      return;
    }

    msg.value = "Joined successfully.";
    joinCode.value = "";
    await loadTeam();
  } finally {
    busy.value = false;
  }
}

/** Click handler for Leave button: routes to correct path */
function onLeaveClick() {
  if (!myTeam.value || !userId.value) return;

  if (!isOwner.value) {
    // non-owner: leave immediately
    leaveTeamNonOwner();
    return;
  }

  // owner:
  if (otherOwners.value.length > 0) {
    // there are other owners already → safe to leave
    leaveTeamOwnerWithOtherOwners();
  } else {
    // sole owner → must transfer or delete
    openLeaveModal();
  }
}

/** Non-owner leave */
async function leaveTeamNonOwner() {
  busy.value = true;
  action.value = "leave";
  msg.value = "";
  try {
    const { error } = await supabase
      .from("team_members")
      .delete()
      .eq("team_id", myTeam.value!.id)
      .eq("user_id", userId.value!);

    if (error) {
      msg.value = error.message || "Failed to leave team.";
      return;
    }
    myTeam.value = null;
    members.value = [];
    msg.value = "You left the team.";
  } finally {
    busy.value = false;
  }
}

/** Owner leave when there are other owners already */
async function leaveTeamOwnerWithOtherOwners() {
  busy.value = true;
  action.value = "leave";
  msg.value = "";
  try {
    const { error } = await supabase
      .from("team_members")
      .delete()
      .eq("team_id", myTeam.value!.id)
      .eq("user_id", userId.value!);

    if (error) {
      msg.value = error.message || "Failed to leave team.";
      return;
    }

    // If the team.owner_id is me, move owner_id to one of the remaining owners.
    if (myTeam.value?.owner_id === userId.value) {
      const fallbackOwner = members.value.find(m => m.role === "owner" && m.user_id !== userId.value);
      if (fallbackOwner) {
        await supabase.from("teams").update({ owner_id: fallbackOwner.user_id }).eq("id", myTeam.value!.id);
      }
    }

    myTeam.value = null;
    members.value = [];
    msg.value = "You left the team.";
  } finally {
    busy.value = false;
  }
}

/** Modal helpers */
function openLeaveModal() {
  transferTarget.value = "";
  showLeaveModal.value = true;
}
function closeLeaveModal() {
  if (busy.value) return;
  showLeaveModal.value = false;
}

/** Transfer ownership to selected member and then remove current owner’s membership */
async function transferOwnershipAndLeave() {
  if (!transferTarget.value || !myTeam.value || !userId.value) return;

  busy.value = true;
  action.value = "transfer";
  msg.value = "";

  try {
    const newOwnerId = transferTarget.value;
    const teamId = myTeam.value.id;
    const currOwnerId = userId.value;

    // 1) Promote target member to owner role (team_members update)
    const { error: roleErr } = await supabase
      .from("team_members")
      .update({ role: "owner" as Role })
      .eq("team_id", teamId)
      .eq("user_id", newOwnerId);

    if (roleErr) {
      msg.value = roleErr.message || "Failed to promote new owner.";
      return;
    }

    // 2) Update teams.owner_id
    const { error: updateOwnerErr } = await supabase
      .from("teams")
      .update({ owner_id: newOwnerId })
      .eq("id", teamId);

    if (updateOwnerErr) {
      msg.value = updateOwnerErr.message || "Failed to transfer ownership.";
      return;
    }

    // 3) Remove current owner’s membership (leave)
    const { error: delErr } = await supabase
      .from("team_members")
      .delete()
      .eq("team_id", teamId)
      .eq("user_id", currOwnerId);

    if (delErr) {
      msg.value = delErr.message || "Ownership transferred, but leaving failed.";
      return;
    }

    showLeaveModal.value = false;
    myTeam.value = null;
    members.value = [];
    msg.value = "Ownership transferred. You left the team.";
  } finally {
    busy.value = false;
  }
}

/** Delete team (sole owner) */
async function deleteTeam() {
  if (!myTeam.value || !isOwner.value) return;

  const teamId = myTeam.value.id;
  busy.value = true;
  action.value = "delete";
  msg.value = "";

  try {
    const { error } = await supabase.from("teams").delete().eq("id", teamId);
    if (error) {
      msg.value = error.message || "Failed to delete team.";
      return;
    }
    showLeaveModal.value = false;
    myTeam.value = null;
    members.value = [];
    msg.value = "Team deleted.";
  } finally {
    busy.value = false;
  }
}

async function removeMember(uid: string) {
  if (!myTeam.value || !isOwner.value) return;
  if (uid === userId.value) return;

  busy.value = true;
  action.value = "remove";
  msg.value = "";
  try {
    const { error } = await supabase
      .from("team_members")
      .delete()
      .eq("team_id", myTeam.value.id)
      .eq("user_id", uid);

    if (error) {
      msg.value = error.message || "Failed to remove member.";
      return;
    }
    // Refresh list so owners & members both see updated roster
    await loadTeam();
  } finally {
    busy.value = false;
  }
}

function initials(name?: string) {
  const s = (name || "U").trim();
  const parts = s.split(/\s+/);
  return (parts[0]?.[0] || "U").toUpperCase() + (parts[1]?.[0] || "").toUpperCase();
}
</script>

<style scoped>
.card { background:#fff;border:1px solid #eee;border-radius:16px;box-shadow:0 12px 32px rgba(0,0,0,.06);padding:16px; }
.h2 { margin:0 0 10px;font-weight:800;font-size:18px; }
.grid-two { display:grid; grid-template-columns: 1fr 1fr; gap:16px; }
.panel { background:#fafafa; border:1px solid #eee; border-radius:12px; padding:14px; }
.panel-title { margin:0 0 8px; font-weight:800; font-size:16px; }
.field { display:grid; gap:6px; }
.label { font-size:12px;color:#444;font-weight:700; }
.input { width:100%;padding:10px 12px;border:1px solid #e5e7eb;border-radius:12px;font:inherit; }
.row { display:flex;align-items:center;gap:8px; }
.muted { color:#666;font-size:12px; }

.team-details { display:grid; gap:12px; }
.info { display:grid; gap:6px; }
.line { display:flex;align-items:center;gap:12px; }
.line .label { width:110px; }
.code { background:#f7f7f7; border:1px solid #eee; padding:2px 6px; border-radius:8px; }

.members { margin-top:4px; }
.mh { font-weight:800;margin:6px 0; }
.mlist { list-style:none;padding:0;margin:0;display:grid;gap:6px; }
.mrow {
  display:grid; grid-template-columns:auto 1fr auto; align-items:center;
  background:#fff; border:1px solid #eee; border-radius:12px; padding:8px 10px; gap:8px;
}
.avatar.mini { width:28px;height:28px;border-radius:999px;background:#f3f4f6;border:1px solid #eee;display:grid;place-items:center;font-size:12px; }
.mname { font-weight:700; display:flex; align-items:center; gap:6px; }
.mrole { color:#666; font-size:12px; font-weight:600; }

.xbtn {
  width:28px;height:28px;border-radius:999px;border:1px solid #e5e7eb;background:#fff;cursor:pointer;font-weight:800;
}
.xbtn:hover { background:#ffecec; border-color:#f5b5b5; color:#c62828; }

.actions { margin-top:4px; }
.btn { padding:10px 14px;border-radius:12px;border:1px solid transparent;background:var(--button-color);color:var(--secondary-text-color);font-weight:700;cursor:pointer; }
.btn:disabled{opacity:.7;cursor:not-allowed;}
.btn.btn-secondary{background:#fff;color:#111;border:1px solid #e5e7eb;}
.btn.btn-danger{background:#ef4444;color:#fff;}

@media (max-width: 720px) {
  .grid-two { grid-template-columns: 1fr; }
}

/* Modal */
.modal-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,.4);
  display:grid; place-items:center; z-index: 50;
}
.modal {
  width: min(560px, 92vw);
  background:#fff; border-radius:16px; border:1px solid #eee; padding:16px;
  box-shadow: 0 20px 50px rgba(0,0,0,.15);
}
.modal-title { margin:0 0 8px; font-size:18px; font-weight:800; }
.modal-text { margin:0 0 10px; color:#333; }
.modal-section { margin-top:8px; }
.divider { height:1px; background:#eee; margin:12px 0; }
.modal-section.danger .btn { margin-top:6px; }
</style>
