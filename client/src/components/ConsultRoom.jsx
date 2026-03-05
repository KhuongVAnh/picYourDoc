import { useEffect, useMemo, useRef, useState } from "react";
import {
  endConsultSessionApi,
  getConsultMessagesApi,
  getConsultSessionByAppointmentApi,
  startConsultSessionApi,
} from "../lib/api";
import { createConsultSocket } from "../lib/socket";
import { formatDateTime } from "../lib/date";

const DEFAULT_STUN = "stun:stun.l.google.com:19302";

// Tạo lỗi có status code để luồng xử lý lỗi trong UI nhất quán.
function createError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

// Parse danh sách STUN server từ env, fallback về giá trị mặc định.
function getIceServers() {
  const urls = (import.meta.env.VITE_WEBRTC_STUN_URLS || DEFAULT_STUN)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return [{ urls }];
}

// Xây danh sách tin nhắn không bị trùng ID để hiển thị realtime ổn định.
function mergeMessages(currentMessages, incomingMessage) {
  const existingIndex = currentMessages.findIndex((item) => item.id === incomingMessage.id);
  if (existingIndex >= 0) {
    const next = [...currentMessages];
    next[existingIndex] = incomingMessage;
    return next;
  }
  return [...currentMessages, incomingMessage];
}

// Component phòng tư vấn dùng chung cho doctor/patient theo appointment.
export function ConsultRoom({ mode, appointmentId, accessToken }) {
  const [session, setSession] = useState(null);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [sessionError, setSessionError] = useState("");
  const [isWaitingSession, setIsWaitingSession] = useState(false);

  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [chatError, setChatError] = useState("");

  const [socketStatus, setSocketStatus] = useState("disconnected");
  const [videoStatus, setVideoStatus] = useState("idle");
  const [mediaError, setMediaError] = useState("");
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);

  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const sessionIdRef = useRef("");
  const remoteUserIdRef = useRef("");

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const isSessionActive = session?.status === "ACTIVE";
  const remoteUserId = useMemo(() => {
    if (!session) {
      return "";
    }

    return mode === "doctor" ? session.patientUserId : session.doctorUserId;
  }, [mode, session]);

  // Đồng bộ ref để callback WebRTC dùng đúng session/user đích mới nhất.
  useEffect(() => {
    sessionIdRef.current = session?.id || "";
    remoteUserIdRef.current = remoteUserId || "";
  }, [session, remoteUserId]);

  // Đóng RTCPeerConnection hiện tại và giải phóng track remote.
  function closePeerConnection() {
    if (peerRef.current) {
      peerRef.current.onicecandidate = null;
      peerRef.current.ontrack = null;
      peerRef.current.onconnectionstatechange = null;
      peerRef.current.close();
      peerRef.current = null;
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  }

  // Dừng local stream khi kết thúc cuộc gọi để nhả camera/mic.
  function stopLocalStream() {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
  }

  // Reset trạng thái cuộc gọi khi ngắt/kết thúc phiên.
  function resetCallState(nextVideoStatus = "idle") {
    closePeerConnection();
    stopLocalStream();
    setVideoStatus(nextVideoStatus);
    setIsMicEnabled(true);
    setIsCameraEnabled(true);
  }

  // Tạo hoặc lấy local stream để phục vụ video call.
  async function ensureLocalStream() {
    if (localStreamRef.current) {
      return localStreamRef.current;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    localStreamRef.current = stream;

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    setIsMicEnabled(true);
    setIsCameraEnabled(true);
    return stream;
  }

  // Gửi signaling event có ack để bắt lỗi đồng nhất từ server.
  function emitWithAck(eventName, payload) {
    return new Promise((resolve, reject) => {
      const socket = socketRef.current;
      if (!socket || socket.disconnected) {
        reject(createError("Socket is disconnected", 503));
        return;
      }

      socket.emit(eventName, payload, (response) => {
        if (!response?.ok) {
          reject(createError(response?.error?.message || "Socket event failed", response?.error?.statusCode || 400));
          return;
        }
        resolve(response.data);
      });
    });
  }

  // Tạo RTCPeerConnection mới và gắn các callback track/ice/connection state.
  async function ensurePeerConnection() {
    if (peerRef.current) {
      return peerRef.current;
    }

    const localStream = await ensureLocalStream();
    const peer = new RTCPeerConnection({ iceServers: getIceServers() });

    localStream.getTracks().forEach((track) => {
      peer.addTrack(track, localStream);
    });

    peer.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteVideoRef.current && remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    };

    peer.onicecandidate = async (event) => {
      try {
        if (!event.candidate || !sessionIdRef.current || !remoteUserIdRef.current) {
          return;
        }

        await emitWithAck("consult:signal:ice", {
          sessionId: sessionIdRef.current,
          toUserId: remoteUserIdRef.current,
          candidate: event.candidate,
        });
      } catch (error) {
        setMediaError(error.message || "Không thể gửi ICE candidate");
      }
    };

    peer.onconnectionstatechange = () => {
      const state = peer.connectionState;
      if (state === "connected") {
        setVideoStatus("connected");
      } else if (state === "connecting") {
        setVideoStatus("connecting");
      } else if (state === "disconnected" || state === "failed" || state === "closed") {
        setVideoStatus("idle");
      }
    };

    peerRef.current = peer;
    return peer;
  }

  // Tải lịch sử chat khi session sẵn sàng.
  useEffect(() => {
    let ignore = false;

    async function loadMessages() {
      if (!session?.id || !accessToken) {
        return;
      }

      try {
        const response = await getConsultMessagesApi(session.id, { page: 1, limit: 100 }, accessToken);
        if (!ignore) {
          setMessages(response.data || []);
        }
      } catch (error) {
        if (!ignore) {
          setChatError(error.message || "Không thể tải lịch sử tư vấn");
        }
      }
    }

    loadMessages();
    return () => {
      ignore = true;
    };
  }, [session?.id, accessToken]);

  // Khởi tạo session theo từng vai trò: doctor tạo phiên, patient chờ phiên.
  useEffect(() => {
    let ignore = false;
    let pollTimer = null;

    async function setupDoctorSession() {
      const response = await startConsultSessionApi(appointmentId, accessToken);
      if (!ignore) {
        setSession(response.data);
        setIsWaitingSession(false);
      }
    }

    async function tryLoadPatientSession() {
      try {
        const response = await getConsultSessionByAppointmentApi(appointmentId, accessToken);
        if (!ignore) {
          setSession(response.data);
          setIsWaitingSession(false);
          return true;
        }
      } catch (error) {
        if (error.status === 404) {
          if (!ignore) {
            setIsWaitingSession(true);
            setSession(null);
          }
          return false;
        }
        throw error;
      }
      return false;
    }

    async function initializeSession() {
      if (!appointmentId || !accessToken) {
        return;
      }

      setIsLoadingSession(true);
      setSessionError("");
      try {
        if (mode === "doctor") {
          await setupDoctorSession();
        } else {
          const hasSession = await tryLoadPatientSession();
          if (!hasSession) {
            pollTimer = setInterval(async () => {
              try {
                const foundSession = await tryLoadPatientSession();
                if (foundSession && pollTimer) {
                  clearInterval(pollTimer);
                  pollTimer = null;
                }
              } catch (pollError) {
                if (!ignore) {
                  setSessionError(pollError.message || "Không thể kiểm tra phiên tư vấn");
                }
              }
            }, 5000);
          }
        }
      } catch (error) {
        if (!ignore) {
          setSessionError(error.message || "Không thể khởi tạo phiên tư vấn");
        }
      } finally {
        if (!ignore) {
          setIsLoadingSession(false);
        }
      }
    }

    initializeSession();
    return () => {
      ignore = true;
      if (pollTimer) {
        clearInterval(pollTimer);
      }
    };
  }, [mode, appointmentId, accessToken]);

  // Kết nối socket và join room session khi đã có session ID.
  useEffect(() => {
    if (!session?.id || !accessToken) {
      return undefined;
    }

    const socket = createConsultSocket(accessToken);
    socketRef.current = socket;
    setSocketStatus("connecting");

    socket.on("connect", () => {
      setSocketStatus("connected");
      socket.emit("consult:join", { sessionId: session.id }, (response) => {
        if (!response?.ok) {
          setChatError(response?.error?.message || "Không thể tham gia phòng tư vấn");
        }
      });
    });

    socket.on("disconnect", () => {
      setSocketStatus("disconnected");
    });

    socket.on("consult:error", (payload) => {
      setChatError(payload?.message || "Có lỗi realtime xảy ra");
    });

    socket.on("consult:message:new", (message) => {
      setMessages((current) => mergeMessages(current, message));
    });

    socket.on("consult:signal:offer", async (payload) => {
      try {
        if (payload.sessionId !== session.id) {
          return;
        }

        setMediaError("");
        setVideoStatus("connecting");

        const peer = await ensurePeerConnection();
        await peer.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);

        await emitWithAck("consult:signal:answer", {
          sessionId: payload.sessionId,
          toUserId: payload.fromUserId,
          sdp: answer,
        });
      } catch (error) {
        setMediaError(error.message || "Không thể xử lý offer");
      }
    });

    socket.on("consult:signal:answer", async (payload) => {
      try {
        if (payload.sessionId !== session.id || !peerRef.current) {
          return;
        }
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      } catch (error) {
        setMediaError(error.message || "Không thể xử lý answer");
      }
    });

    socket.on("consult:signal:ice", async (payload) => {
      try {
        if (payload.sessionId !== session.id || !peerRef.current || !payload.candidate) {
          return;
        }
        await peerRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
      } catch (error) {
        setMediaError(error.message || "Không thể xử lý ICE candidate");
      }
    });

    socket.on("consult:call:end", (payload) => {
      if (payload.sessionId !== session.id) {
        return;
      }
      resetCallState("idle");
    });

    socket.on("consult:session:ended", (payload) => {
      if (payload.sessionId !== session.id) {
        return;
      }

      setSession((current) =>
        current
          ? {
              ...current,
              status: "ENDED",
              endedAt: payload.endedAt || new Date().toISOString(),
            }
          : current
      );
      resetCallState("ended");
    });

    return () => {
      socket.emit("consult:leave", { sessionId: session.id });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [session?.id, accessToken]);

  // Dọn tài nguyên media khi rời trang consult.
  useEffect(() => {
    return () => {
      resetCallState("idle");
    };
  }, []);

  // Gửi tin nhắn realtime và append qua event broadcast từ server.
  async function handleSendMessage(event) {
    event.preventDefault();
    if (!session?.id || !isSessionActive || !messageInput.trim()) {
      return;
    }

    setIsSendingMessage(true);
    setChatError("");
    try {
      await emitWithAck("consult:message:send", {
        sessionId: session.id,
        content: messageInput.trim(),
        clientMessageId: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      });
      setMessageInput("");
    } catch (error) {
      setChatError(error.message || "Không thể gửi tin nhắn");
    } finally {
      setIsSendingMessage(false);
    }
  }

  // Doctor kết thúc consult session và đóng room cho cả hai phía.
  async function handleEndSession() {
    if (mode !== "doctor" || !session?.id || !isSessionActive) {
      return;
    }

    setSessionError("");
    try {
      const response = await endConsultSessionApi(session.id, accessToken);
      setSession(response.data);
      resetCallState("ended");
    } catch (error) {
      setSessionError(error.message || "Không thể kết thúc phiên tư vấn");
    }
  }

  // Chủ động bắt đầu video call bằng cách gửi offer tới phía còn lại.
  async function handleStartVideoCall() {
    if (!session?.id || !remoteUserId || !isSessionActive) {
      return;
    }

    setMediaError("");
    setVideoStatus("connecting");
    try {
      const peer = await ensurePeerConnection();
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);

      await emitWithAck("consult:signal:offer", {
        sessionId: session.id,
        toUserId: remoteUserId,
        sdp: offer,
      });
    } catch (error) {
      setMediaError(error.message || "Không thể bắt đầu cuộc gọi video");
      resetCallState("idle");
    }
  }

  // Kết thúc cuộc gọi media và phát sự kiện cho bên còn lại đồng bộ trạng thái.
  async function handleEndVideoCall() {
    if (!session?.id) {
      return;
    }

    try {
      await emitWithAck("consult:call:end", { sessionId: session.id });
    } catch {
      // Bỏ qua lỗi emit vì vẫn cần đóng local resource để tránh kẹt camera/mic.
    } finally {
      resetCallState("idle");
    }
  }

  // Bật/tắt microphone trên local stream hiện tại.
  function handleToggleMicrophone() {
    if (!localStreamRef.current) {
      return;
    }

    const nextEnabled = !isMicEnabled;
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = nextEnabled;
    });
    setIsMicEnabled(nextEnabled);
  }

  // Bật/tắt camera trên local stream hiện tại.
  function handleToggleCamera() {
    if (!localStreamRef.current) {
      return;
    }

    const nextEnabled = !isCameraEnabled;
    localStreamRef.current.getVideoTracks().forEach((track) => {
      track.enabled = nextEnabled;
    });
    setIsCameraEnabled(nextEnabled);
  }

  return (
    <article className="panel space-y-4">
      <header className="space-y-1">
        <h2 className="text-xl font-semibold text-slate-900">Phòng tư vấn trực tuyến</h2>
        <p className="text-sm text-slate-600">
          Appointment: <span className="font-medium">{appointmentId}</span>
        </p>
        <p className="text-sm text-slate-600">
          Socket: <span className="font-medium">{socketStatus}</span>
        </p>
      </header>

      {isLoadingSession ? <p className="meta-text">Đang khởi tạo phiên tư vấn...</p> : null}
      {isWaitingSession ? (
        <p className="text-sm text-amber-700">
          Bác sĩ chưa mở phiên tư vấn. Hệ thống sẽ tự động kiểm tra lại sau mỗi vài giây.
        </p>
      ) : null}
      {sessionError ? <p className="text-sm text-red-600">{sessionError}</p> : null}

      {session ? (
        <section className="rounded-xl border border-slate-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-slate-700">
              Session: <span className="font-medium">{session.id}</span>
            </p>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                isSessionActive
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {session.status}
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Bắt đầu lúc: {formatDateTime(session.startedAt)}
            {session.endedAt ? ` | Kết thúc lúc: ${formatDateTime(session.endedAt)}` : ""}
          </p>
          {mode === "doctor" ? (
            <button
              className="app-link mt-3"
              type="button"
              disabled={!isSessionActive}
              onClick={handleEndSession}
            >
              Kết thúc phiên tư vấn
            </button>
          ) : null}
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-slate-200 p-4">
          <h3 className="text-base font-semibold text-slate-900">Chat tư vấn</h3>
          {chatError ? <p className="text-sm text-red-600">{chatError}</p> : null}

          <div className="max-h-72 space-y-2 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
            {messages.length === 0 ? (
              <p className="text-sm text-slate-500">Chưa có tin nhắn trong phiên này.</p>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="rounded-lg bg-white p-2 text-left shadow-sm">
                  <p className="text-xs font-semibold text-slate-600">
                    {message.senderRole} - {message.senderEmail}
                  </p>
                  <p className="text-sm text-slate-800">{message.content}</p>
                  <p className="text-xs text-slate-500">{formatDateTime(message.createdAt)}</p>
                </div>
              ))
            )}
          </div>

          <form className="flex gap-2" onSubmit={handleSendMessage}>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={messageInput}
              onChange={(event) => setMessageInput(event.target.value)}
              placeholder="Nhập nội dung trao đổi..."
              disabled={!session || !isSessionActive}
            />
            <button
              className="app-link"
              type="submit"
              disabled={!session || !isSessionActive || isSendingMessage}
            >
              Gửi
            </button>
          </form>
        </div>

        <div className="space-y-3 rounded-xl border border-slate-200 p-4">
          <h3 className="text-base font-semibold text-slate-900">Video call 1:1</h3>
          <p className="text-sm text-slate-600">
            Trạng thái cuộc gọi: <span className="font-medium">{videoStatus}</span>
          </p>
          {mediaError ? <p className="text-sm text-red-600">{mediaError}</p> : null}

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Local</p>
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="h-40 w-full rounded-lg bg-slate-900 object-cover"
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Remote</p>
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="h-40 w-full rounded-lg bg-slate-900 object-cover"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              className="app-link"
              type="button"
              disabled={!session || !isSessionActive}
              onClick={handleStartVideoCall}
            >
              Bắt đầu video
            </button>
            <button
              className="app-link"
              type="button"
              disabled={!localStreamRef.current}
              onClick={handleToggleMicrophone}
            >
              {isMicEnabled ? "Tắt mic" : "Bật mic"}
            </button>
            <button
              className="app-link"
              type="button"
              disabled={!localStreamRef.current}
              onClick={handleToggleCamera}
            >
              {isCameraEnabled ? "Tắt camera" : "Bật camera"}
            </button>
            <button
              className="app-link"
              type="button"
              disabled={!session}
              onClick={handleEndVideoCall}
            >
              Kết thúc call
            </button>
          </div>
        </div>
      </section>
    </article>
  );
}
