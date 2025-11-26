<button
    onClick={() => {
        handleLogout();
        setIsUserMenuOpen(false);
    }}
    className="w-full text-right px-4 py-3 hover:bg-white/5 text-red-400 text-sm flex items-center gap-2"
>
    <LogOut size={16} /> تسجيل خروج
</button>
                                        </motion.div >
                                    )}
                                </AnimatePresence >
                            </div >
                        ) : (
    <button onClick={() => setIsAuthOpen(true)} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full text-sm font-bold transition-all">
        <LogIn size={16} /> <span>دخول</span>
    </button>
)}

{/* Cart Button */ }
                        <button onClick={() => setIsCartOpen(true)} className="relative hover:text-purple-400 transition-colors hover:scale-110 active:scale-95 transform">
                            <ShoppingBag size={20} />
                            {cart.length > 0 && <span className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">{cart.length}</span>}
                        </button>

                        <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}><Menu size={24} /></button>
                    </div >
                </nav >

    {/* Hero */ }
    < section className = "relative pt-32 pb-20 px-6 min-h-screen flex items-center overflow-hidden" >
        <div className="max-w-4xl mx-auto text-center relative z-10">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                <span className="inline-flex items-center gap-2 py-2 px-6 rounded-full bg-white/5 border border-purple-500/30 mb-8 backdrop-blur-md mx-auto shadow-[0_0_15px_rgba(168,85,247,0.15)] hover:scale-105 transition-transform duration-300 cursor-default">
                    <Sparkles size={18} className="text-purple-400" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-purple-300 font-bold text-lg tracking-wider">راوي</span>
                </span>
                <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6 text-white">اكتشف عوالماً <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">لا حدود لها</span></h1>
                <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">منصة "راوي" تقدم لك تجربة قراءة استثنائية تجمع بين سحر الورق وتقنيات المستقبل.</p>
                <div className="flex flex-wrap gap-4 justify-center"><button onClick={() => document.getElementById('books-section').scrollIntoView({ behavior: 'smooth' })} className="bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-gray-200 transition-all flex items-center gap-2 hover:scale-105 active:scale-95"><Sparkles size={18} /> تصفح الكتب الجديدة</button><button onClick={scrollToAbout} className="border border-white/20 px-8 py-3 rounded-full font-medium hover:bg-white/5 hover:border-white/50 transition-all bg-white/5 backdrop-blur hover:scale-105 active:scale-95 text-white">انضم لمجتمع القراء</button></div>
            </motion.div>
        </div>
                </section >

    {/* Books Grid */ }
    < section id = "books-section" className = "py-20 px-6 relative z-10" >
        <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
                <h2 className="text-3xl font-bold border-r-4 border-purple-500 pr-4 text-white">روائع القصص</h2>
                <div className="flex flex-wrap gap-2 justify-center">
                    {["الكل", "تكنولوجيا", "علوم", "ذكاء اصطناعي", "فنون", "خيال علمي"].map(cat => (
                        <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${activeCategory === cat ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]" : "bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5 hover:text-white"}`}>{cat}</button>
                    ))}
                </div>
            </div>

            {isLoadingBooks ? (
                <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-purple-500 w-10 h-10" /></div>
            ) : filteredBooks.length === 0 ? (
                <div className="text-center py-20 text-gray-500">لا توجد حكايات مطابقة 🔍</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <AnimatePresence mode="popLayout">{filteredBooks.map((book) => (
                        <motion.div key={book.id} layout initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} whileHover={{ y: -10 }} className="group relative bg-white/5 rounded-3xl p-4 border border-white/5 hover:border-purple-500/30 transition-all duration-300">
                            <div className="relative aspect-[2/3] rounded-2xl overflow-hidden mb-4 shadow-2xl shadow-black/50 cursor-pointer" onClick={() => setSelectedBook(book)}>
                                <img src={book.image_url || book.image} alt={book.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                {book.is_new && <div className="absolute top-3 right-3 bg-blue-500/90 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1"><Zap size={12} /> جديد</div>}
                                <button
                                    onClick={(e) => { e.stopPropagation(); toggleWishlist(book); }}
                                    className="absolute top-3 left-3 bg-black/50 p-2 rounded-full text-white hover:bg-white hover:text-red-500 transition-all z-10"
                                >
                                    <Heart size={16} className={wishlist.some(i => i.id === book.id) ? "fill-red-500 text-red-500" : ""} />
                                </button>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs text-gray-400"><span>{book.category}</span><div className="flex items-center gap-1 text-yellow-400"><Star size={12} className="fill-yellow-400" /><span>{book.rating}</span></div></div>
                                <h3 className="text-lg font-bold text-white line-clamp-1 cursor-pointer hover:text-purple-400 transition-colors" onClick={() => setSelectedBook(book)}>{book.title}</h3>
                                <p className="text-sm text-gray-400 line-clamp-1">{book.author}</p>
                                <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-3">
                                    <button onClick={() => window.open(book.pdf_url, '_blank')} className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"><Download size={16} /> تحميل الكتاب</button>
                                </div>
                            </div>
                        </motion.div>
                    ))}</AnimatePresence>
                </div>
            )}
        </div>
                </section >

    {/* About */ }
    < section ref = { aboutSectionRef } className = "py-24 bg-[#0f0f0f] relative border-t border-white/5" >
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
            <div><h2 className="text-4xl font-bold mb-6 text-white">لماذا <span className="text-purple-500">راوي</span>؟</h2><p className="text-gray-400 leading-relaxed mb-6 text-lg">راوي ليس مجرد مكتبة، بل هو جسر يربط بين حكمة الماضي وتقنية المستقبل.</p><ul className="space-y-4">{["كتب منتقاة بعناية", "تلخيص ذكي بالذكاء الاصطناعي", "مجتمع للقراء والمفكرين"].map((item, i) => (<li key={i} className="flex items-center gap-3 text-gray-300"><span className="bg-purple-500/20 text-purple-400 p-1 rounded-full"><Check size={14} /></span> {item}</li>))}</ul></div>
            <div className="bg-white/5 rounded-2xl p-8 border border-white/5 relative overflow-hidden"><div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/20 blur-3xl rounded-full"></div><h3 className="text-2xl font-bold mb-4 text-white">قالوا عن راوي</h3><div className="space-y-4"><div className="bg-black/40 p-4 rounded-xl border border-white/5"><p className="text-gray-400 text-sm">"تجربة راوي ساحرة، تجعل القراءة متعة بصرية وعقلية."</p></div></div></div>
        </div>
                </section >

    {/* Modals */ }
    < AnimatePresence >
    { isCartOpen && <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} className="fixed top-0 left-0 h-full w-full max-w-md bg-[#0f0f0f] border-r border-white/10 z-[70] p-6 flex flex-col shadow-2xl"><div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10"><h2 className="text-2xl font-bold text-white flex gap-2 items-center"><ShoppingBag className="text-purple-500" /> حقيبة الراوي <span className="text-gray-400 text-lg">({cart.length})</span></h2><button onClick={() => setIsCartOpen(false)} className="text-white"><X /></button></div><div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">{cart.length === 0 ? <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4"><ShoppingBag className="w-16 h-16 opacity-20" /><p>الحقيبة فارغة، أضف بعض الحكايات.</p></div> : cart.map((item, idx) => (<motion.div layout key={`${item.id}-${idx}`} className="flex gap-4 bg-white/5 p-3 rounded-2xl border border-white/5 relative"><img src={item.image_url || item.image} className="w-16 h-20 object-cover rounded-xl" alt={item.title} /><div className="flex-1 flex flex-col justify-between"><div><h4 className="font-bold text-sm text-white">{item.title}</h4><p className="text-xs text-gray-400">{item.author}</p></div><div className="flex justify-between items-center"><span className="text-purple-400 font-bold">{item.price} ر.س</span><button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-300 text-xs">حذف</button></div></div></motion.div>))}</div><div className="mt-6 pt-6 border-t border-white/10"><div className="flex justify-between text-xl font-bold text-white mb-4"><span>الإجمالي</span><span>{total} ر.س</span></div><button onClick={() => { setIsCartOpen(false); setShowCheckout(true); }} disabled={cart.length === 0} className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-xl font-bold hover:opacity-90 disabled:opacity-50 shadow-lg shadow-purple-900/30">إتمام الشراء</button></div></motion.div>}
{ selectedBook && <BookDetailsModal book={selectedBook} onClose={() => setSelectedBook(null)} onAddToCart={(b) => { addToCart(b); setSelectedBook(null); }} onAddWishlist={toggleWishlist} /> }
{ showCheckout && <CheckoutModal cart={cart} total={total} onClose={() => setShowCheckout(false)} onClearCart={() => setCart([])} /> }
<AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onLoginSuccess={handleLoginSuccess} addToast={addToast} />

                </AnimatePresence >

    <AILibrarianWidget />

{/* Footer */ }
<footer className="bg-[#050505] border-t border-white/10 pt-16 pb-8 px-6 relative z-10">
    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
        <div className="col-span-1 md:col-span-2">
            <div className="mb-4"><RawiLogo /></div>
            <p className="text-gray-500 max-w-xs mb-6">راوي.. حيث تلتقي الحكايات بالتكنولوجيا.</p>
            <div className="flex gap-4">
                <a href="https://www.facebook.com/ahmed.monged.0" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-all hover:scale-110 hover:bg-[#1877F2]"><SocialIcon type="facebook" /></a>
                <a href="https://www.instagram.com/_eltagriby/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-all hover:scale-110 hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888]"><SocialIcon type="instagram" /></a>
                <a href="https://wa.me/201148220836" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-all hover:scale-110 hover:bg-[#25D366]"><SocialIcon type="whatsapp" /></a>
            </div>
        </div>
        <div>
            <h4 className="font-bold text-white mb-6 flex items-center gap-2"><Code size={18} className="text-purple-500" /> عن المطور</h4>
            <ul className="space-y-4 text-gray-400 text-sm">
                <li className="flex items-center gap-3 hover:text-white transition-colors"><User size={16} className="text-purple-500" /> Ahmed Monged</li>
                <li className="flex items-center gap-3 hover:text-white transition-colors"><Phone size={16} className="text-purple-500" /> +201003061972</li>
                <li className="flex items-center gap-3 hover:text-white transition-colors"><Mail size={16} className="text-purple-500" /> ahmdmnjd806@gmail.com</li>
            </ul>
        </div>
        <div><h4 className="font-bold text-white mb-6">النشرة البريدية</h4><div className="flex gap-2"><input type="email" placeholder="بريدك الإلكتروني" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm w-full focus:border-purple-500 outline-none text-white" /><button className="bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-500"><Send size={18} /></button></div></div>
    </div>
    <div className="text-center text-gray-600 text-xs border-t border-white/5 pt-8">© 2024 راوي - جميع الحقوق محفوظة. تطوير Ahmed Monged.</div>
</footer>
            </div >
        </div >
    );
}
