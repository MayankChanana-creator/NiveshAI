'use client';
import { useState, useRef, useEffect } from 'react';

const INITIAL_POSTS = [
  {
    id: 1,
    user: 'Alex Chen',
    avatar: 'A',
    avatarColor: 'bg-blue-600',
    badges: [{ text: 'PRO', type: 'outline' }, { text: '✓ EXPERT', type: 'blue' }, { text: 'BULLISH', type: 'green' }],
    time: '3h ago',
    title: 'Trade Idea: $AAPL Breakout',
    content: 'Analyzing $AAPL chart for potential upside. RSI showing oversold conditions with strong support at 380. Target: 410.',
    asset: '$AAPL',
    price: '₹388.50',
    change: '+2.1%',
    isPositive: true,
    likes: 42,
    comments: 48
  },
  {
    id: 2,
    user: 'Sarah Jensen',
    avatar: 'S',
    avatarColor: 'bg-indigo-600',
    badges: [{ text: 'ADVANCED', type: 'outline' }, { text: '✓ ANALYST', type: 'blue' }, { text: 'NEUTRAL', type: 'gray' }],
    time: '5h ago',
    title: 'Tech sector analysis on $MSFT',
    content: 'MSFT technicals look strong. Historical support holding well. Watch for breakout above 920.',
    asset: '$MSFT',
    price: '₹900.00',
    change: '+0.8%',
    isPositive: true,
    likes: 28,
    comments: 15
  }
];

const TRENDING = [
  { symbol: '$AAPL', change: '+2.1%', isPositive: true },
  { symbol: '$TSLA', change: '+1.5%', isPositive: true },
  { symbol: '$NVDA', change: '-1.2%', isPositive: false },
  { symbol: '$RELIANCE', change: '+0.9%', isPositive: true },
];

export default function SandboxCommunity() {
  const [activeTab, setActiveTab] = useState('ALL POSTS');
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [likedPosts, setLikedPosts] = useState({});
  const [showCompose, setShowCompose] = useState(false);

  // Live Chat State
  const [chatMessages, setChatMessages] = useState([
    { id: 1, user: 'ANANYA', text: 'Watching HDFC Bank closely today.', avatar: 'A', time: 'now' },
    { id: 2, user: 'RAJ', text: 'BTC above 47k — crypto pumping.', avatar: 'R', time: 'now' },
    { id: 3, user: 'MEERA', text: 'Good entry on TCS at current levels?', avatar: 'M', time: 'now' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef(null);

  const handleLike = (id) => {
    setLikedPosts(prev => ({ ...prev, [id]: !prev[id] }));
    setPosts(prev => prev.map(p => {
       if (p.id === id) {
          return { ...p, likes: likedPosts[id] ? p.likes - 1 : p.likes + 1 };
       }
       return p;
    }));
  };

  const sendChat = (e) => {
    e?.preventDefault();
    if (!chatInput.trim()) return;
    setChatMessages([...chatMessages, {
       id: Date.now(),
       user: 'YOU',
       text: chatInput,
       avatar: 'U',
       time: 'now'
    }]);
    setChatInput('');
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
      
      {/* ── Top Header ── */}
      <div className="mb-6">
         <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#eab308]/10 text-[#eab308] text-[10px] font-bold tracking-wider mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#eab308]"></span>
            SOCIAL PLATFORM
         </div>
         <h1 className="text-3xl font-bold text-white tracking-tight">Community Feed</h1>
         <p className="text-gray-400 text-sm mt-1">Collaborate, share predictions, and analyze setups with other traders.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
         
         {/* ── LEFT COLUMN (FEED) ── */}
         <div className="flex flex-col min-w-0">
            {/* Tabs & Share Insight button */}
            <div className="flex justify-between items-center mb-4">
               <div className="flex gap-2 bg-[#121a20] rounded-xl p-1">
                 {['ALL POSTS', 'TRENDING', 'FOLLOWING'].map(t => (
                   <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${activeTab === t ? 'bg-[#1e293b] text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                     {t}
                   </button>
                 ))}
               </div>
               <button onClick={() => setShowCompose(!showCompose)} className="px-4 py-1.5 rounded-lg border border-[#10b981]/30 text-[#10b981] text-xs font-bold hover:bg-[#10b981]/10 flex items-center gap-1">
                 + SHARE INSIGHT
               </button>
            </div>

            {/* Compose Area Dropdown */}
            {showCompose && (
               <div className="bg-[#0f1519] border border-[#1f2937] p-4 rounded-2xl mb-4 transition-all">
                  <textarea placeholder="What's your trade idea?" className="w-full bg-transparent text-white placeholder-gray-500 outline-none resize-none text-sm min-h-[60px]"></textarea>
                  <div className="flex justify-end mt-2">
                     <button onClick={() => setShowCompose(false)} className="px-4 py-1.5 bg-[#10b981] text-black text-xs font-bold rounded-lg">POST</button>
                  </div>
               </div>
            )}

            {/* Feed List */}
            <div className="space-y-4">
               {posts.map(post => (
                 <div key={post.id} className="bg-[#0b0f13] border border-[#1a232c] rounded-2xl p-5 hover:border-[#2d3a43] transition-colors">
                    
                    {/* Post Header */}
                    <div className="flex justify-between items-start mb-4">
                       <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${post.avatarColor}`}>{post.avatar}</div>
                          <div>
                             <div className="flex items-center flex-wrap gap-2 mb-0.5">
                               <span className="text-white font-bold text-[15px]">{post.user}</span>
                               {post.badges.map((b, i) => (
                                 <span key={i} className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                   b.type === 'outline' ? 'border border-gray-600 text-gray-400' :
                                   b.type === 'blue' ? 'bg-blue-900/40 text-blue-400' :
                                   b.type === 'green' ? 'bg-[#10b981]/10 text-[#10b981]' :
                                   'bg-gray-800 text-gray-400'
                                 }`}>{b.text}</span>
                               ))}
                             </div>
                             <p className="text-xs text-gray-500">{post.time}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-sm font-bold text-white">{post.asset}</p>
                          <p className="text-xs text-gray-500">{post.price}</p>
                       </div>
                    </div>

                    {/* Post Content */}
                    <div className="mb-4">
                       <h3 className="font-bold text-white mb-2">{post.title}</h3>
                       <p className="text-sm text-gray-400 leading-relaxed">{post.content}</p>
                    </div>

                    {/* Asset Inset Block */}
                    <div className="bg-[#0a0e13] border border-[#1a232c] rounded-xl p-3 flex justify-between items-center mb-4">
                       <div>
                          <p className="text-xs font-mono text-gray-500">{post.asset}</p>
                          <p className="text-lg font-bold text-white">{post.price}</p>
                       </div>
                       <div className={`flex items-center gap-1 font-bold ${post.isPositive ? 'text-[#10b981]' : 'text-red-500'}`}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                          <span>{post.change}</span>
                       </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center gap-6 text-gray-500 text-xs font-bold">
                       <button onClick={() => handleLike(post.id)} className={`flex items-center gap-1.5 hover:text-white transition-colors ${likedPosts[post.id] ? 'text-[#10b981]' : ''}`}>
                         <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
                         {post.likes}
                       </button>
                       <button className="flex items-center gap-1.5 hover:text-white transition-colors">
                         <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                         {post.comments}
                       </button>
                       <button className="flex items-center gap-1.5 hover:text-white transition-colors ml-4">
                         <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                         Share
                       </button>
                    </div>
                 </div>
               ))}
            </div>
         </div>

         {/* ── RIGHT COLUMN (WIDGETS) ── */}
         <div className="flex flex-col gap-4">
            
            {/* Trending Topics */}
            <div className="bg-[#0b0f13] border border-[#1a232c] rounded-2xl p-5">
               <h3 className="text-xs font-bold text-white mb-4 uppercase tracking-widest">Trending Topics</h3>
               <div className="space-y-4">
                 {TRENDING.map((t, i) => (
                   <div key={i} className="flex justify-between items-center text-sm font-bold">
                     <span className="text-white">{t.symbol}</span>
                     <span className={t.isPositive ? 'text-[#10b981]' : 'text-red-500'}>{t.change}</span>
                   </div>
                 ))}
               </div>
            </div>

            {/* Live Discussion */}
            <div className="bg-[#0b0f13] border border-[#1a232c] rounded-2xl flex flex-col h-[400px]">
               <div className="p-4 border-b border-[#1a232c] flex justify-between items-center">
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest">Live Discussion</h3>
                  <div className="flex items-center gap-1.5">
                     <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse"></span>
                     <span className="text-[#10b981] text-[10px] font-bold tracking-wider">LIVE</span>
                  </div>
               </div>
               
               <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                  {chatMessages.map(msg => (
                    <div key={msg.id} className="flex gap-3">
                       <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-gray-400 bg-[#1a232c]`}>{msg.avatar}</div>
                       <div>
                          <p className="text-[10px] font-bold text-gray-500 mb-0.5 uppercase tracking-wider">{msg.user}</p>
                          <div className="bg-[#121a20] px-3 py-2 rounded-xl rounded-tl-sm text-sm text-gray-300 inline-block">{msg.text}</div>
                          <p className="text-[9px] text-gray-600 mt-1 pl-1">{msg.time}</p>
                       </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
               </div>

               <div className="p-3 border-t border-[#1a232c]">
                 <form onSubmit={sendChat} className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Type a message..." 
                      value={chatInput} 
                      onChange={e => setChatInput(e.target.value)} 
                      className="flex-1 bg-[#121a20] border-none text-white text-sm rounded-lg px-3 py-2 outline-none"
                    />
                    <button type="submit" disabled={!chatInput.trim()} className="bg-[#10b981] text-black font-bold uppercase text-xs px-4 py-2 rounded-lg disabled:opacity-50">Send</button>
                 </form>
               </div>
            </div>

         </div>
      </div>
      
    </div>
  );
}
