import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Send, MessageCircle, X, Paperclip, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function TeamChatPanel() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [onlineCount, setOnlineCount] = useState(1);
  
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const popupRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");

  const currentUserFirstName = currentUser?.user_metadata?.full_name?.split(' ')[0] || currentUser?.email?.split('@')[0] || "";

  console.log('messages:', messages);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [messages, isOpen]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isOpen && popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    let isMounted = true;

    // Get current user and team members
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (isMounted) setCurrentUser(user);
    });

    const fetchTeam = async () => {
      const { data } = await supabase.from('profiles').select('full_name, id');
      if (isMounted && data) setTeamMembers(data);
    };
    fetchTeam();
    
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('team_chat')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(50);
      
      if (error) console.error('Fetch error:', error);
      else if (isMounted && data) setMessages(data);
    };

    fetchMessages();

    const presenceChannel = supabase.channel('chat_presence_live', {
      config: { presence: { key: currentUser?.id || 'anonymous' } }
    });
    
    presenceChannel.on('presence', { event: 'sync' }, () => {
      const state = presenceChannel.presenceState();
      if (isMounted) setOnlineCount(Object.keys(state).length);
    }).subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await presenceChannel.track({ online_at: new Date().toISOString() });
      }
    });

    return () => {
      isMounted = false;
      supabase.removeChannel(presenceChannel);
    };
  }, [currentUser?.id]);

  useEffect(() => {
    const channel = supabase
      .channel('team-chat-' + Math.random())
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'team_chat'
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new]);
          if (!isOpen && payload.new.sender_id !== currentUser?.id) {
            setUnreadCount(prev => prev + 1);
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, currentUser?.id]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    
    const messageText = inputText.trim();

    const { error } = await supabase.from('team_chat').insert({
      sender_name: currentUser?.email || 'Unknown',
      sender_id: currentUser?.id,
      message: messageText
    });

    if (error) console.error('Send error:', error);
    else setInputText("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    setIsUploading(true);
    try {
      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const { data, error } = await supabase.storage
        .from('chat-attachments')
        .upload(fileName, file);

      if (error) {
        toast.error("File upload failed: " + error.message);
        console.error(error);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(data.path);

      const sender_name = currentUser?.email || 'Unknown';
      const { error: dbError } = await supabase.from('team_chat').insert({
        sender_name: sender_name,
        sender_id: currentUser?.id,
        message: file.name,
        file_url: urlData.publicUrl,
        file_type: file.type,
        file_size: file.size
      });

      if (dbError) {
        toast.error("Failed to send file message");
        console.error(dbError);
      }
    } catch (err) {
      console.error(err);
      toast.error("Upload error");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const formatTime = (ts: string) => {
    if (!ts) return "";
    return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase();
  };

  const renderMessage = (text: string, isMe: boolean) => {
    if (!text) return { __html: "" };
    const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const mentionColor = isMe ? '#000000' : '#f0a500';
    const mentionHtml = `<span style="color:${mentionColor}; font-weight:800; text-decoration: underline;">@$1</span>`;
    const html = escaped.replace(/@(\w+)/g, mentionHtml);
    return { __html: html };
  };

  const hasUnreadMention = unreadCount > 0 && messages.slice(-unreadCount).some(m => currentUserFirstName && m.message?.includes(`@${currentUserFirstName}`));

  return (
    <>
      {/* FLOATING BUBBLE */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-[#1a1a1a] border-2 border-[#f0a500] flex items-center justify-center shadow-lg hover:scale-105 transition-transform group relative"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999
          }}
        >
          <MessageCircle className="h-6 w-6 text-[#f0a500] group-hover:fill-[#f0a500]/20 transition-colors" />
          {unreadCount > 0 && (
            <div style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: hasUnreadMention ? '#f0a500' : '#ff3b30',
              color: hasUnreadMention ? 'black' : 'white',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              fontSize: '11px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}
        </button>
      )}

      {/* CHAT POPUP */}
      {isOpen && (
        <div 
          ref={popupRef}
          className="fixed bottom-[90px] right-6 w-[360px] h-[500px] bg-[#1a1a1a] rounded-2xl flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-8 duration-200"
          style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
        >
          {/* HEADER */}
          <div className="h-[60px] shrink-0 bg-[#f0a500] flex items-center justify-between px-4">
            <div>
              <h3 className="font-bold text-black leading-tight">Team Chat</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="h-1.5 w-1.5 rounded-full bg-green-700 animate-pulse"></div>
                <span className="text-[11px] font-medium text-black/70">Live • {onlineCount} online</span>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 rounded-full flex items-center justify-center text-black/70 hover:text-black hover:bg-black/10 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* MESSAGES AREA */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#111111]">
            {messages.map((msg, idx) => {
              const isMe = currentUser && (msg.sender_id === currentUser.id || msg.sender_name === currentUser.email);
              const hasMention = currentUserFirstName && msg.message?.includes(`@${currentUserFirstName}`);
              
              return (
                <div key={msg.id || idx} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} ${hasMention && !isMe ? 'border-l-[3px] border-[#f0a500] pl-2' : ''}`}>
                  <div className={`flex max-w-[85%] gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar */}
                    <div className="shrink-0 flex items-end">
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold border border-white/10 ${isMe ? 'bg-[#f0a500] text-black' : 'bg-[#444] text-white'}`}>
                        {getInitials(msg.sender_name || "U")}
                      </div>
                    </div>

                    {/* Bubble */}
                    <div 
                      className={`px-3 py-2 ${
                        isMe 
                          ? 'bg-[#f0a500] text-black rounded-[18px_18px_4px_18px]' 
                          : 'bg-[#2a2a2a] text-white rounded-[18px_18px_18px_4px]'
                      }`}
                    >
                      {!isMe && (
                        <div className="text-[11px] font-bold text-[#f0a500] mb-0.5">
                          {msg.sender_name}
                        </div>
                      )}
                      
                      {msg.file_url ? (
                        <div className="mt-1">
                          {msg.file_type?.startsWith('image/') ? (
                            <a href={msg.file_url} target="_blank" rel="noopener noreferrer">
                              <img src={msg.file_url} alt="attachment" className="max-w-[200px] max-h-[200px] rounded-lg object-cover border border-white/10 hover:opacity-90 transition-opacity" />
                            </a>
                          ) : (
                            <div className={`flex items-center gap-3 p-2 rounded-lg border ${isMe ? 'border-black/20 bg-black/5' : 'border-white/10 bg-white/5'}`}>
                              <FileText className="h-6 w-6 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs font-semibold truncate max-w-[150px]">{msg.message}</p>
                                {msg.file_size && <p className="text-[9px] opacity-70 mt-0.5">{(msg.file_size / 1024).toFixed(1)} KB</p>}
                                <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className={`text-[10px] hover:underline mt-1 block ${isMe ? 'text-black/70' : 'text-[#f0a500]'}`}>
                                  Download
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p 
                          className="text-[13px] leading-snug whitespace-pre-wrap word-break-words break-words"
                          dangerouslySetInnerHTML={renderMessage(msg.message, Boolean(isMe))}
                        />
                      )}
                      
                      <div className={`text-[9px] mt-1 text-right ${isMe ? 'text-black/60' : 'text-white/40'}`}>
                        {formatTime(msg.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* INPUT AREA */}
          <div className="shrink-0 p-3 bg-[#1a1a1a] border-t border-[#2a2a2a] relative">
            {showMentions && (
              <div className="absolute bottom-full left-0 mb-2 w-[calc(100%-24px)] mx-3 max-h-48 overflow-y-auto bg-[#1a1a1a] border border-[#f0a500] rounded-lg shadow-lg z-50">
                {teamMembers
                  .filter(m => !mentionSearch || m.full_name?.toLowerCase().includes(mentionSearch.toLowerCase()))
                  .map(member => (
                    <button
                      key={member.id}
                      onClick={() => {
                        const mentionName = member.full_name?.split(' ')[0] || "User";
                        const newText = inputText.replace(/@([a-zA-Z0-9_]*)$/, `@${mentionName} `);
                        setInputText(newText);
                        setShowMentions(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-[#2a2a2a] text-sm text-white"
                    >
                      {member.full_name}
                    </button>
                  ))
                }
              </div>
            )}
            <div className="flex items-end gap-2 relative">
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute left-2 bottom-1.5 h-8 w-8 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                hidden 
                accept="image/*,.pdf,.doc,.docx,.xlsx" 
                onChange={handleFileUpload} 
              />
              <textarea
                value={inputText}
                disabled={isUploading}
                onChange={(e) => {
                  const val = e.target.value;
                  setInputText(val);
                  const match = val.match(/@([a-zA-Z0-9_]*)$/);
                  if (match) {
                    setMentionSearch(match[1]);
                    setShowMentions(true);
                  } else {
                    setShowMentions(false);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setShowMentions(false);
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (!isUploading) handleSend();
                  }
                }}
                placeholder={isUploading ? "Uploading..." : "Type a message..."}
                className="w-full bg-[#2a2a2a] text-white text-sm rounded-2xl py-2.5 pl-11 pr-12 resize-none focus:outline-none focus:ring-1 focus:ring-[#f0a500] max-h-32 min-h-[44px]"
                rows={1}
              />
              <button
                onClick={handleSend}
                disabled={!inputText.trim() || isUploading}
                className="absolute right-2 bottom-1.5 h-8 w-8 rounded-full bg-[#f0a500] text-black flex items-center justify-center disabled:opacity-50 transition-opacity hover:bg-[#ffb515]"
              >
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : <Send className="h-4 w-4 shrink-0 -ml-0.5" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
