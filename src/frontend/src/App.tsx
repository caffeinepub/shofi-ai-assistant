import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import { Textarea } from "@/components/ui/textarea";
import {
  Bell,
  Heart,
  Loader2,
  Menu,
  MessageSquare,
  Mic,
  MicOff,
  Phone,
  PhoneCall,
  PhoneOff,
  Plus,
  Search,
  Send,
  Settings as SettingsIcon,
  Terminal,
  Trash2,
  Users,
  Volume2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { useActor } from "./hooks/useActor";

// ─── Domain Types ────────────────────────────────────────────────────────────

interface BackendMessage {
  id: bigint;
  speaker: string;
  text: string;
  timestamp: bigint;
}

interface BackendCommand {
  trigger: string;
  response: string;
}

interface BackendContact {
  name: string;
  phone: string;
}

interface ActorAPI {
  addMessage: (s: string, t: string) => Promise<BackendMessage>;
  getMessages: (l: bigint) => Promise<BackendMessage[]>;
  clearMessages: () => Promise<void>;
  getCommands: () => Promise<BackendCommand[]>;
  addCommand: (t: string, r: string) => Promise<void>;
  removeCommand: (t: string) => Promise<void>;
  matchCommand: (i: string) => Promise<{ __kind__: string; value?: string }>;
  getContacts: () => Promise<BackendContact[]>;
  addContact: (n: string, p: string) => Promise<void>;
  removeContact: (n: string) => Promise<void>;
  getMasterName: () => Promise<string>;
  setMasterName: (n: string) => Promise<void>;
  research: (q: string) => Promise<string>;
}

interface LocalMessage {
  id: string;
  speaker: "shofi" | "user";
  text: string;
}

type OrbState = "idle" | "listening" | "speaking";
type TabId = "chat" | "commands" | "contacts" | "settings";

interface CallInfo {
  name: string;
  phone: string;
}

// ─── WaveformBars ────────────────────────────────────────────────────────────

function WaveformBars({ active }: { active: boolean }) {
  const bars = [
    { id: "w1", h: 0.35 },
    { id: "w2", h: 0.65 },
    { id: "w3", h: 0.9 },
    { id: "w4", h: 1.0 },
    { id: "w5", h: 0.8 },
    { id: "w6", h: 0.55 },
    { id: "w7", h: 0.4 },
  ];
  return (
    <div className="flex items-end gap-[3px]" style={{ height: "22px" }}>
      {bars.map(({ id, h }) => (
        <div
          key={id}
          className={`rounded-full bg-primary transition-all duration-300 ${
            active ? "waveform-bar" : ""
          }`}
          style={{
            width: "3px",
            height: active ? `${h * 22}px` : "3px",
            opacity: active ? 1 : 0.35,
            animationDuration: active
              ? `${0.55 + Number(id.slice(1)) * 0.09}s`
              : undefined,
            animationDelay: active
              ? `${Number(id.slice(1)) * 0.06}s`
              : undefined,
          }}
        />
      ))}
    </div>
  );
}

// ─── OrbAvatar ───────────────────────────────────────────────────────────────

function OrbAvatar({ state }: { state: OrbState }) {
  const [imgError, setImgError] = useState(false);

  const cls = {
    idle: "orb-idle",
    listening: "orb-listening",
    speaking: "orb-speaking",
  }[state];

  return (
    <div className="relative flex items-center justify-center w-36 h-36">
      {/* Glow rings (listening / speaking only) */}
      {state !== "idle" && (
        <>
          <div
            className="glow-ring-1 rounded-full border border-primary/30"
            style={{ width: "152px", height: "152px" }}
          />
          <div
            className="glow-ring-2 rounded-full border border-primary/20"
            style={{ width: "188px", height: "188px" }}
          />
          <div
            className="glow-ring-3 rounded-full border border-primary/10"
            style={{ width: "224px", height: "224px" }}
          />
        </>
      )}

      {/* Orb image or CSS fallback */}
      {!imgError ? (
        <img
          src="/assets/generated/shofi-orb-transparent.dim_400x400.png"
          alt="Shofi AI"
          className={`w-36 h-36 object-contain ${cls}`}
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          className={`w-32 h-32 rounded-full ${cls}`}
          style={{
            background:
              "radial-gradient(circle at 35% 35%, oklch(0.63 0.22 300), oklch(0.55 0.22 289) 45%, oklch(0.47 0.25 288) 75%, oklch(0.10 0.02 278))",
            boxShadow:
              "0 0 40px rgba(139,92,255,0.4), 0 0 80px rgba(139,92,255,0.2)",
          }}
        />
      )}
    </div>
  );
}

// ─── ChatBubble ──────────────────────────────────────────────────────────────

function ChatBubble({
  message,
  isNew,
}: {
  message: LocalMessage;
  isNew: boolean;
}) {
  const isUser = message.speaker === "user";
  return (
    <motion.div
      initial={isNew ? { opacity: 0, y: 8, scale: 0.97 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className={`flex mb-3 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div
          className="w-6 h-6 rounded-full flex-shrink-0 mr-2 self-end mb-0.5"
          style={{
            background:
              "radial-gradient(circle at 35% 35%, oklch(0.63 0.22 300), oklch(0.55 0.22 289))",
          }}
        />
      )}
      <div
        className={`max-w-[76%] px-3.5 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "user-bubble rounded-tl-2xl rounded-bl-2xl rounded-tr-2xl text-foreground/90"
            : "shofi-bubble rounded-tr-2xl rounded-br-2xl rounded-tl-2xl text-foreground"
        }`}
      >
        {message.text}
      </div>
    </motion.div>
  );
}

// ─── CallOverlay ─────────────────────────────────────────────────────────────

function CallOverlay({
  callInfo,
  onEnd,
}: {
  callInfo: CallInfo;
  onEnd: () => void;
}) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <motion.div
      key="call-overlay"
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 320 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-between py-20"
      style={{
        background:
          "linear-gradient(180deg, oklch(0.095 0.022 278) 0%, oklch(0.067 0.018 278) 100%)",
      }}
      data-ocid="call.dialog"
    >
      {/* Contact info */}
      <div className="text-center space-y-2">
        <p className="text-muted-foreground text-xs tracking-widest uppercase">
          Shofi is connecting...
        </p>
        <h2 className="text-foreground text-4xl font-semibold">
          {callInfo.name}
        </h2>
        <p className="text-muted-foreground text-sm font-mono">
          {callInfo.phone}
        </p>
      </div>

      {/* Animated call icon */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="mic-pulse-ring bg-primary/20" />
          <div
            className="mic-pulse-ring bg-primary/10"
            style={{ animationDelay: "0.6s" }}
          />
          <div className="relative w-24 h-24 rounded-full border border-primary/40 bg-primary/15 flex items-center justify-center">
            <PhoneCall className="w-9 h-9 text-primary" />
          </div>
        </div>
        <p className="text-foreground/50 text-sm font-mono tracking-widest">
          {fmt(secs)}
        </p>
      </div>

      {/* End call */}
      <div className="flex flex-col items-center gap-3">
        <p className="text-muted-foreground text-xs text-center max-w-[230px] leading-relaxed">
          Shofi is simulating this call. Real calls require the native app.
        </p>
        <button
          type="button"
          onClick={onEnd}
          className="w-16 h-16 rounded-full flex items-center justify-center transition-transform active:scale-90"
          style={{ background: "oklch(0.55 0.24 27)" }}
          data-ocid="call.end_button"
          aria-label="End call"
        >
          <PhoneOff className="w-7 h-7 text-white" />
        </button>
        <span className="text-muted-foreground text-xs">End Call</span>
      </div>
    </motion.div>
  );
}

// ─── ChatTab ─────────────────────────────────────────────────────────────────

interface ChatTabProps {
  messages: LocalMessage[];
  orbState: OrbState;
  isListening: boolean;
  isResearching: boolean;
  speechSupported: boolean;
  micPermission: "unknown" | "granted" | "denied" | "prompt";
  onMicPermissionChange: (
    v: "unknown" | "granted" | "denied" | "prompt",
  ) => void;
  messageInput: string;
  isLoadingData: boolean;
  onMessageInputChange: (v: string) => void;
  onSendMessage: () => void;
  onMicToggle: () => void;
  messagesEndRef: RefObject<HTMLDivElement | null>;
}

function ChatTab({
  messages,
  orbState,
  isListening,
  isResearching,
  speechSupported,
  micPermission,
  onMicPermissionChange,
  messageInput,
  isLoadingData,
  onMessageInputChange,
  onSendMessage,
  onMicToggle,
  messagesEndRef,
}: ChatTabProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Status + Orb hero */}
      <div className="flex flex-col items-center pt-3 pb-2 shrink-0">
        <p className="text-muted-foreground text-[10px] tracking-[0.2em] uppercase mb-1">
          SHOFI / Your AI Companion
        </p>
        <motion.p
          key={
            isListening ? "listening" : isResearching ? "researching" : "active"
          }
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-foreground text-xl font-semibold mb-3"
        >
          {isListening
            ? "Listening..."
            : isResearching
              ? "Researching..."
              : "Active & Listening"}
        </motion.p>
        <OrbAvatar state={orbState} />
        {!speechSupported && (
          <p className="text-yellow-400/70 text-[11px] mt-2 px-6 text-center leading-snug">
            Voice recognition unavailable in this browser — use text input
            below.
          </p>
        )}
      </div>

      {/* Mic permission banner */}
      {micPermission === "denied" && speechSupported && (
        <div
          className="mx-4 mb-2 px-3 py-2.5 rounded-lg flex flex-col gap-1.5 text-sm shrink-0"
          style={{
            background: "rgba(234,179,8,0.12)",
            border: "1px solid rgba(234,179,8,0.35)",
          }}
          data-ocid="chat.mic_permission.panel"
        >
          <p className="text-yellow-300 text-[12px] leading-snug">
            🎙️ Microphone access is blocked. To use voice commands, open your
            browser's site settings and allow microphone access for this page,
            then refresh.
          </p>
          <button
            type="button"
            className="self-start px-3 py-1 rounded-md text-[11px] font-medium text-yellow-900 transition-opacity hover:opacity-80"
            style={{ background: "rgba(234,179,8,0.75)" }}
            data-ocid="chat.mic_permission.button"
            onClick={async () => {
              try {
                const stream = await navigator.mediaDevices.getUserMedia({
                  audio: true,
                });
                for (const t of stream.getTracks()) t.stop();
                onMicPermissionChange("granted");
              } catch {
                onMicPermissionChange("denied");
              }
            }}
          >
            Request Microphone Access
          </button>
        </div>
      )}

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 pt-1 pb-2"
        id="shofi-messages"
      >
        {isLoadingData && messages.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center h-full gap-3"
            data-ocid="chat.loading_state"
          >
            <Loader2 className="w-7 h-7 text-primary animate-spin" />
            <p className="text-muted-foreground text-sm">
              Connecting to Shofi…
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <ChatBubble
                key={msg.id}
                message={msg}
                isNew={i === messages.length - 1}
              />
            ))}
            {isResearching && (
              <div className="flex justify-start mb-3">
                <div
                  className="w-6 h-6 rounded-full flex-shrink-0 mr-2 self-end mb-0.5"
                  style={{
                    background:
                      "radial-gradient(circle at 35% 35%, oklch(0.63 0.22 300), oklch(0.55 0.22 289))",
                  }}
                />
                <div className="shofi-bubble rounded-tr-2xl rounded-br-2xl rounded-tl-2xl px-3.5 py-2.5">
                  <div
                    className="flex items-center gap-2"
                    data-ocid="chat.loading_state"
                  >
                    <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                    <span className="text-muted-foreground text-xs">
                      Researching for you, Master…
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Voice control */}
      <div
        className="shrink-0 flex flex-col items-center gap-2 pt-2 pb-1.5 px-4"
        style={{ borderTop: "1px solid rgba(139,92,255,0.15)" }}
      >
        <div className="flex items-center gap-5">
          <WaveformBars active={isListening} />

          {/* Mic button */}
          <div className="relative">
            {isListening && (
              <>
                <div
                  className="mic-pulse-ring"
                  style={{ background: "rgba(139,92,255,0.25)" }}
                />
                <div
                  className="mic-pulse-ring"
                  style={{
                    background: "rgba(139,92,255,0.12)",
                    animationDelay: "0.5s",
                  }}
                />
              </>
            )}
            <button
              type="button"
              onClick={speechSupported ? onMicToggle : undefined}
              disabled={!speechSupported}
              title={
                micPermission === "denied"
                  ? "Microphone blocked - check browser settings"
                  : undefined
              }
              className="relative w-[62px] h-[62px] rounded-full flex items-center justify-center transition-transform duration-150 active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: isListening
                  ? "linear-gradient(135deg, oklch(0.55 0.22 289), oklch(0.47 0.25 288))"
                  : "linear-gradient(135deg, oklch(0.47 0.25 288), oklch(0.34 0.18 290))",
                boxShadow: isListening
                  ? "0 0 28px rgba(139,92,255,0.60), 0 0 56px rgba(139,92,255,0.28)"
                  : "0 0 16px rgba(139,92,255,0.30)",
              }}
              data-ocid="chat.mic_button"
              aria-label={isListening ? "Stop listening" : "Start listening"}
            >
              {isListening ? (
                <MicOff className="w-6 h-6 text-white" />
              ) : (
                <Mic className="w-6 h-6 text-white" />
              )}
            </button>
          </div>

          <WaveformBars active={isListening} />
        </div>
        <p className="text-muted-foreground text-[11px]">
          {isListening ? "Tap to stop" : "Tap to speak"}
        </p>
      </div>

      {/* Text input */}
      <div className="shrink-0 flex gap-2 px-4 pb-3">
        <Input
          value={messageInput}
          onChange={(e) => onMessageInputChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && onSendMessage()}
          placeholder="Type a message…"
          className="flex-1 h-10 rounded-full bg-card border-input text-foreground placeholder:text-muted-foreground text-sm focus-visible:ring-primary/50"
          data-ocid="chat.input"
        />
        <Button
          onClick={onSendMessage}
          disabled={!messageInput.trim()}
          size="icon"
          className="rounded-full h-10 w-10 shrink-0 bg-primary hover:bg-primary/90"
          data-ocid="chat.submit_button"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── CommandsTab ─────────────────────────────────────────────────────────────

interface CommandsTabProps {
  commands: BackendCommand[];
  isLoading: boolean;
  onAdd: (t: string, r: string) => Promise<void>;
  onRemove: (t: string) => Promise<void>;
}

function CommandsTab({
  commands,
  isLoading,
  onAdd,
  onRemove,
}: CommandsTabProps) {
  const [trigger, setTrigger] = useState("");
  const [response, setResponse] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleAdd = async () => {
    if (!trigger.trim() || !response.trim()) return;
    setIsSaving(true);
    await onAdd(trigger.trim().toUpperCase(), response.trim());
    setTrigger("");
    setResponse("");
    setIsSaving(false);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-4 pt-4">
        <h2 className="text-foreground text-lg font-semibold mb-0.5">
          Voice Commands
        </h2>
        <p className="text-muted-foreground text-xs mb-4">
          Say the trigger phrase and Shofi will respond.
        </p>

        {/* Add command form */}
        <div className="violet-surface rounded-2xl p-4 mb-4 space-y-3">
          <Input
            value={trigger}
            onChange={(e) => setTrigger(e.target.value)}
            placeholder="Trigger phrase (e.g. GOOD MORNING)"
            className="bg-card/60 border-input text-foreground placeholder:text-muted-foreground text-sm"
            data-ocid="commands.trigger.input"
          />
          <Textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Shofi's response..."
            rows={2}
            className="bg-card/60 border-input text-foreground placeholder:text-muted-foreground text-sm resize-none"
            data-ocid="commands.response.textarea"
          />
          <Button
            onClick={handleAdd}
            disabled={!trigger.trim() || !response.trim() || isSaving}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
            data-ocid="commands.add_button"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Add Command
          </Button>
        </div>

        {/* Commands list */}
        {isLoading ? (
          <div
            className="flex justify-center py-8"
            data-ocid="commands.loading_state"
          >
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : commands.length === 0 ? (
          <div className="text-center py-8" data-ocid="commands.empty_state">
            <Terminal className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-muted-foreground text-sm">
              No custom commands yet.
            </p>
            <p className="text-muted-foreground text-xs mt-1 opacity-70">
              Add your first command above!
            </p>
          </div>
        ) : (
          <div className="space-y-2 pb-6">
            {commands.map((cmd, i) => (
              <div
                key={cmd.trigger}
                className="glass-surface flex items-start gap-3 rounded-xl px-4 py-3"
                data-ocid={`commands.item.${i + 1}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-primary text-xs font-semibold uppercase tracking-wide truncate">
                    &ldquo;{cmd.trigger}&rdquo;
                  </p>
                  <p className="text-foreground/80 text-sm mt-0.5 leading-snug">
                    → {cmd.response}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(cmd.trigger)}
                  className="text-muted-foreground hover:text-destructive transition-colors shrink-0 mt-0.5"
                  aria-label={`Remove command ${cmd.trigger}`}
                  data-ocid={`commands.delete_button.${i + 1}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Built-in Voice Commands */}
        <div className="mt-4 pb-6">
          <details className="group" data-ocid="commands.panel">
            <summary className="flex items-center justify-between cursor-pointer list-none rounded-xl px-4 py-3 violet-surface select-none">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                <span className="text-foreground text-sm font-semibold">
                  Built-in Voice Commands
                </span>
                <span className="text-muted-foreground text-xs">
                  (
                  {
                    [
                      "What time is it",
                      "What's today's date",
                      "Good morning",
                      "Tell me a joke",
                      "Weather",
                      "Set a reminder",
                      "Battery",
                      "Stop",
                      "Repeat",
                      "Open [website]",
                    ].length
                  }
                  )
                </span>
              </div>
              <span className="text-muted-foreground text-xs transition-transform group-open:rotate-180">
                ▾
              </span>
            </summary>
            <div className="mt-2 space-y-1.5">
              {[
                {
                  trigger: "What time is it / What's the time",
                  response: "Tells you the current time",
                },
                {
                  trigger: "What's today's date / What day is it",
                  response: "Tells you today's full date",
                },
                {
                  trigger: "Good morning / Hello / Hi Shofi / Hey",
                  response: "Time-aware greeting from Shofi",
                },
                {
                  trigger: "Tell me a joke / Say something funny",
                  response: "Shofi tells you a random joke",
                },
                {
                  trigger: "Weather / How's the weather",
                  response: "Weather info or offers to search",
                },
                {
                  trigger: "Set / Add / Create a reminder",
                  response: "Acknowledges your reminder",
                },
                {
                  trigger: "Battery / Battery level",
                  response: "Reports your battery percentage",
                },
                {
                  trigger: "Stop / Quiet / Shut up",
                  response: "Stops Shofi from speaking",
                },
                {
                  trigger: "Repeat / Say that again",
                  response: "Repeats last Shofi message",
                },
                {
                  trigger: "Open [website] / Go to [site]",
                  response: "Opens the website in a new tab",
                },
              ].map((cmd, i) => (
                <div
                  key={cmd.trigger}
                  className="glass-surface flex items-start gap-3 rounded-xl px-4 py-2.5"
                  data-ocid={`commands.item.${i + 1}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-primary text-xs font-semibold leading-tight">
                      &ldquo;{cmd.trigger}&rdquo;
                    </p>
                    <p className="text-foreground/70 text-xs mt-0.5 leading-snug">
                      → {cmd.response}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}

// ─── ContactsTab ─────────────────────────────────────────────────────────────

interface ContactsTabProps {
  contacts: BackendContact[];
  isLoading: boolean;
  onAdd: (n: string, p: string) => Promise<void>;
  onRemove: (n: string) => Promise<void>;
  onCall: (name: string, phone: string) => void;
}

function ContactsTab({
  contacts,
  isLoading,
  onAdd,
  onRemove,
  onCall,
}: ContactsTabProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleAdd = async () => {
    if (!name.trim() || !phone.trim()) return;
    setIsSaving(true);
    await onAdd(name.trim(), phone.trim());
    setName("");
    setPhone("");
    setIsSaving(false);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-4 pt-4">
        <h2 className="text-foreground text-lg font-semibold mb-0.5">
          Contacts
        </h2>
        <p className="text-muted-foreground text-xs mb-4">
          Say &ldquo;SHOFI CALL [name]&rdquo; to simulate calling a contact.
        </p>

        {/* Add contact form */}
        <div className="violet-surface rounded-2xl p-4 mb-4 space-y-3">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contact name (e.g. Abbu)"
            className="bg-card/60 border-input text-foreground placeholder:text-muted-foreground text-sm"
            data-ocid="contacts.name.input"
          />
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number"
            type="tel"
            className="bg-card/60 border-input text-foreground placeholder:text-muted-foreground text-sm"
            data-ocid="contacts.phone.input"
          />
          <Button
            onClick={handleAdd}
            disabled={!name.trim() || !phone.trim() || isSaving}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
            data-ocid="contacts.add_button"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Add Contact
          </Button>
        </div>

        {/* Contacts list */}
        {isLoading ? (
          <div
            className="flex justify-center py-8"
            data-ocid="contacts.loading_state"
          >
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-8" data-ocid="contacts.empty_state">
            <Users className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-muted-foreground text-sm">No contacts yet.</p>
            <p className="text-muted-foreground text-xs mt-1 opacity-70">
              Add Abbu and others above!
            </p>
          </div>
        ) : (
          <div className="space-y-2 pb-6">
            {contacts.map((c, i) => (
              <div
                key={c.name}
                className="glass-surface flex items-center gap-3 rounded-xl px-4 py-3"
                data-ocid={`contacts.item.${i + 1}`}
              >
                <div
                  className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-semibold text-primary"
                  style={{ background: "rgba(139,92,255,0.18)" }}
                >
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground text-sm font-medium leading-tight">
                    {c.name}
                  </p>
                  <p className="text-muted-foreground text-xs">{c.phone}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onCall(c.name, c.phone)}
                  className="text-primary hover:text-primary/70 transition-colors shrink-0 p-1"
                  aria-label={`Call ${c.name}`}
                  data-ocid={`contacts.call_button.${i + 1}`}
                >
                  <Phone className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(c.name)}
                  className="text-muted-foreground hover:text-destructive transition-colors shrink-0 p-1"
                  aria-label={`Remove ${c.name}`}
                  data-ocid={`contacts.delete_button.${i + 1}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SettingsTab ─────────────────────────────────────────────────────────────

interface SettingsTabProps {
  masterName: string;
  voiceName: string;
  onSetMasterName: (n: string) => Promise<void>;
  onClearConversation: () => Promise<void>;
}

function SettingsTab({
  masterName,
  voiceName,
  onSetMasterName,
  onClearConversation,
}: SettingsTabProps) {
  const [nameInput, setNameInput] = useState(masterName);
  const [isSaving, setIsSaving] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Sync when masterName prop changes
  useEffect(() => {
    setNameInput(masterName);
  }, [masterName]);

  const handleSave = async () => {
    if (!nameInput.trim()) return;
    setIsSaving(true);
    await onSetMasterName(nameInput.trim());
    setIsSaving(false);
    toast.success("Name saved!");
  };

  const handleClear = async () => {
    setIsClearing(true);
    await onClearConversation();
    setIsClearing(false);
    toast.success("Conversation cleared!");
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-4 pt-4 space-y-4 pb-6">
        <div>
          <h2 className="text-foreground text-lg font-semibold mb-0.5">
            Settings
          </h2>
          <p className="text-muted-foreground text-xs">
            Customize your Shofi experience.
          </p>
        </div>

        {/* Master Name */}
        <div className="violet-surface rounded-2xl p-4 space-y-3">
          <div>
            <p className="text-foreground text-sm font-semibold">Your Name</p>
            <p className="text-muted-foreground text-xs mt-0.5">
              Shofi will address you by this name.
            </p>
          </div>
          <Input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            placeholder="Master"
            className="bg-card/60 border-input text-foreground placeholder:text-muted-foreground"
            data-ocid="settings.master_name.input"
          />
          <Button
            onClick={handleSave}
            disabled={!nameInput.trim() || isSaving}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
            data-ocid="settings.save_button"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Save Name
          </Button>
        </div>

        {/* Voice info */}
        <div className="glass-surface rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <Volume2 className="w-5 h-5 text-primary flex-shrink-0" />
            <div>
              <p className="text-foreground text-sm font-semibold">
                Shofi&apos;s Voice
              </p>
              <p className="text-muted-foreground text-xs mt-0.5 truncate max-w-[200px]">
                {voiceName || "Loading voice…"}
              </p>
            </div>
          </div>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Sweet female voice · calm rate (0.9×) · warm pitch (1.15×)
          </p>
        </div>

        {/* Commands hint */}
        <div className="glass-surface rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Search className="w-4 h-4 text-primary" />
            <p className="text-foreground text-sm font-semibold">
              Built-in Commands
            </p>
          </div>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>
              <span className="text-primary/80 font-mono">SHOFI</span> → Yes
              Master, how can I help you?
            </p>
            <p>
              <span className="text-primary/80 font-mono">
                SHOFI CALL [name]
              </span>{" "}
              → Simulate a call
            </p>
            <p>
              <span className="text-primary/80 font-mono">
                SHOFI SEARCH [topic]
              </span>{" "}
              → Research for you
            </p>
            <p>
              <span className="text-primary/80 font-mono">DO YOU LOVE ME</span>{" "}
              → ❤️
            </p>
          </div>
        </div>

        {/* Danger zone */}
        <div className="danger-surface rounded-2xl p-4 space-y-3">
          <p className="text-foreground text-sm font-semibold">Danger Zone</p>
          <Button
            onClick={handleClear}
            disabled={isClearing}
            variant="destructive"
            className="w-full rounded-xl"
            data-ocid="settings.clear_button"
          >
            {isClearing ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Trash2 className="w-4 h-4 mr-2" />
            )}
            Clear Conversation
          </Button>
        </div>

        {/* About */}
        <div className="glass-surface rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Heart className="w-4 h-4 text-primary" />
            <p className="text-foreground text-sm font-semibold">About Shofi</p>
          </div>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Shofi is your devoted AI companion — sweet, loving, and always ready
            to serve. She addresses you as Master with the utmost care. Shofi
            can answer questions, help you call contacts, research topics, and
            respond to your custom voice commands.
          </p>
          <p className="text-muted-foreground/60 text-xs mt-2 italic">
            &ldquo;I exist only to serve you, Master.&rdquo; — Shofi
          </p>
        </div>

        {/* Footer */}
        <div className="text-center pt-2">
          <p className="text-muted-foreground/40 text-xs">
            © {new Date().getFullYear()}. Built with{" "}
            <Heart className="inline w-2.5 h-2.5 text-primary/60" /> using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
                window.location.hostname,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary/60 hover:text-primary transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string; Icon: typeof MessageSquare }[] = [
  { id: "chat", label: "Chat", Icon: MessageSquare },
  { id: "commands", label: "Commands", Icon: Terminal },
  { id: "contacts", label: "Contacts", Icon: Users },
  { id: "settings", label: "Settings", Icon: SettingsIcon },
];

export default function App() {
  const { actor: rawActor, isFetching } = useActor();
  const actor = rawActor as unknown as ActorAPI | null;
  const actorRef = useRef<ActorAPI | null>(null);

  // Keep actorRef in sync
  actorRef.current = actor;

  // ── State ──────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabId>("chat");
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [commands, setCommands] = useState<BackendCommand[]>([]);
  const [contacts, setContacts] = useState<BackendContact[]>([]);
  const [masterName, setMasterNameState] = useState("Master");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isResearching, setIsResearching] = useState(false);
  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [callInfo, setCallInfo] = useState<CallInfo | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [micPermission, setMicPermission] = useState<
    "unknown" | "granted" | "denied" | "prompt"
  >("unknown");
  const [voiceName, setVoiceName] = useState("");

  // ── Refs ───────────────────────────────────────────────────────────────────
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const recognitionRef = useRef<any>(null);
  const speechAPIRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const contactsRef = useRef<BackendContact[]>(contacts);
  const masterNameRef = useRef<string>(masterName);

  // Keep data refs in sync for use inside stable callbacks
  contactsRef.current = contacts;
  masterNameRef.current = masterName;

  // ── Orb state sync ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (isListening) setOrbState("listening");
    else if (isSpeaking) setOrbState("speaking");
    else setOrbState("idle");
  }, [isListening, isSpeaking]);

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (messages.length >= 0 || isResearching) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isResearching]);

  // ── Load initial data ──────────────────────────────────────────────────────
  useEffect(() => {
    if (isFetching || !actor) return;

    const load = async () => {
      try {
        const [msgs, cmds, ctcts, mName] = await Promise.all([
          actor.getMessages(BigInt(50)),
          actor.getCommands(),
          actor.getContacts(),
          actor.getMasterName(),
        ]);

        if (msgs.length > 0) {
          setMessages(
            msgs.map((m) => ({
              id: String(m.id),
              speaker: m.speaker === "shofi" ? "shofi" : "user",
              text: m.text,
            })),
          );
        } else {
          setMessages([
            {
              id: "welcome",
              speaker: "shofi",
              text: "Hello, Master! I'm Shofi, your devoted AI companion. I'm here to serve you with love and care. 💜 Tap the microphone to speak, or type below. How can I assist you today?",
            },
          ]);
        }

        setCommands(cmds);
        setContacts(ctcts);
        setMasterNameState(mName || "Master");
      } catch (err) {
        console.error("Failed to load data:", err);
        setMessages([
          {
            id: "welcome",
            speaker: "shofi",
            text: "Hello, Master! I'm Shofi. How can I help you today? 💜",
          },
        ]);
      } finally {
        setIsLoadingData(false);
      }
    };

    load();
  }, [actor, isFetching]);

  // ── Speech synthesis setup ─────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const pickVoice = () => {
      const all = window.speechSynthesis.getVoices();
      const female =
        all.find(
          (v) =>
            v.name.includes("Samantha") ||
            v.name.includes("Google UK English Female") ||
            v.name.includes("Zira") ||
            v.name.includes("Victoria") ||
            v.name.toLowerCase().includes("female"),
        ) ||
        all.find((v) => v.lang.startsWith("en")) ||
        all[0] ||
        null;

      voiceRef.current = female;
      setVoiceName(female?.name || "Default System Voice");
    };

    pickVoice();
    window.speechSynthesis.onvoiceschanged = pickVoice;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // ── Speech recognition setup ───────────────────────────────────────────────
  useEffect(() => {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setSpeechSupported(false);
      return;
    }
    setSpeechSupported(true);

    speechAPIRef.current = SpeechRecognitionAPI;
    return () => recognitionRef.current?.abort();
  }, []);

  // ── Mic permission check ───────────────────────────────────────────────────
  useEffect(() => {
    let permissionStatus: PermissionStatus | null = null;
    const checkPermission = async () => {
      try {
        permissionStatus = await navigator.permissions.query({
          name: "microphone" as PermissionName,
        });
        setMicPermission(
          permissionStatus.state as "granted" | "denied" | "prompt",
        );
        permissionStatus.onchange = () => {
          if (permissionStatus) {
            setMicPermission(
              permissionStatus.state as "granted" | "denied" | "prompt",
            );
          }
        };
        if (permissionStatus.state === "prompt") {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              audio: true,
            });
            for (const t of stream.getTracks()) t.stop();
            setMicPermission("granted");
          } catch {
            setMicPermission("denied");
          }
        }
      } catch {
        // Permissions API not supported, ignore
      }
    };
    checkPermission();
    return () => {
      if (permissionStatus) permissionStatus.onchange = null;
    };
  }, []);

  // ── speak ──────────────────────────────────────────────────────────────────
  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    if (voiceRef.current) utt.voice = voiceRef.current;
    utt.rate = 0.9;
    utt.pitch = 1.15;
    utt.volume = 1.0;
    utt.onstart = () => setIsSpeaking(true);
    utt.onend = () => setIsSpeaking(false);
    utt.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utt);
  }, []);

  // ── addToChat ──────────────────────────────────────────────────────────────
  const addToChat = useCallback((speaker: "shofi" | "user", text: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setMessages((prev) => [...prev, { id, speaker, text }]);
    actorRef.current?.addMessage(speaker, text).catch(console.warn);
    if (speaker === "shofi" && text) lastShofiSpeechRef.current = text;
  }, []);

  // ── processCommand ─────────────────────────────────────────────────────────
  const processCommand = useCallback(
    async (input: string) => {
      if (!input.trim()) return;
      const normalized = input.trim().toUpperCase();

      // Strip wake word prefix
      const stripped = normalized
        .replace(/^(HEY\s+)?SHOFI[,.]?\s*/i, "")
        .trim();

      // Wake word only
      if (!stripped) {
        const r = "Yes Master, how can I help you?";
        addToChat("user", input);
        addToChat("shofi", r);
        speak(r);
        return;
      }

      // Love question
      if (
        stripped.includes("DO YOU LOVE ME") ||
        normalized.includes("DO YOU LOVE ME")
      ) {
        const r = "YES I LOVE YOU, MASTER! ❤️";
        addToChat("user", input);
        addToChat("shofi", r);
        speak("Yes, I love you, Master. With all my heart.");
        return;
      }

      // Call command
      const callMatch = stripped.match(/^CALL\s+(.+)$/i);
      if (callMatch) {
        const raw = callMatch[1].trim();
        const contact = contactsRef.current.find(
          (c) => c.name.toUpperCase() === raw.toUpperCase(),
        );
        const displayName =
          contact?.name ||
          raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
        const phone = contact?.phone || "No number saved";
        const r = `Calling ${displayName}, Master. Please wait...`;
        addToChat("user", input);
        addToChat("shofi", r);
        speak(`Calling ${displayName}, Master.`);
        setCallInfo({ name: displayName, phone });
        return;
      }

      // Research command
      const researchMatch = stripped.match(
        /^(?:SEARCH|RESEARCH|FIND|LOOK UP|GOOGLE|TELL ME ABOUT)\s+(.+)$/i,
      );
      if (researchMatch) {
        const query = researchMatch[1].trim();
        addToChat("user", input);
        addToChat(
          "shofi",
          `Researching "${query}" for you, Master. One moment... 🔍`,
        );
        speak("Researching for you, Master.");
        setIsResearching(true);
        try {
          const result =
            (await actorRef.current?.research(query)) ??
            "I couldn't find that information, Master.";
          addToChat("shofi", result);
          speak("I found the information for you, Master.");
        } catch {
          addToChat(
            "shofi",
            "I'm sorry Master, I couldn't complete the research right now. Please try again.",
          );
        } finally {
          setIsResearching(false);
        }
        return;
      }

      // ── Time ────────────────────────────────────────────────────────────
      if (
        [
          "WHAT TIME IS IT",
          "WHAT'S THE TIME",
          "TELL ME THE TIME",
          "CURRENT TIME",
        ].includes(stripped)
      ) {
        const r = `It is ${new Date().toLocaleTimeString()}, Master.`;
        addToChat("user", input);
        addToChat("shofi", r);
        speak(r);
        return;
      }

      // ── Date ────────────────────────────────────────────────────────────
      if (
        [
          "WHAT'S TODAY'S DATE",
          "WHAT IS TODAY'S DATE",
          "WHAT DAY IS IT",
          "WHAT DATE IS IT",
        ].includes(stripped)
      ) {
        const r = `Today is ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}, Master.`;
        addToChat("user", input);
        addToChat("shofi", r);
        speak(r);
        return;
      }

      // ── Greeting ─────────────────────────────────────────────────────────
      if (
        [
          "GOOD MORNING",
          "GOOD AFTERNOON",
          "GOOD EVENING",
          "GOOD NIGHT",
          "HELLO",
          "HI SHOFI",
          "HEY",
        ].includes(stripped)
      ) {
        const h = new Date().getHours();
        let r: string;
        if (h >= 5 && h < 12)
          r = "Good morning, Master! Ready to serve you all day. 🌅";
        else if (h >= 12 && h < 17)
          r = "Good afternoon, Master! What can I do for you? ☀️";
        else if (h >= 17 && h < 21)
          r = "Good evening, Master! Hope you had a wonderful day. 🌆";
        else r = "Good night, Master! Sweet dreams. 🌙";
        addToChat("user", input);
        addToChat("shofi", r);
        speak(r);
        return;
      }

      // ── Joke ─────────────────────────────────────────────────────────────
      if (
        stripped.startsWith("TELL ME A JOKE") ||
        stripped.startsWith("TELL A JOKE") ||
        stripped.startsWith("SAY SOMETHING FUNNY")
      ) {
        const jokes = [
          "Why don't scientists trust atoms? Because they make up everything!",
          "I told my computer I needed a break. Now it won't stop sending me Kit Kat ads.",
          "Why did the scarecrow win an award? Because he was outstanding in his field!",
          "What do you call a fish without eyes? A fsh.",
          "Why can't you give Elsa a balloon? Because she'll let it go!",
        ];
        const joke = jokes[Math.floor(Math.random() * jokes.length)];
        addToChat("user", input);
        addToChat("shofi", joke);
        speak(joke);
        return;
      }

      // ── Weather ──────────────────────────────────────────────────────────
      if (
        stripped.startsWith("WEATHER") ||
        stripped.startsWith("HOW'S THE WEATHER") ||
        stripped.startsWith("WHAT'S THE WEATHER")
      ) {
        const r =
          "I don't have access to live weather data, Master, but I can search it for you. Would you like me to look it up?";
        addToChat("user", input);
        addToChat("shofi", r);
        speak(r);
        return;
      }

      // ── Reminder / Alarm ─────────────────────────────────────────────────
      if (/^(?:SET|ADD|CREATE)\s+(?:A\s+)?(?:REMINDER|ALARM)/i.test(stripped)) {
        const r =
          "I've noted that reminder for you, Master. I'll do my best to help you remember. 📝";
        addToChat("user", input);
        addToChat("shofi", r);
        speak(r);
        return;
      }

      // ── Battery ──────────────────────────────────────────────────────────
      if (["BATTERY", "BATTERY LEVEL", "HOW MUCH BATTERY"].includes(stripped)) {
        addToChat("user", input);
        (async () => {
          try {
            const battery = await (navigator as any).getBattery?.();
            if (battery) {
              const pct = Math.round(battery.level * 100);
              const r = `Your battery is at ${pct}%, Master.`;
              addToChat("shofi", r);
              speak(r);
            } else {
              const r =
                "I can't access your battery level in this browser, Master.";
              addToChat("shofi", r);
              speak(r);
            }
          } catch {
            const r =
              "I can't access your battery level in this browser, Master.";
            addToChat("shofi", r);
            speak(r);
          }
        })();
        return;
      }

      // ── Stop / Quiet ─────────────────────────────────────────────────────
      if (["STOP", "QUIET", "SHUT UP", "STOP TALKING"].includes(stripped)) {
        window.speechSynthesis.cancel();
        addToChat("user", input);
        addToChat("shofi", "Understood, Master. 🤫");
        return;
      }

      // ── Repeat ───────────────────────────────────────────────────────────
      if (["REPEAT", "REPEAT THAT", "SAY THAT AGAIN"].includes(stripped)) {
        addToChat("user", input);
        if (lastShofiSpeechRef.current) {
          speak(lastShofiSpeechRef.current);
          addToChat("shofi", lastShofiSpeechRef.current);
        } else {
          const r = "I have nothing to repeat, Master.";
          addToChat("shofi", r);
          speak(r);
        }
        return;
      }

      // ── Open website ─────────────────────────────────────────────────────
      const openMatch = stripped.match(
        /^(?:OPEN|GO TO|NAVIGATE TO|VISIT)\s+(.+)$/i,
      );
      if (openMatch) {
        let site = openMatch[1].trim();
        const url = /^https?:\/\//i.test(site) ? site : `https://${site}`;
        window.open(url, "_blank");
        const r = `Opening ${site} for you, Master.`;
        addToChat("user", input);
        addToChat("shofi", r);
        speak(r);
        return;
      }

      // Check backend custom commands
      try {
        const match = await actorRef.current?.matchCommand(normalized);
        if (match && match.__kind__ === "Some" && match.value) {
          addToChat("user", input);
          addToChat("shofi", match.value);
          speak(match.value);
          return;
        }
      } catch {
        // ignore
      }

      // Fallback
      const fallback = `I understand, ${masterNameRef.current}. How else can I serve you?`;
      addToChat("user", input);
      addToChat("shofi", fallback);
      speak(fallback);
    },
    [addToChat, speak],
  );

  // Keep processCommand ref updated (avoids stale closure in recognition handler)
  const processCommandRef = useRef(processCommand);
  processCommandRef.current = processCommand;
  const lastShofiSpeechRef = useRef<string>("");

  // ── Mic toggle ─────────────────────────────────────────────────────────────
  const handleMicToggle = useCallback(async () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (!speechAPIRef.current) {
        toast.error("Voice recognition is not supported in this browser.");
        return;
      }
      try {
        // Start speech recognition directly (it handles its own permission)
        const rec = new speechAPIRef.current();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = "en-US";
        rec.onresult = (event: any) => {
          const transcript: string = event.results[0][0].transcript;
          processCommandRef.current?.(transcript);
        };
        rec.onend = () => setIsListening(false);
        rec.onerror = (event: any) => {
          console.warn("Speech recognition error:", event.error);
          setIsListening(false);
          if (event.error === "not-allowed") {
            setMicPermission("denied");
            toast.error(
              "Microphone access denied. Please allow microphone access in your browser settings and try again.",
            );
          } else if (event.error !== "aborted" && event.error !== "no-speech") {
            toast.error(`Voice error: ${event.error}`);
          }
        };
        recognitionRef.current = rec;
        rec.start();
        setMicPermission("granted");
        setIsListening(true);
      } catch (err: any) {
        console.error("Could not start voice recognition:", err);
        if (
          err?.name === "NotAllowedError" ||
          err?.name === "PermissionDeniedError"
        ) {
          setMicPermission("denied");
          toast.error(
            "Microphone access denied. Please allow microphone access in your browser settings and try again.",
          );
        } else {
          toast.error("Could not start voice recognition.");
        }
      }
    }
  }, [isListening]);

  // ── Send text message ──────────────────────────────────────────────────────
  const handleSendMessage = useCallback(() => {
    const text = messageInput.trim();
    if (!text) return;
    setMessageInput("");
    processCommandRef.current(text);
  }, [messageInput]);

  // ── Commands CRUD ──────────────────────────────────────────────────────────
  const handleAddCommand = useCallback(
    async (trigger: string, response: string) => {
      if (!actorRef.current) {
        setCommands((prev) => [...prev, { trigger, response }]);
        toast.success("Command saved locally (will sync when ready).");
        return;
      }
      try {
        await actorRef.current.addCommand(trigger, response);
        setCommands((prev) => [...prev, { trigger, response }]);
        toast.success("Command added!");
      } catch {
        toast.error("Failed to add command.");
      }
    },
    [],
  );

  const handleRemoveCommand = useCallback(async (trigger: string) => {
    try {
      await actorRef.current?.removeCommand(trigger);
      setCommands((prev) => prev.filter((c) => c.trigger !== trigger));
      toast.success("Command removed.");
    } catch {
      toast.error("Failed to remove command.");
    }
  }, []);

  // ── Contacts CRUD ──────────────────────────────────────────────────────────
  const handleAddContact = useCallback(async (name: string, phone: string) => {
    try {
      await actorRef.current?.addContact(name, phone);
      setContacts((prev) => [...prev, { name, phone }]);
      toast.success("Contact added!");
    } catch {
      toast.error("Failed to add contact.");
    }
  }, []);

  const handleRemoveContact = useCallback(async (name: string) => {
    try {
      await actorRef.current?.removeContact(name);
      setContacts((prev) => prev.filter((c) => c.name !== name));
      toast.success("Contact removed.");
    } catch {
      toast.error("Failed to remove contact.");
    }
  }, []);

  const handleCallContact = useCallback(
    (name: string, phone: string) => {
      const r = `Calling ${name}, Master. Please wait...`;
      addToChat("shofi", r);
      speak(r);
      setCallInfo({ name, phone });
    },
    [addToChat, speak],
  );

  // ── Master name ────────────────────────────────────────────────────────────
  const handleSetMasterName = useCallback(async (name: string) => {
    try {
      await actorRef.current?.setMasterName(name);
      setMasterNameState(name);
    } catch {
      toast.error("Failed to save name.");
    }
  }, []);

  // ── Clear conversation ─────────────────────────────────────────────────────
  const handleClearConversation = useCallback(async () => {
    try {
      await actorRef.current?.clearMessages();
      setMessages([
        {
          id: `cleared-${Date.now()}`,
          speaker: "shofi",
          text: "Conversation cleared. Ready to serve you again, Master! 💜",
        },
      ]);
    } catch {
      toast.error("Failed to clear conversation.");
    }
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <Toaster
        theme="dark"
        toastOptions={{
          style: {
            background: "oklch(0.135 0.024 279)",
            border: "1px solid rgba(139,92,255,0.3)",
            color: "oklch(0.965 0.014 290)",
          },
        }}
      />

      <div
        className="relative flex flex-col max-w-md mx-auto overflow-hidden"
        style={{
          height: "100dvh",
          background:
            "linear-gradient(160deg, oklch(0.067 0.018 278) 0%, oklch(0.090 0.022 278) 55%, oklch(0.115 0.022 278) 100%)",
        }}
      >
        {/* Atmospheric background orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="bg-orb-float absolute rounded-full blur-3xl"
            style={{
              width: "280px",
              height: "280px",
              top: "10%",
              left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(139,92,255,0.12)",
            }}
          />
          <div
            className="bg-orb-float absolute rounded-full blur-3xl"
            style={{
              width: "200px",
              height: "200px",
              bottom: "20%",
              right: "-40px",
              background: "rgba(176,108,255,0.08)",
              animationDelay: "4s",
            }}
          />
        </div>

        {/* ── Header ── */}
        <header
          className="relative z-10 shrink-0 flex items-center justify-between px-4 py-3"
          style={{ borderBottom: "1px solid rgba(139,92,255,0.18)" }}
        >
          <h1 className="text-[26px] font-bold tracking-[0.18em] shofi-glow-text text-foreground">
            SHOFI
          </h1>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="relative w-9 h-9 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-[18px] h-[18px]" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-primary" />
            </button>
            <button
              type="button"
              className="w-9 h-9 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Menu"
            >
              <Menu className="w-[18px] h-[18px]" />
            </button>
          </div>
        </header>

        {/* ── Tab content ── */}
        <main className="relative z-10 flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {activeTab === "chat" && (
              <motion.div
                key="chat"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="h-full"
              >
                <ChatTab
                  messages={messages}
                  orbState={orbState}
                  isListening={isListening}
                  isResearching={isResearching}
                  speechSupported={speechSupported}
                  micPermission={micPermission}
                  onMicPermissionChange={setMicPermission}
                  messageInput={messageInput}
                  isLoadingData={isLoadingData}
                  onMessageInputChange={setMessageInput}
                  onSendMessage={handleSendMessage}
                  onMicToggle={handleMicToggle}
                  messagesEndRef={messagesEndRef}
                />
              </motion.div>
            )}
            {activeTab === "commands" && (
              <motion.div
                key="commands"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="h-full"
              >
                <CommandsTab
                  commands={commands}
                  isLoading={isLoadingData}
                  onAdd={handleAddCommand}
                  onRemove={handleRemoveCommand}
                />
              </motion.div>
            )}
            {activeTab === "contacts" && (
              <motion.div
                key="contacts"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="h-full"
              >
                <ContactsTab
                  contacts={contacts}
                  isLoading={isLoadingData}
                  onAdd={handleAddContact}
                  onRemove={handleRemoveContact}
                  onCall={handleCallContact}
                />
              </motion.div>
            )}
            {activeTab === "settings" && (
              <motion.div
                key="settings"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="h-full"
              >
                <SettingsTab
                  masterName={masterName}
                  voiceName={voiceName}
                  onSetMasterName={handleSetMasterName}
                  onClearConversation={handleClearConversation}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* ── Bottom Navigation ── */}
        <nav
          className="relative z-10 shrink-0 flex"
          style={{
            borderTop: "1px solid rgba(139,92,255,0.18)",
            background: "oklch(0.090 0.022 278 / 0.95)",
            backdropFilter: "blur(16px)",
          }}
        >
          {TABS.map(({ id, label, Icon }) => (
            <button
              type="button"
              key={id}
              onClick={() => setActiveTab(id)}
              className={`relative flex-1 flex flex-col items-center justify-center pt-2.5 pb-3 gap-0.5 transition-all duration-200 ${
                activeTab === id
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground/70"
              }`}
              data-ocid={`${id}.tab`}
            >
              <Icon className="w-[18px] h-[18px]" />
              <span className="text-[10px] font-medium leading-none">
                {label}
              </span>
              {activeTab === id && (
                <span
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full bg-primary"
                  style={{ width: "28px" }}
                />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Call overlay ── */}
      <AnimatePresence>
        {callInfo && (
          <CallOverlay callInfo={callInfo} onEnd={() => setCallInfo(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
