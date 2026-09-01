import React, { useState, useEffect, useRef } from "react";
import { 
  MessageSquare, 
  X, 
  Send, 
  Paperclip, 
  Image as ImageIcon, 
  Mic, 
  Play, 
  Pause, 
  Loader2, 
  User, 
  FileText,
  Building2,
  Trash2
} from "lucide-react";
import { 
  subscribeToMessages, 
  sendChatMessage, 
  updateUserActiveSession, 
  subscribeToActiveSessions, 
  ChatMessage, 
  ActiveSession 
} from "@/lib/chatService";

export default function GlobalChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Input states
  const [inputText, setInputText] = useState("");
  const [attachedFile, setAttachedFile] = useState<{ url: string; type: 'image' | 'document' | 'audio'; name: string } | null>(null);
  
  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const docInputRef = useRef<HTMLInputElement | null>(null);
  const timerIntervalRef = useRef<any>(null);

  // Oturum ve kullanıcı bilgilerini yükle
  useEffect(() => {
    const userStr = sessionStorage.getItem("activeUser");
    if (userStr) {
      const parsed = JSON.parse(userStr);
      setCurrentUser(parsed);
      
      // İlk aktiflik kaydı
      updateUserActiveSession(
        parsed.username,
        parsed.fullName || parsed.name || parsed.username,
        parsed.role || "staff"
      );
      
      // Her 40 saniyede bir heartbeat gönder
      const interval = setInterval(() => {
        updateUserActiveSession(
          parsed.username,
          parsed.fullName || parsed.name || parsed.username,
          parsed.role || "staff"
        );
      }, 40000);

      return () => clearInterval(interval);
    }
  }, []);

  // Mesajları ve aktif kullanıcıları dinle
  useEffect(() => {
    if (!currentUser) return;

    const unsubMessages = subscribeToMessages((list) => {
      setMessages(list);
      scrollToBottom();
    });

    const unsubSessions = subscribeToActiveSessions((list) => {
      setActiveSessions(list);
    });

    return () => {
      unsubMessages();
      unsubSessions();
    };
  }, [currentUser]);

  // Yeni mesaj geldiğinde aşağı kaydır
  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Aktif kullanıcıları (son 3 dakikada heartbeat gönderenler) filtrele
  const onlineUsers = activeSessions.filter((s) => {
    const diff = Date.now() - new Date(s.lastActive).getTime();
    return diff < 3 * 60 * 1000; // 3 dakika aktiflik
  });

  // Resim sıkıştırma yardımcısı (canvas tabanlı)
  const compressImage = (base64Str: string, callback: (compressed: string) => void) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const MAX_WIDTH = 400;
      const MAX_HEIGHT = 400;
      let width = img.width;
      let height = img.height;
      
      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        // JPEG formatında %60 kalitede çıktı al
        const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
        callback(dataUrl);
      } else {
        callback(base64Str);
      }
    };
  };

  // Görsel Seçme
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Görsel boyutu 2MB'den büyük olamaz!");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawBase64 = event.target?.result as string;
      compressImage(rawBase64, (compressed) => {
        setAttachedFile({
          url: compressed,
          type: "image",
          name: file.name
        });
      });
    };
    reader.readAsDataURL(file);
  };

  // Döküman Seçme
  const handleDocSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 800 * 1024) {
      alert("Döküman boyutu 800KB'den büyük olamaz!");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachedFile({
        url: event.target?.result as string,
        type: "document",
        name: file.name
      });
    };
    reader.readAsDataURL(file);
  };

  // Ses Kayıt Başlatma
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onload = (event) => {
          setAttachedFile({
            url: event.target?.result as string,
            type: "audio",
            name: "Sesli_Mesaj.webm"
          });
        };
        reader.readAsDataURL(audioBlob);

        // Mikrofon kanallarını kapat
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Mikrofon erişim hatası:", err);
      alert("Mikrofona erişilemedi!");
    }
  };

  // Ses Kayıt Durdurma
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
  };

  // Mesaj Gönderme
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !attachedFile) return;

    const payload: ChatMessage = {
      senderId: currentUser.username,
      senderName: currentUser.fullName || currentUser.name || currentUser.username,
      senderRole: currentUser.role || "staff",
      content: inputText,
      timestamp: new Date().toISOString(),
      fileUrl: attachedFile?.url || null,
      fileType: attachedFile?.type || null,
      fileName: attachedFile?.name || null
    };

    try {
      await sendChatMessage(payload);
      setInputText("");
      setAttachedFile(null);
    } catch (err) {
      alert("Mesaj gönderilirken hata oluştu!");
    }
  };

  // Mesaj Saat Formatlayıcı
  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const hours = d.getHours().toString().padStart(2, "0");
      const minutes = d.getMinutes().toString().padStart(2, "0");
      return `${hours}:${minutes}`;
    } catch (e) {
      return "";
    }
  };

  if (!currentUser) return null;

  return (
    <>
      {/* Floating Chat Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 left-6 z-50 w-14 h-14 bg-zinc-950 hover:bg-zinc-900 rounded-2xl flex items-center justify-center shadow-2xl border border-white/10 transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer overflow-hidden group p-1"
        title="Personel Mesajlaşma"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <img 
            src="/chat-icon.png" 
            alt="Personel Mesajlaşma" 
            className="w-full h-full object-cover rounded-xl drop-shadow-md transition-transform duration-300 group-hover:scale-105" 
          />
        )}
        {/* Aktif personel rozeti */}
        {onlineUsers.length > 1 && !isOpen && (
          <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 border-2 border-zinc-950 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full flex items-center justify-center min-w-5 h-5 animate-bounce z-10">
            {onlineUsers.length}
          </span>
        )}
      </button>

      {/* Expanded Chat Slide-over / Popup */}
      {isOpen && (
        <div className="fixed bottom-24 left-6 z-50 w-[380px] h-[550px] bg-[#1b1c1e] text-zinc-100 border border-zinc-800 shadow-[0_20px_50px_rgba(0,0,0,0.8)] rounded-[2.5rem] p-5 flex flex-col justify-between overflow-hidden backdrop-blur-xl animate-fadeIn">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl overflow-hidden shadow-sm shrink-0 border border-white/10">
                <img src="/chat-icon.png" alt="Sohbet" className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-100">Personel İletişim</h3>
                <p className="text-[8px] text-emerald-400 uppercase font-black flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                  {onlineUsers.length} Personel Aktif
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-[10px] text-zinc-500 hover:text-orange-500 font-bold transition-colors cursor-pointer"
            >
              Kapat
            </button>
          </div>

          {/* Active Users Horizontal Scroll */}
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2 border-b border-zinc-800/40 shrink-0">
            {onlineUsers.map((user) => {
              const initials = user.fullName ? user.fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2) : user.username.slice(0, 2);
              return (
                <div key={user.username} className="flex flex-col items-center shrink-0 w-11 space-y-1 relative" title={`${user.fullName} (${user.role})`}>
                  <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-[10px] font-black text-orange-400 relative">
                    {initials.toUpperCase()}
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#1b1c1e] rounded-full" />
                  </div>
                  <span className="text-[7px] text-zinc-500 font-bold uppercase truncate w-full text-center">
                    {user.fullName.split(" ")[0]}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Chat Messages Area */}
          <div className="flex-1 overflow-y-auto pr-1 no-scrollbar my-3 space-y-3.5 min-h-0">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl overflow-hidden opacity-60 shadow-md">
                  <img src="/chat-icon.png" alt="Sohbet" className="w-full h-full object-cover" />
                </div>
                <span className="text-[10px] font-black text-zinc-500 uppercase">Sohbeti Başlatın</span>
                <p className="text-[8px] text-zinc-600 max-w-[200px] leading-normal uppercase font-bold">
                  Bölge veya şube fark etmeksizin tüm çalışanlar ile anlık olarak yazışın.
                </p>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isMe = msg.senderId === currentUser.username;
                return (
                  <div key={msg.id || index} className={`flex flex-col max-w-[85%] ${isMe ? "ml-auto items-end" : "mr-auto items-start"}`}>
                    {/* Sender Label */}
                    {!isMe && (
                      <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider mb-0.5">
                        {msg.senderName} • <span className="text-orange-500/80">{msg.senderRole}</span>
                      </span>
                    )}
                    
                    {/* Bubble Content */}
                    <div className={`p-3 rounded-2xl text-[11px] leading-relaxed shadow-sm border transition-all ${
                      isMe 
                        ? "bg-orange-500/10 border-orange-500/25 text-zinc-100 rounded-tr-none" 
                        : "bg-zinc-800/60 border-zinc-800/40 text-zinc-100 rounded-tl-none"
                    }`}>
                      
                      {/* Attached Image */}
                      {msg.fileUrl && msg.fileType === "image" && (
                        <img 
                          src={msg.fileUrl} 
                          alt="Görsel" 
                          className="max-w-[200px] rounded-xl cursor-pointer hover:opacity-95 mb-1.5 border border-white/5 shadow-md"
                          onClick={() => window.open(msg.fileUrl!, "_blank")} 
                        />
                      )}

                      {/* Attached Document */}
                      {msg.fileUrl && msg.fileType === "document" && (
                        <a 
                          href={msg.fileUrl} 
                          download={msg.fileName || "dosya"}
                          className="flex items-center gap-2.5 p-2 bg-zinc-900/60 hover:bg-zinc-900 border border-white/5 rounded-xl mb-1.5 transition-all text-left"
                        >
                          <FileText className="w-5 h-5 text-orange-500 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[9px] font-extrabold truncate text-zinc-200">{msg.fileName}</p>
                            <p className="text-[7px] text-zinc-500 font-black uppercase">İNDİRMEK İÇİN TIKLAYIN</p>
                          </div>
                        </a>
                      )}

                      {/* Attached Audio */}
                      {msg.fileUrl && msg.fileType === "audio" && (
                        <div className="flex flex-col space-y-1.5 mb-1">
                          <audio src={msg.fileUrl} controls className="max-w-[220px] h-7 scale-90 -mx-3 accent-orange-500" />
                          <span className="text-[6px] text-zinc-500 font-black tracking-widest uppercase">Sesli Mesaj</span>
                        </div>
                      )}

                      {/* Text content */}
                      {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                    </div>

                    {/* Timestamp */}
                    <span className="text-[7px] text-zinc-600 font-bold uppercase mt-1">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form & Input Actions */}
          <div className="shrink-0 space-y-2 border-t border-zinc-800/60 pt-3">
            
            {/* Attached file indicator */}
            {attachedFile && (
              <div className="flex items-center justify-between bg-zinc-900 border border-white/5 p-2 rounded-xl text-[9px] font-extrabold text-orange-400">
                <div className="flex items-center gap-1.5 min-w-0">
                  <FileText className="w-3.5 h-3.5 text-orange-500" />
                  <span className="truncate">{attachedFile.name}</span>
                </div>
                <button 
                  onClick={() => setAttachedFile(null)}
                  className="text-[9px] text-red-400 hover:text-red-500 font-bold ml-2 cursor-pointer"
                >
                  Kaldır
                </button>
              </div>
            )}

            {/* Inputs & Buttons wrapper */}
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              
              {/* Image attachment button */}
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-400 hover:text-orange-500 transition-colors cursor-pointer shrink-0 border border-white/5"
                title="Görsel Ekle"
              >
                <ImageIcon className="w-4 h-4" />
              </button>

              {/* Document attachment button */}
              <button
                type="button"
                onClick={() => docInputRef.current?.click()}
                className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-400 hover:text-orange-500 transition-colors cursor-pointer shrink-0 border border-white/5"
                title="Dosya/Döküman Ekle"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Text Input */}
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={isRecording ? "Kayıt ediliyor..." : "Mesajınızı yazın..."}
                disabled={isRecording}
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-orange-500 placeholder-zinc-500 disabled:opacity-55"
              />

              {/* Microphone / Record button */}
              {isRecording ? (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="p-2.5 rounded-xl bg-red-600 text-white animate-pulse transition-colors cursor-pointer shrink-0"
                  title={`Kaydı Bitir (${recordingSeconds}s)`}
                >
                  <div className="w-4 h-4 flex items-center justify-center text-[7px] font-black font-mono">
                    {recordingSeconds}s
                  </div>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startRecording}
                  className="p-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-400 hover:text-orange-500 transition-colors cursor-pointer shrink-0 border border-white/5"
                  title="Ses Kaydet"
                >
                  <Mic className="w-4 h-4" />
                </button>
              )}

              {/* Send Submit Button */}
              <button
                type="submit"
                className="p-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white transition-all shadow-md shrink-0 cursor-pointer"
                title="Gönder"
              >
                <Send className="w-4 h-4" />
              </button>

            </form>
          </div>

          {/* Hidden inputs */}
          <input 
            type="file" 
            ref={imageInputRef} 
            accept="image/*" 
            className="hidden" 
            onChange={handleImageSelect} 
          />
          <input 
            type="file" 
            ref={docInputRef} 
            accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.csv" 
            className="hidden" 
            onChange={handleDocSelect} 
          />

        </div>
      )}
    </>
  );
}
