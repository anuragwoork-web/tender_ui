<template>
  <div class="space-y-8 animate-slide-up">
    <!-- HEADER -->
    <div class="flex items-start justify-between flex-wrap gap-4">
      <div>
        <h1 class="text-3xl font-bold text-slate-900">Portals</h1>
        <p class="text-slate-500 mt-1">
          Manage scraper portals · automated 4 times daily
        </p>
      </div>

      <div class="flex items-center gap-3">
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

        <!-- eProCURE DETAIL-MODE TOGGLE — OFF = sirf listing data, ON = detail page + CAPTCHA -->
        <button
          @click="toggleDetailMode"
          :disabled="detailBusy"
          class="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-semibold transition-colors disabled:opacity-50"
          :class="detailEnabled
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'"
          :title="detailEnabled
            ? 'eProcure Detail ON — har tender ka detail page khol ke CAPTCHA solve + full detail. OFF karne pe sirf listing data.'
            : 'eProcure Detail OFF — sirf listing table ka data save ho raha hai (CAPTCHA skip). ON karne pe full detail.'"
        >
          <ArrowPathIcon v-if="detailBusy" class="w-4 h-4 animate-spin" />
          <DocumentMagnifyingGlassIcon v-else-if="detailEnabled" class="w-4 h-4" />
          <DocumentTextIcon v-else class="w-4 h-4" />
          eProcure Detail: {{ detailEnabled ? "ON" : "OFF" }}
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
      v-if="scheduledJobs.length"
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

          <!-- Live countdown -->
          <div class="text-right">
            <p class="text-xs uppercase tracking-wider text-slate-400 mb-1.5">Next run in</p>
            <div class="flex items-center gap-1.5 font-mono">
              <div
                v-for="(part, i) in countdownParts"
                :key="i"
                class="flex flex-col items-center"
              >
                <div class="px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-2xl font-bold tabular-nums min-w-[3rem] text-center">
                  {{ part.value }}
                </div>
                <span class="text-[10px] text-slate-400 uppercase tracking-widest mt-1">
                  {{ part.label }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Day progress bar -->
        <div class="mb-2 flex items-center justify-between text-xs text-slate-400">
          <span>00:00</span>
          <span class="font-semibold text-slate-200">Today's Timeline</span>
          <span>23:59</span>
        </div>
        <div class="relative h-2 rounded-full bg-white/10 mb-3">
          <!-- Day progress -->
          <div
            class="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-primary-400 to-indigo-400 transition-all duration-1000"
            :style="{ width: dayProgress + '%' }"
          />
          <!-- Run time markers -->
          <div
            v-for="run in runMarkers"
            :key="run.key"
            class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 group"
            :style="{ left: run.percent + '%' }"
          >
            <div
              class="w-4 h-4 rounded-full border-2 transition-all duration-300"
              :class="run.done
                ? 'bg-emerald-400 border-emerald-300 shadow-glow'
                : run.next
                  ? 'bg-amber-400 border-amber-300 shadow-glow animate-pulse'
                  : 'bg-white border-white/60'"
            />
            <div class="absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <span
                class="text-[11px] font-bold tabular-nums"
                :class="run.next ? 'text-amber-300' : 'text-slate-300'"
              >
                {{ run.label }}
              </span>
            </div>
          </div>
          <!-- Now marker -->
          <div
            class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
            :style="{ left: dayProgress + '%' }"
          >
            <div class="w-3 h-3 rounded-full bg-rose-500 ring-4 ring-rose-500/30 animate-pulse" />
          </div>
        </div>

        <p class="text-center text-xs text-slate-400 mt-8">
          🟢 Done today · 🟡 Up next · ⚪ Upcoming · 🔴 Now
        </p>
      </div>
    </div>

    <!-- PORTALS GRID -->
    <div>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Squares2X2Icon class="w-5 h-5 text-slate-400" />
          Configured Portals
          <span class="badge-neutral">{{ portals.length }}</span>
        </h2>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div v-for="i in 2" :key="i" class="card p-6 animate-pulse h-72" />
      </div>

      <!-- Portal cards -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          v-for="portal in portals"
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
                    {{ portal.code?.slice(0, 2).toUpperCase() }}
                  </div>
                  <div class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
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
                <span class="badge-success">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Healthy
                </span>
                <span class="text-[10px] text-slate-400 uppercase tracking-wider">
                  Uptime 100%
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
                  <span class="text-[10px] font-bold uppercase tracking-wider">Total</span>
                </div>
                <p class="text-2xl font-bold text-slate-900 tabular-nums leading-tight">
                  {{ (portalStats(portal.code).tender_count || 0).toLocaleString("en-IN") }}
                </p>
              </div>

              <div class="p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/30 border border-emerald-100">
                <div class="flex items-center gap-1.5 text-emerald-600 mb-1">
                  <ClockIcon class="w-3.5 h-3.5" />
                  <span class="text-[10px] font-bold uppercase tracking-wider">Last Run</span>
                </div>
                <p class="text-sm font-bold text-slate-900 leading-tight">
                  {{ portalStats(portal.code).last_scraped
                      ? formatRelative(portalStats(portal.code).last_scraped)
                      : "Never" }}
                </p>
              </div>

              <div class="p-3 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/30 border border-amber-100">
                <div class="flex items-center gap-1.5 text-amber-600 mb-1">
                  <BoltIcon class="w-3.5 h-3.5" />
                  <span class="text-[10px] font-bold uppercase tracking-wider">Runs Today</span>
                </div>
                <p class="text-2xl font-bold text-slate-900 tabular-nums leading-tight">
                  {{ runsToday(portal.code) }}
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
                  v-for="(run, i) in last10Runs(portal.code)"
                  :key="i"
                  class="flex-1 h-8 rounded-md transition-all duration-200 hover:scale-110 cursor-help relative group/dot"
                  :class="runColor(run?.status)"
                  :title="runTooltip(run)"
                >
                  <span class="absolute inset-0 flex items-center justify-center opacity-0 group-hover/dot:opacity-100 text-[9px] font-bold text-white transition-opacity">
                    {{ run?.new_tenders || 0 }}
                  </span>
                </div>
              </div>
            </div>

            <!-- LAST CHECKPOINT -->
            <div v-if="portalStats(portal.code).last_scraped_tender_id" class="mb-5">
              <div class="flex items-center gap-1.5 mb-1.5">
                <BookmarkIcon class="w-3 h-3 text-slate-400" />
                <p class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  Last Checkpoint
                </p>
              </div>
              <p class="text-xs font-mono text-slate-700 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 truncate">
                {{ portalStats(portal.code).last_scraped_tender_id }}
              </p>
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
                  {{ irepsSending ? 'OTP bhej raha hai...' : 'Send OTP to Mobile' }}
                </button>
                <p class="text-[11px] text-amber-500 mt-2 text-center">
                  OTP {{ IREPS_MOBILE_HINT }} pe SMS se aayega
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
import { ref, onMounted, onUnmounted, computed } from "vue";
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
  BookmarkIcon,
  ExclamationTriangleIcon,
  KeyIcon,
  ShieldCheckIcon,
  DevicePhoneMobileIcon,
  SignalIcon,
  SignalSlashIcon,
  DocumentMagnifyingGlassIcon,
} from "@heroicons/vue/24/outline";

import { tenderApi } from "../api/tender";
import { formatRelative, formatDateTime } from "../utils/dateUtils";

const portals          = ref([]);
const stats            = ref({});
const scheduledJobs    = ref([]);
const schedulerRunning = ref(false);
const loading          = ref(true);
const triggering       = ref(false);
const logs             = ref([]);
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

// eProcure detail-mode toggle state
const detailEnabled = ref(false);   // OFF = sirf listing, ON = detail page + CAPTCHA
const detailBusy    = ref(false);   // toggle in-flight

async function refreshDetailMode() {
  try {
    const r = await tenderApi.getDetailMode();
    detailEnabled.value = r.enabled;
  } catch (e) {
    // silent — optional feature
  }
}

async function toggleDetailMode() {
  detailBusy.value = true;
  try {
    const r = await tenderApi.setDetailMode(!detailEnabled.value);
    detailEnabled.value = r.enabled;
    toast.success(
      r.enabled
        ? "eProcure Detail ON — agli scrape me har tender ka full detail (CAPTCHA solve hoga)"
        : "eProcure Detail OFF — agli scrape me sirf listing data save hoga"
    );
  } catch (e) {
    toast.error(`Detail-mode toggle failed: ${e.message}`);
  } finally {
    detailBusy.value = false;
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
    await tenderApi.irepsSendOtp();
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
    irepsSession.value = { valid: true, saved_date: res.saved_date, message: res.message };
    irepsOtp.value    = "";
    irepsOtpSent.value = false;
    toast.success(`IREPS login successful — session saved for ${res.saved_date}`);
  } catch (e) {
    toast.error(`IREPS login failed: ${e.message}`);
  } finally {
    irepsLogging.value = false;
  }
}

function portalStats(code) {
  return (stats.value.portals || []).find(p => p.code === code) || {};
}

function to12Hour(hour24, minute) {
  const period = hour24 >= 12 ? "PM" : "AM";
  let h = hour24 % 12;
  if (h === 0) h = 12;
  const hh = String(h).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return `${hh}:${mm} ${period}`;
}

// Live ticking clock
const now = ref(Date.now());
let tickInterval = null;

onMounted(() => {
  tickInterval = setInterval(() => { now.value = Date.now(); }, 1000);
});
onUnmounted(() => {
  if (tickInterval) clearInterval(tickInterval);
});

const countdownParts = computed(() => {
  const nextRun = scheduledJobs.value[0]?.next_run;
  if (!nextRun) return [{ value: "--", label: "h" }, { value: "--", label: "m" }, { value: "--", label: "s" }];

  let diff = Math.max(0, new Date(nextRun).getTime() - now.value);
  const hours   = Math.floor(diff / 3_600_000); diff -= hours * 3_600_000;
  const minutes = Math.floor(diff / 60_000);    diff -= minutes * 60_000;
  const seconds = Math.floor(diff / 1000);

  return [
    { value: String(hours).padStart(2, "0"),   label: "h" },
    { value: String(minutes).padStart(2, "0"), label: "m" },
    { value: String(seconds).padStart(2, "0"), label: "s" },
  ];
});

// Parse scheduled run times → [{ hour, minute, key }]
const scheduledRuns = computed(() => {
  const list = [];
  scheduledJobs.value.forEach(j => {
    const hourMatch   = j.trigger?.match(/hour\s*=\s*'([^']+)'/);
    const minuteMatch = j.trigger?.match(/minute\s*=\s*'([^']+)'/);
    if (!hourMatch) return;
    const hours   = hourMatch[1].split(",").map(h => Number(h.trim()));
    const minutes = minuteMatch ? minuteMatch[1].split(",").map(m => Number(m.trim())) : [0];
    hours.forEach(h => {
      minutes.forEach(m => {
        list.push({ hour: h, minute: m, key: h * 100 + m });
      });
    });
  });
  return list.sort((a, b) => a.key - b.key);
});

// Day progress 0-100% (current time / 24h)
const dayProgress = computed(() => {
  const d = new Date(now.value);
  const totalMin = d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
  return (totalMin / (24 * 60)) * 100;
});

// Run markers with done/next state
const runMarkers = computed(() => {
  const currentMin = (() => {
    const d = new Date(now.value);
    return d.getHours() * 60 + d.getMinutes();
  })();

  // Find next run
  let nextIdx = -1;
  for (let i = 0; i < scheduledRuns.value.length; i++) {
    if (scheduledRuns.value[i].hour * 60 + scheduledRuns.value[i].minute > currentMin) {
      nextIdx = i;
      break;
    }
  }

  return scheduledRuns.value.map((r, i) => {
    const runMin = r.hour * 60 + r.minute;
    const percent = (runMin / (24 * 60)) * 100;
    return {
      key:    r.key,
      label:  to12Hour(r.hour, r.minute),
      percent,
      done:   runMin <= currentMin,
      next:   i === nextIdx,
    };
  });
});

// Last 10 runs for a portal
function last10Runs(portalCode) {
  const filtered = logs.value.filter(l => l.portal === portalCode).slice(0, 10);
  // Pad to 10 with nulls if fewer
  while (filtered.length < 10) filtered.push(null);
  return filtered;
}

function runColor(status) {
  if (status === "success") return "bg-emerald-400 hover:bg-emerald-500";
  if (status === "partial") return "bg-amber-400 hover:bg-amber-500";
  if (status === "failed")  return "bg-red-400 hover:bg-red-500";
  return "bg-slate-200";
}

function runTooltip(run) {
  if (!run) return "No run yet";
  return `${run.status.toUpperCase()} · ${formatDateTime(run.started_at)} · new: ${run.new_tenders || 0}`;
}

// Runs today for a portal
function runsToday(portalCode) {
  const today = new Date().toISOString().slice(0, 10);
  return logs.value.filter(l =>
    l.portal === portalCode && (l.started_at || "").startsWith(today)
  ).length;
}

async function load() {
  loading.value = true;
  try {
    const [portalsRes, statsRes, statusRes, logsRes] = await Promise.all([
      tenderApi.listPortals(),
      tenderApi.getStats(),
      tenderApi.getStatus(),
      tenderApi.getLogs(50),
    ]);
    portals.value          = portalsRes.portals || [];
    stats.value            = statsRes;
    scheduledJobs.value    = statusRes.jobs || [];
    schedulerRunning.value = statusRes.scheduler_running;
    logs.value             = logsRes.logs || [];
    // IREPS status alag fetch — fail ho to baaki page break na ho
    tenderApi.irepsStatus().then(r => { irepsSession.value = r; }).catch(() => {});
    // Proxy toggle state — alag fetch, fail ho to page break na ho
    refreshProxy();
    // eProcure detail-mode toggle state — alag fetch
    refreshDetailMode();
  } catch (e) {
    toast.error(`Failed to load: ${e.message}`);
  } finally {
    loading.value = false;
  }
}

async function triggerOne(code) {
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
