import { CommandsButton } from "@/components/commands-button";
import { ConfigureDialog } from "@/components/configure-dialog";
import DisplaySettingsDialog from "@/components/display-settings-dialog";
import { Editor, EditorSettings } from "@/components/editor";
import { MessagesPanel } from "@/components/messages-panel";
import { Mosaic } from "@/components/mosaic";
import { Pane } from "@/components/pane";
import { isMobilePhone, generateSketchName } from "@/lib/utils";
import { ReplsButton } from "@/components/repls-button";
import { ReplsDialog } from "@/components/repls-dialog";
import SessionCommandDialog from "@/components/session-command-dialog";
import { ShareUrlDialog } from "@/components/share-url-dialog";
import { PubSubState, StatusBar, SyncState } from "@/components/status-bar";
import { Toaster } from "@/components/ui/toaster";
import UsernameDialog from "@/components/username-dialog";
import { WebTargetIframe } from "@/components/web-target-iframe";
import { SaveSketchDialog } from "@/components/sketch/save-sketch-dialog";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { AuthProvider } from "@/contexts/auth-context";
import { useAuth } from "@/hooks/use-auth";
import { useHash } from "@/hooks/use-hash";
import { useQuery } from "@/hooks/use-query";
import { useShortcut } from "@/hooks/use-shortcut";
import { useStrudelCodemirrorExtensions } from "@/hooks/use-strudel-codemirror-extensions";
import { useToast } from "@/hooks/use-toast";
import {
  getSketch,
  createSketch,
  updateSketch,
  SketchRecord,
  SketchPane,
} from "@/lib/atproto";
import {
  DisplaySettings,
  defaultDisplaySettings,
} from "@/lib/display-settings";
import {
  cn,
  code2hash,
  generateRandomUserName,
  hash2code,
  mod,
  store,
} from "@/lib/utils";
import {
  defaultTarget,
  knownTargets,
  panicCodes as panicCodesUntyped,
  webTargets,
} from "@/settings.json";
import { Session, type Document } from "@flok-editor/session";
import { type ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import {
  LoaderFunctionArgs,
  useLoaderData,
  useNavigate,
} from "react-router-dom";
import { Textmodifier } from "textmode.js";

declare global {
  interface Window {
    documentsContext: { [docId: string]: any };
    hydra: any;
    mercury: any;
    strudel: any;
    punctual: any;
    t: Textmodifier;
  }
}

const panicCodes = panicCodesUntyped as { [target: string]: string };

const defaultEditorSettings: EditorSettings = {
  lineNumbers: false,
  vimMode: false,
  fontFamily: "Inconsolata",
  theme: "oneDark",
  wrapText: false,
};

interface SessionLoaderParams {
  name: string;
}

export interface Message {
  target: string;
  tags: string[];
  type: "stdout" | "stderr";
  body: string[];
}

// Helper to get/set sketch URI for a session from localStorage
const SKETCH_SESSION_KEY_PREFIX = "hocket-sketch-session:";

function getStoredSketchUri(sessionName: string): string | null {
  return localStorage.getItem(`${SKETCH_SESSION_KEY_PREFIX}${sessionName}`);
}

function setStoredSketchUri(sessionName: string, uri: string): void {
  localStorage.setItem(`${SKETCH_SESSION_KEY_PREFIX}${sessionName}`, uri);
}

// Auto-save debounce delay (in milliseconds)
const AUTO_SAVE_DELAY = 3000;

export async function loader({ params }: LoaderFunctionArgs) {
  return { name: params.name };
}

function SessionContent() {
  const query = useQuery();
  const [hash, setHash] = useHash();

  const [currentPaneIndex, setCurrentPaneIndex] = useState(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const isMobile = useMemo(() => isMobilePhone(), []);

  const { name } = useLoaderData() as SessionLoaderParams;
  const navigate = useNavigate();

  // Auth hook for sketch save functionality
  const {
    isAuthenticated,
    agent,
    session: authSession,
    isLoading: authLoading,
  } = useAuth();

  const [session, setSession] = useState<Session | null>(null);
  const [pubSubState, setPubSubState] = useState<PubSubState>("disconnected");
  const [syncState, setSyncState] = useState<SyncState>("syncing");
  const [commandsDialogOpen, setCommandsDialogOpen] = useState<boolean>(false);
  const [replsDialogOpen, setReplsDialogOpen] = useState<boolean>(false);
  const [username, setUsername] = useState<string>("");
  const [usernameDialogOpen, setUsernameDialogOpen] = useState(false);
  const [shareUrlDialogOpen, setShareUrlDialogOpen] = useState(false);
  const [configureDialogOpen, setConfigureDialogOpen] = useState(false);
  const [displaySettingsDialogOpen, setDisplaySettingsDialogOpen] =
    useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [hidden, setHidden] = useState<boolean>(false);

  // Sketch save/load state
  const [saveSketchDialogOpen, setSaveSketchDialogOpen] = useState(false);
  const [currentSketchUri, setCurrentSketchUri] = useState<string | null>(null);
  const [currentSketchName, setCurrentSketchName] = useState<string>("");

  // Auto-save tracking refs
  const autoSaveInitialized = useRef(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedContentRef = useRef<string>("");

  // Editor settings: Try to restore from local storage or use default settings
  const [editorSettings, setEditorSettings] = useState<EditorSettings>(() => {
    const savedSettings = localStorage.getItem("editor-settings");
    if (savedSettings) {
      try {
        return JSON.parse(savedSettings);
      } catch (error) {
        console.error("Error parsing saved editor settings:", error);
      }
    }
    return defaultEditorSettings;
  });

  // Display settings: Try to restore from local storage or use default settings
  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>(
    () => {
      const savedSettings = localStorage.getItem("display-settings");
      if (savedSettings) {
        try {
          return JSON.parse(savedSettings);
        } catch (error) {
          console.error("Error parsing saved display settings:", error);
        }
      }
      return defaultDisplaySettings;
    },
  );

  // Save editor settings to local storage
  useEffect(() => {
    localStorage.setItem("editor-settings", JSON.stringify(editorSettings));
  }, [editorSettings]);

  // Save display settings to local storage
  useEffect(() => {
    localStorage.setItem("display-settings", JSON.stringify(displaySettings));
  }, [displaySettings]);

  const [messagesPanelExpanded, setMessagesPanelExpanded] =
    useState<boolean>(false);
  const [messagesCount, setMessagesCount] = useState<number>(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [autoShowMessages, setAutoShowMessages] = useState<boolean>(
    store.get("messages:autoshow", true),
  );
  const [hideMessagesOnEval, setHideMessagesOnEval] = useState<boolean>(
    store.get("messages:hide-on-eval", true),
  );
  const [sessionUrl, setSessionUrl] = useState<string>("");

  const editorRefs = Array.from({ length: 8 }).map(() =>
    useRef<ReactCodeMirrorRef>(null),
  );

  useStrudelCodemirrorExtensions(session, editorRefs);

  const { toast: _toast } = useToast();
  const hideErrors = !!query.get("hideErrors");

  // Only call toast if query parameter "hideErrors" is not present
  const toast = useCallback(
    (options: Parameters<typeof _toast>[0]) => {
      if (hideErrors) return;
      _toast(options);
    },
    [_toast, hideErrors],
  );

  const postMessageParentWindow = (message: any) => {
    window.parent.postMessage(message, "*");
  };

  // Block access to shared sketches for unauthenticated users
  useEffect(() => {
    const sketchUri = query.get("sketch");
    if (!sketchUri) return;

    // Wait for auth to finish loading before checking
    if (authLoading) return;

    // If user is not authenticated, redirect to sign-in
    if (!isAuthenticated) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please sign in to access shared sketches.",
      });
      navigate(
        `/auth/sign-in?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`,
      );
    }
  }, [query, isAuthenticated, authLoading, navigate, toast]);

  // Load sketch from URL parameter if present (only for authenticated users)
  useEffect(() => {
    const sketchUri = query.get("sketch");
    // Wait for authentication and agent to be ready, and for the Flok session to exist
    if (!sketchUri || !isAuthenticated || !agent || !session) return;

    const loadSketch = async () => {
      try {
        const record = await getSketch(agent, sketchUri);
        const sketchData = record.value as SketchRecord;

        setCurrentSketchUri(sketchUri);
        setCurrentSketchName(sketchData.name);

        // Check if sketch has panes array (new format) or content string (old format)
        if (sketchData.panes && sketchData.panes.length > 0) {
          // New format: restore panes with correct targets
          const sortedPanes = [...sketchData.panes].sort(
            (a, b) => (a.order ?? 0) - (b.order ?? 0),
          );

          // Set active documents with targets from sketch
          session.setActiveDocuments(
            sortedPanes.map((pane, i) => ({
              id: String(i + 1),
              target: pane.target,
            })),
          );

          // Wait for Yjs to create documents, then set content
          setTimeout(() => {
            const docs = session.getDocuments();
            sortedPanes.forEach((pane, i) => {
              if (docs[i]) {
                docs[i].content = pane.content;
              }
            });
          }, 150);
        }

        toast({
          title: "Sketch loaded",
          description: `"${sketchData.name}" loaded successfully`,
          duration: 3000,
        });
      } catch (error) {
        console.error("Failed to load sketch:", error);
        toast({
          variant: "destructive",
          title: "Failed to load sketch",
          description: "Could not load the sketch from ATproto.",
        });
      }
    };

    loadSketch();
  }, [query, agent, session, isAuthenticated, toast]);

  // Block access to shared sessions (via URL hash with code) for unauthenticated users
  useEffect(() => {
    // Check if the URL hash contains shared code (c0, c1, etc. or code parameter)
    const hasSharedCode =
      hash["code"] || hash["c0"] || hash["c1"] || hash["targets"];
    if (!hasSharedCode) return;

    // Wait for auth to finish loading before checking
    if (authLoading) return;

    // If user is not authenticated, redirect to sign-in
    if (!isAuthenticated) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please sign in to access shared sessions.",
      });
      navigate(
        `/auth/sign-in?redirect=${encodeURIComponent(window.location.pathname + window.location.hash)}`,
      );
    }
  }, [hash, isAuthenticated, authLoading, navigate, toast]);

  useEffect(() => {
    if (!name) return;

    const { hostname, port, protocol } = window.location;
    const isSecure = protocol === "https:";
    const newSession = new Session(name, {
      hostname,
      port: parseInt(port),
      isSecure,
    });

    // Track if session has been initialized to prevent duplicate initialization
    let sessionInitialized = false;

    const initializeSession = () => {
      if (sessionInitialized) {
        console.log("Session already initialized, skipping");
        return;
      }
      sessionInitialized = true;

      // If session is empty, set targets from hash parameter if present.
      // Otherwise, use default targets (strudel + hydra).
      if (newSession.getDocuments().length === 0) {
        console.log(
          "Session is empty, setting targets and code from hash params",
        );
        // If `targets` hash param is present and has valid targets, set them as
        // active documents.
        const targets = hash["targets"]?.split(",") || [];
        const validTargets = targets.filter((t) => knownTargets.includes(t));
        console.log("Valid targets from hash:", validTargets);
        if (validTargets.length > 0) {
          setActiveDocuments(newSession, validTargets);
        } else {
          // Use default targets: strudel (left) and hydra (right)
          setActiveDocuments(newSession, defaultTargets);
        }

        // For each valid target, set the corresponding document content from
        // hash (if present). `code` is an alias of `c0`.
        const documents = newSession.getDocuments();

        if (validTargets.length > 0) {
          // Set code from hash params if provided
          validTargets.forEach((_, i) => {
            let content = hash[`c${i}`];
            if (i == 0) content = content || hash["code"];
            if (content) {
              try {
                const code = hash2code(content);
                console.log(`Setting code for target ${i}:`, code);
                documents[i].content = code;
              } catch (err) {
                console.error(`Error parsing code ${i}`, err);
              }
            }
          });
        } else {
          // Set default sample code for new sessions
          documents.forEach((doc) => {
            const sampleCode = defaultSampleCode[doc.target];
            if (sampleCode) {
              doc.content = sampleCode;
            }
          });
        }

        // Clear hash parameters
        setHash({});
      } else {
        console.log("Session already has documents, skipping initialization");
      }
    };

    // Default documents
    newSession.on("sync", (protocol: string) => {
      setSyncState(newSession.wsConnected ? "synced" : "partiallySynced");
      console.log("Synced with protocol:", protocol);

      // Only initialize after WebSocket sync to get authoritative server state
      // This prevents duplication when joining existing sessions
      if (protocol === "websocket") {
        // Small delay to allow Y.js to process incoming document state
        setTimeout(initializeSession, 50);
      }
    });

    // Fallback: If WebSocket connects but no sync event fires (new empty session),
    // initialize after a short delay
    newSession.on("ws:connect", () => {
      setSyncState(newSession.synced ? "synced" : "partiallySynced");
      // Give WebSocket sync a chance to fire first, then initialize if needed
      setTimeout(() => {
        if (!sessionInitialized && newSession.getDocuments().length === 0) {
          console.log(
            "WebSocket connected but no documents, initializing new session",
          );
          initializeSession();
        }
      }, 500);
    });

    newSession.on("ws:disconnect", () => {
      setSyncState(newSession.synced ? "partiallySynced" : "syncing");
    });

    // If documents change on server, update state
    newSession.on("change", (documents) => {
      setDocuments(documents);

      postMessageParentWindow({
        event: "change",
        documents: documents.map((doc: Document) => ({
          id: doc.id,
          target: doc.target,
          content: doc.content,
        })),
      });
    });

    newSession.on("pubsub:start", () => {
      setPubSubState("connecting");
    });

    newSession.on("pubsub:stop", () => {
      setPubSubState("disconnected");
    });

    let connected = true;
    newSession.on("pubsub:open", () => {
      setPubSubState("connected");
      if (connected) return;
      connected = true;
      toast({
        title: "Connected to server",
        duration: 1000,
      });
    });

    newSession.on("pubsub:close", () => {
      setPubSubState("connecting");
      if (!connected) return;
      connected = false;
      toast({
        variant: "destructive",
        title: "Disconnected from server",
        description: "Remote evaluations will be ignored until reconnected.",
      });
    });

    newSession.on("message", ({ message }) => {
      setMessages((messages) => [...messages, message as Message]);
      setMessagesCount((count) => count + 1);

      postMessageParentWindow({
        event: "message",
        message,
      });
    });

    newSession.on("message", ({ message }) => {
      const { target, type, body } = message;
      const content = body.join("\n").trim();
      if (content) {
        console.log(
          `%c${target}` + `%c ${content}`,
          "font-weight: bold",
          type === "stderr" ? "color: #ff5f6b" : "",
        );
      }
    });

    newSession.on("eval", ({ docId, body, user }) => {
      postMessageParentWindow({
        event: "eval",
        id: docId,
        content: body,
        user,
      });
    });

    newSession.initialize();
    setSession(newSession);

    // Load and set saved username, if available
    // If read only is enabled, use a random username
    const readOnly = !!query.get("readOnly");
    if (readOnly) {
      setUsername(generateRandomUserName());
    } else {
      const savedUsername = hash["username"] || store.get("username");
      if (!savedUsername) {
        // Auto-assign a quirky username without showing a dialog
        const autoUsername = generateRandomUserName();
        setUsername(autoUsername);
        store.set("username", autoUsername);
      } else {
        setUsername(savedUsername);
      }
    }

    return () => newSession.destroy();
  }, [name]);

  useEffect(() => {
    if (!session) return;
    console.log(`Setting user on session to '${username}'`);
    session.user = username;
    // Store username in local storage only if it's not random (read only mode)
    if (!query.get("readOnly")) {
      store.set("username", username);
    }
  }, [session, username]);

  // Auto-save: Initialize sketch on PDS for authenticated users
  // This runs once when the session is ready and user is authenticated
  useEffect(() => {
    // Skip if already initialized, not authenticated, or loading from existing sketch
    if (autoSaveInitialized.current) return;
    if (authLoading || !isAuthenticated || !agent || !authSession) return;
    if (!session || documents.length === 0) return;

    // If loading from URL sketch parameter, don't auto-create
    const sketchUri = query.get("sketch");
    if (sketchUri) {
      autoSaveInitialized.current = true;
      return;
    }

    // Check if we already have a stored sketch URI for this session
    const storedUri = getStoredSketchUri(name);
    if (storedUri) {
      // Try to load the existing sketch
      const loadExistingSketch = async () => {
        try {
          const record = await getSketch(agent, storedUri);
          setCurrentSketchUri(storedUri);
          setCurrentSketchName(record.value.name);
          autoSaveInitialized.current = true;
          console.log("Restored sketch URI from localStorage:", storedUri);
        } catch (error) {
          // Sketch might have been deleted, create a new one
          console.log("Stored sketch not found, will create new one");
          localStorage.removeItem(`${SKETCH_SESSION_KEY_PREFIX}${name}`);
          // Don't set initialized, let it fall through to create new
        }
      };
      loadExistingSketch();
      return;
    }

    // Auto-create a new sketch for this session
    const autoCreateSketch = async () => {
      try {
        const sketchName = generateSketchName();
        const panes: SketchPane[] = documents.map((doc, index) => ({
          target: doc.target,
          content: doc.content,
          order: index,
        }));

        const result = await createSketch(agent, authSession.did, {
          name: sketchName,
          panes,
          visibility: "public",
        });

        setCurrentSketchUri(result.uri);
        setCurrentSketchName(sketchName);
        setStoredSketchUri(name, result.uri);
        autoSaveInitialized.current = true;

        // Store initial content hash to detect changes
        lastSavedContentRef.current = JSON.stringify(panes);

        console.log("Auto-created sketch:", sketchName, result.uri);
      } catch (error) {
        console.error("Failed to auto-create sketch:", error);
        // Still mark as initialized to prevent repeated attempts
        autoSaveInitialized.current = true;
      }
    };

    autoCreateSketch();
  }, [
    authLoading,
    isAuthenticated,
    agent,
    authSession,
    session,
    documents,
    name,
    query,
  ]);

  // Auto-save: Save changes to PDS when documents change
  useEffect(() => {
    // Skip if not initialized or not authenticated
    if (!autoSaveInitialized.current) return;
    if (!isAuthenticated || !agent || !authSession) return;
    if (!currentSketchUri || documents.length === 0) return;

    // Create content hash to detect actual changes
    const panes: SketchPane[] = documents.map((doc, index) => ({
      target: doc.target,
      content: doc.content,
      order: index,
    }));
    const contentHash = JSON.stringify(panes);

    // Skip if content hasn't changed
    if (contentHash === lastSavedContentRef.current) return;

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Debounced auto-save
    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        await updateSketch(agent, currentSketchUri, {
          name: currentSketchName || generateSketchName(),
          panes,
          visibility: "public",
        });
        lastSavedContentRef.current = contentHash;
        console.log("Auto-saved sketch to PDS");
      } catch (error) {
        console.error("Failed to auto-save sketch:", error);
      }
    }, AUTO_SAVE_DELAY);

    // Cleanup timeout on unmount or dependency change
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [
    documents,
    isAuthenticated,
    agent,
    authSession,
    currentSketchUri,
    currentSketchName,
  ]);

  // Reset messages count when panel is expanded (mark all messages as read)
  useEffect(() => setMessagesCount(0), [messagesPanelExpanded]);

  // Show messages panel if autoShowMessages is enabled and there are messages
  useEffect(() => {
    if (autoShowMessages && messages.length > 0) setMessagesPanelExpanded(true);
  }, [messages]);

  // Hide messages panel after evaluation if hideMessagesOnEval is enabled
  useEffect(() => {
    if (!session || !hideMessagesOnEval) return;

    const evalHandler = () => {
      setMessagesPanelExpanded(false);
    };

    session.on("eval", evalHandler);
    return () => session.off("eval", evalHandler);
  }, [session, hideMessagesOnEval]);

  useEffect(() => {
    if (!shareUrlDialogOpen) return;
    if (!session) return;

    // Update sessionURL based on current session layout and documents
    // We need: session documents, and documents contents
    const documents = session.getDocuments();
    const targets = documents.map((doc) => doc.target);
    const contents = documents.map((doc) => doc.content);

    const hash = {
      targets: targets.join(","),
      ...contents.reduce((acc: { [key: string]: string }, content, i) => {
        acc[`c${i}`] = code2hash(content);
        return acc;
      }, {}),
    };

    const hashString = new URLSearchParams(hash).toString();
    const currentURL = window.location.href;

    setSessionUrl(`${currentURL}#${hashString}`);
  }, [session, shareUrlDialogOpen]);

  // Handle window messages from iframes
  useEffect(() => {
    const messageHandler = (event: MessageEvent) => {
      if (event.data.type === "toast") {
        const { variant, title, message, pre } = event.data.body;
        const description = pre ? (
          <pre className="whitespace-pre-wrap">{message}</pre>
        ) : (
          message
        );
        toast({ variant, title, description });
      }
    };

    window.addEventListener("message", messageHandler);

    return () => {
      window.removeEventListener("message", messageHandler);
    };
  }, []);

  const focusEditor = (i: number) => {
    const ref = editorRefs[i].current;
    if (!ref) return;
    const { view } = ref;
    view?.focus();
  };

  const getFocusedEditorIndex = (): number => {
    const i = editorRefs.findIndex(
      (ref) => ref.current && ref.current.view?.hasFocus,
    );
    return i;
  };

  // Global shortcuts
  useShortcut(["Control-J", "Meta-J"], () =>
    setCommandsDialogOpen((open) => !open),
  );
  useShortcut(["Control-P", "Meta-P"], () =>
    setConfigureDialogOpen((open) => !open),
  );
  useShortcut(
    ["Control-Shift-.", "Meta-Shift-."],
    () => {
      documents.forEach((doc) => {
        const panicCode = panicCodes[doc.target];
        if (panicCode) doc.evaluate(panicCode, { from: null, to: null });
      });
      toast({ title: "Panic!", duration: 1000 });
    },
    [documents],
  );
  Array.from({ length: 8 }).map((_, i) => {
    useShortcut([`Control-${i}`], () => focusEditor(i - 1), [...editorRefs]);
  });
  useShortcut(
    ["Control-["],
    () => {
      const curIndex = getFocusedEditorIndex();
      if (curIndex < 0) return;
      const newIndex = mod(curIndex - 1, documents.length);
      focusEditor(newIndex);
    },
    [documents, ...editorRefs],
  );
  useShortcut(
    ["Control-]"],
    () => {
      const curIndex = getFocusedEditorIndex();
      if (curIndex < 0) return;
      const newIndex = mod(curIndex + 1, documents.length);
      focusEditor(newIndex);
    },
    [documents, ...editorRefs],
  );
  useShortcut(
    ["Meta-Shift-H", "Control-Shift-H", "Meta-Alt-H", "Control-Alt-H"],
    () => {
      setHidden((p) => !p);
    },
  );
  useShortcut(["Control-,", "Meta-,"], () => {
    setMessagesPanelExpanded((v) => !v);
  });

  const replTargets = useMemo(
    () =>
      [...new Set(documents.map((doc) => doc.target))].filter(
        (t) => !webTargets.includes(t),
      ),
    [documents],
  );

  const targetsList = useMemo(
    () => documents.map((doc) => doc.target),
    [documents],
  );

  const OS = navigator.userAgent.indexOf("Windows") != -1 ? "windows" : "unix";

  const handleViewLayoutAdd = useCallback(() => {
    if (!session) return;
    const newDocs = [
      ...documents.map((doc) => ({ id: doc.id, target: doc.target })),
      { id: String(documents.length + 1), target: defaultTarget },
    ];
    session.setActiveDocuments(newDocs);
  }, [session, documents]);

  const handleViewLayoutRemove = useCallback(() => {
    if (!session) return;
    session.setActiveDocuments([
      ...documents
        .map((doc) => ({ id: doc.id, target: doc.target }))
        .slice(0, -1),
    ]);
  }, [session, documents]);

  // Save sketch to ATproto
  const handleSaveSketch = useCallback(
    async (sketchName: string) => {
      if (!agent || !authSession || !session) {
        throw new Error("Not authenticated");
      }

      // Create panes array from documents
      const panes: SketchPane[] = documents.map((doc, index) => ({
        target: doc.target,
        content: doc.content,
        order: index,
      }));

      if (currentSketchUri) {
        // Update existing sketch
        await updateSketch(agent, currentSketchUri, {
          name: sketchName,
          panes,
          visibility: "public",
        });
        setCurrentSketchName(sketchName);
      } else {
        // Create new sketch
        const result = await createSketch(agent, authSession.did, {
          name: sketchName,
          panes,
          visibility: "public",
        });
        setCurrentSketchUri(result.uri);
        setCurrentSketchName(sketchName);
        // Store the URI so we can reconnect to this sketch
        setStoredSketchUri(name, result.uri);
        autoSaveInitialized.current = true;
      }

      // Update last saved content to prevent immediate auto-save
      lastSavedContentRef.current = JSON.stringify(panes);

      toast({
        title: "Sketch saved",
        description: `"${sketchName}" saved to ATproto`,
        duration: 3000,
      });
    },
    [agent, authSession, session, documents, currentSketchUri, name, toast],
  );

  // Download sketch as file
  const handleDownloadSketch = useCallback(() => {
    if (!session) return;

    const allContent = documents
      .map((doc) => `// Target: ${doc.target}\n${doc.content}`)
      .join("\n\n---\n\n");

    const filename = currentSketchName || generateSketchName();
    const blob = new Blob([allContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded",
      description: `Sketch saved as "${filename}.txt"`,
      duration: 2000,
    });
  }, [session, documents, currentSketchName, toast]);

  const handleTargetSelectChange = (document: Document, newTarget: string) => {
    document.target = newTarget;
  };

  const handleEvaluateButtonClick = (document: Document) => {
    document.evaluate(document.content, { from: null, to: null });
  };

  const handleConfigureAccept = (targets: string[]) => {
    if (!session) return;
    setActiveDocuments(session, targets);
  };

  const setActiveDocuments = (session: Session, targets: string[]) => {
    session.setActiveDocuments(
      targets
        .filter((t) => t)
        .map((target, i) => ({ id: String(i + 1), target })),
    );
  };

  const handleAutoShowToggleClick = useCallback((pressed: boolean) => {
    store.set("messages:autoshow", pressed);
    setAutoShowMessages(pressed);
  }, []);

  const handleHideMessagesOnEvalClick = useCallback((pressed: boolean) => {
    store.set("messages:hide-on-eval", pressed);
    setHideMessagesOnEval(pressed);
  }, []);

  const handleClearMessagesClick = useCallback(() => {
    setMessages([]);
    setMessagesPanelExpanded(false);
  }, []);

  const bgOpacity = query.get("bgOpacity") || "1.0";

  const activeWebTargets = useMemo(
    () =>
      webTargets.filter((target) =>
        documents.some((doc) => doc.target === target),
      ),
    [documents],
  );

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const handleViewportChange = () => {
      const keyboardHeight = window.innerHeight - viewport.height;
      setKeyboardHeight(keyboardHeight > 0 ? keyboardHeight : 0);
    };

    viewport.addEventListener("resize", handleViewportChange);
    return () => {
      viewport.removeEventListener("resize", handleViewportChange);
    };
  }, []);

  const handleNextPane = () => {
    if (currentPaneIndex < documents.length - 1) {
      setCurrentPaneIndex(currentPaneIndex + 1);
    }
  };

  const handlePreviousPane = () => {
    if (currentPaneIndex > 0) {
      setCurrentPaneIndex(currentPaneIndex - 1);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Helmet>
        <title>{name} ~ Hocket</title>
      </Helmet>
      <Header />

      {/* Dialogs - outside main content */}
      <SessionCommandDialog
        open={commandsDialogOpen}
        editorSettings={editorSettings}
        displaySettings={displaySettings}
        onOpenChange={(isOpen) => setCommandsDialogOpen(isOpen)}
        onSessionChangeUsername={() => setUsernameDialogOpen(true)}
        onEditorSettingsChange={(settings: EditorSettings) =>
          setEditorSettings(settings)
        }
        onDisplaySettingsChange={setDisplaySettings}
        onSessionNew={() => navigate("/")}
        onSessionShareUrl={() => setShareUrlDialogOpen(true)}
        onSessionSave={() => setSaveSketchDialogOpen(true)}
        onSessionDownload={handleDownloadSketch}
        onLayoutAdd={handleViewLayoutAdd}
        onLayoutRemove={handleViewLayoutRemove}
        onLayoutConfigure={() => setConfigureDialogOpen(true)}
        onEditorChangeDisplaySettings={() => setDisplaySettingsDialogOpen(true)}
        isAuthenticated={isAuthenticated}
      />
      <UsernameDialog
        name={username}
        open={usernameDialogOpen}
        onAccept={(name) => setUsername(name)}
        onOpenChange={(isOpen) => setUsernameDialogOpen(isOpen)}
      />
      <ShareUrlDialog
        url={sessionUrl}
        open={shareUrlDialogOpen}
        onOpenChange={(isOpen) => setShareUrlDialogOpen(isOpen)}
      />
      <SaveSketchDialog
        isOpen={saveSketchDialogOpen}
        onClose={() => setSaveSketchDialogOpen(false)}
        onSave={handleSaveSketch}
        defaultName={currentSketchName || generateSketchName()}
        isUpdate={!!currentSketchUri}
      />
      {session && (
        <ConfigureDialog
          targets={targetsList}
          sessionUrl={session.wsUrl}
          sessionName={session.name}
          userName={username}
          OS={OS}
          open={configureDialogOpen}
          onOpenChange={(isOpen) => setConfigureDialogOpen(isOpen)}
          onAccept={handleConfigureAccept}
        />
      )}
      <DisplaySettingsDialog
        settings={displaySettings}
        onAccept={(settings) => setDisplaySettings(settings)}
        open={displaySettingsDialogOpen}
        onOpenChange={(isOpen) => setDisplaySettingsDialogOpen(isOpen)}
      />
      {session && replTargets.length > 0 && (
        <ReplsDialog
          targets={replTargets}
          sessionUrl={session.wsUrl}
          sessionName={session.name}
          userName={username}
          OS={OS}
          open={replsDialogOpen}
          onOpenChange={(isOpen) => setReplsDialogOpen(isOpen)}
        />
      )}

      {/* Main content area - constrained width */}
      <main className="flex-1 pt-16 pb-4">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 h-full">
          {/* Editor container with rounded corners and dark background */}
          <div
            className="relative rounded-lg overflow-hidden h-[calc(100vh-8rem)]"
            style={{ backgroundColor: `rgb(0 0 0 / ${bgOpacity})` }}
          >
            {/* Buttons inside constrained area */}
            {!isMobile && (
              <div
                className={cn(
                  "absolute top-2 right-2 flex z-20",
                  "transition-opacity",
                  hidden ? "opacity-0" : "opacity-100",
                )}
              >
                {replTargets.length > 0 && (
                  <ReplsButton onClick={() => setReplsDialogOpen(true)} />
                )}
                <CommandsButton onClick={() => setCommandsDialogOpen(true)} />
              </div>
            )}

            <Mosaic
              className={cn(
                "transition-opacity",
                hidden ? "opacity-0" : "opacity-100",
              )}
              currentPaneIndex={currentPaneIndex}
              items={documents.map((doc, i) => (
                <Pane
                  key={doc.id}
                  document={doc}
                  onTargetChange={handleTargetSelectChange}
                  onEvaluateButtonClick={handleEvaluateButtonClick}
                  onCommandsButtonClick={() => setCommandsDialogOpen(true)}
                >
                  <Editor
                    ref={editorRefs[i]}
                    document={doc}
                    autoFocus={i === 0}
                    settings={editorSettings}
                    className="absolute top-6 overflow-auto flex-grow w-full h-[calc(100%-32px)] z-10"
                  />
                </Pane>
              ))}
            />

            {activeWebTargets.map((target) => (
              <WebTargetIframe
                key={target}
                session={session}
                target={target}
                displaySettings={displaySettings}
              />
            ))}

            {messagesPanelExpanded && (
              <MessagesPanel
                className={cn(
                  "transition-opacity",
                  hidden ? "opacity-0" : "opacity-100",
                )}
                messages={messages}
                autoShowMessages={autoShowMessages}
                hideMessagesOnEval={hideMessagesOnEval}
                onAutoShowToggleClick={handleAutoShowToggleClick}
                onHideMessagesOnEvalClick={handleHideMessagesOnEvalClick}
                onClearMessagesClick={handleClearMessagesClick}
              />
            )}

            <StatusBar
              className={cn(
                "transition-opacity",
                hidden ? "opacity-0" : "opacity-100",
              )}
              pubSubState={pubSubState}
              syncState={syncState}
              messagesCount={messagesPanelExpanded ? 0 : messagesCount}
              onExpandClick={() => {
                setMessagesPanelExpanded((v) => !v);
              }}
              currentPaneIndex={currentPaneIndex}
              totalPanes={documents.length}
              onNextPane={handleNextPane}
              onPreviousPane={handlePreviousPane}
              keyboardHeight={keyboardHeight}
            />
          </div>
        </div>
      </main>

      <Footer />
      <Toaster />
    </div>
  );
}

// Default sample code for new sessions
const defaultSampleCode: Record<string, string> = {
  strudel: `// From Strudel Recipes: https://strudel.cc/recipes/recipes/
// Press Ctrl+Enter to run the code

samples('github:yaxu/clean-breaks')
s("amen/4").fit().chop(32)`,
  hydra: `// licensed with CC BY-NC-SA 4.0 https://creativecommons.org/licenses/by-nc-sa/4.0/
// acid bus seat
// by Will Humphreys
// https://github.com/TheWispy

osc(105).color(0.5,0.1,0.8).rotate(0.11, 0.1).modulate(osc(10).rotate(0.3).add(o0, 0.1)).add(osc(20,0.01,1).color(0,0.8,1)).out(o0)
osc(50,0.05, 0.7).color(1,0.7,0.5).diff(o0).modulate(o1,0.05).out(o1)
render(o1)`,
};

// Default targets for new sessions (strudel on left, hydra on right)
const defaultTargets = ["strudel", "hydra"];

export function Component() {
  return (
    <AuthProvider>
      <SessionContent />
    </AuthProvider>
  );
}
