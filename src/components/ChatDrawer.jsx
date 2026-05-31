import { useState, useEffect, useRef, useContext } from 'react';
import { X, Send, Image, MessageCircle, AlertCircle } from 'lucide-react';
import api from '../api/axios';
import { useToast } from './Toast';
import { AuthContext } from '../context/AuthContext';

const ChatDrawer = ({ booking, onClose }) => {
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const { showToast } = useToast();

  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async (silent = false) => {
    if (!booking) return;
    try {
      if (!silent) setLoading(true);
      const res = await api.get(`/bookings/${booking.id}/messages`);
      setMessages(res.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Fetch message history and start SSE real-time stream
  useEffect(() => {
    if (!booking) return;

    let active = true;
    let eventSource = null;

    const startStreaming = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/bookings/${booking.id}/messages`);
        if (!active) return;
        setMessages(res.data);
        setLoading(false);

        const lastId = res.data.length > 0 ? res.data[res.data.length - 1].id : 0;
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
        const token = sessionStorage.getItem('token');

        const streamUrl = `${baseUrl}/bookings/${booking.id}/messages/stream?token=${token}&last_id=${lastId}`;
        eventSource = new EventSource(streamUrl);

        eventSource.onmessage = (event) => {
          try {
            const newMsg = JSON.parse(event.data);
            setMessages(prev => {
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          } catch (e) {
            console.error('Failed to parse stream message:', e);
          }
        };

        eventSource.onerror = (err) => {
          console.error('EventSource error:', err);
        };

      } catch (err) {
        console.error('Failed to start chat stream:', err);
        setLoading(false);
      }
    };

    startStreaming();

    return () => {
      active = false;
      if (eventSource) {
        eventSource.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking?.id]);

  // Scroll whenever messages length changes
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Ukuran foto maksimal adalah 5MB.', 'warning');
        return;
      }
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    setPhotoPreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() && !photo) return;

    setSending(true);
    try {
      const formData = new FormData();
      formData.append('message', text.trim() || 'Mengirim foto');
      if (photo) {
        formData.append('photo', photo);
      }

      const res = await api.post(`/bookings/${booking.id}/messages`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Add to messages locally
      setMessages(prev => [...prev, res.data]);
      setText('');
      handleRemovePhoto();
    } catch (error) {
      console.error('Error sending message:', error);
      showToast('Gagal mengirim pesan.', 'error');
    } finally {
      setSending(false);
    }
  };

  if (!booking) return null;

  // Resolve storage base URL for photos
  const getPhotoUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const base = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    return `${base}/storage/${path}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      {/* Backdrop Close Zone */}
      <div className="flex-1" onClick={onClose}></div>

      {/* Drawer Body */}
      <div className="w-full max-w-md h-full bg-neo-bg border-l-4 border-neo-dark flex flex-col shadow-[-8px_0_0_0_#1E1E1E] animate-slide-in-right">
        {/* Header */}
        <div className="bg-[#B983FF] border-b-4 border-neo-dark p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-white p-1.5 rounded-full border-2 border-neo-dark">
              <MessageCircle size={20} />
            </div>
            <div>
              <h3 className="font-black text-base md:text-lg">Chat Pemesanan</h3>
              <p className="text-xs font-bold text-neo-dark/80">ID: BKG-{booking.id}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="bg-white border-2 border-neo-dark p-1.5 rounded-full hover:bg-red-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Messages list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white/40">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-neo-dark mb-2"></div>
              <p className="text-xs font-bold text-gray-500">Memuat obrolan...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <AlertCircle size={40} className="text-gray-400 mb-2" />
              <p className="font-bold text-gray-500 text-sm">Belum ada obrolan.</p>
              <p className="text-xs text-gray-400 mt-1">Kirim pesan pertama untuk memulai percakapan tentang anabulmu!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.sender_id === user?.id;
              const senderRole = msg.sender?.role === 'admin' ? 'Admin' : 'Pemilik';
              
              return (
                <div 
                  key={msg.id} 
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[10px] font-bold text-gray-500 mb-1">
                    {msg.sender?.name} ({senderRole})
                  </span>
                  <div 
                    className={`max-w-[85%] border-3 border-neo-dark rounded-xl p-3 shadow-[2px_2px_0_0_#1E1E1E] ${
                      isMine ? 'bg-[#4ADE80]' : 'bg-[#FFD2A5]'
                    }`}
                  >
                    {msg.photo_path && (
                      <div className="mb-2 rounded-lg border-2 border-neo-dark overflow-hidden bg-gray-100">
                        <img 
                          src={getPhotoUrl(msg.photo_path)} 
                          alt="Attachment" 
                          className="max-h-48 object-cover w-full cursor-zoom-in"
                          onClick={() => window.open(getPhotoUrl(msg.photo_path), '_blank')}
                        />
                      </div>
                    )}
                    <p className="text-xs font-black whitespace-pre-wrap">{msg.message}</p>
                    <span className="text-[9px] font-bold opacity-60 block text-right mt-1.5">
                      {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input area */}
        <div className="bg-neo-bg border-t-4 border-neo-dark p-3 space-y-2">
          {/* Photo Preview attachment */}
          {photoPreview && (
            <div className="relative inline-block border-2 border-neo-dark rounded-lg overflow-hidden bg-white shadow-[2px_2px_0_0_#1E1E1E] p-1">
              <img src={photoPreview} alt="Preview" className="h-16 w-16 object-cover rounded-md" />
              <button 
                onClick={handleRemovePhoto}
                type="button" 
                className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 border border-neo-dark"
              >
                <X size={10} />
              </button>
            </div>
          )}

          <form onSubmit={handleSend} className="flex gap-2 items-center">
            {/* Image attachment button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-white border-3 border-neo-dark p-2.5 rounded-lg hover:bg-neo-yellow transition-colors shadow-[2px_2px_0_0_#1E1E1E] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
            >
              <Image size={18} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handlePhotoChange}
              accept="image/*"
              className="hidden" 
            />

            {/* Message input */}
            <input
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Tulis pesan..."
              className="flex-1 bg-white border-3 border-neo-dark rounded-lg p-2.5 font-bold text-xs focus:outline-none focus:ring-4 focus:ring-neo-pink"
            />

            {/* Send button */}
            <button
              type="submit"
              disabled={sending || (!text.trim() && !photo)}
              className="bg-[#4ADE80] border-3 border-neo-dark p-2.5 rounded-lg hover:bg-[#34D399] transition-colors shadow-[2px_2px_0_0_#1E1E1E] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatDrawer;
