<template>
  <div class="space-y-8 animate-slide-up">
    <!-- HEADER -->
    <div class="flex items-start justify-between flex-wrap gap-4">
      <div>
        <h1 class="text-3xl font-bold text-slate-900">Portals</h1>
        <p class="text-slate-500 mt-1">
          Collector portals · har portal apni baari par chalta hai, koi fixed time nahi
        </p>
      </div>

      <div class="flex items-center gap-3 flex-wrap">
        <ReportButton />
        <!-- PROXY TOGGLE — proxy pool kharab ho tab OFF karke direct IP se scrape -->
        <button
          v-if="proxyConfigured"
          @click="toggleProxy"
          :disabled="proxyBusy"
          class="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-semibold transition-colors disabled:opacity-50"
          :class="proxyEnabled
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'"
          :title="proxyEnabled
            ? 'Proxy ON — rotating IPs se scrape ho raha hai. OFF karne pe direct IP.'
            : 'Proxy OFF — direct IP se scrape ho raha hai. ON karne pe rotating proxy.'"
        >
          <ArrowPathIcon v-if="proxyBusy" class="w-4 h-4 animate-spin" />
          <SignalIcon v-else-if="proxyEnabled" class="w-4 h-4" />
          <SignalSlashIcon v-else class="w-4 h-4" />
          Proxy: {{ proxyEnabled ? "ON" : "OFF" }}
        </button>

        <button
          @click="load"
          class="btn-ghost flex items-center gap-2"
        >
          <ArrowPathIcon class="w-4 h-4" :class="{ 'animate-spin': loading }" />
          Refresh
        </button>
        <button
          @click="triggerAll"
          :disabled="triggering"
          class="btn-primary flex items-center gap-2 disabled:opacity-50"
        >
          <BoltIcon class="w-4 h-4" />
          Trigger All Now
        </button>
      </div>
    </div>

    <!-- HERO SCHEDULE CARD -->
    <div
      v-if="schedulerRunning"
      class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-primary-900 text-white shadow-card"
    >
      <!-- Decorative blobs -->
      <div class="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary-500 opacity-20 blur-3xl" />
      <div class="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-indigo-500 opacity-20 blur-3xl" />
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.05),transparent_50%)]" />

      <div class="relative p-8 md:p-10">
        <!-- Top row -->
        <div class="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
              <ClockIcon class="w-6 h-6 text-primary-300" />
            </div>
            <div>
              <h2 class="text-xl font-bold">Auto-Scrape Schedule</h2>
              <p class="text-sm text-slate-300 mt-0.5">
                <span
                  class="inline-flex items-center gap-1.5"
                >
                  <span
                    class="w-2 h-2 rounded-full"
                    :class="schedulerRunning ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'"
                  />
                  {{ schedulerRunning ? "Scheduler running" : "Scheduler stopped" }}
                </span>
                <span class="mx-2 text-slate-500">·</span>
                <span>Asia/Kolkata (IST)</span>
              </p>
            </div>
          </div>

          <div class="text-right">
            <p class="text-xs uppercase tracking-wider text-slate-400 mb-1.5">Chal rahe hain</p>
            <p class="text-3xl font-bold tabular-nums">{{ queueRunning.length }}</p>
          </div>
        </div>

        <div class="grid md:grid-cols-2 gap-6">
          <div>
            <p class="text-xs uppercase tracking-wider text-slate-400 mb-2">Abhi chal rahe</p>
            <p v-if="!queueRunning.length" class="text-sm text-slate-400">Koi nahi</p>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="r in queueRunning"
                :key="r.portal"
                class="px-2.5 py-1 rounded-lg bg-white/10 border border-white/20 text-xs font-semibold uppercase"
              >
                {{ r.portal }}
              </span>
            </div>
          </div>
          <div>
            <p class="text-xs uppercase tracking-wider text-slate-400 mb-2">Agli baari</p>
            <p v-if="!queueNext.length" class="text-sm text-slate-400">Abhi kuch nahi</p>
            <ul class="space-y-1 text-sm">
              <li v-for="r in queueNext" :key="r.portal" class="flex justify-between gap-4">
                <span class="font-semibold uppercase">{{ r.portal }}</span>
                <span class="text-slate-300 text-xs text-right">{{ queueLabel(r) }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- PORTALS GRID -->
    <div>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Squares2X2Icon class="w-5 h-5 text-slate-400" />
          Collector Portals
          <span class="badge-neutral">{{ portals.length }}</span>
        </h2>
        <div class="relative">
          <MagnifyingGlassIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input v-model="portalSearch" type="text" placeholder="Find portal..." class="input-field pl-9 py-1.5 min-w-[220px]" />
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <div v-for="i in 2" :key="i" class="card p-6 animate-pulse h-72" />
      </div>

      <!-- Portal cards -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <div
          v-for="portal in shownPortals"
          :key="portal.code"
          class="group relative overflow-hidden rounded-2xl bg-white shadow-soft hover:shadow-card transition-all duration-300"
        >
          <!-- Top gradient bar -->
          <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary-500 via-indigo-500 to-purple-500" />
          <!-- Blob -->
          <div class="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-primary-500 opacity-5 blur-3xl group-hover:opacity-10 transition-opacity duration-500" />

          <div class="relative p-6">
            <!-- HERO ROW: Logo + name + status -->
            <div class="flex items-start justify-between mb-5">
              <div class="flex items-center gap-3">
                <div class="relative">
                  <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-indigo-700 text-white flex items-center justify-center font-bold text-lg shadow-soft">
                    {{ portal.code?.slice(0, 3).toUpperCase() }}
                  </div>
                  <div
                    v-if="health(portal).ok"
                    class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center"
                  >
                    <CheckIcon class="w-3 h-3 text-white" />
                  </div>
                </div>
                <div>
                  <h3 class="font-bold text-slate-900 text-lg leading-tight">
                    {{ portal.name }}
                  </h3>
                  <p class="text-xs text-slate-500 font-mono mt-0.5">
                    {{ portal.code }}
                  </p>
                </div>
              </div>

              <!-- Health badge -->
              <div class="flex flex-col items-end gap-1">
                <span :class="health(portal).badge">
                  <span class="w-1.5 h-1.5 rounded-full" :class="health(portal).dot" />
                  {{ health(portal).label }}
                </span>
                <span class="text-[10px] text-slate-400 uppercase tracking-wider">
                  {{ portal.platform || "not swept yet" }}<span v-if="portal.tier"> · tier {{ portal.tier }}</span>
                </span>
              </div>
            </div>

            <!-- URL -->
            <a
              :href="portal.base_url"
              target="_blank"
              rel="noopener"
              class="flex items-center gap-1.5 text-xs text-slate-500 hover:text-primary-600 mb-5 transition-colors group/url"
            >
              <GlobeAltIcon class="w-3.5 h-3.5 shrink-0" />
              <span class="truncate group-hover/url:underline">{{ portal.base_url }}</span>
              <ArrowTopRightOnSquareIcon class="w-3 h-3 opacity-0 group-hover/url:opacity-100 transition-opacity" />
            </a>

            <!-- STAT GRID -->
            <div class="grid grid-cols-3 gap-3 mb-5">
              <div class="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/30 border border-blue-100">
                <div class="flex items-center gap-1.5 text-blue-600 mb-1">
                  <DocumentTextIcon class="w-3.5 h-3.5" />
                  <span class="text-[10px] font-bold uppercase tracking-wider">Active</span>
                </div>
                <p class="text-2xl font-bold text-slate-900 tabular-nums leading-tight">
                  {{ (portal.active || 0).toLocaleString("en-IN") }}
                </p>
              </div>

              <div class="p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/30 border border-emerald-100">
                <div class="flex items-center gap-1.5 text-emerald-600 mb-1">
                  <ClockIcon class="w-3.5 h-3.5" />
                  <span class="text-[10px] font-bold uppercase tracking-wider">Last Run</span>
                </div>
                <p class="text-sm font-bold text-slate-900 leading-tight">
                  {{ portal.sweeps.length ? formatRelative(portal.sweeps[0].started_at) : "Never" }}
                </p>
              </div>

              <div class="p-3 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/30 border border-amber-100">
                <div class="flex items-center gap-1.5 text-amber-600 mb-1">
                  <DocumentMagnifyingGlassIcon class="w-3.5 h-3.5" />
                  <span class="text-[10px] font-bold uppercase tracking-wider">Detail</span>
                </div>
                <p class="text-2xl font-bold text-slate-900 tabular-nums leading-tight">
                  {{ portal.active ? Math.round((portal.with_detail / portal.active) * 100) : 0 }}%
                </p>
              </div>
            </div>

            <!-- ACTIVITY DOTS (last 10 runs) -->
            <div class="mb-5">
              <div class="flex items-center justify-between mb-2">
                <p class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  Recent Activity (last 10)
                </p>
                <router-link to="/logs" class="text-[10px] text-primary-600 hover:text-primary-700 font-medium">
                  View logs →
                </router-link>
              </div>
              <div class="flex items-center gap-1">
                <div
                  v-for="(run, i) in last10Runs(portal)"
                  :key="i"
                  class="flex-1 h-8 rounded-md transition-all duration-200 hover:scale-110 cursor-help relative group/dot"
                  :class="runColor(run?.status)"
                  :title="runTooltip(run)"
                >
                  <span class="absolute inset-0 flex items-center justify-center opacity-0 group-hover/dot:opacity-100 text-[9px] font-bold text-white transition-opacity">
                    {{ run?.new_count || 0 }}
                  </span>
                </div>
              </div>
            </div>

            <!-- IREPS SESSION BANNER -->
            <template v-if="portal.code === 'ireps'">

              <!-- ── Valid session ── -->
              <div
                v-if="irepsSession.valid"
                class="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 flex items-center gap-3"
              >
                <ShieldCheckIcon class="w-5 h-5 text-emerald-500 shrink-0" />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-emerald-800">Session Active</p>
                  <p class="text-xs text-emerald-600">Logged in: {{ irepsSession.saved_date }}</p>
                </div>
                <button
                  @click="refreshIrepsStatus"
                  class="text-[11px] text-emerald-600 hover:text-emerald-800 underline shrink-0"
                >
                  Refresh
                </button>
              </div>

              <!-- ── Expired / Step 1: Send OTP ── -->
              <div
                v-else-if="!irepsOtpSent"
                class="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4"
              >
                <div class="flex items-start gap-3 mb-3">
                  <ExclamationTriangleIcon class="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p class="text-sm font-semibold text-amber-800">IREPS Session Expired</p>
                    <p class="text-xs text-amber-600 mt-0.5">
                      {{ irepsSession.saved_date
                          ? `Last login: ${irepsSession.saved_date}`
                          : 'Pehle kabhi login nahi kiya' }}
                    </p>
                  </div>
                </div>
                <button
                  @click="sendIrepsOtp"
                  :disabled="irepsSending"
                  class="w-full py-2 text-sm font-semibold rounded-lg bg-amber-500 hover:bg-amber-600
                         text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <ArrowPathIcon v-if="irepsSending" class="w-4 h-4 animate-spin" />
                  <DevicePhoneMobileIcon v-else class="w-4 h-4" />
                  {{ irepsSending
                      ? (irepsSession.otp_saved_today ? 'Login ho raha hai...' : 'OTP bhej raha hai...')
                      : (irepsSession.otp_saved_today ? "Login with today's OTP" : 'Send OTP to Mobile') }}
                </button>
                <button
                  v-if="!irepsSession.otp_saved_today"
                  @click="irepsOtpSent = true"
                  class="w-full mt-2 text-xs text-amber-700 hover:text-amber-900 underline"
                >
                  Aaj ka OTP pehle se hai? Yahan daalo
                </button>
                <p class="text-[11px] text-amber-500 mt-2 text-center">
                  {{ irepsSession.otp_saved_today
                      ? 'Aaj ka OTP saved hai, naya SMS nahi jayega'
                      : `OTP ${IREPS_MOBILE_HINT} pe SMS se aayega. Poore din wahi chalta hai` }}
                </p>
              </div>

              <!-- ── Step 2: Enter OTP ── -->
              <div
                v-else
                class="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4"
              >
                <div class="flex items-start gap-3 mb-3">
                  <DevicePhoneMobileIcon class="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <p class="text-sm font-semibold text-blue-800">OTP Sent!</p>
                    <p class="text-xs text-blue-600 mt-0.5">
                      {{ IREPS_MOBILE_HINT }} pe SMS aaya hoga — woh OTP yahan enter karo
                    </p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <input
                    v-model="irepsOtp"
                    type="text"
                    maxlength="8"
                    placeholder="6-digit OTP"
                    :disabled="irepsLogging"
                    class="flex-1 px-3 py-2 text-sm rounded-lg border border-blue-300 bg-white
                           focus:outline-none focus:ring-2 focus:ring-blue-400
                           disabled:opacity-50 font-mono tracking-widest text-center"
                    @keyup.enter="submitIrepsOtp"
                  />
                  <button
                    @click="submitIrepsOtp"
                    :disabled="irepsLogging || !irepsOtp.trim()"
                    class="px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700
                           text-white transition-colors disabled:opacity-50 flex items-center gap-2 shrink-0"
                  >
                    <ArrowPathIcon v-if="irepsLogging" class="w-4 h-4 animate-spin" />
                    <KeyIcon v-else class="w-4 h-4" />
                    {{ irepsLogging ? 'Verifying...' : 'Login' }}
                  </button>
                </div>
                <button
                  @click="irepsOtpSent = false"
                  class="mt-2 text-[11px] text-blue-500 hover:text-blue-700 underline w-full text-center"
                >
                  OTP nahi aaya? Dobara bhejo
                </button>
              </div>

            </template>

            <!-- ACTIONS -->
            <div class="flex items-center gap-2 pt-4 border-t border-slate-100">
              <button
                @click="triggerOne(portal.code)"
                :disabled="triggering"
                class="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <BoltIcon class="w-4 h-4" />
                Trigger Now
              </button>
              <router-link
                :to="{ path: '/tenders', query: { portal: portal.code } }"
                class="btn-ghost flex items-center justify-center gap-2"
              >
                <EyeIcon class="w-4 h-4" />
                View
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useToast } from "vue-toastification";
import {
  BoltIcon,
  ClockIcon,
  GlobeAltIcon,
  EyeIcon,
  ArrowPathIcon,
  Squares2X2Icon,
  DocumentTextIcon,
  CheckIcon,
  ArrowTopRightOnSquareIcon,
  ExclamationTriangleIcon,
  KeyIcon,
  ShieldCheckIcon,
  DevicePhoneMobileIcon,
  SignalIcon,
  SignalSlashIcon,
  DocumentMagnifyingGlassIcon,
  MagnifyingGlassIcon,
} from "@heroicons/vue/24/outline";

import ReportButton from "../components/ReportButton.vue";
import { tenderApi } from "../api/tender";
import { formatRelative, formatDateTime } from "../utils/dateUtils";
import { runLook } from "../utils/runs";

const portals          = ref([]);
const queueRunning     = ref([]);
const queueUpcoming    = ref([]);
const schedulerRunning = ref(false);
const loading          = ref(true);
const triggering       = ref(false);
const portalSearch     = ref("");
const toast            = useToast();

// Proxy toggle state
const proxyConfigured = ref(false);   // PROXY_URL env me set hai ya nahi
const proxyEnabled    = ref(true);    // abhi ON hai ya OFF
const proxyBusy       = ref(false);   // toggle in-flight

async function refreshProxy() {
  try {
    const r = await tenderApi.getProxy();
    proxyConfigured.value = r.configured;
    proxyEnabled.value    = r.enabled;
  } catch (e) {
    // silent — proxy toggle optional feature hai
  }
}

async function toggleProxy() {
  proxyBusy.value = true;
  try {
    const r = await tenderApi.setProxy(!proxyEnabled.value);
    proxyEnabled.value = r.enabled;
    toast.success(
      r.enabled
        ? "Proxy ON — agli scrape rotating IPs se"
        : "Proxy OFF — agli scrape direct IP se"
    );
  } catch (e) {
    toast.error(`Proxy toggle failed: ${e.message}`);
  } finally {
    proxyBusy.value = false;
  }
}

// IREPS session state
const IREPS_MOBILE_HINT = "62005xxxxx";  // last digits hide karo
const irepsSession  = ref({ valid: false, saved_date: null, message: "" });
const irepsOtpSent  = ref(false);   // Step 1 done → Step 2 dikhao
const irepsSending  = ref(false);   // "Send OTP" loading
const irepsOtp      = ref("");
const irepsLogging  = ref(false);   // "Login" loading

async function refreshIrepsStatus() {
  try {
    irepsSession.value = await tenderApi.irepsStatus();
  } catch (e) {
    // silent
  }
}

async function sendIrepsOtp() {
  irepsSending.value = true;
  try {
    const res = await tenderApi.irepsSendOtp();
    if (res.relogged) {
      irepsSession.value = { valid: true, saved_date: res.saved_date, message: res.message, otp_saved_today: true };
      toast.success("IREPS login ho gaya (aaj ke saved OTP se)");
      return;
    }
    irepsOtpSent.value = true;
    toast.info("OTP mobile pe bhej diya — SMS check karo");
  } catch (e) {
    toast.error(`OTP send failed: ${e.message}`);
  } finally {
    irepsSending.value = false;
  }
}

async function submitIrepsOtp() {
  const otp = irepsOtp.value.trim();
  if (!otp) return;
  irepsLogging.value = true;
  try {
    const res = await tenderApi.irepsLogin(otp);
    irepsSession.value = { valid: true, saved_date: res.saved_date, message: res.message, otp_saved_today: true };
    irepsOtp.value    = "";
    irepsOtpSent.value = false;
    toast.success(`IREPS login successful — session saved for ${res.saved_date}`);
  } catch (e) {
    toast.error(`IREPS login failed: ${e.message}`);
  } finally {
    irepsLogging.value = false;
  }
}

const shownPortals = computed(() => {
  const q = portalSearch.value.trim().toLowerCase();
  const list = q
    ? portals.value.filter(p => p.code.includes(q) || (p.name || "").toLowerCase().includes(q))
    : portals.value;
  // IREPS (needs the daily OTP login) pinned first, then biggest portals
  return [...list].sort((a, b) => (Number(b.needs_login) - Number(a.needs_login)) || (b.active - a.active));
});

function health(portal) {
  const last = portal.sweeps?.[0];
  if (!portal.enabled) return { label: "Disabled", badge: "badge-neutral", dot: "bg-slate-400", ok: false };
  if (!last) return { label: "Not swept", badge: "badge-neutral", dot: "bg-slate-400", ok: false };
  if (last.status === "running") return { label: "Running", badge: "badge-neutral", dot: "bg-blue-500 animate-pulse", ok: false };
  if (last.status === "success") return { label: "Healthy", badge: "badge-success", dot: "bg-emerald-500", ok: true };
  if (last.status === "partial") return { label: "Partial", badge: "badge-warning", dot: "bg-amber-500", ok: false };
  return { label: "Failed", badge: "badge-danger", dot: "bg-red-500", ok: false };
}

const QUEUE_SHOWN = 8;
const queueNext = computed(() => queueUpcoming.value.slice(0, QUEUE_SHOWN));

function queueLabel(r) {
  if (r.waiting_for === "waiting for today's login") return "login ka wait";
  if (r.waiting_for) return "raat 1 se 7 baje ke beech";
  if (!r.due_in_min) return "khali slot milte hi";
  if (r.due_in_min < 60) return `${r.due_in_min} min mein`;
  return `${Math.round(r.due_in_min / 60)} ghante mein`;
}

// Last 10 runs for a portal
function last10Runs(portal) {
  const filtered = (portal.sweeps || []).slice(0, 10);
  // Pad to 10 with nulls if fewer
  while (filtered.length < 10) filtered.push(null);
  return filtered;
}

function runColor(status) {
  return runLook(status).dot;
}

function runTooltip(run) {
  if (!run) return "No run yet";
  return `${run.status.toUpperCase()} · ${formatDateTime(run.started_at)} · listed ${run.listed ?? "-"} · new ${run.new_count ?? 0} · details ${run.details_fetched ?? 0}`;
}

async function load() {
  loading.value = true;
  try {
    const [portalsRes, statusRes] = await Promise.all([
      tenderApi.listPortals(10),
      tenderApi.getStatus().catch(() => ({ queue: null, scheduler_running: false })),
    ]);
    portals.value          = portalsRes.portals || [];
    queueRunning.value     = statusRes.queue?.running || [];
    queueUpcoming.value    = statusRes.queue?.upcoming || [];
    schedulerRunning.value = statusRes.scheduler_running;
    // IREPS status alag fetch — fail ho to baaki page break na ho
    tenderApi.irepsStatus().then(r => { irepsSession.value = r; }).catch(() => {});
    // Proxy toggle state — alag fetch, fail ho to page break na ho
    refreshProxy();
  } catch (e) {
    toast.error(`Failed to load: ${e.message}`);
  } finally {
    loading.value = false;
  }
}

async function triggerOne(code) {
  if (code === "gem" && !window.confirm("GeM ka poora sweep ~6 ghante chalta hai. Abhi shuru karein?")) return;
  if (code === "ireps" && !irepsSession.value.valid) {
    toast.error("IREPS session expired — pehle OTP se login karo");
    return;
  }
  triggering.value = true;
  try {
    await tenderApi.triggerScrape(code);
    toast.success(`${code.toUpperCase()} scrape triggered — running in background`);
  } catch (e) {
    toast.error(`Trigger failed: ${e.message}`);
  } finally {
    triggering.value = false;
  }
}

async function triggerAll() {
  if (!window.confirm("Saare portals ka sweep shuru hoga (GeM ~6 ghante, IREPS ko login chahiye). Pakka?")) return;
  triggering.value = true;
  try {
    await tenderApi.triggerScrape("all");
    toast.success("All portals triggered — running in background");
  } catch (e) {
    toast.error(`Trigger failed: ${e.message}`);
  } finally {
    triggering.value = false;
  }
}

onMounted(load);
</script>
